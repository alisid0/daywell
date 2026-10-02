import test from "node:test";
import assert from "node:assert/strict";
import { filterTasks, formatDuration, timerTitle } from "../lib/routines.ts";
import { schemas, sleepMinutes } from "../lib/daywell.ts";

const task = (id, date, done = false) => ({ id, kind: "task", data: { title: id, date, done, minutes: 25 } });
const entries = [task("future", "2026-10-03"), task("finished", "2026-10-01", true), task("today", "2026-10-02"), task("overdue", "2026-10-01")];
test("Today keeps unfinished previous priorities visible and excludes completed or future tasks", () => {
  assert.deepEqual(filterTasks(entries, "today", "2026-10-02").map(e => e.id), ["overdue", "today"]);
});
test("task views separate future and completed work without mutating stored order", () => {
  assert.deepEqual(filterTasks(entries, "upcoming", "2026-10-02").map(e => e.id), ["future"]);
  assert.deepEqual(filterTasks(entries, "completed", "2026-10-02").map(e => e.id), ["finished"]);
  assert.deepEqual(entries.map(e => e.id), ["future", "finished", "today", "overdue"]);
  assert.equal(filterTasks([{ id: "grocery", kind: "grocery", data: {} }], "all", "2026-10-02").length, 0);
});
test("stopwatch preserves elapsed hours beyond midnight and clamps clock skew", () => {
  assert.equal(formatDuration(90061), "25:01:01");
  assert.equal(formatDuration(-1), "00:00:00");
  assert.equal(formatDuration(65.9), "00:01:05");
});
test("switching timer modes replaces the old task title", () => {
  assert.equal(timerTitle("Focus"), "One thing at a time.");
  assert.equal(timerTitle("Break"), "A little breathing room.");
  assert.equal(timerTitle("Timer"), "Time for your thing.");
});
test("overnight sleep and entry validation retain their limits", () => {
  assert.equal(sleepMinutes("22:30", "07:00"), 510);
  assert.equal(schemas.task.safeParse({ title: "   ", date: "2026-10-02", done: false, minutes: 25 }).success, false);
  assert.equal(schemas.grocery.parse({ title: " Milk ", quantity: " 2 bottles ", done: false }).quantity, "2 bottles");
  assert.equal(schemas.timer.safeParse({ title: "Timer", duration: 90000, remaining: 90000, endAt: null, mode: "Timer" }).success, false);
});
