import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { readCloudflareConfig } from "./cloudflare-config.mjs";

try {
  const args = process.argv.slice(2);
  if (args.length > 1) throw new Error("Usage: npm run cloudflare:build -- [profile.json]");
  const profile = resolve(args[0] || "cloudflare.local.json");
  readCloudflareConfig(profile);
  const build = spawnSync(process.execPath, ["./node_modules/vinext/dist/cli.js", "build"], {
    stdio: "inherit",
    env: { ...process.env, DAYWELL_CLOUDFLARE_PROFILE: profile },
  });
  if (build.error) throw build.error;
  process.exitCode = build.status ?? 1;
  if (!process.exitCode) console.log("Private Cloudflare build ready in dist/server/wrangler.json. Nothing has been deployed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Cloudflare preparation failed.");
  process.exitCode = 1;
}
