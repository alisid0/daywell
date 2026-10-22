import test from "node:test";
import assert from "node:assert/strict";
import { applyFoodCommand, emptyFoodState, foodCommandSchema } from "../lib/food.ts";
import { cookConsumption, plateFor, plateSuggestions, scaled, stepIngredients, stepMinutes } from "../lib/food-cook.ts";
import { usualPlace } from "../lib/food-places.ts";

let serial = 0;
const command = action => foodCommandSchema.parse({ operationId: `part3-${++serial}`, expectedRevision: 0, action });
const run = (state, action) => applyFoodCommand(state, command(action)).state;
const lot = (id, ingredient, quantity, unit, bestBefore = null) => ({ type: "stock.set", item: { id, ingredient, quantity, unit, bestBefore } });
const food = (id, title, date, meal, foodStatus = "eaten") => ({ id, kind: "food", data: { title, date, meal, calories: 0, protein: 0, carbs: 0, fat: 0, nutritionKnown: false, foodStatus } });
const today = "2026-10-07", dayName = date => ({ "2026-10-08": "Tomorrow", "2026-10-05": "Monday" })[date] ?? date;

function kitchen() {
  let state = run(emptyFoodState(), lot("chilli", "vegetable chilli", 2, "portion", "2026-10-08"));
  state = run(state, lot("spinach", "spinach", 200, "g", "2026-10-08"));
  state = run(state, lot("noodles", "egg noodles", 300, "g"));
  state = run(state, lot("rice", "rice", 500, "g"));
  return run(state, { type: "plan.set", plan: { id: "rice-plan", title: "Tomato rice", date: "2026-10-08", meal: "Lunch", servings: 2, ingredients: [{ ingredient: "rice", quantity: 300, unit: "g" }] } });
}

test("today's plate shows what was eaten, and what's planned, for each meal", () => {
  const state = run(kitchen(), { type: "plan.set", plan: { id: "dinner", title: "Spinach omelette", date: today, meal: "Dinner", servings: 1, ingredients: [{ ingredient: "egg", quantity: 2, unit: "each" }] } });
  const plate = plateFor([food("a", "Berry oats", today, "Breakfast"), food("b", "Stock", today, "Lunch", "prepared"), food("c", "Toast", "2026-10-06", "Breakfast")], state.plans, today);
  assert.deepEqual(plate.Breakfast.noted, ["Berry oats"], "only today's, and only what was eaten");
  assert.deepEqual(plate.Lunch.noted, []);
  assert.deepEqual(plate.Dinner.planned.map(plan => plan.title), ["Spinach omelette"]);
  assert.deepEqual(plate.Snack, { noted: [], planned: [] });
});

test("quick picks for a meal: planned, leftovers, use-soon food, then what you had before — four at most, never twice", () => {
  const entries = [food("x", "Chickpea bowl", "2026-10-05", "Lunch"), food("y", "Chickpea bowl", "2026-10-04", "Lunch"), food("z", "Berry oats", "2026-10-06", "Breakfast")];
  const picks = plateSuggestions("Lunch", kitchen(), entries, today, dayName);
  assert.deepEqual(picks.map(item => [item.kind, item.title, item.note]), [
    ["planned", "Tomato rice", "Planned for tomorrow"],
    ["leftover", "vegetable chilli", "Use soon"],
    ["kitchen", "spinach", "Use soon"],
    ["again", "Chickpea bowl", "You had it Monday"],
  ]);
  assert.equal(plateSuggestions("Breakfast", kitchen(), entries, today, dayName).filter(item => item.kind === "again").length, 1);
});

test("a leftover portion eaten from the plate leaves the rest on the shelf, and a recipe scales to its servings", () => {
  const state = run(kitchen(), { type: "use", title: "Vegetable chilli", date: today, meal: "Lunch", consumed: [{ stockId: "chilli", quantity: 1, unit: "portion" }], useReservedStock: false, intake: { portions: 1 } });
  assert.equal(state.stock.find(item => item.id === "chilli").quantity, 1);
  assert.deepEqual(scaled([{ ingredient: "rice", quantity: 75, unit: "g" }, { ingredient: "salt", quantity: null, unit: "g" }], 1, 3).map(item => item.quantity), [225, null]);
  assert.deepEqual(scaled([{ ingredient: "rice", quantity: 300, unit: "g" }], 2, 1)[0].quantity, 150);
});

test("cooking takes what the recipe uses from the kitchen, in the kitchen's units", () => {
  const state = kitchen();
  assert.deepEqual(cookConsumption([{ ingredient: "Rice", quantity: 0.1, unit: "kg" }, { ingredient: "spinach", quantity: 60, unit: "g" }, { ingredient: "soy sauce", quantity: 10, unit: "ml" }, { ingredient: "salt", quantity: null, unit: "g" }], state.stock),
    [{ stockId: "rice", quantity: 100, unit: "g" }, { stockId: "spinach", quantity: 60, unit: "g" }]);
});

test("cooking an idea puts it on today's plate, keeps leftovers in the fridge, and Undo puts it all back", () => {
  const before = kitchen();
  const cook = command({ type: "cook", title: "Spinach fried rice", date: today, meal: "Dinner", servings: 2, consumed: cookConsumption([{ ingredient: "rice", quantity: 150, unit: "g" }, { ingredient: "spinach", quantity: 120, unit: "g" }], before.stock),
    useReservedStock: true, intake: { portions: 1 }, leftovers: { id: "left", title: "Spinach fried rice", portions: 1, bestBefore: null } });
  const done = applyFoodCommand(before, cook);
  const left = done.state.stock.find(item => item.id === "left");
  assert.deepEqual([left.quantity, left.unit, usualPlace(left.ingredient, left.unit)], [1, "portion", "fridge"]);
  assert.equal(done.state.stock.find(item => item.id === "rice").quantity, 350);
  assert.equal(done.effect.meal.data.foodStatus, "eaten");
  const undone = applyFoodCommand(done.state, command({ type: "undo", operationId: cook.operationId }), done.effect);
  assert.deepEqual(undone.state.stock.map(item => [item.id, item.quantity]), before.stock.map(item => [item.id, item.quantity]));
});

test("leftovers and ready meals are kept cold, whatever they're made of", () => {
  assert.deepEqual([usualPlace("pasta bake", "portion"), usualPlace("pasta", "g"), usualPlace("frozen lasagne", "portion"), usualPlace("vegetable chilli", "portion")], ["fridge", "cupboard", "freezer", "fridge"]);
});

test("a step that says how long offers a timer, and finds the ingredients it mentions", () => {
  assert.equal(stepMinutes("Simmer for 10 minutes, stirring."), 10);
  assert.equal(stepMinutes("Bake for 8–10 mins until golden."), 10, "a range uses the longer time");
  assert.equal(stepMinutes("Cook the rice following the pack instructions."), null);
  assert.equal(stepMinutes("Rest for 600 minutes."), null);
  const items = [{ ingredient: "vegetable oil", quantity: 5, unit: "ml" }, { ingredient: "egg", quantity: 2, unit: "each" }, { ingredient: "rice", quantity: 75, unit: "g" }, { ingredient: "soy sauce", quantity: 10, unit: "ml" }];
  assert.deepEqual(stepIngredients("Heat the oil in a large pan and scramble the eggs until fully set.", items).map(item => item.ingredient), ["vegetable oil", "egg"]);
  assert.deepEqual(stepIngredients("Stir through the soy sauce.", items).map(item => item.ingredient), ["soy sauce"]);
  assert.deepEqual(stepIngredients("Serve straight away.", items), []);
});
