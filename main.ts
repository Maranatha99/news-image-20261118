// THE WORLD — Wednesday 18 November 2026 front page (v3: dense red-band edition).
// The entrypoint for the make.fun news-image-20261118 bounty.
// It takes the finished front page (entry.png, rendered from frontpage.html
// with six photorealistic photos) and writes it to the output directory.
//
// Usage:   MAKEFUN_OUTPUT_DIR=out node main.ts
// Output:  out/entry.png — a deterministic 1024x1024 PNG, under 1 MiB.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MAX_BYTES = 1024 * 1024;
const WANT_WIDTH = 1024;
const WANT_HEIGHT = 1024;

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, "entry.png");
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "out";
const dest = join(outDir, "entry.png");

function abort(msg: string): never {
  console.error("main.ts: " + msg);
  process.exit(1);
}

function inspectPng(data: Buffer, name: string): { width: number; height: number; depth: number; color: number } {
  if (data.length < 33 || !data.subarray(0, 8).equals(PNG_MAGIC)) {
    abort(name + " is not a PNG file (bad signature)");
  }
  const width = data.readUInt32BE(16);
  const height = data.readUInt32BE(20);
  if (width !== WANT_WIDTH || height !== WANT_HEIGHT) {
    abort(`${name} is ${width}x${height}, expected ${WANT_WIDTH}x${WANT_HEIGHT}`);
  }
  if (data.length > MAX_BYTES) {
    abort(`${name} is ${data.length} bytes, over the ${MAX_BYTES} byte limit`);
  }
  // IHDR continues: bit depth at offset 24, color type at offset 25.
  // The front page is 8-bit RGB (depth 8, color type 2); report them so a
  // bad render is obvious from the log line alone.
  const depth = data.readUInt8(24);
  const color = data.readUInt8(25);
  if (depth !== 8 || color !== 2) {
    abort(`${name} is ${depth}-bit color type ${color}, expected 8-bit RGB`);
  }
  return { width, height, depth, color };
}

function main(): void {
  if (!existsSync(source)) {
    abort("entry.png is missing next to main.ts: " + source);
  }
  const png = readFileSync(source);
  const { width, height, depth, color } = inspectPng(png, "entry.png");

  mkdirSync(outDir, { recursive: true });
  writeFileSync(dest, png);

  const back = readFileSync(dest);
  if (!back.equals(png)) {
    abort("the written file does not match entry.png byte for byte");
  }
  inspectPng(back, "output entry.png");

  const sha = createHash("sha256").update(back).digest("hex");
  console.log(`Wrote ${dest} (${back.length} bytes, ${width}x${height}, ${depth}-bit color ${color}, sha256 ${sha})`);
}

main();
