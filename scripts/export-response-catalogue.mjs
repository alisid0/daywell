import { readFile,writeFile } from 'node:fs/promises';
import { audioResponses,recordingFor } from '../lib/audio-library.ts';
const root = new URL('../public/audio-library/',import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json',root),'utf8'));
const entries = audioResponses.map(entry => ({...entry,recording: recordingFor(entry,manifest)?.src ?? null}));
await writeFile(new URL('response-catalogue.json',root),JSON.stringify({
  version:1, description:'Daywell prepared audio catalogue. 500 original comfort scripts and 1,000 new user-utterance / reply pairs.',
  note:'Examples are not an automatic intent router. Tool actions, personal answers and urgent requests need appropriate handling; playback must not imply an action has happened.',
  entries,
},null,2)+'\n');
console.log(JSON.stringify({exported:entries.length,questionPairs:entries.filter(entry=>entry.prompt).length,recorded:entries.filter(entry=>entry.recording).length}));
