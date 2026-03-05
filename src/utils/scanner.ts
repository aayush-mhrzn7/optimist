import { glob } from "tinyglobby";

const DEFAULT_IGNORE = [
  "node_modules/**",
  "next/**",
  "dist/**",
  ".git/**",
  "build/**",
];

async function scanMedia(dir: string = ".") {
  const ignore = [...DEFAULT_IGNORE];
  const [images, videos] = await Promise.all([
    glob(["**/*.{png,jpg,jpeg,JPG,JPEG,PNG}"], {
      cwd: dir,
      absolute: true,
      ignore,
    }),
    glob(["**/*.{mp4,mov,MP4,MOV}"], {
      cwd: dir,
      absolute: true,
      ignore,
    }),
  ]);
  return {
    images: images.filter((f) => !/\.webp$/i.test(f)),
    videos: videos.filter((f) => !/\.webm$/i.test(f)),
  };
}

async function scanCode(dir: string = ".") {
  const ignore = [...DEFAULT_IGNORE];
  return glob(["**/*.{jsx,tsx,ts,js}"], {
    cwd: dir,
    absolute: true,
    ignore,
  });
}

export { scanMedia, scanCode };
