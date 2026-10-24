import test from 'node:test';
import assert from 'node:assert/strict';
import { schemas } from '../lib/daywell.ts';
import { actionSchema, applyFoodCommand, emptyFoodState } from '../lib/food.ts';
import { assistantContext, assistantDraft, assistantJsonSchema, assistantRequestSchema, describeStep, dayWords, stepChanges, stepModule } from '../lib/assistant.ts';

const today = '2026-10-22'; // a Thursday
const entry = (kind, data, id = `${kind}-${Math.random()}`) => ({ id, kind, data });
const saved = {
  bedtime: '22:30', wakeTime: '07:00',
  entries: [
    entry('food', { title: 'Eggs on toast', date: '2026-10-21', meal: 'Breakfast', calories: 410, protein: 20, carbs: 30, fat: 18 }),
    entry('food', { title: 'Old soup', date: '2026-10-01', meal: 'Lunch', calories: 0, protein: 0, carbs: 0, fat: 0 }),
    entry('grocery', { title: 'Garlic', quantity: '', done: false }),
    entry('move', { title: 'Core in ten', date: '2026-10-20', minutes: 10, sets: [{ exercise: 'Push-up', reps: 12, kg: 0 }, { exercise: 'Kettlebell swing', reps: 15, kg: 12 }] }),
    entry('sleep', { date: '2026-10-22', bedtime: '23:10', wakeTime: '07:05', minutes: 475, quality: 'Rested' }),
    entry('task', { title: 'Call the bank', date: '2026-10-23', minutes: 25, done: false }),
    entry('event', { title: 'Swim', date: '2026-10-24', allDay: false, time: '18:00', minutes: 45, location: 'Pool', notes: 'Bring goggles', done: false }),
    entry('alarm', { title: 'Wake up', time: '07:00', enabled: true, days: [1, 2, 3, 4, 5] }),
  ],
  food: { version: 1, stock: [
    { id: 's1', ingredient: 'rice', quantity: 500, unit: 'g', bestBefore: null, changedBy: 'x' },
    { id: 's2', ingredient: 'tomato', quantity: 4, unit: 'each', bestBefore: null, changedBy: 'x' },
    { id: 's3', ingredient: 'spinach', quantity: 200, unit: 'g', bestBefore: '2026-10-23', changedBy: 'x' },
    { id: 's4', ingredient: 'egg', quantity: 0, unit: 'each', bestBefore: null, changedBy: 'x' },
  ], plans: [], shopping: [{ id: 'n1', title: 'Sourdough loaf', quantity: '1', done: false, changedBy: 'x' }] },
};

test('the assistant reads only the areas the person allowed, and only the fields it needs', () => {
  const food = assistantContext(['food'], saved, today);
  assert.deepEqual(food.meals, [{ date: '2026-10-21', meal: 'Breakfast', title: 'Eggs on toast' }]);
  assert.deepEqual(food.kitchen.map(lot => lot.food), ['rice', 'tomato', 'spinach']);
  assert.equal(food.kitchen[2].useBy, '2026-10-23');
  assert.deepEqual(food.trolleyList, ['Garlic', 'Sourdough loaf']);
  for (const key of ['moves', 'sleep', 'todos', 'calendar', 'alarms', 'usualTimes']) assert.equal(key in food, false, key);
  const all = assistantContext(['food', 'move', 'sleep', 'plans'], saved, today);
  assert.deepEqual(all.moves[0].sets, ['Push-up 12 reps', 'Kettlebell swing 15 reps at 12 kg']);
  assert.deepEqual(all.sleep, [{ date: '2026-10-22', bedtime: '23:10', wakeTime: '07:05', hours: 7.9, felt: 'Rested' }]);
  assert.deepEqual(all.calendar, [{ title: 'Swim', date: '2026-10-24', time: '18:00', minutes: 45 }]);
  // Meal nutrition, event notes and places, and anything about the person themselves never go.
  const sent = JSON.stringify(all);
  for (const word of ['410', 'calories', 'Pool', 'goggles', 'birth', 'height', 'kgBody', 'sex']) assert.equal(sent.includes(word), false, word);
  assert.deepEqual(Object.keys(assistantContext([], saved, today)), ['today', 'weekday']);
});

test('the request holds a short conversation that ends with the person', () => {
  const ask = messages => assistantRequestSchema.safeParse({ messages, date: today, time: '18:30' }).success;
  assert.equal(ask([{ role: 'user', text: 'What can I cook tonight?' }]), true);
  assert.equal(ask([{ role: 'user', text: 'Hi' }, { role: 'assistant', text: 'Hello' }]), false);
  assert.equal(ask([{ role: 'user', text: 'x'.repeat(1201) }]), false);
  assert.equal(ask(Array.from({ length: 13 }, () => ({ role: 'user', text: 'hi' }))), false);
  assert.equal(assistantRequestSchema.safeParse({ messages: [{ role: 'user', text: 'Hi' }], date: '2026-13-01', time: '18:30' }).success, false);
});

const step = (kind, fields) => ({ kind, title: 'x', date: null, time: null, minutes: null, meal: null, servings: null, quantity: null, ingredients: [], ...fields });
test("the model's reply is checked: allowed areas, valid steps, short chips", () => {
  const draft = assistantDraft({
    reply: '  You’ve had eggs on 3 of the last 4 days, so how about tomato rice?  ', companion: 'nori', looked: ['food', 'sleep', 'food'],
    steps: [
      step('meal', { title: 'Tomato rice', date: today, meal: 'Dinner', servings: 1, ingredients: [{ ingredient: 'rice', quantity: 150, unit: 'g' }, { ingredient: 'garlic', quantity: 0, unit: 'each' }] }),
      step('event', { title: 'Walk', date: today, time: '19:30', minutes: 20 }),
      step('shopping', { title: 'Garlic', quantity: null }),
      step('task', { title: 'Buy melatonin', date: today }),
      step('event', { title: 'Late', date: '2026-11-30', time: '10:00', minutes: 20 }),
      step('event', { title: 'No time', date: today, time: '7pm', minutes: 20 }),
      step('meal', { title: 'Nothing in it', date: today, meal: 'Lunch', servings: 1, ingredients: [] }),
      step('task', { title: 'Yesterday', date: '2026-10-21' }),
      step('task', { title: 'Tidy the desk', date: null }),
    ],
    chips: ['Plan it for tonight', 'Plan it for tonight', 'Something else', 'A chip that is much too long to show on a phone screen', 'More'],
  }, today, ['food']);
  assert.equal(draft.reply, 'You’ve had eggs on 3 of the last 4 days, so how about tomato rice?');
  assert.deepEqual(draft.looked, ['food']);
  assert.deepEqual(draft.steps.map(item => item.kind + ':' + item.title), ['meal:Tomato rice', 'event:Walk', 'shopping:Garlic', 'task:Tidy the desk']);
  assert.deepEqual(draft.steps[0].ingredients, [{ ingredient: 'rice', quantity: 150, unit: 'g' }, { ingredient: 'garlic', quantity: null, unit: 'each' }]);
  assert.equal(draft.steps[3].date, today);
  assert.deepEqual(draft.chips, ['Plan it for tonight', 'Something else', 'More']);
  assert.throws(() => assistantDraft({ reply: 'Hi', companion: 'momo', looked: [], steps: [], chips: [] }, today, ['food']));
  assert.equal(assistantJsonSchema.additionalProperties, false);
});

test('kept steps become records Daywell already accepts', () => {
  let n = 0;
  const { steps } = assistantDraft({ reply: 'Here’s the plan.', companion: 'pip', looked: [], chips: [], steps: [
    step('meal', { title: 'Tomato rice', date: today, meal: 'Dinner', servings: 2, ingredients: [{ ingredient: 'rice', quantity: 150, unit: 'g' }] }),
    step('event', { title: 'Walk', date: today, time: '19:30', minutes: 20 }), step('task', { title: 'Call the bank', date: today }), step('shopping', { title: 'Garlic', quantity: '1 bulb' }),
  ] }, today, []);
  const { entries, plans } = stepChanges(steps, () => `id-${++n}`);
  assert.deepEqual(entries.map(item => item.kind), ['event', 'task', 'grocery']);
  for (const item of entries) schemas[item.kind].parse(item.data);
  assert.equal(entries[2].data.quantity, '1 bulb');
  assert.equal(actionSchema.parse({ type: 'plan.add', plans }).plans[0].title, 'Tomato rice');
  assert.deepEqual(steps.map(stepModule), ['food', null, 'focus', 'grocery']);
  // Planned meals added together are undone together.
  const added = applyFoodCommand(emptyFoodState(), { operationId: 'plan-1', expectedRevision: 0, action: { type: 'plan.add', plans } });
  assert.equal(added.state.plans.length, 1);
  assert.equal(applyFoodCommand(added.state, { operationId: 'undo-1', expectedRevision: 1, action: { type: 'undo', operationId: 'plan-1' } }, added.effect).state.plans.length, 0);
});

test('each line of the plan says what it means, from the saved kitchen', () => {
  const meal = { kind: 'meal', title: 'tomato rice', date: today, meal: 'Dinner', servings: 1, ingredients: [{ ingredient: 'Rice', quantity: 150, unit: 'g' }, { ingredient: 'tomatoes', quantity: 2, unit: 'each' }, { ingredient: 'spinach', quantity: null, unit: 'g' }, { ingredient: 'garlic', quantity: 1, unit: 'each' }] };
  assert.deepEqual(describeStep(meal, today, saved.food), { line: 'Tomato rice for dinner tonight, for 1', detail: 'Keeps rice, tomatoes and spinach for it. Garlic goes on your trolley list' });
  assert.equal(describeStep(meal, today).detail, 'With rice, tomatoes, spinach and garlic');
  assert.deepEqual(describeStep({ kind: 'event', title: 'a 20-minute walk', date: today, time: '19:30', minutes: 20 }, today), { line: 'A 20-minute walk at 7:30 pm', detail: 'On your calendar today, for 20 minutes' });
  assert.deepEqual(describeStep({ kind: 'shopping', title: 'garlic', quantity: '' }, today), { line: 'Garlic on your trolley list', detail: '' });
  assert.equal(dayWords('2026-10-23', today), 'tomorrow');
  assert.equal(dayWords('2026-10-26', today), 'on Monday');
  assert.equal(dayWords('2026-11-02', today), 'on 2 November');
});
