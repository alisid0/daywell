import test from "node:test";
import assert from "node:assert/strict";
import { areaOf, dayMarks, historyRecords, inArea, plannedEntries, recentDays } from "../lib/calendar.ts";

const entries = [
  { id: "walk", kind: "move", data: { title: "Brisk walk", date: "2026-10-03", minutes: 20 } },
  { id: "oats", kind: "food", data: { title: "Berry oats", date: "2026-10-03", meal: "Breakfast", calories: 0, protein: 0, carbs: 0, fat: 0 } },
  { id: "night", kind: "sleep", data: { date: "2026-10-04", bedtime: "23:00", wakeTime: "07:00", minutes: 480, quality: "Rested" } },
  { id: "note", kind: "reflection", data: { date: "2026-10-04", text: "Slowed down at lunch" } },
  { id: "focus", kind: "session", data: { title: "Focus", date: "2026-10-04", minutes: 25 } },
  { id: "dentist", kind: "event", data: { title: "Dentist", date: "2026-10-05", allDay: false, time: "15:00", minutes: 30, location: "", notes: "", done: false } },
];

test("each record belongs to one area; plans, focus and shopping only show under everything", () => {
  assert.deepEqual(["move", "food", "sleep", "reflection", "session", "task", "event", "grocery"].map(areaOf), ["move", "eat", "sleep", "relax", "plan", "plan", "plan", "plan"]);
  assert.equal(inArea("food", "eat"), true);
  assert.equal(inArea("food", "move"), false);
  assert.equal(inArea("session", "relax"), false);
  assert.equal(inArea("session", "all"), true);
});

test("the strip covers the last seven days, ending today, across a month boundary", () => {
  assert.deepEqual(recentDays("2026-10-05"), ["2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04", "2026-10-05"]);
});

test("day marks follow the chosen area and only show unfinished plans under everything", () => {
  const records = historyRecords(entries, "2026-10-05");
  const plans = plannedEntries(entries, "2026-09-29", "2026-10-05");
  assert.deepEqual(dayMarks(records, plans, "2026-10-03", "all"), ["move", "eat"]);
  assert.deepEqual(dayMarks(records, plans, "2026-10-03", "move"), ["move"]);
  assert.deepEqual(dayMarks(records, plans, "2026-10-03", "sleep"), []);
  assert.deepEqual(dayMarks(records, plans, "2026-10-04", "all"), ["sleep", "relax", "plan"]);
  assert.deepEqual(dayMarks(records, plans, "2026-10-04", "relax"), ["relax"]);
  assert.deepEqual(dayMarks(records, plans, "2026-10-05", "all"), ["plan"]);
  assert.deepEqual(dayMarks(records, plans, "2026-10-05", "eat"), []);
  const donePlan = [{ ...plans[0], data: { ...plans[0].data, done: true } }];
  assert.deepEqual(dayMarks([], donePlan, "2026-10-05", "all"), []);
});
