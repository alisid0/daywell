import test from "node:test";
import assert from "node:assert/strict";
import { ZodError } from "zod";
import { stateBodySchema, validateSavedEntries } from "../lib/state-input.ts";

const entry = { id: "qa-task", kind: "task", data: { title: "A small step", date: "2026-10-08", done: false, minutes: 5 } };

test("non-object state requests are validation errors rather than storage failures", () => {
  for (const value of [null, [], 42, true, "upsert"]) assert.throws(() => stateBodySchema.parse(value), ZodError);
  assert.deepEqual(stateBodySchema.parse({ action: "upsert", entries: [entry] }), { action: "upsert", entries: [entry] });
});

test("invalid saved-entry envelopes are rejected before writing a batch", () => {
  for (const entries of [null, {}, [], [null], [42], [entry, null], [{ ...entry, kind: "__proto__" }], [{ ...entry, kind: 3 }], [{ ...entry, id: "not an id" }], Array(31).fill(entry), [entry, entry]]) {
    assert.throws(() => validateSavedEntries(entries), ZodError);
  }
});

test("saved entries retain field validation and valid batches are preserved", () => {
  assert.throws(() => validateSavedEntries([entry, { ...entry, id: "bad-date", data: { ...entry.data, date: "2026-02-30" } }]), ZodError);
  assert.deepEqual(validateSavedEntries([entry]), [entry]);
});
