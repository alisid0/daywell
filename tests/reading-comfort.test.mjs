import test from "node:test";
import assert from "node:assert/strict";
import { applyReadingComfort, defaultReadingComfort, parseReadingComfort, readingComfortKey, readingComfortScript, readingFontOptions, readingFonts } from "../lib/reading-comfort.ts";

test("the default is Atkinson Hyperlegible at standard size and spacing, and classic Daywell stays available", () => {
  assert.deepEqual(defaultReadingComfort, { font: "atkinson", size: "standard", spacing: "standard" });
  assert.ok(readingFonts.includes("classic"));
  assert.match(readingFontOptions.classic.note, /Bricolage Grotesque/);
  for (const font of readingFonts) assert.ok(readingFontOptions[font].label && readingFontOptions[font].note, font);
});

test("saved choices are read back, and anything damaged or unknown falls back one setting at a time", () => {
  assert.deepEqual(parseReadingComfort(JSON.stringify({ font: "lexend", size: "larger", spacing: "roomy" })), { font: "lexend", size: "larger", spacing: "roomy" });
  assert.deepEqual(parseReadingComfort(JSON.stringify({ font: "comic-sans", size: "larger" })), { font: "atkinson", size: "larger", spacing: "standard" });
  for (const raw of [null, "", "not json", "[]", "null", "42"]) assert.deepEqual(parseReadingComfort(raw), defaultReadingComfort, String(raw));
});

test("choices are applied as data attributes on the page", () => {
  const root = { dataset: {} };
  applyReadingComfort(root, { font: "classic", size: "large", spacing: "roomy" });
  assert.deepEqual(root.dataset, { readingFont: "classic", readingSize: "large", readingSpacing: "roomy" });
});

test("the early script applies the saved choice, ignores bad values, and never throws", () => {
  const run = stored => {
    const dataset = {};
    const storage = { getItem: key => (key === readingComfortKey ? stored : null) };
    new Function("document", "localStorage", readingComfortScript)({ documentElement: { dataset } }, storage);
    return dataset;
  };
  assert.deepEqual(run(JSON.stringify({ font: "opendyslexic", size: "larger", spacing: "roomy" })), { readingFont: "opendyslexic", readingSize: "larger", readingSpacing: "roomy" });
  assert.deepEqual(run(JSON.stringify({ font: "<script>", size: 3 })), { readingFont: "atkinson", readingSize: "standard", readingSpacing: "standard" });
  assert.deepEqual(run(null), { readingFont: "atkinson", readingSize: "standard", readingSpacing: "standard" });
  assert.doesNotThrow(() => new Function("document", "localStorage", readingComfortScript)({ documentElement: { dataset: {} } }, { getItem() { throw new Error("blocked"); } }));
});
