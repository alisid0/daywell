"use client";
import { useState, type FormEvent } from "react";
import { ArrowUp, Check, ChevronLeft, Mic, Moon, Pencil, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CompanionPortrait } from "@/components/daywell-companions";
import { today, type Entry } from "@/lib/daywell";
import { dateLabel } from "@/lib/calendar";
import { activityDetail } from "@/lib/food-tracking";
import type { GuideFigure } from "@/lib/exercise-pictures";
import { describeSet, type WorkoutSet } from "@/lib/wellbeing";
import { areasWorked, exerciseNamed, minutesByDay, nextStep, plural, sevenDaysTo, suggestToday, weekNote } from "@/lib/move-plan";
import type { Routine } from "@/lib/workouts";
import { moveKind } from "./area-look";
import { dayBadge } from "./food-look";
import { MoveFace } from "./move-look";
import type { AppState } from "./use-daywell";

const HIDE_KEY = "daywell-move-next-hidden";
const hiddenToday = () => { try { return localStorage.getItem(HIDE_KEY) === today(); } catch { return false; } };
const weekday = (date: string) => dateLabel(date, { weekday: "long" });

// Looking back with Bounce (owner-approved design 5.2, 22 October 2026): Bounce's note on the last seven days, the days
// themselves, what they worked, one small next step, and a box to ask Bounce more. Rest days are part of the week; there
// are no streaks or scores. Everything but "Ask Bounce" is worked out in the app.
export function MoveWeek({ a, figure, onBack, onMoves, onStart }: { a: AppState; figure: GuideFigure; onBack: () => void; onMoves: () => void; onStart: (routine: Routine) => void }) {
  const day = today(), days = sevenDaysTo(day), minutes = minutesByDay(a.entries, days);
  const total = [...minutes.values()].reduce((sum, m) => sum + m, 0), areas = areasWorked(a.entries, day);
  const step = nextStep(a.entries, day, a.settings.moveTargets);
  const [hidden, setHidden] = useState(hiddenToday), [saving, setSaving] = useState(false), [question, setQuestion] = useState("");
  const fallback = !step && !hidden && a.by("move").length ? suggestToday(a.entries, day) : null;
  async function choose(reps: number) {
    if (!step) return;
    setSaving(true);
    const problem = await a.saveDetails({ moveTargets: { ...a.settings.moveTargets, [step.exercise.toLowerCase()]: { reps, best: step.best } } });
    setSaving(false);
    if (problem) toast.error(problem); else toast.success(reps === step.to ? `Next time: ${step.sets} sets of ${reps}.` : "Kept as it is.");
  }
  function notNow() { setHidden(true); try { localStorage.setItem(HIDE_KEY, day); } catch { /* hidden for this visit only */ } }
  function ask(event: FormEvent) {
    event.preventDefault();
    const text = question.trim();
    // Bounce's chat opens with the question typed, ready to send. Its AI chat is part of Daywell Plus.
    window.dispatchEvent(new CustomEvent("daywell-host", { detail: text ? { text } : { show: true } }));
    setQuestion("");
  }
  return <div className="mv-space">
    <header className="mv-head">
      <button type="button" className="mv-round" aria-label="Back to Move" onClick={onBack}><ChevronLeft size={20} aria-hidden /></button>
      <h1>Your week</h1>
      <button type="button" className="mv-link" onClick={onMoves}>Every move</button>
    </header>
    <div className="mv-bounce"><CompanionPortrait id="bounce" size={72} decorative /><div className="mv-bubble"><p>{weekNote(a.entries, day)}</p></div></div>
    <section className="mv-card" aria-labelledby="mv-last7">
      <div className="mv-card-head"><h2 id="mv-last7">The last 7 days</h2><span>{total} min</span></div>
      <ul className="mv-days">{days.map(d => {
        const moved = minutes.has(d), isToday = d === day;
        return <li key={d} className={`${moved ? "is-moved" : isToday ? "is-today" : "is-rest"}${isToday ? " is-now" : ""}`}>
          <span aria-label={`${weekday(d)}: ${moved ? `moved, ${minutes.get(d)} minutes` : isToday ? "today" : "rest"}`}>{moved ? <Check size={15} aria-hidden /> : !isToday && <Moon size={14} aria-hidden />}</span>
          {dateLabel(d, { weekday: "short" }).slice(0, 2)}
        </li>;
      })}</ul>
      {areas.length > 0 && <p className="mv-areas">{areas.map(([area, count]) => `${area} ${count}`).join(" · ")}</p>}
    </section>
    {step && <section className="mv-card is-raised" aria-labelledby="mv-next">
      <h2 id="mv-next">What next?</h2>
      <div className="mv-next-body"><MoveFace exercise={exerciseNamed(step.exercise)} figure={figure} /><p>You did {step.best} {plural(step.exercise)} in a row {step.date === day ? "today" : `on ${weekday(step.date)}`}. Next time, try <strong>{step.sets} sets of {step.to}</strong> instead of {step.sets} sets of {step.from}?</p></div>
      <div className="mv-row-buttons"><button type="button" className="mv-btn" disabled={saving} onClick={() => void choose(step.to)}>Try {step.sets} × {step.to}</button><button type="button" className="mv-btn is-ghost" disabled={saving} onClick={() => void choose(step.from)}>Keep {step.sets} × {step.from}</button></div>
      <p className="mv-why">Why this? A small step up after a new best. You can always go back.</p>
    </section>}
    {fallback && <section className="mv-card is-raised" aria-labelledby="mv-next">
      <h2 id="mv-next">What next?</h2>
      <p>{fallback.reason} <strong>{fallback.routine.name}</strong> fits, in {fallback.routine.minutes} minutes.</p>
      <div className="mv-row-buttons"><button type="button" className="mv-btn" onClick={() => onStart(fallback.routine)}><Play size={18} aria-hidden />Start it</button><button type="button" className="mv-btn is-ghost" onClick={notNow}>Not now</button></div>
    </section>}
    <form className="mv-ask" onSubmit={ask}>
      <label className="sr-only" htmlFor="mv-ask">Ask Bounce about your week</label>
      <input id="mv-ask" maxLength={300} placeholder="Ask Bounce about your week" value={question} onChange={e => setQuestion(e.target.value)} />
      <span className="mv-plus" title="Part of Daywell Plus">Plus</span>
      <button type="submit" className="mv-round is-accent" aria-label={question.trim() ? "Ask Bounce" : "Talk to Bounce"}>{question.trim() ? <ArrowUp size={19} aria-hidden /> : <Mic size={19} aria-hidden />}</button>
    </form>
  </div>;
}

// Every saved move, newest first, to look at, change or remove.
export function MoveList({ a, onBack, onEdit }: { a: AppState; onBack: () => void; onEdit: (entry: Entry) => void }) {
  const moves = [...a.by("move")].sort((x, y) => y.data.date.localeCompare(x.data.date));
  return <div className="mv-space">
    <header className="mv-head">
      <button type="button" className="mv-round" aria-label="Back to your week" onClick={onBack}><ChevronLeft size={20} aria-hidden /></button>
      <h1>Every move</h1>
      <span className="mv-count-note">{moves.length} {moves.length === 1 ? "move" : "moves"}</span>
    </header>
    {moves.length ? <ul className="mv-moves">{moves.map(e => {
      const kind = moveKind(e.data.title, Array.isArray(e.data.sets)), day = dayBadge(e.data.date), sets = Array.isArray(e.data.sets) ? e.data.sets as WorkoutSet[] : [];
      return <li key={e.id} className={`area-tone-${kind.tone}`}>
        <span className="area-icon" aria-hidden><kind.Icon size={20} /></span>
        <div><strong>{e.data.title}</strong><small>{[`${day.weekday} ${day.day} ${day.month}`, `${e.data.minutes} ${e.data.minutes === 1 ? "minute" : "minutes"}`, a.settings.calorieTracking && Number.isFinite(e.data.caloriesBurned) ? activityDetail(e.data) : ""].filter(Boolean).join(" · ")}</small>
          {sets.length > 0 && <details><summary>{sets.length} recorded {sets.length === 1 ? "set" : "sets"}</summary><ul>{sets.map((s, i) => <li key={i}>{s.exercise} · {describeSet(s)}</li>)}</ul></details>}
        </div>
        <span className="mv-move-actions"><button type="button" className="mv-round" aria-label={`Change ${e.data.title}`} onClick={() => onEdit(e)}><Pencil size={17} aria-hidden /></button><button type="button" className="mv-round" aria-label={`Remove ${e.data.title}`} onClick={() => void a.remove(e)}><Trash2 size={17} aria-hidden /></button></span>
      </li>;
    })}</ul> : <p className="well-empty">Your first walk, workout or stretch can go here. No daily target to catch up with.</p>}
  </div>;
}
