"use client";
import type { FoodState } from "@/lib/food";
import { mealCoverage, type MealProposal } from "@/lib/food-journey";

export function PlanCoverage({ state, plans }: { state: FoodState; plans: MealProposal[] }) {
  const coverage = mealCoverage(state, plans), count = coverage.filter(item => item.covered).length;
  const missing = coverage.flatMap(item => item.missing);
  return <section className="plan-coverage" aria-label="Meal coverage" aria-live="polite">
    <strong>{count} of {plans.length} {plans.length === 1 ? "meal" : "meals"} covered by your available basket</strong>
    <p>For the portions shown. Food reserved for existing plans is already set aside. This is a meal count, not a freshness estimate or a whole-day food plan.</p>
    {missing.length > 0 && <details><summary>What needs checking or shopping?</summary><ul>{missing.map((item, i) => <li key={i}>{item.ingredient}{item.quantity !== null && `: ${item.quantity} ${item.unit}`} {item.needsCheck ? "— check the quantity or unit in your basket first" : "still needed"}</li>)}</ul><p>Saving the reviewed plan adds these needs to Shopping. It does not buy anything.</p></details>}
  </section>;
}
export function PlanGuide({ plan }: { plan: MealProposal }) {
  if (!plan.guide) return <p className="food-caption">Calories per serving not added.</p>;
  return <div className="plan-guide"><strong>{plan.guide.caloriesPerServing === undefined ? "Calories per serving not added" : `About ${plan.guide.caloriesPerServing} kcal per serving`}</strong><small>{plan.guide.nutritionNote}</small>{!!plan.guide.steps.length && <details><summary>Cooking steps</summary><ol>{plan.guide.steps.map((step, i) => <li key={i}>{step}</li>)}</ol></details>}</div>;
}
