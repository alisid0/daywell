"use client";
import { useState } from "react";
import { today, type schemas } from "@/lib/daywell";
import { calorieGuide } from "@/lib/profile";
import type { z } from "zod";
import { activitySources, resizeIntakePortions, intakeRecord, nutritionSources, nutritionSummary, sugarHistory, type Intake } from "@/lib/food-tracking";
import type { AppState } from "./use-daywell";
import { Plus } from "lucide-react";
import { mealLooks } from "./food-look";
import { moveKind } from "./area-look";

const kcal = (value: number) => value.toLocaleString("en-GB", { maximumFractionDigits: 1 });
export function DailyNutrition({ a, area }: { a: AppState; area: "eat" | "move" }) {
  const [date, setDate] = useState(today());
  const total = nutritionSummary(a.entries, date);
  const guide = calorieGuide(a.settings);
  const moves = area === "move" ? a.by("move").filter(entry => entry.data.date === date) : [];
  function log(kind: "food" | "move", meal?: keyof typeof mealLooks) { a.openEditor(kind); a.setDraft((draft: Record<string, unknown>) => ({ ...draft, date, ...(meal ? { meal } : {}) })); }
  return <section className="well-card nutrition-day food-today" aria-label={area === "eat" ? "Food record" : "Movement record"}>
    <div className="food-toolbar"><div><span className="food-eyebrow">Your record, at your pace</span><h2>Your {area === "eat" ? "food" : "movement"} {date === today() ? "today" : "record"}</h2></div><label className="food-date">Record date<input type="date" required max={today()} value={date} onChange={event => { if(event.target.value) setDate(event.target.value); }}/></label></div>
    {area === "eat" ? <>
      {/* The day as a plate of four meals: what's logged in each, and a tap to add to it. */}
      <ul className="food-plate" aria-label="Your meals on this date">{(Object.keys(mealLooks) as (keyof typeof mealLooks)[]).map(meal => {
        const look = mealLooks[meal], items = a.by("food").filter(entry => entry.data.date === date && entry.data.meal === meal).map(entry => entry.data.title);
        return <li key={meal}><button className={`food-slot food-tone-${look.tone}${items.length ? " is-filled" : ""}`} onClick={() => log("food", meal)} aria-label={items.length ? `${meal}: ${items.join(", ")}. Log more` : `${meal}: nothing logged. Log ${meal.toLowerCase()}`}>
          <span className="food-slot-icon" aria-hidden><look.Icon size={20}/></span><span className="food-slot-name">{meal}</span><span className="food-slot-items">{items.length ? items.join(", ") : "Nothing yet"}</span></button></li>;
      })}</ul>
      <div className="food-stats">
        <div className="food-stat"><span>Calories consumed</span><strong>{total.eatenCount ? kcal(total.eaten) : "—"}</strong><small>{total.eatenCount ? "kcal recorded" : "none added"}</small>{guide && <span className="calorie-guide">of {guide.source === "estimate" ? "about " : ""}{kcal(guide.kcal)}, {guide.source === "estimate" ? "your estimate" : "your number"}</span>}<p>{total.meals} food {total.meals === 1 ? "entry" : "entries"}{total.unknownFood > 0 ? ` · ${total.unknownFood} without calories` : ""}</p></div>
        <div className="food-stat"><span>Total sugar consumed</span><strong>{total.sugarCount ? kcal(total.sugarGrams) : "—"}</strong><small>{total.sugarCount ? "g recorded" : "not recorded"}</small><p>{total.sugarCount} of {total.meals} food entries have sugar amounts{total.unknownSugar > 0 ? ` · ${total.unknownSugar} not recorded` : ""}</p></div>
      </div>
      <div className="well-actions food-today-actions"><button className="well-button" onClick={() => log("food")}><Plus size={17}/>Log food or drink</button><button className="well-text-button" onClick={() => log("food")}>Log sugar with food or drink</button></div>
      <p className="food-caption">A record of what you’ve logged. Blank amounts stay unknown, and a daily total may be incomplete.</p>
      <details className="sugar-history"><summary>Look back at sugar · 7 days</summary>
        <p className="food-caption">The seven days ending on your selected date. Amounts are total sugar; days with missing entries can’t be compared as complete daily totals.</p>
        <ul aria-label="Seven-day sugar record">{sugarHistory(a.entries, date).map(day => <li key={day.date}>
          <span>{new Date(`${day.date}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })}</span>
          <strong>{day.sugarGrams === null ? "Not recorded" : `${kcal(day.sugarGrams)} g`}</strong>
          <small>{day.entries ? `${day.recorded} of ${day.entries} food entries` : "No food entries"}</small>
        </li>)}</ul>
      </details>
    </> : <>
      {/* The day's moves, each with its kind, then the quiet numbers. */}
      {moves.length > 0 && <ul className="area-today" aria-label="Your moves on this date">{moves.map(entry => { const kind = moveKind(entry.data.title, Array.isArray(entry.data.sets)); return <li key={entry.id} className={`area-tone-${kind.tone}`}><span className="area-icon is-small" aria-hidden><kind.Icon size={17}/></span><span><strong>{entry.data.title}</strong><small>{entry.data.minutes} min</small></span></li>; })}</ul>}
      <div className={`food-stats${a.settings.calorieTracking ? "" : " is-single"}`}>
        <div className="food-stat"><span>Movement logged</span><strong>{total.activities ? kcal(total.movementMinutes) : "—"}</strong><small>{total.activities ? "minutes" : "none added"}</small><p>{total.activities} {total.activities === 1 ? "activity" : "activities"}</p></div>
        {a.settings.calorieTracking && <div className="food-stat"><span>Activity calories burned</span><strong>{total.burnedCount ? kcal(total.burned) : "—"}</strong><small>{total.burnedCount ? "kcal estimated" : "none added"}</small><p>{total.burnedCount} of {total.activities} activities have estimates{total.unknownActivity > 0 ? ` · ${total.unknownActivity} without calories` : ""}</p></div>}
      </div>
      {a.settings.calorieTracking && <p className="food-caption">Optional estimates for the activities you log, not all energy your body uses. You don’t need to balance these against food.</p>}
    </>}
  </section>;
}

export function IntakeFields({ value, onChange, maximum = 24 }: { value: Intake; onChange: (value: Intake) => void; maximum?: number }) {
  return <div className="intake-fields"><p>Just your portion(s), even when you prepared food for others. Changing portions scales the amounts below; you can correct them. Leave unknown amounts blank.</p><div className="food-form-grid">
    <label>Portions I ate<input required type="number" min={0.125} max={maximum} step="any" value={value.portions || ""} onChange={e => onChange(resizeIntakePortions(value, Number(e.target.value)))}/></label>
    <label>Total calories consumed (kcal, optional)<input type="number" min={0} max={10000} step="0.1" value={value.calories ?? ""} placeholder="Unknown" onChange={e => onChange({ ...value, calories: e.target.value === "" ? undefined : Number(e.target.value) })}/></label>
    <label>Total sugar consumed (g, optional)<input type="number" min={0} max={1000} step="0.1" value={value.sugarGrams ?? ""} placeholder="Unknown" onChange={e => onChange({ ...value, sugarGrams: e.target.value === "" ? undefined : Number(e.target.value) })}/></label>
    <label>Nutrition source<select value={value.source ?? "estimate"} onChange={e => onChange({ ...value, source: e.target.value as Intake["source"] })}>{Object.entries(nutritionSources).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>
    </div><p className="food-caption">Enter a total for everything you ate in this entry. Check the pack’s serving size; a per-100g value is not a portion total.</p>
    <p className="food-caption">For sugar, use “of which sugars” on the label for your portion. Total sugar includes naturally occurring and added sugars; it isn’t an added-sugar or free-sugar total. <a href="https://www.nhs.uk/live-well/eat-well/food-types/how-does-sugar-in-our-diet-affect-our-health/#nutrition-labels-and-sugars" target="_blank" rel="noreferrer">About sugar labels (NHS)</a></p>
    <label className="food-checkbox"><input type="checkbox" checked={!!value.macros} onChange={e => onChange({ ...value, macros: e.target.checked ? { protein: 0, carbs: 0, fat: 0 } : undefined })}/>Add protein, carbs and fat totals</label>
    {value.macros && <div className="food-form-grid">{(["protein", "carbs", "fat"] as const).map(key => <label key={key}>{key === "protein" ? "Protein" : key === "carbs" ? "Carbs" : "Fat"} (g)<input required type="number" min={0} max={1000} step="0.1" value={value.macros![key]} onChange={e => onChange({ ...value, macros: { ...value.macros!, [key]: Number(e.target.value) } })}/></label>)}</div>}
  </div>;
}

export function FoodEntryTracking({ data, onChange }: { data: z.infer<typeof schemas.food>; onChange: (data: z.infer<typeof schemas.food>) => void }) {
  const status = data.foodStatus ?? "eaten";
  const value: Intake = { portions: data.portions ?? 1, calories: data.nutritionKnown === false ? undefined : data.calories, source: data.nutritionSource ?? "estimate", sugarGrams: data.sugarGrams,
    macros: data.macrosKnown === true || (data.macrosKnown === undefined && data.nutritionKnown !== false) ? { protein: data.protein, carbs: data.carbs, fat: data.fat } : undefined };
  return <><label className="field"><span>What happened to this food?</span><select value={status} onChange={e => onChange({ ...data, foodStatus: e.target.value as typeof status })}><option value="eaten">I ate this</option><option value="prepared">Prepared, not logged as eaten</option><option value="used">Used, not logged as eaten</option></select></label>{status === "eaten" ? <IntakeFields value={value} onChange={value => onChange({ ...data, ...intakeRecord(value, "prepared") })}/> : <p className="helper">Saved in your meal story, outside your calories and sugar consumed totals. Edit this same entry when you eat your portion.</p>}<p className="helper">This food note doesn’t change basket amounts. To subtract food, choose “I ate / used some” in Food basket.</p></>;
}

export function ActivityCaloriesFields({ calories, source, onChange }: { calories?: number; source?: string; onChange: (calories: number | undefined, source: string | undefined) => void }) {
  return <div className="activity-calories"><label>Activity calories burned (kcal, optional)<input type="number" min={0} max={10000} step="0.1" placeholder="Unknown" value={calories ?? ""} onChange={e => onChange(e.target.value === "" ? undefined : Number(e.target.value), e.target.value === "" ? undefined : source ?? "estimate")}/></label>{calories !== undefined && <label>Activity calorie source<select value={source ?? "estimate"} onChange={e => onChange(calories, e.target.value)}>{Object.entries(activitySources).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>}<p className="helper">Use the estimate for this activity from your tracker or machine, or your own estimate. Leave blank if unknown. Don’t add a whole-day tracker total here.</p></div>;
}
