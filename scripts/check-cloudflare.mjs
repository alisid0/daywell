// Build/package validation only. The fixture is synthetic and is never deployed.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

function run(args) {
  const result = spawnSync(process.execPath, args, { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
run(["scripts/build-cloudflare.mjs", "tests/fixtures/cloudflare-profile.json"]);
const config = JSON.parse(readFileSync("dist/server/wrangler.json", "utf8"));
assert.equal(config.name, "daywell-build-test");
assert.equal(config.assets.run_worker_first, true);
assert.equal(config.preview_urls, false);
assert.equal(config.vars.DAYWELL_APP_ORIGIN, "https://daywell-build-test.test");
assert.equal(config.d1_databases[0].database_id, "11111111-1111-4111-8111-111111111111");
assert.equal(config.services.length, 0);
run(["--import", "./scripts/sites-env.mjs", "node_modules/wrangler/bin/wrangler.js", "deploy", "--dry-run", "--config", "dist/server/wrangler.json", "--outdir", "work/cloudflare-dry-run"]);
console.log("Cloudflare build and dry-run passed; no login, resources or deployment performed. Rebuild with your real profile before deployment.");
