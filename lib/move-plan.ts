import { exerciseById, exercises, routines, type Exercise, type Routine, type Where } from "./workouts.ts";
import { shiftDay, validDay } from "./calendar.ts";
import type { WorkoutSet } from "./wellbeing.ts";
import type { Entry } from "./daywell";

// Move's suggestions and its look back at the week (owner-approved design, 22 October 2026). Every rule here is fixed
// and runs in the app, so none of it is AI and nothing counts towards usage limits. No streaks and no scores.

const byName = new Map(exercises.map(e => [e.name.toLowerCase(), e]));
export const exerciseNamed = (name: string): Exercise | undefined => byName.get(name.trim().toLowerCase());
export const routineById = new Map(routines.map(r => [r.id, r]));
const setsOf = (entry: Entry) => (Array.isArray(entry.data.sets) ? entry.data.sets : []) as WorkoutSet[];
const isMove = (entry: Entry) => entry.kind === "move" && validDay(entry.data.date || "");

// Saved moves up to and including a day, newest first.
export function movesUntil(entries: Entry[], day: string) {
  return entries.filter(e => isMove(e) && e.data.date <= day).sort((a, b) => b.data.date.localeCompare(a.data.date));
}

// Monday to Sunday around a day, and the seven days ending with it.
export function weekOf(day: string) {
  const offset = (new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7;
  return Array.from({ length: 7 }, (_, i) => shiftDay(day, i - offset));
}
export const sevenDaysTo = (day: string) => Array.from({ length: 7 }, (_, i) => shiftDay(day, i - 6));

// Minutes moved on each of the given days that has a move.
export function minutesByDay(entries: Entry[], days: string[]) {
  const wanted = new Set(days), totals = new Map<string, number>();
  for (const e of entries) if (isMove(e) && wanted.has(e.data.date)) totals.set(e.data.date, (totals.get(e.data.date) ?? 0) + (Number(e.data.minutes) || 0));
  return totals;
}

// What a move worked: areas from its exercises' focus, or the kind of activity from its name.
const focusLabels: Record<string, string> = { legs: "Legs", push: "Push", pull: "Back", core: "Core", cardio: "Cardio", mobility: "Stretch", balance: "Balance" };
const activities: [RegExp, string][] = [
  [/walk|stroll|hike|ramble|\bsteps\b/, "Walks"], [/\brun\b|running|jog/, "Runs"], [/cycl|\bbike\b|spin/, "Cycling"], [/swim/, "Swims"],
  [/danc|zumba/, "Dancing"], [/stretch|yoga|pilates|mobility|wake-up|desk break|wind-down|tai chi/, "Stretch"],
  [/strength|weights|gym|squat|core|kettlebell|circuit|workout|lift|press/, "Strength"],
];
export function workedIn(entry: Entry): string[] {
  const sets = setsOf(entry);
  if (sets.length) return [...new Set(sets.map(s => focusLabels[exerciseNamed(s.exercise)?.focus ?? ""] ?? "Strength"))];
  const title = String(entry.data.title || "").toLowerCase();
  return [activities.find(([pattern]) => pattern.test(title))?.[1] ?? "Other"];
}
// How many moves worked each area in the seven days to a day, most first.
export function areasWorked(entries: Entry[], day: string): [string, number][] {
  const days = new Set(sevenDaysTo(day)), counts = new Map<string, number>();
  for (const e of entries) if (isMove(e) && days.has(e.data.date)) for (const area of workedIn(e)) counts.set(area, (counts.get(area) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

// Today's suggestion. Someone new starts gentle; after a long day of moving, something gentle; otherwise the strength
// areas that haven't had a turn this week, at their usual level, in places they've used. Up to two due areas count, so a
// familiar routine isn't always beaten by a full-body one.
const strength = ["legs", "push", "pull", "core"];
const areaWords: Record<string, string> = { legs: "legs", push: "arms", pull: "back", core: "core" };
const pluralWords = new Set(["legs", "push"]);
export function routineAreas(routine: Routine) {
  const areas = new Set<string>();
  for (const [id] of routine.blocks) { const focus = exerciseById.get(id)?.focus; if (focus && strength.includes(focus)) areas.add(focus); }
  return strength.filter(area => areas.has(area));
}
const sameRoutine = (entry: Entry, routine: Routine) => String(entry.data.title || "").trim().toLowerCase() === routine.name.toLowerCase();
function placesUsed(moves: Entry[]) {
  const places = new Set<Where>(["none"]);
  for (const e of moves) {
    for (const r of routines) if (sameRoutine(e, r)) places.add(r.where);
    for (const s of setsOf(e)) { const ex = exerciseNamed(s.exercise); if (ex) places.add(ex.where); }
  }
  return places;
}
const join = (words: string[]) => words.length < 2 ? words.join("") : `${words.slice(0, -1).join(", ")} and ${words.at(-1)}`;
const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
// The sentence for strength areas that are due, such as "Legs and core are due a strength day."
export function dueSentence(areas: string[]) {
  return `${capital(join(areas.map(a => areaWords[a])))} ${areas.length > 1 || pluralWords.has(areas[0]) ? "are" : "is"} due a strength day.`;
}

export type Suggestion = { routine: Routine; reason: string; first: boolean };
export function suggestToday(entries: Entry[], day: string): Suggestion {
  const moves = movesUntil(entries, day);
  if (!moves.length) return { routine: routineById.get("first-steps-strength")!, reason: "Simple moves to learn first, at your own pace.", first: true };
  const places = placesUsed(moves), lastDone = (r: Routine) => moves.find(e => sameRoutine(e, r))?.data.date ?? "";
  const done = routines.filter(r => lastDone(r));
  const usual = done.length ? Math.max(...done.map(r => r.level)) : moves.some(e => setsOf(e).length) ? 2 : 1;
  const yesterday = shiftDay(day, -1), yesterdayMinutes = minutesByDay(entries, [yesterday]).get(yesterday) ?? 0;
  const fresh = (r: Routine) => lastDone(r) < shiftDay(day, -2);
  if (yesterdayMinutes >= 30) {
    const gentle = routines.filter(r => r.level === 1 && places.has(r.where) && r.id !== "after-meal-walk")
      .sort((a, b) => Number(fresh(b)) - Number(fresh(a)) || Math.abs(a.minutes - 10) - Math.abs(b.minutes - 10))[0];
    if (gentle) return { routine: gentle, reason: `Something gentle after yesterday's ${yesterdayMinutes} minutes.`, first: false };
  }
  const worked = new Set<string>();
  for (const e of moves) if (e.data.date >= shiftDay(day, -6)) for (const s of setsOf(e)) { const focus = exerciseNamed(s.exercise)?.focus; if (focus) worked.add(focus); }
  const due = (r: Routine) => routineAreas(r).filter(area => !worked.has(area));
  const score = (r: Routine) => Math.min(due(r).length, 2) * 10 - Math.abs(r.level - usual) * 4 - (fresh(r) ? 0 : 6) - Math.abs(r.minutes - 15) / 5;
  let pick: Routine | undefined;
  for (const r of routines) if (places.has(r.where) && routineAreas(r).length && (!pick || score(r) > score(pick))) pick = r;
  const routine = pick ?? routineById.get("first-steps-strength")!, areas = due(routine);
  return { routine, reason: areas.length ? dueSentence(areas) : "A steady session to keep things moving.", first: false };
}

// Other choices when today's suggestion doesn't suit: shorter, without kit, or gentler. Walking has its own option.
export function otherOptions(current: Routine, entries: Entry[], day: string) {
  const places = placesUsed(movesUntil(entries, day));
  const pool = routines.filter(r => r.id !== current.id && r.id !== "after-meal-walk" && places.has(r.where));
  const closest = (list: Routine[]) => [...list].sort((a, b) => Math.abs(a.minutes - current.minutes) - Math.abs(b.minutes - current.minutes))[0] ?? null;
  const shorter = pool.filter(r => r.minutes < current.minutes && r.level <= current.level).sort((a, b) => a.minutes - b.minutes || a.level - b.level)[0] ?? null;
  const noKit = current.where === "none" ? null : closest(pool.filter(r => r.where === "none" && r.level === current.level)) ?? closest(pool.filter(r => r.where === "none"));
  const gentler = current.level > 1 ? closest(pool.filter(r => r.level < current.level && r.id !== shorter?.id)) : null;
  return { shorter, noKit, gentler };
}

// A routine laid out for "Before you start": moves done once, then any moves repeated in rounds. Left and right sides of
// the same move with the same amount read as one line ("20 seconds each hand").
export type OutlineItem = { id: string; name: string; text: string; exercise: Exercise };
export type Outline = { first: OutlineItem[]; repeat: OutlineItem[]; times: number };
const sideName = /\s*[—–-]\s*(?:left|right)\b\s*(.*)$/i;
function outlineItems(blocks: [string, string][]) {
  const items: OutlineItem[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const [id, text] = blocks[i], exercise = exerciseById.get(id), next = blocks[i + 1];
    if (!exercise) continue;
    if (id.endsWith("-left") && next && next[0] === `${id.slice(0, -5)}-right` && next[1] === text) {
      items.push({ id, name: exercise.name.replace(sideName, ""), text: `${text} each ${sideName.exec(exercise.name)?.[1] || "side"}`, exercise });
      i++;
    } else items.push({ id, name: exercise.name, text, exercise });
  }
  return items;
}
export function routineOutline(routine: Routine): Outline {
  const blocks = routine.blocks;
  if ((routine.rounds ?? 1) > 1) return { first: [], repeat: outlineItems(blocks), times: routine.rounds! };
  let best = { start: blocks.length, length: 0, times: 1 };
  for (let length = 1; length * 2 <= blocks.length; length++) {
    for (let times = Math.floor(blocks.length / length); times >= 2; times--) {
      const start = blocks.length - length * times;
      let same = true;
      for (let k = start + length; k < blocks.length && same; k++) same = blocks[k][0] === blocks[k - length][0] && blocks[k][1] === blocks[k - length][1];
      if (same && length * times > best.length * best.times) best = { start, length, times };
    }
  }
  if (best.times < 2) return { first: outlineItems(blocks), repeat: [], times: 1 };
  return { first: outlineItems(blocks.slice(0, best.start)), repeat: outlineItems(blocks.slice(best.start, best.start + best.length)), times: best.times };
}

// "push-ups", "calf raises", "leg presses": a move's name for a sentence about it.
export function plural(name: string) {
  const base = name.replace(/\s*\(.*\)\s*$/, "").trim().toLowerCase();
  if (/(ss|sh|ch|x)$/.test(base)) return `${base}es`;
  return base.endsWith("s") ? base : `${base}s`;
}

// Personal bests in the seven days to a day that beat everything before them: most reps in a set of a strength move,
// and the longest walk. They are only ever shown as good news.
export type NewBest = { exercise: string; best: number; previous: number; date: string };
export function newBests(entries: Entry[], day: string): NewBest[] {
  const from = shiftDay(day, -6), before = new Map<string, number>(), during = new Map<string, NewBest>();
  for (const e of entries) {
    if (!isMove(e) || e.data.date > day) continue;
    for (const s of setsOf(e)) {
      if (s.reps === undefined) continue;
      const focus = exerciseNamed(s.exercise)?.focus;
      if (focus && !strength.includes(focus)) continue;
      const key = s.exercise.trim().toLowerCase();
      if (e.data.date < from) before.set(key, Math.max(before.get(key) ?? 0, s.reps));
      else if (s.reps > (during.get(key)?.best ?? 0) || (s.reps === during.get(key)?.best && e.data.date > during.get(key)!.date)) during.set(key, { exercise: s.exercise.trim(), best: s.reps, previous: 0, date: e.data.date });
    }
  }
  const found: NewBest[] = [];
  for (const [key, best] of during) { const previous = before.get(key); if (previous !== undefined && best.best > previous) found.push({ ...best, previous }); }
  return found.sort((a, b) => b.date.localeCompare(a.date) || (b.best - b.previous) - (a.best - a.previous));
}
export function walkBest(entries: Entry[], day: string) {
  const from = shiftDay(day, -6);
  let before = 0, during = 0;
  for (const e of entries) {
    if (!isMove(e) || e.data.date > day || setsOf(e).length || !workedIn(e).includes("Walks")) continue;
    if (e.data.date < from) before = Math.max(before, e.data.minutes); else during = Math.max(during, e.data.minutes);
  }
  return before && during > before ? { minutes: during, previous: before } : null;
}

// Bounce's note about the last seven days. Rest days are part of the week, never a gap.
export function weekNote(entries: Entry[], day: string) {
  const days = sevenDaysTo(day), minutes = minutesByDay(entries, days);
  const moved = days.filter(d => minutes.has(d)), total = [...minutes.values()].reduce((sum, m) => sum + m, 0);
  if (!moved.length) return "No moves in the last 7 days, and that's okay. A five-minute desk break is an easy way back in.";
  const parts = [`You moved on ${moved.length} of the last 7 days, ${total} ${total === 1 ? "minute" : "minutes"} in all.`];
  const best = newBests(entries, day)[0], walk = walkBest(entries, day);
  if (best) parts.push(`Your ${plural(best.exercise)} went from ${best.previous} to ${best.best} in a set.`);
  else if (walk) parts.push(`Your longest walk yet: ${walk.minutes} minutes.`);
  const rest = days.slice(0, -1).filter(d => !minutes.has(d)).length;
  if (rest) parts.push(rest === 1 ? "Your rest day counts too." : `Your ${rest} rest days count too.`);
  return parts.join(" ");
}

// After a new best, a small step up for next time: two more reps a set, never past the best. The person's answer is
// kept (settings.moveTargets) with the best it answered, so the same best never asks twice.
export type Target = { reps: number; best: number };
export type NextStep = { exercise: string; sets: number; from: number; to: number; best: number; date: string };
const mostCommon = (values: number[]) => {
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0];
};
export function nextStep(entries: Entry[], day: string, targets: Record<string, Target>): NextStep | null {
  for (const found of newBests(entries, day)) {
    const key = found.exercise.toLowerCase(), saved = targets[key];
    if (saved && saved.best >= found.best) continue;
    const reps: number[] = [], sets: number[] = [];
    for (const e of entries) {
      if (!isMove(e) || e.data.date > day) continue;
      const these = setsOf(e).filter(s => s.reps !== undefined && s.exercise.trim().toLowerCase() === key);
      if (these.length) { sets.push(these.length); reps.push(...these.map(s => s.reps!)); }
    }
    const from = saved?.reps ?? mostCommon(reps) ?? found.previous, to = Math.min(found.best, from + 2);
    if (to > from) return { exercise: found.exercise, sets: Math.min(mostCommon(sets) ?? 2, 5), from, to, best: found.best, date: found.date };
  }
  return null;
}
// A saved target replaces the reps a routine asks for, for that move only.
export function targetReps(exercise: Pick<Exercise, "name">, targets: Record<string, Target>) {
  return targets[exercise.name.toLowerCase()]?.reps;
}
