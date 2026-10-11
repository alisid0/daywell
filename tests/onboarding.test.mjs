import test from "node:test";
import assert from "node:assert/strict";
import { defaults, settingsSchema } from "../lib/daywell.ts";
import { hasTriedStep, starterModules, stepsFor } from "../lib/onboarding.ts";

test("first-run instructions only offer enabled tools, including single-tool setups", () => {
  assert.deepEqual(stepsFor(starterModules).map(s => s.module), ["focus", "grocery", "clock"]);
  assert.deepEqual(stepsFor(["alarm"]).map(s => s.kind), ["alarm"]);
  assert.deepEqual(stepsFor([]), []);
});
test("a timer is tried only after starting or completing it, not just choosing a preset", () => {
  const timer = { id: "timer", kind: "timer", data: { duration: 1500, remaining: 1500, endAt: null } };
  assert.equal(hasTriedStep([timer], "timer"), false);
  assert.equal(hasTriedStep([{ ...timer, data: { ...timer.data, endAt: 1790986000000 } }], "timer"), true);
  assert.equal(hasTriedStep([{ ...timer, data: { ...timer.data, remaining: 1400 } }], "timer"), true);
  assert.equal(hasTriedStep([{ id: "focus-session", kind: "session", data: {} }], "timer"), true);
});
test("older settings get the guide without changing their selected tools or name", () => {
  const { guideDismissed, calorieTracking, birthYear, sex, heightCm, weights, bodyConsentAt, ...oldSettings } = defaults;
  const result = settingsSchema.parse({ ...oldSettings, name: "Alex", modules: ["grocery"], onboarded: true });
  assert.equal(result.guideDismissed, false);
  assert.equal(result.name, "Alex");
  assert.deepEqual(result.modules, ["grocery"]);
  assert.equal(settingsSchema.parse({ ...result, guideDismissed: true }).guideDismissed, true);
  // Calorie tracking is opt-in, and the About you details start empty.
  assert.equal(result.calorieTracking, false);
  assert.equal(defaults.calorieTracking, false);
  assert.equal(result.birthYear, null);
  assert.deepEqual(result.weights, []);
  assert.equal(settingsSchema.parse({ ...result, calorieTracking: true }).calorieTracking, true);
});
