import { z } from "zod";
import { schemas, type Kind } from "./daywell.ts";

// Validate the envelope before reading properties: valid JSON can still be null,
// an array or a primitive. These are input errors, not storage outages.
export const stateBodySchema = z.record(z.unknown());
const entriesSchema = z.array(z.object({
  id: z.string().regex(/^[-a-zA-Z0-9]{1,80}$/),
  kind: z.string().refine(kind => Object.hasOwn(schemas, kind), "Invalid entry kind"),
  data: z.unknown(),
})).min(1).max(30).refine(entries => new Set(entries.map(entry => entry.id)).size === entries.length, "Duplicate entry IDs");

export function validateSavedEntries(value: unknown) {
  return entriesSchema.parse(value).map(entry => {
    const kind = entry.kind as Kind;
    return { id: entry.id, kind, data: schemas[kind].parse(entry.data) };
  });
}
