export type SoundRequest = { type: 'sounds'; intent: 'suggest' | 'open'; music: boolean; area?: 'sleep' | 'relax' };
export type SoundFocus = { id: number; music: boolean };

// Whole requests only: a song mentioned inside another task must not change its meaning.
export function soundRequest(text: string): SoundRequest | null {
  const request = text.toLowerCase().replace(/[’]/g, "'");
  const singing = /^(?:(?:can|could|would|will) you )?(?:sing(?: (?:me )?(?:(?:a |one |some )?(?:song|lullaby)|something))?(?: (?:to|for) me)?|sing me to sleep)(?: (?:to help me sleep|for bedtime))?$/.test(request);
  const song = /^(?:(?:can|could|would|will) you )?(?:play(?: me)?|i(?:'d| would) like|i want) (?:a |some )?(?:song|songs|lullaby|lullabies)(?: (?:for me|to help me sleep|for bedtime))?$/.test(request);
  const suggestion = /^suggest (?:sleep sounds|relaxing sounds|music)$/.test(request);
  if (singing || song || suggestion) return { type: 'sounds', intent: 'suggest', music: true, ...(/sleep|bedtime|lullab/.test(request) ? { area: 'sleep' as const } : {}) };
  const open = request.match(/^(?:(?:can|could|would|will) you )?(?:open|show(?: me)?|play|put on|listen to)(?: (?:some|the))? (sleep sounds|sounds for sleep|relaxing sounds|nature sounds|gentle music|relaxing music|music)(?: (?:in|under) (sleep|relax))?$/);
  if (!open) return null;
  return { type: 'sounds', intent: 'open', music: open[1].includes('music'), area: open[2] as 'sleep' | 'relax' | undefined || (open[1].includes('sleep') ? 'sleep' : undefined) };
}

export const soundSuggestion = 'I don’t have sung songs to play. You can choose gentle pan flute, temple drum or nature sounds in Sleep and Relax.';
