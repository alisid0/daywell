// Checks a delivered MP4 the way a viewer and a platform will see it:
//   1. spec (codec, size, pixel format, colour range, frame rate, audio)
//   2. loudness and true peak
//   3. a one-per-second storyboard image
//   4. a glitch scan: each frame's mean difference from the previous one (decoded small); flags spikes that are much
//      bigger than their neighbours and single-frame flashes (a frame unlike both neighbours while they match)
//   node tools/qa.mjs out/daywell-promo-v2.mp4 [storyboard.png]
import { spawn, spawnSync } from "node:child_process";
import { FFMPEG } from "./ffmpeg-path.mjs";

const [file, board] = process.argv.slice(2);
const info = spawnSync(FFMPEG, ["-hide_banner", "-i", file], { encoding: "utf8" }).stderr;
console.log("spec:", (info.match(/Stream #0:\d.*$/gm) || []).map(s => s.replace(/\s+/g, " ").trim()).join("\n      "));
const dur = info.match(/Duration: ([\d:.]+)/)?.[1];
console.log("duration:", dur);
const loud = spawnSync(FFMPEG, ["-hide_banner", "-i", file, "-af", "ebur128=peak=true:framelog=quiet", "-f", "null", "-"], { encoding: "utf8" }).stderr;
console.log("loudness:", loud.match(/I:\s+-?[\d.]+ LUFS/g)?.at(-1), "|", loud.match(/Peak:\s+-?[\d.]+ dBFS/g)?.at(-1), "|", loud.match(/LRA:\s+[\d.]+ LU/g)?.at(-1));
if (board) {
  const r = spawnSync(FFMPEG, ["-hide_banner", "-loglevel", "error", "-y", "-i", file, "-vf", "fps=1,scale=180:-1,tile=12x10", "-frames:v", "1", board], { encoding: "utf8" });
  console.log("storyboard:", r.status === 0 ? board : r.stderr);
}
// Glitch scan at 135×240 grey
const W = 135, H = 240, size = W * H;
const frames = await new Promise((resolve, reject) => {
  const p = spawn(FFMPEG, ["-hide_banner", "-loglevel", "error", "-i", file, "-vf", `scale=${W}:${H},format=gray`, "-f", "rawvideo", "pipe:1"]);
  const chunks = []; p.stdout.on("data", c => chunks.push(c)); p.on("error", reject);
  p.on("close", code => code ? reject(Error("decode failed")) : resolve(Buffer.concat(chunks)));
});
const n = Math.floor(frames.length / size), fpsMatch = info.match(/(\d+(?:\.\d+)?) fps/), fps = fpsMatch ? Number(fpsMatch[1]) : 60;
const diff = new Float64Array(n);
for (let f = 1; f < n; f++) { let s = 0; const a = (f - 1) * size, b = f * size; for (let i = 0; i < size; i++) s += Math.abs(frames[a + i] - frames[b + i]); diff[f] = s / size; }
const spikes = [], flashes = [];
for (let f = 2; f < n - 2; f++) {
  const local = (diff[f - 2] + diff[f - 1] + diff[f + 1] + diff[f + 2]) / 4;
  if (diff[f] > 6 && diff[f] > 3.5 * (local + 0.4)) spikes.push(`${(f / fps).toFixed(2)}s:${diff[f].toFixed(1)}`);
  // a one-frame flash: f differs from both neighbours, while f-1 and f+1 are alike
  let s = 0; const a = (f - 1) * size, c = (f + 1) * size; for (let i = 0; i < size; i++) s += Math.abs(frames[a + i] - frames[c + i]); s /= size;
  if (diff[f] > 5 && diff[f + 1] > 5 && s < 0.35 * Math.min(diff[f], diff[f + 1])) flashes.push(`${(f / fps).toFixed(2)}s`);
}
console.log(`frames: ${n} at ${fps} fps; mean change per frame ${(diff.reduce((a, b) => a + b, 0) / n).toFixed(2)}`);
console.log("big jumps (check each is a planned cut or hit):", spikes.join(" ") || "none");
console.log("one-frame flashes:", flashes.join(" ") || "none");
// Longest stretches with almost no motion (possible dead time)
const still = []; let run = 0;
for (let f = 1; f < n; f++) { if (diff[f] < 0.08) run++; else { if (run > fps * 1.5) still.push(`${((f - run) / fps).toFixed(1)}–${(f / fps).toFixed(1)}s`); run = 0; } }
console.log("still for over 1.5 s:", still.join(" ") || "none");
