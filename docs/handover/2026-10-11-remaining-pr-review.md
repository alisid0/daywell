# Review of the remaining pull requests — 11 October 2026

The owner authorised individual review of the remaining PRs, integration of working updates, and updating the private app. This remains a private testing build, not a public or store release. No provider acceptance gate is waived by merging source.

## Individual review

| PR | Finding and disposition |
| --- | --- |
| #36 | Combined Food/Move, private hosting, photo/readout, timer-context and recorded-reply build. Includes #37–#45. Integrate the reviewed additions below before merging to main. |
| #32 | Its head is already an ancestor of #36. Preserve the newer food, movement and wellness implementation; no duplicate feature import is needed. |
| #31 | Its head is already an ancestor of #36. Hosted acceptance documented after its original handover supersedes the old deployment blocker. Preserve the Access boundary and existing hosted database. |
| #30 | The greeting patch was already cherry-picked into hosting. Verified patch equivalence with `git cherry`. Imported the original ancestry while keeping current host, timer and wellness handling; the integration makes no tree change. Browser greeting and timer-confirmation checks pass. |
| #35 | Adds a historical proposal and standalone benchmark. The phrase set is already present. Imported the remaining files and clearly labelled the proposal as historical, linking current implementation/evidence. Offline baseline on the current library: 49% matchable and 42% no-fit; this is not a JEV acceptance result. |
| #12 | Zod 4.6.5 needs explicit record key schemas. Fixed the state request envelope and local connector request/result envelopes. Existing state validation tests and a new connector regression pass; full check passed after this update. |
| #13 | TypeScript 7.0.2 compiles the app, but the existing typescript-eslint crashes when importing its API. Applied Microsoft's documented side-by-side aliases: `@typescript/native` supplies the 7.0.2 `tsc`, while `typescript` resolves to `@typescript/typescript6` 6.0.2 for lint/build API consumers. Type checking and scoped lint pass together. |
| #22 | Original CI fails with ERESOLVE: Wrangler 4.147.0 requires workers-types ^5.20261001.1, but the PR keeps the older 4.x types. Retained the requested tooling upgrades, pinned workers-types 5.20261006.1 and reconciled the lockfile with #12/#13. A fresh `install:ci`, full check and production audit pass. |
| #34 | **Held in draft; not integrated or deployed.** Source review confirms deletion removes five database tables without account/session revocation or a durable write barrier. Existing authenticated state writes can recreate records. The UI falsely says nothing was removed on a lost response and promises complete deletion; the privacy page also has missing operator/contact details, unverified retention claims and an incomplete current provider/profile inventory. Its earlier passing tests do not cover these gaps. Complete the lifecycle, retry/receipt and provider/device cleanup design, verify operator/contact/retention details, and test those cases before merging this destructive feature. |

Compiler compatibility reference: [Microsoft's TypeScript 7 side-by-side guidance](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0).

The unadopted `feat/jev-topic-families` experiment has no PR and is excluded; its known unsuitable replies remain a blocker. JEV is not enabled by this integration, and no paid benchmark or audio generation was run.

## Validation

- Full type check, **215 tests**, and production build passed on the integrated code.
- Scoped lint against the previous private-build checkpoint passed for four changed code files.
- Production dependency audit: zero reported vulnerabilities.
- Fresh isolated local database: all four migrations applied; owner records and credentials were not copied.
- Isolated running app: **93 HTTP/data checkpoints and 1,449 audio assets** passed, including food writes, retries, undo, request guards and preservation of initial records.
- Router smoke: **34 HTTP checks** passed across all six areas without provider calls.
- Browser: onboarding with synthetic details, greeting, a named one-hour PlayStation timer confirmed by typed “okay”, reload persistence, and a subsequent status question passed. The more expansive wording “Set a timer for playing PlayStation for one hour” is outside the bounded local parser and falls back to conversation; broad natural-language and physical microphone behaviour are not established by these checks.
- Eat and timer views inspected at 390×844; Eat also checked with Larger text. No owner browser preferences were changed.
- Existing framework warnings about future native config loading, chunking and static route classification remain non-blocking.

## Setup and release

Use `npm run install:ci` after fetching this integration: the dependency lock changed. No new database migration is introduced. Preserve ignored configuration and records. The review checkout has synthetic data only; the owner's active checkout remains separate until the reviewed GitHub checkpoint passes CI.

Before the private deployment, run `cloudflare:check`, then build again with the existing real profile and inspect the Worker, database, origin and Access bindings. Confirm migrations and keep the previous deployment version available. GitHub publication, main merge, deployment version and hosted acceptance must be recorded after they actually complete.

Remaining release limitations include #34, JEV's provider accuracy/latency gate, real Android/iPhone microphone/camera/locked-screen checks, native packaging, public identity and billing. These are not made complete by the integration tests.
