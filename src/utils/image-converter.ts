import fs from "fs";
import path from "path";
import sharp from "sharp";
import chalk from "chalk";

export interface ImageOptions {
  files: string[]; // pre-scanned absolute paths from scanner
  quality: number;
  dryRun: boolean;
  deleteOriginals: boolean;
}

export async function convertImages(
  options: ImageOptions,
): Promise<Record<string, string>> {
  const { files, quality, dryRun, deleteOriginals } = options;
  const mapping: Record<string, string> = {};

  if (files.length === 0) {
    console.log(chalk.gray("No images found to process."));
    return mapping;
  }

  if (dryRun) {
    console.log(
      chalk.yellow(`[DRY RUN] Would convert ${files.length} image(s) to WebP.`),
    );
    return mapping;
  }

  console.log(chalk.blue(`Found ${files.length} image(s).`));

  for (const inputPath of files) {
    const outputPath = inputPath.replace(/\.(png|jpe?g)$/i, ".webp");
    try {
      await sharp(inputPath).webp({ quality }).toFile(outputPath);
      mapping[inputPath] = outputPath;
      console.log(
        chalk.green(
          `Converted: ${path.basename(inputPath)} → ${path.basename(outputPath)}`,
        ),
      );
      if (deleteOriginals) {
        fs.unlinkSync(inputPath);
        console.log(chalk.red(`Deleted original: ${path.basename(inputPath)}`));
      }
    } catch (err) {
      console.error(chalk.red(`✖ Failed: ${path.basename(inputPath)}: ${err}`));
    }
  }

  return mapping;
}
