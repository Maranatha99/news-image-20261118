// THE WORLD — Wednesday 18 November 2026 front page.
// A program that draws a newspaper front page summing up the world's news of
// Wednesday 18 November 2026 and writes it as a deterministic 1024x1024 PNG.
// Node 22 standard library only. No network, no clock, no randomness.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

const W = 1024;
const H = 1024;

// ---- palette (RGB) ----
const PAPER = [253, 252, 247];
const INK = [17, 17, 17];
const RED = [185, 28, 28];
const BLUE = [30, 64, 175];
const SKY = [147, 197, 253];
const SEA = [37, 99, 235];
const GREY = [107, 114, 128];
const GOLD = [217, 119, 6];
const NAVY = [15, 23, 42];
const WHITE = [255, 255, 255];
const DARKRED = [127, 29, 29];
const LIGHTGREY = [229, 231, 235];

// ---- pixel buffer (RGB, row-major) ----
const buf = new Uint8Array(W * H * 3);
for (let i = 0; i < W * H; i++) {
  buf[i * 3] = PAPER[0];
  buf[i * 3 + 1] = PAPER[1];
  buf[i * 3 + 2] = PAPER[2];
}

function px(x, y, c) {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const o = (y * W + x) * 3;
  buf[o] = c[0];
  buf[o + 1] = c[1];
  buf[o + 2] = c[2];
}

function rect(x, y, w, h, c) {
  const x0 = Math.max(0, x);
  const y0 = Math.max(0, y);
  const x1 = Math.min(W, x + w);
  const y1 = Math.min(H, y + h);
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) {
      const o = (yy * W + xx) * 3;
      buf[o] = c[0];
      buf[o + 1] = c[1];
      buf[o + 2] = c[2];
    }
  }
}

function hline(x, y, w, c, t = 1) {
  rect(x, y, w, t, c);
}

function vline(x, y, h, c, t = 1) {
  rect(x, y, t, h, c);
}

// Bresenham line
function line(x0, y0, x1, y1, c) {
  let dx = Math.abs(x1 - x0);
  let dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    px(x0, y0, c);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

// Filled disc
function disc(cx, cy, r, c) {
  for (let dy = -r; dy <= r; dy++) {
    const dx = Math.floor(Math.sqrt(r * r - dy * dy));
    for (let xx = cx - dx; xx <= cx + dx; xx++) px(xx, cy + dy, c);
  }
}

// Circle outline (midpoint), thickness 1-2
function ring(cx, cy, r, c) {
  let x = r;
  let y = 0;
  let err = 0;
  while (x >= y) {
    px(cx + x, cy + y, c); px(cx + y, cy + x, c);
    px(cx - y, cy + x, c); px(cx - x, cy + y, c);
    px(cx - x, cy - y, c); px(cx - y, cy - x, c);
    px(cx + y, cy - x, c); px(cx + x, cy - y, c);
    y += 1;
    err += 1 + 2 * y;
    if (2 * (err - x) + 1 > 0) { x -= 1; err += 1 - 2 * x; }
  }
}

// Filled triangle (scanline)
function tri(x0, y0, x1, y1, x2, y2, c) {
  const minY = Math.max(0, Math.min(y0, y1, y2));
  const maxY = Math.min(H - 1, Math.max(y0, y1, y2));
  for (let y = minY; y <= maxY; y++) {
    const xs = [];
    const edges = [[x0, y0, x1, y1], [x1, y1, x2, y2], [x2, y2, x0, y0]];
    for (const [ax, ay, bx, by] of edges) {
      if ((ay <= y && by > y) || (by <= y && ay > y)) {
        xs.push(ax + ((y - ay) / (by - ay)) * (bx - ax));
      }
    }
    if (xs.length >= 2) {
      const xa = Math.max(0, Math.floor(Math.min(...xs)));
      const xb = Math.min(W - 1, Math.ceil(Math.max(...xs)));
      for (let x = xa; x <= xb; x++) px(x, y, c);
    }
  }
}

// Starburst (explosion): radiating spikes + filled centre
function burst(cx, cy, r, c) {
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    const len = k % 2 === 0 ? r : Math.floor(r * 0.45);
    line(cx, cy, Math.round(cx + Math.cos(a) * len), Math.round(cy + Math.sin(a) * len), c);
  }
  disc(cx, cy, Math.max(2, Math.floor(r * 0.3)), c);
}

// ---- 5x7 bitmap font ----
// Each glyph: 7 rows, each a 5-bit number; bit 4 = leftmost pixel, bit 0 = rightmost.
// All-caps A-Z, digits 0-9, and punctuation. Unknown characters render as a space.
const FONT = {
  'A': [14, 17, 17, 31, 17, 17, 17],
  'B': [30, 17, 17, 30, 17, 17, 30],
  'C': [14, 17, 16, 16, 16, 17, 14],
  'D': [30, 17, 17, 17, 17, 17, 30],
  'E': [31, 16, 16, 30, 16, 16, 31],
  'F': [31, 16, 16, 30, 16, 16, 16],
  'G': [14, 17, 16, 23, 17, 17, 15],
  'H': [17, 17, 17, 31, 17, 17, 17],
  'I': [14, 4, 4, 4, 4, 4, 14],
  'J': [7, 2, 2, 2, 2, 18, 12],
  'K': [17, 18, 20, 24, 20, 18, 17],
  'L': [16, 16, 16, 16, 16, 16, 31],
  'M': [17, 27, 21, 21, 17, 17, 17],
  'N': [17, 25, 21, 19, 17, 17, 17],
  'O': [14, 17, 17, 17, 17, 17, 14],
  'P': [30, 17, 17, 30, 16, 16, 16],
  'Q': [14, 17, 17, 17, 21, 18, 13],
  'R': [30, 17, 17, 30, 20, 18, 17],
  'S': [15, 16, 16, 14, 1, 1, 30],
  'T': [31, 4, 4, 4, 4, 4, 4],
  'U': [17, 17, 17, 17, 17, 17, 14],
  'V': [17, 17, 17, 17, 17, 10, 4],
  'W': [17, 17, 17, 21, 21, 27, 17],
  'X': [17, 17, 10, 4, 10, 17, 17],
  'Y': [17, 17, 10, 4, 4, 4, 4],
  'Z': [31, 1, 2, 4, 8, 16, 31],
  '0': [14, 17, 19, 21, 25, 17, 14],
  '1': [4, 12, 4, 4, 4, 4, 14],
  '2': [14, 17, 1, 6, 8, 16, 31],
  '3': [31, 2, 4, 2, 1, 17, 14],
  '4': [2, 6, 10, 18, 31, 2, 2],
  '5': [31, 16, 30, 1, 1, 17, 14],
  '6': [6, 8, 16, 30, 17, 17, 14],
  '7': [31, 1, 2, 4, 8, 8, 8],
  '8': [14, 17, 17, 14, 17, 17, 14],
  '9': [14, 17, 17, 15, 1, 2, 12],
  ' ': [0, 0, 0, 0, 0, 0, 0],
  ',': [0, 0, 0, 0, 4, 4, 8],
  '.': [0, 0, 0, 0, 0, 12, 12],
  '-': [0, 0, 0, 14, 0, 0, 0],
  "'": [4, 4, 8, 0, 0, 0, 0],
  ':': [0, 0, 12, 0, 12, 0, 0],
  '!': [4, 4, 4, 4, 4, 0, 4],
  '?': [14, 17, 1, 2, 4, 0, 4],
  '/': [1, 2, 2, 4, 8, 8, 16],
  '(': [2, 4, 8, 8, 8, 4, 2],
  ')': [8, 4, 2, 2, 2, 4, 8],
};

function drawChar(ch, x, y, s, c) {
  const g = FONT[ch] || FONT[' '];
  for (let r = 0; r < 7; r++) {
    const row = g[r];
    for (let col = 0; col < 5; col++) {
      if (row & (1 << (4 - col))) {
        rect(x + col * s, y + r * s, s, s, c);
      }
    }
  }
}

function textWidth(str, s) {
  if (!str) return 0;
  return str.length * 6 * s - s;
}

function drawText(str, x, y, s, c) {
  let cx = x;
  for (const ch of str) {
    drawChar(ch, cx, y, s, c);
    cx += 6 * s;
  }
  return cx - s;
}

function drawCentered(str, cx, y, s, c) {
  drawText(str, cx - Math.floor(textWidth(str, s) / 2), y, s, c);
}

// Greedy word wrap to a maximum pixel width; returns an array of lines.
function wrapText(str, maxW, s) {
  const words = str.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const trial = cur ? cur + ' ' + w : w;
    if (textWidth(trial, s) <= maxW || !cur) {
      cur = trial;
    } else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// ---- PNG encoder (hand-written, Node stdlib zlib) ----
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), data])), 8 + data.length);
  return out;
}

function encodePNG() {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  // Raw scanlines: filter byte 0 + RGB bytes per row.
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    raw.set(buf.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---- small drawing helpers for the front page ----

// Arc (top semicircle) centred at (cx, cy), radius r, drawn as line segments.
function arcTop(cx, cy, r, c) {
  let px0 = null;
  let py0 = null;
  for (let a = 180; a <= 360; a += 10) {
    const t = (a * Math.PI) / 180;
    const x = Math.round(cx + r * Math.cos(t));
    const y = Math.round(cy + r * Math.sin(t));
    if (px0 !== null) line(px0, py0, x, y, c);
    px0 = x;
    py0 = y;
  }
}

// A spiky virus particle: radiating spikes + two-tone disc.
function virus(cx, cy, r) {
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2;
    line(cx, cy, Math.round(cx + Math.cos(a) * (r + 5)), Math.round(cy + Math.sin(a) * (r + 5)), DARKRED);
  }
  disc(cx, cy, r, DARKRED);
  disc(cx, cy, Math.max(2, r - 4), RED);
}

// ---- the front page ----

// Top red rule
rect(0, 0, W, 8, RED);

// Masthead: globe left, THE WORLD centre, red "18" badge right
disc(70, 46, 28, SKY);
ring(70, 46, 28, INK);
vline(70, 18, 56, INK);
hline(42, 46, 56, INK);
ring(70, 46, 16, INK);
drawCentered('THE WORLD', 512, 14, 9, INK);
disc(954, 46, 28, RED);
drawCentered('18', 954, 32, 4, WHITE);

// Date bar
rect(0, 88, W, 26, INK);
drawCentered('WEDNESDAY 18 NOVEMBER 2026', 512, 92, 3, WHITE);
hline(0, 122, W, 2, INK);

// ---- LEAD: US strikes Iran, Iran hits Bahrain and Kuwait ----
drawCentered('THE GULF WAR WIDENS', 512, 132, 2, RED);
drawCentered('US STRIKES IRAN AS TEHRAN', 512, 152, 5, INK);
drawCentered('HITS BAHRAIN AND KUWAIT', 512, 200, 5, INK);
{
  const sub = wrapText('JETS HIT IRGC MISSILE SITE ON QESHM ISLAND, IRAN FIRES DRONES AT US BASES, DOWNS MQ-9', 920, 2);
  sub.forEach((ln, i) => drawCentered(ln, 512, 246 + i * 18, 2, INK));
}
// Gulf illustration strip (y 284-380): sea, tanker, jets, bursts, drone
{
  const y0 = 284;
  const y1 = 380;
  // sea
  rect(24, y0 + 66, 976, y1 - (y0 + 66), SEA);
  hline(24, y0 + 66, 976, WHITE, 2);
  // tanker (left)
  rect(120, y0 + 72, 150, 14, INK);
  rect(215, y0 + 58, 34, 14, INK);
  rect(232, y0 + 48, 10, 10, RED);
  // second ship (right)
  rect(720, y0 + 76, 110, 10, INK);
  rect(790, y0 + 64, 22, 12, INK);
  // fighter jets (delta shapes, nose right)
  tri(430, y0 + 22, 462, y0 + 28, 430, y0 + 34, INK);
  tri(500, y0 + 14, 532, y0 + 20, 500, y0 + 26, INK);
  // explosion bursts
  burst(350, y0 + 30, 11, GOLD);
  burst(640, y0 + 36, 9, GOLD);
  burst(880, y0 + 26, 12, RED);
  // drone (small diamond)
  tri(906, y0 + 44, 916, y0 + 48, 906, y0 + 52, INK);
  tri(906, y0 + 52, 916, y0 + 48, 906, y0 + 44, INK);
}
hline(0, 390, W, 2, INK);

// ---- 2x2 grid of stories ----
const GRID_TOP = 398;
const ROW_H = 160;
hline(24, GRID_TOP + ROW_H, 976, 2, INK);
vline(512, GRID_TOP, ROW_H * 2, INK, 2);

// Draw one grid cell: headline (scale 3) + subhead (scale 2) + illustration strip.
function gridCell(cx, cy, headline, subhead, drawScene) {
  const lines = wrapText(headline, 460, 3);
  lines.forEach((ln, i) => drawText(ln, cx + 8, cy + 8 + i * 26, 3, INK));
  const subY = cy + 8 + lines.length * 26 + 6;
  const subLines = wrapText(subhead, 460, 2);
  subLines.forEach((ln, i) => drawText(ln, cx + 8, subY + i * 18, 2, INK));
  drawScene(cx + 8, cy + 124, 460, 30);
}

// Kerch Bridge (top-left): deck with a gap, falling span, towers, cables, smoke, flame
gridCell(24, GRID_TOP, 'KERCH BRIDGE SPAN FALLS AFTER SECOND UKRAINE STRIKE', 'Part of road deck drops into strait as Kyiv hits Crimea link again', (x, y, w, h) => {
  rect(x, y + 24, w, 6, SEA);
  rect(x, y + 16, 190, 5, INK);
  rect(x + 270, y + 16, 190, 5, INK);
  tri(x + 196, y + 16, x + 264, y + 16, x + 230, y + 28, INK);
  vline(x + 100, y + 4, 12, INK, 2);
  vline(x + 360, y + 4, 12, INK, 2);
  line(x + 100, y + 4, x + 190, y + 16, INK);
  line(x + 360, y + 4, x + 270, y + 16, INK);
  disc(x + 206, y + 8, 4, GREY);
  disc(x + 254, y + 6, 3, GREY);
  burst(x + 230, y + 13, 4, GOLD);
});

// Trump in Shenzhen (top-right): skyline, three flags, sun
gridCell(524, GRID_TOP, 'TRUMP LANDS IN SHENZHEN FOR XI-PUTIN SUMMIT', 'Three-way talks Thursday as Xi opens APEC in Shenzhen', (x, y, w, h) => {
  disc(x + 420, y + 8, 7, GOLD);
  const base = y + h;
  rect(x + 6, base - 14, 34, 14, INK);
  rect(x + 46, base - 20, 30, 20, INK);
  rect(x + 82, base - 12, 28, 12, INK);
  rect(x + 116, base - 18, 32, 18, INK);
  rect(x + 154, base - 20, 26, 20, INK);
  rect(x + 186, base - 16, 30, 16, INK);
  rect(x + 222, base - 19, 30, 19, INK);
  rect(x + 258, base - 13, 30, 13, INK);
  rect(x + 294, base - 17, 32, 17, INK);
  rect(x + 332, base - 14, 30, 14, INK);
  rect(x + 368, base - 16, 30, 16, INK);
  rect(x + 404, base - 10, 30, 10, INK);
  // three flags on the tallest towers
  vline(x + 60, base - 28, 8, INK, 2);
  rect(x + 62, base - 28, 14, 6, RED);
  vline(x + 167, base - 28, 8, INK, 2);
  rect(x + 169, base - 28, 14, 6, BLUE);
  vline(x + 237, base - 27, 8, INK, 2);
  rect(x + 239, base - 27, 14, 6, RED);
});

// Ebola in Congo (bottom-left): spiky virus particles
gridCell(24, GRID_TOP + ROW_H, 'EBOLA PASSES 11,000 CASES IN CONGO', 'Outbreak doubles in three months; 5,400 dead, UN says', (x, y, w, h) => {
  virus(x + 60, y + 15, 8);
  virus(x + 170, y + 15, 10);
  virus(x + 280, y + 15, 8);
  virus(x + 380, y + 15, 9);
  disc(x + 120, y + 22, 3, DARKRED);
  disc(x + 230, y + 24, 3, DARKRED);
  disc(x + 330, y + 22, 3, DARKRED);
  disc(x + 430, y + 24, 3, DARKRED);
});

// Measles in the US (bottom-right): rising bar chart + arrow
gridCell(524, GRID_TOP + ROW_H, 'US LOSES MEASLES-FREE STATUS AFTER 26 YEARS', '5,400 cases, 10 deaths - worst year since 1991', (x, y, w, h) => {
  const base = y + h;
  const bw = 52;
  const gap = 18;
  const heights = [8, 12, 18, 24, 29];
  heights.forEach((hh, i) => {
    rect(x + 20 + i * (bw + gap), base - hh, bw, hh, RED);
  });
  hline(x + 10, base, 430, INK, 2);
  line(x + 24, base - 8, x + 396, base - 26, DARKRED);
  tri(x + 396, base - 26, x + 382, base - 24, x + 392, base - 16, DARKRED);
});
hline(0, 726, W, 2, INK);

// ---- VOYAGER 1: one light-day from Earth ----
drawCentered('VOYAGER 1 REACHES ONE LIGHT-DAY', 512, 736, 4, INK);
drawCentered('FROM EARTH', 512, 774, 4, INK);
drawCentered('16 BILLION MILES OUT, NO HUMAN-MADE OBJECT HAS GONE FARTHER', 512, 816, 2, INK);
{
  const bx = 24;
  const by = 840;
  const bw = 976;
  const bh = 108;
  rect(bx, by, bw, bh, NAVY);
  // deterministic stars (no randomness)
  for (let i = 0; i < 70; i++) {
    const sx = bx + 8 + ((i * 97 + 13) % (bw - 16));
    const sy = by + 6 + ((i * 57 + 29) % (bh - 12));
    px(sx, sy, WHITE);
    if (i % 5 === 0) px(sx + 1, sy, WHITE);
  }
  // Earth (left)
  disc(120, 892, 34, SEA);
  ring(120, 892, 34, WHITE);
  line(96, 884, 146, 880, SKY);
  line(100, 900, 140, 904, SKY);
  drawCentered('EARTH', 120, 932, 2, WHITE);
  // dotted trajectory Earth -> Voyager
  for (let t = 0; t <= 100; t += 4) {
    const tx = Math.round(158 + ((888 - 158) * t) / 100);
    const ty = Math.round(892 + ((880 - 892) * t) / 100);
    px(tx, ty, WHITE);
    px(tx, ty + 1, WHITE);
  }
  // Voyager 1 (right): gold dish + body
  disc(900, 880, 11, GOLD);
  ring(900, 880, 11, WHITE);
  rect(884, 876, 12, 8, WHITE);
  line(912, 880, 928, 872, WHITE);
  drawCentered('VOYAGER 1', 900, 902, 2, WHITE);
  drawCentered('16 BILLION MILES', 512, 848, 2, WHITE);
}
hline(0, 956, W, 2, INK);

// Footer
drawCentered('THE WORLD - WEDNESDAY 18 NOVEMBER 2026 - ONE DAY, ONE IMAGE', 512, 968, 2, INK);

// ---- write the image ----
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';
mkdirSync(outDir, { recursive: true });
const png = encodePNG();
const outPath = join(outDir, 'entry.png');
writeFileSync(outPath, png);
console.log(`Wrote ${outPath} (${png.length} bytes, 1024x1024)`);
