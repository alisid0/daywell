// Permanently closes ONLY the disposable local-development identity.
// Run after smoke-local in a fresh, isolated QA checkout/database, never a
// daily-use preview. Closed identities stay closed across subsequent runs.
// node scripts/smoke-account.mjs http://localhost:5194 --allow-close-test-account
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

assert.ok(process.argv[2], "Specify an isolated QA origin");
const target = new URL(process.argv[2]);
assert.equal(target.protocol, "http:");
assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(target.hostname));
assert.ok(target.port && target.port !== "5190", "Never close the owner's preview account");
assert.ok(!target.username && !target.password && target.pathname === "/" && !target.search && !target.hash);
assert.ok(process.argv.includes("--allow-close-test-account"), "Explicit disposable-account flag required");
const base = target.origin;
let checks = 0;
const request = (path, options = {}) => fetch(base + path, { ...options, redirect: "manual", signal: AbortSignal.timeout(15000) });
async function expect(response, status, label) {
  assert.equal(response.status, status, label); checks++;
  return response.headers.get("content-type")?.includes("application/json") ? response.json() : response.text();
}
const login = await request("/signin-with-chatgpt?return_to=/account");
const cookie = login.headers.get("set-cookie");
assert.match(cookie || "", /^__sites_local_auth=1;/, "Local mock identity required");
const headers = { Cookie: cookie.split(";")[0], Origin: base, "Content-Type": "application/json" };
const get = path => request(path, { headers });
const post = (path, body, origin = base) => request(path, { method: "POST", headers: { ...headers, Origin: origin }, body: JSON.stringify(body) });
const status = await expect(await get("/api/account?view=status"), 200, "initial account status");
assert.equal(status.status, "active", "Use a fresh isolated test database; never reopen a closed identity");
await expect(await request("/api/account"), 401, "anonymous export");
await expect(await request("/api/account", { headers: { "oai-authenticated-user-id": "forged-user" } }), 401, "forged export");
await expect(await post("/api/account", { action: "delete-account", requestId: randomUUID() }, "https://unrelated.invalid"), 403, "cross-origin closure");
await expect(await post("/api/account", { action: "delete-account" }), 400, "missing explicit request ID");
await expect(await get("/account-deleted"), 307, "no false receipt for an active account");
await expect(await post("/api/state", { action: "upsert", entries: [{
  id: "qa-account-" + randomUUID(), kind: "reflection", data: { date: "2026-10-11", text: "Disposable QA record: café & <script>example</script>" },
}] }), 200, "seed a synthetic record");
const exported = await expect(await get("/api/account"), 200, "JSON export");
assert.ok(exported.entries.some(item => item.data.text?.includes("Disposable QA record")));
const report = await expect(await get("/api/account?format=html"), 200, "readable export");
assert.ok(report.includes("&lt;script&gt;example&lt;/script&gt;"));
assert.ok(!report.includes("<script>"));
await expect(await request("/api/account", { headers: { ...headers, "sec-fetch-site": "cross-site" } }), 403, "cross-site download");
const requestId = randomUUID();
const closed = await expect(await post("/api/account", { action: "delete-account", requestId }), 200, "close disposable account");
assert.equal(closed.receipt.requestId, requestId);
assert.equal(closed.receipt.providerData, "not_automated");
const retry = await expect(await post("/api/account", { action: "delete-account", requestId }), 200, "retry lost response");
assert.deepEqual(retry, closed);
const final = await expect(await get("/api/account?view=status&userId=someone-else"), 200, "current-account receipt");
assert.equal(final.status, "closed");
assert.deepEqual(final.receipt, closed.receipt);
for (const name of ["state", "food", "timer", "capture", "voice", "respond", "food-narration"]) {
  // All support POST; the app's state/food/capture/voice APIs also support GET.
  const denial = await expect(await post("/api/" + name, {}), 410, "closed " + name);
  assert.equal(denial.code, "ACCOUNT_CLOSED");
}
for (const name of ["state", "food", "capture", "voice"])
  await expect(await get("/api/" + name), 410, "closed read " + name);
const empty = await expect(await get("/api/account"), 200, "post-closure export");
assert.ok(Object.values(empty.counts).every(count => count === 0));
assert.deepEqual(empty.closure, closed.receipt);
await expect(await get("/"), 307, "closed home redirects");
const receiptPage = await expect(await get("/account-deleted"), 200, "receipt page");
assert.ok(receiptPage.includes(requestId));
for (const page of ["/privacy", "/support", "/delete-account"])
  await expect(await request(page), 200, "local information page " + page);
console.log("PASS: " + checks + " account HTTP checkpoints; isolated synthetic account closed, retry receipt stable, API saves blocked.");
console.log("No paid requests or hosted/user data used. Does not prove real identity freshness, provider removal or physical-device behaviour.");
