// Measures a music file's beat grid and loudness shape, so the film can be cut to the music rather than to a guess.
//   node tools/beats.mjs audio/music/take1.mp3 [section starts in seconds, e.g. 0,6,18,38]
// Writes <file>.beats.json: tempo, every beat time (dynamic-programming beat tracker on spectral flux), the loudness
// of each 2-second bar, and how far each planned section start sits from the nearest beat.
import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { FFMPEG } from "./ffmpeg-path.mjs";

const [file, sectionsArg] = process.argv.slice(2);
const sections = (sectionsArg || "").split(",").filter(Boolean).map(Number);
const SR = 22050, N = 1024, HOP = 256, FPS = SR / HOP;

const pcm = await new Promise((resolve, reject) => {
  const p = spawn(FFMPEG, ["-hide_banner", "-loglevel", "error", "-i", file, "-ac", "1", "-ar", String(SR), "-f", "f32le", "pipe:1"]);
  const chunks = []; p.stdout.on("data", c => chunks.push(c)); p.on("error", reject);
  p.on("close", code => code ? reject(Error(`ffmpeg ${code}`)) : resolve(new Float32Array(Buffer.concat(chunks).buffer.slice(0))));
});
const seconds = pcm.length / SR;

// FFT (radix 2) of a Hann-windowed frame, magnitude in place.
const win = Float32Array.from({ length: N }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N));
const re = new Float64Array(N), im = new Float64Array(N);
function fft() {
  for (let i = 1, j = 0; i < N; i++) { let bit = N >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= N; len <<= 1) {
    const ang = (-2 * Math.PI) / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < N; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const ar = re[i + k], ai = im[i + k], br = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci, bi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
        re[i + k] = ar + br; im[i + k] = ai + bi; re[i + k + len / 2] = ar - br; im[i + k + len / 2] = ai - bi;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
}
const frames = Math.floor((pcm.length - N) / HOP);
const bins = Math.floor((8000 / SR) * N), lowBins = Math.ceil((150 / SR) * N);
let prev = new Float64Array(bins);
const flux = new Float64Array(frames), low = new Float64Array(frames);
for (let f = 0; f < frames; f++) {
  for (let i = 0; i < N; i++) { re[i] = pcm[f * HOP + i] * win[i]; im[i] = 0; }
  fft();
  let s = 0, l = 0; const cur = new Float64Array(bins);
  for (let b = 1; b < bins; b++) { const m = Math.log1p(1000 * Math.hypot(re[b], im[b])); cur[b] = m; const d = m - prev[b]; if (d > 0) s += d; if (b <= lowBins) l += m; }
  flux[f] = s; low[f] = l; prev = cur;
}
// Normalise the onset envelope (subtract a moving average, keep the positive part).
const env = new Float64Array(frames);
for (let f = 0; f < frames; f++) { let m = 0, c = 0; for (let k = Math.max(0, f - 20); k < Math.min(frames, f + 20); k++) { m += flux[k]; c++; } env[f] = Math.max(0, flux[f] - m / c); }
const sd = Math.sqrt(env.reduce((a, v) => a + v * v, 0) / frames) || 1;
for (let f = 0; f < frames; f++) env[f] /= sd;

// Tempo from autocorrelation, weighted gently towards 120 BPM.
let best = { bpm: 0, score: -1 };
for (let bpm = 80; bpm <= 170; bpm += 0.05) {
  const lag = (60 / bpm) * FPS; let s = 0;
  for (let f = 0; f + lag + 1 < frames; f++) { const i = Math.floor(f + lag), fr = f + lag - i; s += env[f] * (env[i] * (1 - fr) + env[i + 1] * fr); }
  s *= Math.exp(-0.5 * (Math.log2(bpm / 120) / 1.0) ** 2);
  if (s > best.score) best = { bpm, score: s };
}
const period = (60 / best.bpm) * FPS;

// Dynamic-programming beat tracker (Ellis 2007): rewards onsets, penalises spacing away from the period.
const score = new Float64Array(frames), from = new Int32Array(frames).fill(-1), tight = 100;
for (let f = 0; f < frames; f++) {
  let bestPrev = -1, bestVal = 0;
  for (let p = Math.max(0, Math.round(f - 2 * period)); p <= f - Math.round(period / 2); p++) {
    const v = score[p] - tight * Math.log((f - p) / period) ** 2;
    if (bestPrev < 0 || v > bestVal) { bestVal = v; bestPrev = p; }
  }
  score[f] = env[f] + (bestPrev >= 0 ? Math.max(0, bestVal) : 0);
  from[f] = bestPrev >= 0 && bestVal > 0 ? bestPrev : -1;
}
let end = 0; for (let f = Math.max(0, frames - Math.round(period)); f < frames; f++) if (score[f] > score[end]) end = f;
const beatFrames = []; for (let f = end; f >= 0; f = from[f]) beatFrames.unshift(f);
const beats = beatFrames.map(f => +((f * HOP + N / 2) / SR).toFixed(3));

// Loudness per 2-second bar (RMS, dB) and low-band (kick) share.
const bars = [];
for (let t = 0; t < seconds; t += 2) {
  let s = 0, c = 0; for (let i = Math.floor(t * SR); i < Math.min(pcm.length, Math.floor((t + 2) * SR)); i++) { s += pcm[i] * pcm[i]; c++; }
  bars.push(+(10 * Math.log10(s / Math.max(1, c) + 1e-12)).toFixed(1));
}
const near = t => beats.reduce((a, b) => (Math.abs(b - t) < Math.abs(a - t) ? b : a), beats[0]);
const sectionReport = sections.map(t => ({ planned: t, nearestBeat: near(t), offsetMs: Math.round((near(t) - t) * 1000) }));
const ioi = beats.slice(1).map((b, i) => b - beats[i]);
const medianIoi = [...ioi].sort((a, b) => a - b)[Math.floor(ioi.length / 2)];
const report = { file, seconds: +seconds.toFixed(2), bpm: +best.bpm.toFixed(2), bpmFromMedianBeat: +(60 / medianIoi).toFixed(2), beats: beats.length, firstBeat: beats[0], lastBeat: beats.at(-1), sectionReport, barsDb: bars };
await writeFile(`${file}.beats.json`, JSON.stringify({ ...report, beatTimes: beats }, null, 1));
console.log(JSON.stringify(report, null, 1));
