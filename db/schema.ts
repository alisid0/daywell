import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
export const settings = sqliteTable("settings", { userId: text("user_id").primaryKey(), data: text("data").notNull() });
export const entries = sqliteTable("entries", { userId: text("user_id").notNull(), id: text("id").notNull(), kind: text("kind").notNull(), data: text("data").notNull() }, table => [primaryKey({columns:[table.userId,table.id]})]);
// Per-user allowances for voice starts and photo/voice captures, counted in fixed time windows.
export const usageLimits = sqliteTable("usage_limits", { userId: text("user_id").notNull(), feature: text("feature").notNull(), window: integer("window").notNull(), count: integer("count").notNull() }, table => [primaryKey({columns:[table.userId,table.feature]})]);
