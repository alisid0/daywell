"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Footprints, Monitor, Moon, PersonStanding, Play, Plus, Sun, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CompanionPortrait } from "@/components/daywell-companions";
import { today, type Entry } from "@/lib/daywell";
import { dateLabel } from "@/lib/calendar";
import type { GuideFigure } from "@/lib/exercise-pictures";
import { levelLabels, routines, type Routine, type Where } from "@/lib/workouts";
import { minutesByDay, otherOptions, routineById, routineOutline, suggestToday, weekOf, type OutlineItem } from "@/lib/move-plan";
import { RoutinePlayer } from "./move-routines";
import { MoveRecord, type RecordStart } from "./move-record";
import { MoveList, MoveWeek } from "./move-week";
import { MoveFace, kitWords, routineMoves } from "./move-look";
import type { AppState } from "./use-daywell";

// Move (owner-approved design, 22 October 2026): today's move first, then every workout, doing it with Bounce, recording
// what really happened, and a look back at the week. Planning the week is left for later (owner, 22 October).
type View =
  | { name: "home" } | { name: "workouts" } | { name: "about"; routine: Routine }
  | { name: "play"; routine: Routine; back: "home" | "about" | "week" } | { name: "record"; start: RecordStart; back: "home" | "moves" }
  | { name: "walk" } | { name: "week" } | { name: "moves" };

const REST_KEY = "daywell-move-rest", WALK_KEY = "daywell-walk-start", RECORD_KEY = "daywell-move-record";
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string | null) => { try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch { /* kept for this visit only */ } };
const minutesWords = (m: number) => `${m} min`;
const plain = (name: "home" | "workouts" | "week" | "moves"): View => name === "home" ? { name } : name === "workouts" ? { name } : name === "week" ? { name } : { name };

export function MoveSpace({ a }: { a: AppState }) {
  const [view, setView] = useState<View>(() => read(WALK_KEY) ? { name: "walk" } : { name: "home" });
  const figure = a.settings.guideFigure;
  // Home opens at the top of the page; other places open at the top of Move. The player places itself (it runs first).
  const wrap = useRef<HTMLElement>(null);
  useEffect(() => {
    if (view.name === "home") window.scrollTo({ top: 0, behavior: "instant" });
    else if (view.name !== "play") wrap.current?.scrollIntoView({ block: "start" });
  }, [view.name]);
  // The figure in the workout pictures is a setting, so it follows the person to their other devices.
  async function chooseFigure(guideFigure: GuideFigure) { const problem = await a.saveDetails({ guideFigure }); if (problem) toast.error(problem); }
  const play = (routine: Routine, back: "home" | "about" | "week" = "home") => setView({ name: "play", routine, back });
  const record = (kind?: "strength" | "walk" | "other", minutes?: number) => {
    const remembered = read(RECORD_KEY);
    setView({ name: "record", start: { kind: kind ?? (remembered === "strength" || remembered === "other" ? remembered : "walk"), minutes }, back: "home" });
  };

  if (view.name === "play") return <section ref={wrap} className="well-space mv-wrap"><RoutinePlayer routine={view.routine} figure={figure} onFigure={f => void chooseFigure(f)} targets={a.settings.moveTargets} briefed={view.back === "about"}
    onFinish={(done, minutes) => setView({ name: "record", start: { kind: "after", routine: view.routine, done, minutes }, back: "home" })}
    onClose={() => setView(view.back === "about" ? { name: "about", routine: view.routine } : plain(view.back))} /></section>;
  if (view.name === "record") return <section ref={wrap} className="well-space mv-wrap"><MoveRecord a={a} start={view.start} figure={figure} onClose={() => setView(plain(view.back))} onSaved={() => setView(plain(view.back === "moves" ? "moves" : "week"))} /></section>;
  if (view.name === "walk") return <section ref={wrap} className="well-space mv-wrap"><Walk onFinish={minutes => { write(WALK_KEY, null); record("walk", minutes); }} onCancel={() => { write(WALK_KEY, null); setView({ name: "home" }); }} onBack={() => setView({ name: "home" })} /></section>;
  return <section ref={wrap} className="well-space mv-wrap">
    {view.name === "home" && <Home a={a} figure={figure} play={play} onRecord={() => record()} onWorkouts={() => setView({ name: "workouts" })} onWeek={() => setView({ name: "week" })} onWalk={() => { if (!read(WALK_KEY)) write(WALK_KEY, String(Date.now())); setView({ name: "walk" }); }} />}
    {view.name === "workouts" && <Workouts figure={figure} onBack={() => setView({ name: "home" })} onOpen={routine => setView({ name: "about", routine })} />}
    {view.name === "about" && <About routine={view.routine} figure={figure} onFigure={f => void chooseFigure(f)} onBack={() => setView({ name: "workouts" })} onStart={() => play(view.routine, "about")} />}
    {view.name === "week" && <MoveWeek a={a} figure={figure} onBack={() => setView({ name: "home" })} onMoves={() => setView({ name: "moves" })} onStart={routine => play(routine, "week")} />}
    {view.name === "moves" && <MoveList a={a} onBack={() => setView({ name: "week" })} onEdit={(entry: Entry) => setView({ name: "record", start: { kind: Array.isArray(entry.data.sets) ? "strength" : "walk", entry }, back: "moves" })} />}
  </section>;
}

// 1 · Today: the week so far, one suggested workout, quick moves, and the ways to record or find more.
function Home({ a, figure, play, onRecord, onWorkouts, onWeek, onWalk }: { a: AppState; figure: GuideFigure; play: (routine: Routine) => void; onRecord: () => void; onWorkouts: () => void; onWeek: () => void; onWalk: () => void }) {
  const day = today(), week = weekOf(day), minutes = minutesByDay(a.entries, week);
  const moved = week.filter(d => minutes.has(d)).length, total = [...minutes.values()].reduce((sum, m) => sum + m, 0);
  const pick = suggestToday(a.entries, day);
  const [resting, setResting] = useState(() => read(REST_KEY) === day), [choosing, setChoosing] = useState(false);
  const walking = !!read(WALK_KEY);
  const stretch = routineById.get(new Date().getHours() < 12 ? "morning-wake-up" : "wind-down-stretch")!, desk = routineById.get("desk-break")!;
  function rest(on: boolean) { setResting(on); setChoosing(false); write(REST_KEY, on ? day : null); }
  return <div className="mv-space">
    <div className="mv-top">
      <div><span>Move · {dateLabel(day, { weekday: "long" })}</span><h1>Your move today</h1></div>
      <CompanionPortrait id="bounce" size={64} decorative />
    </div>
    {walking && <button type="button" className="mv-banner" onClick={onWalk}><Footprints size={18} aria-hidden />A walk is in progress<ChevronRight size={18} aria-hidden /></button>}
    <button type="button" className="mv-week" onClick={onWeek} aria-label={`This week: ${moved ? `you moved on ${moved} ${moved === 1 ? "day" : "days"}, ${total} minutes in all` : "nothing recorded yet"}. Open your week`}>
      <span className="mv-week-head"><strong>This week</strong><span>{moved ? `${moved} ${moved === 1 ? "day" : "days"} · ${total} min` : "Nothing yet"}<ChevronRight size={16} aria-hidden /></span></span>
      <span className="mv-week-days" aria-hidden>{week.map(d => <span key={d} className={d === day ? "is-today" : undefined}>{dateLabel(d, { weekday: "narrow" })}<i className={minutes.has(d) ? "is-moved" : undefined} /></span>)}</span>
    </button>
    {resting
      ? <section className="mv-card mv-today is-rest" aria-labelledby="mv-rest"><span className="mv-pill"><Moon size={15} aria-hidden />Resting today</span><h2 id="mv-rest">Rest is part of it</h2><p>Rest days count. You’ll get a fresh idea tomorrow.</p><button type="button" className="mv-btn is-ghost" onClick={() => rest(false)}>Show today’s idea</button></section>
      : <section className="mv-card mv-today" aria-labelledby="mv-pick">
        <span className={`mv-pill${pick.first ? " is-gentle" : ""}`}>{pick.first ? "A gentle start" : "Suggested for today"}</span>
        <h2 id="mv-pick">{pick.routine.name}</h2>
        <p className="mv-meta">{pick.routine.minutes} min · {levelLabels[pick.routine.level]} · {kitWords(pick.routine)}</p>
        <div className="mv-thumbs">{routineMoves(pick.routine, figure).map(m => <MoveFace key={m.id} exercise={m} figure={figure} label={m.name} />)}</div>
        <p className="mv-reason">{pick.reason}</p>
        <div className="mv-row-buttons"><button type="button" className="mv-btn" onClick={() => play(pick.routine)}><Play size={18} aria-hidden />Start</button><button type="button" className="mv-btn is-ghost" onClick={() => setChoosing(true)}>Not today</button></div>
      </section>}
    <section aria-labelledby="mv-quick" className="mv-quick">
      <h2 id="mv-quick">Or a quick move</h2>
      <div>
        <button type="button" onClick={onWalk}><Footprints size={22} aria-hidden /><strong>Walk</strong><span>With a timer</span></button>
        <button type="button" onClick={() => play(stretch)}><PersonStanding size={22} aria-hidden /><strong>Stretch</strong><span>{minutesWords(stretch.minutes)}</span></button>
        <button type="button" onClick={() => play(desk)}><Monitor size={22} aria-hidden /><strong>Desk break</strong><span>{minutesWords(desk.minutes)}</span></button>
      </div>
    </section>
    <div className="mv-pair">
      <button type="button" className="mv-btn is-ghost" onClick={onRecord}><Plus size={18} aria-hidden />Record a move</button>
      <button type="button" className="mv-btn is-ghost" onClick={onWorkouts}>All workouts<ChevronRight size={18} aria-hidden /></button>
    </div>
    <p className="well-footnote">Work within your comfort and experience. <a href="https://www.nhs.uk/live-well/exercise/how-to-improve-strength-flexibility/" target="_blank" rel="noreferrer">NHS strength & flexibility guidance</a></p>
    {choosing && <NotToday a={a} figure={figure} current={pick.routine} onPick={routine => { setChoosing(false); play(routine); }} onWalk={() => { setChoosing(false); onWalk(); }} onRest={() => rest(true)} onClose={() => setChoosing(false)} />}
  </div>;
}

// 1.2 · Not today: shorter, without kit, gentler, a walk, or rest.
function NotToday({ a, figure, current, onPick, onWalk, onRest, onClose }: { a: AppState; figure: GuideFigure; current: Routine; onPick: (routine: Routine) => void; onWalk: () => void; onRest: () => void; onClose: () => void }) {
  const { shorter, noKit, gentler } = otherOptions(current, a.entries, today());
  const options = [["Something shorter", shorter], ["No kit", noKit], ["Gentler", gentler]] as const;
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="kitchen-sheet mv-sheet" showCloseButton={false} aria-describedby={undefined}>
      <div className="mv-sheet-head"><DialogTitle>Not today? That’s fine.</DialogTitle><button type="button" className="mv-round" aria-label="Close" onClick={onClose}><X size={20} aria-hidden /></button></div>
      <p className="mv-hint">Would one of these suit you better?</p>
      <div className="mv-options">
        {options.map(([label, routine]) => routine && <button key={label} type="button" onClick={() => onPick(routine)}><MoveFace exercise={routineMoves(routine, figure, 1)[0]} figure={figure} /><span><strong>{label}</strong><small>{routine.name} · {routine.minutes} min</small></span><ChevronRight size={18} aria-hidden /></button>)}
        <button type="button" onClick={onWalk}><span className="mv-face mv-tile area-tone-green" aria-hidden><Footprints size={22} /></span><span><strong>Just a walk</strong><small>With a timer, as long as you like</small></span><ChevronRight size={18} aria-hidden /></button>
      </div>
      <button type="button" className="mv-btn is-ghost" onClick={onRest}><Moon size={18} aria-hidden />Rest today</button>
      <p className="mv-hint is-center">Rest days count. You’ll get a fresh idea tomorrow.</p>
    </DialogContent>
  </Dialog>;
}

// 2 · All workouts, filtered by where and how long.
const places: ["all" | Where, string][] = [["all", "Anywhere"], ["none", "No kit"], ["home", "At home"], ["gym", "Gym"]];
const lengths: ["any" | "10" | "20" | "long", string, string][] = [["any", "Any length", "Any length"], ["10", "10 min", "Up to 10 minutes"], ["20", "20 min", "Up to 20 minutes"], ["long", "Longer", "Longer than 20 minutes"]];
function Workouts({ figure, onBack, onOpen }: { figure: GuideFigure; onBack: () => void; onOpen: (routine: Routine) => void }) {
  const [where, setWhere] = useState<"all" | Where>("all"), [length, setLength] = useState<"any" | "10" | "20" | "long">("any");
  const shown = routines.filter(r => (where === "all" || r.where === where) && (length === "any" || (length === "long" ? r.minutes > 20 : r.minutes <= Number(length))));
  const filtered = where !== "all" || length !== "any";
  return <div className="mv-space">
    <header className="mv-head">
      <button type="button" className="mv-round" aria-label="Back to Move" onClick={onBack}><ChevronLeft size={20} aria-hidden /></button>
      <h1>All workouts</h1>
      {filtered ? <button type="button" className="mv-link" onClick={() => { setWhere("all"); setLength("any"); }}>Clear</button> : <span className="mv-count-note">{routines.length} workouts</span>}
    </header>
    <div className="mv-chips" role="group" aria-label="Where you’ll move">{places.map(([id, label]) => <button key={id} type="button" className="mv-chip" aria-pressed={where === id} onClick={() => setWhere(id)}>{label}</button>)}</div>
    <div className="mv-chips" role="group" aria-label="How long">{lengths.map(([id, label, full]) => <button key={id} type="button" className="mv-chip" aria-pressed={length === id} aria-label={full} onClick={() => setLength(id)}>{label}</button>)}</div>
    {filtered && <p className="mv-hint" role="status">{shown.length} of {routines.length} workouts fit</p>}
    {shown.length ? <ul className="mv-list">{shown.map(r => <li key={r.id}><button type="button" onClick={() => onOpen(r)}>
      <MoveFace exercise={routineMoves(r, figure, 1)[0]} figure={figure} />
      <span><strong>{r.name}</strong><small>{r.minutes} min · {levelLabels[r.level]} · {kitWords(r)}</small></span>
      <ChevronRight size={18} aria-hidden />
    </button></li>)}</ul> : <p className="well-empty">Nothing fits both. Try another length or place.</p>}
  </div>;
}

// 2.3 · Before you start: what the workout involves, safety first, then Start with Bounce.
const timesWords: Record<number, string> = { 2: "twice", 3: "three times", 4: "four times", 5: "five times" };
function About({ routine, figure, onFigure, onBack, onStart }: { routine: Routine; figure: GuideFigure; onFigure: (figure: GuideFigure) => void; onBack: () => void; onStart: () => void }) {
  const outline = routineOutline(routine);
  const row = (item: OutlineItem) => <li key={item.id}><MoveFace exercise={item.exercise} figure={figure} /><span><strong>{item.name}</strong><small>{item.text}</small></span></li>;
  const rounds = `${outline.first.length ? "Then " : ""}${timesWords[outline.times] ?? `${outline.times} times`} round${routine.restSeconds ? `, with ${routine.restSeconds} s rests` : ""}`;
  return <div className="mv-space">
    <header className="mv-head"><button type="button" className="mv-round" aria-label="Back to all workouts" onClick={onBack}><ChevronLeft size={20} aria-hidden /></button></header>
    <h1 className="mv-title">{routine.name}</h1>
    <p className="mv-meta">{routine.minutes} min · {levelLabels[routine.level]} · {kitWords(routine)}</p>
    <p>{routine.when}</p>
    <section className="mv-card" aria-labelledby="mv-todo">
      <h2 id="mv-todo">What you’ll do</h2>
      {outline.first.length > 0 && <ol className="mv-steps">{outline.first.map(row)}</ol>}
      {outline.repeat.length > 0 && <>{outline.times > 1 && <p className="mv-steps-note">{rounds}</p>}<ol className="mv-steps">{outline.repeat.map(row)}</ol></>}
    </section>
    <section className="mv-before" aria-labelledby="mv-before"><h2 id="mv-before">Before you start</h2><p>{routine.setup || "Work within your comfort and experience. Stop if you feel pain or unwell. Bounce gives cues but can’t check your form."}</p></section>
    <div className="mv-figure" role="group" aria-label="Figure in the pictures"><span>Pictures show</span><div>{(["female", "male"] as const).map(f => <button key={f} type="button" aria-pressed={figure === f} onClick={() => { if (f !== figure) onFigure(f); }}>{f === "female" ? "Female" : "Male"}</button>)}</div></div>
    <button type="button" className="mv-btn mv-save" onClick={onStart}><Play size={18} aria-hidden />Start with Bounce</button>
  </div>;
}

// A walk with a timer, as long as you like. The start time is kept on this device, so the walk survives the screen
// locking or the app closing; Finish opens the record with the minutes filled in.
function Walk({ onFinish, onCancel, onBack }: { onFinish: (minutes: number) => void; onCancel: () => void; onBack: () => void }) {
  const [startedAt] = useState(() => Number(read(WALK_KEY)) || Date.now()), [now, setNow] = useState(() => Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const seconds = Math.max(0, Math.floor((now - startedAt) / 1000)), minutes = Math.min(600, Math.max(1, Math.round(seconds / 60)));
  const shown = `${Math.floor(seconds / 3600) ? `${Math.floor(seconds / 3600)}:` : ""}${String(Math.floor(seconds / 60) % 60).padStart(Math.floor(seconds / 3600) ? 2 : 1, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return <div className="mv-space mv-walk">
    <header className="mv-head"><button type="button" className="mv-round" aria-label="Back to Move" onClick={onBack}><ChevronLeft size={20} aria-hidden /></button><h1>Your walk</h1></header>
    <div className="mv-clock is-walk"><strong role="timer" aria-label={`${Math.floor(seconds / 60)} minutes so far`}>{shown}</strong><span>so far</span></div>
    <div className="mv-bounce"><CompanionPortrait id="bounce" size={76} motion="encouraging" decorative /><div className="mv-bubble"><p>Enjoy your walk. Tap Finish when you’re back, and I’ll note it down.</p></div></div>
    <button type="button" className="mv-btn mv-save" onClick={() => onFinish(minutes)}><Sun size={18} aria-hidden />Finish walk</button>
    <button type="button" className="mv-link is-center" onClick={onCancel}>Cancel the walk</button>
  </div>;
}
