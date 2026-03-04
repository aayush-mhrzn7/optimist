#!/usr/bin/env tsx
import { Command } from "commander";
import inquirer from "inquirer";
import chalk from "chalk";
import path from "path";
import fs from "fs";
import sharp from "sharp";

const program = new Command();

program
  .name("optimist")
  .description("CLI tool that optimizes images for React/Next.js projects")
  .version("1.0.0")
  .argument("[dir]", "Directory to scan (default: ./uploads)", "./uploads")
  .option("--dry-run", "Run without writing any files")
  .option("--quality <number>", "WebP compression quality", `80`)
  .option("--delete-originals", "Delete original images after conversion")
  .action(async (dir, options) => {
    const targetDir = path.resolve(process.cwd(), dir);

    console.log(`\n${chalk.bold(chalk.hex("#106D7C")("Optimist"))}`);
    console.log(
      chalk
        .hex("#F1F1F1")
        .dim("CLI tool to optimize images for React/Next.js projects\n"),
    );
    console.log(
      chalk.hex("#F1F1F1").dim("─────────────────────────────────────────\n"),
    );

    // DRY RUN
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

    if (isDryRun) {
      console.log(
        chalk.yellow("⚠ Running in DRY RUN mode. No files will be modified.\n"),
      );
    }

    // Delete originals (only if not dry run)
    let deleteOriginals = options.deleteOriginals;
    if (!isDryRun && deleteOriginals === undefined) {
      const { deleteAnswer } = await inquirer.prompt([
        {
          type: "confirm",
          name: "deleteAnswer",
          message:
            "Should we automatically delete original PNG/JPG files after conversion?",
          default: false,
        },
      ]);
      deleteOriginals = deleteAnswer;
    }

    // Compression quality
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

    console.log(chalk.blue(`\nProcessing directory: ${targetDir}`));
    console.log(`Dry Run: ${isDryRun}`);
    if (!isDryRun) console.log(`Delete Originals: ${deleteOriginals}`);
    console.log(`Quality: ${quality}\n`);

    try {
      const files = fs.readdirSync(targetDir);
      const images = files.filter((f) =>
        [".jpg", ".jpeg", ".png"].includes(path.extname(f).toLowerCase()),
      );

      if (images.length === 0) {
        console.log(chalk.gray("No images found to process."));
        return;
      }

      console.log(`Found ${images.length} images.`);

      for (const file of images) {
        const inputPath = path.join(targetDir, file);
        const outputPath = path.join(
          targetDir,
          `${path.parse(file).name}.webp`,
        );

        if (isDryRun) {
          console.log(
            chalk.yellow(
              `[DRY RUN] Would convert: ${file} → ${path.basename(outputPath)}`,
            ),
          );
        } else {
          await sharp(inputPath).webp({ quality }).toFile(outputPath);

          console.log(
            chalk.green(`Converted: ${file} → ${path.basename(outputPath)}`),
          );

          if (deleteOriginals) {
            fs.unlinkSync(inputPath);
            console.log(chalk.red(`Deleted original: ${file}`));
          }
        }
      }

      console.log(chalk.green("\n✔ Finished successfully!"));
    } catch (err) {
      console.error(chalk.red("\n✖ An error occurred during execution."));
      console.error(err);
      process.exit(1);
    }
  });

program.parse();
