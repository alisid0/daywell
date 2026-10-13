import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Two kinds of owned hosting: the private test behind Cloudflare Access (docs/cloudflare-hosting.md), and the
// public app with email sign-in (docs/sign-in.md), chosen with "signIn": "email".
const shared = ["workerName", "accountId", "databaseName", "databaseId", "appOrigin"];
const accessFields = [...shared, "accessIssuer", "accessAudience"];
const emailFields = ["signIn", ...shared, "emailFrom"];

/** @param {unknown} input */
export function validateCloudflareProfile(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Cloudflare profile must be an object.");
  const profile = /** @type {Record<string, string>} */ (input);
  const fields = profile.signIn === "email" ? emailFields : accessFields;
  if (Object.keys(profile).some((key) => !fields.includes(key))) throw new Error("Unknown Cloudflare profile setting. Keep API keys in Worker secrets, never in this file.");
  for (const field of fields) {
    if (typeof profile[field] !== "string" || !profile[field] || /REPLACE|YOUR_|example|00000000-0000/i.test(profile[field])) {
      throw new Error(`Set ${field} in the Cloudflare profile before building.`);
    }
  }
  if (!/^[a-z][a-z0-9-]{2,62}$/.test(profile.workerName)) throw new Error("Invalid Worker name.");
  if (!/^[a-f0-9]{32}$/.test(profile.accountId)) throw new Error("Invalid Cloudflare account ID.");
  if (!/^[a-zA-Z0-9_-]{1,63}$/.test(profile.databaseName)) throw new Error("Invalid D1 database name.");
  if (!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(profile.databaseId)) throw new Error("Invalid D1 database ID.");
  const origin = new URL(profile.appOrigin);
  if (origin.protocol !== "https:" || origin.origin !== profile.appOrigin || !origin.hostname.includes(".") || origin.port || origin.hostname.endsWith(".local")) throw new Error("Use the exact public HTTPS origin, without a path or trailing slash.");
  if (profile.signIn === "email") {
    if (!/^[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(profile.emailFrom)) throw new Error("Use a lower-case sender address on the domain set up for Email Service.");
    return profile;
  }
  if (!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(profile.accessIssuer)) throw new Error("Use your Cloudflare Access team domain, without a trailing slash.");
  if (!/^[a-f0-9]{64}$/.test(profile.accessAudience)) throw new Error("Use the Access application's 64-character AUD tag.");
  return profile;
}

/** @param {string} path */
export function readCloudflareConfig(path) {
  const p = validateCloudflareProfile(JSON.parse(readFileSync(path, "utf8")));
  const common = {
    name: p.workerName,
    account_id: p.accountId,
    compatibility_date: "2026-05-15",
    compatibility_flags: ["nodejs_compat"],
    preview_urls: false,
    assets: { binding: "ASSETS", run_worker_first: true },
    observability: { enabled: false },
    // Daily at 03:17 UTC: removes reports of AI replies older than 90 days, and expired sign-in codes and sessions.
    triggers: { crons: ["17 3 * * *"] },
    d1_databases: [{ binding: "DB", database_name: p.databaseName, database_id: p.databaseId, migrations_dir: resolve("drizzle") }],
    services: [],
    r2_buckets: [],
  };
  if (p.signIn === "email") {
    const host = new URL(p.appOrigin).hostname, workersDev = host.endsWith(".workers.dev");
    return {
      ...common,
      main: "./build/public-worker.ts",
      workers_dev: workersDev,
      ...(workersDev ? {} : { routes: [{ pattern: host, custom_domain: true }] }),
      vars: { DAYWELL_APP_ORIGIN: p.appOrigin, DAYWELL_EMAIL_FROM: p.emailFrom },
      // The binding can only send from Daywell's own sign-in address.
      send_email: [{ name: "EMAIL", allowed_sender_addresses: [p.emailFrom] }],
    };
  }
  return {
    ...common,
    main: "./build/cloudflare-worker.ts",
    workers_dev: true,
    vars: {
      DAYWELL_APP_ORIGIN: p.appOrigin,
      CF_ACCESS_ISSUER: p.accessIssuer,
      CF_ACCESS_AUD: p.accessAudience,
    },
  };
}
