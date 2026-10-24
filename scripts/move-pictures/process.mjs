// Turns the workout-guide pictures saved from ChatGPT into the app's files (owner, 20 October 2026).
//   node scripts/move-pictures/process.mjs [source folder]      (default: ~/Downloads/daywell-move-pictures)
// Source: <folder>/<female|male>/<exercise-id>.png, transparent PNGs; reference.png is the figure sheet and is skipped.
// An exercise with two poses in poses.mjs is two panels side by side (start, end): it's cut where the panels meet, and
// both frames get the same crop, so the figure stays put when the app swaps them. Every picture is checked against its
// pose text before it's saved for processing; this script doesn't judge form.
// Output: public/move-guides/<figure>/<exercise-id>-<n>.webp (800×600, transparent) and content/exercise-pictures.json,
// which lists each exercise's frames and the shape of its figures (width ÷ height), so the app can show them without empty bands.
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync, copyFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { exercises } from "./poses.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const sharp = createRequire(join(root, "package.json"))("sharp"); // installed with the app's dependencies (via wrangler)
const source = process.argv[2] || join(homedir(), "Downloads", "daywell-move-pictures");
const outDir = join(root, "public", "move-guides"), manifestPath = join(root, "content", "exercise-pictures.json");
const W = 800, H = 600, PAD = 0.06, ALPHA = 24, FIGURES = ["female", "male"];
const byId = new Map(exercises.map(e => [e.id, e]));

async function load(file) {
  const { data, info } = await sharp(readFileSync(file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { file, data, w: info.width, h: info.height };
}
const opaque = (img, x, y) => img.data[(y * img.w + x) * 4 + 3] > ALPHA;
// The panels meet at the emptiest column in the middle 30–70% of the width.
function split(img) {
  const count = new Uint32Array(img.w);
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (opaque(img, x, y)) count[x]++;
  let best = Math.round(img.w / 2);
  for (let x = Math.round(img.w * 0.3); x < img.w * 0.7; x++) if (count[x] < count[best]) best = x;
  return best;
}
function box(img, x0, x1) {
  let l = x1, r = x0 - 1, t = img.h, b = -1;
  for (let y = 0; y < img.h; y++) for (let x = x0; x < x1; x++) if (opaque(img, x, y)) { l = Math.min(l, x); r = Math.max(r, x); t = Math.min(t, y); b = Math.max(b, y); }
  return r < l ? null : { l, r, t, b };
}

// One webp per pose. The crop is the union of the figures' boxes, relative to each panel, plus a margin; where it runs past
// a panel's edge, transparent space is added instead, so every frame of an exercise has the same size and scale.
async function frames(file, poses) {
  const img = await load(file);
  const panels = poses === 2 ? (s => [[0, s], [s, img.w]])(split(img)) : [[0, img.w]];
  const boxes = panels.map(([a, b]) => box(img, a, b));
  if (boxes.some(b => !b)) throw Error(`${file}: a panel is empty`);
  const l = Math.min(...boxes.map((b, i) => b.l - panels[i][0])), r = Math.max(...boxes.map((b, i) => b.r - panels[i][0]));
  const t = Math.min(...boxes.map(b => b.t)), bottom = Math.max(...boxes.map(b => b.b));
  const pad = Math.round(Math.max(r - l + 1, bottom - t + 1) * PAD);
  const want = { x0: l - pad, x1: r + 1 + pad, y0: t - pad, y1: bottom + 1 + pad };
  const aspect = Math.round((want.x1 - want.x0) / (want.y1 - want.y0) * 100) / 100;
  const buffers = await Promise.all(panels.map(async ([a, b]) => {
    const x0 = Math.max(a, a + want.x0), x1 = Math.min(b, a + want.x1), y0 = Math.max(0, want.y0), y1 = Math.min(img.h, want.y1);
    const cut = await sharp(readFileSync(file)).extract({ left: x0, top: y0, width: x1 - x0, height: y1 - y0 })
      .extend({ left: x0 - (a + want.x0), right: a + want.x1 - x1, top: y0 - want.y0, bottom: want.y1 - y1, background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png().toBuffer();
    return sharp(cut).resize({ width: W, height: H, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ quality: 82, alphaQuality: 90 }).toBuffer();
  }));
  return { buffers, aspect };
}

if (!existsSync(source)) throw Error(`No pictures at ${source}`);
rmSync(outDir, { recursive: true, force: true });
const manifest = {};
for (const figure of FIGURES) {
  const dir = join(source, figure), counts = {};
  if (!existsSync(dir)) continue;
  mkdirSync(join(outDir, figure), { recursive: true });
  for (const name of readdirSync(dir).filter(n => n.endsWith(".png") && n !== "reference.png").sort()) {
    const id = name.slice(0, -4), exercise = byId.get(id);
    if (!exercise?.poses) { console.log(`skipped ${figure}/${name}: not an exercise with poses`); continue; }
    const { buffers, aspect } = await frames(join(dir, name), exercise.poses.length);
    buffers.forEach((buf, i) => writeFileSync(join(outDir, figure, `${id}-${i + 1}.webp`), buf));
    counts[id] = { frames: buffers.length, aspect };
    console.log(`${figure}/${id}: ${buffers.length} frame${buffers.length > 1 ? "s" : ""}, shape ${aspect}`);
  }
  // Shared and mirrored pictures (poses.mjs sameAs / mirrorOf).
  for (const e of exercises.filter(x => x.sameAs || x.mirrorOf)) {
    const from = e.sameAs || e.mirrorOf;
    for (let i = 1; i <= (counts[from]?.frames ?? 0); i++) {
      const src = join(outDir, figure, `${from}-${i}.webp`), dest = join(outDir, figure, `${e.id}-${i}.webp`);
      if (e.sameAs) copyFileSync(src, dest);
      else writeFileSync(dest, await sharp(readFileSync(src)).flop().webp({ quality: 82, alphaQuality: 90 }).toBuffer());
    }
    if (counts[from]) { counts[e.id] = counts[from]; console.log(`${figure}/${e.id}: ${e.sameAs ? "same as" : "mirrored from"} ${from}`); }
  }
  manifest[figure] = Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}
writeFileSync(manifestPath, JSON.stringify({ version: 1, note: "Move exercises with workout-guide pictures, per figure: frames (1, or 2 for start and end) and aspect (the figures' width ÷ height inside the 800×600 frames). Made by scripts/move-pictures/process.mjs; see docs/move-pictures.md.", figures: manifest }, null, 2) + "\n");
console.log(`wrote ${manifestPath}`);
