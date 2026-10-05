"use client";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { CompanionPortrait } from "@/components/daywell-companions";
import { companions } from "@/lib/companions";
import type { WorkoutSet } from "@/lib/wellbeing";
import { completedSets, elapsedMinutes, levelLabels, routineSteps, routines, swapStep, whereLabels, type Routine, type RoutineStep, type Where } from "@/lib/workouts";

type LogRoutine = (title: string, minutes: number, sets: WorkoutSet[]) => void;
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

export function MoveRoutines({ onLog }: { onLog: LogRoutine }) {
  const [where, setWhere] = useState<"all" | Where>("all"), [active, setActive] = useState<Routine | null>(null);
  if (active) return <RoutinePlayer routine={active} onClose={() => setActive(null)} onLog={(minutes, sets) => { setActive(null); onLog(active.name, minutes, sets); }} />;
  const shown = routines.filter(r => where === "all" || r.where === where);
  const filters: ["all" | Where, string][] = [["all", "Anywhere"], ...(Object.entries(whereLabels) as [Where, string][])];
  return <div className="move-routines">
    <div className="well-section-title"><h2>Follow a routine</h2></div>
    <p>Most need nothing but a little floor space. Every exercise has an easier and a harder option.</p>
    <div className="well-tabs" role="group" aria-label="Where you'll move">{filters.map(([id, label]) => <button key={id} type="button" aria-pressed={where === id} onClick={() => setWhere(id)}>{label}</button>)}</div>
    <div className="routine-grid">{shown.map(r => <article key={r.id} className="routine-card">
      <CompanionPortrait id={r.companion} size={64} decorative />
      <div><h3>{r.name}</h3><small>{r.minutes} min · {levelLabels[r.level]} · {whereLabels[r.where]}</small><p>{r.when}</p></div>
      <button type="button" className="well-button well-secondary" aria-label={`Start ${r.name}`} onClick={() => setActive(r)}>Start</button>
    </article>)}</div>
  </div>;
}

function RoutinePlayer({ routine, onClose, onLog }: { routine: Routine; onClose: () => void; onLog: (minutes: number, sets: WorkoutSet[]) => void }) {
  const [steps, setSteps] = useState<RoutineStep[]>(() => routineSteps(routine));
  const [index, setIndex] = useState(0), [setNo, setSetNo] = useState(1), [done, setDone] = useState<RoutineStep[]>([]);
  const [remaining, setRemaining] = useState(steps[0]?.amount.seconds ?? 0), [endAt, setEndAt] = useState<number | null>(null);
  const [started] = useState(() => Date.now()), [finishedAt, setFinishedAt] = useState<number | null>(null);
  const step = steps[index], helper = companions[routine.companion];
  const finished = finishedAt !== null || !step;

  useEffect(() => {
    if (endAt === null) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setRemaining(left);
      if (left > 0) return;
      setEndAt(null); navigator.vibrate?.(200);
      if (step && setNo < step.amount.sets) { setSetNo(n => n + 1); setRemaining(step.amount.seconds ?? 0); }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [endAt, step, setNo]);

  function goTo(next: number, completed?: RoutineStep) {
    if (completed) setDone(d => [...d, completed]);
    setEndAt(null); setSetNo(1); setIndex(next);
    setRemaining(steps[next]?.amount.seconds ?? 0);
    if (next >= steps.length) setFinishedAt(Date.now());
  }
  function swap(id: string | null) {
    const next = swapStep(step, id);
    setSteps(all => all.map((s, i) => i === index ? next : s));
    setEndAt(null); setSetNo(1); setRemaining(next.amount.seconds ?? 0);
  }
  function startTimer() { setEndAt(Date.now() + (remaining || step.amount.seconds || 0) * 1000); }

  if (finished) {
    const minutes = elapsedMinutes((finishedAt ?? started) - started);
    const sets = completedSets(done);
    return <section className="well-card routine-player" aria-labelledby="routine-done">
      <div className="routine-helper"><CompanionPortrait id={routine.companion} size={96} decorative /><p>{done.length ? "You moved! That counts. Every bit." : "Starting is enough for today."}</p></div>
      <h2 id="routine-done">{routine.name}: {done.length ? "done" : "ended"}</h2>
      <p>{done.length} of {steps.length} steps · about {minutes} {minutes === 1 ? "minute" : "minutes"}. Check the reps and add any weights before saving.</p>
      <div className="well-actions">
        {sets.length > 0 && <button type="button" className="well-button" onClick={() => onLog(minutes, sets)}>Review and save</button>}
        <button type="button" className="well-text-button" onClick={onClose}>{sets.length ? "Close without saving" : "Close"}</button>
      </div>
    </section>;
  }

  const ex = step.exercise, timed = step.amount.seconds !== undefined;
  const easier = ex.easier ? swapStep(step, ex.easier).exercise.name : null, harder = ex.harder ? swapStep(step, ex.harder).exercise.name : null;
  return <section className="well-card routine-player" aria-labelledby="routine-step">
    <div className="routine-progress"><span>{routine.name}{step.rounds > 1 ? ` · round ${step.round} of ${step.rounds}` : ""}</span><span>Step {index + 1} of {steps.length}</span></div>
    <progress max={steps.length} value={index} aria-label="Routine progress" />
    <div className="routine-helper"><CompanionPortrait id={routine.companion} size={96} decorative /><p><strong>{helper.name}:</strong> {ex.cue}</p></div>
    <h2 id="routine-step" aria-live="polite">{ex.name}</h2>
    <p className="routine-amount">{step.amount.text}{step.amount.sets > 1 ? ` · set ${setNo} of ${step.amount.sets}` : ""}</p>
    {ex.kit && <small>Needs: {ex.kit}</small>}
    {ex.caution && <p className="routine-caution">{ex.caution}</p>}
    {timed && <div className="routine-timer">
      <output aria-label="Time left">{clock(remaining)}</output>
      {endAt === null
        ? <button type="button" className="well-button well-secondary" onClick={startTimer}><Play size={16} />{remaining === step.amount.seconds ? "Start timer" : remaining === 0 ? "Again" : "Continue"}</button>
        : <button type="button" className="well-button well-secondary" onClick={() => setEndAt(null)}><Pause size={16} />Pause</button>}
      {remaining !== step.amount.seconds && <button type="button" className="well-text-button" onClick={() => { setEndAt(null); setRemaining(step.amount.seconds ?? 0); }}><RotateCcw size={16} />Reset</button>}
    </div>}
    <div className="well-actions">
      <button type="button" className="well-button" onClick={() => goTo(index + 1, step)}>{index + 1 === steps.length ? "Done, finish" : "Done, next"}</button>
      <button type="button" className="well-text-button" onClick={() => goTo(index + 1)}><SkipForward size={16} />Skip</button>
      {easier && <button type="button" className="well-text-button" onClick={() => swap(ex.easier)}><ArrowDown size={16} />Easier: {easier}</button>}
      {harder && <button type="button" className="well-text-button" onClick={() => swap(ex.harder)}><ArrowUp size={16} />Harder: {harder}</button>}
    </div>
    <button type="button" className="well-text-button routine-end" onClick={() => setFinishedAt(Date.now())}>End routine</button>
  </section>;
}
