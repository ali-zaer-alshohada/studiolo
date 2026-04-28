#!/usr/bin/env node
/**
 * Extract the largest frame from app/favicon.ico (Windows ICO format) and
 * write it to public/icon-source.png. Then build-icons.mjs can resize it.
 *
 * ICO format: 6-byte header + 16-byte directory entry per frame + image data.
 * Modern .ico files (Windows Vista+) embed PNGs for ≥256px frames; smaller
 * frames are usually BMP/DIB. We grab whichever is largest.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "app", "favicon.ico");
const OUT = join(ROOT, "public", "icon-source.png");

const buf = readFileSync(SRC);

const reserved = buf.readUInt16LE(0);
const type = buf.readUInt16LE(2);
const count = buf.readUInt16LE(4);
console.log(`ICO: reserved=${reserved} type=${type} (1=ICO) frames=${count}`);

let largest = null;
for (let i = 0; i < count; i++) {
  const off = 6 + i * 16;
  const w = buf.readUInt8(off) || 256;
  const h = buf.readUInt8(off + 1) || 256;
  const bpp = buf.readUInt16LE(off + 6);
  const size = buf.readUInt32LE(off + 8);
  const dataOff = buf.readUInt32LE(off + 12);
  console.log(`  frame ${i}: ${w}×${h} ${bpp}bpp size=${size} offset=${dataOff}`);
  if (!largest || w * h > largest.w * largest.h) {
    largest = { w, h, bpp, size, dataOff };
  }
}

if (!largest) {
  console.error("No frames found");
  process.exit(1);
}

const frameData = buf.subarray(largest.dataOff, largest.dataOff + largest.size);
const isPng =
  frameData[0] === 0x89 &&
  frameData[1] === 0x50 &&
  frameData[2] === 0x4e &&
  frameData[3] === 0x47;

console.log(
  `Largest: ${largest.w}×${largest.h} (${isPng ? "PNG-embedded" : "BMP/DIB"})`,
);

if (isPng) {
  writeFileSync(OUT, frameData);
  console.log(`✓ wrote ${OUT}`);
} else {
  console.log(
    "Largest frame is BMP/DIB — needs sharp to convert. Run build-icons.mjs after this.",
  );
  // For BMP frames, sharp can't read raw BMP from .ico headers — we'd need
  // to wrap with a proper BMP file header. For now, fall back to extracting
  // the bytes anyway and let sharp try; if it fails, the script reports.
  writeFileSync(OUT.replace(/\.png$/, ".bmp"), frameData);
}
