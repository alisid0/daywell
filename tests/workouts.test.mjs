import test from 'node:test';
import assert from 'node:assert/strict';
import { schemas } from '../lib/daywell.ts';
import { describeSet } from '../lib/wellbeing.ts';
import { completedSets, elapsedMinutes, exerciseById, exercises, parseAmount, routineSteps, routines, swapStep } from '../lib/workouts.ts';

test('every routine step and easier/harder option points to a real exercise',()=>{
  assert.equal(new Set(exercises.map(e=>e.id)).size,exercises.length);
  for(const e of exercises) for(const id of [e.easier,e.harder]) if(id) assert.ok(exerciseById.has(id),`${e.id} -> ${id}`);
  for(const r of routines) for(const [id] of r.blocks) assert.ok(exerciseById.has(id),`${r.id} -> ${id}`);
});
test('amounts read sets, reps and timed holds without inventing counts',()=>{
  assert.deepEqual(parseAmount('10','reps'),{sets:1,reps:10,text:'10'});
  assert.deepEqual(parseAmount('3 × 8–10','reps'),{sets:3,reps:8,text:'3 × 8–10'});
  assert.deepEqual(parseAmount('2 × 20 seconds each side','seconds'),{sets:2,seconds:20,text:'2 × 20 seconds each side'});
  assert.deepEqual(parseAmount('10 minutes, easy pace','minutes'),{sets:1,seconds:600,text:'10 minutes, easy pace'});
  assert.deepEqual(parseAmount('3 × 2 minutes, 1 minute rest','minutes'),{sets:3,seconds:120,text:'3 × 2 minutes, 1 minute rest'});
  assert.deepEqual(parseAmount('1 song','minutes'),{sets:1,text:'1 song'});
});
test('routines expand rounds and finished steps save as valid workouts',()=>{
  for(const r of routines){
    const steps=routineSteps(r);
    assert.equal(steps.length,r.blocks.length*(r.rounds??1));
    const sets=completedSets(steps);
    assert.ok(sets.length<=20);
    if(sets.length) assert.equal(schemas.move.safeParse({title:r.name,date:'2026-10-05',minutes:r.minutes,sets}).success,true,r.id);
  }
});
test('swapping to an exercise counted differently uses its own starting amount',()=>{
  const [burpees]=routineSteps({id:'t',name:'t',where:'none',level:3,minutes:5,companion:'bounce',when:'',blocks:[['burpees','2 × 6']]});
  const easier=swapStep(burpees,'jumping-jacks');
  assert.equal(easier.exercise.id,'jumping-jacks');
  assert.equal(easier.amount.seconds,30);
  assert.equal(swapStep(burpees,null),burpees);
});
test('sets count in reps or seconds, never both, and older reps-only sets stay valid',()=>{
  const base={title:'Mixed',date:'2026-10-05',minutes:15};
  assert.equal(schemas.move.safeParse({...base,sets:[{exercise:'Plank',seconds:30,kg:0},{exercise:'Squat',reps:10,kg:0}]}).success,true);
  for(const bad of [{exercise:'Plank',kg:0},{exercise:'Plank',reps:5,seconds:30,kg:0},{exercise:'Plank',seconds:0,kg:0},{exercise:'Plank',seconds:3601,kg:0}]) assert.equal(schemas.move.safeParse({...base,sets:[bad]}).success,false);
  assert.equal(describeSet({exercise:'Plank',seconds:30,kg:0}),'30 sec · bodyweight');
  assert.equal(describeSet({exercise:'Walk',seconds:600,kg:0}),'10 min · bodyweight');
  assert.equal(describeSet({exercise:'Squat',reps:8,kg:20}),'8 reps · 20 kg');
  assert.equal(elapsedMinutes(10_000),1);
});
