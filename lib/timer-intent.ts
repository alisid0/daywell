const amounts: Record<string,number> = { a:1, an:1, one:1, two:2, three:3, four:4, five:5, ten:10, fifteen:15, twenty:20, thirty:30, forty:40, fortyfive:45, sixty:60, ninety:90 };
export function timerMinutes(input: string): number | null {
  let value = input.toLowerCase().trim().replace(/-/g,' ').replace(/forty five/g,'fortyfive');
  if (/^(?:half an? hour|half hour)$/.test(value)) return 30;
  value = value.replace(/\b(a|an|one|two|three|four|five|ten|fifteen|twenty|thirty|forty|fortyfive|sixty|ninety)\b/g, word => String(amounts[word]));
  const match = value.match(/^(?:(\d+)\s*(?:hours?|hrs?|h)(?:\s+(?:and\s+)?)?)?(?:(\d+)\s*(?:minutes?|mins?|m))?$/);
  if (!match || (!match[1] && !match[2])) return null;
  const minutes = Number(match[1] || 0) * 60 + Number(match[2] || 0);
  return Number.isInteger(minutes) && minutes >= 1 && minutes <= 240 ? minutes : null;
}
export function timerIntent(text: string): { title: string; minutes: number } | null {
  const explicit = text.match(/^(?:set|start)(?: me)?(?: a)? timer for (.+)$/i) || text.match(/^(?:set|start)(?: a)? (.+) timer$/i);
  if (explicit) { const minutes = timerMinutes(explicit[1]); return minutes ? {title:'Your timer',minutes} : null; }
  const activity = text.match(/^(?:(?:i (?:want|would like|would want|plan) to|i[’']d like to|i(?: am|[’']m) going to|let me|help me) )?((?:play|watch|read) .+?) for (.+)$/i);
  if (!activity || /\b(?:and|then|tomorrow|next|not|don[’']t|yesterday)\b/i.test(activity[1]) || activity[1].length > 160) return null;
  const minutes = timerMinutes(activity[2]);
  return minutes ? {title:activity[1].charAt(0).toUpperCase()+activity[1].slice(1),minutes} : null;
}
