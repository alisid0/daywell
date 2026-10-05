import test from "node:test";
import assert from "node:assert/strict";
import { validDay, shiftDay, shiftMonth, monthDays, stampCompletions, plannedEntries, historyRecords, progressTotals, monthlyProgress, calendarFile, historyCsv } from "../lib/calendar.ts";
import { schemas, today } from "../lib/daywell.ts";
import { parseHostRequest } from "../lib/host.ts";

const task = (id, date, done = false, completedDate) => ({ id, kind: "task", data: { title: id, date, done, minutes: 25, ...(completedDate ? { completedDate } : {}) } });
const event = (data = {}) => ({ id: "evt", kind: "event", data: { title: "A walk", date: "2026-10-25", time: "15:00", allDay: false, minutes: 30, location: "The park", notes: "", done: false, ...data } });

test("calendar handles leap days, month boundaries and Monday-first weeks", () => {
  assert.equal(validDay("2024-02-29"), true);
  assert.equal(validDay("2026-02-29"), false);
  assert.equal(shiftDay("2024-02-28", 1), "2024-02-29");
  assert.equal(shiftMonth("2026-01-31", 1), "2026-02-01");
  const days = monthDays("2026-10-01");
  assert.equal(days.length, 42); assert.equal(days[0], "2026-09-28");
  assert.equal(new Set(days).size, 42);
});
test("completion dates reflect completion, not an overdue planning date", () => {
  const old = task("priority", "2026-09-10");
  const [saved] = stampCompletions([{ ...old, data: { ...old.data, done: true } }], [old], "2026-10-04", "2026-10-04T10:00:00.000Z");
  assert.equal(saved.data.completedDate, "2026-10-04");
  assert.equal(saved.data.date, "2026-09-10");
  const [edited] = stampCompletions([{ ...saved, data: { ...saved.data, date: "2026-11-01" } }], [saved], "2026-10-05", "2026-10-05T10:00:00.000Z");
  assert.equal(edited.data.completedDate, "2026-10-04");
  assert.equal(schemas.task.parse(edited.data).completedAt, "2026-10-04T10:00:00.000Z");
});
test("reopen clears completion; legacy completed records are never silently backdated", () => {
  const old = task("legacy", "2026-09-10", true);
  const [edited] = stampCompletions([{ ...old, data: { ...old.data, title: "Renamed" } }], [old], "2026-10-04", "2026-10-04T10:00:00.000Z");
  assert.equal(edited.data.completedDate, undefined);
  const completed = task("new", "2026-09-10", true, "2026-10-04");
  const [reopened] = stampCompletions([{ ...completed, data: { ...completed.data, done: false } }], [completed], "2026-10-05", "2026-10-05T10:00:00.000Z");
  assert.equal(reopened.data.completedDate, null);
});
test("history separates actual records, future plans and undated legacy completions", () => {
  const entries = [task("old", "2026-09-10", true), task("done", "2026-09-10", true, "2026-10-04"), task("future", "2026-11-01"), event(),
    { id: "focus", kind: "session", data: { title: "Email", date: "2026-10-04", minutes: 10 } },
    { id: "walk", kind: "move", data: { title: "Walk", date: "2026-10-04", minutes: 15 } },
    { id: "future-log", kind: "move", data: { title: "Future", date: "2026-11-04", minutes: 100 } }];
  const rows = historyRecords(entries, "2026-10-04");
  assert.equal(rows.length, 4);
  assert.equal(rows.find(row => row.entry.id === "old").date, null);
  const totals = progressTotals(rows.filter(row => row.date));
  assert.deepEqual(totals, { tasks: 1, focus: 10, movement: 15, rest: 0, notes: 0 });
  assert.equal(monthlyProgress(rows, "2026-10-04").at(-1).tasks, 1);
  assert.deepEqual(plannedEntries(entries, "2026-10-01", "2026-10-31").map(e => e.id), ["evt"]);
});
test("calendar files preserve all-day dates, local appointment instants, stable IDs and escaping", () => {
  const timed = event({ title: "Coffee, tea; a chat\\hello\nnext", notes: "Two lines\nA second line" });
  const output = calendarFile([task("t", "2026-12-31"), timed, task("done", "2026-10-01", true)], new Date("2026-10-04T10:00:00Z"));
  assert.match(output, /DTSTART;VALUE=DATE:20261231\r\nDTEND;VALUE=DATE:20270101/);
  assert.match(output, /UID:evt@daywell.local/);
  assert.equal((output.match(/BEGIN:VEVENT/g) || []).length, 2);
  const expected = new Date("2026-10-25T15:00:00").toISOString().replace(/[-:]/g, "").replace(".000Z", "Z");
  assert.ok(output.includes(`DTSTART:${expected}`));
  assert.ok(output.includes("Coffee\\, tea\\; a chat\\\\hello\\nnext"));
  assert.ok(output.endsWith("END:VCALENDAR\r\n"));
});
test("calendar export folds UTF-8 lines without corrupting characters and excludes private history", () => {
  const output = calendarFile([event({ title: "🌱".repeat(60) }), { id: "note", kind: "reflection", data: { date: "2026-10-04", text: "Personal reflection" } }]);
  assert.ok(output.split("\r\n").every(line => Buffer.byteLength(line, "utf8") <= 75));
  assert.ok(output.replace(/\r\n /g, "").includes("🌱".repeat(60)));
  assert.equal(output.includes("Personal reflection"), false);
});
test("history export quotes multiline text and neutralizes spreadsheet formulas", () => {
  const record = { entry: { id: "note", kind: "reflection", data: {} }, date: "2026-10-04", title: "=2+2", detail: 'A "small" step\nToday', minutes: 0 };
  const csv = historyCsv([record]);
  assert.ok(csv.includes('"\'=2+2"'));
  assert.ok(csv.includes('"A ""small"" step\nToday"'));
});
test("calendar and history remain available through the one host", () => {
  assert.deepEqual(parseHostRequest("Show my calendar"), { type: "open", module: "calendar", view: "plan" });
  assert.deepEqual(parseHostRequest("Show my progress"), { type: "open", module: "calendar", view: "history" });
  assert.equal(parseHostRequest("Plan an event").kind, "event");
  assert.equal(parseHostRequest("Add a reflection").kind, "reflection");
  assert.equal(schemas.event.safeParse(event().data).success, true);
  assert.equal(schemas.reflection.safeParse({ date: "2026-10-04", text: "  " }).success, false);
});

test("saved dates reject impossible days and delayed timer records keep their local finish date", () => {
  assert.equal(schemas.event.safeParse(event({ date: "2026-02-30" }).data).success, false);
  assert.equal(schemas.reflection.safeParse({ date: "2026-13-01", text: "A step" }).success, false);
  const previousNight = new Date(2026, 9, 3, 23, 58).getTime();
  assert.equal(today(previousNight), "2026-10-03");
});
