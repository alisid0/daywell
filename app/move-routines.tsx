"use client";
import { PrivacyDetails } from "./privacy-details";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Check, Mic, Minus, Pause, Play, Plus, RotateCcw, SkipForward, Volume2, VolumeX, X } from "lucide-react";
import { CompanionPortrait } from "@/components/daywell-companions";
import { CompanionMotionControl } from "@/components/companion-motion-preference";
import { companions } from "@/lib/companions";
import { elapsedMinutes, routineSteps, swapStep, type Routine, type RoutineStep } from "@/lib/workouts";
import { targetReps, type Target } from "@/lib/move-plan";
import { exercisePicture, type GuideFigure } from "@/lib/exercise-pictures";
import { useHostVoice } from "./use-host-voice";
import { ExercisePicture } from "./exercise-picture";
import { MoveFace, focusLook } from "./move-look";
import { workoutCommand } from "@/lib/workout-voice";

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
// A saved target (Move's "What next?") replaces the reps a routine asks for, for that move only.
function withTarget(step: RoutineStep, targets: Record<string, Target>): RoutineStep {
  const reps = step.amount.reps !== undefined ? targetReps(step.exercise, targets) : undefined;
  return reps ? { ...step, amount: { ...step.amount, reps, text: `${step.amount.sets > 1 ? `${step.amount.sets} × ` : ""}${reps} reps · your target` } } : step;
}

// Doing a routine with Bounce (owner-approved design, 22 October 2026): one step per screen with its picture, Bounce's
// tip, a count of the reps really done, timers, rest and what's next. Done records a step (with the reps counted); Skip
// moves on without recording; rest never counts as a move. Ending early keeps only the steps already done, and the
// person reviews them before anything is saved.
// briefed: the person has just read the routine's safety notes on Before you start, so the first step doesn't repeat them.
export function RoutinePlayer({ routine, figure, onFigure, targets, briefed = false, onFinish, onClose }: { routine: Routine; figure: GuideFigure; onFigure: (figure: GuideFigure) => void; targets: Record<string, Target>; briefed?: boolean; onFinish: (done: RoutineStep[], minutes: number) => void; onClose: () => void }) {
  const [steps, setSteps] = useState<RoutineStep[]>(() => routineSteps(routine).map(step => withTarget(step, targets)));
  const [index, setIndex] = useState(0), [setNo, setSetNo] = useState(1), [done, setDone] = useState<RoutineStep[]>([]);
  const [remaining, setRemaining] = useState(steps[0]?.amount.seconds ?? 0), [endAt, setEndAt] = useState<number | null>(null);
  const [resting, setResting] = useState(false), [count, setCount] = useState(steps[0]?.amount.reps ?? 0);
  const [started] = useState(() => Date.now()), [stopped, setStopped] = useState(false);
  const step = steps[index], helper = companions[routine.companion];
  const [spoken, setSpoken] = useState(false), [voiceNote, setVoiceNote] = useState("");
  const top = useRef<HTMLElement>(null), placed = useRef(false);
  // Brings the player into view when it opens, and again when a new step starts above the top of the screen.
  useEffect(() => {
    const el = top.current;
    if (el && (!placed.current || el.getBoundingClientRect().top < 0)) el.scrollIntoView({ block: "start" });
    placed.current = true;
  }, [index, resting, stopped]);
  const voice = useHostVoice(handleCommand);
  const timerDuration = resting ? routine.restSeconds ?? 0 : step?.amount.seconds ?? 0;
  const restCue = `${remaining === 0 ? "The rest timer has finished. Take longer if you need." : "Rest and reset. Put any weight down safely and breathe normally."} Next: ${step?.exercise.name}. Say ‘next’ or choose I’m ready when you are.`;
  const cue = stopped || !step ? "Your routine has ended." : resting ? restCue : `${index === 0 ? routine.setup || "" : ""} ${step.exercise.name}. ${step.amount.text}. ${step.amount.sets > 1 ? `Set ${setNo} of ${step.amount.sets}.` : ""} ${step.exercise.cue} ${step.exercise.caution || ""}`;
  // A cue is read only when its content changes or the user opts in.
  useEffect(() => {
    if (spoken) voice.speak(cue);
    // speak wraps the current browser voice; its identity changes per render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cue, spoken]);
  function handleCommand(value: string) {
    if (stopped || !step) return;
    const command = workoutCommand(value);
    setVoiceNote(command ? `Heard: “${value}”` : "I didn’t recognise a routine command. Nothing changed. Try ‘done’, ‘pause’, ‘repeat’ or ‘easier’, or use the buttons.");
    if (command === "done") { if (resting) goTo(index); else complete(); }
    if (command === "skip") { if (resting) { goTo(index); setVoiceNote("Rest ended. Start the next step when ready."); } else { goTo(index + 1); setVoiceNote("Skipped that step without recording it as completed."); } }
    if (command === "pause") setEndAt(null);
    if (command === "start") { if (resting || step.amount.seconds !== undefined) startTimer(); else setVoiceNote("This step uses reps. Take your time, then say ‘done’."); }
    if (command === "repeat") voice.speak(cue);
    if (command === "easier") { if (resting) setVoiceNote("Take all the rest you need. Choose an easier option when the next step begins."); else if (step.exercise.easier) swap(step.exercise.easier); else setVoiceNote("This is already the easiest option here. You can skip or end whenever you like."); }
    if (command === "end") end();
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

  function finish(list: RoutineStep[]) {
    voice.stop(); setEndAt(null);
    if (list.length) onFinish(list, elapsedMinutes(Date.now() - started)); else setStopped(true);
  }
  function end() { finish(done); }
  function goTo(next: number, completed?: RoutineStep) {
    const list = completed ? [...done, completed] : done;
    if (completed) setDone(list);
    if (next >= steps.length) { finish(list); return; }
    // Rest is a player phase, not an exercise. Ending or skipping it never records the upcoming step.
    const rest = completed ? routine.restSeconds ?? 0 : 0;
    setResting(rest > 0); setEndAt(rest ? Date.now() + rest * 1000 : null); setSetNo(1); setIndex(next);
    setRemaining(rest || steps[next]?.amount.seconds || 0); setCount(steps[next]?.amount.reps ?? 0);
  }
  // Done records the step with the reps really counted. Counting none records nothing.
  function complete() {
    if (step.amount.reps === undefined || count === step.amount.reps) goTo(index + 1, step);
    else if (count > 0) goTo(index + 1, { ...step, amount: { ...step.amount, reps: count } });
    else goTo(index + 1);
  }
  function swap(id: string | null) {
    const next = withTarget(swapStep(step, id), targets);
    setSteps(all => all.map((s, i) => i === index ? next : s));
    setEndAt(null); setSetNo(1); setRemaining(next.amount.seconds ?? 0); setCount(next.amount.reps ?? 0);
  }
  function startTimer() { setEndAt(Date.now() + (remaining || timerDuration) * 1000); }
  function moreRest() { if (endAt === null) setRemaining(r => r + 15); else setEndAt(e => (e ?? Date.now()) + 15000); }
  function toggleVoice() { window.dispatchEvent(new Event("daywell-stop-voice")); setSpoken(on => !on); }

  if (stopped || !step) return <section ref={top} className="mv-player mv-player-end" aria-labelledby="mv-ended">
    <CompanionPortrait id={routine.companion} size={110} motion="happy" decorative />
    <h2 id="mv-ended">Starting is enough for today.</h2>
    <p>Nothing was recorded, so there’s nothing to save.</p>
    <button type="button" className="mv-btn" onClick={onClose}>Back to Move</button>
  </section>;

  const ex = step.exercise, timed = resting || step.amount.seconds !== undefined, last = index + 1 === steps.length;
  const easier = !resting && ex.easier ? swapStep(step, ex.easier).exercise.name : null, harder = !resting && ex.harder ? swapStep(step, ex.harder).exercise.name : null;
  const look = focusLook(ex.focus), picture = exercisePicture(ex.id, figure);
  const where = resting ? `Next is step ${index + 1} of ${steps.length}` : `${step.rounds > 1 ? `Round ${step.round} of ${step.rounds} · ` : ""}Step ${index + 1} of ${steps.length}${step.amount.sets > 1 ? ` · set ${setNo} of ${step.amount.sets}` : ""}`;
  return <section ref={top} className="mv-player" aria-labelledby="mv-step">
    <header className="mv-player-head">
      <button type="button" className="mv-round" aria-label="End workout" onClick={end}><X size={20} aria-hidden /></button>
      <div><strong id="mv-step" aria-live="polite">{resting ? "Rest and reset" : ex.name}</strong><span>{where}</span></div>
      <button type="button" className={`mv-round${spoken ? " is-on" : ""}`} aria-pressed={spoken} aria-label="Read each step aloud" disabled={!voice.canSpeak} onClick={toggleVoice}>{spoken ? <Volume2 size={20} aria-hidden /> : <VolumeX size={20} aria-hidden />}</button>
    </header>
    <div className="mv-progress" role="progressbar" aria-label="Routine progress" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={index}><span style={{ width: `${(index / steps.length) * 100}%` }} /></div>
    {index === 0 && !resting && !briefed && routine.setup && <p className="mv-caution">{routine.setup}</p>}
    {resting
      ? <div className="mv-clock is-rest"><strong role="timer" aria-label={`${remaining} seconds of rest left`}>{clock(remaining)}</strong><span>rest left</span></div>
      : picture ? <ExercisePicture exercise={ex} figure={figure} onFigure={onFigure} />
        : <div className={`mv-big-tile area-tone-${look.tone}`}><look.Icon size={52} strokeWidth={1.6} aria-hidden /><span>{look.name}</span></div>}
    <div className="mv-bounce">
      <CompanionPortrait id={routine.companion} size={76} motion={endAt && !resting ? "encouraging" : "idle"} decorative />
      <div className="mv-bubble"><p><span className="sr-only">{helper.name}: </span>{resting ? (remaining === 0 ? "The rest timer has finished. Take longer if you need." : "Rest and reset. Put any weight down safely and breathe normally.") : ex.cue}</p>{spoken && <small><Volume2 size={14} aria-hidden />Read aloud by your device’s voice</small>}</div>
    </div>
    {resting ? <>
      <section className="mv-next" aria-labelledby="mv-next-up"><MoveFace exercise={ex} figure={figure} /><div><span>Next up</span><h3 id="mv-next-up">{ex.name}</h3><small>{step.amount.text}</small></div></section>
      <div className="mv-row-buttons"><button type="button" className="mv-btn" onClick={() => goTo(index)}><Play size={18} aria-hidden />I’m ready</button><button type="button" className="mv-btn is-ghost" aria-label="Add 15 seconds of rest" onClick={moreRest}>+15 s</button></div>
    </> : <>
      <p className="mv-amount">{step.amount.text}{ex.kit ? ` · needs ${ex.kit.toLowerCase()}` : ""}</p>
      {ex.caution && <p className="mv-caution">{ex.caution}</p>}
      {timed
        ? <div className="mv-clock"><strong role="timer" aria-label={`${remaining} seconds left`}>{clock(remaining)}</strong><span>left of {clock(timerDuration)}</span></div>
        : step.amount.reps !== undefined && <div className="mv-count" role="group" aria-label="Reps done">
          <button type="button" aria-label="One fewer" disabled={count <= 0} onClick={() => setCount(c => Math.max(0, c - 1))}><Minus size={22} aria-hidden /></button>
          <p><strong aria-live="polite">{count}</strong><span>of {step.amount.reps} reps</span></p>
          <button type="button" aria-label="One more" disabled={count >= 200} onClick={() => setCount(c => Math.min(200, c + 1))}><Plus size={22} aria-hidden /></button>
        </div>}
      <div className="mv-row-buttons">
        {timed && endAt !== null && <button type="button" className="mv-btn" onClick={() => setEndAt(null)}><Pause size={18} aria-hidden />Pause</button>}
        {timed && endAt === null && remaining > 0 && <button type="button" className="mv-btn" onClick={startTimer}><Play size={18} aria-hidden />{remaining === timerDuration ? "Start timer" : "Continue"}</button>}
        {(!timed || endAt === null) && <button type="button" className={`mv-btn${timed && remaining > 0 ? " is-ghost" : ""}`} onClick={complete}><Check size={18} aria-hidden />{last ? "Done, finish" : "Done, next"}</button>}
      </div>
      <div className="mv-chips">
        {timed && endAt === null && remaining !== timerDuration && <button type="button" className="mv-chip" onClick={() => setRemaining(timerDuration)}><RotateCcw size={16} aria-hidden />Reset</button>}
        {easier && <button type="button" className="mv-chip" onClick={() => swap(ex.easier)}><ArrowDown size={16} aria-hidden />Easier: {easier}</button>}
        {harder && <button type="button" className="mv-chip" onClick={() => swap(ex.harder)}><ArrowUp size={16} aria-hidden />Harder: {harder}</button>}
        <button type="button" className="mv-chip" onClick={() => goTo(index + 1)}><SkipForward size={16} aria-hidden />Skip</button>
      </div>
    </>}
    <section className="mv-voice" aria-label="Training partner voice">
      <button type="button" className="mv-chip" disabled={!voice.available} onClick={() => { if (voice.listening) voice.stop(); else { window.dispatchEvent(new Event("daywell-stop-voice")); voice.start(); } }}><Mic size={17} aria-hidden />{voice.listening ? "Stop listening" : "Tap to give a command"}</button>
      <small>{resting ? "Say “next” when ready, “pause” to pause the rest timer, or “end”. Rest never counts as a completed exercise." : "Say “done” to record this step, “next” to skip, or “pause”, “continue”, “repeat”, “easier”, “end”."} Tap the mic for each command.</small>
      <PrivacyDetails><p>Voice commands use your browser’s speech recognition, which may process audio online. Spoken steps use your device’s voice. Your camera stays off.</p></PrivacyDetails>
      {!voice.available && <p>Voice commands aren’t available in this browser. All routine controls work by tapping.</p>}
      <p role="status">{voice.listening ? "Listening…" : voiceNote}</p>{voice.error && <p role="alert">Voice couldn’t continue. Use the buttons, or check microphone access and try again.</p>}
    </section>
    <CompanionMotionControl />
  </section>;
}
