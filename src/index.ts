#!/usr/bin/env tsx
import { program } from "commander";

program
  .option("--dry-run", "preview without writing")
  .option("--quality <number>", "image quality", "80")
  .option("--skip-images", "skips processing and converting images")
  .option("--skip-videos", "skips processing and converting videos")
  .parse();

const opts = program.opts();
console.log(opts.dryRun);
console.log(opts.quality);
console.log(opts.skipImages);
console.log(opts.skipVideos);
