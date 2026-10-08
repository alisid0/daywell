# Private tester build — 9 October 2026

Branch: `codex/private-tester-build`. The PR head is the current published checkpoint.

## Included work

This branch starts from GitHub main (`a20ae08`), incorporates the latest Food/Move/voice work from PR #32 (`256aed0`), and integrates the private Cloudflare hosting adapter from PR #31 (`8d6b707`). It preserves newer host routing, general-wellness boundaries, food transactions and validation when resolving older overlapping hosting changes. It includes the one-kettlebell routine and daily voice limits.

Local `/voice-setup#food-ai` now provides masked OpenAI key entry for food photos and recorded descriptions. The existing loopback-only, signed-in, same-origin endpoint saves atomically to ignored `.dev.vars`, preserves ElevenLabs settings and other values, and returns only presence flags. Invalid or oversized keys cannot inject configuration. The hosted page shows connection status without owner key fields; all local setup endpoints remain blocked online.

Keys stay server-side, consistent with [OpenAI authentication guidance](https://developers.openai.com/api/reference/overview). A saved/configured key is not presented as a verified connection.

## Validation

- `npm run install:ci`: passed without regenerating the lockfile.
- `npm run check`: passed, including 170 tests, type checking and production build.
- Scoped lint: passed for the integrated changes; the new key form is also checked directly.
- `npm run cloudflare:check`: synthetic private build and Wrangler dry-run passed.
- `npm run cloudflare:build` using the ignored real profile, then Wrangler dry-run: passed. No upload in these checks.
- Production dependency audit: zero known vulnerabilities reported.
- Isolated local integration check: 93 HTTP checkpoints and all 1,435 recorded audio assets passed. Synthetic records, food transactions/undo/retries, input validation and unauthenticated/forged/cross-origin requests checked. Owner records and credentials were not copied to the test workspace.
- Browser check: local food key field becomes usable after sign-in, accepts a synthetic test key, clears it, and displays the restart/unverified message. No paid API request was made.

The first isolated preview check timed out during its initial compilation; the retry after startup completed passed. The test copy is `outputs/daywell-tester-qa-20261009`, with a separate local database and no real provider keys. Its development server is stopped after testing. The owner's current preview is restored on `http://localhost:5190/`.

## Deployment and remaining acceptance

The owner approved adding `workers_scripts:write` and publishing the specific private app on 9 October, superseding the earlier refusal. Authorization/deployment still need completion; no shareable service is claimed by this checkpoint. Reuse the existing dedicated D1 database and exact-host Access app; do not recreate them or upload local records. The existing local Cloudflare profile is ignored.

The tester's sign-in email has been requested and is not yet known. Keep Access owner-only until the agreed tester is added. An OpenAI key is still required for live food-photo/recorded-description testing. Saved ElevenLabs credentials are available locally but have not yet been tested in this hosted build. Do not alter the live agent or generate audio during deployment.

Follow `docs/cloudflare-hosting.md` for the remaining connection, additive migration check, explicit deployment and Worker-secret setup. Rebuild with the real profile after any normal/synthetic build. Record the deployment version and real phone/account-isolation results here before distributing the link.

See `docs/private-tester-guide.md` for the owner/tester checklist. Real provider calls, two-account hosted isolation, phone microphone/camera permissions, background behaviour and actual listening quality are not covered by local automated checks. PR #34's data controls and PR #35's later design proposals are not included.

Other machine: fetch this branch, run `npm run install:ci`, preserve local credentials/records, and use the documented local migration setup. Keep the separate `daywell-food` greeting and `daywell` audio checkouts intact. Do not merge this PR automatically.
