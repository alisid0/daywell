// Mixes a film's soundtrack in Node (deterministic, sample-exact) and masters it with FFmpeg:
//   - Alice's voiceover lines at their start times (the film's voiceover-lines.mjs)
//   - the music, ducked under the voice (and muffled for a stretch, if film.json asks), from a gain envelope
//   - every sound effect from data/cues.json (exported by `node render.mjs --cues`), placed so its peak (or its
//     onset, for textures like typing) lands on the cue, normalised then set to the cue's level, optional pitch
//   - any ambience film.json lists, such as Daywell's own sleep sounds
// Then two-pass loudnorm to -14 LUFS, a true-peak limiter (level=disabled) and a measurement of the result.
//   node tools/mix.mjs [--film=shorts/eat]      → <film>/audio/mix-raw.wav, <film>/audio/mix.wav
// Settings live in the film's film.json "mix": voiceDb, musicDb, duckDb, lines {"8": {gainDb, duckDb}}, muffle
// {from, to}, ambience [{file (in the repo, or "film:…" in the film's folder), from, to, db, fadeIn, fadeOut}],
// duck [[from, to]] (extra music dips), musicFadeOut [from, to], ceilingDb (the limiter's ceiling, default -1).
import { spawn, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { FFMPEG } from "./ffmpeg-path.mjs";
import { repoRoot, promoRoot, filmRoot, filmFile, film } from "./paths.mjs";

const { lines } = await import(pathToFileURL(filmFile("voiceover-lines.mjs")).href);
const cfg = film.mix;
const SR = 48000, LEN = film.length, N = SR * LEN;
const db = d => 10 ** (d / 20);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };

function decode(file) {
  return new Promise((resolve, reject) => {
    const p = spawn(FFMPEG, ["-hide_banner", "-loglevel", "error", "-i", file, "-ac", "2", "-ar", String(SR), "-f", "f32le", "pipe:1"]);
    const chunks = []; p.stdout.on("data", c => chunks.push(c)); p.on("error", reject);
    p.on("close", code => code ? reject(Error(`decode ${file}: ${code}`)) : resolve(new Float32Array(Buffer.concat(chunks).buffer.slice(0))));
  });
}
const outL = new Float32Array(N), outR = new Float32Array(N);
// Per-category mono stems (for measuring the balance; nothing is written unless --stems)
const STEMS = { vo: new Float32Array(N), music: new Float32Array(N), sfx: new Float32Array(N), amb: new Float32Array(N) };
let stem = "vo";
function add(buf, at, gain = 1, opts = {}) { // buf: interleaved stereo; at: seconds; gain: linear or (i)=>linear
  const rate = opts.rate || 1, frames = Math.floor(buf.length / 2 / rate), start = Math.round(at * SR);
  for (let i = 0; i < frames; i++) {
    const j = start + i; if (j < 0 || j >= N) continue;
    const pos = i * rate, k = Math.floor(pos), f = pos - k;
    const l = buf[2 * k] * (1 - f) + (buf[2 * k + 2] ?? 0) * f, r = buf[2 * k + 1] * (1 - f) + (buf[2 * k + 3] ?? 0) * f;
    const g = typeof gain === "function" ? gain(j / SR, i / SR) : gain;
    outL[j] += l * g; outR[j] += r * g; STEMS[stem][j] += 0.5 * (l + r) * g;
  }
}
const peakOf = buf => { let m = 0, at = 0; for (let i = 0; i < buf.length; i++) { const a = Math.abs(buf[i]); if (a > m) { m = a; at = i >> 1; } } return { peak: m, at: at / SR }; };
const onsetOf = (buf, peak) => { const th = peak * db(-24); for (let i = 0; i < buf.length; i++) if (Math.abs(buf[i]) > th) return (i >> 1) / SR; return 0; };

// ---- Voice
const VO_GAIN = db(cfg.voiceDb ?? 2);
const voWindows = [];
for (const [i, line] of lines.entries()) {
  const n = String(i + 1).padStart(2, "0"), own = cfg.lines?.[i + 1] || {};
  const buf = await decode(join(filmRoot, "audio", "vo", `line-${n}.mp3`));
  const words = JSON.parse(readFileSync(join(filmRoot, "audio", "vo", `line-${n}.json`), "utf8")).words;
  // A line can have its own lift and its own duck depth (film.json "lines").
  add(buf, line.at, VO_GAIN * (own.gainDb != null ? db(own.gainDb) : 1));
  voWindows.push([line.at + words[0].start, line.at + words.at(-1).end, own.duckDb != null ? db(own.duckDb) : null]);
}

stem = "music";
// ---- Music: base level, ducked under the voice, optionally muffled for a stretch, optionally faded at the end
const MUSIC_BASE = db(cfg.musicDb ?? -9), DUCK = db(cfg.duckDb ?? -9);
// How much of the music remains (1 = none ducked): each line ducks to its own depth (default DUCK).
// Other sounds that need the music out of the way (film.json "duck": [[from, to], …]), such as a recorded voice in the app.
const duckWindows = [...voWindows, ...(cfg.duck || []).map(([a, b]) => [a, b, null])];
const keepAt = t => { let keep = 1; for (const [a, b, depth] of duckWindows) { const d = smooth((t - (a - 0.18)) / 0.15) * (1 - smooth((t - (b + 0.2)) / 0.45)); keep = Math.min(keep, 1 - (1 - (depth ?? DUCK)) * d); } return keep; };
const duckAt = t => (1 - keepAt(t)) / (1 - DUCK);
const music = await decode(join(filmRoot, "audio", "music", film.music));
const [F0, F1] = cfg.musicFadeOut || [LEN + 1, LEN + 2];
const fade = t => 1 - smooth((t - F0) / (F1 - F0));
if (cfg.muffle) {
  const PAUSE_IN = cfg.muffle.from, PAUSE_OUT = cfg.muffle.to;
  const muffle = t => smooth((t - PAUSE_IN) / 0.3) * (1 - smooth((t - (PAUSE_OUT - 0.4)) / 0.6));
  // A lowpassed copy (two RBJ biquads at 600 Hz) for the muffled stretch
  const lowpass = (buf, fc) => {
    const out = new Float32Array(buf.length), w0 = 2 * Math.PI * fc / SR, cos = Math.cos(w0), alpha = Math.sin(w0) / (2 * Math.SQRT1_2);
    const b0 = (1 - cos) / 2 / (1 + alpha), b1 = (1 - cos) / (1 + alpha), b2 = b0, a1 = -2 * cos / (1 + alpha), a2 = (1 - alpha) / (1 + alpha);
    for (let ch = 0; ch < 2; ch++) { let x1 = 0, x2 = 0, y1 = 0, y2 = 0; for (let i = ch; i < buf.length; i += 2) { const x = buf[i], y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; out[i] = y; } }
    return out;
  };
  const music2 = lowpass(lowpass(music, 600), 600);
  add(music, 0, t => MUSIC_BASE * keepAt(t) * (1 - muffle(t)) * fade(t));
  add(music2, 0, t => MUSIC_BASE * db(-3) * (1 - (1 - DUCK) * duckAt(t) * 0.6) * muffle(t) * fade(t));
} else {
  add(music, 0, t => MUSIC_BASE * keepAt(t) * fade(t));
}

stem = "sfx";
// ---- Sound effects from the film's own cue list (the library in audio/sfx is shared by every film)
const cues = JSON.parse(readFileSync(join(filmRoot, "data", "cues.json"), "utf8"));
const ONSET = new Set(["typing", "scroll", "stars", "shimmer"]); // textures start on the cue; hits peak on it
const cache = {};
for (const c of cues) {
  if (!cache[c.sound]) { const buf = await decode(join(promoRoot, "audio", "sfx", `${c.sound}.mp3`)); const { peak, at } = peakOf(buf); cache[c.sound] = { buf, peak, at, onset: onsetOf(buf, peak) }; }
  const s = cache[c.sound], rate = c.rate || 1;
  const anchor = (ONSET.has(c.sound) ? s.onset : s.at) / rate;
  add(s.buf, c.t - anchor, db(-1) / s.peak * db(c.gain), { rate });
}

stem = "amb";
// ---- Ambience, such as Daywell's own sleep sounds
for (const a of cfg.ambience || []) {
  const buf = await decode(a.file.startsWith("film:") ? join(filmRoot, a.file.slice(5)) : join(repoRoot, a.file)); // "film:" = in the film's folder
  const W0 = a.from, W1 = a.to, wp = peakOf(buf).peak, fi = a.fadeIn ?? 1.8, fo = a.fadeOut ?? 2.4;
  add(buf, W0, t => (db(a.db) / wp) * smooth((t - W0) / fi) * (1 - smooth((t - (W1 - fo)) / fo)) * (t < W1 ? 1 : 0));
}

// ---- Write the raw mix, then master it
function wav(path, L, R) {
  const data = Buffer.alloc(N * 8); for (let i = 0; i < N; i++) { data.writeFloatLE(L[i], i * 8); data.writeFloatLE(R[i], i * 8 + 4); }
  const h = Buffer.alloc(44); h.write("RIFF", 0); h.writeUInt32LE(36 + data.length, 4); h.write("WAVE", 8); h.write("fmt ", 12); h.writeUInt32LE(16, 16);
  h.writeUInt16LE(3, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 8, 28); h.writeUInt16LE(8, 32); h.writeUInt16LE(32, 34); h.write("data", 36); h.writeUInt32LE(data.length, 40);
  writeFileSync(path, Buffer.concat([h, data]));
}
const raw = join(filmRoot, "audio", "mix-raw.wav"), out = join(filmRoot, "audio", "mix.wav");
wav(raw, outL, outR);
const pass1 = spawnSync(FFMPEG, ["-hide_banner", "-i", raw, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], { encoding: "utf8" }).stderr;
const m = JSON.parse(pass1.slice(pass1.lastIndexOf("{"), pass1.lastIndexOf("}") + 1));
// The limiter's ceiling: -1 dBFS unless film.json sets ceilingDb. AAC encoding lifts sharp peaks (by up to 2.5 dB at
// 192 kbps on the shorts), so a film whose delivered MP4 measures over -1 dBTP sets a lower one; the shorts use -2.5.
const ceiling = cfg.ceilingDb == null ? "0.891" : db(cfg.ceilingDb).toFixed(3);
const af = `loudnorm=I=-14:TP=-1.5:LRA=11:linear=true:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset},alimiter=limit=${ceiling}:level=disabled:attack=5:release=60`;
const r2 = spawnSync(FFMPEG, ["-hide_banner", "-loglevel", "error", "-y", "-i", raw, "-af", af, "-ar", String(SR), "-c:a", "pcm_s24le", out], { encoding: "utf8" });
if (r2.status !== 0) throw Error(r2.stderr);
const meas = spawnSync(FFMPEG, ["-hide_banner", "-i", out, "-af", "ebur128=peak=true:framelog=quiet", "-f", "null", "-"], { encoding: "utf8" }).stderr;
const I = meas.match(/I:\s+(-?[\d.]+) LUFS/g)?.at(-1), TP = meas.match(/Peak:\s+(-?[\d.]+) dBFS/g)?.at(-1);
// Balance report: voice against music in each line, the music between lines, and each effect's peak against the bed
// around its cue (pre-master dB).
const rms = (a, t0, t1) => { let s2 = 0, n = 0; for (let i = Math.max(0, Math.round(t0 * SR)); i < Math.min(N, Math.round(t1 * SR)); i++) { s2 += a[i] * a[i]; n++; } return 10 * Math.log10(s2 / Math.max(1, n) + 1e-12); };
const pk = (a, t0, t1) => { let m = 0; for (let i = Math.max(0, Math.round(t0 * SR)); i < Math.min(N, Math.round(t1 * SR)); i++) m = Math.max(m, Math.abs(a[i])); return 20 * Math.log10(m + 1e-12); };
console.log("voice minus music per line (dB):", voWindows.map(([a, b], i) => `${i + 1}:${(rms(STEMS.vo, a, b) - rms(STEMS.music, a, b)).toFixed(1)}`).join(" "));
const gaps = [];
voWindows.forEach(([, b], i) => { const next = voWindows[i + 1]?.[0] ?? LEN; if (next - b > 1.6) gaps.push([+(b + 0.6).toFixed(1), +(next - 0.3).toFixed(1)]); });
console.log("music between lines (dB):", gaps.map(([a, b]) => `${a}-${b}:${rms(STEMS.music, a, b).toFixed(1)}`).join(" "));
const bed = t => { const v = x => 10 ** (rms(x, t - 0.25, t + 0.25) / 10); return 10 * Math.log10(v(STEMS.vo) + v(STEMS.music) + v(STEMS.amb) + 1e-12); };
console.log("effect peak minus bed rms (dB):", cues.map(c => `${c.sound}@${c.t}:${(pk(STEMS.sfx, c.t - 0.12, c.t + 0.12) - bed(c.t)).toFixed(0)}`).join(" "));
console.log(JSON.stringify({ voiceLines: lines.length, cues: cues.length, rawIntegrated: m.input_i, rawTruePeak: m.input_tp, master: { I, TP } }));
