// THE WORLD — Wednesday 18 November 2026 front page (v4: 55-story edition).
//
// Entrypoint for the make.fun news-image-20261118 bounty.
// The front page itself (entry.png) is the rendered frontpage.html: a dense
// red-band newspaper with 55 stories of the day and seven photorealistic
// photos, rendered once to a 1024x1024 PNG. This program's job is to take
// that finished image and write it, byte for byte, to the output directory
// the harness asks for. It does no drawing and no network access.
//
// Usage:
//   MAKEFUN_OUTPUT_DIR=out node main.ts
// Without MAKEFUN_OUTPUT_DIR it writes to /output/entry.png.
//
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MAX_BYTES = 1024 * 1024;
const WANT_W = 1024;
const WANT_H = 1024;

function sha256(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

function main(): void {
  const here = dirname(fileURLToPath(import.meta.url));
  const source = join(here, "entry.png");
  if (!existsSync(source)) {
    throw new Error(`entry.png not found next to main.ts (${source})`);
  }
  const image = readFileSync(source);

  // 1. It must be a real PNG, and its first chunk must be IHDR.
  if (image.length < 33 || !image.subarray(0, 8).equals(PNG_MAGIC)) {
    throw new Error("entry.png is not a PNG file");
  }
  if (image.subarray(12, 16).toString("ascii") !== "IHDR") {
    throw new Error("entry.png has no IHDR chunk where one is expected");
  }
  // 2. It must be 1024x1024, 8-bit RGB (color type 2), from the IHDR chunk.
  const width = image.readUInt32BE(16);
  const height = image.readUInt32BE(20);
  const bitDepth = image[24];
  const colorType = image[25];
  if (width !== WANT_W || height !== WANT_H) {
    throw new Error(`entry.png is ${width}x${height}, expected 1024x1024`);
  }
  if (bitDepth !== 8 || colorType !== 2) {
    throw new Error(
      `entry.png is bit depth ${bitDepth} / color type ${colorType}, expected 8 / 2 (RGB)`
    );
  }
  // 3. It must fit the competition's 1 MiB cap.
  if (image.length > MAX_BYTES) {
    throw new Error(`entry.png is ${image.length} bytes, over the 1 MiB cap`);
  }

  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  const target = join(outDir, "entry.png");
  writeFileSync(target, image);

  // Read it back and confirm the copy is byte-identical to the source.
  const back = readFileSync(target);
  if (!back.equals(image)) {
    throw new Error("written entry.png differs from the repo entry.png");
  }
  console.log(
    `Wrote ${target} (${image.length} bytes, 1024x1024, 8-bit color 2, sha256 ${sha256(image)}) from ${source}`
  );
}

main();
