// An in-memory stand-in for D1 holding the usage_limits, email sign-in and subscriptions tables.
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const migration = name => readFileSync(new URL(`../../drizzle/${name}`, import.meta.url), 'utf8').replaceAll('--> statement-breakpoint', '');

export function signInStore() {
  const sqlite = new DatabaseSync(':memory:');
  // D1 enforces foreign keys, so the stand-in does too.
  sqlite.exec('PRAGMA foreign_keys=ON');
  sqlite.exec(migration('0001_usage_limits.sql'));
  sqlite.exec(migration('0006_email_sign_in.sql'));
  sqlite.exec(migration('0007_subscriptions.sql'));
  const statement = (sql, values = []) => ({
    bind: (...next) => statement(sql, next),
    first: async () => sqlite.prepare(sql).get(...values) ?? null,
    run: async () => ({ meta: { changes: sqlite.prepare(sql).run(...values).changes } }),
    apply: () => sqlite.prepare(sql).run(...values),
  });
  const db = {
    prepare: sql => statement(sql),
    batch: async statements => {
      sqlite.exec('BEGIN');
      try { const out = statements.map(item => item.apply()); sqlite.exec('COMMIT'); return out; }
      catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    },
  };
  const rows = table => sqlite.prepare(`SELECT * FROM ${table}`).all().map(row => ({ ...row }));
  return { db, sqlite, rows };
}

export const testSecret = 'test-secret-'.padEnd(48, 'x');
