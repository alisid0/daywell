import { emptyFoodState } from "../lib/food.ts";
import { touchesShopping } from "../lib/shopping-bridge.ts";
import type { Entry } from "../lib/daywell.ts";

type Database = Pick<D1Database, "prepare" | "batch">;
export async function saveEntries(db: Database, userId: string, entries: Entry[], removed: string[] = []) {
  const ids = [...entries.map(entry => entry.id), ...removed];
  if (!ids.length) return;
  const existing = await db.prepare(`SELECT kind FROM entries WHERE user_id=? AND id IN (${ids.map(() => "?").join(",")})`).bind(userId, ...ids).all<{ kind: string }>();
  const statements = [
    ...entries.map(entry => db.prepare("INSERT INTO entries(user_id,id,kind,data) VALUES(?,?,?,?) ON CONFLICT(user_id,id) DO UPDATE SET kind=excluded.kind,data=excluded.data").bind(userId, entry.id, entry.kind, JSON.stringify(entry.data))),
    ...removed.map(id => db.prepare("DELETE FROM entries WHERE user_id=? AND id=?").bind(userId, id)),
  ];
  if (touchesShopping(entries, removed, existing.results.map(entry => entry.kind))) {
    // Same transaction as the host's timer/tasks/shopping. Open food drafts
    // must review a changed shopping list rather than overwrite it silently.
    statements.push(db.prepare("INSERT INTO food_spaces(user_id,revision,data,last_write_id) VALUES(?,1,?,'') ON CONFLICT(user_id) DO UPDATE SET revision=food_spaces.revision+1,last_write_id=''")
      .bind(userId, JSON.stringify(emptyFoodState())));
  }
  await db.batch(statements);
}
