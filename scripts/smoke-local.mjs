// Opt-in HTTP integration checks against an isolated, migrated LOCAL preview.
// Never point this at the owner's everyday checkout: it creates synthetic records
// and food audit receipts. It removes only its own records and leaves receipts.
// node scripts/smoke-local.mjs http://localhost:5190 --allow-test-writes
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const target = new URL(process.argv[2] || "http://localhost:5190");
assert.equal(target.protocol, "http:");
assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(target.hostname), "Local preview only");
assert.ok(target.port && !target.username && !target.password && target.pathname === "/" && !target.search && !target.hash);
assert.ok(process.argv.includes("--allow-test-writes"), "Use an isolated QA checkout and explicitly allow test writes");
const base = target.origin;
let checks = 0;
async function request(path, options = {}) {
  const response = await fetch(base + path, { ...options, redirect: "manual", signal: AbortSignal.timeout(15000) });
  return response;
}
async function expectStatus(response, status, label) {
  assert.equal(response.status, status, label);
  checks++;
  return response.headers.get("content-type")?.includes("application/json") ? response.json() : response.text();
}
const login = await request("/signin-with-chatgpt?return_to=/");
const cookie = login.headers.get("set-cookie");
assert.match(cookie || "", /^__sites_local_auth=1;/, "Refuse any service except the local development auth adapter");
assert.match(cookie, /HttpOnly/i);
const headers = { Cookie: cookie.split(";")[0], Origin: base, "Content-Type": "application/json" };
const get = path => request(path, { headers });
const post = (path, body, override = {}) => request(path, { method: "POST", headers: { ...headers, ...override }, body: JSON.stringify(body) });
const state = async () => expectStatus(await get("/api/state"), 200, "read saved state");
const food = async () => expectStatus(await get("/api/food"), 200, "read food state");

for (const path of ["/", "/eat", "/calendar", "/welcome", "/audio-library", "/meditate?session=easy-breath", "/voice-setup", "/designs"]) {
  const response = await get(path);
  assert.equal(response.status, 200, `page ${path}`);
  assert.match(response.headers.get("content-type") || "", /text\/html/);
  assert.match(await response.text(), /Daywell/i);
  checks++;
}

for (const path of ["state", "food", "voice", "capture"]) {
  await expectStatus(await request(`/api/${path}`), 401, `anonymous ${path}`);
  await expectStatus(await request(`/api/${path}`, { headers: { "oai-authenticated-user-id": "forged-test-user" } }), 401, `forged identity ${path}`);
  await expectStatus(await post(`/api/${path}`, {}, { Origin: "https://unrelated.invalid" }), 403, `cross-origin ${path}`);
}
const voice = await expectStatus(await get("/api/voice"), 200, "voice configuration");
const capture = await expectStatus(await get("/api/capture"), 200, "capture configuration");
// Never start a real paid service or send a picture/audio during this smoke test.
if (!voice.configured) await expectStatus(await post("/api/voice", {}), 503, "unconfigured voice fallback");
if (!capture.connected) await expectStatus(await post("/api/capture", {}), 503, "unconfigured capture fallback");
for (const body of [null, 42, [], { action: "upsert", entries: [null] }, { action: "upsert", entries: [] }]) {
  await expectStatus(await post("/api/state", body), 400, "invalid state envelope");
}
await expectStatus(await request("/api/state", { method: "POST", headers, body: "{" }), 400, "malformed JSON");
await expectStatus(await post("/api/state", { action: "unknown", padding: "\u2603".repeat(11000) }), 413, "UTF-8 byte limit");
await expectStatus(await post("/api/food", null), 400, "invalid food envelope");
await expectStatus(await post("/api/food", { padding: "x".repeat(33000) }), 413, "food byte limit");

const prefix = `qa-${randomUUID()}`;
const date = "2026-10-08";
const specimens = {
  task: { title: "QA priority", date, done: false, minutes: 5 },
  grocery: { title: "QA shopping", quantity: "1", done: false },
  food: { title: "QA meal", date, meal: "Dinner", calories: 0, protein: 0, carbs: 0, fat: 0, nutritionKnown: false },
  sleep: { date, bedtime: "22:30", wakeTime: "06:45", minutes: 495, quality: "Okay" },
  move: { title: "QA walk", date, minutes: 10 },
  alarm: { title: "QA disabled alarm", time: "07:30", days: [], enabled: false },
  timer: { title: "QA paused timer", duration: 60, remaining: 60, endAt: null, mode: "Timer" },
  event: { title: "QA plan", date, allDay: false, time: "17:30", minutes: 25, location: "", notes: "", done: false },
  reflection: { date, text: "QA synthetic reflection" },
  session: { title: "QA focus", date, minutes: 5 },
};
const entries = Object.entries(specimens).map(([kind, data]) => ({ id: `${prefix}-${kind}`, kind, data }));
const initialState = await state();
const initialFood = await food();
const stockIds = [`${prefix}-stock`, `${prefix}-race-a`, `${prefix}-race-b`];
let sequence = 0;
const operation = () => `${prefix}-${++sequence}`;
async function change(action, status = 200, revision) {
  const current = revision ?? (await food()).revision;
  const command = { operationId: operation(), expectedRevision: current, action };
  const result = await expectStatus(await post("/api/food", command), status, `food ${action.type}`);
  return { command, result };
}
try {
  await expectStatus(await post("/api/state", { action: "upsert", entries: [entries[0], null] }), 400, "invalid batch atomicity");
  assert.equal((await state()).entries.some(entry => entry.id === entries[0].id), false);
  await expectStatus(await post("/api/state", { action: "upsert", entries }), 200, "save every entry kind");
  for (const entry of entries) assert.deepEqual((await state()).entries.find(item => item.id === entry.id), entry);
  await expectStatus(await post("/api/state", { action: "upsert", entries: [entries[0], entries[0]] }), 400, "duplicate entry IDs");
  const changed = { ...entries[0], data: { ...entries[0].data, title: "QA edited priority" } };
  await expectStatus(await post("/api/state", { action: "host-change", entries: [changed], removeIds: [entries[1].id] }), 200, "atomic host change");
  const afterHost = await state();
  assert.deepEqual(afterHost.entries.find(entry => entry.id === changed.id), changed);
  assert.equal(afterHost.entries.some(entry => entry.id === entries[1].id), false);
  const bought = await change({ type: "purchase", items: [{ id: stockIds[0], ingredient: "QA oats", quantity: 500, unit: "g", bestBefore: null }] });
  const replay = await expectStatus(await post("/api/food", bought.command), 200, "retry purchase");
  assert.equal(replay.replayed, true);
  assert.equal((await food()).state.stock.find(item => item.id === stockIds[0]).quantity, 500);
  await expectStatus(await post("/api/food", { ...bought.command, action: { ...bought.command.action, items: [{ ...bought.command.action.items[0], quantity: 600 }] } }), 409, "reject reused operation with changed payload");
  await change({ type: "stock.remove", id: stockIds[0] }, 409, bought.command.expectedRevision);
  const cooked = await change({ type: "cook", title: "QA oats meal", date, meal: "Breakfast", servings: 1, consumed: [{ stockId: stockIds[0], quantity: 50, unit: "g" }] });
  assert.equal((await food()).state.stock.find(item => item.id === stockIds[0]).quantity, 450);
  assert.equal((await state()).entries.filter(entry => entry.id === `food-${cooked.command.operationId}`).length, 1);
  await expectStatus(await post("/api/food", cooked.command), 200, "retry cooking");
  assert.equal((await food()).state.stock.find(item => item.id === stockIds[0]).quantity, 450);
  await change({ type: "undo", operationId: cooked.command.operationId });
  assert.equal((await food()).state.stock.find(item => item.id === stockIds[0]).quantity, 500);
  assert.equal((await state()).entries.some(entry => entry.id === `food-${cooked.command.operationId}`), false);
  await change({ type: "undo", operationId: cooked.command.operationId }, 409);
  const revision = (await food()).revision;
  const race = await Promise.all(stockIds.slice(1).map(id => post("/api/food", { operationId: operation(), expectedRevision: revision, action: { type: "stock.set", item: { id, ingredient: "QA rice", quantity: 10, unit: "g", bestBefore: null } } })));
  assert.deepEqual(race.map(response => response.status).sort(), [200, 409], "only one simultaneous revision may commit");
  checks++;
} finally {
  // Unique IDs from this invocation only. Never reset the database or settings.
  for (const entry of entries) await expectStatus(await post("/api/state", { action: "remove", id: entry.id }), 200, "remove own fixture");
  for (const id of stockIds) if ((await food()).state.stock.some(item => item.id === id)) await change({ type: "stock.remove", id });
}
assert.deepEqual((await state()).entries, initialState.entries, "pre-existing records preserved");
assert.deepEqual((await state()).settings, initialState.settings, "preferences preserved");
assert.deepEqual((await food()).state, initialFood.state, "pre-existing food basket preserved");

let assets = 0;
for (const collection of ["audio-library", "guided-audio"]) {
  const manifest = await expectStatus(await get(`/${collection}/manifest.json`), 200, `${collection} manifest`);
  const recordings = Object.values(manifest.recordings);
  for (let offset = 0; offset < recordings.length; offset += 8) {
    await Promise.all(recordings.slice(offset, offset + 8).map(async item => {
      assert.ok(item.src.startsWith(`/${collection}/`) && !item.src.includes(".."));
      const response = await request(item.src, { method: "HEAD" });
      assert.equal(response.status, 200, item.src);
      assert.match(response.headers.get("content-type") || "", /^audio\//, item.src);
      assert.equal(Number(response.headers.get("content-length")), item.bytes, item.src);
      assets++;
    }));
  }
}
console.log(`PASS: ${checks} HTTP checkpoints; ${assets} audio assets; saved records, settings and food basket preserved.`);
console.log("Not covered: real providers, hosted accounts, browser journeys, devices or listening-quality review.");
