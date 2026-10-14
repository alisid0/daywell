// Makes the promo voiceover with ElevenLabs, one clip per line, with word timings, then checks each clip by
// transcribing it back (ElevenLabs speech to text) so a skipped or garbled word is caught before it reaches the film.
//   node tools/voiceover.mjs [path to .dev.vars, default the repo's] [line numbers to redo, e.g. 4,7]
// The key is read from the given file and never printed or written anywhere. Clips already made are kept unless
// their line number is listed. Output: audio/vo/line-NN.mp3 and line-NN.json (text, word timings, transcript).
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { SECRETS } from "./paths.mjs";
import { lines, voice } from "./voiceover-lines.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const outDir = join(root, "audio", "vo");
const [varsArg, redoArg] = process.argv.slice(2);
const varsPath = varsArg && !/^[\d,]+$/.test(varsArg) ? varsArg : SECRETS; // the repo's .dev.vars by default
const redo = new Set((redoArg || "").split(",").filter(Boolean).map(Number));
const vars = await readFile(varsPath, "utf8");
const key = (vars.match(/^ELEVENLABS_API_KEY=(.+)$/m)?.[1] || "").trim().replace(/^"|"$/g, "");
if (!key) throw Error("No key saved");
const auth = { "xi-api-key": key };
const exists = async p => { try { return (await stat(p)).size > 1000; } catch { return false; } };

await mkdir(outDir, { recursive: true });
const todo = [];
for (const [i, line] of lines.entries()) {
  const n = String(i + 1).padStart(2, "0");
  if (redo.has(i + 1) || !(await exists(join(outDir, `line-${n}.mp3`)))) todo.push(i);
}
const characters = todo.reduce((sum, i) => sum + lines[i].tag.length + lines[i].text.length + (lines[i].tag ? 1 : 0), 0);
const sub = await (await fetch("https://api.elevenlabs.io/v1/user/subscription", { headers: auth, signal: AbortSignal.timeout(20000) })).json();
const remaining = sub.character_limit - sub.character_count;
if (!["starter", "creator", "pro", "scale", "business", "enterprise"].includes(sub.tier) || sub.status !== "active") throw Error("A paid plan is needed for commercial use.");
if (!(remaining >= characters + 20000)) throw Error("Not enough credits above the 20,000 reserve.");
console.log(JSON.stringify({ voice: voice.name, model: voice.model, linesToMake: todo.map(i => i + 1), characters, remainingBefore: remaining }));

const plain = s => s.replace(/\[[^\]]*\]\s*/g, "");
for (const i of todo) {
  const n = String(i + 1).padStart(2, "0"), line = lines[i];
  const text = line.tag ? `${line.tag} ${line.text}` : line.text;
  const body = {
    text, model_id: voice.model, seed: voice.seed + i,
    voice_settings: { stability: voice.stability, similarity_boost: voice.similarity },
    previous_text: i > 0 ? lines.slice(Math.max(0, i - 2), i).map(l => plain(l.text)).join(" ") : undefined,
    next_text: i < lines.length - 1 ? plain(lines[i + 1].text) : undefined,
  };
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice.id}/with-timestamps?output_format=mp3_44100_192`, {
    method: "POST", headers: { ...auth, "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(120000),
  });
  if (!r.ok) { console.log(`line ${n}: HTTP ${r.status}`, (await r.text()).slice(0, 300)); continue; }
  const json = await r.json();
  const audio = Buffer.from(json.audio_base64, "base64");
  const a = json.alignment;
  // Word timings for the spoken text only (the delivery tag is not spoken).
  const words = []; let word = "", start = 0, end = 0;
  const skip = line.tag ? line.tag.length + 1 : 0;
  a.characters.forEach((c, k) => {
    if (k < skip) return;
    if (/\s/.test(c)) { if (word) words.push({ word, start, end }); word = ""; }
    else { if (!word) start = a.character_start_times_seconds[k]; word += c; end = a.character_end_times_seconds[k]; }
  });
  if (word) words.push({ word, start, end });
  await writeFile(join(outDir, `line-${n}.mp3`), audio);

  // Transcribe it back to check every word was said.
  const form = new FormData();
  form.append("file", new Blob([audio], { type: "audio/mpeg" }), `line-${n}.mp3`);
  form.append("model_id", "scribe_v2");
  let heard = null;
  let t = await fetch("https://api.elevenlabs.io/v1/speech-to-text", { method: "POST", headers: auth, body: form, signal: AbortSignal.timeout(120000) });
  if (!t.ok) {
    const form1 = new FormData();
    form1.append("file", new Blob([audio], { type: "audio/mpeg" }), `line-${n}.mp3`);
    form1.append("model_id", "scribe_v1");
    t = await fetch("https://api.elevenlabs.io/v1/speech-to-text", { method: "POST", headers: auth, body: form1, signal: AbortSignal.timeout(120000) });
  }
  if (t.ok) heard = (await t.json()).text;
  else console.log(`line ${n}: transcript HTTP ${t.status}`, (await t.text()).slice(0, 200));

  const norm = s => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  const expected = norm(line.text), got = heard ? norm(heard) : "";
  await writeFile(join(outDir, `line-${n}.json`), JSON.stringify({ text: line.text, tag: line.tag, words, heard }, null, 1));
  const dur = words.at(-1)?.end ?? 0;
  console.log(JSON.stringify({ line: n, seconds: +dur.toFixed(2), firstWord: +(words[0]?.start ?? 0).toFixed(2), wordsPerSecond: +(words.length / Math.max(0.1, dur - (words[0]?.start ?? 0))).toFixed(2), match: expected === got, heard }));
}
const after = await (await fetch("https://api.elevenlabs.io/v1/user/subscription", { headers: auth, signal: AbortSignal.timeout(20000) })).json();
console.log(JSON.stringify({ remainingAfter: after.character_limit - after.character_count }));
