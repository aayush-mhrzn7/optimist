import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import chalk from "chalk";

export interface VideoOptions {
  files: string[];
  dryRun: boolean;
  deleteOriginals: boolean;
  cpuUsed: number;
}

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

  for (const inputPath of files) {
    const outputPath = inputPath.replace(/\.(mp4|mov)$/i, ".webm");

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          "-c:v libvpx-vp9",
          "-b:v 2M",
          `-cpu-used ${cpuUsed}`,
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
  }

  return mapping;
}
