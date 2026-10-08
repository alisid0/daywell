import { z } from "zod";
import { actionSchema, foodCommandSchema } from "./food.ts";
import type { FoodAction } from "./food-client.ts";

// Drafts may be incomplete (blank names/zero quantities); API commands may not.
// Validate the complete shape before restoring it into form controls.
const text = z.string().max(160), id = z.string().regex(/^[a-zA-Z0-9-]{1,87}$/);
const number = z.number().finite().min(-1_000_000).max(1_000_000);
const date = z.string().max(10), unit = z.enum(["g", "kg", "ml", "l", "each", "portion"]);
const stock = z.object({ id, ingredient: text, quantity: number.nullable(), unit, bestBefore: date.nullable() });
const requirement = z.object({ ingredient: text, quantity: number, unit });
const meal = z.enum(["Breakfast", "Lunch", "Dinner", "Snack"]);
const plan = z.object({ id, title: text, date, meal, servings: number, ingredients: z.array(requirement).max(40) });
const draftAction = z.union([
  z.object({ type: z.literal("stock.set"), item: stock }),
  z.object({ type: z.literal("plan.set"), plan }),
  z.object({ type: z.literal("plan.window"), startDate: date, days: z.union([z.literal(2), z.literal(3), z.literal(7)]), plans: z.array(plan).max(28) }),
  z.object({ type: z.literal("shopping.set"), item: z.object({ id, title: text, quantity: z.string().max(80), done: z.boolean() }) }),
  z.object({ type: z.literal("purchase"), items: z.array(stock.extend({ quantity: number, shoppingId: id.optional() })).min(1).max(40) }),
  z.object({ type: z.literal("cook"), planId: id.optional(), title: text, date, meal, servings: number,
    consumed: z.array(z.object({ stockId: id, quantity: number, unit })).max(40), useReservedStock: z.boolean(),
    leftovers: z.object({ id, title: text, portions: number, bestBefore: date.nullable() }).optional() }),
  actionSchema,
]) as z.ZodType<FoodAction>;
const draftSchema = z.object({ revision: z.number().int().nonnegative(), action: draftAction });
const recoverySchema = z.object({ version: z.literal(1), draft: draftSchema.nullable(), pending: foodCommandSchema.nullable(),
  view: z.enum(["basket", "meals", "shopping", "history"]), start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), days: z.union([z.literal(2), z.literal(3), z.literal(7)]) });
export type FoodRecovery = z.infer<typeof recoverySchema>;
export const recoveryPrefix = "daywell-food-recovery-v1-";
type Storage = Pick<globalThis.Storage, "getItem" | "setItem" | "removeItem" | "key" | "length">;
const key = (scope: string) => /^[a-f0-9]{64}$/.test(scope) ? recoveryPrefix + scope : null;

export function clearOtherFoodRecovery(storage: Storage, scope: string | null) {
  const keep = scope ? key(scope) : null;
  for (let i = storage.length - 1; i >= 0; i--) {
    const name = storage.key(i);
    if (name?.startsWith(recoveryPrefix) && name !== keep) storage.removeItem(name);
  }
}
export function readFoodRecovery(storage: Storage, scope: string): FoodRecovery | null {
  const name = key(scope);
  if (!name) return null;
  const raw = storage.getItem(name);
  if (!raw) return null;
  try {
    if (raw.length > 100_000) throw Error("Too large");
    const data = recoverySchema.parse(JSON.parse(raw));
    // An uncertain, already-authorised command is authoritative. Preserve its
    // operation ID and expected revision; never create a fresh retry here.
    if (data.pending) data.draft = { revision: data.pending.expectedRevision, action: data.pending.action };
    return data.draft || data.pending ? data : null;
  } catch { storage.removeItem(name); return null; }
}
export class FoodRecoveryConflict extends Error {}
export function foodRecoveryToken(storage: Storage, scope: string) { const name = key(scope); return name ? storage.getItem(name) : null; }
export function writeFoodRecovery(storage: Storage, scope: string, data: Omit<FoodRecovery, "version">, expected?: string | null) {
  const name = key(scope);
  if (!name) throw Error("Sign in before keeping a draft.");
  if (expected !== undefined && storage.getItem(name) !== expected) throw new FoodRecoveryConflict("Another tab changed your saved draft. Keep this page open and finish the change in the other tab first.");
  if (!data.draft && !data.pending) { storage.removeItem(name); return null; }
  const raw = JSON.stringify(recoverySchema.parse({ version: 1, ...data }));
  if (raw.length > 100_000) throw Error("Draft too large");
  storage.setItem(name, raw);
  return raw;
}
