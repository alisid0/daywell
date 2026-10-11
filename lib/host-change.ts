import { z } from "zod";
import { schemas, type Kind } from "./daywell.ts";

export function validateHostChange(body: unknown) {
  const input = z.object({
    entries: z.array(z.object({ id: z.string().regex(/^[-a-zA-Z0-9]{1,80}$/), kind: z.string(), data: z.unknown() })).max(30),
    removeIds: z.array(z.string().regex(/^[-a-zA-Z0-9]{1,80}$/)).max(30),
  }).parse(body);
  if (!input.entries.length && !input.removeIds.length) throw new Error("Invalid entry");
  const ids = [...input.entries.map(e => e.id), ...input.removeIds];
  if (new Set(ids).size !== ids.length) throw new Error("Invalid entry");
  const entries = input.entries.map(entry => {
    if (!Object.hasOwn(schemas, entry.kind)) throw new Error("Invalid entry");
    const kind = entry.kind as Kind;
    return { id: entry.id, kind, data: schemas[kind].parse(entry.data) };
  });
  return { entries, removeIds: input.removeIds };
}
