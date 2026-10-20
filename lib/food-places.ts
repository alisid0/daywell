import { aisleFor, type AisleId } from "./food-aisles.ts";
import { ingredientName, placeIds } from "./food.ts";

// Where food lives in the Kitchen (owner-approved design, 19 October 2026). Every basket lot sits on one shelf. A lot
// without a saved place goes where its kind of food usually lives; anything the person chooses wins, and the next pack
// of the same food follows the last choice.
export { placeIds };
export type PlaceId = typeof placeIds[number];
export const placeNames: Record<PlaceId, string> = { fridge: "Fridge", freezer: "Freezer", cupboard: "Cupboard", fruit: "Fruit and veg" };

const byAisle: Record<AisleId, PlaceId> = {
  fruit: "fruit", vegetables: "fruit", herbs: "cupboard", bakery: "cupboard", meat: "fridge", fish: "fridge", dairy: "fridge",
  ready: "fridge", grains: "cupboard", beans: "cupboard", cupboard: "cupboard", frozen: "freezer", drinks: "cupboard", snacks: "cupboard",
  household: "cupboard", other: "cupboard",
};
// Leafy and delicate food is kept cold even though its aisle is fruit and veg; fresh herbs too. Frozen food stays frozen.
const chilled = /spinach|lettuce|salad|rocket|kale|greens|broccoli|cucumber|celery|courgette|asparagus|\bpeas?\b|mushroom|berr|grape|basil|parsley|coriander|\bmint\b|tofu|hummus|houmous/;

type Lot = { ingredient: string; unit?: string; place?: PlaceId };
export function usualPlace(ingredient: string, unit?: string): PlaceId {
  const name = ingredientName(ingredient), aisle = aisleFor(name, unit);
  if (aisle === "frozen") return "freezer";
  // Leftovers and ready meals, counted in portions, are kept cold whatever they're made of.
  return unit === "portion" || chilled.test(name) ? "fridge" : byAisle[aisle];
}
// Where a new pack of this food should go: where the last one was put (on a shelf now, or remembered from before),
// else where it usually lives.
export function suggestedPlace(ingredient: string, unit: string | undefined, stock: Lot[], places?: Partial<Record<string, PlaceId>>): PlaceId {
  const name = ingredientName(ingredient);
  const placed = [...stock].reverse().find(lot => lot.place && ingredientName(lot.ingredient) === name);
  return placed?.place ?? places?.[name] ?? usualPlace(name, unit);
}
type InputUnit = "g" | "kg" | "ml" | "l" | "each" | "portion";
// The unit most people count this food in, until they have one in the kitchen to copy.
export function usualUnit(name: string, stock: { ingredient: string; unit: InputUnit }[]): InputUnit {
  const food = ingredientName(name);
  const known = [...stock].reverse().find(lot => ingredientName(lot.ingredient) === food);
  if (known) return known.unit;
  if (/milk|juice|water|\boil\b|sauce|cream|vinegar|drink|squash/.test(food)) return "ml";
  if (/leftover|chilli|curry|soup|stew|lasagne|casserole/.test(food)) return "portion";
  if (/\beggs?\b|apple|banana|orange|lemon|lime|avocado|onion|pepper|loaf|bread|\brolls?\b|bagel|wraps?|\btins?\b|\bcans?\b|jar|bottle|pack|clove|yoghurt/.test(food)) return "each";
  return "g";
}
export const placeOf = (lot: Lot): PlaceId => lot.place ?? usualPlace(lot.ingredient, lot.unit);
