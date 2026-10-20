import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import manifest from "../content/exercise-pictures.json" with { type: "json" };
import workouts from "../content/workouts.json" with { type: "json" };
import { exercisePicture } from "../lib/exercise-pictures.ts";
import { defaults, settingsSchema } from "../lib/daywell.ts";

test("every listed workout picture is a real exercise with its files, and no stray files ship", () => {
  const ids = new Set(workouts.exercises.map(e => e.id));
  for (const [figure, list] of Object.entries(manifest.figures)) {
    const expected = [];
    for (const [id, { frames, aspect }] of Object.entries(list)) {
      assert.ok(ids.has(id), `${figure}/${id} is not in content/workouts.json`);
      assert.ok(frames === 1 || frames === 2, `${figure}/${id} has ${frames} frames`);
      assert.ok(aspect > 0.2 && aspect < 5, `${figure}/${id} has an unlikely shape, ${aspect}`);
      for (let i = 1; i <= frames; i++) expected.push(`${id}-${i}.webp`);
    }
    assert.deepEqual(readdirSync(new URL(`../public/move-guides/${figure}/`, import.meta.url)).sort(), expected.sort());
  }
});

test("pictures follow the chosen figure, and use the other figure until the chosen one is made", () => {
  const squat = exercisePicture("squat", "male");
  assert.equal(squat.figure, "male");
  assert.deepEqual(squat.frames, ["/move-guides/male/squat-1.webp", "/move-guides/male/squat-2.webp"]);
  assert.deepEqual(exercisePicture("plank", "female").frames, ["/move-guides/female/plank-1.webp"]);
  assert.ok(exercisePicture("plank", "female").aspect > 4 / 3, "a plank is wider than it is tall");
  const femaleOnly = Object.keys(manifest.figures.female).find(id => !manifest.figures.male?.[id]);
  if (femaleOnly) assert.equal(exercisePicture(femaleOnly, "male").figure, "female");
  assert.equal(exercisePicture("not-an-exercise", "female"), null);
});

test("the figure in workout pictures is a setting: female unless the person picks male", () => {
  assert.equal(defaults.guideFigure, "female");
  assert.equal(settingsSchema.parse({ ...defaults, guideFigure: "male" }).guideFigure, "male");
  assert.equal(settingsSchema.safeParse({ ...defaults, guideFigure: "other" }).success, false);
  const { guideFigure, ...older } = defaults;
  assert.equal(settingsSchema.parse(older).guideFigure, "female");
});
