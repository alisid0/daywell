import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { limits, messageFor, readLimited, sameOrigin, takeAllowance, UserFacingError } from "../lib/request-guards.ts";

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
