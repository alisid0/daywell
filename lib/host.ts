import type { Entry, Kind } from "./daywell";
import { wellnessBoundary } from "./wellness-scope.ts";
import { timerIntent } from "./timer-intent.ts";

export type SupportLevel = "quiet" | "occasional" | "guided";
export type ActivityCompanion = "pip" | "luma" | "bounce" | "tock";
export type HostAction =
  | { type: "grocery"; titles: string[] }
  | { type: "task"; title: string }
  | { type: "activity"; companion: ActivityCompanion; title: string; minutes: number }
  | { type: "alarm"; time: string };
export type HostRequest =
  | { type: "timer-status" }
  | { type: "plan"; actions: HostAction[] }
  | { type: "control"; command: "confirm" | "cancel" | "undo" | "changes" | "pause" | "resume" | "end" }
  | { type: "support"; level: SupportLevel }
  | { type: "reply"; message: string }
  | { type: "open"; module: string; kind?: Kind; view?: "plan" | "history" }
  | { type: "unknown"; message: string };

const numbers: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, fifteen: 15, twenty: 20, "twenty five": 25, thirty: 30, forty: 40, "forty five": 45, sixty: 60 };
const unknown = (message = 'Try “Add milk to my list”, “Focus on my email for ten minutes”, or “Help me wind down”. Nothing has changed.') : HostRequest => ({ type: "unknown", message });

// Intentionally bounded commands: an unsupported clause never silently becomes a saved task.
export function parseHostRequest(input: string): HostRequest {
  let text = input.trim().replace(/\s+/g, " ").replace(/[.!?]+$/, "").trim();
  if (!text || text.length > 600) return unknown("Use a short request of up to 600 characters. Nothing has changed.");
  const boundary = wellnessBoundary(text);
  if (boundary) return { type: "reply", message: boundary };
  // Only complete social phrases are replies. Never swallow an accompanying task.
  if (/^(?:(?:hello|hi|hey)(?:[ ,]+(?:there|daywell))?|good (?:morning|afternoon|evening)(?:[ ,]+daywell)?|daywell)$/i.test(text)) {
    return { type: "reply", message: "Hello! I’m here. Would you like a quiet moment, or a little help with your day? You can say “Help me wind down” or choose Just rest." };
  }
  text = text.replace(/^(?:(?:hello|hi|hey)(?:[ ,]+daywell)?[ ,]+|daywell[ ,]+)/i, "").replace(/^please /i, "").replace(/ please$/i, "");
  if (/^(?:thanks|thank you)(?:[ ,]+daywell| so much)?$/i.test(text)) return { type: "reply", message: "You’re welcome. Take your time—I’m here when you need a hand." };
  if (/^(?:are you there|can you hear me|is this working)$/i.test(text)) return { type: "reply", message: "I received your message. You can type here, or tap Talk to Daywell to try voice." };
  if (/^(?:help|what can you do|how (?:do i|can i) (?:start|use (?:this|daywell)))$/i.test(text)) return { type: "reply", message: "We can start small: try “Help me wind down”, “Focus for ten minutes”, or “Show my calendar”. Move, Eat, Sleep and Relax are below. Choose Just rest if you only need a pause." };
  if (/^(?:how (?:much|long)(?: time)? (?:is left|left|remaining)(?: on (?:my|the) timer)?|is (?:my|the) timer (?:running|on|paused)|what(?:[’']s| is) (?:my|the) (?:current )?timer(?: status)?|timer status|do i have (?:an? )?(?:active |running )?timer)$/i.test(text)) return { type: "timer-status" };
  const timed = timerIntent(text);
  if (timed) return { type: "plan", actions: [{type:"activity",companion:"tock",...timed}] };
  const controls: [RegExp, "confirm" | "cancel" | "undo" | "changes" | "pause" | "resume" | "end"][] = [
    [/^(yes|yes please|confirm|do it|do this|go ahead|save it)$/i, "confirm"],
    [/^(no|cancel|never mind|nevermind)$/i, "cancel"], [/^undo(?: that| last change)?$/i, "undo"],
    [/^(what did you change|what changed|show (?:my |the )?changes)$/i, "changes"],
    [/^(stop|pause)(?: that| the timer| the activity| my activity)?$/i, "pause"],
    [/^(resume|continue)(?: the timer| the activity| my activity)?$/i, "resume"],
    [/^(end|finish)(?: the timer| the activity| my activity| session)$/i, "end"],
  ];
  for (const [pattern, command] of controls) if (pattern.test(text)) return { type: "control", command };
  if (/^(stay quiet|be quiet|quiet please|no encouragement)$/i.test(text)) return { type: "support", level: "quiet" };
  if (/^(encourage me occasionally|check in halfway|a little encouragement)$/i.test(text)) return { type: "support", level: "occasional" };
  if (/^(guide me(?: through this)?|more encouragement)$/i.test(text)) return { type: "support", level: "guided" };
  if (/^(?:(?:show|open)(?: my| the)? (?:calendar|schedule)|what[’']?s coming up)$/i.test(text)) return { type: "open", module: "calendar", view: "plan" };
  if (/^(?:(?:show|open)(?: my| the)? (?:history|progress)|look back)$/i.test(text)) return { type: "open", module: "calendar", view: "history" };
  if (/^(?:add|plan|schedule)(?: an?)? (?:event|appointment)$/i.test(text)) return { type: "open", module: "calendar", kind: "event", view: "plan" };
  if (/^(?:add|write)(?: a)? (?:reflection|note)$/i.test(text)) return { type: "open", module: "calendar", kind: "reflection", view: "history" };
  const destinations: [RegExp, string, Kind?][] = [
    [/^(show|open)(?: my| the)? (shopping|grocery|groceries)( list)?$/i, "grocery"],
    [/^(show|open)(?: my| the)? (tasks|priorities)$/i, "focus"],
    [/^(log|record|add)(?: a| my)? (meal|food)$/i, "food", "food"],
    [/^(log|record)(?: my)? sleep$/i, "sleep", "sleep"],
    [/^(log|record)(?: a| my)? (workout|movement|walk)$/i, "move", "move"],
    [/^(set|add)(?: an?)? alarm$/i, "alarm", "alarm"],
    [/^(show|open)(?: my| the)? alarms$/i, "alarm"],
  ];
  for (const [pattern, module, kind] of destinations) if (pattern.test(text)) return { type: "open", module, kind };
  text = text.replace(/\b(twenty five|forty five|one|two|three|four|five|six|seven|eight|nine|ten|fifteen|twenty|thirty|forty|sixty)\b(?=\s*(?:-|\s)\s*min(?:ute)?s?\b)/gi, value => String(numbers[value.toLowerCase()]));
  const clauses = text.split(/\s+(?:and then|then|and)\s+(?=(?:please )?(?:add\b|buy\b|focus\b|help me\b|start\b|set\b|remind\b|log\b|record\b|don't\b|do not\b|cancel\b|stop\b|show\b))/i);
  const actions: HostAction[] = [];
  for (const raw of clauses) {
    const clause = raw.replace(/^please /i, "").trim();
    let match: RegExpMatchArray | null;
    if ((match = clause.match(/^add (?:a )?(?:task|priority)(?: called| to)?[: ]+(.+)$/i)) || (match = clause.match(/^add (.+) to (?:my |the )?(?:tasks|priorities|to-do list)$/i))) {
      if (match[1].length > 160) return unknown("Keep your task title under 160 characters.");
      actions.push({ type: "task", title: match[1] });
    } else if ((match = clause.match(/^(?:add|buy) (.+?)(?: to (?:my |the )?(?:shopping |grocery )?list)?$/i))) {
      if (/\b(?:then|tomorrow|next week|don't|do not|remind|focus|workout|alarm)\b/i.test(match[1])) return unknown();
      const titles = match[1].split(/,\s*(?:and\s+)?|\s+and\s+/i).map(x => x.trim()).filter(Boolean);
      if (!titles.length || titles.length > 15 || titles.some(x => x.length > 160 || / to (?:my|the) /i.test(x))) return unknown();
      actions.push({ type: "grocery", titles });
    } else if ((match = clause.match(/^(?:help me |start )?focus(?: on (.+?))?(?: for (\d+)\s*(?:-|\s)?\s*min(?:ute)?s?)?$/i))) {
      actions.push({ type: "activity", companion: "pip", title: match[1] || "One thing at a time", minutes: match[2] ? Number(match[2]) : 10 });
    } else if ((match = clause.match(/^(?:help me |start (?:a )?)?(?:wind[ -]?down|unwind|relax)(?: for (\d+)\s*min(?:ute)?s?)?$/i))) {
      actions.push({ type: "activity", companion: "luma", title: "A little time to unwind", minutes: match[1] ? Number(match[1]) : 5 });
    } else if ((match = clause.match(/^(?:start (?:a )?|help me (?:with (?:a )?)?)(walk|walking|workout|stretch|stretching|exercise)(?: for (\d+)\s*min(?:ute)?s?)?$/i))) {
      actions.push({ type: "activity", companion: "bounce", title: match[1].charAt(0).toUpperCase() + match[1].slice(1), minutes: match[2] ? Number(match[2]) : 15 });
    } else if ((match = clause.match(/^(?:start|set)(?: a)?(?: timer for)? (\d+)[ -]min(?:ute)?s?(?: timer)?$/i))) {
      actions.push({ type: "activity", companion: "tock", title: "Your timer", minutes: Number(match[1]) });
    } else if ((match = clause.match(/^set (?:an? )?alarm (?:for|at) (\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i))) {
      let h = Number(match[1]); const m = Number(match[2] || 0); const period = match[3]?.toLowerCase();
      if (m > 59 || h > 23 || (period && (h < 1 || h > 12))) return unknown("Use a clock time, such as “Set an alarm for 7 am”.");
      if (!period && h <= 12) return unknown("Is that am or pm? Try “Set an alarm for 7 am”. Nothing has changed.");
      if (period) h = h % 12 + (period === "pm" ? 12 : 0);
      actions.push({ type: "alarm", time: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}` });
    } else return unknown();
  }
  const activities = actions.filter(action => action.type === "activity");
  if (activities.length > 1) return unknown("Let’s start one activity at a time. Choose focus, movement, winding down or a timer.");
  if (activities.some(action => action.type === "activity" && (!Number.isInteger(action.minutes) || action.minutes < 1 || action.minutes > 240 || action.title.length > 160 || /\b(?:and|tomorrow|next week)\b/i.test(action.title)))) return unknown("Use one activity and a duration from 1 to 240 minutes, such as “Focus on my email for 10 minutes”.");
  if (actions.length > 8) return unknown("Try a few things at a time. Nothing has changed.");
  return { type: "plan", actions };
}

export function actionModule(action: HostAction) {
  return action.type === "activity" ? ({ pip: "focus", luma: "sleep", bounce: "move", tock: "clock" }[action.companion]) : action.type === "task" ? "focus" : action.type;
}
export function describeAction(action: HostAction) {
  switch (action.type) {
    case "grocery": return `Add ${action.titles.join(", ")} to your shopping list`;
    case "task": return `Add “${action.title}” to today’s priorities`;
    case "alarm": return `Set a one-time alarm for ${action.time} (keep Daywell open)`;
    case "activity": return action.companion === "pip" ? `Focus on ${action.title} for ${action.minutes} minutes` : action.companion === "luma" ? `Wind down for ${action.minutes} minutes` : action.companion === "tock" ? `Start a ${action.minutes}-minute timer${action.title === "Your timer" ? "" : ` for ${action.title.toLowerCase()}`}` : `Make time for ${action.title.toLowerCase()} (${action.minutes} minutes)`;
  }
}
export function entriesForActions(actions: HostAction[], date: string, now: number, id: () => string): Entry[] {
  return actions.flatMap((action): Entry[] => {
    switch (action.type) {
      case "grocery": return action.titles.map(title => ({ id: id(), kind: "grocery", data: { title, quantity: "1", done: false } }));
      case "task": return [{ id: id(), kind: "task", data: { title: action.title, date, minutes: 25, done: false } }];
      case "alarm": return [{ id: id(), kind: "alarm", data: { title: "Your reminder", time: action.time, enabled: true, days: [] } }];
      case "activity": return [{ id: "timer", kind: "timer", data: { title: action.title, duration: action.minutes * 60, remaining: action.minutes * 60, endAt: now + action.minutes * 60000, mode: action.companion === "pip" ? "Focus" : "Timer", companion: action.companion, startedAt: now } }];
    }
  });
}

export function guidanceAt(companion: ActivityCompanion, fraction: number, level: SupportLevel): string | null {
  if (level === "quiet" || companion === "tock" || fraction >= 1 || fraction < .25) return null;
  const stage = Math.min(2, Math.floor(fraction * 4) - 1);
  if (level === "occasional" && stage !== 1) return null;
  return {
    pip: ["If your attention wandered, you can come back to this one thing.", "Halfway through. Is this still the thing you want to focus on?", "A little time left. One small next step is enough."],
    luma: ["Let your shoulders settle, if that feels comfortable.", "There’s nothing to finish here. Rest at your own pace.", "You can let the screen go quiet now."],
    bounce: ["Find a pace that feels comfortable. You can pause whenever you like.", "Halfway through. Keep your pace, or take a breather.", "You’re near the end of this time. Finish at your own pace."],
  }[companion][stage];
}

export function canUndoHostChange(current: Entry[], applied: Entry[]) {
  return applied.every(entry => {
    const live = current.find(item => item.id === entry.id);
    return live && JSON.stringify(live) === JSON.stringify(entry);
  });
}
