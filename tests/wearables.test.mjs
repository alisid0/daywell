import test from "node:test";
import assert from "node:assert/strict";
import { sourceLabel, syncedLabel } from "../lib/wearables.ts";
import { schemas } from "../lib/daywell.ts";

test("entries a wearable added say where they came from; the person's own entries say nothing", () => {
  assert.equal(sourceLabel("whoop"), "from WHOOP");
  assert.equal(sourceLabel(undefined), "");
  assert.equal(sourceLabel("garmin"), "");
  assert.equal(sourceLabel(42), "");
});

test("the last update reads as just now, a time today, or a date", () => {
  const now = new Date(2026, 9, 17, 10, 0);
  assert.equal(syncedLabel(new Date(2026, 9, 17, 9, 59).toISOString(), now), "just now");
  assert.equal(syncedLabel(new Date(2026, 9, 17, 9, 41).toISOString(), now), "at 9:41 am");
  assert.equal(syncedLabel(new Date(2026, 9, 17, 0, 5).toISOString(), now), "at 12:05 am");
  assert.equal(syncedLabel(new Date(2026, 9, 16, 21, 30).toISOString(), now), "on 16 Oct");
  assert.equal(syncedLabel(null, now), "");
  assert.equal(syncedLabel("not a date", now), "");
});

test("a WHOOP night can wait for how the person felt, and keeps WHOOP's own id", () => {
  const night = { date: "2026-10-17", bedtime: "23:42", wakeTime: "07:05", minutes: 443, source: "whoop", externalId: "whoop-sleep-1" };
  assert.ok(schemas.sleep.safeParse(night).success);
  assert.ok(schemas.sleep.safeParse({ ...night, quality: "Rested" }).success);
  assert.equal(schemas.sleep.safeParse({ ...night, source: "garmin" }).success, false);
  assert.equal(schemas.sleep.safeParse({ ...night, externalId: "" }).success, false);
});

test("a WHOOP workout is an ordinary move with its source", () => {
  const run = { title: "Running", date: "2026-10-17", minutes: 32, source: "whoop", externalId: "whoop-workout-1" };
  assert.ok(schemas.move.safeParse(run).success);
  assert.ok(schemas.move.safeParse({ title: "Walk", date: "2026-10-17", minutes: 20 }).success);
});
