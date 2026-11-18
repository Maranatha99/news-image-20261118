// THE WORLD — Wednesday 18 November 2026 front page.
// Writes the rendered newspaper front page (entry.png, built from
// frontpage.html + four photorealistic photos) to the output directory.
//
// Usage:   MAKEFUN_OUTPUT_DIR=out node main.ts
// Output:  <out>/entry.png  (1024x1024, deterministic)

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const repoDir = dirname(fileURLToPath(import.meta.url));
const sourcePath = join(repoDir, "entry.png");

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "out";
const outPath = join(outDir, "entry.png");

function fail(message: string): never {
  console.error(`error: ${message}`);
  process.exit(1);
}

function checkPng(buf: Buffer, label: string): void {
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buf.length < 33 || !buf.subarray(0, 8).equals(signature)) {
    fail(`${label} is not a valid PNG file`);
  }
  // IHDR chunk: width and height are big-endian uint32 at offsets 16 and 20.
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  if (width !== 1024 || height !== 1024) {
    fail(`${label} is ${width}x${height}, expected 1024x1024`);
  }
  if (buf.length > 1048576) {
    fail(`${label} is ${buf.length} bytes, over the 1 MiB limit`);
  }
}

function main(): void {
  if (!existsSync(sourcePath)) {
    fail(`entry.png not found next to main.ts (${sourcePath})`);
  }
  const image = readFileSync(sourcePath);
  checkPng(image, "entry.png");

  mkdirSync(outDir, { recursive: true });
  writeFileSync(outPath, image);

  // Confirm the copy is exact by reading it back and comparing bytes.
  const written = readFileSync(outPath);
  if (!written.equals(image)) {
    fail("output file differs from entry.png after writing");
  }
  checkPng(written, "output entry.png");
  const sha256 = createHash("sha256").update(written).digest("hex");
  console.log(`Wrote ${outPath} (${written.length} bytes, 1024x1024, sha256 ${sha256})`);
}

main();
