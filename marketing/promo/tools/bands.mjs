// Shows how a music track's character changes across a film, five seconds at a time: overall loudness, the high band
// (hi-hats and cymbals, above 6 kHz) and the low band (kick and bass, below 150 Hz), all in dB RMS. Drums dropping out
// shows as the high and low bands falling while the overall level may stay put.
//   node tools/bands.mjs <music file> [window seconds, default 5]
import { spawn } from "node:child_process";
import { FFMPEG } from "./ffmpeg-path.mjs";

const [file, windowArg] = process.argv.slice(2);
const step = Number(windowArg) || 5, SR = 22050;
async function pcm(filter) {
  return new Promise((resolve, reject) => {
    const args = ["-hide_banner", "-loglevel", "error", "-i", file, ...(filter ? ["-af", filter] : []), "-ac", "1", "-ar", String(SR), "-f", "f32le", "pipe:1"];
    const p = spawn(FFMPEG, args), chunks = [];
    p.stdout.on("data", c => chunks.push(c)); p.on("error", reject);
    p.on("close", code => code ? reject(Error(`ffmpeg ${code}`)) : resolve(new Float32Array(Buffer.concat(chunks).buffer.slice(0))));
  });
}
const db = (x, from, to) => { let s = 0; for (let i = from; i < to; i++) s += x[i] * x[i]; return 10 * Math.log10(s / Math.max(1, to - from) + 1e-12); };
const [all, high, low] = await Promise.all([pcm(""), pcm("highpass=f=6000,highpass=f=6000"), pcm("lowpass=f=150,lowpass=f=150")]);
const n = Math.floor(all.length / (SR * step));
console.log("from   all   high    low");
for (let w = 0; w < n; w++) {
  const a = w * step * SR, b = a + step * SR;
  console.log(`${String(w * step).padStart(4)}s ${db(all, a, b).toFixed(1).padStart(6)} ${db(high, a, b).toFixed(1).padStart(6)} ${db(low, a, b).toFixed(1).padStart(6)}`);
}
