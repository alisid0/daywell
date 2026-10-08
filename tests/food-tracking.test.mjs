import test from "node:test";
import assert from "node:assert/strict";
import { schemas } from "../lib/daywell.ts";
import { foodDetail, activityDetail, intakeSchema, intakeRecord, nutritionSummary, sugarHistory } from "../lib/food-tracking.ts";

const date = "2026-10-08";
const food = (id, data = {}) => ({ id, kind: "food", data: schemas.food.parse({ title: "My meal", date, meal: "Lunch", calories: 400, protein: 20, carbs: 40, fat: 10, ...data }) });
const move = (id, data = {}) => ({ id, kind: "move", data: schemas.move.parse({ title: "Walk", date, minutes: 20, ...data }) });
test("intake and activity totals stay separate; prepared/used food and other dates never count as eaten", () => {
  const entries = [food("legacy"), food("prepared", { foodStatus: "prepared", calories: 900 }), food("used", { foodStatus: "used" }),
    food("personal", { foodStatus: "eaten", portions: 2, calories: 600, macrosKnown: false, nutritionSource: "label" }),
    food("unknown", { nutritionKnown: false, macrosKnown: false }), food("yesterday", { date: "2026-10-07" }),
    move("known", { caloriesBurned: 150, calorieSource: "watch" }), move("unknown"), move("yesterday", { date: "2026-10-07", caloriesBurned: 250 })];
  const result = nutritionSummary(entries,date);
  assert.equal(result.eaten,1000); // Already a personal total, not multiplied by portions.
  assert.equal(result.burned,150);
  assert.equal(result.meals,3); assert.equal(result.unknownFood,1);
  assert.equal(result.activities,2); assert.equal(result.unknownActivity,1);
  assert.equal(result.macroCount,1); assert.equal(result.macros.protein,20);
  assert.equal(Object.hasOwn(result,"net"),false);
});
test("zero is a known estimate; absent calories and absent macros remain unknown", () => {
  const total = nutritionSummary([food("zero",{calories:0,macrosKnown:false}),move("zero",{caloriesBurned:0})],date);
  assert.equal(total.eatenCount,1); assert.equal(total.burnedCount,1); assert.equal(total.macroCount,0);
  assert.equal(nutritionSummary([move("blank")],date).burnedCount,0);
  assert.match(activityDetail({caloriesBurned:0}),/0 kcal/);
  assert.match(foodDetail({foodStatus:"prepared",calories:500}),/not logged as eaten/);
});
test("food status, personal portions and estimate sources survive validation and editing", () => {
  const meal = food("meal", { foodStatus:"prepared", portions:0.5, macrosKnown:false, nutritionSource:"label" });
  const edited = food("meal", { ...meal.data, foodStatus:"eaten" });
  assert.equal(nutritionSummary([edited],date).eaten,400);
  assert.equal(edited.data.portions,0.5); assert.equal(edited.data.nutritionSource,"label");
  const workout = move("strength",{caloriesBurned:125.5,calorieSource:"machine",sets:[{exercise:"Squat",reps:8,kg:0}]});
  assert.equal(workout.data.caloriesBurned,125.5); assert.equal(workout.data.sets.length,1);
  assert.equal(schemas.move.parse({...workout.data,caloriesBurned:undefined,calorieSource:undefined}).caloriesBurned,undefined);
});
test("negative, non-finite and oversized estimates and invalid portions/sources are rejected", () => {
  for(const value of [-1,NaN,Infinity,10001]) {
    assert.equal(intakeSchema.safeParse({portions:1,calories:value}).success,false);
    assert.equal(schemas.move.safeParse({...move("base").data,caloriesBurned:value}).success,false);
  }
  for(const portions of [0,-1,25,Infinity]) assert.equal(intakeSchema.safeParse({portions}).success,false);
  assert.equal(intakeSchema.safeParse({portions:1,source:"medical-prescription"}).success,false);
  assert.equal(schemas.move.safeParse({...move("base").data,calorieSource:"automatic"}).success,false);
});


test("sugar is independent of calories and macros; unknown, zero and prepared food stay distinct", () => {
  const entries = [food("legacy"), food("zero", { sugarGrams: 0 }),
    food("sugar-only", { sugarGrams: 12.5, portions: 2, nutritionKnown: false, macrosKnown: false }),
    food("used", { foodStatus: "used", sugarGrams: 80 }), food("prepared", { foodStatus: "prepared", sugarGrams: 90 }),
    food("other-day", { date: "2026-10-07", sugarGrams: 50 })];
  const total = nutritionSummary(entries, date);
  assert.equal(total.sugarGrams, 12.5); // Personal total, never multiplied by portions.
  assert.equal(total.sugarCount, 2); assert.equal(total.unknownSugar, 1);
  assert.equal(total.meals, 3); assert.equal(total.eatenCount, 2);
  assert.equal(nutritionSummary([food("zero", { sugarGrams: 0 })], date).sugarCount, 1);
  assert.equal(nutritionSummary([food("legacy")], date).sugarCount, 0);
});

test("sugar can be edited and cleared, survives JSON storage, and appears in meal history", () => {
  const original = food("drink", { sugarGrams: 15 });
  const edited = schemas.food.parse({ ...original.data, ...intakeRecord({ portions: 1, sugarGrams: 4.5, source: "label" }, "prepared") });
  assert.equal(JSON.parse(JSON.stringify(edited)).sugarGrams, 4.5);
  assert.equal(edited.nutritionKnown, false);
  assert.match(foodDetail(edited), /4.5 g total sugar.*Food label/);
  const cleared = schemas.food.parse({ ...edited, ...intakeRecord({ portions: 1 }, "prepared") });
  assert.equal(Object.hasOwn(JSON.parse(JSON.stringify(cleared)), "sugarGrams"), false);
  assert.doesNotMatch(foodDetail(cleared), /g total sugar/);
  assert.match(foodDetail({ ...edited, sugarGrams: 0 }), /0 g total sugar/);
  assert.doesNotMatch(foodDetail({ ...edited, foodStatus: "prepared" }), /g total sugar/);
});

test("both direct logs and basket intake reject invalid sugar amounts", () => {
  for (const sugarGrams of [-1, NaN, Infinity, 1001, "5", null]) {
    assert.equal(intakeSchema.safeParse({ portions: 1, sugarGrams }).success, false);
    assert.equal(schemas.food.safeParse({ ...food("base").data, sugarGrams }).success, false);
  }
  for (const sugarGrams of [undefined, 0, 3.2, 1000]) {
    assert.equal(intakeSchema.safeParse({ portions: 1, sugarGrams }).success, true);
  }
});

test("seven-day history crosses months, reports coverage and never treats missing amounts as zero", () => {
  const days = sugarHistory([
    food("before", { date: "2026-09-24", sugarGrams: 10 }),
    food("zero", { date: "2026-09-25", sugarGrams: 0 }),
    food("unknown", { date: "2026-09-25" }),
    food("missing", { date: "2026-09-26" }),
    food("today", { date: "2026-10-01", sugarGrams: 7.5 }),
    food("tomorrow", { date: "2026-10-02", sugarGrams: 12 }),
  ], "2026-10-01");
  assert.equal(days.length, 7);
  assert.deepEqual(days[0], { date: "2026-09-25", sugarGrams: 0, recorded: 1, entries: 2 });
  assert.deepEqual(days[1], { date: "2026-09-26", sugarGrams: null, recorded: 0, entries: 1 });
  assert.deepEqual(days[2], { date: "2026-09-27", sugarGrams: null, recorded: 0, entries: 0 });
  assert.deepEqual(days[6], { date: "2026-10-01", sugarGrams: 7.5, recorded: 1, entries: 1 });
  assert.equal(sugarHistory([], "2026-03-31")[0].date, "2026-03-25"); // DST does not shift stored dates.
  assert.deepEqual(sugarHistory([], "2026-02-30"), []);
  assert.deepEqual(sugarHistory([], ""), []);
});
