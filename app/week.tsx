"use client";
import { useState } from "react";
import { ChevronLeft, Lightbulb, Minus, Plus, Sparkles, X } from "lucide-react";
import { DialogTitle } from "@/components/ui/dialog";
import { today } from "@/lib/daywell";
import { ingredientName, type Plan } from "@/lib/food";
import type { FoodAction } from "@/lib/food-client";
import { starterAmounts, suggestedConsumption } from "@/lib/food-planning";
import { boardMeals, dayMeals, dayWords, emptyRun, planNeeds, plansFor, weekDates, type Meal } from "@/lib/food-week";
import type { RecipeIdea } from "@/lib/recipe-ideas";
import { recipeIdeas } from "@/lib/wellbeing";
import { mealLooks, quantityText, unitText } from "./food-look";
import { capital, Sheet, SheetError } from "./kitchen";
import { askRecipes, useRecipesConnected } from "./recipe-ideas";
import type { AppState } from "./use-daywell";

// The Week (owner-approved Kitchen design, part 2, 20 October 2026): a board of seven days from today, a day's own
// view with an idea for an empty slot, and "When will you have it?" for recipe ideas.
type Food = AppState["food"];
type PlanInput = Extract<FoodAction, { type: "plan.set" }>["plan"];
const withoutChange = (plan: Plan): PlanInput => ({ id: plan.id, title: plan.title, date: plan.date, meal: plan.meal, servings: plan.servings, ingredients: plan.ingredients, ...(plan.guide ? { guide: plan.guide } : {}) });
const shortTitle = (title: string) => title.length > 18 ? `${title.slice(0, 17).trimEnd()}…` : title;
const ideaNote = "AI recipe idea for one serving. Check the ingredients, portion and your dietary needs.";

export function WeekPlace({ a }: { a: AppState }) {
  const [day, setDay] = useState<{ date: string; meal?: Meal } | null>(null);
  return day ? <DayView a={a} date={day.date} focus={day.meal} onBack={() => setDay(null)}/> : <WeekBoard a={a} onOpen={(date, meal) => setDay({ date, meal })}/>;
}

function WeekBoard({ a, onOpen }: { a: AppState; onOpen: (date: string, meal?: Meal) => void }) {
  const f = a.food, plans = f.snapshot!.state.plans, now = today(), dates = weekDates(now), end = dates[dates.length - 1];
  const inWeek = plans.filter(plan => plan.date >= now && plan.date <= end), earlier = plans.filter(plan => plan.date < now), later = plans.filter(plan => plan.date > end);
  const run = emptyRun(plans, dates, "Dinner");
  const byDate = (list: Plan[]) => [...list].sort((x, y) => x.date.localeCompare(y.date) || dayMeals.indexOf(x.meal) - dayMeals.indexOf(y.meal));
  return <>
    <div className="trolley-head"><h1 className="kitchen-title">This week</h1><span>{inWeek.length ? `${inWeek.length} ${inWeek.length === 1 ? "meal" : "meals"} planned` : "Nothing planned yet"}</span></div>
    <div className="week-columns" aria-hidden><span/>{boardMeals.map(meal => <span key={meal}>{meal}</span>)}</div>
    <ol className="week-board">{dates.map(date => { const words = dayWords(date, now); return <li key={date} className={date === now ? "is-today" : undefined}>
      <button type="button" className="week-day" aria-label={`${words.weekday}${words.relative ? `, ${words.relative.toLowerCase()}` : ""}: see the day`} onClick={() => onOpen(date)}>{words.short}<span>{words.relative || words.dayShort}</span></button>
      {boardMeals.map(meal => { const here = plansFor(plans, date, meal), first = here[0], look = mealLooks[meal];
        return first ? <button key={meal} type="button" className={`week-slot is-full food-tone-${look.tone}`} aria-label={`${words.weekday} ${meal.toLowerCase()}: ${here.map(plan => plan.title).join(", ")}`} onClick={() => onOpen(date, meal)}>
          <look.Icon size={16} aria-hidden/><span>{shortTitle(first.title)}</span>{here.length > 1 && <small aria-hidden>+{here.length - 1}</small>}</button>
          : <button key={meal} type="button" className="week-slot" aria-label={`${words.weekday} ${meal.toLowerCase()}: plan`} onClick={() => onOpen(date, meal)}><Plus size={18} aria-hidden/></button>; })}
    </li>; })}</ol>
    {run && <button type="button" className="week-fill" disabled={f.busy || !!f.pending || !!f.draft} onClick={() => window.dispatchEvent(new CustomEvent("daywell-capture", { detail: { mode: "plan", intent: "voice", planStart: run.start, planCount: run.count, planMeal: "Dinner" } }))}>
      <Sparkles size={18} aria-hidden/>Fill empty slots with ideas</button>}
    {earlier.length > 0 && <section className="week-more"><h2>Still planned from before</h2><ul>{byDate(earlier).map(plan => <li key={plan.id}><button type="button" onClick={() => onOpen(plan.date, plan.meal)}><strong>{plan.title}</strong><span>{dayWords(plan.date, now).weekday} {dayWords(plan.date, now).dayMonth} · {plan.meal.toLowerCase()}</span></button></li>)}</ul></section>}
    {later.length > 0 && <section className="week-more"><h2>Later</h2><ul>{byDate(later).map(plan => <li key={plan.id}><button type="button" onClick={() => onOpen(plan.date, plan.meal)}><strong>{plan.title}</strong><span>{dayWords(plan.date, now).weekday} {dayWords(plan.date, now).dayMonth} · {plan.meal.toLowerCase()}</span></button></li>)}</ul></section>}
  </>;
}

// One day: its meals, what they still need, and an idea for an empty slot.
function DayView({ a, date, focus, onBack }: { a: AppState; date: string; focus?: Meal; onBack: () => void }) {
  const f = a.food, state = f.snapshot!.state, overview = f.snapshot!.overview, now = today(), words = dayWords(date, now);
  const busy = f.busy || !!f.pending || !!f.draft;
  const meals = dayMeals.filter(meal => meal !== "Snack" || plansFor(state.plans, date, "Snack").length);
  const ideaFor = focus && !plansFor(state.plans, date, focus).length ? focus : (["Dinner", "Lunch"] as const).find(meal => !plansFor(state.plans, date, meal).length);
  const blank = (meal: Meal): PlanInput => ({ id: crypto.randomUUID(), title: "", date, meal, servings: 1, ingredients: [{ ingredient: "", quantity: null, unit: "g" }] });
  return <div className="week-day-view">
    <div className="week-day-head"><button type="button" className="kitchen-round" aria-label="Back to the week" onClick={onBack}><ChevronLeft size={20} aria-hidden/></button>
      <div><h1 className="kitchen-title">{words.weekday}</h1><p>{[words.relative, words.dayMonth].filter(Boolean).join(" · ")}</p></div></div>
    {meals.map(meal => { const here = plansFor(state.plans, date, meal), look = mealLooks[meal]; return <section key={meal} className="week-meal" aria-labelledby={`meal-${meal}`}>
      <h2 id={`meal-${meal}`}><look.Icon size={16} aria-hidden/>{meal}</h2>
      {here.map(plan => { const needs = planNeeds(plan, overview); return <article key={plan.id} className={`week-plan food-tone-${look.tone}`}>
        <div className="week-plan-text"><strong>{plan.title}</strong><span>{plan.servings} {plan.servings === 1 ? "serving" : "servings"}</span>
          <span className={needs.length ? "week-needs" : "week-covered"}>{needs.length ? `Needs ${needs.map(row => row.ingredient).slice(0, 3).join(", ")}${needs.length > 3 ? " and more" : ""} · it’s on your trolley list` : "Everything is in your kitchen"}</span></div>
        <div className="week-plan-actions">
          <button type="button" disabled={busy} onClick={() => f.open({ type: "cook", planId: plan.id, title: plan.title, date: now, meal: plan.meal, servings: plan.servings, consumed: suggestedConsumption(plan, state.stock), useReservedStock: false })}>I made this</button>
          <button type="button" disabled={busy} onClick={() => f.open({ type: "plan.set", plan: withoutChange(plan) })}>Change</button>
          <button type="button" disabled={busy} onClick={() => void f.submit({ type: "plan.remove", id: plan.id })}>Take it off</button>
        </div>
      </article>; })}
      {!here.length && <button type="button" className="week-plan-empty" disabled={busy} onClick={() => f.open({ type: "plan.set", plan: blank(meal) })}><Plus size={18} aria-hidden/>Plan {meal.toLowerCase()}</button>}
      {meal === ideaFor && <IdeaCard a={a} date={date} meal={meal}/>}
    </section>; })}
    {!meals.includes("Snack") && <button type="button" className="well-text-button week-snack" disabled={busy} onClick={() => f.open({ type: "plan.set", plan: blank("Snack") })}><Plus size={16} aria-hidden/>Plan a snack</button>}
  </div>;
}

// An idea for an empty slot. With recipe ideas on, it's asked for only when the person taps; otherwise it's one of
// Daywell's own simple recipes.
function IdeaCard({ a, date, meal }: { a: AppState; date: string; meal: Meal }) {
  const f = a.food, state = f.snapshot!.state, connected = useRecipesConnected();
  const [ideas, setIdeas] = useState<RecipeIdea[]>([]), [index, setIndex] = useState(0), [asking, setAsking] = useState(false), [error, setError] = useState("");
  const [saving, setSaving] = useState(false), [failed, setFailed] = useState(false), busy = saving || f.busy || !!f.pending || !!f.draft;
  const soonNames = new Set(state.stock.filter(lot => lot.bestBefore && lot.quantity !== 0 && Date.parse(`${lot.bestBefore}T12:00:00Z`) - Date.parse(`${today()}T12:00:00Z`) <= 3 * 864e5).map(lot => lot.ingredient));
  async function ask(avoid: string[]) {
    setAsking(true); setError("");
    try { const reply = await askRecipes<{ ideas: RecipeIdea[] }>({ kind: "basket", wish: `A ${meal.toLowerCase()} idea`, avoid: avoid.slice(-12) }); setIdeas(reply.ideas); setIndex(0); }
    catch (problem) { setError(problem instanceof Error ? problem.message : "Couldn’t find an idea right now. Please try again."); }
    finally { setAsking(false); }
  }
  async function put(plan: PlanInput) { setSaving(true); setFailed(false); const done = await f.submit({ type: "plan.set", plan }); setSaving(false); if (!done) setFailed(true); }
  if (connected === null) return null;
  if (!connected) {
    const recipe = recipeIdeas[index % recipeIdeas.length];
    return <section className="week-idea" aria-label={`An idea for ${meal.toLowerCase()}`}>
      <p className="week-idea-label"><Lightbulb size={15} aria-hidden/>A simple idea for this slot</p>
      <strong>{recipe.title}</strong><span>{recipe.time}</span>
      <SheetError f={f} failed={failed}/>
      <div className="week-idea-actions"><button type="button" className="is-primary" disabled={busy} onClick={() => void put({ id: crypto.randomUUID(), title: recipe.title, date, meal, servings: 1, ingredients: structuredClone(starterAmounts[recipe.id]), guide: { steps: recipe.steps, nutritionNote: "Calories not added. Review the ingredients and your own serving." } })}>Put it here</button>
        <button type="button" onClick={() => setIndex(index + 1)}>Other ideas</button></div>
    </section>;
  }
  const idea = ideas[index];
  const uses = idea?.ingredients.filter(item => item.have).map(item => item.ingredient) ?? [];
  const soon = uses.filter(name => soonNames.has(ingredientName(name)));
  return <section className="week-idea" aria-label={`An idea for ${meal.toLowerCase()}`} aria-busy={asking || undefined}>
    <p className="week-idea-label"><Lightbulb size={15} aria-hidden/>An idea for this slot</p>
    {idea ? <><strong>{idea.title}</strong><span className={soon.length ? "is-soon" : undefined}>{soon.length ? `Uses up your ${soon.slice(0, 2).join(" and ")}` : uses.length ? `Uses your ${uses.slice(0, 3).join(", ")}` : `${idea.minutes} minutes`}</span>
      <SheetError f={f} failed={failed}/>
      <div className="week-idea-actions"><button type="button" className="is-primary" disabled={busy} onClick={() => void put({ id: crypto.randomUUID(), title: idea.title, date, meal, servings: 1, ingredients: idea.ingredients.map(({ ingredient, quantity, unit }) => ({ ingredient, quantity, unit })), guide: { steps: idea.steps, nutritionNote: ideaNote } })}>Put it here</button>
        <button type="button" disabled={asking} onClick={() => index + 1 < ideas.length ? setIndex(index + 1) : void ask(ideas.map(item => item.title))}>{asking ? "Finding…" : "Other ideas"}</button></div></>
      : <><p className="week-idea-ask">A recipe from what’s in your kitchen, for {meal.toLowerCase()}.</p>
        <button type="button" className="well-button" disabled={asking} onClick={() => void ask(state.plans.map(plan => plan.title))}><Sparkles size={17} aria-hidden/>{asking ? "Finding an idea…" : "Get an idea"}</button>
        <small>Asking sends the names and quantities of the food in your kitchen to OpenAI. Nothing is saved until you choose.</small></>}
    {error && <p className="form-error" role="alert">{error}</p>}
  </section>;
}

// "When will you have it?": puts a recipe idea on the board, for as many servings as wanted.
export function WhenSheet({ f, idea, onClose }: { f: Food; idea: RecipeIdea; onClose: () => void }) {
  const now = today(), dates = weekDates(now);
  const [date, setDate] = useState(now), [meal, setMeal] = useState<Meal>(idea.meal), [servings, setServings] = useState(1);
  const [saving, setSaving] = useState(false), [failed, setFailed] = useState(false);
  const missing = idea.ingredients.filter(item => !item.have).map(item => item.ingredient);
  async function save() {
    setSaving(true); setFailed(false);
    const done = await f.submit({ type: "plan.set", plan: { id: crypto.randomUUID(), title: idea.title, date, meal, servings,
      ingredients: idea.ingredients.map(({ ingredient, quantity, unit }) => ({ ingredient, quantity: quantity === null ? null : Math.round(quantity * servings * 1000) / 1000, unit })),
      guide: { steps: idea.steps, nutritionNote: ideaNote } } });
    setSaving(false); if (done) onClose(); else setFailed(true);
  }
  return <Sheet onClose={onClose}>
    <div className="kitchen-grip" aria-hidden/>
    <button type="button" className="kitchen-round kitchen-close" aria-label="Close" onClick={onClose}><X size={20} aria-hidden/></button>
    <div className="when-head"><DialogTitle asChild><h2>When will you have it?</h2></DialogTitle><p>{idea.title}</p></div>
    <h3 className="when-label">Day</h3>
    <div className="when-days" role="group" aria-label="Day">{dates.map(day => { const words = dayWords(day, now); return <button key={day} type="button" aria-pressed={date === day} aria-label={`${words.weekday} ${words.dayMonth}`} onClick={() => setDate(day)}>{words.short}<strong>{words.dayNumber}</strong></button>; })}</div>
    <h3 className="when-label">Meal</h3>
    <div className="when-meals" role="group" aria-label="Meal">{dayMeals.map(item => { const look = mealLooks[item]; return <button key={item} type="button" aria-pressed={meal === item} onClick={() => setMeal(item)}><span className={`when-meal-icon food-tone-${look.tone}`} aria-hidden><look.Icon size={18}/></span>{item}</button>; })}</div>
    <div className="when-servings"><span>Servings</span><div>
      <button type="button" aria-label="Fewer servings" disabled={servings <= 1} onClick={() => setServings(servings - 1)}><Minus size={18} aria-hidden/></button>
      <output aria-live="polite">{servings}</output>
      <button type="button" aria-label="More servings" disabled={servings >= 8} onClick={() => setServings(servings + 1)}><Plus size={18} aria-hidden/></button></div></div>
    {missing.length > 0 && <p className="kitchen-note">{capital(missing.slice(0, 3).join(", ").replace(/, ([^,]*)$/, " and $1"))}{missing.length > 3 ? " and more" : ""} will go on your trolley list.</p>}
    <details className="when-amounts"><summary>What it uses</summary><ul>{idea.ingredients.map(item => <li key={item.ingredient}>{capital(item.ingredient)}{item.quantity !== null && ` · ${quantityText(Math.round(item.quantity * servings * 1000) / 1000)} ${unitText(item.unit, item.quantity * servings)}`}</li>)}</ul></details>
    <SheetError f={f} failed={failed}/>
    <button type="button" className="kitchen-primary" disabled={saving || f.busy || !!f.pending || !!f.draft} onClick={() => void save()}>{saving ? "Saving…" : "Put it on the board"}</button>
  </Sheet>;
}
