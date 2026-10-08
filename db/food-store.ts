import { applyFoodCommand, emptyFoodState, FoodError, foodCommandSchema, foodOverview, type FoodEffect, type FoodState } from "../lib/food.ts";
import { connectedShopping, shoppingEntryData, shoppingEntryId, type ShoppingEntry } from "../lib/shopping-bridge.ts";

type Database = Pick<D1Database, "prepare" | "batch">;
type SavedSpace = { revision: number; data: string; shopping: string };
type Receipt = { operation_id: string; request_hash: string; revision: number; effect: string; created_at: string; undone_by: string | null };
type History = { operation_id: string; revision: number; type: FoodEffect["type"]; meal_id: string | null; created_at: string; undone_by: string | null };

async function findReceipt(db: Database, userId: string, operationId: string) {
  return db.prepare("SELECT operation_id,request_hash,revision,effect,created_at,undone_by FROM food_operations WHERE user_id=? AND operation_id=?")
    .bind(userId, operationId).first<Receipt>();
}
async function findSpace(db: Database, userId: string) {
  // One SQLite snapshot: revision, food records and spoken shopping must agree.
  const row = await db.prepare("SELECT COALESCE((SELECT revision FROM food_spaces WHERE user_id=?),0) AS revision, (SELECT data FROM food_spaces WHERE user_id=?) AS data, (SELECT json_group_array(json_object('id',id,'data',data)) FROM (SELECT id,data FROM entries WHERE user_id=? AND kind='grocery' ORDER BY id)) AS shopping")
    .bind(userId, userId, userId).first<SavedSpace>();
  const shopping = row?.shopping ?? "[]";
  return { revision: row?.revision ?? 0, state: connectedShopping(row?.data ? JSON.parse(row.data) as FoodState : emptyFoodState(), JSON.parse(shopping) as ShoppingEntry[]), shopping };
}
export async function getFoodSpace(db: Database, userId: string) {
  const space = await findSpace(db, userId);
  // The state and this history can straddle a concurrent commit. Only include
  // actions visible at the snapshot's revision; refresh after every mutation.
  const history = await db.prepare("SELECT operation_id,revision,json_extract(effect,'$.type') AS type,json_extract(effect,'$.meal.id') AS meal_id,created_at,undone_by FROM food_operations WHERE user_id=? AND revision<=? ORDER BY revision DESC LIMIT 50")
    .bind(userId, space.revision).all<History>();
  return { revision: space.revision, state: space.state, overview: foodOverview(space.state), recentActions: history.results.map(row => ({
    operationId: row.operation_id, revision: row.revision, type: row.type, createdAt: row.created_at, undone: row.undone_by !== null, mealId: row.meal_id,
  })) };
}
function replay(receipt: Receipt, hash: string) {
  if (receipt.request_hash !== hash) throw new FoodError("This save reference was already used for a different change. Refresh before trying again.");
  return { ok: true, revision: receipt.revision, replayed: true };
}

export async function saveFoodCommand(db: Database, userId: string, input: unknown, now = new Date()) {
  const command = foodCommandSchema.parse(input);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(command)));
  const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  const existing = await findReceipt(db, userId, command.operationId);
  if (existing) return replay(existing, hash);
  const current = await findSpace(db, userId);
  if (command.expectedRevision !== current.revision) {
    const completed = await findReceipt(db, userId, command.operationId);
    if (completed) return replay(completed, hash);
    throw new FoodError("Your food space has changed on another screen. Refresh and review your change before saving.");
  }
  const undoReceipt = command.action.type === "undo" ? await findReceipt(db, userId, command.action.operationId) : null;
  if (command.action.type === "undo" && (!undoReceipt || undoReceipt.undone_by)) throw new FoodError("That action is unavailable or has already been undone.");
  const { state, effect } = applyFoodCommand(current.state, command, undoReceipt ? JSON.parse(undoReceipt.effect) as FoodEffect : undefined);
  const revision = current.revision + 1;
  const legacyRows = JSON.parse(current.shopping) as ShoppingEntry[];
  for (const change of effect.shopping) {
    const entryId = shoppingEntryId(change.id);
    if (entryId && !legacyRows.some(row => row.id === entryId) && effect.type !== "undo") throw new FoodError("That shopping note has changed. Refresh your list before saving.");
  }
  const stateJson = JSON.stringify({ ...state, shopping: state.shopping.filter(item => !shoppingEntryId(item.id)) });
  if (new TextEncoder().encode(stateJson).byteLength > 1_500_000) throw new FoodError("Your food space is full. Remove older plans or shopping items before adding more.", 413);

  // D1 batch is a transaction. The compare-and-swap and its receipt, meal
  // history and undo marker either commit together or roll back together.
  // A fresh write token prevents even an identical concurrent retry from
  // applying effects belonging to the request that won the revision check.
  const writeToken = crypto.randomUUID();
  let condition = " AND (SELECT json_group_array(json_object('id',id,'data',data)) FROM (SELECT id,data FROM entries WHERE user_id=? AND kind='grocery' ORDER BY id))=?";
  const checks: (string | number)[] = [userId, current.shopping];
  if (effect.meal && effect.type === "undo") {
    condition += " AND EXISTS (SELECT 1 FROM entries WHERE user_id=? AND id=? AND kind='food' AND data=?)";
    checks.push(userId, effect.meal.id, JSON.stringify(effect.meal.data));
  }
  const statements = [
    db.prepare("INSERT INTO food_spaces(user_id,revision,data,last_write_id) VALUES(?,0,?,'') ON CONFLICT(user_id) DO NOTHING").bind(userId, JSON.stringify(emptyFoodState())),
    db.prepare(`UPDATE food_spaces SET revision=?,data=?,last_write_id=? WHERE user_id=? AND revision=? AND NOT EXISTS (SELECT 1 FROM food_operations WHERE user_id=? AND operation_id=?)${condition}`)
      .bind(revision, stateJson, writeToken, userId, current.revision, userId, command.operationId, ...checks),
    db.prepare("INSERT INTO food_operations(user_id,operation_id,request_hash,revision,effect,created_at) SELECT ?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM food_spaces WHERE user_id=? AND revision=? AND last_write_id=?) ON CONFLICT(user_id,operation_id) DO NOTHING")
      .bind(userId, command.operationId, hash, revision, JSON.stringify(effect), now.toISOString(), userId, revision, writeToken),
  ];
  const gate = "EXISTS (SELECT 1 FROM food_spaces WHERE user_id=? AND revision=? AND last_write_id=?)";
  for (const change of effect.shopping) {
    const entryId = shoppingEntryId(change.id);
    if (!entryId) continue;
    if (change.after) statements.push(db.prepare(`INSERT INTO entries(user_id,id,kind,data) SELECT ?,?,'grocery',? WHERE ${gate} ON CONFLICT(user_id,id) DO UPDATE SET data=excluded.data`)
      .bind(userId, entryId, JSON.stringify(shoppingEntryData(change.after, legacyRows.find(row => row.id === entryId)?.data)), userId, revision, writeToken));
    else statements.push(db.prepare(`DELETE FROM entries WHERE user_id=? AND id=? AND kind='grocery' AND ${gate}`).bind(userId, entryId, userId, revision, writeToken));
  }
  if (effect.meal) {
    if (effect.type === "cook") {
      const count = await db.prepare("SELECT COUNT(*) AS n FROM entries WHERE user_id=?").bind(userId).first<{ n: number }>();
      if ((count?.n ?? 0) >= 20_000) throw new FoodError("Your saved day is full. Remove a few older entries before recording a meal.", 413);
      // A collision deliberately fails the entire transaction. Never overwrite
      // a pre-existing journal entry to make a food operation appear successful.
      statements.push(db.prepare(`INSERT INTO entries(user_id,id,kind,data) SELECT ?,?,'food',? WHERE ${gate}`)
        .bind(userId, effect.meal.id, JSON.stringify(effect.meal.data), userId, revision, writeToken));
    } else {
      statements.push(db.prepare(`DELETE FROM entries WHERE user_id=? AND id=? AND kind='food' AND data=? AND ${gate}`)
        .bind(userId, effect.meal.id, JSON.stringify(effect.meal.data), userId, revision, writeToken));
    }
  }
  if (undoReceipt) statements.push(db.prepare(`UPDATE food_operations SET undone_by=? WHERE user_id=? AND operation_id=? AND undone_by IS NULL AND ${gate}`)
    .bind(command.operationId, userId, undoReceipt.operation_id, userId, revision, writeToken));
  const result = await db.batch(statements);
  const receipt = await findReceipt(db, userId, command.operationId);
  if (!receipt) throw new FoodError("Your food space or meal history changed. Refresh and review it before saving.");
  if (receipt.request_hash !== hash) return replay(receipt, hash);
  return { ok: true, revision: receipt.revision, replayed: result[1].meta.changes === 0 };
}
