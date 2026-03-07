import fs from "fs";
import path from "path";
import sharp from "sharp";
import chalk from "chalk";

export interface ImageOptions {
  /** Array of absolute paths to image files to be converted */
  files: string[];
  /** Quality for WebP conversion (0-100) */
  quality: number;
  /** If true, don't write any files; just show what would happen */
  dryRun: boolean;
  /** If true, delete the original files after conversion */
  deleteOriginals: boolean;
}
/**
 * Converts an array of image files (PNG/JPG/JPEG) to WebP format.
 *
 * This function iterates over each image file provided in the `files` array,
 * converts it to WebP using the specified `quality`, and optionally deletes
 * the original file if `deleteOriginals` is true.
 *
 * @param {ImageOptions} options - Options for image conversion
 * @param {string[]} options.files - Absolute paths of images to convert
 * @param {number} options.quality - WebP quality (0-100)
 * @param {boolean} options.dryRun - If true, only logs actions without writing files
 * @param {boolean} options.deleteOriginals - If true, deletes original images after conversion
 * @returns {Promise<Record<string, string>>} - A mapping of original file paths to converted WebP paths
 *
 * @example
 * ```ts
 * const mapping = await convertImages({
 *   files: ['/project/src/assets/hero.png', '/project/src/assets/bg.jpg'],
 *   quality: 80,
 *   dryRun: false,
 *   deleteOriginals: false
 * });
 * console.log(mapping);
 * // {
 * //   '/project/src/assets/hero.png': '/project/src/assets/hero.webp',
 * //   '/project/src/assets/bg.jpg': '/project/src/assets/bg.webp'
 * // }
 * ```
 */

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
