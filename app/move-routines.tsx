"use client";
import { PrivacyDetails } from "./privacy-details";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Pause, Play, RotateCcw, SkipForward, Mic, Volume2 } from "lucide-react";
import { CompanionPortrait } from "@/components/daywell-companions";
import { CompanionMotionControl } from "@/components/companion-motion-preference";
import { companions } from "@/lib/companions";
import type { WorkoutSet } from "@/lib/wellbeing";
import { completedSets, elapsedMinutes, levelLabels, routineSteps, routines, swapStep, whereLabels, type Routine, type RoutineStep, type Where } from "@/lib/workouts";

import { useHostVoice } from "./use-host-voice";
import { workoutCommand } from "@/lib/workout-voice";

type LogRoutine = (title: string, minutes: number, sets: WorkoutSet[]) => void;
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

export function MoveRoutines({ onLog }: { onLog: LogRoutine }) {
  const [where, setWhere] = useState<"all" | Where>("all"), [active, setActive] = useState<Routine | null>(null);
  const [expanded, setExpanded] = useState(false);
  if (active) return <RoutinePlayer routine={active} onClose={() => setActive(null)} onLog={(minutes, sets) => { setActive(null); onLog(active.name, minutes, sets); }} />;
  const shown = routines.filter(r => where === "all" || r.where === where);
  const filters: ["all" | Where, string][] = [["all", "Anywhere"], ...(Object.entries(whereLabels) as [Where, string][])];
  return <div className="move-routines">
    <div className="well-section-title"><h2>Your training partner</h2></div>
    <p>Choose a routine. Bounce takes it one step at a time, with spoken cues when you want them. No photos needed.</p>
    <div className="well-tabs" role="group" aria-label="Where you'll move">{filters.map(([id, label]) => <button key={id} type="button" aria-pressed={where === id} onClick={() => {setWhere(id);setExpanded(false);}}>{label}</button>)}</div>
    <div className="routine-grid">{(expanded?shown:shown.slice(0,4)).map(r => <article key={r.id} className="routine-card">
      <CompanionPortrait id={r.companion} size={64} decorative />
      <div><h3>{r.name}</h3><small>{r.minutes} min · {levelLabels[r.level]} · {whereLabels[r.where]}</small><p>{r.when}</p></div>
      <button type="button" className="well-button well-secondary" aria-label={`Start ${r.name}`} onClick={() => setActive(r)}>Start</button>
    </article>)}</div>
    {shown.length>4&&<button type="button" className="well-text-button" onClick={()=>setExpanded(!expanded)}>{expanded?"Show fewer routines":`More routines (${shown.length-4})`}</button>}
  </div>;
}

function RoutinePlayer({ routine, onClose, onLog }: { routine: Routine; onClose: () => void; onLog: (minutes: number, sets: WorkoutSet[]) => void }) {
  const [steps, setSteps] = useState<RoutineStep[]>(() => routineSteps(routine));
  const [index, setIndex] = useState(0), [setNo, setSetNo] = useState(1), [done, setDone] = useState<RoutineStep[]>([]);
  const [remaining, setRemaining] = useState(steps[0]?.amount.seconds ?? 0), [endAt, setEndAt] = useState<number | null>(null);
  const [resting, setResting] = useState(false);
  const [kettlebellKg, setKettlebellKg] = useState("");
  const [started] = useState(() => Date.now()), [finishedAt, setFinishedAt] = useState<number | null>(null);
  const step = steps[index], helper = companions[routine.companion];
  const finished = finishedAt !== null || !step;
  const [spoken, setSpoken] = useState(false), [voiceNote, setVoiceNote] = useState("");
  const voice = useHostVoice(handleCommand);
  const timerDuration = resting ? routine.restSeconds ?? 0 : step?.amount.seconds ?? 0;
  const restCue = `${remaining === 0 ? "The rest timer has finished. Take longer if you need." : "Rest and reset. Put any weight down safely and breathe normally."} Next: ${step?.exercise.name}. Say ‘next’ or choose Ready, next when you are ready.`;
  const cue = finished ? "Your routine has ended. Review the steps you completed before saving." : resting ? restCue : `${index === 0 ? routine.setup || "" : ""} ${step.exercise.name}. ${step.amount.text}. ${step.amount.sets > 1 ? `Set ${setNo} of ${step.amount.sets}.` : ""} ${step.exercise.cue} ${step.exercise.caution || ""}`;
  // A cue is read only when its content changes or the user opts in.
  useEffect(() => {
    if (spoken) voice.speak(cue);
    // speak wraps the current browser voice; its identity changes per render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cue, spoken]);
  function handleCommand(value: string) {
    if (finished) return;
    const command = workoutCommand(value);
    setVoiceNote(command ? `Heard: “${value}”` : "I didn’t recognise a routine command. Nothing changed. Try ‘done’, ‘pause’, ‘repeat’ or ‘easier’, or use the buttons.");
    if (command === "done") { if (resting) goTo(index); else goTo(index + 1, step); }
    if (command === "skip") { if (resting) { goTo(index); setVoiceNote("Rest ended. Start the next step when ready."); } else { goTo(index + 1); setVoiceNote("Skipped that step without recording it as completed."); } }
    if (command === "pause") setEndAt(null);
    if (command === "start") { if (resting || step.amount.seconds !== undefined) startTimer(); else setVoiceNote("This step uses reps. Take your time, then say ‘done’."); }
    if (command === "repeat") voice.speak(cue);
    if (command === "easier") { if (resting) setVoiceNote("Take all the rest you need. Choose an easier option when the next step begins."); else if (step.exercise.easier) swap(step.exercise.easier); else setVoiceNote("This is already the easiest option here. You can skip or end whenever you like."); }
    if (command === "end") { voice.stop(); setEndAt(null); setFinishedAt(() => Date.now()); }
  }


  useEffect(() => {
    if (endAt === null) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setRemaining(left);
      if (left > 0) return;
      setEndAt(null); navigator.vibrate?.(200);
      if (!resting && step && setNo < step.amount.sets) { setSetNo(n => n + 1); setRemaining(step.amount.seconds ?? 0); }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [endAt, step, setNo, resting]);

  function goTo(next: number, completed?: RoutineStep) {
    if (completed) setDone(d => [...d, completed]);
    // Rest is a player phase, not an exercise. Ending or skipping it never records the upcoming step.
    const rest = completed && next < steps.length ? routine.restSeconds ?? 0 : 0;
    setResting(rest > 0); setEndAt(rest ? Date.now() + rest * 1000 : null); setSetNo(1); setIndex(next);
    setRemaining(rest || steps[next]?.amount.seconds || 0);
    if (next >= steps.length) setFinishedAt(() => Date.now());
  }
  function swap(id: string | null) {
    const next = swapStep(step, id);
    setSteps(all => all.map((s, i) => i === index ? next : s));
    setEndAt(null); setSetNo(1); setRemaining(next.amount.seconds ?? 0);
  }
  function startTimer() { setEndAt(Date.now() + (remaining || timerDuration) * 1000); }

  if (finished) {
    const minutes = elapsedMinutes((finishedAt ?? started) - started);
    const usedKettlebell = done.some(s => s.exercise.kit === "One kettlebell");
    const sets = completedSets(done, { "One kettlebell": Number(kettlebellKg) });
    return <section className="well-card routine-player" aria-labelledby="routine-done">
      <div className="routine-helper"><CompanionPortrait id={routine.companion} size={96} motion="happy" decorative /><p>{done.length ? "You moved! That counts. Every bit." : "Starting is enough for today."}</p></div>
      <h2 id="routine-done">{routine.name}: {done.length === steps.length ? "complete" : "ended"}</h2>
      <CompanionMotionControl />
      <p>{done.length} of {steps.length} steps · about {minutes} {minutes === 1 ? "minute" : "minutes"}. Check the reps and add any weights before saving.</p>
      <form onSubmit={e => { e.preventDefault(); onLog(minutes, sets); }}>
      {usedKettlebell && <label className="well-space">Kettlebell used (kg)<input aria-label="Kettlebell used (kg)" required type="number" min="0.25" max="500" step="0.25" value={kettlebellKg} onChange={e => setKettlebellKg(e.target.value)} /><small>Enter it once. We’ll add it to your completed kettlebell sets. You can change individual sets in the review.</small></label>}
      <div className="well-actions">
        {sets.length > 0 && <button type="submit" className="well-button">Review and save</button>}
        <button type="button" className="well-text-button" onClick={onClose}>{sets.length ? "Close without saving" : "Close"}</button>
      </div>
      </form>
    </section>;
  }

  const ex = step.exercise, timed = resting || step.amount.seconds !== undefined;
  const easier = !resting && ex.easier ? swapStep(step, ex.easier).exercise.name : null, harder = !resting && ex.harder ? swapStep(step, ex.harder).exercise.name : null;
  return <section className="well-card routine-player" aria-labelledby="routine-step">
    <div className="routine-progress"><span>{routine.name}{step.rounds > 1 ? ` · round ${step.round} of ${step.rounds}` : ""}</span><span>Step {index + 1} of {steps.length}</span></div>
    <progress max={steps.length} value={index} aria-label="Routine progress" />
    <div className="routine-helper"><CompanionPortrait id={routine.companion} size={96} motion={endAt && !resting ? "encouraging" : "idle"} decorative /><p><strong>{helper.name}:</strong> {resting ? restCue : ex.cue}</p></div>
    {index === 0 && routine.setup && <p className="routine-caution">{routine.setup}</p>}
    <section className="routine-voice" aria-label="Training partner voice">
      <label className="food-checkbox"><input type="checkbox" checked={spoken} disabled={!voice.canSpeak} onChange={e=>{window.dispatchEvent(new Event("daywell-stop-voice"));setSpoken(e.target.checked);}}/>Read each step aloud</label>
      <div className="well-actions"><button type="button" className="well-button well-secondary" disabled={!voice.available} onClick={()=>{if(voice.listening)voice.stop();else{window.dispatchEvent(new Event("daywell-stop-voice"));voice.start();}}}><Mic size={17}/>{voice.listening?"Stop listening":"Tap to give a command"}</button><button type="button" className="well-text-button" disabled={!voice.canSpeak} onClick={()=>{window.dispatchEvent(new Event("daywell-stop-voice"));voice.speak(cue);}}><Volume2 size={17}/>Hear this step</button></div>
      <small>{resting ? "Say “next” when ready, “pause” to pause the rest timer, or “end”. Rest never counts as a completed exercise." : "Say “done” to record this step, “next” to skip, or “pause”, “continue”, “repeat”, “easier”, “end”."} Tap the mic for each command.</small><PrivacyDetails><p>Voice commands use your browser’s speech recognition, which may process audio online. Spoken steps use your device’s voice. Your camera stays off.</p></PrivacyDetails>
      {!voice.available&&<p>Voice commands aren’t available in this browser. All routine controls work by tapping.</p>}
      <p role="status">{voice.listening?"Listening…":voiceNote}</p>{voice.error&&<p role="alert">Voice couldn’t continue. Use the buttons, or check microphone access and try again.</p>}
    </section>
    <h2 id="routine-step" aria-live="polite">{resting ? "Rest and reset" : ex.name}</h2>
    <p className="routine-amount">{resting ? `Up next: ${ex.name}` : step.amount.text}{!resting && step.amount.sets > 1 ? ` · set ${setNo} of ${step.amount.sets}` : ""}</p>
    {!resting && ex.kit && <small>Needs: {ex.kit}</small>}
    {!resting && ex.caution && <p className="routine-caution">{ex.caution}</p>}
    {timed && <div className="routine-timer">
      <output aria-label="Time left">{clock(remaining)}</output>
      {endAt === null
        ? <button type="button" className="well-button well-secondary" onClick={startTimer}><Play size={16} />{remaining === timerDuration ? "Start timer" : remaining === 0 ? "Again" : "Continue"}</button>
        : <button type="button" className="well-button well-secondary" onClick={() => setEndAt(null)}><Pause size={16} />Pause</button>}
      {remaining !== timerDuration && <button type="button" className="well-text-button" onClick={() => { setEndAt(null); setRemaining(timerDuration); }}><RotateCcw size={16} />Reset</button>}
    </div>}
    <div className="well-actions">
      <button type="button" className="well-button" onClick={() => resting ? goTo(index) : goTo(index + 1, step)}>{resting ? "Ready, next" : index + 1 === steps.length ? "Done, finish" : "Done, next"}</button>
      {!resting && <button type="button" className="well-text-button" onClick={() => goTo(index + 1)}><SkipForward size={16} />Skip</button>}
      {easier && <button type="button" className="well-text-button" onClick={() => swap(ex.easier)}><ArrowDown size={16} />Easier: {easier}</button>}
      {harder && <button type="button" className="well-text-button" onClick={() => swap(ex.harder)}><ArrowUp size={16} />Harder: {harder}</button>}
    </div>
    <button type="button" className="well-text-button routine-end" onClick={() => { voice.stop(); setEndAt(null); setFinishedAt(() => Date.now()); }}>End routine</button>
    <CompanionMotionControl />
  </section>;
}
