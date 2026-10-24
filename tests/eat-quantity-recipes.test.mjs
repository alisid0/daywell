import test from "node:test";
import assert from "node:assert/strict";
import { applyFoodCommand, emptyFoodState, foodCommandSchema, foodOverview } from "../lib/food.ts";
import { mealCoverage } from "../lib/food-journey.ts";
import { scaleIngredients, suggestedConsumption } from "../lib/food-planning.ts";
import { readFoodRecovery, writeFoodRecovery } from "../lib/food-recovery.ts";
import { basketForIdeas, basketIdeasDraft, basketIdeasJsonSchema, mealStepsDraft, mealStepsJsonSchema, recipeRequestSchema } from "../lib/recipe-ideas.ts";

let serial = 0;
const run = (state, action) => applyFoodCommand(state, foodCommandSchema.parse({ operationId: `op-${++serial}`, expectedRevision: 0, action })).state;
const stock = (id, ingredient, quantity, unit = "g") => ({ type: "stock.set", item: { id, ingredient, quantity, unit } });
const plan = (ingredients, id = "dinner") => ({ type: "plan.set", plan: { id, title: "Pasta", date: "2026-10-07", meal: "Dinner", servings: 1, ingredients } });

test("an ingredient planned without a quantity is covered by any of it in the basket, in any unit", () => {
  let state = run(emptyFoodState(), plan([{ ingredient: "Olive oil", quantity: null, unit: "ml" }]));
  const [row] = foodOverview(state).toBuy;
  assert.equal(row.ingredient, "olive oil");
  assert.equal(row.unmeasured, true);
  assert.equal(row.needsCheck, false);
  state = run(state, stock("oil", "olive oil", null, "each"));
  assert.equal(foodOverview(state).toBuy.length, 0);
  state = run(state, stock("oil", "olive oil", 0, "each"));
  assert.equal(foodOverview(state).toBuy[0].unmeasured, true, "an empty lot doesn't cover it");
});

test("quantities add up within a meal, and a listing without one never cancels a quantity", () => {
  const withBoth = run(emptyFoodState(), plan([{ ingredient: "Salt", quantity: null, unit: "g" }, { ingredient: "salt", quantity: 5, unit: "g" }]));
  assert.deepEqual(withBoth.plans[0].ingredients, [{ ingredient: "salt", quantity: 5, unit: "g" }]);
  const bothUnmeasured = run(emptyFoodState(), plan([{ ingredient: "Salt", quantity: null, unit: "g" }, { ingredient: "salt", quantity: null, unit: "g" }]));
  assert.deepEqual(bothUnmeasured.plans[0].ingredients, [{ ingredient: "salt", quantity: null, unit: "g" }]);
  assert.deepEqual(scaleIngredients([{ ingredient: "salt", quantity: null, unit: "g" }, { ingredient: "rice", quantity: 75, unit: "g" }], 1, 2).map(item => item.quantity), [null, 150]);
});

test("coverage, suggested use and cooking work with ingredients that have no quantity", () => {
  let state = run(emptyFoodState(), stock("rice", "rice", 500));
  state = run(state, plan([{ ingredient: "rice", quantity: 75, unit: "g" }, { ingredient: "spring onion", quantity: null, unit: "each" }]));
  const [coverage] = mealCoverage(state, [state.plans[0]]);
  assert.equal(coverage.covered, false);
  assert.deepEqual(coverage.missing, [{ ingredient: "spring onion", quantity: null, unit: "each", needsCheck: false }]);
  assert.deepEqual(suggestedConsumption(state.plans[0], state.stock), [{ stockId: "rice", quantity: 75, unit: "g" }]);
  const cooked = applyFoodCommand(state, foodCommandSchema.parse({ operationId: "cook-nothing-counted", expectedRevision: 0,
    action: { type: "cook", planId: "dinner", title: "Pasta", date: "2026-10-07", meal: "Dinner", servings: 1, consumed: [] } }));
  assert.equal(cooked.state.plans.length, 0, "cooking finishes the plan");
  assert.equal(cooked.state.stock[0].quantity, 500, "nothing counted, nothing taken");
  assert.equal(cooked.effect.meal.data.title, "Pasta");
  assert.throws(() => foodCommandSchema.parse({ operationId: "use-nothing", expectedRevision: 0, action: { type: "use", title: "Rice", date: "2026-10-07", meal: "Snack", consumed: [] } }));
});

test("food bought without a quantity becomes a new lot, but can't top up an existing one", () => {
  let state = run(emptyFoodState(), { type: "purchase", items: [{ id: "bread", ingredient: "Sourdough loaf", quantity: null, unit: "each" }] });
  assert.equal(state.stock[0].quantity, null);
  state = run(state, stock("rice", "rice", 500));
  assert.throws(() => run(state, { type: "purchase", items: [{ id: "rice", ingredient: "rice", quantity: null, unit: "g" }] }), /Add how much you bought/);
  assert.throws(() => foodCommandSchema.parse({ operationId: "zero", expectedRevision: 0, action: { type: "purchase", items: [{ id: "x", ingredient: "rice", quantity: 0, unit: "g" }] } }));
});

test("several shopping notes are added at once, without a quantity if none is given", () => {
  let state = run(emptyFoodState(), { type: "shopping.add", items: [
    { id: "soy", title: "Soy sauce", quantity: "10 ml", done: false },
    { id: "cinnamon", title: "Ground cinnamon", quantity: "", done: false },
  ] });
  assert.deepEqual(state.shopping.map(note => [note.title, note.quantity]), [["Soy sauce", "10 ml"], ["Ground cinnamon", ""]]);
  assert.throws(() => run(state, { type: "shopping.add", items: [{ id: "soy", title: "Soy sauce", quantity: "", done: false }] }), /already exists/);
  assert.throws(() => run(state, { type: "shopping.add", items: [{ id: "a", title: "A", quantity: "", done: false }, { id: "a", title: "B", quantity: "", done: false }] }), /repeated/);
});

test("a draft meal with an ingredient without a quantity survives a reload on the device", () => {
  const data = new Map(), scope = "a".repeat(64);
  const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key), key: index => [...data.keys()][index] ?? null, get length() { return data.size; } };
  const draft = { revision: 2, action: plan([{ ingredient: "salt", quantity: null, unit: "g" }]) };
  writeFoodRecovery(storage, scope, { draft, pending: null, view: "meals", start: "2026-10-07", days: 3 });
  assert.equal(readFoodRecovery(storage, scope).draft.action.plan.ingredients[0].quantity, null);
});

test("recipe ideas: Daywell decides what is already in the basket, and odd model values are made safe", () => {
  let state = run(emptyFoodState(), stock("eggs", "Egg", 6, "each"));
  state = run(state, stock("rice", "rice", 0));
  assert.deepEqual(basketForIdeas(state), [{ ingredient: "egg", quantity: 6, unit: "each" }], "empty lots and private fields stay out");
  const idea = steps => ({ title: "Egg fried rice", meal: "Dinner", minutes: 999, ingredients: [
    { ingredient: "Eggs", quantity: 2, unit: "each" }, { ingredient: "rice", quantity: 75.12345, unit: "g" }, { ingredient: "soy sauce", quantity: 0, unit: "ml" }], steps });
  const draft = basketIdeasDraft({ summary: "Ideas", ideas: [idea(Array.from({ length: 10 }, (_, i) => `Step ${i + 1}`)), idea(["One"]), idea(["One"]), idea(["One"])] }, state);
  assert.equal(draft.ideas.length, 3, "at most three ideas");
  const [first] = draft.ideas;
  assert.equal(first.minutes, 240);
  assert.equal(first.steps.length, 8);
  assert.deepEqual(first.ingredients.map(item => [item.ingredient, item.quantity, item.have]), [["Eggs", 2, true], ["rice", 75.123, false], ["soy sauce", null, false]]);
  assert.throws(() => basketIdeasDraft({ summary: "", ideas: [idea([])] }, state), "an idea needs at least one step");
});

test("recipe steps: extras already in the meal are dropped, and requests are strict", () => {
  const steps = mealStepsDraft({ summary: "Steps", title: "Tomato noodles", steps: ["Cook."], extras: ["Olive oil", "Tomatoes", "olive oil", "Garlic"] }, ["egg noodles", "tomato"]);
  assert.deepEqual(steps.extras, ["olive oil", "garlic"]);
  assert.deepEqual(recipeRequestSchema.parse({ kind: "basket" }), { kind: "basket", wish: "", avoid: [] });
  assert.throws(() => recipeRequestSchema.parse({ kind: "meal", servings: 1, ingredients: [] }));
  assert.throws(() => recipeRequestSchema.parse({ kind: "basket", userId: "someone-else" }));
  for (const schema of [basketIdeasJsonSchema, mealStepsJsonSchema]) assert.deepEqual(Object.keys(schema.properties).sort(), [...schema.required].sort(), "strict JSON schemas list every field as required");
});
