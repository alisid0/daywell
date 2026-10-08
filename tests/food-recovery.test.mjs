import test from "node:test";
import assert from "node:assert/strict";
import { readFoodRecovery, writeFoodRecovery, clearOtherFoodRecovery, recoveryPrefix, FoodRecoveryConflict } from "../lib/food-recovery.ts";
import { prepareFoodCommand, sendFoodCommand } from "../lib/food-client.ts";
import { recoveryScopeForUser } from "../lib/recovery-scope.ts";

const ali = "a".repeat(64), sam = "b".repeat(64);
function storage() { const rows = new Map(); return { rows, get length() { return rows.size; }, key: i => [...rows.keys()][i] ?? null, getItem: k => rows.get(k) ?? null, setItem: (k,v) => rows.set(k,v), removeItem: k => rows.delete(k) }; }
const initial = () => ({ draft: { revision: 4, action: { type: "purchase", items: [{ id: "pack", ingredient: "milk", quantity: 2000, unit: "ml", bestBefore: null, shoppingId: "entry--milk" }] } }, pending: null, view: "shopping", start: "2026-10-08", days: 3 });

test("personal portions, sugar, unknown nutrition and new basket-use drafts survive reopening and safe retry", () => {
  for(const type of ["cook","use"]) {
    const store=storage(),data=initial();
    data.draft.action={type,title:"Apple",date:"2026-10-08",meal:"Snack",consumed:[{stockId:"apple",quantity:1,unit:"each"}],useReservedStock:false,intake:{portions:0.5,calories:40,source:"label",sugarGrams:0,macros:{protein:0,carbs:10,fat:0}},...(type==="cook"?{servings:2}:{})};
    writeFoodRecovery(store,ali,data);
    assert.deepEqual(readFoodRecovery(store,ali).draft.action,data.draft.action);
    data.pending=prepareFoodCommand(data.draft,"snack-retry");
    writeFoodRecovery(store,ali,data);
    assert.deepEqual(readFoodRecovery(store,ali).pending,data.pending);
    data.pending=null;data.draft.action.intake={portions:0};data.draft.action.consumed=[];
    writeFoodRecovery(store,ali,data);
    assert.deepEqual(readFoodRecovery(store,ali).draft.action.intake,{portions:0});
  }
});

test("unfinished names and quantities survive reopening; saved or discarded drafts are cleared", () => {
  const store=storage(), data=initial();
  data.draft.action.items[0].ingredient=""; data.draft.action.items[0].quantity=0;
  writeFoodRecovery(store,ali,data);
  assert.deepEqual(readFoodRecovery(store,ali),{version:1,...data});
  writeFoodRecovery(store,ali,{...data,draft:null});
  assert.equal(readFoodRecovery(store,ali),null);
});

test("an interrupted save restores and retries the identical authorised command", async () => {
  const store=storage(), data=initial();
  data.pending=prepareFoodCommand(data.draft,"original-save");
  writeFoodRecovery(store,ali,data);
  const restored=readFoodRecovery(store,ali);
  assert.deepEqual(restored.pending,data.pending);
  assert.equal(restored.pending.action.items[0].shoppingId,"entry--milk");
  let sent;
  await sendFoodCommand(restored.pending,async (_url,options)=>{sent=options;return Response.json({ok:true,revision:5,replayed:true})},ali);
  assert.equal(sent.body,JSON.stringify(data.pending));
  assert.equal(sent.headers["X-Daywell-Recovery-Scope"],ali);
});

test("recovery is scoped to the authenticated account and cleared on account change/sign out", async () => {
  const store=storage(); store.setItem("unrelated-preference","keep");
  writeFoodRecovery(store,ali,initial());
  assert.equal(readFoodRecovery(store,sam),null);
  clearOtherFoodRecovery(store,sam);
  assert.equal(readFoodRecovery(store,ali),null);
  writeFoodRecovery(store,sam,initial()); clearOtherFoodRecovery(store,null);
  assert.equal(readFoodRecovery(store,sam),null);
  assert.equal(store.getItem("unrelated-preference"),"keep");
  assert.notEqual(await recoveryScopeForUser("user-a"),await recoveryScopeForUser("user-b"));
  assert.equal(await recoveryScopeForUser("user-a"),await recoveryScopeForUser("user-a"));
});

test("corrupted or incompatible drafts cannot crash forms or be submitted", () => {
  const store=storage();
  for(const raw of ["{",JSON.stringify({version:99,...initial()}),JSON.stringify({...initial(),version:1,draft:{revision:0,action:{type:"purchase",items:[null]}}}),"x".repeat(100001)]) {
    store.setItem(recoveryPrefix+ali,raw); assert.equal(readFoodRecovery(store,ali),null); assert.equal(store.getItem(recoveryPrefix+ali),null);
  }
  assert.throws(()=>writeFoodRecovery(store,"invalid",initial()),/Sign in/);
  assert.throws(()=>writeFoodRecovery({...store,setItem(){throw Error("Storage blocked")}},ali,initial()),/Storage blocked/);
});

test("a stale tab cannot overwrite or clear a newer recovery copy", () => {
  const store=storage(), data=initial();
  const first=writeFoodRecovery(store,ali,data,null);
  const newer=writeFoodRecovery(store,ali,{...data,pending:prepareFoodCommand(data.draft,"new-save")},first);
  assert.throws(()=>writeFoodRecovery(store,ali,data,first),FoodRecoveryConflict);
  assert.throws(()=>writeFoodRecovery(store,ali,{...data,draft:null},first),FoodRecoveryConflict);
  assert.equal(store.getItem(recoveryPrefix+ali),newer);
  writeFoodRecovery(store,ali,{...data,draft:null},newer);
  assert.equal(readFoodRecovery(store,ali),null);
});

test("captured basket drafts and pending saves survive recovery including unknown amounts",()=>{
  const store=storage(),data=initial();
  data.draft.action={type:"stock.add",items:[{id:"captured",ingredient:"rice",quantity:null,unit:"g",bestBefore:null}]};
  writeFoodRecovery(store,ali,data);assert.deepEqual(readFoodRecovery(store,ali).draft,data.draft);
  data.pending=prepareFoodCommand(data.draft,"capture-retry");writeFoodRecovery(store,ali,data);
  assert.deepEqual(readFoodRecovery(store,ali).pending,data.pending);
});


test("guided plan batches retain calories and cooking steps across reload and interrupted retry", () => {
  const store=storage(), data=initial();data.view="meals";
  data.draft.action={type:"plan.add",plans:[{id:"dinner",title:"Noodles",date:"2026-10-08",meal:"Dinner",servings:1,ingredients:[{ingredient:"dry noodles",quantity:75,unit:"g"}],guide:{steps:["Follow the pack."],caloriesPerServing:300,nutritionNote:"Test estimate"}}]};
  writeFoodRecovery(store,ali,data);assert.deepEqual(readFoodRecovery(store,ali).draft,data.draft);
  data.pending=prepareFoodCommand(data.draft,"plan-retry");writeFoodRecovery(store,ali,data);
  assert.deepEqual(readFoodRecovery(store,ali).pending,data.pending);
});
