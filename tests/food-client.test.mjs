import test from "node:test";
import assert from "node:assert/strict";
import { prepareFoodCommand, readFoodSnapshot, sendFoodCommand } from "../lib/food-client.ts";
import { emptyFoodState, foodCommandSchema } from "../lib/food.ts";
import { scaleIngredients, starterAmounts, suggestedConsumption, windowEnd } from "../lib/food-planning.ts";

const purchase = { revision: 4, action: { type: "purchase", items: [{ id: "new-pack", ingredient: "dry rice", quantity: 500, unit: "g" }] } };
test("a lost purchase response retries the identical command and receipt ID", async () => {
  const command = prepareFoodCommand(purchase, "same-save");
  const requests = [];
  const request = async (_url, options) => {
    requests.push(options.body);
    if (requests.length === 1) throw new TypeError("Connection lost after commit");
    return Response.json({ ok: true, revision: 5, replayed: true });
  };
  assert.equal((await sendFoodCommand(command, request)).kind, "uncertain");
  assert.equal((await sendFoodCommand(command, request)).kind, "saved");
  assert.equal(requests[0], requests[1]);
  assert.equal(JSON.parse(requests[1]).operationId, "same-save");
  assert.equal(JSON.parse(requests[1]).expectedRevision, 4);
});
test("conflicts are surfaced once without rebasing or resubmitting a draft", async () => {
  const before = structuredClone(purchase);
  let calls = 0;
  const result = await sendFoodCommand(prepareFoodCommand(purchase, "conflicting-save"), async () => {
    calls++; return Response.json({ error: "Changed on another screen" }, { status: 409 });
  });
  assert.equal(result.kind, "conflict"); assert.equal(calls, 1); assert.deepEqual(purchase, before);
});
test("unconfirmed successes and storage failures keep a retryable operation", async () => {
  for (const response of [Response.json({ ok: true }), new Response("bad gateway", { status: 502 }), Response.json({ error: "Unavailable" }, { status: 503 })]) {
    assert.equal((await sendFoodCommand(prepareFoodCommand(purchase, "uncertain-save"), async () => response)).kind, "uncertain");
  }
  for (const status of [400, 401, 403, 413]) {
    assert.equal((await sendFoodCommand(prepareFoodCommand(purchase, "rejected-save"), async () => Response.json({ error: "Check details" }, { status }))).kind, "rejected");
  }
});
test("snapshot reader rejects invalid data and derives shortage from confirmed state", async () => {
  await assert.rejects(readFoodSnapshot(async () => Response.json({ revision: 5, state: {} })), /couldn’t load/);
  await assert.rejects(readFoodSnapshot(async () => Response.json({ error: "Sign in" }, { status: 401 })), /Sign in/);
  const state = emptyFoodState();
  state.stock.push({ id: "rice", ingredient: "dry rice", quantity: null, unit: "g", bestBefore: null, changedBy: "stock-save" });
  state.plans.push({ id: "meal", title: "Rice bowl", date: "2026-10-07", meal: "Dinner", servings: 1, ingredients: [{ ingredient: "dry rice", quantity: 100, unit: "g" }], changedBy: "meal-save" });
  const snapshot = await readFoodSnapshot(async () => Response.json({ revision: 2, state, overview: { toBuy: [] }, recentActions: [] }));
  assert.equal(snapshot.overview.toBuy[0].needsCheck, true);
  assert.equal(snapshot.overview.toBuy[0].toBuy, null);
});
test("cooking suggestions split matching lots by reminder date and never invent amounts or convert count to weight", () => {
  const lot = (id, quantity, unit = "g", bestBefore = null) => ({ id, ingredient: "dry rice", quantity, unit, bestBefore, changedBy: "fixture" });
  const plan = { ingredients: [{ ingredient: "dry rice", quantity: 300, unit: "g" }] };
  const stock = [lot("later", 200, "g", "2026-11-01"), lot("unknown", null), lot("count", 9, "each"), lot("first", 150, "g", "2026-10-08")];
  assert.deepEqual(suggestedConsumption(plan, stock), [{ stockId: "first", quantity: 150, unit: "g" }, { stockId: "later", quantity: 150, unit: "g" }]);
  assert.equal(stock[3].quantity, 150);
  assert.deepEqual(suggestedConsumption({ ingredients: [{ ingredient: "cooked rice", quantity: 300, unit: "g" }] }, stock), []);
});
test("starter meals produce valid editable commands for multiple servings", () => {
  for (const [id, ingredients] of Object.entries(starterAmounts)) {
    const original = structuredClone(ingredients);
    for (const servings of [1, 2, 3, 7, 24]) {
      assert.equal(foodCommandSchema.safeParse({ operationId: "plan-save", expectedRevision: 0, action: { type: "plan.set", plan: { id, title: id, date: "2026-10-07", meal: "Dinner", servings, ingredients: scaleIngredients(ingredients, 1, servings) } } }).success, true);
    }
    assert.deepEqual(ingredients, original);
  }
  assert.equal(windowEnd("2026-12-30", 3), "2027-01-02");
  assert.equal(windowEnd("2028-02-28", 2), "2028-03-01");
});
