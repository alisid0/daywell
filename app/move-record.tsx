"use client";
import { useId, useMemo, useState, type FormEvent } from "react";
import { Check, Clock, Minus, Plus, Search, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CompanionPortrait } from "@/components/daywell-companions";
import { today, schemas, type Entry } from "@/lib/daywell";
import { shiftDay } from "@/lib/calendar";
import type { GuideFigure } from "@/lib/exercise-pictures";
import type { WorkoutSet } from "@/lib/wellbeing";
import { exercises, parseAmount, type Exercise, type Routine, type RoutineStep } from "@/lib/workouts";
import { exerciseNamed } from "@/lib/move-plan";
import { ActivityCaloriesFields } from "./food-tracking";
import { MoveFace } from "./move-look";
import { LengthWheels } from "./time-wheels";
import type { AppState } from "./use-daywell";

// Recording a move (owner-approved design, 22 October 2026): after a workout the moves done are filled in to check;
// strength is recorded by tapping pictures; walks, runs and anything else take a few taps. Typing is a fallback.
export type RecordStart =
  | { kind: "after"; routine: Routine; done: RoutineStep[]; minutes: number }
  | { kind: "strength" | "walk" | "other"; entry?: Entry; minutes?: number };
type Mode = "strength" | "walk" | "other";
type Item = { key: string; name: string; exercise?: Exercise; sets: number; reps?: number; seconds?: number; kg: number; on: boolean };

const BELL = "One kettlebell";
const MINUTE_CHOICES = [10, 15, 20, 30, 45];
const amountText = (item: Pick<Item, "reps" | "seconds">) => item.seconds !== undefined ? (item.seconds >= 60 && item.seconds % 60 === 0 ? `${item.seconds / 60} min` : `${item.seconds} s`) : `${item.reps}`;
const sameAmount = (a: Pick<Item, "name" | "reps" | "seconds">, b: Pick<Item, "name" | "reps" | "seconds">) => a.name.toLowerCase() === b.name.toLowerCase() && a.reps === b.reps && a.seconds === b.seconds;

// Saved sets become one card per move and amount ("2 × 8"); the first appearance sets the order.
function itemsFromSets(sets: WorkoutSet[]): Item[] {
  const items: Item[] = [];
  for (const set of sets) {
    const found = items.find(item => sameAmount(item, { name: set.exercise, reps: set.reps, seconds: set.seconds }) && item.kg === set.kg);
    if (found) found.sets++;
    else items.push({ key: `${set.exercise}-${items.length}`, name: set.exercise, exercise: exerciseNamed(set.exercise), sets: 1, reps: set.reps, seconds: set.seconds, kg: set.kg, on: true });
  }
  return items;
}
function itemsFromSteps(done: RoutineStep[]): Item[] {
  const items: Item[] = [];
  for (const step of done) {
    const unit = step.amount.reps ? { reps: step.amount.reps } : step.amount.seconds ? { seconds: step.amount.seconds } : null;
    if (!unit) continue;
    const next = { name: step.exercise.name, ...unit };
    const found = items.find(item => sameAmount(item, next));
    if (found) found.sets += step.amount.sets;
    else items.push({ key: `${step.exercise.id}-${items.length}`, exercise: step.exercise, sets: step.amount.sets, kg: 0, on: true, ...next });
  }
  return items;
}
// The person's last sets of a move, newest first.
function lastSets(entries: Entry[], name: string) {
  const key = name.trim().toLowerCase();
  const found = entries.filter(e => e.kind === "move" && Array.isArray(e.data.sets) && (e.data.sets as WorkoutSet[]).some(s => s.exercise.trim().toLowerCase() === key))
    .sort((a, b) => b.data.date.localeCompare(a.data.date))[0];
  return found ? (found.data.sets as WorkoutSet[]).filter(s => s.exercise.trim().toLowerCase() === key) : [];
}
function newItem(entries: Entry[], name: string, exercise?: Exercise): Item {
  const last = lastSets(entries, name);
  if (last.length) return { key: `${name}-${Date.now()}`, name: exercise?.name ?? name, exercise, sets: Math.min(last.length, 5), reps: last[0].reps, seconds: last[0].seconds, kg: last[0].kg, on: true };
  const amount: { sets: number; reps?: number; seconds?: number } = exercise ? parseAmount(exercise.start, exercise.measure) : { sets: 1, reps: 10 };
  const unit = amount.seconds !== undefined ? { seconds: amount.seconds } : { reps: amount.reps ?? 10 };
  return { key: `${name}-${Date.now()}`, name: exercise?.name ?? name, exercise, sets: amount.sets, kg: 0, on: true, ...unit };
}
function lastText(entries: Entry[], item: Item) {
  const last = lastSets(entries, item.name);
  if (!last.length) return item.exercise?.start ?? "";
  return `Last time ${last.length > 1 ? `${last.length} × ` : ""}${amountText(last[0])}${last[0].kg ? `, ${last[0].kg} kg` : ""}`;
}
// Moves to offer before anything is chosen: the person's recent ones, then a few common ones.
function suggestedItems(entries: Entry[]): Item[] {
  const names: string[] = [];
  for (const e of [...entries].filter(e => e.kind === "move" && Array.isArray(e.data.sets)).sort((a, b) => b.data.date.localeCompare(a.data.date)))
    for (const s of e.data.sets as WorkoutSet[]) if (!names.some(n => n.toLowerCase() === s.exercise.trim().toLowerCase())) names.push(s.exercise.trim());
  for (const common of ["Bodyweight squat", "Push-up", "Plank", "Glute bridge"]) if (names.length < 4 && !names.some(n => n.toLowerCase() === common.toLowerCase())) names.push(common);
  return names.slice(0, 6).map(name => ({ ...newItem(entries, name, exerciseNamed(name)), on: false }));
}
// A saved move opens as what it was: strength if it has sets, a walk or run by its name, otherwise something else.
function modeFor(start: RecordStart): Mode {
  if (start.kind === "after") return "strength";
  if (!start.entry) return start.kind;
  if (Array.isArray(start.entry.data.sets)) return "strength";
  return /walk|stroll|hike|ramble|\brun\b|running|jog/i.test(start.entry.data.title) ? "walk" : "other";
}
function bellWeight(entries: Entry[]) {
  for (const e of [...entries].filter(e => e.kind === "move" && Array.isArray(e.data.sets)).sort((a, b) => b.data.date.localeCompare(a.data.date)))
    for (const s of e.data.sets as WorkoutSet[]) if (s.kg > 0 && exerciseNamed(s.exercise)?.kit === BELL) return s.kg;
  return null;
}

export function MoveRecord({ a, start, figure, onClose, onSaved }: { a: AppState; start: RecordStart; figure: GuideFigure; onClose: () => void; onSaved: () => void }) {
  const entry = start.kind === "after" ? undefined : start.entry;
  const editing = !!entry;
  const [mode, setMode] = useState<Mode>(() => modeFor(start));
  const [items, setItems] = useState<Item[]>(() => start.kind === "after" ? itemsFromSteps(start.done) : entry && Array.isArray(entry.data.sets) ? itemsFromSets(entry.data.sets) : suggestedItems(a.entries));
  const [bell, setBell] = useState<number | null>(() => start.kind === "after" ? bellWeight(a.entries) : null);
  const [minutes, setMinutes] = useState(() => String(start.kind === "after" ? start.minutes : entry?.data.minutes ?? start.minutes ?? (start.kind === "walk" ? 20 : start.kind === "strength" ? 20 : 30)));
  const [date, setDate] = useState(() => entry?.data.date ?? today());
  const [pickDate, setPickDate] = useState(() => !!entry && entry.data.date !== today() && entry.data.date !== shiftDay(today(), -1));
  const [otherMinutes, setOtherMinutes] = useState(() => !MINUTE_CHOICES.includes(Number(entry?.data.minutes ?? start.minutes ?? 20)));
  const [run, setRun] = useState(() => !!entry && /\brun\b|running|jog/i.test(entry.data.title));
  const [name, setName] = useState(() => entry && !Array.isArray(entry.data.sets) && !["walk", "run"].includes(entry.data.title.toLowerCase()) ? entry.data.title : "");
  const [calories, setCalories] = useState<number | undefined>(entry?.data.caloriesBurned), [calorieSource, setCalorieSource] = useState<string | undefined>(entry?.data.calorieSource);
  const [finding, setFinding] = useState(false), [error, setError] = useState(""), [saving, setSaving] = useState(false);
  const ids = useId();
  const chosen = items.filter(item => item.on), usesBell = chosen.some(item => item.exercise?.kit === BELL);
  const title = start.kind === "after" ? start.routine.name : mode === "strength" ? (entry?.data.title ?? "Strength session") : mode === "walk" ? (name.trim() || (run ? "Run" : "Walk")) : name.trim();

  function change(key: string, patch: Partial<Item>) { setItems(all => all.map(item => item.key === key ? { ...item, ...patch } : item)); }
  function step(item: Item, by: number) {
    if (item.seconds !== undefined) change(item.key, { seconds: Math.min(3600, Math.max(5, item.seconds + by * (item.seconds >= 120 ? 30 : 5))) });
    else change(item.key, { reps: Math.min(200, Math.max(1, (item.reps ?? 1) + by)) });
  }
  function add(name: string, exercise?: Exercise) {
    setFinding(false);
    const existing = items.find(item => item.name.toLowerCase() === (exercise?.name ?? name).toLowerCase());
    if (existing) change(existing.key, { on: true });
    else setItems(all => [...all, newItem(a.entries, name, exercise)]);
  }

  async function save(event: FormEvent) {
    event.preventDefault(); setError("");
    const sets: WorkoutSet[] = mode === "strength" ? chosen.flatMap(item => Array.from({ length: item.sets }, () => ({
      exercise: item.name.slice(0, 80), ...(item.seconds !== undefined ? { seconds: item.seconds } : { reps: item.reps ?? 1 }),
      // The bell's weight is entered once and given to kettlebell moves only; easier swaps without the bell stay unweighted.
      kg: item.exercise?.kit === BELL ? bell ?? 0 : item.kg,
    }))) : [];
    if (mode === "strength" && !sets.length) { setError("Tap at least one move you did."); return; }
    if (sets.length > 20) { setError("Up to 20 sets fit in one record. Take a few away, or record the rest separately."); return; }
    if (mode === "strength" && usesBell && !bell) { setError("Add the kettlebell's weight first."); return; }
    if (mode === "other" && !title) { setError("Give it a name, such as Swim or Yoga class."); return; }
    const data = { title, date, minutes: Number(minutes), ...(sets.length ? { sets } : {}), ...(calories !== undefined ? { caloriesBurned: calories, calorieSource } : {}) };
    const parsed = schemas.move.safeParse(data);
    if (!parsed.success) { setError("Choose 1–600 minutes and a date up to today. Each set needs 1–200 reps or 1–3,600 seconds."); return; }
    setSaving(true);
    const saved = await a.save([{ id: entry?.id ?? crypto.randomUUID(), kind: "move", data: parsed.data }], mode === "strength" ? "Workout saved. A little stronger." : `${title} saved.`);
    setSaving(false);
    if (saved) onSaved(); else setError("That hasn’t saved yet. Everything is still here to try again.");
  }

  const yesterday = shiftDay(today(), -1);
  return <form className="mv-record" onSubmit={save} aria-labelledby={`${ids}-title`}>
    <header className="mv-head">
      <h1 id={`${ids}-title`}>{start.kind === "after" ? "Workout done" : editing ? "Change this move" : "What did you do?"}</h1>
      <button type="button" className="mv-round" aria-label={start.kind === "after" ? "Close without saving" : "Close"} onClick={onClose}><X size={20} aria-hidden /></button>
    </header>
    {start.kind === "after" && <div className="mv-bounce is-small"><CompanionPortrait id="bounce" size={56} motion="happy" decorative /><div className="mv-bubble"><p>{start.done.length ? `Nicely done${a.settings.name && a.settings.name !== "You" ? `, ${a.settings.name}` : ""}. Check what you did, then save it.` : "Starting is enough for today."}</p></div></div>}
    {start.kind !== "after" && !editing && <div className="mv-seg" role="group" aria-label="Kind of move">
      {(["walk", "strength", "other"] as Mode[]).map(m => <button key={m} type="button" aria-pressed={mode === m} onClick={() => { setMode(m); setError(""); try { localStorage.setItem("daywell-move-record", m); } catch { /* remembered for this visit only */ } }}>{m === "walk" ? "Walk or run" : m === "strength" ? "Strength" : "Something else"}</button>)}
    </div>}

    {mode === "strength" && <>
      {start.kind !== "after" && !editing && <p className="mv-hint">Tap what you did. Your recent ones come first.</p>}
      <ul className="mv-ex-grid" aria-label="Moves">
        {items.map(item => <li key={item.key}><div className={`mv-ex${item.on ? " is-on" : ""}`}>
          <MoveFace exercise={item.exercise} figure={figure} />
          {item.on && <span className="mv-tick" aria-hidden><Check size={15} /></span>}
          <button type="button" className="mv-ex-name" aria-pressed={item.on} onClick={() => change(item.key, { on: !item.on })}>{item.name}</button>
          {item.on ? <>
            <div className="mv-mini" role="group" aria-label={`${item.name}: ${item.sets} ${item.sets === 1 ? "set" : "sets"} of ${amountText(item)}${item.seconds === undefined ? " reps" : ""}`}>
              <button type="button" aria-label={item.seconds !== undefined ? "Less time" : "Fewer reps"} onClick={() => step(item, -1)}><Minus size={16} aria-hidden /></button>
              <button type="button" className="mv-mini-value" aria-label={`${item.sets} ${item.sets === 1 ? "set" : "sets"}. Change the number of sets`} onClick={() => change(item.key, { sets: item.sets % 5 + 1 })}>{item.sets} × {amountText(item)}</button>
              <button type="button" aria-label={item.seconds !== undefined ? "More time" : "More reps"} onClick={() => step(item, 1)}><Plus size={16} aria-hidden /></button>
            </div>
            {item.exercise?.kit && item.exercise.kit !== BELL && <div className="mv-mini is-kg" role="group" aria-label={`Weight for ${item.name}`}>
              <button type="button" aria-label="Lighter" onClick={() => change(item.key, { kg: Math.max(0, item.kg - 1) })}><Minus size={16} aria-hidden /></button>
              <span>{item.kg ? `${item.kg} kg` : "No weight"}</span>
              <button type="button" aria-label="Heavier" onClick={() => change(item.key, { kg: Math.min(500, item.kg + 1) })}><Plus size={16} aria-hidden /></button>
            </div>}
          </> : <small>{lastText(a.entries, item)}</small>}
        </div></li>)}
        <li><button type="button" className="mv-ex-add" onClick={() => setFinding(true)}><Search size={20} aria-hidden />{start.kind === "after" ? "Add a move" : "Find another"}</button></li>
      </ul>
      {usesBell && <div className="mv-bell" role="group" aria-labelledby={`${ids}-bell`}>
        <span id={`${ids}-bell`}>Kettlebell used</span>
        <div className="mv-mini"><button type="button" aria-label="Lighter" onClick={() => setBell(kg => Math.max(1, (kg ?? 8) - 1))}><Minus size={16} aria-hidden /></button><label className="sr-only" htmlFor={`${ids}-kg`}>Kettlebell weight in kilograms</label><input id={`${ids}-kg`} type="number" inputMode="decimal" min={0.25} max={500} step={0.25} placeholder="kg" value={bell ?? ""} onChange={e => setBell(e.target.value === "" ? null : Number(e.target.value))} /><span aria-hidden>kg</span><button type="button" aria-label="Heavier" onClick={() => setBell(kg => Math.min(500, (kg ?? 7) + 1))}><Plus size={16} aria-hidden /></button></div>
      </div>}
    </>}

    {mode === "walk" && <>
      <fieldset className="mv-field"><legend>Which?</legend><div className="mv-chips">
        <button type="button" className="mv-chip" aria-pressed={!run} onClick={() => setRun(false)}>Walk</button>
        <button type="button" className="mv-chip" aria-pressed={run} onClick={() => setRun(true)}>Run</button>
      </div></fieldset>
    </>}
    {mode === "other" && <label className="mv-field"><span>What was it?</span><input required maxLength={160} placeholder="e.g. Swim, yoga class, dancing" value={name} onChange={e => setName(e.target.value)} /></label>}

    {mode !== "strength" && <fieldset className="mv-field"><legend>How long?</legend><div className="mv-chips">
      {MINUTE_CHOICES.map(m => <button key={m} type="button" className="mv-chip" aria-pressed={!otherMinutes && Number(minutes) === m} onClick={() => { setOtherMinutes(false); setMinutes(String(m)); }}>{m} min</button>)}
      <button type="button" className="mv-chip" aria-pressed={otherMinutes} onClick={() => setOtherMinutes(true)}>Other</button>
      {otherMinutes && <div className="mv-inline-wheels"><LengthWheels value={Number(minutes) || 1} onChange={m => setMinutes(String(m))} max={600} /></div>}
    </div></fieldset>}

    <fieldset className="mv-field"><legend>When?</legend><div className="mv-chips">
      <button type="button" className="mv-chip" aria-pressed={!pickDate && date === today()} onClick={() => { setPickDate(false); setDate(today()); }}>Today</button>
      <button type="button" className="mv-chip" aria-pressed={!pickDate && date === yesterday} onClick={() => { setPickDate(false); setDate(yesterday); }}>Yesterday</button>
      <button type="button" className="mv-chip" aria-pressed={pickDate} onClick={() => setPickDate(true)}>Pick a day</button>
      {pickDate && <label className="mv-inline"><span className="sr-only">Date</span><input type="date" required max={today()} value={date} onChange={e => { if (e.target.value) setDate(e.target.value); }} /></label>}
    </div></fieldset>
    {mode === "strength" && <label className="mv-field is-row"><span><Clock size={16} aria-hidden /> Minutes</span><input type="number" min={1} max={600} required value={minutes} onChange={e => setMinutes(e.target.value)} /></label>}
    {mode === "walk" && <label className="mv-field"><span>Name <small>(optional)</small></span><input maxLength={160} placeholder="e.g. Walk to the park" value={name} onChange={e => setName(e.target.value)} /></label>}
    {a.settings.calorieTracking && <ActivityCaloriesFields calories={calories} source={calorieSource} onChange={(kcal, source) => { setCalories(kcal); setCalorieSource(source); }} />}

    {error && <p role="alert" className="form-error">{error}</p>}
    <button type="submit" className="mv-btn mv-save" disabled={saving}><Check size={18} aria-hidden />{saving ? "Saving…" : mode === "strength" ? (start.kind === "after" ? "Save workout" : `Save ${chosen.length} ${chosen.length === 1 ? "move" : "moves"}`) : mode === "walk" ? `Save ${run ? "run" : "walk"}` : "Save"}</button>
    {finding && <FindMove figure={figure} onPick={add} onClose={() => setFinding(false)} />}
  </form>;
}

// Finding any move by name, or adding one of the person's own.
function FindMove({ figure, onPick, onClose }: { figure: GuideFigure; onPick: (name: string, exercise?: Exercise) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const words = query.trim().toLowerCase();
  const found = useMemo(() => exercises.filter(e => !words || e.name.toLowerCase().includes(words)).slice(0, 30), [words]);
  const exact = found.some(e => e.name.toLowerCase() === words);
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="kitchen-sheet mv-sheet" showCloseButton={false} aria-describedby={undefined}>
      <div className="mv-sheet-head"><DialogTitle>Find a move</DialogTitle><button type="button" className="mv-round" aria-label="Close" onClick={onClose}><X size={20} aria-hidden /></button></div>
      <label className="mv-find"><Search size={18} aria-hidden /><span className="sr-only">Move name</span><input autoFocus placeholder="e.g. lunge, plank, row" value={query} onChange={e => setQuery(e.target.value)} /></label>
      <ul className="mv-find-list">
        {words && !exact && <li><button type="button" onClick={() => onPick(query.trim().slice(0, 80))}><span className="mv-face mv-tile area-tone-other" aria-hidden><Plus size={20} /></span><span><strong>Add “{query.trim()}”</strong><small>Your own move</small></span></button></li>}
        {found.map(e => <li key={e.id}><button type="button" onClick={() => onPick(e.name, e)}><MoveFace exercise={e} figure={figure} /><span><strong>{e.name}</strong><small>{e.start}{e.kit ? ` · ${e.kit}` : ""}</small></span></button></li>)}
      </ul>
    </DialogContent>
  </Dialog>;
}
