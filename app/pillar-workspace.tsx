"use client";
import { useRef, useState, type FormEvent } from "react";
import { ArrowUpRight, Plus, X, History } from "lucide-react";
import { CompanionPortrait } from "@/components/daywell-companions";
import { today, schemas } from "@/lib/daywell";
import { describeSet, exerciseHistory, pillars, type WorkoutSet } from "@/lib/wellbeing";
import { exercises } from "@/lib/workouts";
import { MoveRoutines } from "./move-routines";
import type { AppState } from "./use-daywell";
import { ModuleView } from "./modules";
import { EntryActions } from "./parts";
import { FoodSpace } from "./food-space";
import { RestSpace } from "./rest-space";
import { CalendarStrip } from "./calendar-strip";
import { DailyNutrition, ActivityCaloriesFields } from "./food-tracking";
import { activityDetail } from "@/lib/food-tracking";
import { entriesForActions } from "@/lib/host";
import { toast } from "sonner";

export function ExploreSpace({ a }: { a: AppState }) {
  return <section className="well-space"><div className="well-heading"><span>A little care, every day</span><h1>What would feel good?</h1><p>Four places to begin. You only need one.</p></div><div className="pillar-grid">{pillars.map(p => <button className={`pillar-door pillar-${p.id}`} key={p.id} onClick={() => a.setActive(p.id)}><CompanionPortrait id={p.companion} size={135} decorative /><div><h2>{p.title}</h2><p>{p.detail}</p></div><ArrowUpRight size={22} /></button>)}</div><div className="well-support"><button onClick={() => { a.setActive("calendar"); a.setCalendarView("history"); }}><History size={18} />Look back, at your pace</button><details><summary>Everyday extras</summary><div>{[["focus","Priorities & focus"],["clock","Clocks & timers"],["alarm","Alarms"]].map(([id,label]) => <button key={id} onClick={() => a.setActive(id)}>{label}<ArrowUpRight size={16}/></button>)}</div></details></div><p className="well-footnote">Small habits for feeling well today and caring for your future self.</p></section>;
}
function Heading({ id }: { id: typeof pillars[number]["id"] }) { const p = pillars.find(x => x.id === id)!; return <header className="well-pillar-heading"><div><span>{p.title}</span><h1>{p.line}</h1><p>{p.detail}</p></div><CompanionPortrait id={p.companion} size={130} decorative /></header>; }
function LookBack({ a }: { a: AppState }) { return <button className="well-text-button" onClick={() => { a.setActive("calendar"); a.setCalendarView("history"); }}><History size={17} />See your saved days</button>; }
export function PillarWorkspace({ a }: { a: AppState }) {
  if (a.active === "explore") return <ExploreSpace a={a}/>;
  if (a.active === "relax") return <RestSpace a={a}/>;
  if (a.active === "move") return <MoveSpace a={a}/>;
  if (a.active === "eat") return <FoodSpace a={a}/>;
  if (a.active === "sleep") return <SleepSpace a={a}/>;
  return <ModuleView a={a}/>;
}
function toUnit({ reps, seconds, ...set }: WorkoutSet, unit: string): WorkoutSet {
  return unit === "seconds" ? { ...set, seconds: seconds ?? 30 } : { ...set, reps: Math.min(reps ?? 8, 200) };
}
function MoveSpace({ a }: { a: AppState }) {
  const [form, setForm] = useState(false), [title, setTitle] = useState("Strength session"), [date, setDate] = useState(today()), [minutes, setMinutes] = useState("20");
  const [sets, setSets] = useState<WorkoutSet[]>([{ exercise: "", reps: 8, kg: 0 }]), [error, setError] = useState(""), [saving, setSaving] = useState(false);
  const guard = useRef(false);
  const [caloriesBurned, setCaloriesBurned] = useState<number | undefined>(), [calorieSource, setCalorieSource] = useState<string | undefined>();
  const [editId, setEditId] = useState<string | null>(null), [choosing, setChoosing] = useState(false);
  const activities = [...a.by("move")].sort((x,y) => y.data.date.localeCompare(x.data.date));
  const recent = exerciseHistory(a.entries.filter(e=>e.id!==editId), sets.at(-1)?.exercise || "");
  function toggleWorkout() {
    if (form) { setForm(false); return; }
    setCaloriesBurned(undefined); setCalorieSource(undefined); setEditId(null); setTitle("Strength session"); setDate(today()); setMinutes("20");
    setSets([{ exercise: "", reps: 8, kg: 0 }]); setError(""); setForm(true);
  }
  function logRoutine(name: string, mins: number, done: WorkoutSet[]) {
    setCaloriesBurned(undefined); setCalorieSource(undefined); setEditId(null); setTitle(name); setDate(today()); setMinutes(String(mins)); setSets(done); setError(""); setForm(true);
    requestAnimationFrame(()=>document.querySelector(".workout-form")?.scrollIntoView({block:"start"}));
  }
  // Starts the timer straight away. If another activity is running, ask first through the usual request.
  async function startWithBounce() {
    if (a.timer.endAt && a.remaining > 0) { window.dispatchEvent(new CustomEvent("daywell-host", { detail: { text: "Start a workout for 15 minutes" } })); return; }
    const items = entriesForActions([{ type: "activity", companion: "bounce", title: "Workout", minutes: 15 }], today(), Date.now(), () => crypto.randomUUID());
    a.unlockAudio();
    try { await a.hostChange(items); window.dispatchEvent(new CustomEvent("daywell-host", { detail: { show: true } })); }
    catch (problem) { toast.error(problem instanceof Error ? problem.message : "Couldn’t start the timer. Please try again."); }
  }
  async function saveWorkout(event: FormEvent) {
    event.preventDefault(); if (guard.current) return; setError("");
    const result = schemas.move.safeParse({ title, date, minutes: Number(minutes), sets, caloriesBurned, calorieSource });
    if (!result.success) { setError("Give each set an exercise, 1–200 reps or 1–3600 seconds, and a weight of 0–500 kg. Choose 1–600 minutes and, if known, 0–10,000 activity kcal."); return; }
    guard.current = true; setSaving(true);
    const saved = await a.save([{ id: editId || crypto.randomUUID(), kind: "move", data: result.data }], "Workout saved. A little stronger.");
    guard.current = false; setSaving(false);
    if (saved) { setForm(false); setCaloriesBurned(undefined); setCalorieSource(undefined); setEditId(null); setTitle("Strength session"); setSets([{ exercise: "", reps: 8, kg: 0 }]); } else setError("Your workout hasn’t saved. Your details are still here to retry.");
  }
  return <section className="well-space"><Heading id="move"/><CalendarStrip a={a} area="move"/><MoveRoutines onLog={logRoutine}/><DailyNutrition a={a} area="move"/><div className="well-actions">{form ? <button className="well-button well-secondary" onClick={toggleWorkout}><X size={17}/>Close strength session</button> : <button className="well-button" aria-expanded={choosing} onClick={() => setChoosing(!choosing)}><Plus size={17}/>Record a move</button>}</div>
    {choosing && !form && <div className="record-choice" role="group" aria-label="What kind of move?"><button type="button" onClick={() => { setChoosing(false); a.openEditor("move"); }}><strong>A walk or other activity</strong><small>Name, date and minutes</small></button><button type="button" onClick={() => { setChoosing(false); toggleWorkout(); }}><strong>A strength session</strong><small>Exercises, sets, reps and weight</small></button></div>}
    {form && <form className="well-card workout-form" onSubmit={saveWorkout}><h2>What did you do?</h2><p>Record the sets you completed. Zero kg means bodyweight or no added weight.</p><div className="well-form-grid"><label>Session name<input required maxLength={160} value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Date<input required type="date" max={today()} value={date} onChange={e=>setDate(e.target.value)}/></label><label>Minutes<input required type="number" min="1" max="600" value={minutes} onChange={e=>setMinutes(e.target.value)}/></label></div>{a.settings.calorieTracking && <ActivityCaloriesFields calories={caloriesBurned} source={calorieSource} onChange={(calories,source)=>{setCaloriesBurned(calories);setCalorieSource(source);}}/>}<div className="workout-sets">{sets.map((set,i) => <fieldset key={i}><legend>Set {i+1}</legend><label>Exercise<input required maxLength={80} list="daywell-exercises" placeholder="e.g. Squat" value={set.exercise} onChange={e=>setSets(s=>s.map((v,j)=>j===i?{...v,exercise:e.target.value}:v))}/></label><label>{set.seconds!==undefined?"Seconds":"Reps"}<span className="set-amount"><input required type="number" min="1" max={set.seconds!==undefined?3600:200} value={(set.seconds??set.reps) || ""} onChange={e=>setSets(s=>s.map((v,j)=>j===i?(v.seconds!==undefined?{...v,seconds:Number(e.target.value)}:{...v,reps:Number(e.target.value)}):v))}/><select aria-label={`Count set ${i+1} in`} value={set.seconds!==undefined?"seconds":"reps"} onChange={e=>setSets(s=>s.map((v,j)=>j===i?toUnit(v,e.target.value):v))}><option value="reps">reps</option><option value="seconds">sec</option></select></span></label><label>Weight (kg)<input required type="number" min="0" max="500" step=".25" value={set.kg} onChange={e=>setSets(s=>s.map((v,j)=>j===i?{...v,kg:Number(e.target.value)}:v))}/></label><button type="button" disabled={sets.length===1} aria-label={`Remove set ${i+1}`} onClick={()=>setSets(s=>s.filter((_,j)=>j!==i))}><X size={17}/></button></fieldset>)}<datalist id="daywell-exercises">{exercises.map(x=><option key={x.id} value={x.name}/>)}</datalist></div><button className="well-text-button" type="button" disabled={sets.length>=20} onClick={()=>setSets(s=>[...s,{...s[s.length-1]}])}><Plus size={17}/>Another set</button>{recent.length>0&&<aside className="workout-last"><strong>Last time you recorded {recent[0].exercise}</strong><p>{recent[0].date}: {describeSet(recent[0])}. Choose what feels right today.</p></aside>}{error&&<p role="alert" className="form-error">{error}</p>}<button className="well-button" disabled={saving} type="submit">{saving?"Saving…":"Save workout"}</button></form>}
    <div className="well-card move-invitation"><h2>A little company while you move?</h2><p>Start a 15-minute timer, and Bounce keeps you company while Daywell is open.</p><button className="well-text-button" onClick={()=>void startWithBounce()}>Start 15 minutes with Bounce<ArrowUpRight size={17}/></button></div>
    <div className="well-section-title"><h2>Your movement story</h2><LookBack a={a}/></div>{activities.length?<div className="well-records">{activities.slice(0,20).map(e=><article className="well-record" key={e.id}><div><strong>{e.data.title}</strong><small>{[e.data.date, `${e.data.minutes} ${e.data.minutes === 1 ? "minute" : "minutes"}`, a.settings.calorieTracking && Number.isFinite(e.data.caloriesBurned) ? activityDetail(e.data) : ""].filter(Boolean).join(" · ")}</small>{Array.isArray(e.data.sets)&&<details><summary>{e.data.sets.length} recorded sets</summary><ul>{(e.data.sets as WorkoutSet[]).map((s,i)=><li key={i}>{s.exercise} · {describeSet(s)}</li>)}</ul></details>}</div>{Array.isArray(e.data.sets)?<div className="well-actions"><button className="well-text-button" aria-label={`Edit ${e.data.title}`} onClick={()=>{setCaloriesBurned(e.data.caloriesBurned);setCalorieSource(e.data.calorieSource);setEditId(e.id);setTitle(e.data.title);setDate(e.data.date);setMinutes(String(e.data.minutes));setSets(e.data.sets.map((s:WorkoutSet)=>({...s})));setError("");setForm(true);requestAnimationFrame(()=>document.querySelector(".workout-form")?.scrollIntoView({block:"center"}));}}>Edit</button><button className="well-text-button" aria-label={`Remove ${e.data.title}`} onClick={()=>void a.remove(e)}>Remove</button></div>:<EntryActions a={a} e={e}/>}</article>)}</div>:<p className="well-empty">Your first walk, workout or stretch can go here. No daily target to catch up with.</p>}<p className="well-footnote">Work within your comfort and experience. <a href="https://www.nhs.uk/live-well/exercise/how-to-improve-strength-flexibility/" target="_blank" rel="noreferrer">NHS strength & flexibility guidance</a></p></section>;
}
function SleepSpace({ a }: { a: AppState }) {
  const [resting, setResting] = useState(false);
  if(resting) return <RestSpace a={a} bedtime onLeave={()=>setResting(false)}/>;
  return <section className="well-space"><Heading id="sleep"/><CalendarStrip a={a} area="sleep"/><div className="well-card sleep-door"><div><h2>Make tonight a little softer.</h2><p>Quiet company, a gentle grounding prompt and optional soft sound.</p></div><button className="well-button" onClick={()=>{window.dispatchEvent(new Event("daywell-stop-voice"));setResting(true);}}>Wind down with Luma</button></div><ModuleView a={a}/><LookBack a={a}/></section>;
}
