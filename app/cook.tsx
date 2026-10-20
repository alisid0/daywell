"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChefHat, ChevronLeft, Clock, Minus, Plus, ShoppingCart, Sparkles, Timer, X } from "lucide-react";
import { DialogTitle } from "@/components/ui/dialog";
import { today } from "@/lib/daywell";
import { ingredientName, type Plan, type Stock } from "@/lib/food";
import { cookConsumption, kitchenLot, scaled, soonLot, stepIngredients, stepMinutes, type RecipeIngredient } from "@/lib/food-cook";
import { starterAmounts } from "@/lib/food-planning";
import { placeNames, placeOf } from "@/lib/food-places";
import { dayMeals, type Meal } from "@/lib/food-week";
import type { RecipeIdea } from "@/lib/recipe-ideas";
import { recipeIdeas } from "@/lib/wellbeing";
import { AiReport } from "./ai-report";
import { mealLooks, quantityText, unitText } from "./food-look";
import { askForIdeas, capital, FoodFace, Sheet, SheetError } from "./kitchen";
import { askRecipes, useRecipesConnected } from "./recipe-ideas";
import type { AppState } from "./use-daywell";

// Cook from your kitchen (owner-approved Kitchen design, part 3, 20 October 2026): recipe cards from what's on the
// shelves, the full recipe, then cooking it one step at a time and putting it on today's plate.
type Recipe = { key: string; title: string; meal: Meal; minutes: number | null; servings: number; ingredients: RecipeIngredient[]; steps: string[]; planId?: string; ai: boolean };
const filters = [["soon", "Use soon first"], ["quick", "Quick"], ["have", "No shopping"], ["breakfast", "Breakfast"]] as const;
type Filter = typeof filters[number][0];
// The last ideas found during this visit, so opening the cards again doesn't ask again.
let lastIdeas: { filter: Filter; recipes: Recipe[] } | null = null;
const amount = (item: { quantity: number | null; unit: string }) => item.quantity === null ? "" : `${quantityText(item.quantity)} ${unitText(item.unit, item.quantity)}`;

const fromIdea = (idea: RecipeIdea): Recipe => ({ key: idea.title, title: idea.title, meal: idea.meal, minutes: idea.minutes, servings: 1, ingredients: idea.ingredients.map(({ ingredient, quantity, unit, have }) => ({ ingredient, quantity, unit, have })), steps: idea.steps, ai: true });
const fromPlan = (plan: Plan, stock: Stock[]): Recipe => ({ key: plan.id, title: plan.title, meal: plan.meal, minutes: null, servings: plan.servings,
  ingredients: plan.ingredients.map(item => ({ ...item, have: !!kitchenLot(item.ingredient, stock) })), steps: plan.guide?.steps ?? [], planId: plan.id, ai: !!plan.guide?.nutritionNote.startsWith("AI recipe idea") });
// Daywell's own few recipes, for when recipe ideas aren't connected.
const ownRecipes = (stock: Stock[]): Recipe[] => recipeIdeas.map(recipe => ({ key: recipe.id, title: recipe.title, meal: recipe.id === "oats" ? "Breakfast" : "Dinner", minutes: Number.parseInt(recipe.time) || null, servings: 1,
  ingredients: (starterAmounts[recipe.id] ?? []).map(item => ({ ...item, have: !!kitchenLot(item.ingredient, stock) })), steps: recipe.steps, ai: false }));
const asIdea = (recipe: Recipe): RecipeIdea => ({ title: recipe.title, meal: recipe.meal, minutes: recipe.minutes ?? 20, ingredients: recipe.ingredients.map(item => ({ ...item, have: !!item.have })), steps: recipe.steps });
function wishFor(filter: Filter, soonNames: string[]) {
  if (filter === "quick") return "Something quick, about 15 minutes";
  if (filter === "have") return "Only what I already have, with no shopping";
  if (filter === "breakfast") return "A breakfast";
  return soonNames.length ? `Use up ${soonNames.slice(0, 3).join(", ")} first` : "Something from what I have";
}

export function CookSheet({ a, wish, planId, onClose, onPlan }: { a: AppState; wish?: string; planId?: string; onClose: () => void; onPlan: (idea: RecipeIdea) => void }) {
  const f = a.food, state = f.snapshot!.state, now = today();
  const plan = planId ? state.plans.find(item => item.id === planId) : undefined;
  const connected = useRecipesConnected();
  const [filter, setFilter] = useState<Filter>(lastIdeas?.filter ?? "soon"), [found, setFound] = useState<Recipe[]>(lastIdeas?.recipes ?? []);
  const [index, setIndex] = useState(0), [asking, setAsking] = useState(false), [error, setError] = useState("");
  const [recipe, setRecipe] = useState<Recipe | null>(() => plan ? fromPlan(plan, state.stock) : null);
  const [screen, setScreen] = useState<"deck" | "recipe" | "cook" | "done">(plan ? "recipe" : "deck");
  const [servings, setServings] = useState(plan?.servings ?? 1), [step, setStep] = useState(0);
  const soonNames = state.stock.filter(lot => lot.quantity !== 0 && soonLot(lot, now)).map(lot => lot.ingredient);
  // Without recipe ideas, Daywell's own recipes, sorted and filtered here instead of asked for.
  const own = ownRecipes(state.stock).filter(item => filter === "quick" ? (item.minutes ?? 99) <= 20 : filter === "have" ? item.ingredients.every(row => row.have) : filter === "breakfast" ? item.meal === "Breakfast" : true);
  const cards = connected === false ? own : found;
  async function ask(next: Filter) {
    setFilter(next); setAsking(true); setError("");
    try {
      const reply = await askRecipes<{ ideas: RecipeIdea[] }>({ kind: "basket", wish: (wish && next === "soon" ? wish : wishFor(next, soonNames)).slice(0, 300), avoid: found.map(item => item.title).slice(0, 12) });
      const recipes = reply.ideas.map(fromIdea);
      setFound(recipes); setIndex(0); lastIdeas = { filter: next, recipes };
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Couldn’t find ideas right now. Please try again."); }
    finally { setAsking(false); }
  }
  function open(chosen: Recipe, next: "recipe" | "cook" = "recipe") { setRecipe(chosen); setServings(chosen.servings); setStep(0); setScreen(next === "cook" && !chosen.steps.length ? "done" : next); }
  useWakeLock(screen === "cook");
  return <Sheet onClose={onClose} steps>
    {screen === "deck" && <Deck a={a} cards={cards} index={index} setIndex={setIndex} filter={filter} connected={connected} asking={asking} error={error}
      onFilter={next => connected ? void ask(next) : (setFilter(next), setIndex(0))} onAsk={() => void ask(filter)} onClose={onClose} onOpen={open} onPlan={chosen => onPlan(asIdea(chosen))}/>}
    {screen === "recipe" && recipe && <RecipeView a={a} recipe={recipe} servings={servings} setServings={setServings} onBack={() => plan ? onClose() : setScreen("deck")} backLabel={plan ? "Close" : "Back to the cards"}
      onCook={() => { setStep(0); setScreen(recipe.steps.length ? "cook" : "done"); }} onPlan={() => onPlan(asIdea({ ...recipe, ingredients: scaled(recipe.ingredients, recipe.servings, 1) }))}/>}
    {screen === "cook" && recipe && <CookMode recipe={recipe} servings={servings} step={step} setStep={setStep} onStop={() => setScreen("recipe")} onFinish={() => setScreen("done")}/>}
    {screen === "done" && recipe && <Finish a={a} recipe={recipe} servings={servings} onBack={() => setScreen(recipe.steps.length ? "cook" : "recipe")} onClose={onClose}/>}
  </Sheet>;
}

// On the Kitchen: the way into the recipe cards.
export function CookCard() {
  return <section className="cook-entry" aria-labelledby="cook-entry-title"><span className="kitchen-empty-icon" aria-hidden><ChefHat size={28}/></span>
    <div><h2 id="cook-entry-title">Cook from your kitchen</h2><p>Recipe ideas that use what’s on your shelves.</p></div>
    <button type="button" className="well-button" onClick={() => askForIdeas("")}>See ideas</button></section>;
}

// The screen stays on while cooking, where the browser allows it.
function useWakeLock(on: boolean) {
  useEffect(() => {
    if (!on || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
    let live = true, lock: WakeLockSentinel | null = null;
    navigator.wakeLock.request("screen").then(sentinel => { if (live) lock = sentinel; else void sentinel.release(); }, () => {});
    return () => { live = false; void lock?.release().catch(() => {}); };
  }, [on]);
}

function Deck({ a, cards, index, setIndex, filter, connected, asking, error, onFilter, onAsk, onClose, onOpen, onPlan }: {
  a: AppState; cards: Recipe[]; index: number; setIndex: (index: number) => void; filter: Filter; connected: boolean | null; asking: boolean; error: string;
  onFilter: (filter: Filter) => void; onAsk: () => void; onClose: () => void; onOpen: (recipe: Recipe, next?: "recipe" | "cook") => void; onPlan: (recipe: Recipe) => void;
}) {
  const state = a.food.snapshot!.state, now = today(), swipe = useRef<number | null>(null);
  const recipe = cards[Math.min(index, cards.length - 1)];
  const go = (step: number) => setIndex(Math.max(0, Math.min(cards.length - 1, index + step)));
  return <>
    <div className="cook-top"><button type="button" className="kitchen-round" aria-label="Close" onClick={onClose}><X size={20} aria-hidden/></button>
      <div><DialogTitle asChild><h2 className="kitchen-step-title">Cook from your kitchen</h2></DialogTitle><p>Ideas that use what’s on your shelves</p></div></div>
    <div className="cook-filters" role="group" aria-label="Show me">{filters.map(([id, label]) => <button key={id} type="button" aria-pressed={filter === id} disabled={asking} onClick={() => onFilter(id)}>{label}</button>)}</div>
    <div className="kitchen-steps-body cook-deck-body" aria-busy={asking || undefined}>
      {connected && !cards.length && !asking && <div className="cook-intro"><span className="kitchen-empty-icon" aria-hidden><ChefHat size={34}/></span><p>A few recipes from what’s on your shelves, with what you’d still need.</p>
        <button type="button" className="well-button" onClick={onAsk}><Sparkles size={18} aria-hidden/>Find ideas</button></div>}
      {asking && <p className="cook-finding" role="status">Finding ideas…</p>}
      {!asking && recipe && <>
        <div className="cook-deck" onPointerDown={event => { swipe.current = event.clientX; }} onPointerUp={event => { const start = swipe.current; swipe.current = null; if (start !== null && Math.abs(event.clientX - start) > 60) go(event.clientX < start ? 1 : -1); }}>
          {cards.length > 1 && <><span className="cook-deck-back is-one" aria-hidden/><span className="cook-deck-back is-two" aria-hidden/></>}
          <RecipeCard recipe={recipe} stock={state.stock} now={now} position={`Idea ${index + 1} of ${cards.length}`} onOpen={onOpen} onPlan={onPlan}/>
        </div>
        {cards.length > 1 && <div className="cook-nav"><button type="button" className="kitchen-round" aria-label="Previous idea" disabled={index === 0} onClick={() => go(-1)}><ArrowLeft size={18} aria-hidden/></button>
          <span>Swipe for another idea · {index + 1} of {cards.length}</span>
          <button type="button" className="kitchen-round" aria-label="Next idea" disabled={index >= cards.length - 1} onClick={() => go(1)}><ArrowRight size={18} aria-hidden/></button></div>}
        {connected && <button type="button" className="well-text-button cook-more" disabled={asking} onClick={onAsk}><Sparkles size={16} aria-hidden/>Different ideas</button>}
      </>}
      {!asking && !recipe && connected === false && <p className="well-empty">No recipe matches that. Try another.</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {connected && <small className="cook-share">Asking sends the names and quantities of the food in your kitchen to OpenAI. Nothing is saved until you choose.</small>}
    </div>
  </>;
}

function RecipeCard({ recipe, stock, now, position, onOpen, onPlan }: { recipe: Recipe; stock: Stock[]; now: string; position: string; onOpen: (recipe: Recipe, next?: "recipe" | "cook") => void; onPlan: (recipe: Recipe) => void }) {
  const look = mealLooks[recipe.meal], lots = recipe.ingredients.map(item => kitchenLot(item.ingredient, stock));
  const have = lots.filter(Boolean).length, soon = recipe.ingredients.filter((_, i) => lots[i] && soonLot(lots[i]!, now)).map(item => item.ingredient);
  const why = soon.length ? `Uses up your ${soon.slice(0, 2).join(" and ")}` : have ? `Uses your ${recipe.ingredients.filter((_, i) => lots[i]).slice(0, 3).map(item => item.ingredient).join(", ")}` : "You’d need to shop for this";
  return <article className={`cook-card food-tone-${look.tone}`} aria-label={position}>
    <div className="cook-card-top"><look.Icon size={46} aria-hidden/><span className="cook-chip is-left">{recipe.meal}</span>{recipe.minutes && <span className="cook-chip is-right"><Clock size={13} aria-hidden/>{recipe.minutes} min</span>}</div>
    <div className="cook-card-body">
      <h3><button type="button" onClick={() => onOpen(recipe)}>{recipe.title}</button></h3>
      <p className={soon.length ? "cook-why is-soon" : "cook-why"}>{why}</p>
      <p className="cook-count">{have} of {recipe.ingredients.length} at home</p>
      <div className="cook-bar" aria-hidden><span style={{ width: `${recipe.ingredients.length ? Math.round(have / recipe.ingredients.length * 100) : 0}%` }}/></div>
      <ul className="cook-ings">{recipe.ingredients.slice(0, 6).map((item, i) => <li key={item.ingredient} className={lots[i] ? undefined : "is-missing"}>
        {lots[i] ? <FoodFace lot={{ ingredient: item.ingredient, unit: item.unit }} size={18} className={`is-ing${soonLot(lots[i]!, now) ? " is-soon" : ""}`}/> : <span className="kitchen-face is-ing is-missing" aria-hidden><ShoppingCart size={16}/></span>}
        <span>{capital(item.ingredient)}</span></li>)}</ul>
      <div className="cook-card-actions"><button type="button" className="is-primary" onClick={() => onOpen(recipe, "cook")}><ChefHat size={17} aria-hidden/>Cook it now</button>
        <button type="button" onClick={() => onPlan(recipe)}>Plan it</button></div>
      <button type="button" className="well-text-button cook-see" onClick={() => onOpen(recipe)}>See the whole recipe</button>
    </div>
  </article>;
}

// The whole recipe: servings, what you need and where it is, and the steps.
function RecipeView({ a, recipe, servings, setServings, onBack, backLabel, onCook, onPlan }: { a: AppState; recipe: Recipe; servings: number; setServings: (servings: number) => void; onBack: () => void; backLabel: string; onCook: () => void; onPlan: () => void }) {
  const f = a.food, state = f.snapshot!.state, overview = f.snapshot!.overview, look = mealLooks[recipe.meal];
  const items = scaled(recipe.ingredients, recipe.servings, servings).map(item => ({ ...item, lot: kitchenLot(item.ingredient, state.stock) }));
  const listed = new Set([...state.shopping.filter(note => !note.done).map(note => ingredientName(note.title)), ...overview.toBuy.map(row => row.ingredient)]);
  const toAdd = items.filter(item => !item.lot && !listed.has(ingredientName(item.ingredient)));
  const [failed, setFailed] = useState(false), busy = f.busy || !!f.pending || !!f.draft;
  async function addMissing() {
    setFailed(false);
    if (!await f.submit({ type: "shopping.add", items: toAdd.slice(0, 20).map(item => ({ id: crypto.randomUUID(), title: capital(item.ingredient).slice(0, 160), quantity: amount(item), done: false })) })) setFailed(true);
  }
  return <>
    <div className={`recipe-band food-tone-${look.tone}`}><look.Icon size={56} aria-hidden/>
      <button type="button" className="kitchen-round" aria-label={backLabel} onClick={onBack}>{backLabel === "Close" ? <X size={20} aria-hidden/> : <ChevronLeft size={20} aria-hidden/>}</button>
      <span className="cook-chip">{recipe.meal}{recipe.minutes ? ` · ${recipe.minutes} min` : ""}</span></div>
    <div className="kitchen-steps-body recipe-body">
      <DialogTitle asChild><h2 className="kitchen-step-title">{recipe.title}</h2></DialogTitle>
      <div className="when-servings"><span>Servings</span><div>
        <button type="button" aria-label="Fewer servings" disabled={servings <= 1} onClick={() => setServings(servings - 1)}><Minus size={18} aria-hidden/></button>
        <output aria-live="polite">{servings}</output>
        <button type="button" aria-label="More servings" disabled={servings >= 12} onClick={() => setServings(servings + 1)}><Plus size={18} aria-hidden/></button></div></div>
      <section className="recipe-need" aria-labelledby="recipe-need-title">
        <div className="recipe-need-head"><h3 id="recipe-need-title">What you need</h3>
          {toAdd.length > 0 && <button type="button" disabled={busy} onClick={() => void addMissing()}><ShoppingCart size={15} aria-hidden/>Add {toAdd.length} to trolley</button>}</div>
        <ul>{items.map(item => <li key={item.ingredient}>
          {item.lot ? <FoodFace lot={{ ingredient: item.ingredient, unit: item.unit }} size={16} className="is-ing"/> : <span className="kitchen-face is-ing is-missing" aria-hidden><ShoppingCart size={15}/></span>}
          <span className="recipe-need-name"><strong>{capital(item.ingredient)}</strong> {amount(item)}</span>
          {item.lot ? <span className="recipe-have"><Check size={14} aria-hidden/>{placeNames[placeOf(item.lot)]}</span> : <span className="recipe-buy">{listed.has(ingredientName(item.ingredient)) ? "On your list" : "To buy"}</span>}
        </li>)}</ul>
        <SheetError f={f} failed={failed}/>
      </section>
      <section className="recipe-steps" aria-labelledby="recipe-steps-title"><h3 id="recipe-steps-title">How to make it{recipe.steps.length ? ` · ${recipe.steps.length} ${recipe.steps.length === 1 ? "step" : "steps"}` : ""}</h3>
        {recipe.steps.length ? <ol>{recipe.steps.map((text, i) => <li key={i}><span aria-hidden>{i + 1}</span>{text}</li>)}</ol> : <p>No steps are saved for this meal.</p>}
        <small>Check the ingredients, portions and your own dietary needs.</small>
        {recipe.ai && <AiReport source="meal-plan" noun="recipe" text={[recipe.title, items.map(item => `${item.ingredient} ${amount(item)}`.trim()).join(", "), ...recipe.steps].join("\n")}/>}
      </section>
    </div>
    <div className="kitchen-steps-foot recipe-foot"><button type="button" className="kitchen-primary" onClick={onCook}><ChefHat size={20} aria-hidden/>Cook it now</button>
      {!recipe.planId && <button type="button" className="kitchen-secondary" onClick={onPlan}>Plan it</button>}</div>
  </>;
}

// Cooking, one step at a time, with a timer when a step says how long.
function CookMode({ recipe, servings, step, setStep, onStop, onFinish }: { recipe: Recipe; servings: number; step: number; setStep: (step: number) => void; onStop: () => void; onFinish: () => void }) {
  const text = recipe.steps[step], minutes = stepMinutes(text), last = step === recipe.steps.length - 1;
  const uses = stepIngredients(text, scaled(recipe.ingredients, recipe.servings, servings));
  const awake = typeof navigator !== "undefined" && "wakeLock" in navigator;
  return <>
    <div className="cook-mode-top"><button type="button" className="kitchen-round" aria-label="Stop cooking" onClick={onStop}><X size={20} aria-hidden/></button>
      <DialogTitle asChild><h2>{recipe.title}</h2></DialogTitle><span>{step + 1} of {recipe.steps.length}</span></div>
    <div className="kitchen-progress" aria-hidden>{recipe.steps.map((_, i) => <span key={i} className={i <= step ? "is-done" : undefined}/>)}</div>
    <div className="kitchen-steps-body cook-mode-body">
      <section className="cook-step" aria-label={`Step ${step + 1}`}>
        <span className="cook-step-number" aria-hidden>{step + 1}</span>
        <p aria-live="polite">{text}</p>
        {uses.length > 0 && <><h3>For this step</h3><div className="cook-uses">{uses.map(item => <span key={item.ingredient}><FoodFace lot={{ ingredient: item.ingredient, unit: item.unit }} size={15} className="is-ing"/>{capital(item.ingredient)}{item.quantity !== null && ` · ${amount(item)}`}</span>)}</div></>}
      </section>
      {minutes && <StepTimer key={step} minutes={minutes}/>}
      {awake && <p className="cook-awake">The screen stays on while you cook.</p>}
    </div>
    <div className="kitchen-steps-foot cook-mode-foot"><button type="button" className="kitchen-round is-big" aria-label="Previous step" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft size={22} aria-hidden/></button>
      <button type="button" className="kitchen-primary" onClick={() => last ? onFinish() : setStep(step + 1)}>{last ? "I’ve finished" : "Next step"}<ArrowRight size={20} aria-hidden/></button></div>
  </>;
}

function StepTimer({ minutes }: { minutes: number }) {
  const [endsAt, setEndsAt] = useState<number | null>(null), [now, setNow] = useState(0);
  const left = endsAt === null ? minutes * 60 : Math.max(0, Math.ceil((endsAt - now) / 1000));
  useEffect(() => {
    if (endsAt === null || left === 0) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [endsAt, left]);
  useEffect(() => { if (endsAt !== null && left === 0) navigator.vibrate?.([300, 150, 300]); }, [endsAt, left]);
  if (endsAt === null) return <button type="button" className="cook-timer" onClick={() => { const start = Date.now(); setNow(start); setEndsAt(start + minutes * 60_000); }}><Timer size={20} aria-hidden/>Start a {minutes}-minute timer</button>;
  return <div className={`cook-timer is-running${left === 0 ? " is-done" : ""}`} role="timer" aria-live={left === 0 ? "assertive" : "off"}>
    <Timer size={20} aria-hidden/><span>{left === 0 ? "Time’s up" : `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")} left`}</span>
    <button type="button" onClick={() => setEndsAt(null)}>{left === 0 ? "Done" : "Stop"}</button></div>;
}

// Finished: put it on today's plate, take what it used from the kitchen, and keep any leftovers.
function Finish({ a, recipe, servings, onBack, onClose }: { a: AppState; recipe: Recipe; servings: number; onBack: () => void; onClose: () => void }) {
  const f = a.food, state = f.snapshot!.state, overview = f.snapshot!.overview;
  const [meal, setMeal] = useState<Meal>(recipe.meal), [leftovers, setLeftovers] = useState(0), [saving, setSaving] = useState(false), [failed, setFailed] = useState(false);
  const consumed = cookConsumption(scaled(recipe.ingredients, recipe.servings, servings), state.stock);
  const lotOf = (id: string) => state.stock.find(lot => lot.id === id)!;
  // Food set aside for other planned meals can be used, and what's then missing goes on the trolley list.
  const reserved = !recipe.planId && consumed.some(item => { const lot = lotOf(item.stockId), row = overview.inventory.find(entry => entry.ingredient === lot.ingredient && entry.unit === lot.unit); return !!row && item.quantity > row.available; });
  async function save() {
    setSaving(true); setFailed(false);
    const done = await f.submit({ type: "cook", ...(recipe.planId ? { planId: recipe.planId } : {}), title: recipe.title.slice(0, 120), date: today(), meal, servings, consumed, useReservedStock: reserved, intake: { portions: 1 },
      ...(leftovers > 0 ? { leftovers: { id: crypto.randomUUID(), title: recipe.title.slice(0, 120), portions: leftovers, bestBefore: null } } : {}) });
    setSaving(false); if (done) onClose(); else setFailed(true);
  }
  return <>
    <div className="putaway-top"><button type="button" className="kitchen-round" aria-label="Back to the steps" onClick={onBack}><ChevronLeft size={20} aria-hidden/></button>
      <div><DialogTitle asChild><h2 className="kitchen-step-title">All done</h2></DialogTitle><p>Enjoy your {recipe.title.toLowerCase()}.</p></div></div>
    <div className="kitchen-steps-body finish-body">
      <h3 className="when-label">Which meal?</h3>
      <div className="when-meals" role="group" aria-label="Meal">{dayMeals.map(item => { const look = mealLooks[item]; return <button key={item} type="button" aria-pressed={meal === item} onClick={() => setMeal(item)}><span className={`when-meal-icon food-tone-${look.tone}`} aria-hidden><look.Icon size={18}/></span>{item}</button>; })}</div>
      {servings > 1 && <div className="when-servings"><span>Any left over?</span><div>
        <button type="button" aria-label="Fewer portions left over" disabled={leftovers <= 0} onClick={() => setLeftovers(leftovers - 1)}><Minus size={18} aria-hidden/></button>
        <output aria-live="polite">{leftovers}</output>
        <button type="button" aria-label="More portions left over" disabled={leftovers >= servings - 1} onClick={() => setLeftovers(leftovers + 1)}><Plus size={18} aria-hidden/></button></div></div>}
      <section className="finish-used"><h3>From your kitchen</h3>
        {consumed.length ? <ul>{consumed.map(item => { const lot = lotOf(item.stockId); return <li key={item.stockId}><FoodFace lot={lot} size={15} className="is-ing"/>{capital(lot.ingredient)} · {quantityText(item.quantity)} {unitText(item.unit, item.quantity)}</li>; })}</ul>
          : <p>Nothing from your kitchen is counted.</p>}
        {leftovers > 0 && <p>{leftovers} {leftovers === 1 ? "portion goes" : "portions go"} in the fridge.</p>}
        {reserved && <p className="kitchen-note">Some of this was set aside for your planned meals. What’s missing goes on your trolley list.</p>}
      </section>
      <SheetError f={f} failed={failed}/>
    </div>
    <div className="kitchen-steps-foot recipe-foot"><button type="button" className="kitchen-primary" disabled={saving || f.busy || !!f.pending || !!f.draft} onClick={() => void save()}><Check size={20} aria-hidden/>{saving ? "Saving…" : "Put it on today’s plate"}</button>
      <button type="button" className="kitchen-secondary" onClick={onClose}>Not now</button></div>
  </>;
}
