# Private tester build — 9 October 2026

Branch: `codex/private-tester-build`, [draft PR #36](https://github.com/alisid0/daywell/pull/36). The PR head is the current published checkpoint; this work is not merged into main.

Private hosted app: https://daywell-private.alisid1994.workers.dev/

Deployed code commit: `0f6ffed341c1fb3937788ba66b15bf9716cb4e63` (9 October, evening update). Cloudflare version: `5b88dad3-5c36-4142-9811-3bc68f54811e`, verified serving 100% of traffic. Subsequent handover-only changes do not change the deployed app. The first release and its checks are recorded below; see the evening update section for current acceptance.

## Included work

This branch starts from GitHub main (`a20ae08`), incorporates the latest Food/Move/voice work from PR #32 (`256aed0`), and integrates the private Cloudflare hosting adapter from PR #31 (`8d6b707`). It preserves newer host routing, general-wellness boundaries, food transactions and validation when resolving older overlapping hosting changes. It includes the one-kettlebell routine and daily voice limits.

Local `/voice-setup#food-ai` now provides masked OpenAI key entry for food photos and recorded descriptions. The existing loopback-only, signed-in, same-origin endpoint saves atomically to ignored `.dev.vars`, preserves ElevenLabs settings and other values, and returns only presence flags. Invalid or oversized keys cannot inject configuration. The hosted page shows connection status without owner key fields; all local setup endpoints remain blocked online.

Keys stay server-side, consistent with [OpenAI authentication guidance](https://developers.openai.com/api/reference/overview). A saved/configured key is not presented as a verified connection.

## Validation

- `npm run install:ci`: passed without regenerating the lockfile.
- Final `npm run check`: passed, including 172 tests, type checking and production build.
- Scoped lint: passed for the integrated changes; the new key form is also checked directly.
- `npm run cloudflare:check`: synthetic private build and Wrangler dry-run passed.
- `npm run cloudflare:build` using the ignored real profile, then Wrangler dry-run: passed. No upload in these checks.
- Production dependency audit: zero known vulnerabilities reported.
- Isolated local integration check: 93 HTTP checkpoints and all 1,435 recorded audio assets passed. Synthetic records, food transactions/undo/retries, input validation and unauthenticated/forged/cross-origin requests checked. Owner records and credentials were not copied to the test workspace.
- Browser check: local food key field becomes usable after sign-in, accepts a synthetic test key, clears it, and displays the restart/unverified message. No paid API request was made.
- GitHub checks passed on the deployed code commit `1fb07f5`.

## Hosted verification and fixes

The first hosted build exposed two production-only problems which local checks did not catch. Styles/scripts returned 404, so the authenticated Worker now serves the ASSETS binding before framework routes, falling through on missing assets. Authentication still runs first; API paths and writes bypass asset lookup. Regression tests cover unauthenticated rejection, CSS, audio ranges and dynamic fall-through.

Next Link's bundled client router then threw when opening meditation pages. The app now uses a small native-anchor link component for page navigation, preserving existing audio-stop callbacks, styling and normal browser link behaviour. Full-page navigation is intentional until the framework router can be revalidated.

Verified on the deployed app in the owner browser:

- Cloudflare sign-in, styled onboarding, and working interactive navigation.
- A clearly labelled synthetic meal with 100 calories and 4 g sugar saved and survived reload. Deleted that entry through the recoverable UI afterward; no test food entry remains.
- The one-kettlebell setup and session controls opened. Ended without saving a workout.
- Relax to Home, at last to audio library to home links work. Recorded narration advanced, paused, resumed and stopped at zero. No new audio was generated.
- Anonymous/forged-identity probes to the root, state, food, voice, capture, local setup and audio manifest all reached Access sign-in. The existing exact-host policy remains owner-only with a 24-hour session.
- Read-only ElevenLabs agent inspection succeeded and reported `eleven_v4_turbo`, authentication enabled and one tool. This is connection/configuration evidence, not a completed live conversation.

A real phone, microphone access, listening quality, sign-out/session-expiry recovery and a second invited account have not been validated by these browser checks.

The first isolated preview check timed out during its initial compilation; the retry after startup completed passed. The test copy is `outputs/daywell-tester-qa-20261009`, with a separate local database and no real provider keys. Its development server is stopped after testing. The owner's current preview is restored on `http://localhost:5190/`.

## Deployment and remaining acceptance

The owner approved adding `workers_scripts:write` and publishing the specific private app on 9 October, superseding the earlier refusal. OAuth authorization and deployment are complete. The existing dedicated D1 database and exact-host Access app were reused; migrations 0000 through 0003 were already current. No local personal records were uploaded. The real Cloudflare profile remains ignored.

The tester's sign-in email has been requested and is not yet known. Keep Access owner-only until the agreed tester is added. The owner explicitly chose to leave food-photo AI disconnected: no OpenAI secret was uploaded and no paid food-photo test was run. Only the approved saved `ELEVENLABS_API_KEY` and `ELEVENLABS_AGENT_ID` were uploaded to this Worker through stdin. No values were printed or committed. The live agent was not changed and no paid conversation was started.

Follow `docs/cloudflare-hosting.md` for future updates. Rebuild with the real profile after any normal/synthetic build. Prior private deployment versions were `685ed2fb-7b5c-4bb5-a052-dfd08b9ccdd0` (initial), `25b18c9d-9b38-41e6-9cf1-c0e9b64a6a09` (secrets) and `b33f5ba0-ffc3-48eb-9870-ac47d637992b` (assets fix). Keep the current version above for handover; do not roll back casually to known broken production navigation/assets. The background sync monitor follows PR #36 source changes only and must not deploy or change secrets/access.

See `docs/private-tester-guide.md` for the owner/tester checklist. Real provider calls, two-account hosted isolation, phone microphone/camera permissions, background behaviour and actual listening quality are not covered by local automated checks. PR #34's data controls and PR #35's later design proposals are not included.

Other machine: fetch this branch, run `npm run install:ci`, preserve local credentials/records, and use the documented local migration setup. Keep the separate `daywell-food` greeting and `daywell` audio checkouts intact. Do not merge this PR automatically.

## Launch assessment publication

The owner requested publication of the latest changes following the 9 October assessment. [Launch readiness](../launch-readiness-2026-10-09.md) now records evidence, blockers, acceptance requirements, owner dependencies and conditional dates. README and the mobile release plan point to it and correct the obsolete hosting status. The current estimate is 6–8 weeks for public Android/iPhone availability, potentially longer; 5 November remains a review checkpoint, with the precise owner milestone unconfirmed.

This follow-up changes documentation only. Diff/whitespace review passed and all 25 relative links across the four changed documents resolved. The 172 passing tests are evidence for the existing app, not a newly run suite for this publication. There are no app, migration, credential or deployment changes. GitHub checks for the new documentation commit must be reported separately. The deployed code/version above remains the phone build. Implementation of the listed gaps is still outstanding.

## Private update, 9 October 2026 evening

The owner explicitly requested publication of the latest test build and subsequent checks. GitHub `0f6ffed` was clean, matched the remote branch and had a successful check before deployment. It includes PRs #37–#41: everyday wellness-filter fixes, larger Eat/Move text, Food basket undo, simpler Move/Sleep/Relax controls, About you and the product-area guidance. PR #36 remains open; this deployment does not merge it into main.

- Published at 22:20 UTC on 9 October (23:20 Europe/London). Cloudflare version `5b88dad3-5c36-4142-9811-3bc68f54811e` is confirmed at 100% traffic. Previous version `e9249756-2a85-4f9d-a9e4-bc0e85cec842` remains the prior release reference.
- The app changes passed the local type check, 185 tests and production build; scoped lint found no added errors across the 25 changed source files. Those checks were completed during the afternoon sync and were not redundantly rerun for this unchanged source revision. GitHub's successful check also includes the Cloudflare packaging gate.
- A fresh build using the real ignored Cloudflare profile and Wrangler dry-run passed. Generated Worker/account/database/origin/Access settings, authenticated asset handling and disabled preview URLs were checked against that profile before upload.
- No lockfile or database migrations changed since the previous deployment. The remote migration check confirmed no pending migrations. No local database or user records were uploaded.
- Eight anonymous/forged-identity checks against the root, APIs and an asset route all redirected to Access sign-in. The existing signed-in owner browser loaded the new About you prompt after refresh; its phone-width layout was inspected at 390 px.
- Further authenticated screen journeys are pending the owner entering their age in the new one-time prompt. No age, sex, height or weight was invented or saved during these checks. Actual phone sign-in, microphone/audio behaviour, live conversations and a separately invited account remain unverified.
- Access policies, provider secrets and the live ElevenLabs agent were unchanged. Food-photo AI remains disconnected at the owner's request, and no paid provider calls were made. The local development server was not running during hosted verification.

Next: complete About you directly in the private app, then verify the updated Food/Move/Sleep/Relax flows and save/reload behaviour on the phone. Height, weight and sex are optional. Keep the hosted app private and do not treat this deployment as store or public-launch readiness. Background sync still updates source only and must not deploy subsequent commits automatically.
