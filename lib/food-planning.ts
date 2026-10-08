import { ingredientName, type IngredientAmount, type Plan, type Stock } from "./food.ts";

export const starterAmounts: Record<string, IngredientAmount[]> = {
  chickpeas: [
    { ingredient: "canned chickpeas (drained)", quantity: 120, unit: "g" },
    { ingredient: "dry couscous", quantity: 60, unit: "g" },
    { ingredient: "tomato", quantity: 1, unit: "each" },
    { ingredient: "cucumber", quantity: 0.25, unit: "each" },
    { ingredient: "lemon", quantity: 0.5, unit: "each" },
    { ingredient: "olive oil", quantity: 5, unit: "ml" },
  ],
  eggs: [
    { ingredient: "egg", quantity: 2, unit: "each" },
    { ingredient: "spinach", quantity: 50, unit: "g" },
    { ingredient: "wholegrain bread slice", quantity: 2, unit: "each" },
    { ingredient: "tomato", quantity: 1, unit: "each" },
    { ingredient: "olive oil", quantity: 5, unit: "ml" },
  ],
  oats: [
    { ingredient: "oat", quantity: 50, unit: "g" },
    { ingredient: "milk", quantity: 200, unit: "ml" },
    { ingredient: "berry", quantity: 80, unit: "g" },
    { ingredient: "pumpkin seeds", quantity: 10, unit: "g" },
  ],
};
export const rounded = (n: number) => Math.round(n * 1000) / 1000;
export function scaleIngredients<T extends { quantity: number }>(items: T[], from: number, to: number): T[] {
  return items.map(item => ({ ...item, quantity: rounded(item.quantity * to / from) }));
}
export function windowEnd(start: string, days: number) {
  const date = new Date(`${start}T12:00:00Z`);
  if (!Number.isFinite(date.valueOf())) return start;
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
// Offer quantities from known, compatible lots only. Shortages remain visible
// to the user; a suggestion is never evidence that cooking has happened.
export function suggestedConsumption(plan: Plan, stock: Stock[]) {
  const available = new Map(stock.map(lot => [lot.id, lot.quantity ?? 0]));
  const used = new Map<string, { stockId: string; quantity: number; unit: Stock["unit"] }>();
  const ordered = [...stock].sort((a, b) => (a.bestBefore || "9999").localeCompare(b.bestBefore || "9999"));
  for (const required of plan.ingredients) {
    let remaining = required.quantity;
    for (const lot of ordered.filter(item => ingredientName(item.ingredient) === ingredientName(required.ingredient) && item.unit === required.unit)) {
      const quantity = Math.min(remaining, available.get(lot.id) ?? 0);
      if (quantity <= 0) continue;
      used.set(lot.id, { stockId: lot.id, quantity: rounded((used.get(lot.id)?.quantity ?? 0) + quantity), unit: lot.unit });
      available.set(lot.id, rounded((available.get(lot.id) ?? 0) - quantity));
      remaining = rounded(remaining - quantity);
    }
  }
  return [...used.values()];
}
