import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import chalk from "chalk";
import pLimit from "p-limit";

/**
 * Options for converting videos to WebM format.
 */
export interface VideoOptions {
  /** Array of absolute paths to video files to convert */
  files: string[];
  /** If true, do not write any files; just log what would happen */
  dryRun: boolean;
  /** If true, delete original videos after conversion */
  deleteOriginals: boolean;
  /** CPU speed for FFmpeg encoding (0=slow/best, 5=fast) */
  cpuUsed: number;
}

/**
 * Converts an array of video files (MP4/MOV) to WebM format using FFmpeg.
 *
 * This function supports concurrent processing (2 videos at a time by default)
 * and allows adjusting encoding speed and quality using the `cpuUsed` parameter.
 *
 * @param {VideoOptions} options - Options for video conversion
 * @param {string[]} options.files - Absolute paths of videos to convert
 * @param {boolean} options.dryRun - If true, only logs actions without writing files
 * @param {boolean} options.deleteOriginals - If true, deletes original videos after conversion
 * @param {number} options.cpuUsed - FFmpeg CPU speed for VP9 encoding
 * @returns {Promise<Record<string, string>>} - A mapping of original file paths to converted WebM paths
 *
 * @example
 * ```ts
 * const mapping = await convertVideos({
 *   files: ['/project/src/videos/intro.mp4', '/project/src/videos/outro.mov'],
 *   dryRun: false,
 *   deleteOriginals: false,
 *   cpuUsed: 2
 * });
 * console.log(mapping);
 * // {
 * //   '/project/src/videos/intro.mp4': '/project/src/videos/intro.webm',
 * //   '/project/src/videos/outro.mov': '/project/src/videos/outro.webm'
 * // }
 * ```
 */
export async function convertVideos(
  options: VideoOptions,
): Promise<Record<string, string>> {
  const { files, dryRun, deleteOriginals, cpuUsed } = options;

  const mapping: Record<string, string> = {};

  if (files.length === 0) {
    console.log(chalk.gray("\nNo videos found to process."));
    return mapping;
  }

  if (dryRun) {
    console.log(
      chalk.yellow(`[DRY RUN] Would convert ${files.length} video(s) to WebM.`),
    );
    return mapping;
  }

  console.log(chalk.blue(`\nProcessing ${files.length} video(s)`));

  const limit = pLimit(2);

  const convertSingle = async (inputPath: string) => {
    const outputPath = inputPath.replace(/\.(mp4|mov)$/i, ".webm");

    return new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          "-c:v libvpx-vp9",
          "-b:v 2M",
          `-cpu-used ${cpuUsed}`,
          "-deadline realtime",
          "-row-mt 1",
          "-threads 4",
          "-c:a libopus",
        ])
        .on("error", (err) => {
          console.error(
            chalk.red(
              `✖ Error converting ${path.basename(inputPath)}: ${err.message}`,
            ),
          );
          reject(err);
        })
        .on("end", () => {
          mapping[inputPath] = outputPath;

          console.log(
            chalk.green(
              `Converted: ${path.basename(inputPath)} → ${path.basename(outputPath)}`,
            ),
          );

          if (deleteOriginals) {
            fs.unlinkSync(inputPath);
            console.log(
              chalk.red(`Deleted original: ${path.basename(inputPath)}`),
            );
          }

          resolve();
        })
        .save(outputPath);
    });
  };

  const tasks = files.map((file) => limit(() => convertSingle(file)));

  await Promise.all(tasks);

  return mapping;
}
