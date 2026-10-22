"use client";
import { useState } from "react";
import { ArrowUpRight, History } from "lucide-react";
import { CompanionPortrait } from "@/components/daywell-companions";
import { pillars } from "@/lib/wellbeing";
import { MoveSpace } from "./move-space";
import type { AppState } from "./use-daywell";
import { ModuleView } from "./modules";
import { FoodSpace } from "./food-space";
import { RestSpace } from "./rest-space";
import { SleepSounds } from "./sleep-sounds";
import { CalendarStrip } from "./calendar-strip";

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
function SleepSpace({ a }: { a: AppState }) {
  const [resting, setResting] = useState(false);
  if(resting) return <RestSpace a={a} bedtime onLeave={()=>{a.clearSoundFocus();setResting(false);}}/>;
  return <section className="well-space"><Heading id="sleep"/><CalendarStrip a={a} area="sleep"/><div className="well-card sleep-door"><CompanionPortrait id="luma" size={92} decorative /><div><h2>Make tonight a little softer.</h2><p>Quiet company and a little guidance, whenever you want it.</p></div><button className="well-button" onClick={()=>{window.dispatchEvent(new Event("daywell-stop-voice"));a.clearSoundFocus();setResting(true);}}>Wind down with Luma</button></div><SleepSounds focusRequest={a.soundFocus}/><ModuleView a={a}/><LookBack a={a}/></section>;
}
