import type { Entry } from "./daywell.ts";
import { aisleFor } from "./food-aisles.ts";
import { ingredientName, measured, type FoodState, type IngredientAmount, type Plan, type Stock } from "./food.ts";
import { suggestedConsumption } from "./food-planning.ts";
import { isEaten } from "./food-tracking.ts";

// Today's plate and cooking from the kitchen (owner-approved Kitchen design, part 3, 20 October 2026).
export const plateMeals = ["Breakfast", "Lunch", "Snack", "Dinner"] as const;
export type PlateMeal = typeof plateMeals[number];
export type InputUnit = "g" | "kg" | "ml" | "l" | "each" | "portion";
export type RecipeIngredient = { ingredient: string; quantity: number | null; unit: InputUnit; have?: boolean };

const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 864e5);
// Use soon: a reminder date within three days, or one that has passed.
export const soonLot = (lot: Stock, today: string) => !!lot.bestBefore && daysBetween(today, lot.bestBefore) <= 3;
// Leftovers and ready meals: counted in portions, or in the ready-meal aisle.
export const readyMeal = (lot: Stock) => lot.unit === "portion" || aisleFor(lot.ingredient, lot.unit) === "ready";

// What today's plate shows for each meal: what was eaten, and what's planned.
export function plateFor(entries: Entry[], plans: Plan[], date: string) {
  const eaten = entries.filter(entry => entry.kind === "food" && entry.data.date === date && isEaten(entry.data));
  return Object.fromEntries(plateMeals.map(meal => [meal, {
    noted: eaten.filter(entry => entry.data.meal === meal).map(entry => String(entry.data.title)),
    planned: plans.filter(plan => plan.date === date && plan.meal === meal),
  }])) as Record<PlateMeal, { noted: string[]; planned: Plan[] }>;
}

export type Suggestion =
  | { kind: "planned"; key: string; title: string; note: string; plan: Plan }
  | { kind: "leftover" | "kitchen"; key: string; title: string; note: string; lot: Stock }
  | { kind: "again"; key: string; title: string; note: string; entry: Entry };

// Quick picks for a meal: what's planned, leftovers and use-soon food from the kitchen, then what was had before.
// At most four, and never the same food twice.
export function plateSuggestions(meal: PlateMeal, state: FoodState, entries: Entry[], today: string, dayName: (date: string) => string): Suggestion[] {
  const picks: Suggestion[] = [], seen = new Set<string>();
  const add = (item: Suggestion) => { const name = ingredientName(item.title); if (picks.length < 4 && !seen.has(name)) { seen.add(name); picks.push(item); } };
  const planned = state.plans.filter(plan => plan.meal === meal && plan.date >= today && daysBetween(today, plan.date) <= 2).sort((a, b) => a.date.localeCompare(b.date));
  for (const plan of planned.slice(0, 2)) add({ kind: "planned", key: `plan:${plan.id}`, title: plan.title, note: plan.date === today ? "Planned for today" : `Planned for ${dayName(plan.date).toLowerCase()}`, plan });
  const lots = state.stock.filter(lot => lot.quantity !== 0)
    .sort((a, b) => Number(soonLot(b, today)) - Number(soonLot(a, today)) || (a.bestBefore ?? "9999").localeCompare(b.bestBefore ?? "9999"));
  for (const lot of lots.filter(readyMeal).slice(0, 2)) add({ kind: "leftover", key: `lot:${lot.id}`, title: lot.ingredient, note: soonLot(lot, today) ? "Use soon" : "In your kitchen", lot });
  for (const lot of lots.filter(lot => !readyMeal(lot) && soonLot(lot, today)).slice(0, 1)) add({ kind: "kitchen", key: `lot:${lot.id}`, title: lot.ingredient, note: "Use soon", lot });
  const before = entries.filter(entry => entry.kind === "food" && entry.data.meal === meal && entry.data.date < today && isEaten(entry.data))
    .sort((a, b) => String(b.data.date).localeCompare(String(a.data.date)));
  for (const entry of before.slice(0, 8)) add({ kind: "again", key: `again:${entry.id}`, title: String(entry.data.title), note: daysBetween(entry.data.date, today) <= 6 ? `You had it ${dayName(entry.data.date)}` : "You had it before", entry });
  for (const lot of lots.filter(lot => !readyMeal(lot)).slice(0, 4)) add({ kind: "kitchen", key: `lot:${lot.id}`, title: lot.ingredient, note: "In your kitchen", lot });
  return picks;
}

// Amounts for the servings being made.
export const scaled = (items: RecipeIngredient[], from: number, to: number) =>
  items.map(item => ({ ...item, quantity: item.quantity === null ? null : Math.round(item.quantity * to / Math.max(1, from) * 1000) / 1000 }));
// What cooking takes from the kitchen: matching food, soonest reminder first (as for planned meals).
export function cookConsumption(items: RecipeIngredient[], stock: Stock[]) {
  const ingredients: IngredientAmount[] = items.map(item => ({ ingredient: ingredientName(item.ingredient), ...(item.quantity === null ? { quantity: null, unit: measured(1, item.unit).unit } : measured(item.quantity, item.unit)) }));
  return suggestedConsumption({ ingredients } as Plan, stock);
}
// The kitchen's food of this name, if there's any left.
export const kitchenLot = (name: string, stock: Stock[]) => { const food = ingredientName(name); return stock.find(lot => ingredientName(lot.ingredient) === food && lot.quantity !== 0); };

// A step that says how long ("simmer for 10 minutes", "8–10 mins") offers a timer; a range uses the longer time.
export function stepMinutes(step: string) {
  const match = step.match(/(\d{1,3})(?:\s*(?:-|–|to)\s*(\d{1,3}))?\s*(?:minutes?|mins?)\b/i);
  if (!match) return null;
  const minutes = Number(match[2] ?? match[1]);
  return minutes > 0 && minutes <= 180 ? minutes : null;
}
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// The ingredients a step mentions ("the oil" finds vegetable oil), for "For this step".
export function stepIngredients(step: string, items: RecipeIngredient[]) {
  const text = step.toLowerCase();
  return items.filter(item => {
    const name = ingredientName(item.ingredient), last = name.split(" ").at(-1) ?? name;
    return [...new Set([name, last])].filter(word => word.length >= 3).some(word => new RegExp(`\\b${escape(word)}(e?s)?\\b`).test(text));
  });
}
