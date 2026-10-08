import { readFile, writeFile, mkdir, rename, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { guidedSessions, sessionTranscript } from '../lib/guided-sessions.ts';

const run = promisify(execFile), root = join(dirname(fileURLToPath(import.meta.url)),'..');
const config = JSON.parse(await readFile(join(root,'config/guided-audio-generation.json'),'utf8'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0,12);
const output = join(root,'public/guided-audio'), cache = join(root,'work/guided-audio'), manifestPath = join(output,'manifest.json');
const args = process.argv.slice(2), selectedId = args.includes('--session') ? args[args.indexOf('--session')+1] : null;
const sessions = selectedId ? guidedSessions.filter(session=>!session.voices && session.id===selectedId) : guidedSessions.filter(session=>!session.voices);
if(!sessions.length) throw Error('Unknown session.');
let manifest = {version:1, recordings:{}};
try { manifest=JSON.parse(await readFile(manifestPath,'utf8')); } catch(error) { if(error.code!=='ENOENT') throw error; }
const narration = segment => `${segment.delivery} ${segment.text}`;
const characters = sessions.reduce((sum,session)=>sum+session.segments.reduce((n,s)=>n+narration(s).length,0),0);
if(characters>12000 || !/^[a-zA-Z0-9_-]+$/.test(config.voiceId) || config.modelId!=='eleven_v4') throw Error('Generation configuration exceeds the approved scope.');
console.log(JSON.stringify({sessions:sessions.map(s=>s.id),maximumCharacters:characters,model:config.modelId}));
if(!args.includes('--generate')) process.exit(0);
// Verify the local assembler before spending any speech credits.
await run('ffmpeg',['-version'],{windowsHide:true}); await run('ffprobe',['-version'],{windowsHide:true});
let vars='';
if(!process.env.ELEVENLABS_API_KEY) { try { vars=await readFile(join(root,'.dev.vars'),'utf8'); } catch(error) { if(error.code!=='ENOENT')throw error; } }
const key=(process.env.ELEVENLABS_API_KEY || vars.match(/^ELEVENLABS_API_KEY=(.+)$/m)?.[1] || '').trim().replace(/^"|"$/g,'');
if(!key)throw Error('Save your private ElevenLabs key first.');
const headers={'xi-api-key':key};
async function allowance() {
  const response=await fetch('https://api.elevenlabs.io/v1/user/subscription',{headers,signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error(`Allowance lookup failed (HTTP ${response.status}).`);
  const plan=await response.json(), remaining=Number(plan.character_limit)-Number(plan.character_count);
  if(plan.status!=='active'||plan.tier==='free'||!Number.isFinite(remaining))throw Error('An active commercial plan and verifiable allowance are required.');
  return remaining;
}
const before=await allowance();
if(before < characters*2+20000)throw Error('Insufficient included credits for this batch and the 20,000-credit reserve.');
await mkdir(output,{recursive:true}); await mkdir(cache,{recursive:true});
for(const session of sessions) {
  const file=`${session.id}-${hash([session,config,'assembly-v1'])}.mp3`, destination=join(output,file);
  const saved=manifest.recordings[session.id];
  if(saved?.src===`/guided-audio/${file}` && saved.transcript===sessionTranscript(session)) {
    try { if((await stat(destination)).size===saved.bytes) { console.log(`${session.id}: already recorded`); continue; } } catch { /* Restore missing output from cached narration. */ }
  }
  if(await allowance()<session.segments.reduce((n,s)=>n+narration(s).length*2,0)+20000)throw Error('Included-credit reserve reached.');
  const parts=[], timings=[];
  for(const [index,segment] of session.segments.entries()) {
    const source=join(cache,`${session.id}-${index}-${hash([narration(segment),config])}.mp3`);
    let exists=false; try { exists=(await stat(source)).size>1000; } catch { /* Generate this missing narration once. */ }
    if(!exists) {
      const response=await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${config.voiceId}?output_format=mp3_44100_128`,{
        method:'POST',headers:{...headers,'Content-Type':'application/json',Accept:'audio/mpeg'},
        body:JSON.stringify({text:narration(segment),model_id:config.modelId,voice_settings:config.voiceSettings}),signal:AbortSignal.timeout(90000),
      });
      if(!response.ok)throw Error(`Narration ${session.id}/${index} failed (HTTP ${response.status}); no automatic retry.`);
      const buffer=Buffer.from(await response.arrayBuffer());
      if(buffer.length<1000||!response.headers.get('content-type')?.includes('audio/'))throw Error('Provider did not return valid audio.');
      await writeFile(source,buffer);
    }
    const probe=await run('ffprobe',['-v','error','-show_entries','format=duration','-of','json',source],{windowsHide:true});
    const duration=Number(JSON.parse(probe.stdout).format.duration), slot=(session.segments[index+1]?.at??session.seconds)-segment.at;
    // Never chop words to hit a timer. Leave at least one second after every spoken passage.
    if(!Number.isFinite(duration)||duration<=0||duration>slot-1)throw Error(`Narration ${session.id}/${index} needs a longer slot (${duration}s). Cached narration is preserved.`);
    const padded=join(cache,`${session.id}-${index}-padded.wav`);
    await run('ffmpeg',['-nostdin','-v','error','-y','-i',source,'-af',`apad=whole_dur=${slot},atrim=duration=${slot}`,'-ar','44100','-ac','1',padded],{windowsHide:true});
    parts.push(padded); timings.push({at:segment.at,end:Number((segment.at+duration).toFixed(3))});
  }
  const inputs=parts.flatMap(path=>['-i',path]), labels=parts.map((_,i)=>`[${i}:a]`).join('');
  await run('ffmpeg',['-nostdin','-v','error','-y',...inputs,'-filter_complex',`${labels}concat=n=${parts.length}:v=0:a=1[out]`,'-map','[out]','-c:a','libmp3lame','-b:a','96k',destination],{windowsHide:true});
  await run('ffmpeg',['-nostdin','-v','error','-xerror','-i',destination,'-f','null','-'],{windowsHide:true});
  const probe=await run('ffprobe',['-v','error','-show_entries','format=duration','-of','json',destination],{windowsHide:true});
  const seconds=Number(JSON.parse(probe.stdout).format.duration);
  if(Math.abs(seconds-session.seconds)>.2)throw Error('Assembled session duration does not match its timeline.');
  manifest.recordings[session.id]={src:`/guided-audio/${file}`,transcript:sessionTranscript(session),seconds,bytes:(await stat(destination)).size,model:config.modelId,segments:timings};
  await writeFile(join(output,'manifest.next.json'),JSON.stringify(manifest,null,2)+'\n');
  await rename(join(output,'manifest.next.json'),manifestPath);
  console.log(JSON.stringify({ready:session.id,seconds,spokenSegments:parts.length}));
}
console.log(JSON.stringify({complete:true,accountCreditsUsedSoFar:before-await allowance(),note:'Provider usage can take time to settle.'}));
