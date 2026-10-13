// Build/package validation only. The fixtures are synthetic and are never deployed.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

function run(args) {
  const result = spawnSync(process.execPath, args, { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
function buildAndDryRun(fixture, outdir) {
  run(["scripts/build-cloudflare.mjs", fixture]);
  const config = JSON.parse(readFileSync("dist/server/wrangler.json", "utf8"));
  run(["--import", "./scripts/sites-env.mjs", "node_modules/wrangler/bin/wrangler.js", "deploy", "--dry-run", "--config", "dist/server/wrangler.json", "--outdir", outdir]);
  return config;
}

// The public app with email sign-in (docs/sign-in.md).
const open = buildAndDryRun("tests/fixtures/cloudflare-public-profile.json", "work/cloudflare-public-dry-run");
assert.equal(open.name, "daywell-public-build-test");
assert.equal(open.assets.run_worker_first, true);
assert.equal(open.preview_urls, false);
assert.equal(open.vars.DAYWELL_APP_ORIGIN, "https://daywell-public-build-test.test");
assert.deepEqual(open.send_email, [{ name: "EMAIL", allowed_sender_addresses: ["sign-in@daywell-public-build-test.test"] }]);
assert.equal(open.vars.CF_ACCESS_AUD, undefined);

// The private test behind Cloudflare Access. Built last, so dist/ holds the private test bundle afterwards.
const config = buildAndDryRun("tests/fixtures/cloudflare-profile.json", "work/cloudflare-dry-run");
assert.equal(config.name, "daywell-build-test");
assert.equal(config.assets.run_worker_first, true);
assert.equal(config.assets.binding, "ASSETS");
assert.equal(config.preview_urls, false);
assert.equal(config.vars.DAYWELL_APP_ORIGIN, "https://daywell-build-test.test");
assert.equal(config.d1_databases[0].database_id, "11111111-1111-4111-8111-111111111111");
assert.equal(config.services.length, 0);
console.log("Cloudflare builds and dry-runs passed; no login, resources or deployment performed. Rebuild with your real profile before deployment.");
