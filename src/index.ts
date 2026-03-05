#!/usr/bin/env tsx
import { Command } from "commander";
import inquirer from "inquirer";
import chalk from "chalk";
import path from "path";
import fs from "fs";
import { ImageOptions, convertImages } from "./utils/image-converter.js";
import { VideoOptions, convertVideos } from "./utils/video-converter.js";

const program = new Command();

program
  .name("optimist")
  .description(
    "CLI tool that optimizes images and videos for React/Next.js projects",
  )
  .version("1.0.0")
  .argument("[dir]", "Directory to scan (default: ./uploads)", "./uploads")
  .option("--dry-run", "Run without writing any files")
  .option("--quality <number>", "WebP compression quality", `80`)
  .option("--delete-originals", "Delete original files after conversion")
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

    let isDryRun = options.dryRun;
    if (isDryRun === undefined) {
      const { dryRunAnswer } = await inquirer.prompt([
        {
          type: "confirm",
          name: "dryRunAnswer",
          message:
            "Would you like to run in Dry Run mode first to preview changes? ",
          default: true,
        },
      ]);
      isDryRun = dryRunAnswer;
    }

    if (isDryRun)
      console.log(
        chalk.yellow("\n⚠ Running in DRY RUN mode. No files will be modified."),
      );

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

    const files = fs.existsSync(targetDir) ? fs.readdirSync(targetDir) : [];

    const images = files.filter((f) =>
      [".jpg", ".jpeg", ".png"].includes(path.extname(f).toLowerCase()),
    );

    const videos = files.filter((f) =>
      [".mp4", ".mov"].includes(path.extname(f).toLowerCase()),
    );

    // Dry-run summary
    if (isDryRun) {
      console.log(
        chalk.blue(
          `Found ${images.length} image(s) and ${videos.length} video(s) to process.`,
        ),
      );
    }

    // Delete originals prompt (only if not dry run)
    let deleteOriginals = options.deleteOriginals;
    if (!isDryRun && deleteOriginals === undefined) {
      const { deleteAnswer } = await inquirer.prompt([
        {
          type: "confirm",
          name: "deleteAnswer",
          message:
            "Should we automatically delete original images after conversion?",
          default: false,
        },
      ]);
      deleteOriginals = deleteAnswer;
    }

    // ---------- RUN IMAGE CONVERSION ----------
    if (images.length > 0) {
      const imgOpts: ImageOptions = {
        dir: targetDir,
        quality,
        dryRun: isDryRun,
        deleteOriginals,
      };
      await convertImages(imgOpts);
    }

    // ---------- RUN VIDEO CONVERSION ----------
    if (videos.length > 0) {
      let videoDelete = false;
      let cpuUsed = 2;

      if (!isDryRun) {
        const answers = await inquirer.prompt([
          {
            type: "confirm",
            name: "videoDelete",
            message: "Delete original videos after conversion?",
            default: false,
          },
          {
            type: "input",
            name: "cpuUsed",
            message: "Set CPU used for conversion (0=slow/best, 5=fast):",
            default: cpuUsed,
            validate: (val) => {
              const num = parseInt(val, 10);
              if (isNaN(num) || num < 0 || num > 5)
                return "Enter a number between 0 and 5";
              return true;
            },
          },
        ]);

        videoDelete = answers.videoDelete;
        cpuUsed = parseInt(answers.cpuUsed, 10);
      } else {
        // In dry-run, just show summary
        console.log(chalk.blue(`Found ${videos.length} video(s) to process.`));
      }

      const vidOpts: VideoOptions = {
        dir: targetDir,
        dryRun: isDryRun,
        deleteOriginals: videoDelete,
        cpuUsed,
      };
      if (!isDryRun) await convertVideos(vidOpts);
    }

    console.log(chalk.green("\n✔ Finished successfully!"));
  });

program.parse();
