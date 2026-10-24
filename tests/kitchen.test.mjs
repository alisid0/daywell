import test from "node:test";
import assert from "node:assert/strict";
import { applyFoodCommand, emptyFoodState, foodCommandSchema, foodStateSchema } from "../lib/food.ts";
import { placeOf, suggestedPlace, usualPlace } from "../lib/food-places.ts";
import { readFoodRecovery, writeFoodRecovery } from "../lib/food-recovery.ts";

let serial = 0;
const command = action => foodCommandSchema.parse({ operationId: `kitchen-${++serial}`, expectedRevision: 0, action });
const run = (state, action) => applyFoodCommand(state, command(action)).state;
const milk = (id, extra = {}) => ({ id, ingredient: "Milk", quantity: 1000, unit: "ml", ...extra });

test("food goes on the shelf where its kind usually lives, and the person's choice wins", () => {
  assert.deepEqual(["milk", "spinach", "basil", "apples", "onion", "rice", "bread", "chicken breast", "ice cream", "frozen peas", "frozen berries"].map(food => usualPlace(food)),
    ["fridge", "fridge", "fridge", "fruit", "fruit", "cupboard", "cupboard", "fridge", "freezer", "freezer", "freezer"]);
  assert.equal(placeOf({ ingredient: "milk", unit: "ml" }), "fridge", "no saved place: where milk usually lives");
  assert.equal(placeOf({ ingredient: "milk", unit: "ml", place: "cupboard" }), "cupboard");
  assert.equal(suggestedPlace("Milk", "ml", [{ ingredient: "milk", place: "freezer" }, { ingredient: "rice", place: "fridge" }]), "freezer", "the next pack follows the last one");
  assert.equal(suggestedPlace("Rice", "g", [{ ingredient: "milk", place: "freezer" }]), "cupboard");
});

test("a food's shelf is saved, kept when it's topped up, and followed by the next pack", () => {
  let state = run(emptyFoodState(), { type: "stock.set", item: milk("milk-1", { place: "freezer" }) });
  assert.equal(state.stock[0].place, "freezer");
  state = run(state, { type: "purchase", items: [milk("milk-1", { quantity: 500 })] });
  assert.deepEqual([state.stock[0].quantity, state.stock[0].place], [1500, "freezer"], "topping up keeps the shelf");
  state = run(state, { type: "purchase", items: [milk("milk-2")] });
  state = run(state, { type: "stock.add", items: [milk("milk-3"), milk("milk-4", { place: "fridge" }), { id: "rice", ingredient: "rice", quantity: null, unit: "g" }] });
  assert.deepEqual(state.stock.map(lot => [lot.id, lot.place]), [["milk-1", "freezer"], ["milk-2", "freezer"], ["milk-3", "freezer"], ["milk-4", "fridge"], ["rice", undefined]]);
  assert.equal(placeOf(state.stock.find(lot => lot.id === "rice")), "cupboard");
  assert.deepEqual(foodStateSchema.parse(JSON.parse(JSON.stringify(state))).stock.map(lot => lot.place), ["freezer", "freezer", "freezer", "fridge", undefined], "the shelf survives saving");
  assert.throws(() => command({ type: "stock.set", item: milk("milk-5", { place: "garage" }) }));
});

test("taking food out of the kitchen can be undone, back onto the same shelf", () => {
  const state = run(emptyFoodState(), { type: "stock.set", item: milk("milk-1", { place: "freezer", bestBefore: "2026-10-21" }) });
  const removal = command({ type: "stock.remove", id: "milk-1" });
  const removed = applyFoodCommand(state, removal);
  assert.equal(removed.state.stock.length, 0);
  const undone = applyFoodCommand(removed.state, command({ type: "undo", operationId: removal.operationId }), removed.effect);
  assert.deepEqual(undone.state.stock.map(({ id, ingredient, quantity, place, bestBefore }) => ({ id, ingredient, quantity, place, bestBefore })),
    [{ id: "milk-1", ingredient: "milk", quantity: 1000, place: "freezer", bestBefore: "2026-10-21" }]);
  assert.equal(undone.effect.meal, null, "nothing goes on the plate");
});

test("Eat opens on the Plate, and an unfinished change with a shelf survives a reload", () => {
  const data = new Map(), scope = "b".repeat(64);
  const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key), key: index => [...data.keys()][index] ?? null, get length() { return data.size; } };
  writeFoodRecovery(storage, scope, { draft: { revision: 3, action: { type: "stock.set", item: milk("milk-1", { place: "fruit", bestBefore: null }) } }, pending: null, view: "plate", start: "2026-10-19", days: 3 });
  const back = readFoodRecovery(storage, scope);
  assert.equal(back.view, "plate");
  assert.equal(back.draft.action.item.place, "fruit");
  writeFoodRecovery(storage, scope, { draft: back.draft, pending: null, view: "history", start: "2026-10-19", days: 3 });
  assert.equal(readFoodRecovery(storage, scope).view, "history", "the meal story view from before still reads");
});
