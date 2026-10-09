# Owned Cloudflare hosting

The owner selected Cloudflare on 7 October 2026 and has created an account. This path prepares a private internet-accessible Daywell for phone testing. It uses Workers for the app, D1 for records, and Cloudflare Access for invited testers. The computers can be switched off after deployment. This is a staging foundation, not completed consumer authentication or an App Store/Google Play release.

## Security boundary

`npm run cloudflare:build` uses `build/cloudflare-worker.ts`, separate from the Sites/local entry point. Every request, including static assets, passes through authentication. It verifies the Access JWT signature with the team's public keys, exact issuer, application audience, expiry, issued-at and person identity. The Worker replaces incoming identity headers with the verified identity before invoking the app. A stable issuer/subject hash scopes D1 records; changing an email does not create another account. Tokens and identities are not logged by this middleware.

Missing settings, invalid tokens and alternate hostnames are rejected. Development cookies and arbitrary `oai-authenticated-user-*` headers cannot sign anyone in. The local credential-writing endpoint is disabled. Preview URLs are disabled; the Worker accepts only its configured HTTPS origin. Responses use private/no-store caching for this initial private version. Logging is initially disabled to avoid collecting personal request metadata; privacy-reviewed operational monitoring remains a release task.

Configure an **Allow policy for the owner's exact email**, then explicitly invited testers. Do not use an Everyone or Bypass policy. Cloudflare Access is a private tester gate; customer registration, native sign-in, account deletion, billing and production monitoring still need implementation. Keep the existing local identity isolated; local records and preferences are not automatically migrated to hosted accounts.

## First setup

1. Finish Cloudflare account setup. The owner reviews any terms or payment requirements. Do not buy a plan or domain without their decision. Use a Workers address for the private test; choose a custom domain before business launch.
2. Authorize the repository's installed Wrangler. The required scope set is `account:read user:read workers:write workers_scripts:write d1:write`; Wrangler also asks for renewable background access. The browser approval belongs to the owner. `workers:write` alone did not permit the deployment API with the pinned CLI; the separate script scope is required. Do not paste tokens or passwords into chat or source code.

   **Historical owner decision, 8 October:** keep the existing permissions. This was superseded on 9 October by explicit approval for Worker scripts permission and private deployment. Authorization is complete; do not repeat login unless the existing authorization expires or fails.

   ```sh
   npx wrangler login --callback-host=127.0.0.1 --scopes account:read user:read workers:write workers_scripts:write d1:write
   npx wrangler whoami
   ```

   Keep the login process running while approving the browser prompt. The pinned Wrangler version waits two minutes for its local callback, then closes the listener. If the browser says the callback site cannot be reached, check whether that process timed out. Start a fresh login and use its new link promptly; do not replay or share an old callback URL, which contains an authorization code. Binding explicitly to `127.0.0.1` avoids a localhost IPv4/IPv6 mismatch. Confirm success with `whoami` before creating resources.

3. Establish the account's Workers subdomain. Create a dedicated D1 database, `daywell-private-db`, and record its returned ID. Start with new storage; do not upload the development database or the owner's local records.

   ```sh
   npx wrangler d1 create daywell-private-db
   ```

4. Set up Cloudflare Zero Trust if necessary, then create a **self-hosted Access application** for the exact `daywell-private.<subdomain>.workers.dev` hostname, covering all paths. Restrict the Allow policy to the owner's email, using an email one-time code or an explicitly configured identity provider. Record the team issuer URL and this application's AUD tag. If setup needs terms or a payment method, the owner completes that step. Do not activate broader account-wide protection for unrelated apps.
5. Copy `cloudflare.example.json` to ignored `cloudflare.local.json`. Fill in the Worker name, account ID, D1 name/ID, exact HTTPS app origin, Access issuer and AUD. These identifiers are configuration, not provider secrets. The validator rejects placeholders and unexpected fields. API keys belong in Worker secrets.

## Build and deploy deliberately

From the intended reviewed GitHub revision, with Node 22.13 or later:

```sh
npm run install:ci
npm run check
npm run lint:changed
npm run cloudflare:check
npm run cloudflare:build
npx wrangler deploy --dry-run --config dist/server/wrangler.json
```

`cloudflare:check` builds against synthetic configuration and packages locally. It neither authenticates nor deploys. **Always run `cloudflare:build` with the real profile afterwards.** Ordinary `build`/`check` also replaces `dist`, so rerun the owned build if either has run. Inspect the generated account, database, origin, Access settings and `assets.run_worker_first: true` before remote commands. Never deploy the ordinary local build, the synthetic test bundle, or the old Sites placeholder database.

Only after the owner has approved connecting this account and the Access policy exists:

```sh
npx wrangler d1 migrations apply DB --remote --config dist/server/wrangler.json
npx wrangler deploy --config dist/server/wrangler.json
```

This initial rollout creates a separate private service. Do not point an existing production domain at it. Record the exact GitHub commit, deployment version, URL and migration results in the PR handover. No automatic deployment on push is configured.

Set provider credentials through the Worker secret prompts, after checking their intended destination and existing ElevenLabs agent settings. Do not put values on command lines, in build variables or committed JSON:

```sh
npx wrangler secret put ELEVENLABS_API_KEY --config dist/server/wrangler.json
npx wrangler secret put ELEVENLABS_AGENT_ID --config dist/server/wrangler.json
```

Configure optional OpenAI secrets only when that feature is being enabled. The server must remain the only holder of provider keys. The local setup form is unavailable online. Do not generate audio or change the live agent as part of deployment.

## Acceptance before sharing the phone link

- An anonymous/private browser reaches Access sign-in; a non-invited identity is denied.
- A forged authenticated-user header or local development cookie cannot access `/api/state`, `/api/food`, `/api/voice` or `/api/capture`; neither can an alternate hostname.
- The owner signs in on a phone, saves a new non-sensitive test entry and sees it after reload and on a second browser. Test a separately invited account to establish record isolation; unit tests are not a substitute for this hosted check.
- Sign-out and expired sign-in recovery work. Access sign-out uses the team's logout endpoint and can sign out other Access-protected apps on that team.
- Microphone consent, denial, stop, navigation and an explicitly authorized live conversation are checked on the real phone. Typing and recorded audio remain usable independently of live voice. Desktop web checks do not prove native/background audio readiness.
- Test with the development server stopped. Confirm only HTTPS addresses are used. Browser-local appearance preferences will not transfer automatically.
- Recheck API allowance limits and provider retention settings before inviting others.

No hosted or phone acceptance checks have passed merely because the build succeeds. Keep the rollout private until these are recorded.

## Setup checkpoint, 8 October 2026

Wrangler authorization is complete. The dedicated `daywell-private-db` database was created in Western Europe and all four existing migrations (0000 through 0003) applied successfully. A subsequent remote migration listing reported no pending migrations. No local personal records were uploaded.

The owner completed Zero Trust Free onboarding; the account overview confirms the Free plan and a team name. Its checkout displayed a $0 monthly base price but required billing details, terms acceptance and authorization for charges above included limits. Following explicit approval, the exact-host `Daywell private` Access application and owner-only email rule were saved with Cloudflare sign-in and a 24-hour session. The ignored local profile now contains the real account, database, origin, team issuer and application audience.

The first deployment attempt was rejected at Cloudflare's deployments API with `No access to the specified resource` before any app upload. The owner chose to retain the current permissions, so deployment is blocked. No provider secrets have been uploaded. The attempt also exposed a missing `ASSETS` binding; that is now configured and checked so the authenticated Worker can serve static files through Vinext. The greeting fix from PR 30 is included in the hosting branch. Continue from the [session handover](handover/2026-10-08-cloudflare-connection.md); do not create another database or repeat successful account authorization unnecessarily.

## Published private test, 9 October 2026

The owner subsequently approved the missing Worker scripts permission and private deployment. The app is hosted at [Daywell private test](https://daywell-private.alisid1994.workers.dev/), with the existing owner-only Access policy. Approved ElevenLabs secrets are connected. OpenAI was initially left disconnected by request, then connected on 10 October after the owner saved a key and requested activation. See the [initial deployment handover](handover/2026-10-09-private-tester-build.md) and [current food AI/router deployment](handover/2026-10-10-response-router.md) for exact code/versions, successful checks and remaining phone/tester acceptance. The earlier blocked checkpoint above is historical.

## Updating and recovery

Fetch the reviewed GitHub revision, check it, rebuild with the real profile, and inspect/apply additive migrations before deployment. Keep prior Worker version IDs for rollback. Code rollback does not undo a database migration; use forward-compatible changes. D1 Time Travel is available for recovery, but a restore can overwrite later records. Before launch, exercise backup/restore on a separate test database and document the procedure. Never restore the live database casually or delete records to make migrations pass.

The browser-based private service can support native clients later. App signing, native audio/reminders, customer accounts, deletion, store purchases and reviewer access remain separate milestones in the [mobile release plan](mobile-release-plan.md).

## References

- [Cloudflare Access on Workers](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)
- [Validate Access JWTs](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)
- [Workers addresses and custom domains](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/)
- [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)
- [D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/)

The implementation uses the repository's pinned Vite/Workers runtime and JWT verification, rather than relying on a newer `ctx.access` API that is unavailable behind some static-asset routers.
