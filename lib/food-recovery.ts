import { z } from "zod";
import { actionSchema, foodCommandSchema, placeIds, planGuideSchema } from "./food.ts";
import type { FoodAction } from "./food-client.ts";

// Drafts may be incomplete (blank names/zero quantities); API commands may not.
// Validate the complete shape before restoring it into form controls.
const text = z.string().max(160), id = z.string().regex(/^[a-zA-Z0-9-]{1,87}$/);
const number = z.number().finite().min(-1_000_000).max(1_000_000);
const date = z.string().max(10), unit = z.enum(["g", "kg", "ml", "l", "each", "portion"]);
const stock = z.object({ id, ingredient: text, quantity: number.nullable(), unit, bestBefore: date.nullable(), place: z.enum(placeIds).optional() });
const requirement = z.object({ ingredient: text, quantity: number.nullable(), unit });
const meal = z.enum(["Breakfast", "Lunch", "Dinner", "Snack"]);
const plan = z.object({ id, title: text, date, meal, servings: number, ingredients: z.array(requirement).max(40), guide: planGuideSchema.optional() });
const intake = z.object({ portions: number, calories: number.optional(), macros: z.object({ protein: number, carbs: number, fat: number }).optional(), source: z.enum(["label", "estimate", "app"]).optional(), sugarGrams: number.optional() });
const consumption = { title: text, date, meal, consumed: z.array(z.object({ stockId: id, quantity: number, unit })).max(40), useReservedStock: z.boolean(), intake: intake.optional() };
const draftAction = z.union([
  z.object({ type: z.literal("stock.set"), item: stock }),
  z.object({ type: z.literal("stock.add"), items: z.array(stock).min(1).max(20) }),
  z.object({ type: z.literal("plan.set"), plan }),
  z.object({ type: z.literal("plan.add"), plans: z.array(plan).min(1).max(7) }),
  z.object({ type: z.literal("plan.window"), startDate: date, days: z.union([z.literal(2), z.literal(3), z.literal(7)]), plans: z.array(plan).max(28) }),
  z.object({ type: z.literal("shopping.set"), item: z.object({ id, title: text, quantity: z.string().max(80), done: z.boolean() }) }),
  z.object({ type: z.literal("shopping.add"), items: z.array(z.object({ id, title: text, quantity: z.string().max(80), done: z.boolean() })).min(1).max(20) }),
  z.object({ type: z.literal("purchase"), items: z.array(stock.extend({ quantity: number.nullable(), shoppingId: id.optional() })).min(1).max(40) }),
  z.object({ type: z.literal("use"), ...consumption }),
  z.object({ type: z.literal("cook"), planId: id.optional(), ...consumption, servings: number,
    leftovers: z.object({ id, title: text, portions: number, bestBefore: date.nullable() }).optional() }),
  actionSchema,
]) as z.ZodType<FoodAction>;
const draftSchema = z.object({ revision: z.number().int().nonnegative(), action: draftAction });
const recoverySchema = z.object({ version: z.literal(1), draft: draftSchema.nullable(), pending: foodCommandSchema.nullable(),
  view: z.enum(["plate", "basket", "meals", "shopping", "history"]), start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), days: z.union([z.literal(2), z.literal(3), z.literal(7)]) });
export type FoodRecovery = z.infer<typeof recoverySchema>;
export const recoveryPrefix = "daywell-food-recovery-v1-";
export const closedAccountPrefix = "daywell-account-closed-v1-";
type Storage = Pick<globalThis.Storage, "getItem" | "setItem" | "removeItem" | "key" | "length">;
const key = (scope: string) => /^[a-f0-9]{64}$/.test(scope) ? recoveryPrefix + scope : null;

export function accountClosedOnDevice(storage: Storage, scope: string) {
  return !!key(scope) && storage.getItem(closedAccountPrefix + scope) === "closed";
}
export function clearAccountDeviceData(storage: Storage, scope: string) {
  const name = key(scope);
  if (!name) return;
  storage.removeItem(name);
  // A minimal marker also stops an offline tab from restoring a recovery draft.
  storage.setItem(closedAccountPrefix + scope, "closed");
}
export function clearFoodRecovery(storage: Storage, scope: string) {
  const name = key(scope);
  if (name) storage.removeItem(name);
}

export function clearOtherFoodRecovery(storage: Storage, scope: string | null) {
  const keep = scope ? [key(scope), trolleyKey(scope)] : [];
  for (let i = storage.length - 1; i >= 0; i--) {
    const name = storage.key(i);
    if ((name?.startsWith(recoveryPrefix) || name?.startsWith(trolleyPrefix)) && !keep.includes(name)) storage.removeItem(name);
  }
}

// The trolley tray: what's been picked up while shopping, kept on this device until it's put away.
export const trolleyPrefix = "daywell-food-trolley-v1-";
const trolleyKey = (scope: string) => /^[a-f0-9]{64}$/.test(scope) ? trolleyPrefix + scope : null;
export function readTrolley(storage: Storage, scope: string): string[] {
  const name = trolleyKey(scope);
  try {
    const value = name ? JSON.parse(storage.getItem(name) ?? "[]") : [];
    return Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === "string" && item.length <= 300))].slice(0, 80) : [];
  } catch { return []; }
}
export function writeTrolley(storage: Storage, scope: string, keys: string[]) {
  const name = trolleyKey(scope);
  if (!name) return;
  if (keys.length) storage.setItem(name, JSON.stringify(keys.slice(0, 80))); else storage.removeItem(name);
}
export function readFoodRecovery(storage: Storage, scope: string): FoodRecovery | null {
  const name = key(scope);
  if (!name) return null;
  if (accountClosedOnDevice(storage, scope)) { storage.removeItem(name); return null; }
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
  if (accountClosedOnDevice(storage, scope)) throw new FoodRecoveryConflict("This Daywell account is closed.");
  if (expected !== undefined && storage.getItem(name) !== expected) throw new FoodRecoveryConflict("Another tab changed your saved draft. Keep this page open and finish the change in the other tab first.");
  if (!data.draft && !data.pending) { storage.removeItem(name); return null; }
  const raw = JSON.stringify(recoverySchema.parse({ version: 1, ...data }));
  if (raw.length > 100_000) throw Error("Draft too large");
  storage.setItem(name, raw);
  return raw;
}
