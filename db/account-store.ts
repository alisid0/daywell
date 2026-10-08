import { limits, type LimitedFeature } from "../lib/request-guards.ts";

// Everything Daywell stores for one person: what their download contains and what deleting their account removes.
type Database = Pick<D1Database, "prepare" | "batch">;

// Every table that holds a person's records, keyed by user_id. A test checks this list against the
// migrations, so a new table can't be left out of downloads or account deletion.
export const personalTables = ["settings", "entries", "food_spaces", "food_operations", "usage_limits"] as const;

const parse = (text: string): unknown => { try { return JSON.parse(text); } catch { return text; } };
const windowStart = (feature: string, window: number) =>
  Object.hasOwn(limits, feature) ? new Date(window * limits[feature as LimitedFeature].windowMs).toISOString() : null;

export async function exportAccount(db: Database, userId: string, now = new Date()) {
  const [settings, entries, basket, history, usage] = await Promise.all([
    db.prepare("SELECT data FROM settings WHERE user_id=?").bind(userId).first<{ data: string }>(),
    db.prepare("SELECT id,kind,data FROM entries WHERE user_id=? ORDER BY rowid").bind(userId).all<{ id: string; kind: string; data: string }>(),
    db.prepare("SELECT revision,data FROM food_spaces WHERE user_id=?").bind(userId).first<{ revision: number; data: string }>(),
    db.prepare("SELECT operation_id,revision,effect,created_at,undone_by FROM food_operations WHERE user_id=? ORDER BY revision")
      .bind(userId).all<{ operation_id: string; revision: number; effect: string; created_at: string; undone_by: string | null }>(),
    db.prepare("SELECT feature,window,count FROM usage_limits WHERE user_id=? ORDER BY feature").bind(userId).all<{ feature: string; window: number; count: number }>(),
  ]);
  return {
    about: "Everything Daywell had saved for you when this file was made.",
    exportedAt: now.toISOString(),
    settings: settings ? parse(settings.data) : null,
    entries: entries.results.map(row => ({ id: row.id, kind: row.kind, data: parse(row.data) })),
    foodBasket: basket ? { revision: basket.revision, state: parse(basket.data) } : null,
    foodHistory: history.results.map(row => ({
      operationId: row.operation_id, revision: row.revision, createdAt: row.created_at, undoneBy: row.undone_by, change: parse(row.effect),
    })),
    usage: usage.results.map(row => ({ feature: row.feature, countedSince: windowStart(row.feature, row.window), count: row.count })),
  };
}

// Deletes all of a person's records in one transaction, so a failure leaves everything as it was.
export async function deleteAccount(db: Database, userId: string) {
  await db.batch(personalTables.map(table => db.prepare(`DELETE FROM ${table} WHERE user_id=?`).bind(userId)));
}
