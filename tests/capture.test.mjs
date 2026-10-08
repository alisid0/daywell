import test from "node:test";
import assert from "node:assert/strict";
import { draftEntries, captureJsonSchema } from "../lib/capture.ts";
import { nutritionSummary } from "../lib/food-tracking.ts";
import { workoutCommand } from "../lib/workout-voice.ts";
const action = extra => ({kind:"food",title:"Lunch",date:null,minutes:null,time:null,endTime:null,quantity:null,calories:null,protein:null,carbs:null,fat:null,meal:"Lunch",quality:null,repeatDays:[],portions:null,sugarGrams:null,sugarSource:null,stockQuantity:null,stockUnit:null,...extra});
const draft = (actions,mode="meal",question=null) => draftEntries({summary:"Please review",question,actions},"2026-10-08",["food","grocery"],mode);
test("meal captures keep missing nutrition unknown and never infer sugar from appearance",()=>{
  const result=draft([action({sugarGrams:12})]);
  assert.equal(result.entries.length,1);assert.equal(result.basket.length,0);
  assert.equal(result.entries[0].data.nutritionKnown,false);
  assert.equal(nutritionSummary(result.entries,"2026-10-08").unknownFood,1);
  assert.equal(result.entries[0].data.sugarGrams,undefined);
  assert.equal(result.entries[0].data.foodStatus,"eaten");
  const explicit=draft([action({sugarGrams:0,sugarSource:"user",calories:140,portions:0.5})]);
  assert.equal(explicit.entries[0].data.sugarGrams,0);
  assert.equal(explicit.entries[0].data.calories,140);
  assert.equal(explicit.entries[0].data.portions,0.5);
});
test("basket capture proposes stock only, allowing unknown amounts without guessing dates",()=>{
  const result=draft([action({kind:"stock",title:"Eggs",stockQuantity:6,stockUnit:"each"}),action({kind:"stock",title:"Rice"})],"basket");
  assert.equal(result.entries.length,0);assert.equal(result.basket.length,2);
  assert.equal(result.basket[0].quantity,6);assert.equal(result.basket[1].quantity,null);
  assert.equal(result.basket[1].bestBefore,null);
  assert.throws(()=>draft([action({kind:"stock",stockQuantity:500})],"basket"),/unit/);
  assert.throws(()=>draft([action({kind:"stock"})],"meal"));
  assert.throws(()=>draft([action({kind:"food"})],"basket"));
  assert.throws(()=>draft([action({kind:"stock"})],"auto"));
});
test("clarification and disabled modules never produce a save proposal",()=>{
  const result=draft([action({calories:200})],"meal","How much did you have?");
  assert.deepEqual(result.entries,[]);assert.deepEqual(result.basket,[]);
  assert.throws(()=>draftEntries({summary:"Check",question:null,actions:[action({kind:"stock"})]},"2026-10-08",[],"basket"));
  assert.throws(()=>draft([action({sugarGrams:-1,sugarSource:"user"})]));
});
test("shopping photos become unchecked notes, never a purchase or meal",()=>{
  const result=draft([action({kind:"grocery",title:"Rice",quantity:"1 bag"})],"grocery");
  assert.equal(result.entries[0].kind,"grocery");assert.equal(result.entries[0].data.done,false);assert.deepEqual(result.basket,[]);
});
test("strict provider schema requires every nullable field explicitly",()=>{
  const item=captureJsonSchema.properties.actions.items;
  assert.deepEqual(item.required,Object.keys(item.properties));assert.equal(item.additionalProperties,false);
});
test("routine speech distinguishes completed from skipped and rejects ambiguous or negated instructions",()=>{
  for(const [phrase,command] of [["Done, next!","done"],["Next","skip"],["please pause","pause"],["continue","start"],["repeat that","repeat"],["make it easier","easier"],["end workout","end"]])assert.equal(workoutCommand(phrase),command);
  for(const phrase of ["don't stop","not done","I might be done","pause then continue","harder","save my workout","I burned 400 calories","done yesterday"])assert.equal(workoutCommand(phrase),null);
});
