import { z } from "zod";
import { foodCommandSchema, foodStateSchema, foodOverview, type FoodCommand, type FoodState } from "./food.ts";

export type FoodAction = FoodCommand["action"];
export type FoodSnapshot = {
  revision: number;
  state: FoodState;
  overview: ReturnType<typeof foodOverview>;
  recentActions: { operationId: string; revision: number; type: FoodAction["type"]; createdAt: string; undone: boolean; mealId: string | null }[];
};
export type FoodDraft = { revision: number; action: FoodAction };
export type SaveResult = { kind: "saved" } | { kind: "conflict" | "rejected" | "uncertain"; message: string };
const errorResponse = z.object({ error: z.string() });
const savedResponse = z.object({ ok: z.literal(true), revision: z.number().int().nonnegative(), replayed: z.boolean() });
const snapshotSchema = z.object({ revision: z.number().int().nonnegative(), state: foodStateSchema,
  recentActions: z.array(z.object({ operationId: z.string(), revision: z.number().int(), type: z.enum(["stock.set", "stock.add", "stock.remove", "plan.set", "plan.remove", "plan.window", "shopping.set", "shopping.remove", "purchase", "cook", "use", "undo"]), createdAt: z.string(), undone: z.boolean(), mealId: z.string().nullable() })),
});
export async function readFoodSnapshot(request: typeof fetch = fetch, scope?: string): Promise<FoodSnapshot> {
  const response = await request("/api/food", { cache: "no-store", headers: scope ? { "X-Daywell-Recovery-Scope": scope } : undefined, signal: AbortSignal.timeout(20_000) });
  const body = await response.json();
  if (!response.ok) throw Error(errorResponse.safeParse(body).data?.error || "Your food basket couldn’t load.");
  if (scope && !z.object({ recoveryScope: z.literal(scope) }).safeParse(body).success) throw Error("Your sign-in changed. Reload Daywell to see your saved details.");
  const data = snapshotSchema.safeParse(body);
  if (!data.success) throw Error("Your food basket couldn’t load. Try again.");
  return { ...data.data, overview: foodOverview(data.data.state) };
}

// A retry receives the original command, including its ID and revision. Never
// manufacture a second purchase/cook command after a lost response.
export async function sendFoodCommand(command: FoodCommand, request: typeof fetch = fetch, scope?: string): Promise<SaveResult> {
  try {
    const response = await request("/api/food", {
      method: "POST", headers: { "Content-Type": "application/json", ...(scope ? { "X-Daywell-Recovery-Scope": scope } : {}) },
      body: JSON.stringify(command), signal: AbortSignal.timeout(20_000),
    });
    const body = await response.json().catch(() => null);
    if (response.ok && savedResponse.safeParse(body).success) return { kind: "saved" };
    const error = errorResponse.safeParse(body).data?.error;
    if (response.status === 409) return { kind: "conflict", message: error || "Your food basket has changed. Review it before saving." };
    if ([400, 401, 403, 413].includes(response.status)) return { kind: "rejected", message: error || "This change could not be saved. Check the details and your sign-in." };
  } catch { /* The server may have saved before the connection was lost. */ }
  return { kind: "uncertain", message: "We couldn’t confirm that save. Retry this same save safely; it won’t be added twice." };
}

export function prepareFoodCommand(draft: FoodDraft, operationId: string): FoodCommand {
  return foodCommandSchema.parse({ operationId, expectedRevision: draft.revision, action: draft.action });
}
