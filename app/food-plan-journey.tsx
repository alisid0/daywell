"use client";
import { useState } from "react";
import { Mic, Sparkles } from "lucide-react";
import { ingredientName, type FoodState } from "@/lib/food";
import { mealCoverage, repeatMeal, type MealProposal } from "@/lib/food-journey";
import type { AppState } from "./use-daywell";

export function PlanCoverage({ state, plans }: { state: FoodState; plans: MealProposal[] }) {
  const coverage = mealCoverage(state, plans), count = coverage.filter(item => item.covered).length;
  const missing = coverage.flatMap(item => item.missing);
  return <section className="plan-coverage" aria-label="Meal coverage" aria-live="polite">
    <strong>{count} of {plans.length} {plans.length === 1 ? "meal" : "meals"} covered by your available basket</strong>
    <p>For the portions shown. Food reserved for existing plans is already set aside. This is a meal count, not a freshness estimate or a whole-day food plan.</p>
    {missing.length > 0 && <details><summary>What needs checking or shopping?</summary><ul>{missing.map((item, i) => <li key={i}>{item.ingredient}: {item.quantity} {item.unit} {item.needsCheck ? "— check your recorded amount / unit first" : "still needed"}</li>)}</ul><p>Saving the reviewed plan adds these needs to Shopping. It does not buy anything.</p></details>}
  </section>;
}
export function PlanGuide({ plan }: { plan: MealProposal }) {
  if (!plan.guide) return <p className="food-caption">Calories per serving not added.</p>;
  return <div className="plan-guide"><strong>{plan.guide.caloriesPerServing === undefined ? "Calories per serving not added" : `About ${plan.guide.caloriesPerServing} kcal per serving`}</strong><small>{plan.guide.nutritionNote}</small>{!!plan.guide.steps.length && <details><summary>Cooking steps</summary><ol>{plan.guide.steps.map((step, i) => <li key={i}>{step}</li>)}</ol></details>}</div>;
}
export function BasketPlanner({ a }: { a: AppState }) {
  const f = a.food, state = f.snapshot?.state;
  const [count, setCount] = useState(2), [meal, setMeal] = useState<MealProposal["meal"]>("Dinner");
  const [quick, setQuick] = useState(false), [eggsPerMeal, setEggsPerMeal] = useState(2), [noodlesPerMeal, setNoodlesPerMeal] = useState(1);
  const [calories, setCalories] = useState("");
  const eggs = state?.stock.find(item => ingredientName(item.ingredient) === "egg" && item.unit === "each");
  const noodles = state?.stock.find(item => /noodles?/.test(item.ingredient) && !/(cooked|prepared)/.test(item.ingredient.replace(/uncooked/g, "dry")) && ["g", "portion"].includes(item.unit));
  const canQuick = !!eggs && !!noodles;
  const noodleAmount = noodles?.unit === "g" ? noodlesPerMeal * 75 : noodlesPerMeal;
  const validCalories = calories === "" || (Number.isFinite(Number(calories)) && Number(calories) >= 0 && Number(calories) <= 10000);
  const plans = canQuick && f.start && validCalories ? repeatMeal({ title: "Egg noodles", ingredients: [{ ingredient: eggs.ingredient, quantity: eggsPerMeal, unit: "each" }, { ingredient: noodles.ingredient, quantity: noodleAmount, unit: noodles.unit }],
    guide: { steps: ["Cook the noodles following their pack instructions.", "Cook the eggs thoroughly using your preferred method, then combine with the noodles. Follow pack instructions where provided."], ...(calories === "" ? {} : { caloriesPerServing: Number(calories) }), nutritionNote: "Your estimate for the listed serving. Add any oil, sauce or extras separately before confirming consumption." } }, f.start, count, meal) : [];
  const locked = !f.fresh || f.busy || !!f.draft || !!f.pending || f.recovered;
  function ask() { window.dispatchEvent(new CustomEvent("daywell-capture", { detail: { mode: "plan", intent: "voice", planStart: f.start, planCount: count, planMeal: meal } })); }
  return <section className="basket-planner" aria-labelledby="basket-planner-title"><span className="food-eyebrow">A few meals from what you have</span><h2 id="basket-planner-title">What can my basket make?</h2><p>Start with one person. Show or tell Daywell what you fancy, then review the portions and anything missing.</p>
    <div className="food-form-grid"><label>First meal<input type="date" required value={f.start} onChange={e => { if (e.target.value) f.setStart(e.target.value); }}/></label><label>Meal<select value={meal} onChange={e => setMeal(e.target.value as MealProposal["meal"])}>{["Breakfast", "Lunch", "Dinner", "Snack"].map(value => <option key={value}>{value}</option>)}</select></label></div>
    <div className="capture-choices" role="group" aria-label="How many meals?">{[1, 2, 3, 7].map(value => <button type="button" key={value} aria-pressed={count === value} onClick={() => setCount(value)}>{value} {value === 1 ? "meal" : "meals"}</button>)}</div>
    <button className="well-button" disabled={locked || !state?.stock.length} onClick={ask}><Mic size={20}/>Talk through my meal plan</button><p className="food-caption">Shares your basket and reserved quantities with the AI service when you ask for a plan. Nothing is saved until you confirm.</p>
    {!state?.stock.length && <button className="well-text-button" onClick={() => window.dispatchEvent(new CustomEvent("daywell-capture", { detail: { mode: "basket", intent: "photo" } }))}>Show what I have first</button>}
    {canQuick && <><button className="well-text-button" aria-expanded={quick} onClick={() => setQuick(!quick)}><Sparkles size={16}/>Quick egg-and-noodle plan</button>{quick && <div className="quick-meal-plan"><p>A starting idea using your recorded eggs and noodles. Choose your own serving; no AI connection needed.</p><div className="food-form-grid"><label>Eggs per meal<select value={eggsPerMeal} onChange={e => setEggsPerMeal(Number(e.target.value))}>{[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}</select></label><label>Noodles per meal<select value={noodlesPerMeal} onChange={e => setNoodlesPerMeal(Number(e.target.value))}>{[.5, 1, 1.5, 2].map(n => <option key={n} value={n}>{noodles?.unit === "g" ? `${n * 75} g dry` : `${n} portion${n === 1 ? "" : "s"}`}</option>)}</select></label></div><details><summary>Add calories from your labels (optional)</summary><label>Calories for one whole serving<input type="number" min="0" max="10000" value={calories} onChange={e => setCalories(e.target.value)}/></label><p>Include both ingredients and anything you add. Leaving this blank keeps calories unknown.</p></details>{state && !!plans.length && <PlanCoverage state={state} plans={plans}/>}<button className="well-button" disabled={locked || !plans.length} onClick={() => { setQuick(false); f.open({ type: "plan.add", plans }); }}>Review these meals</button></div>}</>}
  </section>;
}
