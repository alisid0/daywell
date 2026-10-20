import { randomUUID } from "node:crypto";
import { accountAccessResponse } from "../lib/account-lifecycle.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { personalTables, retainedTables, deleteAccount } from "../db/account-store.ts";
import { accountResponse } from "../lib/account-http.ts";

// The real migrations and SQL on SQLite, with D1's all-or-nothing batch.
function database(t) {
  const sqlite = new DatabaseSync(":memory:");
  t.after(() => sqlite.close());
  for (const file of readdirSync(new URL("../drizzle/", import.meta.url)).filter(name => name.endsWith(".sql")).sort()) {
    sqlite.exec(readFileSync(new URL(`../drizzle/${file}`, import.meta.url), "utf8").replaceAll("--> statement-breakpoint", ""));
  }
  const prepared = (sql, values = []) => ({
    sql, values,
    bind: (...params) => prepared(sql, params),
    first: async () => sqlite.prepare(sql).get(...values) ?? null,
    all: async () => ({ results: sqlite.prepare(sql).all(...values), success: true }),
  });
  const db = {
    prepare: prepared,
    batch: async statements => {
      sqlite.exec("BEGIN");
      try {
        const results = statements.map(({ sql, values }) => ({ success: true, results: sqlite.prepare(sql).all(...values), meta: {} }));
        sqlite.exec("COMMIT");
        return results;
      } catch (error) { sqlite.exec("ROLLBACK"); throw error; }
    },
  };
  return { sqlite, db };
}

function seed(sqlite, user) {
  sqlite.prepare("INSERT INTO settings(user_id,data) VALUES(?,?)").run(user, JSON.stringify({ name: `${user}'s space` }));
  sqlite.prepare("INSERT INTO entries(user_id,id,kind,data) VALUES(?,?,?,?)").run(user, "walk-1", "move", JSON.stringify({ title: "Walk", minutes: 20 }));
  sqlite.prepare("INSERT INTO entries(user_id,id,kind,data) VALUES(?,?,?,?)").run(user, "note-1", "reflection", JSON.stringify({ text: "A calm evening" }));
  sqlite.prepare("INSERT INTO food_spaces(user_id,revision,data,last_write_id) VALUES(?,?,?,?)").run(user, 2, JSON.stringify({ version: 1, stock: [{ ingredient: "rice" }], plans: [], shopping: [] }), "op-2");
  sqlite.prepare("INSERT INTO food_operations(user_id,operation_id,request_hash,revision,effect,created_at,undone_by) VALUES(?,?,?,?,?,?,?)").run(user, "op-1", "hash-1", 1, JSON.stringify({ type: "stock.set" }), "2026-10-07T10:00:00.000Z", null);
  sqlite.prepare("INSERT INTO usage_limits(user_id,feature,window,count) VALUES(?,?,?,?)").run(user, "capture", 20734, 3);
}
const rows = (sqlite, user) => Object.fromEntries(personalTables.map(table => [table, sqlite.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE user_id=?`).get(user).n]));
const deleteRequest = (body = { action: "delete-account", requestId: randomUUID() }, headers = { origin: "https://daywell.example", "sec-fetch-site": "same-origin" }) =>
  new Request("https://daywell.example/api/account", { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });

test("every table with a user_id column is covered by downloads and account deletion", t => {
  const { sqlite } = database(t);
  const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '\\_%' ESCAPE '\\' AND name NOT LIKE 'd1_%'").all()
    .map(row => row.name).filter(name => sqlite.prepare(`PRAGMA table_info(${name})`).all().some(column => column.name === "user_id"));
  assert.deepEqual([...tables].sort(), [...personalTables, ...retainedTables].sort());
});

test("the download holds everything saved for that person and nobody else's records", async t => {
  const { sqlite, db } = database(t);
  seed(sqlite, "ali"); seed(sqlite, "sam");
  const response = await accountResponse(new Request("https://daywell.example/api/account"), { userId: "ali", database: () => db, now: () => new Date("2026-10-08T12:00:00Z") });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-disposition"), /attachment; filename="daywell-data-2026-10-08\.json"/);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const data = await response.json();
  assert.equal(data.exportedAt, "2026-10-08T12:00:00.000Z");
  assert.deepEqual(data.settings, { name: "ali's space" });
  assert.deepEqual(data.entries.map(entry => entry.id), ["walk-1", "note-1"]);
  assert.deepEqual(data.entries[1].data, { text: "A calm evening" });
  assert.equal(data.foodBasket.revision, 2);
  assert.deepEqual(data.foodBasket.state.stock, [{ ingredient: "rice" }]);
  assert.deepEqual(data.foodHistory, [{ operationId: "op-1", revision: 1, createdAt: "2026-10-07T10:00:00.000Z", undoneBy: null, change: { type: "stock.set" } }]);
  assert.deepEqual(data.usage, [{ feature: "capture", countedSince: "2026-10-08T00:00:00.000Z", count: 3 }]);
  assert.ok(!JSON.stringify(data).includes("sam"));
});

test("an empty account downloads cleanly", async t => {
  const { db } = database(t);
  const data = await (await accountResponse(new Request("https://daywell.example/api/account"), { userId: "new", database: () => db })).json();
  assert.equal(data.settings, null);
  assert.deepEqual(data.entries, []);
  assert.equal(data.foodBasket, null);
});

test("deleting an account removes every record for that person and keeps everyone else's", async t => {
  const { sqlite, db } = database(t);
  seed(sqlite, "ali"); seed(sqlite, "sam");
  sqlite.prepare("INSERT INTO usage_limits(user_id,feature,window,count) VALUES('*','voice-all',20734,7)").run();
  const response = await accountResponse(deleteRequest(), { userId: "ali", database: () => db });
  assert.equal(response.status, 200);
  const closed = await response.json(); assert.equal(closed.ok, true); assert.equal(closed.receipt.activeData, "deleted"); assert.equal(closed.receipt.providerData, "not_automated");
  assert.deepEqual(Object.values(rows(sqlite, "ali")), personalTables.map(() => 0));
  assert.deepEqual(Object.values(rows(sqlite, "sam")), [1, 2, 1, 1, 1]);
  assert.equal(sqlite.prepare("SELECT count FROM usage_limits WHERE user_id='*'").get().count, 7, "the shared daily total stays");
});

test("deletion needs a signed-in person, Daywell's own page and an explicit confirmation", async t => {
  const { sqlite, db } = database(t);
  seed(sqlite, "ali");
  const deps = { userId: "ali", database: () => db };
  assert.equal((await accountResponse(deleteRequest(), { ...deps, userId: null })).status, 401);
  assert.equal((await accountResponse(deleteRequest(undefined, { origin: "https://elsewhere.example" }), deps)).status, 403);
  assert.equal((await accountResponse(deleteRequest({ action: "delete" }), deps)).status, 400);
  assert.equal((await accountResponse(deleteRequest({}), deps)).status, 400);
  assert.equal((await accountResponse(new Request("https://daywell.example/api/account", { method: "DELETE" }), deps)).status, 405);
  assert.equal((await accountResponse(new Request("https://daywell.example/api/account"), { ...deps, userId: null })).status, 401);
  assert.deepEqual(Object.values(rows(sqlite, "ali")), [1, 2, 1, 1, 1], "nothing was removed");
});

test("if deletion fails part-way, nothing is removed", async t => {
  const { sqlite, db } = database(t);
  seed(sqlite, "ali");
  sqlite.exec("ALTER TABLE usage_limits RENAME TO usage_limits_moved");
  const response = await accountResponse(deleteRequest(), { userId: "ali", database: () => db });
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /Check account status/);
  for (const table of personalTables.filter(table => table !== "usage_limits")) {
    assert.ok(sqlite.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE user_id='ali'`).get().n > 0, table);
  }
});

test("retries return the original receipt after a response is lost", async t => {
  const { sqlite, db } = database(t); seed(sqlite, "ali");
  const deps = { userId: "ali", database: () => db };
  const first = await (await accountResponse(deleteRequest(), deps)).json();
  const second = await (await accountResponse(deleteRequest(), deps)).json();
  assert.deepEqual(second.receipt, first.receipt);
  const status = await (await accountResponse(new Request("https://daywell.example/api/account?view=status&userId=sam"), deps)).json();
  assert.equal(status.status, "closed"); assert.deepEqual(status.receipt, first.receipt);
  const other = await (await accountResponse(new Request("https://daywell.example/api/account?view=status"), { ...deps, userId: "sam" })).json();
  assert.equal(other.status, "active"); assert.equal(other.receipt, null);
});

test("failed closure rolls back its write barrier as well as the records", async t => {
  const { sqlite, db } = database(t); seed(sqlite, "ali");
  sqlite.exec("CREATE TRIGGER refuse_test_delete BEFORE DELETE ON entries BEGIN SELECT RAISE(ABORT, 'test failure'); END");
  assert.equal((await accountResponse(deleteRequest(), { userId: "ali", database: () => db })).status, 503);
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM account_closures").get().n, 0);
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM settings WHERE user_id='ali'").get().n, 1);
  assert.equal(await accountAccessResponse(db, "ali"), null);
});

test("a request admitted before closure cannot recreate any erased user store", async t => {
  const { sqlite, db } = database(t); seed(sqlite, "ali"); seed(sqlite, "sam");
  assert.equal(await accountAccessResponse(db, "ali"), null);
  await deleteAccount(db, "ali", randomUUID());
  for (const table of personalTables) {
    const columns = sqlite.prepare(`PRAGMA table_info(${table})`).all().map(row => row.name);
    const insert = `INSERT INTO ${table}(${columns.join(",")}) SELECT ${columns.map(name => name === "user_id" ? "'ali'" : name).join(",")} FROM ${table} WHERE user_id='sam'`;
    assert.throws(() => sqlite.exec(insert), /DAYWELL_ACCOUNT_CLOSED/, table);
    assert.throws(() => sqlite.exec(`UPDATE ${table} SET user_id='ali' WHERE user_id='sam'`), /DAYWELL_ACCOUNT_CLOSED/, table + " reassignment");
  }
  assert.equal((await accountAccessResponse(db, "ali")).status, 410);
  assert.equal(await accountAccessResponse(db, "sam"), null);
  const receiptOnly = await (await accountResponse(new Request("https://daywell.example/api/account"), { userId: "ali", database: () => db })).json();
  assert.ok(Object.values(receiptOnly.counts).every(count => count === 0));
  assert.equal(receiptOnly.closure.activeData, "deleted");
});

test("unknown account status fails closed rather than allowing a paid request", async () => {
  const response = await accountAccessResponse({ prepare() { throw Error("database unavailable"); } }, "ali");
  assert.equal(response.status, 503);
});

test("readable exports escape unsafe content, preserve unknown values and disclose exclusions", async t => {
  const { sqlite, db } = database(t); seed(sqlite, "ali");
  sqlite.prepare("UPDATE entries SET data=? WHERE user_id=? AND id=?").run(JSON.stringify({ title: "</pre><script>alert('x')</script>", calories: null, sugarGrams: null, text: "你好 • café" }), "ali", "note-1");
  const deps = { userId: "ali", database: () => db };
  const response = await accountResponse(new Request("https://daywell.example/api/account?format=html"), deps);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(!html.includes("<script>")); assert.ok(html.includes("&lt;script&gt;")); assert.ok(html.includes("你好 • café"));
  assert.match(html, /sugarGrams&quot;: null/); assert.match(html, /Device-only/); assert.match(html, /Provider-held/);
  assert.match(response.headers.get("content-security-policy"), /default-src 'none'/);
  assert.equal((await accountResponse(new Request("https://daywell.example/api/account", { headers: { "sec-fetch-site": "cross-site" } }), deps)).status, 403);
});

test("export queries share one transactional snapshot", async t => {
  const { sqlite, db } = database(t); seed(sqlite, "ali");
  let batches = 0;
  const consistent = { prepare: db.prepare, batch: async statements => { batches++; assert.equal(statements.length, personalTables.length + retainedTables.length); return db.batch(statements); } };
  assert.equal((await accountResponse(new Request("https://daywell.example/api/account"), { userId: "ali", database: () => consistent })).status, 200);
  assert.equal(batches, 1);
});

test("all personal and paid API entry points use the account barrier", () => {
  const root = new URL("../app/api/", import.meta.url);
  for (const directory of readdirSync(root, { withFileTypes: true }).filter(item => item.isDirectory() && item.name !== "account")) {
    const source = readFileSync(new URL(directory.name + "/route.ts", root), "utf8");
    assert.match(source, /activeAccountRoute/, directory.name);
    for (const match of source.matchAll(/export const (GET|POST) = (.*);/g)) assert.match(match[2], /activeAccountRoute\(/, directory.name);
    assert.doesNotMatch(source, /export async function (GET|POST)/, directory.name);
  }
});
