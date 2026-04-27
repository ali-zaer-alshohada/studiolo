#!/usr/bin/env node
/**
 * Generate PWA PNG icons from public/favicon.svg via sharp.
 *   icon-192.png        — 192×192, "any" purpose
 *   icon-512.png        — 512×512, "any" purpose
 *   icon-maskable.png   — 512×512 with 10% safe-zone padding (Android adaptive)
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "public", "favicon.svg");
const OUT = join(ROOT, "public");
const svg = readFileSync(SRC);

async function render(size, outPath) {
  await sharp(svg, { density: 320 })
    .resize(size, size, { fit: "contain", background: { r: 245, g: 241, b: 232, alpha: 1 } })
    .png()
    .toFile(outPath);
  console.log(`✓ ${outPath} (${size}×${size})`);
}

async function renderMaskable(size, outPath) {
  const inner = Math.round(size * 0.8);
  const padding = Math.round((size - inner) / 2);
  await sharp(svg, { density: 320 })
    .resize(inner, inner, { fit: "contain", background: { r: 245, g: 241, b: 232, alpha: 0 } })
    .extend({
      top: padding, bottom: padding, left: padding, right: padding,
      background: { r: 245, g: 241, b: 232, alpha: 1 },
    })
    .png()
    .toFile(outPath);
  console.log(`✓ ${outPath} (${size}×${size} maskable)`);
}

await render(192, join(OUT, "icon-192.png"));
await render(512, join(OUT, "icon-512.png"));
await renderMaskable(512, join(OUT, "icon-maskable.png"));
