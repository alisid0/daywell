import relax from '../content/audio-expansion/relax.json' with { type: 'json' };
import sleep from '../content/audio-expansion/sleep.json' with { type: 'json' };
import move from '../content/audio-expansion/move.json' with { type: 'json' };
import eat from '../content/audio-expansion/eat.json' with { type: 'json' };
import focus from '../content/audio-expansion/focus.json' with { type: 'json' };
import progress from '../content/audio-expansion/progress.json' with { type: 'json' };
import everyday from '../content/audio-expansion/everyday.json' with { type: 'json' };
import type { AudioCategory, AudioGroup, AudioHandling } from './audio-library.ts';
import type { CompanionId } from './companions.ts';

type AuthoredGroup = { id: string; category: AudioCategory; title: string; companion: CompanionId; responseIds?: string[]; examples: [string, string, AudioHandling?][] };
const authored = [...relax, ...sleep, ...move, ...eat, ...focus, ...progress, ...everyday] as AuthoredGroup[];
// Explicit IDs preserve existing recordings when an out-of-scope example is retired.
export const expandedAudioGroups: AudioGroup[] = authored.map(({examples,responseIds,...group}) => ({...group, responses: examples.map(([prompt,text,handling = 'recorded'],index) => ({
  id: responseIds?.[index] ?? `${group.id}-${String(index+1).padStart(2,'0')}`, groupId: group.id, category: group.category,
  title: group.title, companion: group.companion, prompt, text, handling,
}))}));
