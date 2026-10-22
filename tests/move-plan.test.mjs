import test from 'node:test';
import assert from 'node:assert/strict';
import { settingsSchema, defaults } from '../lib/daywell.ts';
import { routines } from '../lib/workouts.ts';
import { areasWorked, dueSentence, minutesByDay, newBests, nextStep, otherOptions, plural, routineById, routineOutline, sevenDaysTo, suggestToday, targetReps, walkBest, weekNote, weekOf, workedIn } from '../lib/move-plan.ts';

const day = '2026-10-14'; // a Wednesday
const move = (date, title, minutes, sets) => ({ id: `${date}-${title}`, kind: 'move', data: { title, date, minutes, ...(sets ? { sets } : {}) } });
const reps = (exercise, n, count = 1) => Array.from({ length: count }, () => ({ exercise, reps: n, kg: 0 }));
// Sam's fortnight, as in the approved design: push-ups up from 8 to 12, four days moved in the last seven.
const sam = [
  move('2026-10-01', 'Walk', 20),
  move('2026-10-02', 'Hotel room fifteen', 15, [...reps('Bodyweight squat', 12, 2), ...reps('Push-up', 8, 2)]),
  move('2026-10-05', 'Hotel room fifteen', 15, reps('Push-up', 8, 2)),
  move('2026-10-09', 'Core in ten', 10, [...reps('Dead bug', 6, 2), ...reps('Push-up', 12), ...reps('Push-up', 10)]),
  move('2026-10-11', 'Walk to the park', 25),
  move('2026-10-12', 'Desk break', 5),
  move('2026-10-13', 'After-meal stroll', 15),
];

test('weeks run Monday to Sunday, and the look back covers the seven days to today', () => {
  assert.deepEqual(weekOf(day), ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18']);
  assert.deepEqual(weekOf('2026-10-18'), weekOf(day));
  assert.deepEqual(sevenDaysTo(day), ['2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14']);
  const minutes = minutesByDay(sam, weekOf(day));
  assert.deepEqual([...minutes], [['2026-10-12', 5], ['2026-10-13', 15]]);
});

test('what a move worked comes from its exercises, or from the kind of activity', () => {
  assert.deepEqual(workedIn(sam[3]), ['Core', 'Push']);
  assert.deepEqual(workedIn(move(day, 'Evening swim', 30)), ['Swims']);
  assert.deepEqual(workedIn(move(day, 'Something new', 30)), ['Other']);
  assert.deepEqual(workedIn(move(day, 'Mine', 10, reps('My own move', 5))), ['Strength']);
  assert.deepEqual(areasWorked(sam, day), [['Walks', 2], ['Core', 1], ['Push', 1], ['Stretch', 1]]);
});

test('someone new starts gentle, and a long day is followed by something gentle', () => {
  const first = suggestToday([], day);
  assert.equal(first.routine.id, 'first-steps-strength');
  assert.equal(first.first, true);
  const tired = suggestToday([...sam, move('2026-10-13', 'Long hike', 90)], day);
  assert.equal(tired.routine.level, 1);
  assert.equal(tired.reason, "Something gentle after yesterday's 105 minutes.");
});

test('the suggestion fills strength areas that are due, in places the person has used', () => {
  const pick = suggestToday(sam, day);
  assert.equal(pick.routine.id, 'travel-fifteen');
  assert.equal(pick.reason, 'Legs and back are due a strength day.');
  assert.notEqual(pick.routine.where, 'gym');
  const kettlebell = [move('2026-10-06', 'One kettlebell, steady strength', 15, reps('Kettlebell deadlift', 8, 2))];
  assert.equal(suggestToday(kettlebell, day).routine.id, 'one-kettlebell');
  assert.equal(dueSentence(['core']), 'Core is due a strength day.');
  assert.equal(dueSentence(['legs', 'push', 'pull']), 'Legs, arms and back are due a strength day.');
});

test('not today offers shorter, no-kit and gentler choices that exist', () => {
  const kettlebell = routineById.get('one-kettlebell');
  const used = [move('2026-10-06', kettlebell.name, 15)];
  const options = otherOptions(kettlebell, used, day);
  assert.equal(options.shorter?.id, 'desk-break');
  assert.equal(options.noKit?.id, 'travel-fifteen');
  assert.equal(options.gentler?.id, 'first-steps-strength');
  const gentle = otherOptions(routineById.get('first-steps-strength'), [], day);
  assert.equal(gentle.noKit, null);
  assert.equal(gentle.gentler, null);
  for (const r of routines) for (const option of Object.values(otherOptions(r, used, day))) if (option) assert.notEqual(option.id, r.id);
});

test('before you start lists moves once, then the repeated round', () => {
  const kettlebell = routineOutline(routineById.get('one-kettlebell'));
  assert.deepEqual(kettlebell.first.map(i => i.id), ['march-in-place', 'hip-hinge-practice']);
  assert.deepEqual(kettlebell.repeat.map(i => [i.name, i.text]), [['Kettlebell deadlift', '8 controlled reps'], ['Kettlebell goblet squat', '6 controlled reps'], ['Kettlebell carry', '20 seconds each hand']]);
  assert.equal(kettlebell.times, 2);
  const core = routineOutline(routineById.get('core-ten'));
  assert.equal(core.times, 2);
  assert.equal(core.first.length, 0);
  const desk = routineOutline(routineById.get('desk-break'));
  assert.equal(desk.times, 1);
  assert.equal(desk.first.length, 5);
  for (const r of routines) { const o = routineOutline(r); assert.ok(o.first.length + o.repeat.length > 0, r.id); }
});

test('bests, the week note and rest days read as good news', () => {
  assert.deepEqual(newBests(sam, day), [{ exercise: 'Push-up', best: 12, previous: 8, date: '2026-10-09' }]);
  assert.deepEqual(walkBest(sam, day), { minutes: 25, previous: 20 });
  assert.equal(weekNote(sam, day), 'You moved on 4 of the last 7 days, 55 minutes in all. Your push-ups went from 8 to 12 in a set. Your 2 rest days count too.');
  assert.match(weekNote([], day), /^No moves in the last 7 days, and that's okay/);
  assert.equal(weekNote([move('2026-10-13', 'Walk', 10)], day), 'You moved on 1 of the last 7 days, 10 minutes in all. Your 5 rest days count too.');
  assert.equal(plural('Push-up'), 'push-ups');
  assert.equal(plural('Calf raises'), 'calf raises');
  assert.equal(plural('Leg press'), 'leg presses');
  assert.equal(plural('Pull-up (assisted if needed)'), 'pull-ups');
});

test('a new best suggests two more reps a set, once per best', () => {
  assert.deepEqual(nextStep(sam, day, {}), { exercise: 'Push-up', sets: 2, from: 8, to: 10, best: 12, date: '2026-10-09' });
  assert.equal(nextStep(sam, day, { 'push-up': { reps: 10, best: 12 } }), null);
  assert.equal(nextStep(sam, day, { 'push-up': { reps: 8, best: 12 } }), null);
  assert.deepEqual(nextStep(sam, day, { 'push-up': { reps: 10, best: 10 } }), { exercise: 'Push-up', sets: 2, from: 10, to: 12, best: 12, date: '2026-10-09' });
  assert.equal(targetReps({ name: 'Push-up' }, { 'push-up': { reps: 10, best: 12 } }), 10);
  assert.equal(targetReps({ name: 'Plank' }, { 'push-up': { reps: 10, best: 12 } }), undefined);
});

test('move targets are an optional setting with limits', () => {
  assert.deepEqual(defaults.moveTargets, {});
  const saved = settingsSchema.parse({ ...defaults, moveTargets: { 'push-up': { reps: 10, best: 12 } } });
  assert.deepEqual(saved.moveTargets, { 'push-up': { reps: 10, best: 12 } });
  assert.equal(settingsSchema.safeParse({ ...defaults, moveTargets: { 'push-up': { reps: 0, best: 12 } } }).success, false);
  const many = Object.fromEntries(Array.from({ length: 101 }, (_, i) => [`move ${i}`, { reps: 5, best: 5 }]));
  assert.equal(settingsSchema.safeParse({ ...defaults, moveTargets: many }).success, false);
});
