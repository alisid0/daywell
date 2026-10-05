import { readFile, writeFile, mkdir, rename, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { audioResponses } from '../lib/audio-library.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'public', 'audio-library');
const manifestPath = join(output, 'manifest.json');
const args = process.argv.slice(2);
const option = (name, fallback) => { const index = args.indexOf(name); return index < 0 ? fallback : args[index + 1]; };
const limit = Number(option('--limit', '500'));
const maxCharacters = Number(option('--max-characters', '85000'));
if (!Number.isInteger(limit) || limit < 1 || limit > 500 || !Number.isFinite(maxCharacters) || maxCharacters <= 0 || maxCharacters > 85000) throw Error('Use a limit from 1 to 500 and a character cap up to 85000.');
const config = JSON.parse(await readFile(join(root, 'config', 'audio-generation.json'), 'utf8'));
const model = config.modelId;
const voice = config.voiceId;
if (!/^[a-zA-Z0-9_-]+$/.test(voice)) throw Error('Invalid configured voice.');
const settingsFor = entry => ({ stability: .65, similarity_boost: .75, style: 0, use_speaker_boost: false, speed: ['sleep', 'relax'].includes(entry.category) ? .9 : .97 });
const filename = entry => `${entry.id}-${createHash('sha256').update(JSON.stringify([entry.text, voice, model, settingsFor(entry)])).digest('hex').slice(0,12)}.mp3`;
let manifest = { version: 1, recordings: {} };
try { const saved = JSON.parse(await readFile(manifestPath, 'utf8')); if (saved.version === 1 && saved.recordings) manifest = saved; } catch (error) { if (error.code !== 'ENOENT') throw error; }
const pending = [];
for (const entry of audioResponses) {
  const saved = manifest.recordings[entry.id];
  let exists = false;
  if (saved?.text === entry.text && saved.src === `/audio-library/${filename(entry)}`) {
    try { exists = (await stat(join(output, filename(entry)))).size === saved.bytes && saved.bytes > 1000; } catch { /* Missing clips are regenerated. */ }
  }
  if (!exists) pending.push(entry);
}
const batch = pending.slice(0,limit);
const characters = batch.reduce((sum,entry) => sum + entry.text.length, 0);
console.log(JSON.stringify({ totalScripts: audioResponses.length, totalCharacters: audioResponses.reduce((sum,e)=>sum+e.text.length,0), ready: audioResponses.length-pending.length, toGenerate: batch.length, characters, model, maximumCharacters: maxCharacters }));
if (characters > maxCharacters) throw Error('This batch exceeds the character cap. No generation started.');
if (!args.includes('--generate') || !batch.length) process.exit(0);

// Secrets remain in this local process; never write them to assets, reports or logs.
let vars = '';
if (!process.env.ELEVENLABS_API_KEY) {
  try { vars = await readFile(join(root, '.dev.vars'), 'utf8'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
const match = vars.match(/^ELEVENLABS_API_KEY=(.+)$/m);
const key = (process.env.ELEVENLABS_API_KEY || match?.[1] || '').trim().replace(/^"|"$/g,'');
if (!key) throw Error('Save your private voice key first.');
const headers = { 'xi-api-key': key };
async function allowance() {
  const response = await fetch('https://api.elevenlabs.io/v1/user/subscription', { headers, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw Error(`Could not verify existing allowance (HTTP ${response.status}). No new batch started.`);
  const subscription = await response.json();
  if (!['starter','creator','pro','scale','business','enterprise'].includes(subscription.tier) || subscription.status !== 'active') throw Error('An active paid plan is required for commercial recordings.');
  const remaining = Number(subscription.character_limit) - Number(subscription.character_count);
  if (!Number.isFinite(remaining)) throw Error('Could not verify the remaining allowance.');
  return remaining;
}
const initialRemaining = await allowance();
if (initialRemaining < characters + 20000) throw Error('Existing credits do not cover this batch plus the 20000-credit reserve. No upgrade or overage has been requested.');
console.log(JSON.stringify({ generation: 'starting', existingCreditsRemaining: initialRemaining, reservedCredits: 20000 }));
await mkdir(output, { recursive: true });
async function flush() {
  const temp = join(output, 'manifest.next.json');
  await writeFile(temp, JSON.stringify(manifest, null, 2) + '\n');
  await rename(temp, manifestPath);
}
let completed = 0;
for (let start = 0; start < batch.length; start += 3) {
  const chunk = batch.slice(start,start+3);
  if (start % 30 === 0) {
    const required = batch.slice(start,start+30).reduce((sum,e)=>sum+e.text.length,0);
    if (await allowance() < required + 20000) throw Error('Allowance reserve reached. Completed clips are saved; no overage requested.');
  }
  const results = await Promise.allSettled(chunk.map(async entry => {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_64`, {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text: entry.text, model_id: model, voice_settings: settingsFor(entry) }), signal: AbortSignal.timeout(60000),
    });
    // Do not retry ambiguous paid requests automatically. A rerun resumes only missing files.
    if (!response.ok) throw Error(`Clip ${entry.id} failed (HTTP ${response.status}).`);
    const data = Buffer.from(await response.arrayBuffer());
    if (!response.headers.get('content-type')?.includes('audio/') || data.length < 1000) throw Error(`Invalid audio returned for ${entry.id}.`);
    const file = filename(entry);
    await writeFile(join(output, file), data);
    manifest.recordings[entry.id] = { src: `/audio-library/${file}`, text: entry.text, bytes: data.length };
    completed++;
  }));
  await flush();
  const failed = results.find(r=>r.status === 'rejected');
  if (failed) throw failed.reason;
  if (completed % 30 === 0 || completed === batch.length) console.log(JSON.stringify({ generatedThisRun: completed, savedClips: Object.keys(manifest.recordings).length }));
}
const finalRemaining = await allowance();
console.log(JSON.stringify({ complete: true, generatedThisRun: completed, savedClips: Object.keys(manifest.recordings).length, accountCreditsUsedDuringRun: initialRemaining-finalRemaining, remainingCredits: finalRemaining }));
