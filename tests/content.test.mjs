import test from 'node:test';
import assert from 'node:assert/strict';
import companions from '../content/companions.json' with { type: 'json' };
import recipes from '../content/recipes.json' with { type: 'json' };
import workouts from '../content/workouts.json' with { type: 'json' };
import { companionsSchema, recipesSchema, workoutsSchema } from '../lib/content-schema.ts';
import { pillars } from '../lib/wellbeing.ts';

const check = (schema, data, file) => {
  const result = schema.safeParse(data);
  assert.ok(result.success, `${file}: ${result.success ? '' : result.error.issues.map(i => `${i.path.join('.')} ${i.message}`).join('; ')}`);
};

test('content files follow their schemas',()=>{
  check(companionsSchema, companions, 'content/companions.json');
  check(recipesSchema, recipes, 'content/recipes.json');
  check(workoutsSchema, workouts, 'content/workouts.json');
});
test('content ids are unique and every reference points to something real',()=>{
  const recipeIds = recipes.map(r => r.id), exerciseIds = workouts.exercises.map(e => e.id), routineIds = workouts.routines.map(r => r.id);
  for (const [name, ids] of [['recipe', recipeIds], ['exercise', exerciseIds], ['routine', routineIds]]) assert.equal(new Set(ids).size, ids.length, `duplicate ${name} id`);
  assert.equal(new Set(Object.values(companions).map(c => c.module)).size, Object.keys(companions).length, 'each companion needs its own module');
  for (const r of workouts.routines) assert.ok(companions[r.companion], `routine ${r.id} uses unknown companion ${r.companion}`);
  for (const p of pillars) assert.ok(companions[p.companion], `pillar ${p.id} uses unknown companion ${p.companion}`);
});
test('content checks catch common editing mistakes',()=>{
  const pip = companions.pip;
  assert.equal(companionsSchema.safeParse({ pip: { ...pip, colour: 'gold' } }).success, false);
  assert.equal(companionsSchema.safeParse({ pip: { ...pip, lines: { ...pip.lines, happy: '' } } }).success, false);
  assert.equal(recipesSchema.safeParse([{ ...recipes[0], ingredients: [] }]).success, false);
  assert.equal(workoutsSchema.safeParse({ ...workouts, exercises: [{ ...workouts.exercises[0], level: 4 }] }).success, false);
  assert.equal(workoutsSchema.safeParse({ ...workouts, routines: [{ ...workouts.routines[0], typo: true }] }).success, false);
});
