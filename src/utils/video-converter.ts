import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import chalk from "chalk";

export interface VideoOptions {
  dir: string;
  dryRun: boolean;
  deleteOriginals: boolean;
  cpuUsed: number;
}

export async function convertVideos(options: VideoOptions) {
  const { dir, dryRun, deleteOriginals, cpuUsed } = options;
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir);
  const videos = files.filter((f) =>
    [".mp4", ".mov"].includes(path.extname(f).toLowerCase()),
  );

  if (videos.length === 0) {
    console.log(chalk.gray("\nNo videos found to process."));
    return;
  }

  console.log(chalk.blue(`\nProcessing ${videos.length} video(s) in ${dir}`));

  for (const file of videos) {
    const inputPath = path.join(dir, file);
    const outputName = path.basename(file, path.extname(file)) + ".webm";
    const outputPath = path.join(dir, outputName);

    if (dryRun) {
      console.log(
        chalk.yellow(`[DRY RUN] Would convert: ${file} → ${outputName}`),
      );
      continue;
    }

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
            chalk.red(`✖ Error converting ${file}: ${err.message}`),
          );
          reject(err);
        })
        .on("end", () => {
          console.log(chalk.green(`Converted: ${file} → ${outputName}`));
          if (deleteOriginals) {
            fs.unlinkSync(inputPath);
            console.log(chalk.red(`Deleted original: ${file}`));
          }
          resolve();
        })
        .save(outputPath);
    });
  }
}
