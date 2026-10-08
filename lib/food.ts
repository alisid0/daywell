import { z } from "zod";

const id = z.string().regex(/^[a-zA-Z0-9-]{1,60}$/);
const shoppingId = z.string().regex(/^[a-zA-Z0-9-]{1,87}$/);
const label = z.string().trim().min(1).max(120);
const amount = z.number().finite().min(0).max(1_000_000).refine(n => Math.abs(n * 1000 - Math.round(n * 1000)) < 0.00001, "Use at most three decimal places.");
const positive = amount.refine(n => n > 0, "Enter an amount greater than zero.");
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return value >= "1900-01-01" && Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}, "Choose a valid date.");
const unit = z.enum(["g", "kg", "ml", "l", "each", "portion"]);
const requirement = z.object({ ingredient: label, quantity: positive, unit }).strict();
const planInput = z.object({
  id, title: label, date, meal: z.enum(["Breakfast", "Lunch", "Dinner", "Snack"]),
  servings: z.number().int().min(1).max(24),
  // Quantities cover all servings of this meal, not one serving.
  ingredients: z.array(requirement).min(1).max(40),
}).strict();
const stockInput = z.object({ id, ingredient: label, quantity: amount.nullable(), unit, bestBefore: date.nullable().default(null) }).strict();
const shoppingInput = z.object({ id: shoppingId, title: z.string().trim().min(1).max(160), quantity: z.string().trim().min(1).max(80), done: z.boolean() }).strict();
export const actionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("stock.set"), item: stockInput }).strict(),
  z.object({ type: z.literal("stock.remove"), id }).strict(),
  z.object({ type: z.literal("plan.set"), plan: planInput }).strict(),
  z.object({ type: z.literal("plan.window"), startDate: date, days: z.union([z.literal(2), z.literal(3), z.literal(7)]), plans: z.array(planInput).max(28) }).strict(),
  z.object({ type: z.literal("plan.remove"), id }).strict(),
  z.object({ type: z.literal("shopping.set"), item: shoppingInput }).strict(),
  z.object({ type: z.literal("shopping.remove"), id: shoppingId }).strict(),
  z.object({
    type: z.literal("purchase"),
    items: z.array(stockInput.extend({ quantity: positive, shoppingId: shoppingId.optional() }).strict()).min(1).max(40),
  }).strict(),
  z.object({
    type: z.literal("cook"), planId: id.optional(), title: label, date,
    meal: z.enum(["Breakfast", "Lunch", "Dinner", "Snack"]), servings: z.number().int().min(1).max(24),
    consumed: z.array(z.object({ stockId: id, quantity: positive, unit }).strict()).min(1).max(40),
    useReservedStock: z.boolean().default(false),
    leftovers: z.object({ id, title: label, portions: z.number().int().min(1).max(24), bestBefore: date.nullable().default(null) }).strict().optional(),
  }).strict(),
  z.object({ type: z.literal("undo"), operationId: id }).strict(),
]);
export const foodCommandSchema = z.object({
  operationId: id, expectedRevision: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER - 1), action: actionSchema,
}).strict();
export type FoodCommand = z.infer<typeof foodCommandSchema>;
export type Unit = "g" | "ml" | "each" | "portion";
export type IngredientAmount = { ingredient: string; quantity: number; unit: Unit };
export type Stock = Omit<z.infer<typeof stockInput>, "unit"> & { unit: Unit; changedBy: string };
export type Plan = Omit<z.infer<typeof planInput>, "ingredients"> & { ingredients: IngredientAmount[]; changedBy: string };
export type Shopping = z.infer<typeof shoppingInput> & { changedBy: string };
export type FoodState = { version: 1; stock: Stock[]; plans: Plan[]; shopping: Shopping[] };
const storedUnit = z.enum(["g", "ml", "each", "portion"]);
export const foodStateSchema = z.object({
  version: z.literal(1),
  stock: z.array(stockInput.extend({ unit: storedUnit, quantity: z.number().finite().min(0).max(1_000_000_000).nullable(), changedBy: id })),
  plans: z.array(planInput.extend({ ingredients: z.array(requirement.extend({ unit: storedUnit, quantity: z.number().finite().min(0).max(1_000_000_000) })), changedBy: id })),
  shopping: z.array(shoppingInput.extend({ changedBy: id })),
});
type Change<T> = { id: string; before: T | null; after: T | null };
export type MealRecord = { id: string; data: { title: string; date: string; meal: "Breakfast" | "Lunch" | "Dinner" | "Snack"; calories: number; protein: number; carbs: number; fat: number; nutritionKnown: boolean } };
export type FoodEffect = {
  type: FoodCommand["action"]["type"];
  stock: Change<Stock>[]; plans: Change<Plan>[]; shopping: Change<Shopping>[];
  meal: MealRecord | null;
};
export class FoodError extends Error {
  status: number;
  constructor(message: string, status = 409) { super(message); this.status = status; }
}
export const emptyFoodState = (): FoodState => ({ version: 1, stock: [], plans: [], shopping: [] });
const round = (n: number) => Math.round(n * 1000) / 1000;
// Deliberately small aliases: preparation and varieties (dry rice/cooked rice,
// red onion/onion) stay separate. Never infer a mass from a count or a photo.
const aliases: Record<string, string> = { eggs: "egg", tomatoes: "tomato", lemons: "lemon", onions: "onion", chickpeas: "chickpea", oats: "oat", berries: "berry" };
export function ingredientName(value: string) {
  const name = value.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
  return Object.hasOwn(aliases, name) ? aliases[name] : name;
}
export function measured(quantity: number, inputUnit: z.infer<typeof unit>): { quantity: number; unit: Unit } {
  return { quantity: round(quantity * (inputUnit === "kg" || inputUnit === "l" ? 1000 : 1)), unit: inputUnit === "kg" ? "g" : inputUnit === "l" ? "ml" : inputUnit };
}
const key = (item: { ingredient: string; unit: Unit }) => JSON.stringify([item.ingredient, item.unit]);
const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
function combine(items: IngredientAmount[]) {
  const combined = new Map<string, IngredientAmount>();
  for (const item of items) {
    const existing = combined.get(key(item));
    combined.set(key(item), { ...item, quantity: round((existing?.quantity ?? 0) + item.quantity) });
  }
  return [...combined.values()];
}
export function foodOverview(state: FoodState) {
  const demand = combine(state.plans.flatMap(plan => plan.ingredients));
  const keys = new Map([...state.stock, ...demand].map(item => [key(item), { ingredient: item.ingredient, unit: item.unit }]));
  const inventory = [...keys.values()].map(item => {
    const lots = state.stock.filter(lot => key(lot) === key(item));
    const onHand = round(lots.reduce((sum, lot) => sum + (lot.quantity ?? 0), 0));
    const required = demand.find(row => key(row) === key(item))?.quantity ?? 0;
    const unknownQuantity = lots.some(lot => lot.quantity === null);
    const otherUnits = state.stock.some(lot => lot.ingredient === item.ingredient && lot.unit !== item.unit && lot.quantity !== 0);
    const shortage = Math.max(0, round(required - onHand));
    const needsCheck = shortage > 0 && (unknownQuantity || otherUnits);
    return { ...item, knownOnHand: onHand, required, reserved: Math.min(onHand, required), available: Math.max(0, round(onHand - required)), unknownQuantity,
      needsCheck, toBuy: needsCheck ? null : shortage };
  });
  return { inventory, toBuy: inventory.filter(item => item.required > item.knownOnHand), manualShopping: state.shopping };
}
function put<T extends { id: string }>(list: T[], item: T) {
  const index = list.findIndex(row => row.id === item.id);
  if (index < 0) list.push(item); else list[index] = item;
}
function remove<T extends { id: string }>(list: T[], target: string) {
  const index = list.findIndex(item => item.id === target);
  if (index < 0) throw new FoodError("This item has changed. Refresh your food space and try again.");
  list.splice(index, 1);
}
function unique(values: string[]) {
  if (new Set(values).size !== values.length) throw new FoodError("Review the repeated items before saving.", 400);
}
function diff<T extends { id: string }>(before: T[], after: T[]): Change<T>[] {
  return [...new Set([...before, ...after].map(item => item.id))].flatMap(id => {
    const oldItem = before.find(item => item.id === id) ?? null;
    const newItem = after.find(item => item.id === id) ?? null;
    return equal(oldItem, newItem) ? [] : [{ id, before: oldItem, after: newItem }];
  });
}
function undoChanges<T extends { id: string; changedBy: string }>(list: T[], changes: Change<T>[], operationId: string) {
  for (const change of changes) {
    if (!equal(list.find(item => item.id === change.id) ?? null, change.after)) throw new FoodError("Something used by this action has changed. Review it before adjusting your stock.");
    if (change.before) put(list, { ...change.before, changedBy: operationId });
    else remove(list, change.id);
  }
}

export function applyFoodCommand(current: FoodState, command: FoodCommand, undoEffect?: FoodEffect) {
  const state = structuredClone(current);
  const { action, operationId } = command;
  let meal: MealRecord | null = null;
  if (action.type === "stock.set") {
    const item = action.item;
    put(state.stock, { ...item, ingredient: ingredientName(item.ingredient), ...measured(item.quantity ?? 0, item.unit), quantity: item.quantity === null ? null : measured(item.quantity, item.unit).quantity, changedBy: operationId });
  } else if (action.type === "stock.remove") remove(state.stock, action.id);
  else if (action.type === "plan.set") {
    put(state.plans, { ...action.plan, ingredients: combine(action.plan.ingredients.map(item => ({ ingredient: ingredientName(item.ingredient), ...measured(item.quantity, item.unit) }))), changedBy: operationId });
  } else if (action.type === "plan.window") {
    unique(action.plans.map(item => item.id));
    const end = new Date(`${action.startDate}T00:00:00Z`);
    end.setUTCDate(end.getUTCDate() + action.days);
    const inWindow = (plan: { date: string }) => plan.date >= action.startDate && new Date(`${plan.date}T00:00:00Z`).valueOf() < end.valueOf();
    if (action.plans.some(item => !inWindow(item))) throw new FoodError("Keep each meal inside the dates you are planning.", 400);
    const outside = state.plans.filter(item => !inWindow(item));
    if (action.plans.some(item => outside.some(other => other.id === item.id))) throw new FoodError("That meal belongs to another planning window. Review it before moving it.");
    state.plans = [...outside, ...action.plans.map(item => ({ ...item, ingredients: combine(item.ingredients.map(ingredient => ({ ingredient: ingredientName(ingredient.ingredient), ...measured(ingredient.quantity, ingredient.unit) }))), changedBy: operationId }))];
  } else if (action.type === "plan.remove") remove(state.plans, action.id);
  else if (action.type === "shopping.set") put(state.shopping, { ...action.item, changedBy: operationId });
  else if (action.type === "shopping.remove") remove(state.shopping, action.id);
  else if (action.type === "purchase") {
    unique(action.items.map(item => item.id));
    unique(action.items.flatMap(item => item.shoppingId ? [item.shoppingId] : []));
    for (const item of action.items) {
      const { shoppingId, ...input } = item;
      const bought = { ...input, ingredient: ingredientName(input.ingredient), ...measured(input.quantity, input.unit), changedBy: operationId };
      const existing = state.stock.find(lot => lot.id === item.id);
      if (existing && (key(existing) !== key(bought) || existing.bestBefore !== bought.bestBefore)) throw new FoodError("Use a separate stock item for a different ingredient, unit or date.");
      if (existing?.quantity === null) throw new FoodError("Check how much you already have, or save this purchase as a separate stock item.");
      put(state.stock, { ...bought, quantity: round((existing?.quantity ?? 0) + bought.quantity) });
      if (shoppingId) {
        const shopping = state.shopping.find(row => row.id === shoppingId);
        if (!shopping || shopping.done) throw new FoodError("That shopping item has changed. Review the purchase before saving.");
        put(state.shopping, { ...shopping, done: true, changedBy: operationId });
      }
    }
  } else if (action.type === "cook") {
    unique(action.consumed.map(item => item.stockId));
    const plan = action.planId ? state.plans.find(item => item.id === action.planId) : undefined;
    if (action.planId && !plan) throw new FoodError("This planned meal has changed. Refresh before cooking.");
    if (plan && action.servings > plan.servings) throw new FoodError("Review the planned servings before cooking more.");
    for (const used of action.consumed) {
      const lot = state.stock.find(item => item.id === used.stockId);
      const quantity = measured(used.quantity, used.unit);
      if (!lot || lot.quantity === null) throw new FoodError("Confirm the amount in your food basket before recording what you used.");
      if (lot.unit !== quantity.unit) throw new FoodError("Use a matching unit for the amount you cooked.", 400);
      if (quantity.quantity > lot.quantity) throw new FoodError("There is less in your recorded food basket than that. Check the amount first.");
      put(state.stock, { ...lot, quantity: round(lot.quantity - quantity.quantity), changedBy: operationId });
    }
    if (plan) {
      const remaining = plan.servings - action.servings;
      if (!remaining) remove(state.plans, plan.id);
      else put(state.plans, { ...plan, servings: remaining, ingredients: plan.ingredients.map(item => ({ ...item, quantity: round(item.quantity * remaining / plan.servings) })), changedBy: operationId });
    }
    if (!action.useReservedStock) {
      const otherDemand = combine(current.plans.filter(item => item.id !== action.planId).flatMap(item => item.ingredients));
      for (const needed of otherDemand) {
        const stockTotal = (source: FoodState) => round(source.stock.filter(item => key(item) === key(needed)).reduce((sum, item) => sum + (item.quantity ?? 0), 0));
        if (stockTotal(state) < Math.min(stockTotal(current), needed.quantity)) throw new FoodError("Some of this food is reserved for another meal. Review that change before using it.");
      }
    }
    if (action.leftovers) {
      if (state.stock.some(item => item.id === action.leftovers!.id)) throw new FoodError("Save leftovers as a new stock item.");
      put(state.stock, { id: action.leftovers.id, ingredient: ingredientName(action.leftovers.title), quantity: action.leftovers.portions, unit: "portion", bestBefore: action.leftovers.bestBefore, changedBy: operationId });
    }
    meal = { id: `food-${operationId}`, data: { title: action.title, date: action.date, meal: action.meal, calories: 0, protein: 0, carbs: 0, fat: 0, nutritionKnown: false } };
  } else if (action.type === "undo") {
    if (!undoEffect || !["purchase", "cook"].includes(undoEffect.type)) throw new FoodError("Only a recorded purchase or cooking action can be undone here.", 400);
    undoChanges(state.stock, undoEffect.stock, operationId);
    undoChanges(state.plans, undoEffect.plans, operationId);
    undoChanges(state.shopping, undoEffect.shopping, operationId);
    meal = undoEffect.meal;
  }
  if (state.stock.length > 400 || state.plans.length > 365 || state.shopping.length > 500) throw new FoodError("Your food space is full. Remove a few older items before adding more.", 413);
  if (state.stock.some(item => item.quantity !== null && item.quantity > 1_000_000_000)) throw new FoodError("That stock amount is too large. Review the quantity.", 400);
  const effect: FoodEffect = { type: action.type, stock: diff(current.stock, state.stock), plans: diff(current.plans, state.plans), shopping: diff(current.shopping, state.shopping), meal };
  return { state, effect };
}
