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
  assert.deepEqual(config.triggers, { crons: ["17 3 * * *"] });
  assert.equal(config.d1_databases[0].database_id, profile.databaseId);
  assert.equal(config.vars.DAYWELL_APP_ORIGIN, profile.appOrigin);
  assert.deepEqual(Object.keys(config.vars).sort(), ["CF_ACCESS_AUD", "CF_ACCESS_ISSUER", "DAYWELL_APP_ORIGIN"]);
});

const publicPath = new URL("./fixtures/cloudflare-public-profile.json", import.meta.url);
const publicProfile = JSON.parse(readFileSync(publicPath, "utf8"));
test("the public profile needs a sender address and refuses Access settings, secrets and placeholders", () => {
  assert.equal(validateCloudflareProfile(publicProfile), publicProfile);
  for (const invalid of [{ ...publicProfile, emailFrom: "" }, { ...publicProfile, emailFrom: "Sign-In@Daywell.test" }, { ...publicProfile, emailFrom: "sign-in@example.com" },
    { ...publicProfile, emailFrom: "no-at-sign" }, { ...publicProfile, accessIssuer: profile.accessIssuer }, { ...publicProfile, DAYWELL_AUTH_SECRET: "must-not-be-here" },
    { ...publicProfile, signIn: "Email" }, { ...publicProfile, appOrigin: "http://localhost:5184" },
  ]) assert.throws(() => validateCloudflareProfile(invalid), JSON.stringify(invalid).slice(0, 80));
});
test("the public build uses email sign-in, a sender-restricted email binding and the same database clean-up", () => {
  const config = readCloudflareConfig(publicPath);
  assert.equal(config.main, "./build/public-worker.ts");
  assert.equal(config.assets.run_worker_first, true);
  assert.equal(config.preview_urls, false);
  assert.equal(config.observability.enabled, false);
  assert.deepEqual(config.triggers, { crons: ["17 3 * * *"] });
  assert.deepEqual(config.vars, { DAYWELL_APP_ORIGIN: publicProfile.appOrigin, DAYWELL_EMAIL_FROM: publicProfile.emailFrom });
  assert.deepEqual(config.send_email, [{ name: "EMAIL", allowed_sender_addresses: [publicProfile.emailFrom] }]);
  assert.equal(config.workers_dev, false);
  assert.deepEqual(config.routes, [{ pattern: "daywell-public-build-test.test", custom_domain: true }]);
  assert.equal(readCloudflareConfig(fixturePath).send_email, undefined, "the private test sends no email");
});
