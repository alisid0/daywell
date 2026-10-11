import { limits, type LimitedFeature } from "../lib/request-guards.ts";
import { closureReceipt, type AccountDatabase, type Closure } from "../lib/account-lifecycle.ts";
export const personalTables = ["settings", "entries", "food_spaces", "food_operations", "usage_limits"] as const;
export const retainedTables = ["account_closures"] as const;
const parse = (text: unknown): unknown => { if (typeof text !== "string") return text; try { return JSON.parse(text); } catch { return text; } };
const windowStart = (feature: string, window: number) =>
  Object.hasOwn(limits, feature) ? new Date(window * limits[feature as LimitedFeature].windowMs).toISOString() : null;

export async function exportAccount(db: AccountDatabase, userId: string, now = new Date()) {
  // One transactional batch: stock, journal and undo history describe the same snapshot.
  const rows = await db.batch([
    db.prepare("SELECT data FROM settings WHERE user_id=?").bind(userId),
    db.prepare("SELECT id,kind,data FROM entries WHERE user_id=? ORDER BY rowid").bind(userId),
    db.prepare("SELECT revision,data FROM food_spaces WHERE user_id=?").bind(userId),
    db.prepare("SELECT operation_id,revision,effect,created_at,undone_by FROM food_operations WHERE user_id=? ORDER BY revision").bind(userId),
    db.prepare("SELECT feature,window,count FROM usage_limits WHERE user_id=? ORDER BY feature").bind(userId),
    db.prepare("SELECT request_id,closed_at,provider_status FROM account_closures WHERE user_id=?").bind(userId),
  ]);
  const [settings, entries, basket, history, usage, closures] = rows.map(row => row.results as Record<string, unknown>[]);
  return {
    formatVersion: 2, about: "A snapshot of your saved Daywell database records.",
    exportedAt: now.toISOString(), timezone: "UTC; dates and local times inside saved entries are preserved as recorded.",
    exclusions: [
      "Device-only food drafts and shared appearance, reading and voice preferences are not uploaded or included.",
      "Original photos and audio are not saved in Daywell's database.",
      "Provider-held conversations, provider logs, identity-provider records, support records and backups are not included.",
      "This file is not confirmation that external records have been exported or deleted.",
    ],
    counts: Object.fromEntries(personalTables.map((table, i) => [table, rows[i].results.length])),
    settings: settings[0] ? parse(settings[0].data) : null,
    entries: entries.map(row => ({ id: row.id, kind: row.kind, data: parse(row.data) })),
    foodBasket: basket[0] ? { revision: basket[0].revision, state: parse(basket[0].data) } : null,
    foodHistory: history.map(row => ({ operationId: row.operation_id, revision: row.revision, createdAt: row.created_at, undoneBy: row.undone_by, change: parse(row.effect) })),
    usage: usage.map(row => ({ feature: row.feature, countedSince: windowStart(String(row.feature), Number(row.window)), count: row.count })),
    closure: closures[0] ? closureReceipt(closures[0] as unknown as Closure) : null,
  };
}
export async function deleteAccount(db: AccountDatabase, userId: string, requestId: string, now = new Date()) {
  // Barrier and removal commit together. Triggers stop a write authorized just before closure.
  const result = await db.batch([
    db.prepare("INSERT INTO account_closures(user_id,request_id,closed_at) VALUES(?,?,?) ON CONFLICT(user_id) DO NOTHING").bind(userId, requestId, now.toISOString()),
    ...personalTables.map(table => db.prepare(`DELETE FROM ${table} WHERE user_id=?`).bind(userId)),
    db.prepare("SELECT request_id,closed_at,provider_status FROM account_closures WHERE user_id=?").bind(userId),
  ]);
  const closure = result[result.length - 1].results[0] as Closure | undefined;
  if (!closure) throw Error("Closure receipt unavailable");
  return closureReceipt(closure);
}
const escape = (value: unknown) => String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
export function readableAccount(data: Awaited<ReturnType<typeof exportAccount>>) {
  const section = (title: string, value: unknown) => `<section><h2>${escape(title)}</h2><pre>${escape(JSON.stringify(value, null, 2))}</pre></section>`;
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Your Daywell data</title>
<style>body{font:18px/1.6 system-ui,sans-serif;max-width:900px;margin:32px auto;padding:0 20px;color:#192e28}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f4f7f4;padding:16px;border-radius:12px}h2{margin-top:32px}</style>
<main><h1>Your Daywell data</h1><p>Exported ${escape(data.exportedAt)}. ${escape(data.about)}</p><p>${escape(data.timezone)}</p>
<h2>What this download does not include</h2><ul>${data.exclusions.map(item => `<li>${escape(item)}</li>`).join("")}</ul>
${section("Record counts", data.counts)}${section("Your settings", data.settings)}${section("Plans, meals, movement, sleep and notes", data.entries)}
${section("Your food basket and meal plans", data.foodBasket)}${section("Food changes and undo history", data.foodHistory)}${section("Service usage", data.usage)}
${data.closure ? section("Account closure receipt", data.closure) : ""}
<details><summary>Complete structured copy (JSON)</summary><pre>${escape(JSON.stringify(data, null, 2))}</pre></details></main></html>`;
}
