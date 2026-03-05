#!/usr/bin/env tsx
import { Command } from "commander";
import inquirer from "inquirer";
import chalk from "chalk";
import path from "path";
import { convertImages, ImageOptions } from "./utils/image-converter.js";
import { convertVideos, VideoOptions } from "./utils/video-converter.js";
import { scanMedia, scanCode } from "./utils/scanner.js";
import { patchJS } from "./utils/patchers/js.js";

const program = new Command();

program
  .name("optimist")
  .description(
    "CLI tool that optimizes images and videos for React/Next.js projects",
  )
  .version("1.0.0")
  .argument("[dir]", "Directory to scan", ".")
  .option("--dry-run", "Run without writing any files")
  .option("--quality <number>", "WebP compression quality", "80")
  .option("--delete-originals", "Delete original files after conversion")
  .option("--skip-patch", "Skip patching code references")
  .action(async (dir, options) => {
    const targetDir = path.resolve(process.cwd(), dir);

    console.log(`\n${chalk.bold(chalk.hex("#106D7C")("Optimist"))}`);
    console.log(
      chalk
        .hex("#F1F1F1")
        .dim(
          "CLI tool to optimize images and videos for React/Next.js projects\n",
        ),
    );
    console.log(
      chalk.hex("#F1F1F1").dim("─────────────────────────────────────────\n"),
    );

    // ── dry run prompt
    let isDryRun = options.dryRun;
    if (isDryRun === undefined) {
      const { dryRunAnswer } = await inquirer.prompt([
        {
          type: "confirm",
          name: "dryRunAnswer",
          message:
            "Would you like to run in Dry Run mode first to preview changes?",
          default: true,
        },
      ]);
      isDryRun = dryRunAnswer;
    }

    if (isDryRun)
      console.log(
        chalk.yellow("\n⚠ Running in DRY RUN mode. No files will be modified."),
      );

    // ── quality prompt
    let quality = parseInt(options.quality, 10) || 80;
    if (!options.quality) {
      const { qualityAnswer } = await inquirer.prompt([
        {
          type: "input",
          name: "qualityAnswer",
          message: "Set WebP compression quality (0-100):",
          default: quality,
          validate: (val) => {
            const num = parseInt(val, 10);
            if (isNaN(num) || num < 0 || num > 100)
              return "Enter a number between 0 and 100";
            return true;
          },
        },
      ]);
      quality = parseInt(qualityAnswer, 10);
    }

    // ── scan
    console.log(chalk.dim("\nScanning project...\n"));
    const { images, videos } = await scanMedia(targetDir);
    const codeFiles = await scanCode(targetDir);

    console.log(
      chalk.blue(
        `Found ${images.length} image(s), ${videos.length} video(s), ${codeFiles.length} code file(s)\n`,
      ),
    );

    if (images.length === 0 && videos.length === 0) {
      console.log(chalk.gray("No media files found. Exiting."));
      return;
    }

    // ── delete originals prompt
    let deleteOriginals = options.deleteOriginals ?? false;
    if (!isDryRun && !options.deleteOriginals) {
      const { deleteAnswer } = await inquirer.prompt([
        {
          type: "confirm",
          name: "deleteAnswer",
          message: "Delete original files after conversion?",
          default: false,
        },
      ]);
      deleteOriginals = deleteAnswer;
    }

    // ── image conversion
    let imageMapping: Record<string, string> = {};
    if (images.length > 0) {
      const imgOpts: ImageOptions = {
        files: images,
        quality,
        dryRun: isDryRun,
        deleteOriginals,
      };
      imageMapping = await convertImages(imgOpts);
    }

    // ── video conversion
    let videoMapping: Record<string, string> = {};
    if (videos.length > 0) {
      let cpuUsed = 2;

      if (!isDryRun) {
        const { cpuAnswer } = await inquirer.prompt([
          {
            type: "input",
            name: "cpuAnswer",
            message: "Set CPU used for video conversion (0=slow/best, 5=fast):",
            default: cpuUsed,
            validate: (val) => {
              const num = parseInt(val, 10);
              if (isNaN(num) || num < 0 || num > 5)
                return "Enter a number between 0 and 5";
              return true;
            },
          },
        ]);
        cpuUsed = parseInt(cpuAnswer, 10);
      }

      const vidOpts: VideoOptions = {
        files: videos,
        dryRun: isDryRun,
        deleteOriginals,
        cpuUsed,
      };
      videoMapping = await convertVideos(vidOpts);
    }

    // ── patch code references
    if (!options.skipPatch && codeFiles.length > 0) {
      const mapping = { ...imageMapping, ...videoMapping };

      if (Object.keys(mapping).length > 0) {
        console.log(chalk.dim("\nPatching code references...\n"));
        const { updatedFilesCount, parseFailureFiles } = await patchJS(
          codeFiles,
          mapping,
          targetDir,
          isDryRun,
        );
        console.log(
          chalk.green(`✔ Updated references in ${updatedFilesCount} file(s)`),
        );
        if (parseFailureFiles.length > 0) {
          console.log(
            chalk.yellow(
              `⚠ Could not parse ${parseFailureFiles.length} file(s):`,
            ),
          );
          parseFailureFiles.forEach((f) => console.log(chalk.dim(`  ${f}`)));
        }
      }
    }

    console.log(chalk.green("\n✔ Finished successfully!\n"));
  });

program.parse();
