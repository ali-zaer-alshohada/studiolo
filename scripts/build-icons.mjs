#!/usr/bin/env node
/**
 * Generate PWA PNG icons from public/favicon.svg via sharp.
 *   icon-192.png        — 192×192, "any" purpose
 *   icon-512.png        — 512×512, "any" purpose
 *   icon-maskable.png   — 512×512 with 10% safe-zone padding (Android adaptive)
 */
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "public");

// Source priority:
//   1. public/icon-source.png if present (extracted from app/favicon.ico via extract-favicon.mjs)
//   2. public/favicon.svg (the typographic fallback)
const ICO_SRC = join(OUT, "icon-source.png");
const SVG_SRC = join(OUT, "favicon.svg");

let src;
let isPng;
if (existsSync(ICO_SRC)) {
  src = readFileSync(ICO_SRC);
  isPng = true;
  console.log("Using public/icon-source.png as source (extracted from app/favicon.ico)");
} else {
  // Auto-extract on first build if the .ico exists.
  if (existsSync(join(ROOT, "app", "favicon.ico"))) {
    console.log("Extracting app/favicon.ico → public/icon-source.png …");
    execSync("node scripts/extract-favicon.mjs", { cwd: ROOT, stdio: "inherit" });
    src = readFileSync(ICO_SRC);
    isPng = true;
  } else {
    src = readFileSync(SVG_SRC);
    isPng = false;
    console.log("Using public/favicon.svg as source");
  }
}

const sharpOpts = isPng ? {} : { density: 320 };
const cream = { r: 245, g: 241, b: 232, alpha: 1 };

async function render(size, outPath) {
  await sharp(src, sharpOpts)
    .resize(size, size, { fit: "contain", background: cream })
    .png()
    .toFile(outPath);
  console.log(`✓ ${outPath} (${size}×${size})`);
}

async function renderMaskable(size, outPath) {
  const inner = Math.round(size * 0.8);
  const padding = Math.round((size - inner) / 2);
  await sharp(src, sharpOpts)
    .resize(inner, inner, { fit: "contain", background: { ...cream, alpha: 0 } })
    .extend({
      top: padding, bottom: padding, left: padding, right: padding,
      background: cream,
    })
    .png()
    .toFile(outPath);
  console.log(`✓ ${outPath} (${size}×${size} maskable)`);
}

await render(192, join(OUT, "icon-192.png"));
await render(512, join(OUT, "icon-512.png"));
await renderMaskable(512, join(OUT, "icon-maskable.png"));
