import { aisleFor } from "./food-aisles.ts";
import { foodOverview, ingredientName, measured, type FoodState, type Stock } from "./food.ts";
import { usualUnit } from "./food-places.ts";

// The Trolley (owner-approved Kitchen design, part 2, 20 October 2026): what to get, picked into a tray while
// shopping, then put away on the shelves in one save.
type Overview = ReturnType<typeof foodOverview>;
export type InputUnit = "g" | "kg" | "ml" | "l" | "each" | "portion";
export type TrolleyItem = {
  key: string; name: string; unit: InputUnit;
  // How much is needed (planned meals) or was noted. Null when it isn't known.
  quantity: number | null;
  needsCheck: boolean; forMeals: string[];
  noteId?: string; noteQuantity?: string;
  // Household things (washing-up liquid) are ticked off, never put on a shelf.
  household: boolean;
};

const unitWords: Record<string, InputUnit> = {
  g: "g", gram: "g", grams: "g", kg: "kg", kilo: "kg", kilos: "kg", ml: "ml", l: "l", litre: "l", litres: "l", liter: "l", liters: "l",
  each: "each", item: "each", items: "each", x: "each", portion: "portion", portions: "portion",
};
// "500 g", "1.5kg", "2", "2 items". Blank means no quantity; null means it wasn't understood.
export function parseAmount(text: string, fallback: InputUnit): { quantity: number | null; unit: InputUnit } | null {
  const clean = text.trim().toLowerCase().replace(",", ".");
  if (!clean) return { quantity: null, unit: fallback };
  const match = clean.match(/^(\d+(?:\.\d+)?)\s*([a-z]+)?$/);
  if (!match) return null;
  const quantity = Number(match[1]), unit = match[2] ? unitWords[match[2]] : fallback;
  if (!unit || !(quantity > 0) || quantity > 1_000_000 || Math.abs(quantity * 1000 - Math.round(quantity * 1000)) > 1e-6) return null;
  return { quantity, unit };
}
// The amount as someone would write it: "500 g", "2", "2 portions".
export function amountWords(quantity: number | null, unit: string) {
  if (quantity === null) return "";
  const number = quantity.toLocaleString("en-GB", { maximumFractionDigits: 3, useGrouping: false });
  return unit === "each" ? number : unit === "portion" ? `${number} ${quantity === 1 ? "portion" : "portions"}` : `${number} ${unit}`;
}

// Everything still to get: what planned meals need (worked out from the kitchen), then notes, in the order they were
// added. Each has a stable key for the tray.
export function trolleyItems(state: FoodState, overview: Overview): TrolleyItem[] {
  const byDate = [...state.plans].sort((a, b) => a.date.localeCompare(b.date));
  const needs = overview.toBuy.map(row => ({
    key: `need:${row.ingredient}|${row.unit}`, name: row.ingredient, unit: row.unit as InputUnit,
    quantity: row.unmeasured || row.needsCheck ? null : row.toBuy, needsCheck: row.needsCheck,
    forMeals: [...new Set(byDate.filter(plan => plan.ingredients.some(item => item.ingredient === row.ingredient)).map(plan => plan.title))],
    household: false,
  }));
  const notes = state.shopping.filter(note => !note.done).map(note => {
    const unit = usualUnit(note.title, state.stock), amount = parseAmount(note.quantity, unit);
    return { key: `note:${note.id}`, name: note.title, unit: amount?.unit ?? unit, quantity: amount?.quantity ?? null, needsCheck: false, forMeals: [],
      noteId: note.id, noteQuantity: note.quantity, household: aisleFor(note.title) === "household" };
  });
  return [...needs, ...notes];
}

// A pack that can simply top up what's on the shelf: the same food and unit, both counted, with no dates.
export function topUpLot(stock: Stock[], name: string, quantity: number | null, unit: InputUnit, taken: Set<string>) {
  if (quantity === null) return undefined;
  const bought = { ingredient: ingredientName(name), ...measured(quantity, unit) };
  return stock.find(lot => !taken.has(lot.id) && lot.ingredient === bought.ingredient && lot.unit === bought.unit && lot.quantity !== null && lot.quantity > 0 && lot.bestBefore === null);
}

// Food from the latest shop, put away within the last 12 hours and not undone, wears a "New" badge on its shelf.
type Recent = { operationId: string; type: string; createdAt: string; undone: boolean };
export function newFromShop(state: FoodState, recent: Recent[], now = Date.now()) {
  const last = recent.find(item => item.type === "purchase");
  if (!last || last.undone || now - Date.parse(last.createdAt) > 12 * 3_600_000) return new Set<string>();
  return new Set(state.stock.filter(lot => lot.changedBy === last.operationId).map(lot => lot.id));
}
