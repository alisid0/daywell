import { readFile,writeFile } from 'node:fs/promises';
import { audioResponses,recordingFor } from '../lib/audio-library.ts';
const root = new URL('../public/audio-library/',import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json',root),'utf8'));
const entries = audioResponses.map(entry => ({...entry,recording: recordingFor(entry,manifest)?.src ?? null}));
await writeFile(new URL('response-catalogue.json',root),JSON.stringify({
  version:1, description:`Daywell general-wellness audio catalogue: ${entries.length} published recordings.`,
  note:'Examples are not an automatic intent router. Medical and crisis examples are excluded. App actions require explicit confirmation; playback must not imply an action has happened.',
  entries,
},null,2)+'\n');
console.log(JSON.stringify({exported:entries.length,questionPairs:entries.filter(entry=>entry.prompt).length,recorded:entries.filter(entry=>entry.recording).length}));
