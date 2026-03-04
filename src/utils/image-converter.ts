import fs from "fs";
import path from "path";
import sharp from "sharp";
import chalk from "chalk";

export interface ImageOptions {
  dir: string;
  quality: number;
  dryRun: boolean;
  deleteOriginals: boolean;
}

export async function convertImages(options: ImageOptions) {
  const { dir, quality, dryRun, deleteOriginals } = options;
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir);
  const images = files.filter((f) =>
    [".jpg", ".jpeg", ".png"].includes(path.extname(f).toLowerCase()),
  );
  if (images.length === 0) {
    console.log(chalk.gray("No images found to process."));
    return;
  }
  if (dryRun) {
    console.log(
      chalk.yellow(
        `[DRY RUN] Would convert ${images.length} image(s) to WebP format in ${dir}.`,
      ),
    );
    return;
  }
  console.log(chalk.blue(`Found ${images.length} image(s). in ${dir}`));
  for (const file of images) {
    const inputPath = path.join(dir, file);
    const outputPath = path.join(dir, `${path.parse(file).name}.webp`);

    try {
      await sharp(inputPath).webp({ quality }).toFile(outputPath);
      console.log(
        chalk.green(`Converted: ${file} → ${path.basename(outputPath)}`),
      );

      if (deleteOriginals) {
        fs.unlinkSync(inputPath);
        console.log(chalk.red(`Deleted original: ${file}`));
      }
    } catch (err) {
      console.error(chalk.red(`✖ Failed to convert ${file}: ${err}`));
    }
  }

  console.log(chalk.green(`\n✔ Converted ${images.length} image(s).\n`));
}
