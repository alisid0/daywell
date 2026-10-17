// A board of phone screenshots, each under a caption, for showing a preview at a glance.
//   node tools/screens-board.mjs <out.png> <shots folder> <columns> "file.png|Caption" [more…]
import { readFileSync } from "node:fs";
import { loadSharp } from "./paths.mjs";
const sharp = loadSharp();

const [out, dir, colsArg, ...cells] = process.argv.slice(2);
const COLS = Number(colsArg), W = 300, H = 650, CAP = 44, GAP = 26;
const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const text = (s, w, h) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><text x="0" y="${h * 0.7}" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="700" fill="#522d46">${esc(s)}</text></svg>`);
const parts = [];
for (const [i, spec] of cells.entries()) {
  const [file, caption = ""] = spec.split("|");
  const x = 30 + (i % COLS) * (W + GAP), y = 30 + Math.floor(i / COLS) * (CAP + H + GAP);
  parts.push({ input: text(caption, W, CAP), left: x, top: y });
  // The top of each screen, with rounded corners.
  const img = await sharp(readFileSync(`${dir}/${file}`)).resize({ width: W, height: H, fit: "cover", position: "top" }).png().toBuffer();
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" rx="26" ry="26"/></svg>`);
  parts.push({ input: await sharp(img).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer(), left: x, top: y + CAP });
}
const rows = Math.ceil(cells.length / COLS);
await sharp({ create: { width: 60 + COLS * W + (COLS - 1) * GAP, height: 60 + rows * (CAP + H) + (rows - 1) * GAP, channels: 3, background: "#f6eef2" } }).composite(parts).png().toFile(out);
console.log("wrote", out);
