# Optimist CLI

> One command. Every asset. Smaller.

Optimist is a zero-config CLI tool that converts your project's media files into web-native formats — automatically. Drop it into any project, run one command, and ship leaner.

---

## Install

```bash
npm install -g optimist
```

---

## Usage

```bash
npx optimist .
```

Optimist scans the current directory, finds all convertible media files, and prompts you through the process.

```
$ npx optimist .
$ Would you like to run in Dry Run mode first to preview changes? No
$ Would you like to Delete Original Files? yes

✦ Found 6 files · 3 video · 3 image

hero-reel.mp4      ──▶  hero-reel.webm
product-demo.mov   ──▶  product-demo.webm
bg-loop.mp4        ──▶  bg-loop.webm
og-banner.png      ──▶  og-banner.webp
avatar.jpg         ──▶  avatar.webp
thumb.gif          ──▶  thumb.webp

Files Conversion completed
```

---

## What it converts

| Input | Output | Avg saving |
|-------|--------|------------|
| `.mp4` | `.webm` (VP9) | ~71% |
| `.mov` | `.webm` (VP9) | ~68% |
| `.jpg` | `.webp` | ~79% |
| `.png` | `.webp` | ~82% |
| `.gif` | `.webp` | ~91% |

---

## Options

**Dry Run** — preview all changes before committing. No files are written.

```bash
npx optimist . --dry-run
```

**Delete originals** — remove source files after conversion.

```bash
npx optimist . --delete
```

---

## Why

Modern browsers support WebM and WebP natively. Most projects still ship mp4, mov, jpg, and png — often without realizing the cost. Optimist closes that gap in seconds with no config files, no plugins, and no build system changes required.

- **Video**: VP9 two-pass encode. Up to 75% smaller with no perceptible quality loss.
- **Images**: Quality 85 lossless WebP. Browser-native, universally supported.
- **Zero config**: No setup files. Reads your assets and acts.

---

## Requirements

- Node.js 18+
- `ffmpeg` installed and available in `PATH`

```bash
# macOS
brew install ffmpeg

# Ubuntu / Debian
sudo apt install ffmpeg
```

---

## License

MIT © 2026 [Optimist CLI](https://github.com/aayush-mhrzn7/optimist)
