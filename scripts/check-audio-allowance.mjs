// Read-only preflight. Keep credentials out of reports and logs.
import { readFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const config = JSON.parse(await readFile(new URL('config/audio-generation.json', root), 'utf8'));
let key = process.env.ELEVENLABS_API_KEY;
if (!key) {
  const text = await readFile(new URL('.dev.vars', root), 'utf8');
  key = text.match(/^ELEVENLABS_API_KEY=(.+)$/m)?.[1]?.trim().replace(/^"|"$/g, '');
}
if (!key) throw Error('No local voice key configured.');
const response = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
  headers: { 'xi-api-key': key }, signal: AbortSignal.timeout(20000),
});
if (!response.ok) throw Error(`Allowance check failed (HTTP ${response.status}).`);
const info = await response.json();
console.log(JSON.stringify({ tier: info.tier, status: info.status, creditsUsed: info.character_count,
  creditsLimit: info.character_limit, creditsRemaining: Number(info.character_limit) - Number(info.character_count),
  resetUnix: info.next_character_count_reset_unix, model: config.modelId, reserve: 20000 }));
if (process.argv.includes('--voices')) {
  const response = await fetch('https://api.elevenlabs.io/v1/voices', { headers: { 'xi-api-key': key }, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw Error(`Voice list failed (HTTP ${response.status}).`);
  const data = await response.json();
  console.log(JSON.stringify({ voices: data.voices.filter(v => v.category === 'premade').map(v => ({ id:v.voice_id, name:v.name, labels:v.labels, description:v.description })) }));
}
