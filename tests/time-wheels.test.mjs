import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { clockLabel, clockParts, clockValue, lengthLabel, lengthParts, lengthValue, recentredRow, wheelCopies, wheelIndex, WHEEL_ROWS } from '../lib/time-wheels.ts';

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('an endless wheel stacks an odd number of copies, about 600 rows, and a plain wheel one', () => {
  for (const count of [2, 12, 13, 24, 60]) {
    const copies = wheelCopies(count);
    assert.equal(copies % 2, 1, `${count} values`);
    assert.ok(copies * count >= WHEEL_ROWS);
  }
  assert.equal(wheelCopies(2, false), 1);
});

test('every row shows a value, so 59 runs on to 00 and 12 comes back round', () => {
  assert.equal(wheelIndex(60, 60), 0);
  assert.equal(wheelIndex(-1, 12), 11);
  assert.equal(wheelIndex(25, 12), 1);
});

test('a wheel that settles two laps from the middle jumps to the same value there', () => {
  // 12 values in 51 copies: the middle copy starts at row 300.
  assert.equal(recentredRow(305, 12, 51), 305);
  assert.equal(recentredRow(320, 12, 51), 320);
  assert.equal(recentredRow(335, 12, 51), 311);
  assert.equal(recentredRow(10, 12, 51), 310);
});

test('clock times read as hour, five-minute step and am or pm, and back', () => {
  assert.deepEqual(clockParts('22:30'), { hour: 10, minute: 30, pm: true });
  assert.deepEqual(clockParts('06:47'), { hour: 6, minute: 45, pm: false });
  assert.deepEqual(clockParts('06:58'), { hour: 7, minute: 0, pm: false });
  assert.deepEqual(clockParts('23:58'), { hour: 12, minute: 0, pm: false });
  assert.deepEqual(clockParts('12:00'), { hour: 12, minute: 0, pm: true });
  assert.deepEqual(clockParts('00:05'), { hour: 12, minute: 5, pm: false });
  assert.deepEqual(clockParts(undefined), { hour: 9, minute: 0, pm: false });
  assert.deepEqual(clockParts('7am'), { hour: 9, minute: 0, pm: false });
  assert.equal(clockValue(12, 0, false), '00:00');
  assert.equal(clockValue(12, 30, true), '12:30');
  assert.equal(clockValue(7, 5, true), '19:05');
  assert.equal(clockLabel('19:05'), '7:05 pm');
  assert.equal(clockLabel(''), '9:00 am');
});

test('lengths split into hours and minutes, stay inside the field’s limits and read as words', () => {
  assert.deepEqual(lengthParts(95), { hours: 1, minutes: 35 });
  assert.deepEqual(lengthParts(-4), { hours: 0, minutes: 0 });
  assert.equal(lengthValue(0, 0), 1);
  assert.equal(lengthValue(1, 30), 90);
  assert.equal(lengthValue(4, 30, 1, 240), 240);
  assert.equal(lengthLabel(45), '45 min');
  assert.equal(lengthLabel(60), '1 h');
  assert.equal(lengthLabel(90), '1 h 30 min');
});

test('the phone’s own time and minute boxes are gone from the places that now use wheels', () => {
  const dialogs = read('app/dialogs.tsx');
  assert.doesNotMatch(dialogs, /type="time"/);
  assert.doesNotMatch(dialogs, /label="Minutes"|Duration \(minutes\)/);
  assert.doesNotMatch(read('app/evening-times.tsx'), /type="time"/);
  assert.doesNotMatch(read('app/modules.tsx'), /Custom duration \(minutes\)/);
  assert.match(read('app/move-record.tsx'), /<LengthWheels/);
});

test('the calendar shows a week strip instead of the month grid, and plan lengths read as words', () => {
  const calendar = read('app/calendar-workspace.tsx');
  assert.match(calendar, /className="calendar-week"/);
  assert.doesNotMatch(calendar, /calendar-days|calendar-weekdays/);
  assert.match(calendar, /lengthLabel\(entry\.data\.minutes\)/);
});

test('wheel rows in the stylesheet match the 48 px the component scrolls by', () => {
  assert.match(read('app/time-wheels.css'), /\.time-wheel li\s*\{\s*height:\s*48px/);
  assert.match(read('app/time-wheels.tsx'), /const ROW = 48;/);
});
