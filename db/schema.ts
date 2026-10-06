import { sqliteTable, text, integer, primaryKey, uniqueIndex } from "drizzle-orm/sqlite-core";
export const settings = sqliteTable("settings", { userId: text("user_id").primaryKey(), data: text("data").notNull() });
export const entries = sqliteTable("entries", { userId: text("user_id").notNull(), id: text("id").notNull(), kind: text("kind").notNull(), data: text("data").notNull() }, table => [primaryKey({columns:[table.userId,table.id]})]);
// Per-user allowances for voice starts and photo/voice captures, counted in fixed time windows.
export const usageLimits = sqliteTable("usage_limits", { userId: text("user_id").notNull(), feature: text("feature").notNull(), window: integer("window").notNull(), count: integer("count").notNull() }, table => [primaryKey({columns:[table.userId,table.feature]})]);
export const foodSpaces = sqliteTable("food_spaces", {
  userId: text("user_id").primaryKey(), revision: integer("revision").notNull(),
  data: text("data").notNull(), lastWriteId: text("last_write_id").notNull(),
});
export const foodOperations = sqliteTable("food_operations", {
  userId: text("user_id").notNull(), operationId: text("operation_id").notNull(),
  requestHash: text("request_hash").notNull(), revision: integer("revision").notNull(),
  effect: text("effect").notNull(), createdAt: text("created_at").notNull(), undoneBy: text("undone_by"),
}, table => [primaryKey({ columns: [table.userId, table.operationId] }), uniqueIndex("food_operations_user_revision").on(table.userId, table.revision)]);
