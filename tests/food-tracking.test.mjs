import test from "node:test";
import assert from "node:assert/strict";
import { schemas } from "../lib/daywell.ts";
import { foodDetail, activityDetail, intakeSchema, nutritionSummary } from "../lib/food-tracking.ts";

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
