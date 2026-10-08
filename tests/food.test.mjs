import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { applyFoodCommand, emptyFoodState, foodCommandSchema, foodOverview } from "../lib/food.ts";
import { getFoodSpace, saveFoodCommand } from "../db/food-store.ts";
import { foodResponse } from "../lib/food-http.ts";

// Run the actual production SQL against SQLite with D1's transactional batch
// contract, rather than mocking a success response for every statement.
function database(t) {
  const sqlite = new DatabaseSync(":memory:");
  t.after(() => sqlite.close());
  for (const file of readdirSync(new URL("../drizzle/", import.meta.url)).filter(name => name.endsWith(".sql")).sort()) {
    sqlite.exec(readFileSync(new URL(`../drizzle/${file}`, import.meta.url), "utf8").replaceAll("--> statement-breakpoint", ""));
  }
  const prepared = (sql, values = []) => ({
    sql, values,
    bind: (...params) => prepared(sql, params),
    first: async () => sqlite.prepare(sql).get(...values) ?? null,
    all: async () => ({ results: sqlite.prepare(sql).all(...values), success: true }),
  });
  const db = {
    prepare: prepared,
    batch: async statements => {
      sqlite.exec("BEGIN");
      try {
        const result = statements.map(({ sql, values }) => {
          const result = sqlite.prepare(sql).run(...values);
          return { success: true, results: [], meta: { changes: Number(result.changes) } };
        });
        sqlite.exec("COMMIT");
        return result;
      } catch (error) { sqlite.exec("ROLLBACK"); throw error; }
    },
  };
  let serial = 0;
  const save = async (action, user = "ali") => {
    const { revision } = await getFoodSpace(db, user);
    return saveFoodCommand(db, user, { operationId: `op-${++serial}`, expectedRevision: revision, action });
  };
  return { db, sqlite, save };
}
const stock = (id, ingredient, quantity, unit = "g") => ({ type: "stock.set", item: { id, ingredient, quantity, unit } });
const plan = (id = "dinner", quantity = 300, servings = 2) => ({ type: "plan.set", plan: {
  id, title: "Rice bowl", date: "2026-10-07", meal: "Dinner", servings, ingredients: [{ ingredient: "Rice", quantity, unit: "g" }],
} });
const cooking = extra => ({ type: "cook", title: "Rice bowl", date: "2026-10-07", meal: "Dinner", servings: 2,
  consumed: [{ stockId: "rice", quantity: 300, unit: "g" }], ...extra });
const command = (action, operationId = "test") => foodCommandSchema.parse({ operationId, expectedRevision: 0, action });

test("a cooking receipt from before nutrition tracking still replays after upgrading", async t => {
  const {db,sqlite,save}=database(t);
  await save(stock("rice","Rice",500)); await save(plan());
  // Exact JSON shape produced by the former schema, including its defaults.
  const old={operationId:"old-cook",expectedRevision:2,action:{type:"cook",planId:"dinner",title:"Rice bowl",date:"2026-10-07",meal:"Dinner",servings:2,consumed:[{stockId:"rice",quantity:300,unit:"g"}],useReservedStock:false,leftovers:{id:"saved",title:"Rice bowl",portions:1,bestBefore:null}}};
  await saveFoodCommand(db,"ali",old);
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify(old)));
  const oldHash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
  sqlite.prepare("UPDATE food_operations SET request_hash=? WHERE operation_id='old-cook'").run(oldHash);
  assert.equal((await saveFoodCommand(db,"ali",old)).replayed,true);
  assert.equal((await getFoodSpace(db,"ali")).revision,3);
});

test("using basket food saves only personal intake, retries once and undoes stock and meal together", async t => {
  const { db, sqlite, save } = database(t);
  await save(stock("apples", "Apple", 4, "each"));
  const input = { operationId:"snack", expectedRevision:1, action:{ type:"use", title:"Apple", date:"2026-10-08", meal:"Snack", consumed:[{stockId:"apples",quantity:1,unit:"each"}], intake:{portions:1,calories:80,source:"estimate",sugarGrams:15.2} } };
  await saveFoodCommand(db,"ali",input);
  assert.equal((await saveFoodCommand(db,"ali",input)).replayed,true);
  assert.equal((await getFoodSpace(db,"ali")).state.stock[0].quantity,3);
  const row = JSON.parse(sqlite.prepare("SELECT data FROM entries WHERE id='food-snack'").get().data);
  assert.equal(row.sugarGrams,15.2); assert.equal(row.calories,80); assert.equal(row.portions,1); assert.equal(row.foodStatus,"eaten"); assert.equal(row.macrosKnown,false);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM entries").get().n,1);
  await save({type:"undo",operationId:"snack"});
  assert.equal((await getFoodSpace(db,"ali")).state.stock[0].quantity,4);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM entries").get().n,0);
});
test("prepared meals are not intake; cooking can separately save a personal portion and leftovers", () => {
  const state=applyFoodCommand(emptyFoodState(),command(stock("rice","Rice",1000))).state;
  const prepared=applyFoodCommand(state,command(cooking({}))).effect.meal.data;
  assert.equal(prepared.foodStatus,"prepared"); assert.equal(prepared.nutritionKnown,false);
  const cooked=applyFoodCommand(state,command(cooking({servings:4,intake:{portions:1,calories:400,sugarGrams:2.5},leftovers:{id:"leftovers",title:"Rice bowl",portions:2}})));
  assert.equal(cooked.effect.meal.data.sugarGrams,2.5); assert.equal(cooked.effect.meal.data.calories,400); assert.equal(cooked.effect.meal.data.portions,1);
  assert.equal(cooked.state.stock.find(x=>x.id==="leftovers").quantity,2);
  assert.throws(()=>applyFoodCommand(state,command(cooking({servings:2,intake:{portions:1},leftovers:{id:"leftovers",title:"Rice",portions:2}}))),/cannot exceed/);
  assert.throws(()=>applyFoodCommand(state,command(cooking({servings:1,leftovers:{id:"leftovers",title:"Rice",portions:2}}))),/cannot exceed/);
  assert.equal(state.stock[0].quantity,1000);
});
test("basket use preserves other plans, rejects overspending and records used-only without intake", () => {
  let state=applyFoodCommand(emptyFoodState(),command(stock("rice","Rice",500))).state;
  state=applyFoodCommand(state,command(plan())).state;
  const used={type:"use",title:"Rice used",date:"2026-10-08",meal:"Dinner",consumed:[{stockId:"rice",quantity:250,unit:"g"}]};
  assert.throws(()=>applyFoodCommand(state,command(used)),/reserved/);
  assert.throws(()=>applyFoodCommand(state,command({...used,consumed:[{stockId:"rice",quantity:501,unit:"g"}],useReservedStock:true})),/less in/);
  const result=applyFoodCommand(state,command({...used,useReservedStock:true}));
  assert.equal(result.effect.meal.data.foodStatus,"used"); assert.equal(result.effect.meal.data.nutritionKnown,false);
  assert.equal(result.state.plans.length,1); assert.equal(foodOverview(result.state).toBuy[0].toBuy,50);
});

test("plans reserve compatible amounts without consuming stock; swaps and removals recalculate shopping", () => {
  let state = applyFoodCommand(emptyFoodState(), command(stock("rice", "Rice", 0.5, "kg"))).state;
  state = applyFoodCommand(state, command(plan("monday", 300))).state;
  state = applyFoodCommand(state, command(plan("tuesday", 400))).state;
  assert.equal(state.stock[0].quantity, 500);
  assert.deepEqual(foodOverview(state).inventory[0], { ingredient: "rice", unit: "g", knownOnHand: 500, required: 700, reserved: 500, available: 0, unknownQuantity: false, needsCheck: false, toBuy: 200 });
  state = applyFoodCommand(state, command(plan("tuesday", 100))).state;
  assert.equal(foodOverview(state).inventory[0].available, 100);
  state = applyFoodCommand(state, command({ type: "plan.remove", id: "monday" })).state;
  assert.equal(foodOverview(state).inventory[0].available, 400);
});

test("unknown quantities and incompatible units ask for a check instead of inventing stock", () => {
  let state = applyFoodCommand(emptyFoodState(), command(stock("rice", "Rice", null))).state;
  state = applyFoodCommand(state, command(plan())).state;
  assert.equal(foodOverview(state).toBuy[0].toBuy, null);
  assert.equal(foodOverview(state).toBuy[0].needsCheck, true);
  state = applyFoodCommand(state, command(stock("rice", "Rice", 1, "each"))).state;
  assert.equal(foodOverview(state).toBuy[0].toBuy, null);
  state = applyFoodCommand(state, command(stock("rice", "Rice", 0, "each"))).state;
  assert.equal(foodOverview(state).toBuy[0].toBuy, 300);
});

test("a reviewed two-, three- or seven-day replacement preserves meals outside its window", () => {
  for (const days of [2, 3, 7]) {
    let state = applyFoodCommand(emptyFoodState(), command(plan("inside"))).state;
    const outside = plan("later"); outside.plan.date = "2026-10-20";
    state = applyFoodCommand(state, command(outside)).state;
    const next = plan("new-meal"); next.plan.date = "2026-10-08";
    state = applyFoodCommand(state, command({ type: "plan.window", startDate: "2026-10-07", days, plans: [next.plan] })).state;
    assert.deepEqual(state.plans.map(item => item.id), ["later", "new-meal"]);
    assert.throws(() => applyFoodCommand(state, command({ type: "plan.window", startDate: "2026-10-07", days, plans: [outside.plan] })), /inside the dates/);
    assert.throws(() => applyFoodCommand(state, command({ type: "plan.window", startDate: "2026-10-07", days, plans: [{ ...next.plan, id: "later" }] })), /another planning window/);
  }
});

test("only explicit name aliases and compatible units combine", () => {
  const action = plan();
  action.plan.ingredients = [
    { ingredient: "  Eggs  ", quantity: 2, unit: "each" }, { ingredient: "egg", quantity: 1, unit: "each" },
    { ingredient: "egg", quantity: 100, unit: "g" }, { ingredient: "Red onion", quantity: 1, unit: "each" },
    { ingredient: "Onions", quantity: 1, unit: "each" },
  ];
  const state = applyFoodCommand(emptyFoodState(), command(action)).state;
  assert.equal(state.plans[0].ingredients.length, 4);
  assert.equal(state.plans[0].ingredients[0].quantity, 3);
});

test("malformed quantities, dates, identifiers and unreviewed fields are rejected", () => {
  for (const quantity of [-1, Infinity, NaN, 0.0001, 1_000_001]) assert.throws(() => command(stock("rice", "Rice", quantity)));
  for (const value of ["2026-02-30", "2026-13-01", "2026-00-01", "0000-01-01"]) {
    const action = plan(); action.plan.date = value; assert.throws(() => command(action));
  }
  assert.throws(() => command(stock("../rice", "Rice", 2)));
  assert.throws(() => foodCommandSchema.parse({ operationId: "x", expectedRevision: 0, action: stock("rice", "Rice", 1), userId: "someone-else" }));
  assert.throws(() => command({ type: "purchase", items: [{ id: "rice", ingredient: "Rice", quantity: 0, unit: "g" }] }));
});

test("a saved purchase uses actual pack quantity, preserves household shopping and survives a reload", async t => {
  const { db, save } = database(t);
  await save(plan("dinner", 300));
  await save({ type: "shopping.set", item: { id: "bin-bags", title: "Bin bags", quantity: "1 roll", done: false } });
  await save({ type: "shopping.set", item: { id: "rice-list", title: "Rice", quantity: "500 g pack", done: false } });
  await save({ type: "purchase", items: [{ id: "rice", ingredient: "Rice", quantity: 0.5, unit: "kg", shoppingId: "rice-list" }] });
  const reloaded = await getFoodSpace(db, "ali");
  assert.equal(reloaded.state.stock[0].quantity, 500);
  assert.equal(reloaded.overview.inventory[0].available, 200);
  assert.equal(reloaded.overview.toBuy.length, 0);
  assert.equal(reloaded.state.shopping.find(item => item.id === "bin-bags").done, false);
  assert.equal(reloaded.state.shopping.find(item => item.id === "rice-list").done, true);
});

test("ticking a shopping note never invents purchased food", async t => {
  const { db, save } = database(t);
  await save({ type: "shopping.set", item: { id: "rice", title: "Rice", quantity: "1 pack", done: true } });
  assert.equal((await getFoodSpace(db, "ali")).state.stock.length, 0);
});

test("an uncertain existing amount cannot silently absorb a purchase", async t => {
  const { db, save } = database(t);
  await save(stock("rice", "Rice", null));
  await assert.rejects(save({ type: "purchase", items: [{ id: "rice", ingredient: "Rice", quantity: 500, unit: "g" }] }), /Check how much/);
  assert.equal((await getFoodSpace(db, "ali")).state.stock[0].quantity, null);
  await save({ type: "purchase", items: [{ id: "new-pack", ingredient: "Rice", quantity: 500, unit: "g" }] });
  assert.equal((await getFoodSpace(db, "ali")).state.stock.length, 2);
});

test("network retries do not add a purchase twice, even after a later action or undo", async t => {
  const { db, save } = database(t);
  const purchase = { operationId: "paid-once", expectedRevision: 0, action: { type: "purchase", items: [{ id: "rice", ingredient: "Rice", quantity: 500, unit: "g" }] } };
  assert.equal((await saveFoodCommand(db, "ali", purchase)).replayed, false);
  assert.equal((await saveFoodCommand(db, "ali", purchase)).replayed, true);
  await save(plan());
  assert.equal((await saveFoodCommand(db, "ali", purchase)).revision, 1);
  assert.equal((await getFoodSpace(db, "ali")).state.stock[0].quantity, 500);
  await save({ type: "undo", operationId: "paid-once" });
  await saveFoodCommand(db, "ali", purchase);
  assert.equal((await getFoodSpace(db, "ali")).state.stock.length, 0);
  await assert.rejects(save({ type: "undo", operationId: "paid-once" }), /already been undone/);
});

test("a retry key cannot be repurposed for a different save", async t => {
  const { db } = database(t);
  await saveFoodCommand(db, "ali", { operationId: "same-key", expectedRevision: 0, action: stock("rice", "Rice", 100) });
  await assert.rejects(saveFoodCommand(db, "ali", { operationId: "same-key", expectedRevision: 1, action: stock("rice", "Rice", 900) }), /different change/);
  assert.equal((await getFoodSpace(db, "ali")).state.stock[0].quantity, 100);
});

test("two screens saving the same revision produce one winner, not lost stock", async t => {
  const { db } = database(t);
  const results = await Promise.allSettled([
    saveFoodCommand(db, "ali", { operationId: "screen-a", expectedRevision: 0, action: stock("rice", "Rice", 100) }),
    saveFoodCommand(db, "ali", { operationId: "screen-b", expectedRevision: 0, action: stock("milk", "Milk", 200, "ml") }),
  ]);
  assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
  assert.equal(results.find(result => result.status === "rejected").reason.status, 409);
  assert.equal((await getFoodSpace(db, "ali")).revision, 1);
  assert.equal((await getFoodSpace(db, "ali")).state.stock.length, 1);
});

test("a receipt committed between the initial lookup and the snapshot still prevents a reused id overwriting stock", async t => {
  const { db } = database(t);
  let injected = false;
  const interleaved = { ...db, prepare(sql) {
    const prepared = db.prepare(sql);
    if (!sql.startsWith("SELECT COALESCE((SELECT revision")) return prepared;
    return { bind(...values) {
      const bound = prepared.bind(...values);
      return { ...bound, first: async () => {
        if (!injected) {
          injected = true;
          await saveFoodCommand(db, "ali", { operationId: "same-key", expectedRevision: 0, action: stock("rice", "Rice", 100) });
        }
        return bound.first();
      } };
    } };
  } };
  await assert.rejects(saveFoodCommand(interleaved, "ali", { operationId: "same-key", expectedRevision: 1, action: stock("rice", "Rice", 900) }), /different change/);
  assert.equal((await getFoodSpace(db, "ali")).state.stock[0].quantity, 100);
  assert.equal((await getFoodSpace(db, "ali")).revision, 1);
});

test("simultaneous identical cooking retries save exactly one meal and deduction", async t => {
  const { db, sqlite, save } = database(t);
  await save(stock("rice", "Rice", 500));
  const cook = { operationId: "cook-once", expectedRevision: 1, action: cooking() };
  const results = await Promise.all([saveFoodCommand(db, "ali", cook), saveFoodCommand(db, "ali", cook)]);
  assert.equal(results.filter(result => result.replayed).length, 1);
  assert.equal((await getFoodSpace(db, "ali")).state.stock[0].quantity, 200);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM entries").get().n, 1);
});

test("competing payloads with the same key cannot sneak in meal side effects", async t => {
  const { db, sqlite, save } = database(t);
  await save(stock("rice", "Rice", 500));
  const results = await Promise.allSettled([
    saveFoodCommand(db, "ali", { operationId: "clash", expectedRevision: 1, action: stock("rice", "Rice", 800) }),
    saveFoodCommand(db, "ali", { operationId: "clash", expectedRevision: 1, action: cooking() }),
  ]);
  assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
  const receipt = sqlite.prepare("SELECT effect FROM food_operations WHERE operation_id='clash'").get();
  const type = JSON.parse(receipt.effect).type;
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM entries").get().n, type === "cook" ? 1 : 0);
  assert.equal((await getFoodSpace(db, "ali")).state.stock[0].quantity, type === "cook" ? 200 : 800);
});

test("partial cooking reduces the remaining plan, records unknown nutrition and saves leftover portions", async t => {
  const { db, sqlite, save } = database(t);
  await save(stock("rice", "Rice", 500));
  await save(plan("dinner", 400, 4));
  await save(cooking({ planId: "dinner", servings: 2, consumed: [{ stockId: "rice", quantity: 0.18, unit: "kg" }], leftovers: { id: "lunch", title: "Cooked rice bowl", portions: 1 } }));
  const space = await getFoodSpace(db, "ali");
  assert.equal(space.state.stock.find(item => item.id === "rice").quantity, 320);
  assert.equal(space.state.plans[0].servings, 2);
  assert.equal(space.state.plans[0].ingredients[0].quantity, 200);
  assert.equal(space.state.stock.find(item => item.id === "lunch").unit, "portion");
  const meal = JSON.parse(sqlite.prepare("SELECT data FROM entries WHERE kind='food'").get().data);
  assert.equal(meal.nutritionKnown, false);
});

test("another meal's reserved stock requires explicit review before use", async t => {
  const { db, save } = database(t);
  await save(stock("rice", "Rice", 500));
  await save(plan("tomorrow", 400));
  await assert.rejects(save(cooking()), /reserved for another meal/);
  assert.equal((await getFoodSpace(db, "ali")).state.stock[0].quantity, 500);
  await save(cooking({ useReservedStock: true }));
  assert.equal((await getFoodSpace(db, "ali")).overview.toBuy[0].toBuy, 200);
});

test("invalid cooking leaves the whole batch unchanged", async t => {
  const { db, save } = database(t);
  await save(stock("rice", "Rice", 500));
  const before = await getFoodSpace(db, "ali");
  for (const consumed of [
    [{ stockId: "rice", quantity: 501, unit: "g" }],
    [{ stockId: "rice", quantity: 10, unit: "ml" }],
    [{ stockId: "rice", quantity: 10, unit: "g" }, { stockId: "rice", quantity: 10, unit: "g" }],
    [{ stockId: "rice", quantity: 10, unit: "g" }, { stockId: "missing", quantity: 10, unit: "g" }],
  ]) await assert.rejects(save(cooking({ consumed })));
  assert.deepEqual(await getFoodSpace(db, "ali"), before);
});

test("undo restores stock, plan and journal together without re-consuming food on a retry", async t => {
  const { db, sqlite, save } = database(t);
  await save(stock("rice", "Rice", 500));
  await save(plan());
  await saveFoodCommand(db, "ali", { operationId: "cook", expectedRevision: 2, action: cooking({ planId: "dinner", leftovers: { id: "lunch", title: "Rice bowl", portions: 1 } }) });
  assert.equal((await getFoodSpace(db, "ali")).state.plans.length, 0);
  const undo = { operationId: "undo-cook", expectedRevision: 3, action: { type: "undo", operationId: "cook" } };
  await saveFoodCommand(db, "ali", undo);
  await saveFoodCommand(db, "ali", undo);
  const space = await getFoodSpace(db, "ali");
  assert.equal(space.state.stock.length, 1);
  assert.equal(space.state.stock[0].quantity, 500);
  assert.equal(space.state.plans.length, 1);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM entries").get().n, 0);
});

test("undo refuses to overwrite later stock corrections, even if the quantity was changed back", async t => {
  const { db, save } = database(t);
  await saveFoodCommand(db, "ali", { operationId: "buy", expectedRevision: 0, action: { type: "purchase", items: [{ id: "rice", ingredient: "Rice", quantity: 500, unit: "g" }] } });
  await save(stock("rice", "Rice", 600));
  await save(stock("rice", "Rice", 500));
  await assert.rejects(save({ type: "undo", operationId: "buy" }), /has changed/);
  assert.equal((await getFoodSpace(db, "ali")).state.stock[0].quantity, 500);
});

test("editing or deleting meal history never changes stock and prevents unsafe undo", async t => {
  const { db, sqlite, save } = database(t);
  await save(stock("rice", "Rice", 500));
  await saveFoodCommand(db, "ali", { operationId: "cook", expectedRevision: 1, action: cooking() });
  sqlite.prepare("UPDATE entries SET data=? WHERE user_id=? AND id=?").run(JSON.stringify({ title: "My corrected meal" }), "ali", "food-cook");
  await assert.rejects(save({ type: "undo", operationId: "cook" }), /history changed/);
  sqlite.prepare("DELETE FROM entries WHERE user_id=?").run("ali");
  await assert.rejects(save({ type: "undo", operationId: "cook" }), /history changed/);
  assert.equal((await getFoodSpace(db, "ali")).state.stock[0].quantity, 200);
  assert.equal((await getFoodSpace(db, "ali")).revision, 2);
});

test("journal failure rolls back stock and the retry receipt, allowing a corrected retry", async t => {
  const { db, sqlite, save } = database(t);
  await save(stock("rice", "Rice", 500));
  sqlite.exec("CREATE TRIGGER fail_food BEFORE INSERT ON entries BEGIN SELECT RAISE(ABORT, 'simulated failure'); END;");
  const cook = { operationId: "cook", expectedRevision: 1, action: cooking() };
  await assert.rejects(saveFoodCommand(db, "ali", cook), /simulated failure/);
  assert.equal((await getFoodSpace(db, "ali")).state.stock[0].quantity, 500);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM food_operations WHERE operation_id='cook'").get().n, 0);
  sqlite.exec("DROP TRIGGER fail_food");
  await saveFoodCommand(db, "ali", cook);
  assert.equal((await getFoodSpace(db, "ali")).state.stock[0].quantity, 200);
});

test("a colliding journal id cannot be overwritten, even when its contents match", async t => {
  const { db, sqlite, save } = database(t);
  await save(stock("rice", "Rice", 500));
  const entry = { title: "Rice bowl", date: "2026-10-07", meal: "Dinner", calories: 0, protein: 0, carbs: 0, fat: 0, nutritionKnown: false };
  sqlite.prepare("INSERT INTO entries(user_id,id,kind,data) VALUES(?,?,'food',?)").run("ali", "food-cook", JSON.stringify(entry));
  await assert.rejects(saveFoodCommand(db, "ali", { operationId: "cook", expectedRevision: 1, action: cooking() }), /UNIQUE/);
  assert.equal((await getFoodSpace(db, "ali")).state.stock[0].quantity, 500);
  assert.equal((await getFoodSpace(db, "ali")).revision, 1);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM entries").get().n, 1);
});

test("users can use the same ids without seeing or mutating each other's food or receipts", async t => {
  const { db, sqlite } = database(t);
  for (const [user, quantity] of [["ali", 500], ["sam", 900]]) {
    await saveFoodCommand(db, user, { operationId: "setup", expectedRevision: 0, action: stock("rice", "Rice", quantity) });
    await saveFoodCommand(db, user, { operationId: "cook", expectedRevision: 1, action: cooking() });
  }
  await saveFoodCommand(db, "ali", { operationId: "undo", expectedRevision: 2, action: { type: "undo", operationId: "cook" } });
  assert.equal((await getFoodSpace(db, "ali")).state.stock[0].quantity, 500);
  assert.equal((await getFoodSpace(db, "sam")).state.stock[0].quantity, 600);
  assert.equal((await getFoodSpace(db, "new-user")).recentActions.length, 0);
  assert.equal(sqlite.prepare("SELECT user_id FROM entries").get().user_id, "sam");
});

test("the API enforces authentication, origin, body limits and no-store responses", async t => {
  const { db } = database(t);
  const post = (body, headers = { origin: "https://daywell.example" }) => new Request("https://daywell.example/api/food", { method: "POST", headers, body });
  const deps = { userId: "ali", database: () => db };
  const valid = JSON.stringify({ operationId: "setup", expectedRevision: 0, action: stock("rice", "Rice", 500) });
  assert.equal((await foodResponse(post(valid), { ...deps, userId: null })).status, 401);
  assert.equal((await foodResponse(post(valid, { origin: "https://elsewhere.example" }), deps)).status, 403);
  assert.equal((await foodResponse(post(valid, {}), deps)).status, 403);
  assert.equal((await foodResponse(post("x".repeat(32_001)), deps)).status, 413);
  assert.equal((await foodResponse(post("{"), deps)).status, 400);
  const saved = await foodResponse(post(valid), deps);
  assert.equal(saved.status, 200);
  assert.equal(saved.headers.get("cache-control"), "no-store");
  const loaded = await foodResponse(new Request("https://daywell.example/api/food"), deps);
  assert.equal((await loaded.json()).state.stock[0].quantity, 500);
});

test("spoken and older shopping notes join Food basket without being copied or inventing stock", async t => {
  const { db, sqlite } = database(t);
  const { saveEntries } = await import("../db/entry-store.ts");
  const milk = { id: "spoken-milk", kind: "grocery", data: { title: "milk", quantity: "check pack size", done: false } };
  const timer = { id: "timer", kind: "timer", data: { title: "Focus", duration: 600, remaining: 600, endAt: 123456, mode: "Focus" } };
  await saveEntries(db, "ali", [milk, timer]);
  const snapshot = await getFoodSpace(db, "ali");
  assert.equal(snapshot.revision, 1);
  assert.equal(snapshot.state.shopping[0].id, "entry--spoken-milk");
  assert.equal(snapshot.state.shopping[0].quantity, "check pack size");
  assert.deepEqual(snapshot.state.stock, []);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM entries WHERE user_id='ali'").get().n, 2);
  assert.deepEqual((await getFoodSpace(db, "another-user")).state.shopping, []);
  assert.deepEqual(JSON.parse(sqlite.prepare("SELECT data FROM food_spaces WHERE user_id='ali'").get().data).shopping, []);
});

test("a spoken note purchase, lost-response retry and undo change stock and the original note together", async t => {
  const { db, sqlite, save } = database(t);
  const { saveEntries } = await import("../db/entry-store.ts");
  await saveEntries(db, "ali", [{ id: "milk", kind: "grocery", data: { title: "milk", quantity: "a bottle", done: false } }]);
  const purchase = { operationId: "same-purchase", expectedRevision: 1, action: { type: "purchase", items: [{ id: "milk-pack", ingredient: "milk", quantity: 2, unit: "l", shoppingId: "entry--milk" }] } };
  await saveFoodCommand(db, "ali", purchase);
  assert.equal((await saveFoodCommand(db, "ali", purchase)).replayed, true);
  let snapshot = await getFoodSpace(db, "ali");
  assert.equal(snapshot.state.stock[0].quantity, 2000);
  assert.equal(snapshot.state.shopping[0].done, true);
  assert.equal(JSON.parse(sqlite.prepare("SELECT data FROM entries WHERE id='milk'").get().data).done, true);
  await save({ type: "undo", operationId: "same-purchase" });
  snapshot = await getFoodSpace(db, "ali");
  assert.deepEqual(snapshot.state.stock, []);
  assert.equal(snapshot.state.shopping[0].done, false);
  assert.equal(snapshot.state.shopping[0].quantity, "a bottle");
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM entries WHERE id='milk'").get().n, 1);
});

test("shopping edits invalidate an open food review and block undo over a newer note", async t => {
  const { db, save } = database(t);
  const { saveEntries } = await import("../db/entry-store.ts");
  const note = { id: "milk", kind: "grocery", data: { title: "milk", quantity: "1", done: false } };
  await saveEntries(db, "ali", [note]);
  const purchase = { operationId: "buy-milk", expectedRevision: 1, action: { type: "purchase", items: [{ id: "pack", ingredient: "milk", quantity: 500, unit: "ml", shoppingId: "entry--milk" }] } };
  await saveEntries(db, "ali", [{ ...note, data: { ...note.data, title: "oat drink" } }]);
  await assert.rejects(saveFoodCommand(db, "ali", purchase), /changed/);
  await saveFoodCommand(db, "ali", { ...purchase, expectedRevision: 2 });
  await saveEntries(db, "ali", [{ ...note, data: { ...note.data, quantity: "two cartons", done: true } }]);
  await assert.rejects(save({ type: "undo", operationId: "buy-milk" }), /changed/);
  assert.equal((await getFoodSpace(db, "ali")).state.stock[0].quantity, 500);
});

test("editing and removing a connected note update the original; longest legacy IDs still work", async t => {
  const { db, sqlite, save } = database(t);
  const { saveEntries } = await import("../db/entry-store.ts");
  const id = "a".repeat(80);
  await saveEntries(db, "ali", [{ id, kind: "grocery", data: { title: "Bin bags", quantity: "1 roll", done: false } }]);
  await save({ type: "shopping.set", item: { id: `entry--${id}`, title: "Bin bags", quantity: "2 rolls", done: true } });
  assert.equal(JSON.parse(sqlite.prepare("SELECT data FROM entries WHERE id=?").get(id).data).quantity, "2 rolls");
  assert.deepEqual((await getFoodSpace(db, "ali")).state.stock, []);
  await save({ type: "shopping.remove", id: `entry--${id}` });
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM entries").get().n, 0);
  assert.deepEqual((await getFoodSpace(db, "ali")).state.shopping, []);
});


test("a restored draft cannot read or write after switching authenticated accounts", async t => {
  const { db } = database(t);
  const { recoveryScopeForUser } = await import("../lib/recovery-scope.ts");
  const scope = await recoveryScopeForUser("ali");
  for (const method of ["GET", "POST"]) {
    const request = new Request("http://localhost/api/food", { method, headers: { Origin: "http://localhost", "X-Daywell-Recovery-Scope": scope }, ...(method === "POST" ? { body: JSON.stringify(command(stock("rice", "rice", 100))) } : {}) });
    const response = await foodResponse(request, { userId: "sam", database: () => db });
    assert.equal(response.status, 403);
  }
  assert.deepEqual((await getFoodSpace(db, "sam")).state.stock, []);
});


test("pre-sugar intake receipts keep their original hash and replay without a duplicate meal", async t => {
  const { db, sqlite, save } = database(t);
  await save(stock("rice", "Rice", 1000));
  const old = { operationId: "before-sugar", expectedRevision: 1, action: {
    type: "cook", title: "Rice bowl", date: "2026-10-07", meal: "Dinner", servings: 2,
    consumed: [{ stockId: "rice", quantity: 300, unit: "g" }], useReservedStock: false,
    intake: { portions: 1, calories: 400, macros: { protein: 10, carbs: 20, fat: 5 }, source: "label" }
  } };
  await saveFoodCommand(db, "ali", old);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(old)));
  const hash = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
  sqlite.prepare("UPDATE food_operations SET request_hash=? WHERE operation_id='before-sugar'").run(hash);
  assert.equal((await saveFoodCommand(db, "ali", old)).replayed, true);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM entries").get().n, 1);
  assert.equal((await getFoodSpace(db, "ali")).state.stock[0].quantity, 700);
});
