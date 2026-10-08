import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { everyone, limits, messageFor, readLimited, returnAllowances, sameOrigin, takeAllowance, takeAllowances, UserFacingError } from "../lib/request-guards.ts";

const post = headers => new Request("https://daywell.example/api/state", { method: "POST", headers, body: "{}" });

test("only requests that prove they come from Daywell may change data", () => {
  assert.equal(sameOrigin(post({ origin: "https://daywell.example", "sec-fetch-site": "same-origin" })), true);
  assert.equal(sameOrigin(post({ origin: "https://daywell.example" })), true);
  assert.equal(sameOrigin(post({ "sec-fetch-site": "same-origin" })), true);
  assert.equal(sameOrigin(post({ origin: "https://elsewhere.example" })), false);
  assert.equal(sameOrigin(post({ "sec-fetch-site": "cross-site" })), false);
  assert.equal(sameOrigin(post({ origin: "https://daywell.example", "sec-fetch-site": "same-site" })), false);
  assert.equal(sameOrigin(post({ origin: "null" })), false);
  assert.equal(sameOrigin(post({})), false);
});

test("uploads are capped by what actually arrives, not by the size the request claims", async () => {
  const body = new Uint8Array(2048).fill(7);
  const small = await readLimited(new Request("https://daywell.example", { method: "POST", body, headers: { "content-length": "1" } }), 4096);
  assert.equal(small?.byteLength, 2048);
  const big = await readLimited(new Request("https://daywell.example", { method: "POST", body, headers: { "content-length": "1" } }), 1024);
  assert.equal(big, null);
  assert.equal((await readLimited(new Request("https://daywell.example"), 10))?.byteLength, 0);
});

test("only messages written for people reach the browser", () => {
  assert.equal(messageFor(new UserFacingError("Please try a clearer photo."), "Generic"), "Please try a clearer photo.");
  assert.equal(messageFor(new Error("D1_ERROR: no such table"), "Generic"), "Generic");
  assert.equal(messageFor("boom", "Generic"), "Generic");
});

test("allowances count per person and feature, refuse the extra use and reset with the window", async () => {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync(new URL("../drizzle/0001_usage_limits.sql", import.meta.url), "utf8").replaceAll("--> statement-breakpoint", ""));
  const db = { prepare: sql => ({ bind: (...values) => ({ first: async () => sqlite.prepare(sql).get(...values) ?? null }) }) };
  const start = Date.UTC(2026, 9, 5, 12);
  for (let use = 1; use <= limits.voice.max; use++) assert.equal(await takeAllowance(db, "ali", "voice", start), true, `voice use ${use}`);
  assert.equal(await takeAllowance(db, "ali", "voice", start), false);
  assert.equal(await takeAllowance(db, "sam", "voice", start), true);
  assert.equal(await takeAllowance(db, "ali", "capture", start), true);
  assert.equal(await takeAllowance(db, "ali", "voice", start + limits.voice.windowMs), true);
});

test("live conversations stop at the daily cap per person and for everyone, and refused starts don't count", async () => {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync(new URL("../drizzle/0001_usage_limits.sql", import.meta.url), "utf8").replaceAll("--> statement-breakpoint", ""));
  const db = { prepare: sql => ({ bind: (...values) => ({ first: async () => sqlite.prepare(sql).get(...values) ?? null }) }) };
  const count = (user, feature) => sqlite.prepare("SELECT count FROM usage_limits WHERE user_id=? AND feature=?").get(user, feature)?.count ?? 0;
  const start = (user, now) => takeAllowances(db, [[user, "voice"], [user, "voice-day"], [everyone, "voice-all"]], now);
  const morning = Date.UTC(2026, 9, 8, 6), gap = limits.voice.windowMs;

  // One person: the ten-minute limit still applies first, and the daily cap stops the eleventh start.
  for (let use = 0; use < limits["voice-day"].max; use++) assert.equal(await start("ali", morning + use * gap), null, `start ${use + 1}`);
  assert.equal(await start("ali", morning + limits["voice-day"].max * gap), "voice-day");
  assert.equal(count("ali", "voice-day"), limits["voice-day"].max);
  assert.equal(count("ali", "voice"), 0, "the refused start's ten-minute use was given back");
  assert.equal(count(everyone, "voice-all"), limits["voice-day"].max, "the refused start never reached everyone's total");
  assert.equal(await start("ali", Date.UTC(2026, 9, 9, 6)), null, "a new day starts afresh");

  // Everyone together: once the shared total is reached, nobody else can start, and their own counts are given back.
  sqlite.exec(`UPDATE usage_limits SET count=${limits["voice-all"].max} WHERE user_id='*'`);
  assert.equal(await start("sam", Date.UTC(2026, 9, 9, 7)), "voice-all");
  assert.equal(count("sam", "voice"), 0);
  assert.equal(count("sam", "voice-day"), 0);

  // A burst refusal takes nothing from the daily allowances.
  for (let use = 0; use < limits.voice.max; use++) await takeAllowance(db, "kim", "voice", morning);
  assert.equal(await start("kim", morning), "voice");
  assert.equal(count("kim", "voice-day"), 0);
});

test("a start that the paid service refuses is given back, so only real conversations count", async () => {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync(new URL("../drizzle/0001_usage_limits.sql", import.meta.url), "utf8").replaceAll("--> statement-breakpoint", ""));
  const db = { prepare: sql => ({ bind: (...values) => ({ first: async () => sqlite.prepare(sql).get(...values) ?? null }) }) };
  const count = (user, feature) => sqlite.prepare("SELECT count FROM usage_limits WHERE user_id=? AND feature=?").get(user, feature)?.count ?? 0;
  const uses = [["ali", "voice"], ["ali", "voice-day"], [everyone, "voice-all"]];
  const now = Date.UTC(2026, 9, 8, 9);

  assert.equal(await takeAllowances(db, uses, now), null);
  assert.equal(await takeAllowances(db, uses, now), null);
  await returnAllowances(db, uses, now); // the second start failed at the provider
  assert.deepEqual(uses.map(([user, feature]) => count(user, feature)), [1, 1, 1]);

  // Giving back never goes below zero, and never touches a later window.
  await returnAllowances(db, uses, now);
  await returnAllowances(db, uses, now);
  assert.deepEqual(uses.map(([user, feature]) => count(user, feature)), [0, 0, 0]);
  assert.equal(await takeAllowances(db, uses, Date.UTC(2026, 9, 9, 9)), null);
  await returnAllowances(db, uses, now);
  assert.equal(count("ali", "voice-day"), 1, "yesterday's give-back leaves today's count alone");
});
