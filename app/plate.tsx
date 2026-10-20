"use client";
import { useState } from "react";
import { Camera, ChefHat, Clock, Keyboard, Mic, Pencil, X } from "lucide-react";
import { DialogTitle } from "@/components/ui/dialog";
import { today } from "@/lib/daywell";
import type { Stock } from "@/lib/food";
import { plateFor, plateMeals, plateSuggestions, soonLot, type PlateMeal, type Suggestion } from "@/lib/food-cook";
import { suggestedConsumption } from "@/lib/food-planning";
import { dayWords } from "@/lib/food-week";
import { mealLooks } from "./food-look";
import { askForIdeas, AteSome, capital, FoodFace, Sheet, SheetError } from "./kitchen";
import type { AppState } from "./use-daywell";

// Today's plate (owner-approved Kitchen design, part 3, 20 October 2026): a quarter for each meal, a photo, voice or
// a tap to note one, and at most one gentle question afterwards.
type Follow = { kind: "last"; lotId: string; title: string } | { kind: "extra"; title: string; portions: number } | null;
const short = (title: string) => title.length > 16 ? `${title.slice(0, 15).trimEnd()}…` : title;
const lower = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);
const capture = (intent: "photo" | "voice" | "type") => window.dispatchEvent(new CustomEvent("daywell-capture", { detail: { mode: "meal", intent } }));
export const noted = (meal: string, title: string) => `${meal} noted: ${lower(title)}`;

export function PlatePlace({ a }: { a: AppState }) {
  const f = a.food, state = f.snapshot!.state, now = today(), words = dayWords(now, now);
  const plate = plateFor(a.by("food"), state.plans, now);
  const [log, setLog] = useState<PlateMeal | null>(null), [ate, setAte] = useState<{ lot: Stock; meal: PlateMeal } | null>(null), [follow, setFollow] = useState<Follow>(null);
  const notedMeals = plateMeals.filter(meal => plate[meal].noted.length).length, planned = plateMeals.filter(meal => !plate[meal].noted.length && plate[meal].planned.length).length;
  const soon = state.stock.filter(lot => lot.quantity !== 0 && soonLot(lot, now)).sort((x, y) => x.bestBefore!.localeCompare(y.bestBefore!));
  const busy = f.busy || !!f.pending || !!f.draft;
  async function answer(kind: "yes" | "no") {
    const asked = follow;
    setFollow(null);
    if (kind === "no" || !asked) return;
    if (asked.kind === "last") await f.submit({ type: "stock.remove", id: asked.lotId });
    else await f.submit({ type: "stock.set", item: { id: crypto.randomUUID(), ingredient: asked.title.slice(0, 120), quantity: asked.portions, unit: "portion", bestBefore: null, place: "fridge" } });
  }
  return <>
    <div className="trolley-head"><h1 className="kitchen-title">{words.weekday}</h1><span>{notedMeals || planned ? [notedMeals && `${notedMeals} noted`, planned && `${planned} planned`].filter(Boolean).join(" · ") : "Nothing noted yet"}</span></div>
    <div className="plate">
      <div className="plate-rim" aria-hidden/>
      <div className="plate-quarters">{plateMeals.map(meal => {
        const { noted: eaten, planned: plans } = plate[meal], look = mealLooks[meal];
        const fill = eaten.length ? "is-noted" : plans.length ? "is-planned" : "is-empty";
        const line = eaten.length ? `${short(eaten[0])}${eaten.length > 1 ? ` +${eaten.length - 1}` : ""}` : plans.length ? `Planned: ${short(plans[0].title)}` : "Tap to note";
        const label = eaten.length ? `${meal}: ${eaten.join(", ")}` : plans.length ? `${meal}: ${plans[0].title}, planned` : `${meal}: tap to note`;
        return <button key={meal} type="button" className={`plate-quarter is-${meal.toLowerCase()} ${fill} food-tone-${look.tone}`} aria-label={label} onClick={() => setLog(meal)}>
          <look.Icon size={20} aria-hidden/>{meal}<span>{line}</span></button>;
      })}</div>
      <button type="button" className="plate-snap" aria-label="Snap a meal" onClick={() => capture("photo")}><Camera size={30} aria-hidden/></button>
    </div>
    <div className="plate-ways"><button type="button" onClick={() => capture("voice")}><Mic size={18} aria-hidden/>Say it</button><button type="button" onClick={() => capture("type")}><Keyboard size={18} aria-hidden/>Type</button></div>
    {follow && <section className="plate-ask" aria-labelledby="plate-ask-title">
      <div className="plate-ask-head"><FoodFace lot={{ ingredient: follow.title, unit: "portion" }} size={22} className="is-mid"/><h2 id="plate-ask-title">{follow.kind === "last" ? `Was that the last of the ${follow.title.toLowerCase()}?` : `Any ${follow.title.toLowerCase()} left over?`}</h2></div>
      <div className="plate-ask-answers"><button type="button" disabled={busy} onClick={() => void answer("yes")}>{follow.kind === "last" ? "Yes, all gone" : `Yes, ${follow.portions} in the fridge`}</button>
        <button type="button" disabled={busy} onClick={() => void answer("no")}>{follow.kind === "last" ? "Some left" : "No"}</button></div>
    </section>}
    {soon.length > 0 && <section className="plate-soon" aria-labelledby="plate-soon-title">
      <div><h2 id="plate-soon-title"><Clock size={16} aria-hidden/>Use soon</h2>
        <ul>{soon.slice(0, 4).map(lot => <li key={lot.id}><FoodFace lot={lot} size={20} className="is-small"/><span>{capital(lot.ingredient)}</span></li>)}</ul></div>
      <button type="button" onClick={() => askForIdeas(`Use up ${soon.slice(0, 3).map(lot => lot.ingredient).join(", ")}`)}><ChefHat size={16} aria-hidden/>Cook ideas</button>
    </section>}
    {log && <LogSheet a={a} meal={log} onClose={() => setLog(null)} onAte={lot => { setLog(null); setAte({ lot, meal: log }); }} onFollow={next => { setLog(null); setFollow(next); }}/>}
    {ate && <AteSome lot={ate.lot} a={a} meal={ate.meal} onClose={() => setAte(null)} onBack={() => { setLog(ate.meal); setAte(null); }}/>}
  </>;
}

// "What did you have for lunch?": a photo, or one tap on something likely.
function LogSheet({ a, meal, onClose, onAte, onFollow }: { a: AppState; meal: PlateMeal; onClose: () => void; onAte: (lot: Stock) => void; onFollow: (follow: Follow) => void }) {
  const f = a.food, state = f.snapshot!.state, now = today(), look = mealLooks[meal];
  const picks = plateSuggestions(meal, state, a.by("food"), now, date => dayWords(date, now).relative || dayWords(date, now).weekday);
  const [saving, setSaving] = useState(false), [failed, setFailed] = useState(false), busy = saving || f.busy || !!f.pending || !!f.draft;
  async function note(title: string, data: Record<string, unknown> = {}) {
    return !!await a.save([{ id: crypto.randomUUID(), kind: "food", data: { title: capital(title).slice(0, 120), calories: 0, protein: 0, carbs: 0, fat: 0, nutritionKnown: false, macrosKnown: false, foodStatus: "eaten", portions: 1, ...data, date: now, meal } }], noted(meal, title));
  }
  async function pick(item: Suggestion) {
    setSaving(true); setFailed(false);
    let done = false, next: Follow = null;
    if (item.kind === "planned") {
      const plan = item.plan;
      done = await f.submit({ type: "cook", planId: plan.id, title: plan.title, date: now, meal, servings: plan.servings, consumed: suggestedConsumption(plan, state.stock), useReservedStock: false, intake: { portions: 1 } });
      if (done && plan.servings > 1) next = { kind: "extra", title: plan.title, portions: plan.servings - 1 };
    } else if (item.kind === "again") {
      const { title, ...rest } = item.entry.data as Record<string, unknown>;
      done = await note(String(title), rest);
    } else if (item.kind === "leftover" && item.lot.unit === "portion" && item.lot.quantity !== null) {
      const portion = Math.min(1, item.lot.quantity);
      done = await f.submit({ type: "use", title: capital(item.lot.ingredient), date: now, meal, consumed: [{ stockId: item.lot.id, quantity: portion, unit: "portion" }], useReservedStock: false, intake: { portions: 1 } });
      if (done && item.lot.quantity - portion > 0) next = { kind: "last", lotId: item.lot.id, title: item.lot.ingredient };
    } else if (item.kind === "leftover" && item.lot.quantity === null) {
      done = await note(item.lot.ingredient);
      if (done) next = { kind: "last", lotId: item.lot.id, title: item.lot.ingredient };
    } else { setSaving(false); onAte(item.lot); return; }
    setSaving(false);
    if (done) onFollow(next); else setFailed(true);
  }
  return <Sheet onClose={onClose}>
    <div className="kitchen-grip" aria-hidden/>
    <div className="log-head"><span className={`log-icon food-tone-${look.tone}`} aria-hidden><look.Icon size={22}/></span>
      <DialogTitle asChild><h2>{meal === "Snack" ? "What did you have as a snack?" : `What did you have for ${meal.toLowerCase()}?`}</h2></DialogTitle>
      <button type="button" className="kitchen-round" aria-label="Close" onClick={onClose}><X size={20} aria-hidden/></button></div>
    <button type="button" className="kitchen-primary" onClick={() => { onClose(); capture("photo"); }}><Camera size={20} aria-hidden/>Show me a photo</button>
    {picks.length > 0 && <><h3 className="log-label">Or tap one</h3>
      <div className="log-picks">{picks.map(item => <button key={item.key} type="button" disabled={busy} onClick={() => void pick(item)}>
        <FoodFace lot={{ ingredient: item.title, unit: item.kind === "leftover" || item.kind === "kitchen" ? item.lot.unit : "portion" }} size={20} className="is-small"/>
        <span><strong>{capital(item.title)}</strong><span className={item.note === "Use soon" ? "is-soon" : undefined}>{item.note}</span></span></button>)}</div></>}
    <SheetError f={f} failed={failed}/>
    <button type="button" className="kitchen-secondary log-else" onClick={() => { onClose(); a.openEditor("food", { id: crypto.randomUUID(), kind: "food", data: { title: "", date: now, meal, calories: 0, protein: 0, carbs: 0, fat: 0, nutritionKnown: false, macrosKnown: false, foodStatus: "eaten", portions: 1 } }); }}><Pencil size={18} aria-hidden/>Something else</button>
    <p className="log-note">Picking food from your kitchen asks how much you had next. You can skip it.</p>
  </Sheet>;
}
