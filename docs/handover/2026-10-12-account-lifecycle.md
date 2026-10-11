# Account lifecycle foundation — 12 October 2026

- Branch: `codex/account-lifecycle`; the draft PR head is the published checkpoint.
- Base: fetched main `f8ee12e`; incorporates PR #34 `feature/your-data` with main's newer wellness/age controls preserved.
- Scope: readable/JSON exports, atomic saved-data closure with durable late-write protection, authenticated retry receipt, account-specific device cleanup, guarded personal/paid APIs and truthful private-test information pages.
- Details and remaining release gates: [account lifecycle](../account-lifecycle.md).
- Local verification: 229 regression tests, typecheck and production build; scoped lint; 93 general HTTP checkpoints and 30 closure HTTP checkpoints against a new isolated local D1 database with synthetic records and no provider secrets.
- Browser verification: phone-width account confirmation, another open tab automatically moving to the receipt after closure, and a reloaded tab receiving the same verified receipt. No browser console errors in those checks.
- Limits: not tested on physical phones or hosted customer identities; no fresh-auth challenge, provider removal/revocation or backup-restore process yet. Keep this PR draft.
- The owner's preview on 5190 stays on `codex/sound-discovery` / PR #46. The private hosted app, its data, credentials and external agents were not changed. Sound-discovery is not included in this account branch and must be preserved during later integration.
- Setup elsewhere: run the documented setup to apply migration 0004 before using account guards. Keep existing records. Never reset/delete a real database or remove a closure receipt to retest.
- Environment note: disk space prevented a second dependency installation. The isolated checkout used the existing dependency installation through a junction only after confirming identical lockfiles. No lockfile/dependency change; future installs must not run through that junction.
- Next implementation: select and connect ordinary customer identity and fresh account verification; implement provider/retention operations. In parallel, native build setup needs Apple enrolment and a Mac/build service confirmation.
- Owner's latest request is a wide release during 12–18 October, superseding the old November target. It is an aspiration, not evidence that the release gates or store review can finish then.
