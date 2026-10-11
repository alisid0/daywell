import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateCloudflareProfile, readCloudflareConfig } from "../scripts/cloudflare-config.mjs";

const fixturePath = new URL("./fixtures/cloudflare-profile.json", import.meta.url);
const profile = JSON.parse(readFileSync(fixturePath, "utf8"));
test("owned build requires a complete profile and refuses placeholder or secret settings", () => {
  for (const invalid of [null, [], {}, { ...profile, databaseId: "00000000-0000-4000-8000-000000000000" },
    { ...profile, accessAudience: "" }, { ...profile, accessIssuer: "https://evil.invalid" },
    { ...profile, appOrigin: "http://localhost:5184" }, { ...profile, appOrigin: "https://daywell.test/path" },
    { ...profile, ELEVENLABS_API_KEY: "must-not-be-here" }, { ...profile, accountId: "REPLACE_ME" },
  ]) assert.throws(() => validateCloudflareProfile(invalid));
});
test("owned build routes assets through authentication and excludes preview and connector bindings", () => {
  const config = readCloudflareConfig(fixturePath);
  assert.equal(config.main, "./build/cloudflare-worker.ts");
  assert.equal(config.assets.run_worker_first, true);
  assert.equal(config.assets.binding, "ASSETS");
  assert.equal(config.preview_urls, false);
  assert.equal(config.observability.enabled, false);
  assert.deepEqual(config.services, []);
  assert.equal(config.d1_databases[0].database_id, profile.databaseId);
  assert.equal(config.vars.DAYWELL_APP_ORIGIN, profile.appOrigin);
  assert.deepEqual(Object.keys(config.vars).sort(), ["CF_ACCESS_AUD", "CF_ACCESS_ISSUER", "DAYWELL_APP_ORIGIN"]);
});
