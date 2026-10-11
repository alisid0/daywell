// Plans or generates Daywell's looping sleep sounds with ElevenLabs sound effects (loop mode, up to 30 seconds).
// Without --generate it prints the plan and the most it could cost. With --generate it makes review candidates in
// work/sleep-sounds/ (git-ignored); approved files are copied into public/sleep-sounds/ separately.
// Secrets stay in this local process: never write them to files, reports or logs.
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(await readFile(join(root, 'config/sleep-sounds.json'), 'utf8'));
const output = join(root, 'work/sleep-sounds'), reportPath = join(output, 'candidates.json');
const args = process.argv.slice(2), only = args.includes('--sound') ? args[args.indexOf('--sound') + 1] : null;
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 12);
const jobs = config.sounds.filter(sound => !only || sound.id === only).flatMap(sound => sound.variants.map((prompt, index) => {
  const request = { text: prompt, duration_seconds: config.seconds, prompt_influence: sound.promptInfluence ?? config.promptInfluence, loop: true, model_id: config.model };
  const variant = String.fromCharCode(65 + index);
  return { id: sound.id, title: sound.title, variant, request, file: `${sound.id}-${variant.toLowerCase()}-${hash({ request, format: config.outputFormat })}.mp3` };
}));
if (!jobs.length) throw Error('Unknown sound.');
if (config.model !== 'eleven_text_to_sound_v2' || config.seconds > 30 || jobs.length > 12) throw Error('Generation configuration exceeds the approved scope.');
const ready = async file => { try { return (await stat(join(output, file))).size > 1000; } catch { return false; } };
const pending = [];
for (const job of jobs) if (!await ready(job.file)) pending.push(job);
const maximumCredits = pending.length * config.seconds * config.maxCreditsPerSecond;
console.log(JSON.stringify({ sounds: [...new Set(jobs.map(job => job.id))], candidates: jobs.length, toGenerate: pending.length, secondsEach: config.seconds, loop: true, model: config.model, maximumCredits }, null, 2));
if (!args.includes('--generate') || !pending.length) process.exit(0);

let vars = '';
if (!process.env.ELEVENLABS_API_KEY) { try { vars = await readFile(join(root, '.dev.vars'), 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; } }
const key = (process.env.ELEVENLABS_API_KEY || vars.match(/^ELEVENLABS_API_KEY=(.+)$/m)?.[1] || '').trim().replace(/^"|"$/g, '');
if (!key) throw Error('Save your private ElevenLabs key first.');
const headers = { 'xi-api-key': key };
// Returns null when the key isn't allowed to read the plan (no user_read permission); the batch cap still applies.
async function creditsLeft() {
  const response = await fetch('https://api.elevenlabs.io/v1/user/subscription', { headers, signal: AbortSignal.timeout(20000) });
  if (response.status === 401 && (await response.text()).includes('user_read')) return null;
  if (!response.ok) throw Error(`Could not check the plan (HTTP ${response.status}). Nothing was generated.`);
  const plan = await response.json();
  if (!['starter', 'creator', 'pro', 'scale', 'business', 'enterprise'].includes(plan.tier) || plan.status !== 'active') throw Error('An active paid plan is needed for sounds Daywell can use commercially. Nothing was generated.');
  return Number(plan.character_limit) - Number(plan.character_count);
}
const before = await creditsLeft();
if (before === null) console.log('This key cannot read the plan, so credits were not checked. Generating within the batch cap.');
else if (!Number.isFinite(before) || before < maximumCredits + config.reserveCredits) throw Error('Credits left do not cover this batch plus the reserve. Nothing was generated.');
await mkdir(output, { recursive: true });
let report = { candidates: {} };
try { report = JSON.parse(await readFile(reportPath, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
for (const job of pending) {
  const response = await fetch(`https://api.elevenlabs.io/v1/sound-generation?output_format=${config.outputFormat}`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(job.request), signal: AbortSignal.timeout(120000) });
  if (!response.ok) throw Error(`${job.id} ${job.variant}: HTTP ${response.status} ${(await response.text()).slice(0, 300)}`);
  const audio = Buffer.from(await response.arrayBuffer());
  if (audio.length < 1000) throw Error(`${job.id} ${job.variant}: the reply was too small to be audio.`);
  await writeFile(join(output, job.file), audio);
  report.candidates[job.file] = { id: job.id, title: job.title, variant: job.variant, prompt: job.request.text, seconds: config.seconds, bytes: audio.length, generatedAt: new Date().toISOString() };
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
  console.log(`saved ${job.id} ${job.variant} (${Math.round(audio.length / 1024)} KB)`);
}
const after = await creditsLeft();
const used = before === null || after === null ? null : before - after;
report.lastRun = { generated: pending.length, credits: used, at: new Date().toISOString() };
await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ generated: pending.length, creditsUsed: used ?? 'not readable with this key', creditsLeft: after ?? 'not readable with this key' }));
