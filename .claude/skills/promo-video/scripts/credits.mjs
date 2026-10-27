// Shows the ElevenLabs plan and the credits left, without printing the key. It reads ELEVENLABS_API_KEY from the
// Daywell checkout's .dev.vars (git-ignored). This is a free account call; it doesn't use credits.
//   node tools/credits.mjs
import { readFileSync } from "node:fs";
import { SECRETS } from "./paths.mjs";

const key = readFileSync(SECRETS, "utf8").match(/^ELEVENLABS_API_KEY\s*=\s*"?([^"\r\n]+)"?/m)?.[1];
if (!key) throw Error("No ELEVENLABS_API_KEY in .dev.vars");
const res = await fetch("https://api.elevenlabs.io/v1/user/subscription", { headers: { "xi-api-key": key } });
if (!res.ok) throw Error(`ElevenLabs answered ${res.status}`);
const s = await res.json();
const left = s.character_limit - s.character_count;
console.log(`plan: ${s.tier} (${s.status})`);
console.log(`credits used: ${s.character_count.toLocaleString("en-GB")} of ${s.character_limit.toLocaleString("en-GB")} (${left.toLocaleString("en-GB")} left)`);
console.log(`resets: ${new Date(s.next_character_count_reset_unix * 1000).toISOString().slice(0, 10)}`);
console.log(`can go over the allowance: ${s.allowed_to_extend_character_limit ? "yes" : "no"}`);
