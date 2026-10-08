import test from "node:test";
import assert from "node:assert/strict";
import { emptyFoodState, foodCommandSchema, applyFoodCommand, foodStateSchema } from "../lib/food.ts";
import { mealCoverage, repeatMeal, mealPlanDraft, clearPlanCalories, plannedIntake, mealPlanJsonSchema, matchesPlannedIngredients } from "../lib/food-journey.ts";
import { resizeCapturedMeal, resizeIntakePortions, nutritionSummary } from "../lib/food-tracking.ts";
import { schemas } from "../lib/daywell.ts";

const basket = () => ({ ...emptyFoodState(), stock: [{id:"eggs",ingredient:"egg",quantity:4,unit:"each",bestBefore:null,changedBy:"stock"},{id:"noodles",ingredient:"dry noodles",quantity:150,unit:"g",bestBefore:null,changedBy:"stock"}] });
const recipe = {title:"Egg noodles",ingredients:[{ingredient:"eggs",quantity:2,unit:"each"},{ingredient:"dry noodles",quantity:75,unit:"g"}],guide:{steps:["Follow the pack instructions."],caloriesPerServing:420,nutritionNote:"Test estimate"}};
const meals = (count=2) => repeatMeal(recipe,"2026-10-08",count,"Dinner");
test("four eggs and 150g dry noodles cover two chosen servings, never three",()=>{
  assert.deepEqual(mealCoverage(basket(),meals(3)).map(x=>x.covered),[true,true,false]);
  const halfEggMeal={...recipe,ingredients:[{ingredient:"eggs",quantity:1,unit:"each"},{ingredient:"egg",quantity:1,unit:"each"}]};
  assert.deepEqual(mealCoverage(basket(),repeatMeal(halfEggMeal,"2026-10-08",3,"Dinner")).map(x=>x.covered),[true,true,false]);
});
test("coverage subtracts existing reservations, handles kg and keeps unknowns and unlike units unconfirmed",()=>{
  const state=basket();state.plans=[{...meals(1)[0],changedBy:"earlier"}];
  assert.deepEqual(mealCoverage(state,meals()).map(x=>x.covered),[true,false]);
  state.plans=[];state.stock[1].quantity=null;
  assert.equal(mealCoverage(state,meals())[0].missing[0].needsCheck,true);
  state.stock[1].quantity=2;state.stock[1].unit="each";
  assert.equal(mealCoverage(state,meals())[0].missing[0].needsCheck,true);
  const metric=basket();metric.stock[1].quantity=1000;
  assert.equal(mealCoverage(metric,[{...meals()[0],ingredients:[{ingredient:"dry noodles",quantity:.2,unit:"kg"}]}])[0].covered,true);
  metric.stock[1].ingredient="cooked noodles";
  assert.equal(mealCoverage(metric,meals())[0].covered,false);
});
test("new plan batch preserves existing plans, stock and meal history, while rejecting reused IDs",()=>{
  const original=basket();original.plans=[{...meals(1)[0],id:"existing",changedBy:"before"}];
  const command=foodCommandSchema.parse({operationId:"new",expectedRevision:0,action:{type:"plan.add",plans:meals()}});
  const {state,effect}=applyFoodCommand(original,command);
  assert.equal(state.plans.length,3);assert.deepEqual(state.stock,original.stock);assert.equal(effect.meal,null);
  assert.deepEqual(foodStateSchema.parse(state).plans[1].guide,recipe.guide);
  assert.throws(()=>applyFoodCommand(state,command),/already exists/);
  assert.throws(()=>applyFoodCommand(original,{...command,action:{type:"plan.add",plans:[command.action.plans[0],command.action.plans[0]]}}),/repeated/);
});
test("AI meal drafts are one serving, scheduled locally and bounded, with honest unknown calories",()=>{
  const value={summary:"Two meals",question:null,meals:[{...recipe,guide:undefined,steps:["Follow the pack."],caloriesPerServing:null,nutritionNote:"Verified restaurant data"}]};
  delete value.meals[0].guide;
  const options={start:"2026-10-08",count:2,meal:"Dinner"};
  const result=mealPlanDraft(value,options);
  assert.equal(result.plans[0].servings,1);assert.equal(result.plans[0].date,options.start);
  assert.equal(result.plans[0].guide.caloriesPerServing,undefined);assert.match(result.plans[0].guide.nutritionNote,/AI estimate/);
  assert.deepEqual(mealPlanDraft({...value,question:"How much noodles?"},options).plans,[]);
  assert.throws(()=>mealPlanDraft({...value,meals:[value.meals[0],value.meals[0]]},{...options,count:1}));
  assert.throws(()=>mealPlanDraft(value,{...options,start:"2026-02-30"}));
  assert.throws(()=>mealPlanDraft({...value,meals:[{...value.meals[0],caloriesPerServing:-20}]},options));
  assert.deepEqual(mealPlanJsonSchema.required,Object.keys(mealPlanJsonSchema.properties));
});
test("changing recipe ingredients clears calories; reviewed personal intake scales by actual portions",()=>{
  const plan=meals()[0];assert.equal(clearPlanCalories(plan).guide.caloriesPerServing,undefined);
  assert.equal(plannedIntake(plan,.5).calories,210);
  assert.equal(plannedIntake(clearPlanCalories(plan),1).calories,undefined);
  assert.equal(nutritionSummary([],"2026-10-08").eaten,0);
});
test("restaurant and takeaway fractions scale total nutrition without touching basket state",()=>{
  const entry={id:"meal",kind:"food",data:schemas.food.parse({title:"Takeaway noodles",date:"2026-10-08",meal:"Dinner",calories:800,protein:20,carbs:80,fat:20,portions:1,sugarGrams:8,mealOrigin:"takeaway",nutritionKnown:true})};
  const half=resizeCapturedMeal(entry,.5);
  assert.equal(half.data.calories,400);assert.equal(half.data.sugarGrams,4);assert.equal(half.data.portions,.5);assert.equal(half.data.mealOrigin,"takeaway");
  assert.equal(resizeCapturedMeal(half,2).data.calories,800);
  assert.equal(resizeCapturedMeal({...entry,data:{...entry.data,nutritionKnown:false,sugarGrams:undefined}},.5).data.sugarGrams,undefined);
  assert.throws(()=>resizeCapturedMeal(entry,0));assert.throws(()=>resizeCapturedMeal({...entry,data:{...entry.data,portions:.125}},.5));
  assert.throws(()=>resizeCapturedMeal({...entry,data:{...entry.data,calories:6000}},2),/too large/);
});

test("personal portion changes scale known totals and never fill unknown nutrition",()=>{
  const half=resizeIntakePortions({portions:1,calories:420,macros:{protein:20,carbs:60,fat:10},sugarGrams:6,source:"label"},.5);
  assert.equal(half.calories,210);assert.equal(half.macros.carbs,30);assert.equal(half.sugarGrams,3);assert.equal(half.source,"label");
  const unknown=resizeIntakePortions({portions:1,source:"estimate"},2);
  assert.equal(unknown.calories,undefined);assert.equal(unknown.macros,undefined);assert.equal(unknown.sugarGrams,undefined);
  assert.deepEqual(resizeIntakePortions(half,0),{portions:0,source:"label"});
});

test("planned calories prefill only when actual ingredients match the recipe",()=>{
  const state=basket(), plan=meals(1)[0];
  const action={type:"cook",servings:1,consumed:[{stockId:"eggs",quantity:2,unit:"each"},{stockId:"noodles",quantity:.075,unit:"kg"}]};
  assert.equal(matchesPlannedIngredients(state,plan,action),true);
  assert.equal(matchesPlannedIngredients(state,plan,{...action,consumed:[action.consumed[0]]}),false);
  assert.equal(matchesPlannedIngredients(state,plan,{...action,consumed:[{...action.consumed[0],quantity:1},action.consumed[1]]}),false);
  assert.equal(matchesPlannedIngredients(state,plan,{...action,consumed:[{...action.consumed[0],stockId:"deleted"},action.consumed[1]]}),false);
  assert.equal(matchesPlannedIngredients(state,{...plan,servings:2,ingredients:plan.ingredients.map(x=>({...x,quantity:x.quantity*2}))},action),true);
});
