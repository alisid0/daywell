// Puts images side by side (or in a grid) at a common width, for looking at several captures or stills at once.
//   node tools/sheet.mjs <out.png> <columns> <cell width> <image> [image…]
import { readFileSync } from "node:fs";
import { loadSharp } from "./paths.mjs";
const sharp = loadSharp();

const [out, colsArg, widthArg, ...files] = process.argv.slice(2);
const cols = Number(colsArg), w = Number(widthArg), gap = 8;
const cells = await Promise.all(files.map(async f => {
  const img = sharp(readFileSync(f)).resize({ width: w });
  const buf = await img.png().toBuffer();
  const { height } = await sharp(buf).metadata();
  return { buf, height };
}));
const rows = Math.ceil(cells.length / cols);
const rowH = Array.from({ length: rows }, (_, r) => Math.max(...cells.slice(r * cols, r * cols + cols).map(c => c.height)));
const W = cols * w + (cols + 1) * gap, H = rowH.reduce((a, b) => a + b, 0) + (rows + 1) * gap;
const composite = cells.map((c, i) => ({ input: c.buf, left: gap + (i % cols) * (w + gap), top: gap + rowH.slice(0, Math.floor(i / cols)).reduce((a, b) => a + b + gap, 0) }));
await sharp({ create: { width: W, height: H, channels: 3, background: "#333" } }).composite(composite).png().toFile(out);
console.log("wrote", out, W, "x", H);
