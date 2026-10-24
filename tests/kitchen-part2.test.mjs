import test from "node:test";
import assert from "node:assert/strict";
import { applyFoodCommand, emptyFoodState, foodCommandSchema, foodOverview, foodStateSchema } from "../lib/food.ts";
import { suggestedPlace } from "../lib/food-places.ts";
import { clearOtherFoodRecovery, readTrolley, writeTrolley } from "../lib/food-recovery.ts";
import { amountWords, newFromShop, parseAmount, topUpLot, trolleyItems } from "../lib/food-trolley.ts";
import { dayWords, emptyRun, plansFor, weekDates } from "../lib/food-week.ts";

let serial = 0;
const command = action => foodCommandSchema.parse({ operationId: `part2-${++serial}`, expectedRevision: 0, action });
const run = (state, action) => applyFoodCommand(state, command(action)).state;
const plan = (id, title, date, meal, ingredients) => ({ type: "plan.set", plan: { id, title, date, meal, servings: 1, ingredients } });
const note = (id, title, quantity = "") => ({ id, title, quantity, done: false });
const memory = () => { const data = new Map(); return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key), key: index => [...data.keys()][index] ?? null, get length() { return data.size; } }; };

function shop() {
  let state = run(emptyFoodState(), { type: "stock.set", item: { id: "rice", ingredient: "rice", quantity: 500, unit: "g", bestBefore: null, place: "cupboard" } });
  state = run(state, { type: "shopping.add", items: [note("bread", "Sourdough loaf"), note("soap", "Washing-up liquid")] });
  return run(state, plan("tea", "Tomato rice", "2026-10-08", "Lunch", [{ ingredient: "onion", quantity: 1, unit: "each" }, { ingredient: "rice", quantity: 300, unit: "g" }]));
}

test("putting the shopping away: shelves, a top-up, household notes ticked off, and one Undo for all of it", () => {
  const state = shop();
  const purchase = command({ type: "purchase", items: [
    { id: "onion-1", ingredient: "Onion", quantity: 1, unit: "each", bestBefore: null, place: "fruit" },
    { id: "rice", ingredient: "rice", quantity: 0.5, unit: "kg", bestBefore: null, place: "cupboard" },
    { id: "bread-1", ingredient: "Sourdough loaf", quantity: null, unit: "each", bestBefore: null, place: "cupboard", shoppingId: "bread" },
  ], tickOff: ["soap"] });
  const done = applyFoodCommand(state, purchase);
  assert.deepEqual(done.state.stock.map(lot => [lot.id, lot.quantity, lot.place]), [["rice", 1000, "cupboard"], ["onion-1", 1, "fruit"], ["bread-1", null, "cupboard"]]);
  assert.deepEqual(done.state.shopping.map(row => [row.id, row.done]), [["bread", true], ["soap", true]]);
  assert.equal(foodOverview(done.state).toBuy.length, 0, "the planned meal is covered now");
  const undone = applyFoodCommand(done.state, command({ type: "undo", operationId: purchase.operationId }), done.effect);
  assert.deepEqual(undone.state.stock.map(lot => [lot.id, lot.quantity]), [["rice", 500]]);
  assert.deepEqual(undone.state.shopping.map(row => row.done), [false, false]);
});

test("a purchase needs something in it, and each note is ticked off once", () => {
  const state = shop();
  assert.throws(() => run(state, { type: "purchase", items: [] }), /Choose something to put away/);
  assert.throws(() => run(state, { type: "purchase", items: [], tickOff: ["soap", "soap"] }), /repeated/);
  assert.throws(() => run(state, { type: "purchase", items: [{ id: "b", ingredient: "bread", quantity: null, unit: "each", bestBefore: null, shoppingId: "bread" }], tickOff: ["bread"] }), /repeated/);
  const ticked = run(state, { type: "purchase", items: [], tickOff: ["soap"] });
  assert.equal(ticked.stock.length, 1, "household things never go on a shelf");
  assert.throws(() => run(ticked, { type: "purchase", items: [], tickOff: ["soap"] }), /has changed/);
});

test("where food goes is remembered, even after the last one is used up", () => {
  let state = run(emptyFoodState(), { type: "stock.set", item: { id: "milk-1", ingredient: "Milk", quantity: 1000, unit: "ml", bestBefore: null, place: "freezer" } });
  state = run(state, { type: "stock.remove", id: "milk-1" });
  assert.deepEqual(state.places, { milk: "freezer" });
  assert.equal(suggestedPlace("Milk", "ml", state.stock, state.places), "freezer");
  state = run(state, { type: "purchase", items: [{ id: "milk-2", ingredient: "milk", quantity: 500, unit: "ml", bestBefore: null }] });
  assert.equal(state.stock[0].place, "freezer", "a pack bought without a shelf goes where milk went last");
  assert.deepEqual(foodStateSchema.parse(JSON.parse(JSON.stringify(state))).places, { milk: "freezer" }, "the memory is saved with the food");
  assert.equal(suggestedPlace("rice", "g", [], undefined), "cupboard");
});

test("meal plans can be undone: a new one comes off the week, a removed one comes back", () => {
  const add = command(plan("dinner", "Pasta", "2026-10-09", "Dinner", [{ ingredient: "pasta", quantity: null, unit: "g" }]));
  const added = applyFoodCommand(emptyFoodState(), add);
  assert.equal(applyFoodCommand(added.state, command({ type: "undo", operationId: add.operationId }), added.effect).state.plans.length, 0);
  const removal = command({ type: "plan.remove", id: "dinner" });
  const removed = applyFoodCommand(added.state, removal);
  assert.deepEqual(applyFoodCommand(removed.state, command({ type: "undo", operationId: removal.operationId }), removed.effect).state.plans.map(item => item.title), ["Pasta"]);
});

test("the trolley list: what planned meals need, and notes, with household things spotted", () => {
  let state = shop();
  state = run(state, { type: "shopping.add", items: [note("tins", "Chopped tomatoes", "2 items"), note("cheese", "Cheddar", "a big one")] });
  const items = trolleyItems(state, foodOverview(state));
  assert.deepEqual(items.map(item => [item.key, item.quantity, item.unit, item.household]), [
    ["need:onion|each", 1, "each", false],
    ["note:bread", null, "each", false], ["note:soap", null, "g", true], ["note:tins", 2, "each", false], ["note:cheese", null, "g", false]]);
  assert.deepEqual(items[0].forMeals, ["Tomato rice"]);
  assert.equal(items[4].noteQuantity, "a big one", "a quantity that isn't a number is kept as the person wrote it");
});

test("amounts people type are understood, or flagged", () => {
  assert.deepEqual(parseAmount("", "g"), { quantity: null, unit: "g" });
  assert.deepEqual(parseAmount("2", "each"), { quantity: 2, unit: "each" });
  assert.deepEqual(parseAmount(" 150ml ", "g"), { quantity: 150, unit: "ml" });
  assert.deepEqual(parseAmount("1,5 kg", "g"), { quantity: 1.5, unit: "kg" });
  assert.deepEqual(parseAmount("3 portions", "g"), { quantity: 3, unit: "portion" });
  for (const text of ["lots", "0", "-2", "2 cups", "1.2345 kg", "2 2"]) assert.equal(parseAmount(text, "g"), null, text);
  assert.deepEqual([amountWords(500, "g"), amountWords(2, "each"), amountWords(1, "portion"), amountWords(null, "g")], ["500 g", "2", "1 portion", ""]);
});

test("only a counted, undated pack of the same food tops up what's on the shelf", () => {
  const stock = [
    { id: "rice", ingredient: "rice", quantity: 500, unit: "g", bestBefore: null, changedBy: "a" },
    { id: "milk", ingredient: "milk", quantity: 1000, unit: "ml", bestBefore: "2026-10-09", changedBy: "a" },
    { id: "salt", ingredient: "salt", quantity: null, unit: "g", bestBefore: null, changedBy: "a" },
  ];
  assert.equal(topUpLot(stock, "Rice", 1, "kg", new Set())?.id, "rice");
  assert.equal(topUpLot(stock, "rice", 1, "kg", new Set(["rice"])), undefined, "each lot is topped up once");
  assert.equal(topUpLot(stock, "milk", 500, "ml", new Set()), undefined, "dated packs stay separate");
  assert.equal(topUpLot(stock, "salt", 100, "g", new Set()), undefined, "an uncounted lot can't be added to");
  assert.equal(topUpLot(stock, "rice", null, "g", new Set()), undefined);
});

test("the tray stays on this device for this person, and others' trays are cleared", () => {
  const storage = memory(), mine = "a".repeat(64), theirs = "b".repeat(64);
  writeTrolley(storage, mine, ["need:onion|each", "note:bread"]);
  writeTrolley(storage, theirs, ["note:soap"]);
  assert.deepEqual(readTrolley(storage, mine), ["need:onion|each", "note:bread"]);
  clearOtherFoodRecovery(storage, mine);
  assert.deepEqual([readTrolley(storage, mine).length, readTrolley(storage, theirs).length], [2, 0]);
  writeTrolley(storage, mine, []);
  assert.equal(storage.length, 0, "an empty tray leaves nothing behind");
  storage.setItem(`daywell-food-trolley-v1-${mine}`, "{broken");
  assert.deepEqual(readTrolley(storage, mine), []);
});

test("the week: seven days from today, meals by slot, and the first run of empty dinners", () => {
  assert.deepEqual(weekDates("2026-10-28", 7), ["2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02", "2026-11-03"]);
  let state = run(emptyFoodState(), plan("a", "Omelette", "2026-10-28", "Dinner", [{ ingredient: "egg", quantity: 2, unit: "each" }]));
  state = run(state, plan("b", "Soup", "2026-10-30", "Dinner", [{ ingredient: "soup", quantity: 1, unit: "portion" }]));
  const dates = weekDates("2026-10-28");
  assert.equal(plansFor(state.plans, "2026-10-28", "Dinner")[0].title, "Omelette");
  assert.equal(plansFor(state.plans, "2026-10-28", "Lunch").length, 0);
  assert.deepEqual(emptyRun(state.plans, dates, "Dinner"), { start: "2026-10-29", count: 1 }, "it stops before a day that has a dinner");
  assert.deepEqual(emptyRun(state.plans, dates, "Lunch"), { start: "2026-10-28", count: 7 });
  assert.deepEqual([dayWords("2026-10-28", "2026-10-28").relative, dayWords("2026-10-29", "2026-10-28").relative, dayWords("2026-10-30", "2026-10-28").weekday], ["Today", "Tomorrow", "Friday"]);
});

test("New badges: food from the latest shop, for 12 hours, unless it was undone", () => {
  const state = { ...emptyFoodState(), stock: [{ id: "onion", ingredient: "onion", quantity: 1, unit: "each", bestBefore: null, changedBy: "shop-2" }, { id: "rice", ingredient: "rice", quantity: 500, unit: "g", bestBefore: null, changedBy: "shop-1" }] };
  const now = Date.parse("2026-10-20T18:00:00Z");
  const recent = (undone = false, at = "2026-10-20T12:00:00Z") => [{ operationId: "shop-2", type: "purchase", createdAt: at, undone }, { operationId: "shop-1", type: "purchase", createdAt: "2026-10-19T12:00:00Z", undone: false }];
  assert.deepEqual([...newFromShop(state, recent(), now)], ["onion"]);
  assert.equal(newFromShop(state, recent(true), now).size, 0);
  assert.equal(newFromShop(state, recent(false, "2026-10-20T05:00:00Z"), now).size, 0);
  assert.equal(newFromShop(state, [{ operationId: "x", type: "stock.set", createdAt: "2026-10-20T17:00:00Z", undone: false }, ...recent()], now).size, 1, "only purchases count");
});
