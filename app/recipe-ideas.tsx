"use client";
import { useEffect, useId, useState } from "react";
import { ArrowRight, Clock, Plus, ShoppingBasket, Sparkles } from "lucide-react";
import { ingredientName } from "@/lib/food";
import type { FoodAction } from "@/lib/food-client";
import type { BasketIdeas as Ideas, MealSteps, RecipeAsk, RecipeIdea } from "@/lib/recipe-ideas";
import { mealLooks, quantityText, unitText } from "./food-look";
import { AiReport } from "./ai-report";
import type { AppState } from "./use-daywell";

// Recipe ideas (lib/recipe-ideas.ts): a few recipes from the Food basket, and simple steps for a meal being planned.
type Food = AppState["food"];
type PlanInput = Extract<FoodAction, { type: "plan.set" }>["plan"];
const failed = "Couldn’t find recipe ideas right now. Please try again.";
const withQuantity = (item: { ingredient: string; quantity: number | null; unit: string }) => item.quantity === null ? item.ingredient : `${item.ingredient} ${quantityText(item.quantity)} ${unitText(item.unit, item.quantity)}`;

// Whether recipe ideas can be asked for at all, checked once per page and again after a failed check.
let connection: Promise<boolean> | null = null;
function useRecipesConnected() {
  const [connected, setConnected] = useState<boolean | null>(null);
  useEffect(() => {
    let live = true;
    connection ??= fetch("/api/recipes", { cache: "no-store" }).then(response => response.ok ? response.json() as Promise<{ connected?: boolean }> : null).then(body => body?.connected === true, () => false);
    void connection.then(value => { if (!value) connection = null; if (live) setConnected(value); });
    return () => { live = false; };
  }, []);
  return connected;
}
async function askRecipes<T>(request: RecipeAsk): Promise<T> {
  const response = await fetch("/api/recipes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request), signal: AbortSignal.timeout(60_000) });
  const value = await response.json().catch(() => null) as (T & { error?: string }) | null;
  if (!response.ok || !value) throw Error(value?.error || failed);
  return value;
}

// On the Food basket: "What could I make?", up to three recipes from what's there.
export function BasketIdeas({ f }: { f: Food }) {
  const connected = useRecipesConnected(), title = useId();
  const [ideas, setIdeas] = useState<Ideas | null>(null), [wish, setWish] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const state = f.snapshot!.state;
  if (connected !== true || !state.stock.some(lot => lot.quantity !== 0)) return null;
  // Already on the list, as a note or for a planned meal: never added twice.
  const listed = new Set([...state.shopping.filter(note => !note.done).map(note => ingredientName(note.title)), ...f.snapshot!.overview.toBuy.map(row => row.ingredient)]);
  async function ask() {
    setBusy(true); setError("");
    try { setIdeas(await askRecipes<Ideas>({ kind: "basket", wish, avoid: ideas?.ideas.map(idea => idea.title) ?? [] })); }
    catch (problem) { setError(problem instanceof Error ? problem.message : failed); }
    finally { setBusy(false); }
  }
  function plan(idea: RecipeIdea) {
    f.open({ type: "plan.set", plan: { id: crypto.randomUUID(), title: idea.title, date: f.start, meal: idea.meal, servings: 1,
      ingredients: idea.ingredients.map(({ ingredient, quantity, unit }) => ({ ingredient, quantity, unit })),
      guide: { steps: idea.steps, nutritionNote: "AI recipe idea for one serving. Check the ingredients, portion and your dietary needs." } } });
  }
  function addToList(items: RecipeIdea["ingredients"]) {
    f.open({ type: "shopping.add", items: items.map(item => ({ id: crypto.randomUUID(), title: item.ingredient, quantity: item.quantity === null ? "" : `${quantityText(item.quantity)} ${unitText(item.unit, item.quantity)}`, done: false })) });
  }
  return <section className="basket-ideas" aria-labelledby={title}>
    <div className="basket-ideas-head"><span className="food-invitation-icon" aria-hidden><Sparkles size={24}/></span><div><span className="food-eyebrow">Ideas from your basket</span><h2 id={title}>What could I make?</h2><p>A few simple recipes from what you have. Anything missing can go straight on your list.</p></div></div>
    <label className="basket-ideas-wish">Anything you fancy or want to avoid? (optional)<input maxLength={300} value={wish} placeholder="Quick, no mushrooms…" onChange={event => setWish(event.target.value)}/></label>
    <button className="well-button" disabled={busy} onClick={() => void ask()}><Sparkles size={18} aria-hidden/>{busy ? "Finding ideas…" : ideas?.ideas.length ? "Show different ideas" : "Suggest recipes"}</button>
    <div aria-live="polite">{ideas && <p className="basket-ideas-summary">{ideas.summary}</p>}{error && <p className="form-error" role="alert">{error}</p>}</div>
    {!!ideas?.ideas.length && <div className="food-recipe-grid basket-ideas-list">{ideas.ideas.map(idea => {
      const { Icon, tone } = mealLooks[idea.meal], have = idea.ingredients.filter(item => item.have), missing = idea.ingredients.filter(item => !item.have);
      const toAdd = missing.filter(item => !listed.has(ingredientName(item.ingredient)));
      return <article className={`food-recipe food-tone-${tone}`} key={idea.title}>
        <div className="food-recipe-top"><span className="food-meal-chip"><span className="food-item-icon" aria-hidden><Icon size={24}/></span>{idea.meal}</span><span className="food-time"><Clock size={13} aria-hidden/>{idea.minutes} min</span></div>
        <h3>{idea.title}</h3>
        {!!have.length && <><p className="idea-label">From your basket</p><ul className="food-chips">{have.map(item => <li key={item.ingredient}>{item.ingredient}</li>)}</ul></>}
        {missing.length ? <><p className="idea-label">You’d need</p><ul className="food-chips is-missing">{missing.map(item => <li key={item.ingredient}>{item.ingredient}{item.quantity !== null && <small> {quantityText(item.quantity)} {unitText(item.unit, item.quantity)}</small>}</li>)}</ul></> : <p className="idea-label is-ready">Nothing to buy</p>}
        <details><summary>How to make it</summary><ol>{idea.steps.map((step, index) => <li key={index}>{step}</li>)}</ol><small>Review ingredients, portions and your own dietary needs.</small></details>
        <div className="idea-actions"><button className="well-button well-secondary" onClick={() => plan(idea)}>Plan this meal<ArrowRight size={16} aria-hidden/></button>
          {toAdd.length > 0 ? <button className="well-text-button" onClick={() => addToList(toAdd)}><ShoppingBasket size={16} aria-hidden/>Add {toAdd.length === 1 ? "it" : `these ${toAdd.length}`} to my list</button> : missing.length > 0 && <span className="idea-listed">Already on your list</span>}</div>
        <AiReport key={idea.title} source="meal-plan" noun="recipe" text={[idea.title, idea.ingredients.map(withQuantity).join(", "), ...idea.steps].join("\n")}/>
      </article>;
    })}</div>}
    <p className="food-caption">Asking sends your basket’s names and quantities, and anything you type here, to OpenAI. Nothing is saved until you choose.</p>
  </section>;
}

// While planning a meal: once its ingredients are in, simple steps for them.
export function RecipeHelper({ plan, onSteps, onAdd }: { plan: PlanInput; onSteps: (plan: PlanInput) => void; onAdd: (names: string[]) => void }) {
  const connected = useRecipesConnected(), title = useId();
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [note, setNote] = useState(""), [extras, setExtras] = useState<string[]>([]);
  if (connected !== true) return null;
  const listed = plan.ingredients.filter(item => item.ingredient.trim()), steps = plan.guide?.steps ?? [];
  async function suggest() {
    setBusy(true); setError(""); setNote(""); setExtras([]);
    try {
      const reply = await askRecipes<MealSteps>({ kind: "meal", title: plan.title, servings: plan.servings, ingredients: listed.map(({ ingredient, quantity, unit }) => ({ ingredient: ingredient.trim(), quantity, unit })) });
      if (!reply.steps.length) { setNote(reply.summary); return; }
      onSteps({ ...plan, title: plan.title.trim() || reply.title, guide: { ...plan.guide, steps: reply.steps, nutritionNote: plan.guide?.nutritionNote || "Recipe steps suggested by AI. Check the ingredients, portions and your dietary needs." } });
      setExtras(reply.extras);
    } catch (problem) { setError(problem instanceof Error ? problem.message : failed); }
    finally { setBusy(false); }
  }
  return <section className="recipe-helper" aria-labelledby={title}>
    <div className="recipe-helper-head"><span className="food-invitation-icon" aria-hidden><Sparkles size={20}/></span><div><h3 id={title}>{steps.length ? "How to make it" : "Need a recipe?"}</h3><p>{steps.length ? "These steps are saved with the meal." : "Add the ingredients, then Daywell can write simple steps for them."}</p></div></div>
    {!!steps.length && <ol className="recipe-steps">{steps.map((step, index) => <li key={index}>{step}</li>)}</ol>}
    {!!extras.length && <div className="recipe-extras"><p>These steps also use {extras.join(", ")}.</p><button type="button" className="well-text-button" onClick={() => { onAdd(extras); setExtras([]); }}><Plus size={16} aria-hidden/>Add {extras.length === 1 ? "it" : "them"} to the ingredients</button></div>}
    <div aria-live="polite">{note && <p className="food-feedback">{note}</p>}{error && <p className="form-error" role="alert">{error}</p>}</div>
    <div className="well-actions"><button type="button" className="well-button well-secondary" disabled={busy || !listed.length} onClick={() => void suggest()}><Sparkles size={17} aria-hidden/>{busy ? "Writing steps…" : steps.length ? "Suggest different steps" : "Suggest a recipe"}</button>
      {!!steps.length && <button type="button" className="well-text-button" onClick={() => { setExtras([]); onSteps({ ...plan, guide: { ...plan.guide!, steps: [] } }); }}>Remove steps</button>}</div>
    {!!steps.length && <AiReport key={steps.join("\n")} inForm source="meal-plan" noun="recipe" text={[plan.title, listed.map(withQuantity).join(", "), ...steps].join("\n")}/>}
    <p className="food-caption">Asking sends the meal name and ingredients to OpenAI. Nothing is saved until you save this meal.</p>
  </section>;
}
