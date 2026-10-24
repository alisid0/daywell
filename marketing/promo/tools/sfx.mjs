// Makes the promo's sound effects with ElevenLabs from tools/sfx-list.json, skipping any already in audio/sfx.
//   node tools/sfx.mjs <path to .dev.vars>
// Then measures each file (length, peak) so quiet ones can be levelled in the mix. The key is never printed.
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { FFMPEG } from "./ffmpeg-path.mjs";
import { SECRETS } from "./paths.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const list = JSON.parse(await readFile(join(root, "tools", "sfx-list.json"), "utf8"));
const dir = join(root, "audio", "sfx");
await mkdir(dir, { recursive: true });
const missing = [];
for (const s of list.sounds) { try { await stat(join(dir, `${s.id}.mp3`)); } catch { missing.push(s); } }

if (missing.length) {
  const vars = await readFile(process.argv[2] || SECRETS, "utf8");
  const key = (vars.match(/^ELEVENLABS_API_KEY=(.+)$/m)?.[1] || "").trim().replace(/^"|"$/g, "");
  if (!key) throw Error("No key saved");
  const auth = { "xi-api-key": key };
  const sub = await (await fetch("https://api.elevenlabs.io/v1/user/subscription", { headers: auth, signal: AbortSignal.timeout(20000) })).json();
  if (!["starter", "creator", "pro", "scale", "business", "enterprise"].includes(sub.tier) || sub.status !== "active") throw Error("A paid plan is needed for commercial use.");
  if (!(sub.character_limit - sub.character_count >= 21000)) throw Error("Not enough credits above the 20,000 reserve.");
  for (const s of missing) {
    const body = JSON.stringify({ text: s.text, duration_seconds: s.seconds, prompt_influence: list.prompt_influence, model_id: list.model_id });
    const r = await fetch("https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128", { method: "POST", headers: { ...auth, "Content-Type": "application/json" }, body, signal: AbortSignal.timeout(90000) });
    if (!r.ok) { console.log(s.id, "HTTP", r.status, (await r.text()).slice(0, 200)); continue; }
    await writeFile(join(dir, `${s.id}.mp3`), Buffer.from(await r.arrayBuffer()));
    console.log("made", s.id);
  }
}
for (const s of list.sounds) {
  const out = spawnSync(FFMPEG, ["-hide_banner", "-i", join(dir, `${s.id}.mp3`), "-af", "volumedetect", "-f", "null", "-"], { encoding: "utf8" }).stderr;
  const dur = out.match(/Duration: ([0-9:.]+)/)?.[1], peak = out.match(/max_volume: (-?[0-9.]+)/)?.[1], mean = out.match(/mean_volume: (-?[0-9.]+)/)?.[1];
  console.log(s.id.padEnd(10), dur, "peak", peak, "mean", mean);
}
