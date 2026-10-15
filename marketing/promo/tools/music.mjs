// Composes a film's music with ElevenLabs Music from its music-plan.json (one chunk per group of scenes).
//   node tools/music.mjs [--film=shorts/eat] [path to .dev.vars, or "-" for the repo's] [take name, default "take1"] [seed]
// Writes <film>/audio/music/<take>.mp3 and never overwrites an earlier take. The key is never printed.
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { SECRETS, filmRoot, filmFile, args } from "./paths.mjs";

const [varsArg, take = "take1", seedArg] = args;
const varsPath = varsArg && varsArg !== "-" ? varsArg : SECRETS;
const plan = JSON.parse(await readFile(filmFile("music-plan.json"), "utf8"));
const out = join(filmRoot, "audio", "music", `${take}.mp3`);
try { await stat(out); throw Error(`${take} already exists; pick a new take name.`); } catch (e) { if (e.code !== "ENOENT") throw e; }

const vars = await readFile(varsPath, "utf8");
const key = (vars.match(/^ELEVENLABS_API_KEY=(.+)$/m)?.[1] || "").trim().replace(/^"|"$/g, "");
if (!key) throw Error("No key saved");
const auth = { "xi-api-key": key };
const sub = await (await fetch("https://api.elevenlabs.io/v1/user/subscription", { headers: auth, signal: AbortSignal.timeout(20000) })).json();
const remaining = sub.character_limit - sub.character_count;
if (!["starter", "creator", "pro", "scale", "business", "enterprise"].includes(sub.tier) || sub.status !== "active") throw Error("A paid plan is needed for commercial use.");
if (!(remaining >= 30000)) throw Error("Not enough credits above the 20,000 reserve.");
const total = plan.chunks.reduce((s, c) => s + c.duration_ms, 0);
console.log(JSON.stringify({ take, model: plan.model_id, seconds: total / 1000, chunks: plan.chunks.length, remainingBefore: remaining }));

const body = { composition_plan: { chunks: plan.chunks }, model_id: plan.model_id, seed: seedArg ? Number(seedArg) : plan.seed };
const r = await fetch("https://api.elevenlabs.io/v1/music?output_format=mp3_48000_192", {
  method: "POST", headers: { ...auth, "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(600000),
});
if (!r.ok) { console.log("HTTP", r.status, (await r.text()).slice(0, 1500)); process.exit(1); }
const audio = Buffer.from(await r.arrayBuffer());
await mkdir(join(filmRoot, "audio", "music"), { recursive: true });
await writeFile(out, audio);
const songId = r.headers.get("song-id") || r.headers.get("x-song-id");
const after = await (await fetch("https://api.elevenlabs.io/v1/user/subscription", { headers: auth, signal: AbortSignal.timeout(20000) })).json();
console.log(JSON.stringify({ wrote: `audio/music/${take}.mp3`, bytes: audio.length, songId, remainingAfter: after.character_limit - after.character_count }));
