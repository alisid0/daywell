"use client";
import { useRef, useState, type FormEvent } from "react";
import { ArrowUpRight, Plus, X, History, Check } from "lucide-react";
import { CompanionPortrait } from "@/components/daywell-companions";
import { today, schemas } from "@/lib/daywell";
import { exerciseHistory, matchingRecipes, missingIngredients, pillars, type WorkoutSet } from "@/lib/wellbeing";
import type { AppState } from "./use-daywell";
import { ModuleView } from "./modules";
import { EntryActions } from "./parts";
import { GroceryWorkspace } from "./everyday";
import { RestSpace } from "./rest-space";

export function ExploreSpace({ a }: { a: AppState }) {
  return <section className="well-space"><div className="well-heading"><span>A little care, every day</span><h1>What would feel good?</h1><p>Four places to begin. You only need one.</p></div><div className="pillar-grid">{pillars.map(p => <button className={`pillar-door pillar-${p.id}`} key={p.id} onClick={() => a.setActive(p.id)}><CompanionPortrait id={p.companion} size={135} decorative /><div><h2>{p.title}</h2><p>{p.detail}</p></div><ArrowUpRight size={22} /></button>)}</div><div className="well-support"><button onClick={() => { a.setActive("calendar"); a.setCalendarView("history"); }}><History size={18} />Look back, at your pace</button><details><summary>Everyday extras</summary><div>{[["focus","Priorities & focus"],["clock","Clocks & timers"],["alarm","Alarms"]].map(([id,label]) => <button key={id} onClick={() => a.setActive(id)}>{label}<ArrowUpRight size={16}/></button>)}</div></details></div><p className="well-footnote">Small habits for feeling well today and caring for your future self.</p></section>;
}
function Heading({ id }: { id: typeof pillars[number]["id"] }) { const p = pillars.find(x => x.id === id)!; return <header className="well-pillar-heading"><div><span>{p.title}</span><h1>{p.line}</h1><p>{p.detail}</p></div><CompanionPortrait id={p.companion} size={130} decorative /></header>; }
function LookBack({ a }: { a: AppState }) { return <button className="well-text-button" onClick={() => { a.setActive("calendar"); a.setCalendarView("history"); }}><History size={17} />See your saved days</button>; }
export function PillarWorkspace({ a }: { a: AppState }) {
  if (a.active === "explore") return <ExploreSpace a={a}/>;
  if (a.active === "relax") return <RestSpace a={a}/>;
  if (a.active === "move") return <MoveSpace a={a}/>;
  if (a.active === "eat") return <EatSpace a={a}/>;
  if (a.active === "sleep") return <SleepSpace a={a}/>;
  return <ModuleView a={a}/>;
}
function MoveSpace({ a }: { a: AppState }) {
  const [form, setForm] = useState(false), [title, setTitle] = useState("Strength session"), [date, setDate] = useState(today()), [minutes, setMinutes] = useState("20");
  const [sets, setSets] = useState<WorkoutSet[]>([{ exercise: "", reps: 8, kg: 0 }]), [error, setError] = useState(""), [saving, setSaving] = useState(false);
  const guard = useRef(false);
  const [editId, setEditId] = useState<string | null>(null);
  const activities = [...a.by("move")].sort((x,y) => y.data.date.localeCompare(x.data.date));
  const recent = exerciseHistory(a.entries.filter(e=>e.id!==editId), sets.at(-1)?.exercise || "");
  function toggleWorkout() {
    if (form) { setForm(false); return; }
    setEditId(null); setTitle("Strength session"); setDate(today()); setMinutes("20");
    setSets([{ exercise: "", reps: 8, kg: 0 }]); setError(""); setForm(true);
  }
  async function saveWorkout(event: FormEvent) {
    event.preventDefault(); if (guard.current) return; setError("");
    const result = schemas.move.safeParse({ title, date, minutes: Number(minutes), sets });
    if (!result.success) { setError("Give each set an exercise, 1–200 reps and a weight of 0–500 kg. Choose 1–600 minutes."); return; }
    guard.current = true; setSaving(true);
    const saved = await a.save([{ id: editId || crypto.randomUUID(), kind: "move", data: result.data }], "Workout saved. A little stronger.");
    guard.current = false; setSaving(false);
    if (saved) { setForm(false); setEditId(null); setTitle("Strength session"); setSets([{ exercise: "", reps: 8, kg: 0 }]); } else setError("Your workout hasn’t saved. Your details are still here to retry.");
  }
  return <section className="well-space"><Heading id="move"/><div className="well-actions"><button className="well-button" onClick={toggleWorkout}><Plus size={17}/>{form ? "Close workout" : "Record a strength session"}</button><button className="well-button well-secondary" onClick={() => a.openEditor("move")}>Log a walk or movement</button></div>
    {form && <form className="well-card workout-form" onSubmit={saveWorkout}><h2>What did you do?</h2><p>Record the sets you completed. Zero kg means bodyweight or no added weight.</p><div className="well-form-grid"><label>Session name<input required maxLength={160} value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Date<input required type="date" max={today()} value={date} onChange={e=>setDate(e.target.value)}/></label><label>Minutes<input required type="number" min="1" max="600" value={minutes} onChange={e=>setMinutes(e.target.value)}/></label></div><div className="workout-sets">{sets.map((set,i) => <fieldset key={i}><legend>Set {i+1}</legend><label>Exercise<input required maxLength={80} placeholder="e.g. Squat" value={set.exercise} onChange={e=>setSets(s=>s.map((v,j)=>j===i?{...v,exercise:e.target.value}:v))}/></label><label>Reps<input required type="number" min="1" max="200" value={set.reps || ""} onChange={e=>setSets(s=>s.map((v,j)=>j===i?{...v,reps:Number(e.target.value)}:v))}/></label><label>Weight (kg)<input required type="number" min="0" max="500" step=".25" value={set.kg} onChange={e=>setSets(s=>s.map((v,j)=>j===i?{...v,kg:Number(e.target.value)}:v))}/></label><button type="button" disabled={sets.length===1} aria-label={`Remove set ${i+1}`} onClick={()=>setSets(s=>s.filter((_,j)=>j!==i))}><X size={17}/></button></fieldset>)}</div><button className="well-text-button" type="button" disabled={sets.length>=20} onClick={()=>setSets(s=>[...s,{...s[s.length-1]}])}><Plus size={17}/>Another set</button>{recent.length>0&&<aside className="workout-last"><strong>Last time you recorded {recent[0].exercise}</strong><p>{recent[0].date}: {recent[0].reps} reps · {recent[0].kg===0?"bodyweight":`${recent[0].kg} kg`}. Choose what feels right today.</p></aside>}{error&&<p role="alert" className="form-error">{error}</p>}<button className="well-button" disabled={saving} type="submit">{saving?"Saving…":"Save workout"}</button></form>}
    <div className="well-card move-invitation"><h2>A little company while you move?</h2><p>Ask for a walk or workout timer. Bounce can offer gentle encouragement while you keep Daywell open.</p><button className="well-text-button" onClick={()=>window.dispatchEvent(new CustomEvent("daywell-host",{detail:{text:"Start a workout for 15 minutes"}}))}>Make time with Bounce<ArrowUpRight size={17}/></button></div>
    <div className="well-section-title"><h2>Your movement story</h2><LookBack a={a}/></div>{activities.length?<div className="well-records">{activities.slice(0,20).map(e=><article className="well-record" key={e.id}><div><strong>{e.data.title}</strong><small>{e.data.date} · {e.data.minutes} minutes</small>{Array.isArray(e.data.sets)&&<details><summary>{e.data.sets.length} recorded sets</summary><ul>{(e.data.sets as WorkoutSet[]).map((s,i)=><li key={i}>{s.exercise} · {s.reps} reps · {s.kg===0?"bodyweight":`${s.kg} kg`}</li>)}</ul></details>}</div>{Array.isArray(e.data.sets)?<div className="well-actions"><button className="well-text-button" aria-label={`Edit ${e.data.title}`} onClick={()=>{setEditId(e.id);setTitle(e.data.title);setDate(e.data.date);setMinutes(String(e.data.minutes));setSets(e.data.sets.map((s:WorkoutSet)=>({...s})));setError("");setForm(true);requestAnimationFrame(()=>document.querySelector(".workout-form")?.scrollIntoView({block:"center"}));}}>Edit</button><button className="well-text-button" aria-label={`Remove ${e.data.title}`} onClick={()=>void a.remove(e)}>Remove</button></div>:<EntryActions a={a} e={e}/>}</article>)}</div>:<p className="well-empty">Your first walk, workout or stretch can go here. No daily target to catch up with.</p>}<p className="well-footnote">Work within your comfort and experience. <a href="https://www.nhs.uk/live-well/exercise/how-to-improve-strength-flexibility/" target="_blank" rel="noreferrer">NHS strength & flexibility guidance</a></p></section>;
}
function EatSpace({ a }: { a: AppState }) {
  const [view, setView] = useState("ideas"), [pantry, setPantry] = useState("");
  const meals = [...a.by("food")].sort((x,y)=>y.data.date.localeCompare(x.data.date));
  function ingredients(items: readonly string[]) { a.setPlan(missingIngredients(items, pantry, a.entries).map(title=>({id:crypto.randomUUID(),kind:"grocery",data:{title,quantity:"1",done:false}}))); }
  return <section className="well-space"><Heading id="eat"/><div className="well-tabs" aria-label="Eat views">{[["ideas","Make something"],["list","Food shopping"],["journal","My meals"]].map(([id,label])=><button key={id} aria-pressed={view===id} onClick={()=>setView(id)}>{label}</button>)}</div>{view==="ideas"&&<><label className="well-pantry">What’s already in your kitchen?<input placeholder="e.g. oats, berries, milk" value={pantry} maxLength={500} onChange={e=>setPantry(e.target.value)}/><small>Separate ingredients with commas. We’ll bring matching ideas to the top.</small></label><div className="recipe-ideas">{matchingRecipes(pantry).map(recipe=><article key={recipe.id} className="well-card"><span className="well-recipe-time">{recipe.time}</span><h2>{recipe.title}</h2><p>{recipe.ingredients.join(" · ")}</p><details><summary>Let’s make it</summary><ol>{recipe.steps.map(step=><li key={step}>{step}</li>)}</ol><small>{recipe.note}</small></details><div className="well-actions"><button className="well-button well-secondary" onClick={()=>ingredients(recipe.ingredients)}>Review missing ingredients</button><button className="well-text-button" onClick={()=>{a.openEditor("food");a.setDraft({title:recipe.title,date:today(),meal:"Lunch",calories:0,protein:0,carbs:0,fat:0,nutritionKnown:false});}}>I ate this<Check size={16}/></button></div></article>)}</div></>}{view==="list"&&<GroceryWorkspace a={a}/ >}{view==="journal"&&<><div className="well-section-title"><h2>Meals to remember</h2><button className="well-button" onClick={()=>a.openEditor("food")}><Plus size={16}/>Log a meal</button></div><p>Food and portions are enough. Nutrition details are optional.</p>{meals.length?<div className="well-records">{meals.slice(0,30).map(e=><article className="well-record" key={e.id}><div><strong>{e.data.title}</strong><small>{e.data.date} · {e.data.meal}{e.data.nutritionKnown!==false?` · ${e.data.calories} kcal (estimate)`:""}</small></div><EntryActions a={a} e={e}/></article>)}</div>:<p className="well-empty">A bowl of oats, a shared dinner, something new. Start with your next meal.</p>}<LookBack a={a}/></>}</section>;
}
function SleepSpace({ a }: { a: AppState }) {
  const [resting, setResting] = useState(false);
  if(resting) return <RestSpace a={a} bedtime onLeave={()=>setResting(false)}/>;
  return <section className="well-space"><Heading id="sleep"/><div className="well-card sleep-door"><div><h2>Make tonight a little softer.</h2><p>Quiet company, a gentle grounding prompt and optional soft sound.</p></div><button className="well-button" onClick={()=>{window.dispatchEvent(new Event("daywell-stop-voice"));setResting(true);}}>Wind down with Luma</button></div><ModuleView a={a}/><LookBack a={a}/></section>;
}
