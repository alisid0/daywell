"use client";
import { useEffect, useId, useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import type { FoodAction } from "@/lib/food-client";
import type { MealSteps, RecipeAsk } from "@/lib/recipe-ideas";
import { quantityText, unitText } from "./food-look";
import { AiReport } from "./ai-report";

// Recipe ideas (lib/recipe-ideas.ts): asking for them (the recipe cards in app/cook.tsx use this too), and simple steps
// for a meal being planned.
type PlanInput = Extract<FoodAction, { type: "plan.set" }>["plan"];
const failed = "Couldn’t find recipe ideas right now. Please try again.";
const withQuantity = (item: { ingredient: string; quantity: number | null; unit: string }) => item.quantity === null ? item.ingredient : `${item.ingredient} ${quantityText(item.quantity)} ${unitText(item.unit, item.quantity)}`;

// Whether recipe ideas can be asked for at all, checked once per page and again after a failed check.
let connection: Promise<boolean> | null = null;
export function useRecipesConnected() {
  const [connected, setConnected] = useState<boolean | null>(null);
  useEffect(() => {
    let live = true;
    connection ??= fetch("/api/recipes", { cache: "no-store" }).then(response => response.ok ? response.json() as Promise<{ connected?: boolean }> : null).then(body => body?.connected === true, () => false);
    void connection.then(value => { if (!value) connection = null; if (live) setConnected(value); });
    return () => { live = false; };
  }, []);
  return connected;
}
export async function askRecipes<T>(request: RecipeAsk): Promise<T> {
  const response = await fetch("/api/recipes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request), signal: AbortSignal.timeout(60_000) });
  const value = await response.json().catch(() => null) as (T & { error?: string }) | null;
  if (!response.ok || !value) throw Error(value?.error || failed);
  return value;
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
