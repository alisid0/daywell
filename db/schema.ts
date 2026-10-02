import { sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";
export const settings = sqliteTable("settings", { userId: text("user_id").primaryKey(), data: text("data").notNull() });
export const entries = sqliteTable("entries", { userId: text("user_id").notNull(), id: text("id").notNull(), kind: text("kind").notNull(), data: text("data").notNull() }, table => [primaryKey({columns:[table.userId,table.id]})]);
