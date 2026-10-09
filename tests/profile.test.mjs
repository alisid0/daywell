import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { defaults, normalizeSettings, settingsSchema } from "../lib/daywell.ts";
import { MAX_WEIGHT_RECORDS, calorieEstimate, calorieGuide, fromFeetInches, fromStonePounds, toFeetInches, toStonePounds, withWeight } from "../lib/profile.ts";
import { UNDER_AGE, checkDraft, draftFrom, guidePreview, withHeightUnit, withWeightUnit } from "../lib/profile-form.ts";

const AT = new Date("2026-10-09T12:00:00").getTime();
const thisYear = new Date().getFullYear();
const adult = { ...defaults, onboarded: true, birthYear: 1991 };
const agreed = "2026-09-01T10:00:00.000Z";

test("the estimate is Mifflin–St Jeor for a lightly active day, rounded to 50 kcal", () => {
  assert.equal(calorieEstimate({ age: 35, heightCm: 165, weightKg: 70, sex: "female" }), 1900);
  assert.equal(calorieEstimate({ age: 40, heightCm: 180, weightKg: 80, sex: "male" }), 2400);
  // Without a stated sex it uses the midpoint of the two formulas.
  assert.equal(calorieEstimate({ age: 35, heightCm: 165, weightKg: 70, sex: "unspecified" }), 2050);
  assert.equal(calorieEstimate({ age: 35, heightCm: 165, weightKg: 70, sex: null }), 2050);
});

test("the daily guide shows only with calorie tracking on, and the person's own number comes first", () => {
  const details = { ...adult, sex: "female", heightCm: 165, weights: [{ date: "2026-08-01", kg: 90 }, { date: "2026-10-01", kg: 70 }], bodyConsentAt: agreed };
  assert.equal(calorieGuide({ ...details, calorieTracking: false }, AT), null);
  assert.deepEqual(calorieGuide({ ...details, calorieTracking: true }, AT), { kcal: 1900, source: "estimate" });
  assert.deepEqual(calorieGuide({ ...details, calorieTracking: true, calorieGoal: 1800 }, AT), { kcal: 1800, source: "own" });
  assert.equal(calorieGuide({ ...details, calorieTracking: true, heightCm: null }, AT), null);
  assert.equal(calorieGuide({ ...details, calorieTracking: true, weights: [] }, AT), null);
});

test("settings refuse an age under 18, and height or weight without the person's OK", () => {
  assert.equal(settingsSchema.safeParse(adult).success, true);
  assert.equal(settingsSchema.safeParse({ ...adult, birthYear: thisYear - 17 }).success, false);
  assert.equal(settingsSchema.safeParse({ ...adult, birthYear: thisYear - 18 }).success, true);
  assert.equal(settingsSchema.safeParse({ ...adult, heightCm: 165 }).success, false);
  assert.equal(settingsSchema.safeParse({ ...adult, weights: [{ date: "2026-10-09", kg: 70 }] }).success, false);
  assert.equal(settingsSchema.safeParse({ ...adult, heightCm: 165, weights: [{ date: "2026-10-09", kg: 70 }], bodyConsentAt: agreed }).success, true);
  assert.equal(settingsSchema.safeParse({ ...adult, heightCm: 300, bodyConsentAt: agreed }).success, false);
});

test("older settings move to one calorie tracking switch, and the old 2,000 default gives way to the estimate", () => {
  const old = { name: "Alex", modules: ["food"], calorieGoal: 2000, bedtime: "22:30", wakeTime: "07:00", onboarded: true, guideDismissed: true };
  const moved = normalizeSettings(old);
  assert.equal(moved.calorieTracking, true);
  assert.equal(moved.calorieGoal, 0);
  assert.equal(moved.birthYear, null);
  assert.deepEqual(moved.weights, []);
  assert.equal(moved.name, "Alex");
  assert.deepEqual([normalizeSettings({ ...old, calorieGoal: 1800 }).calorieTracking, normalizeSettings({ ...old, calorieGoal: 1800 }).calorieGoal], [true, 1800]);
  assert.equal(normalizeSettings({ ...old, calorieGoal: 0 }).calorieTracking, false);
  assert.equal(normalizeSettings({ ...old, calorieGoal: 0, activityCalories: true }).calorieTracking, true);
  assert.equal("activityCalories" in normalizeSettings({ ...old, activityCalories: true }), false);
  // Settings saved by this version keep their own switch.
  assert.equal(normalizeSettings({ ...old, calorieTracking: false, calorieGoal: 1800 }).calorieTracking, false);
  assert.deepEqual(normalizeSettings(null), defaults);
});

test("weights keep one entry a day, oldest first, up to the record limit", () => {
  let weights = withWeight([], "2026-10-09", 70.04);
  assert.deepEqual(weights, [{ date: "2026-10-09", kg: 70 }]);
  weights = withWeight(weights, "2026-10-09", 70.5);
  assert.deepEqual(weights, [{ date: "2026-10-09", kg: 70.5 }]);
  weights = withWeight(weights, "2026-09-01", 71);
  assert.deepEqual(weights.map(w => w.date), ["2026-09-01", "2026-10-09"]);
  let many = [];
  for (let i = 0; i < MAX_WEIGHT_RECORDS + 5; i++) many = withWeight(many, new Date(Date.UTC(2020, 0, 1 + i)).toISOString().slice(0, 10), 70);
  assert.equal(many.length, MAX_WEIGHT_RECORDS);
  assert.equal(many[0].date, "2020-01-06");
});

test("imperial units convert both ways, and switching back shows the saved number", () => {
  assert.deepEqual(toFeetInches(165), { feet: 5, inches: 5 });
  assert.equal(Math.round(fromFeetInches(5, 5)), 165);
  assert.deepEqual(toStonePounds(70), { stone: 11, pounds: 0 });
  assert.equal(Math.round(fromStonePounds(11, 0)), 70);
  const saved = { ...adult, heightCm: 165, weights: [{ date: "2026-09-01", kg: 70 }], bodyConsentAt: agreed };
  const imperial = draftFrom(saved, { height: "ftin", weight: "stlb" }, AT);
  assert.deepEqual([imperial.feet, imperial.inches, imperial.stone, imperial.pounds], ["5", "5", "11", "0"]);
  const back = withWeightUnit(withHeightUnit(imperial, "cm", 165), "kg", 70);
  assert.deepEqual([back.cm, back.kg], ["165", "70"]);
});

test("About you needs an adult age, keeps the rest optional and asks before keeping height and weight", () => {
  const empty = draftFrom(defaults, {}, AT);
  assert.equal(checkDraft(empty, defaults, AT).problems.age, "Add your age to continue.");
  assert.equal(checkDraft({ ...empty, age: "17" }, defaults, AT).problems.age, UNDER_AGE);
  assert.equal(checkDraft({ ...empty, age: "3.5" }, defaults, AT).problems.age, "Check your age. Use whole numbers, like 35.");
  assert.deepEqual(checkDraft({ ...empty, age: "35" }, defaults, AT).patch, { birthYear: 1991, sex: null, heightCm: null, weights: [], bodyConsentAt: null, calorieTracking: false, calorieGoal: 0 });
  assert.match(checkDraft({ ...empty, age: "35", cm: "165" }, defaults, AT).problems.consent, /Tick the box/);
  const wrong = checkDraft({ ...empty, age: "35", cm: "16", consent: true }, defaults, AT).problems;
  assert.equal(wrong.badHeight, true);
  assert.match(wrong.body, /height doesn’t look right/);
  const kept = checkDraft({ ...empty, age: "35", cm: "165", kg: "70", consent: true, sex: "female", calorieTracking: true }, defaults, AT).patch;
  assert.equal(kept.heightCm, 165);
  assert.deepEqual(kept.weights, [{ date: "2026-10-09", kg: 70 }]);
  assert.equal(kept.bodyConsentAt, new Date(AT).toISOString());
  assert.equal(settingsSchema.safeParse({ ...defaults, ...kept, onboarded: true }).success, true);
});

test("Your details adds today's weight only when it changes, in either units", () => {
  const saved = { ...adult, sex: "female", heightCm: 165, weights: [{ date: "2026-09-01", kg: 70 }], bodyConsentAt: agreed };
  const draft = draftFrom(saved, {}, AT);
  assert.deepEqual(checkDraft(draft, saved, AT).patch.weights, saved.weights);
  const same = checkDraft(draftFrom(saved, { height: "ftin", weight: "stlb" }, AT), saved, AT).patch;
  assert.deepEqual([same.heightCm, same.weights], [165, saved.weights]);
  assert.deepEqual(checkDraft({ ...draft, kg: "69" }, saved, AT).patch.weights, [{ date: "2026-09-01", kg: 70 }, { date: "2026-10-09", kg: 69 }]);
  // A blank weight keeps the record; deleting height and weight is its own action.
  assert.deepEqual(checkDraft({ ...draft, kg: "" }, saved, AT).patch.weights, saved.weights);
  assert.equal(checkDraft({ ...draft, kg: "" }, saved, AT).patch.bodyConsentAt, agreed);
});

test("the note under calorie tracking says what's missing", () => {
  const base = { ...draftFrom(defaults, {}, AT), calorieTracking: true };
  assert.deepEqual(guidePreview({ ...base, calorieTracking: false }, defaults), { kind: "off" });
  assert.deepEqual(guidePreview(base, defaults), { kind: "needs-age" });
  assert.deepEqual(guidePreview({ ...base, age: "35" }, defaults), { kind: "needs-body" });
  assert.deepEqual(guidePreview({ ...base, age: "35", cm: "165", kg: "70", sex: "female" }, defaults), { kind: "estimate", kcal: 1900, averaged: false });
  assert.deepEqual(guidePreview({ ...base, age: "35", cm: "165", kg: "70" }, defaults), { kind: "estimate", kcal: 2050, averaged: true });
  assert.deepEqual(guidePreview({ ...base, ownNumber: "1800" }, defaults), { kind: "own", kcal: 1800 });
});

test("profile details stay out of the code that talks to AI services", () => {
  const aiFacing = ["app/api/capture/route.ts", "app/api/voice/route.ts", "lib/capture.ts", "lib/voice-tools.ts", "app/use-eleven-agent.ts"];
  for (const file of aiFacing) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    for (const field of ["birthYear", "heightCm", "weights", "bodyConsentAt", ".sex", "calorieGuide", "calorieTracking"]) assert.equal(source.includes(field), false, `${file} mentions ${field}`);
  }
});
