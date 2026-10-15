// Renders Daywell's app icons from public/icon.svg (docs/web-app.md). Run after changing the icon:
//   node scripts/generate-app-icons.mjs
// Writes the files the web app manifest and iPhone home screens use. They live at the site root because the public
// front door serves root-level images without a sign-in (lib/public-access.ts), so phones can fetch them before
// anyone signs in.
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import sharp from "sharp";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const svg = await readFile(join(root, "public", "icon.svg"));
const sizes = [
  ["icon-192.png", 192], // manifest, purpose "any"
  ["icon-512.png", 512], // manifest, purpose "any"
  ["icon-maskable-512.png", 512], // manifest, purpose "maskable": the mark already sits inside the safe zone
  ["apple-touch-icon.png", 180], // iPhone and iPad home screens (no transparency; iOS rounds the corners)
];
for (const [name, size] of sizes) {
  await sharp(svg, { density: Math.ceil((72 * size) / 1024) * 4 }).resize(size, size).flatten({ background: "#803c65" }).png({ compressionLevel: 9 }).toFile(join(root, "public", name));
  console.log("wrote", name, `${size}×${size}`);
}
