# Cloudflare connection checkpoint, 8 October 2026

Branch: `codex/cloudflare-private-hosting`. Draft [PR 31](https://github.com/alisid0/daywell/pull/31), based on GitHub `main` at `84b256b`. The PR head identifies the latest published documentation; implementation checks passed at `a835601`.

## Completed and verified

- Recovered the failed Wrangler OAuth callback using a fresh login bound to `127.0.0.1`, keeping its two-minute listener alive while the previously authorized consent was completed. The CLI reported successful login, the browser showed authorization granted, and `whoami` confirmed the intended account and scopes.
- Created the account's dedicated `daywell-private-db` D1 database in WEUR. Applied migrations 0000, 0001, 0002 and 0003 remotely; all passed. A follow-up remote migration listing reported no migrations to apply. No personal local records were uploaded.
- Saved account/database/origin identifiers in ignored `cloudflare.local.json` and a D1-only migration config in ignored `work/cloudflare-d1-setup.json`. After explicit owner approval, created the exact-host Access application and owner-only email policy using Cloudflare sign-in and a 24-hour session, then added the issuer/audience to the ignored profile. No provider credentials are stored in these configurations.
- Integrated the published greeting fix from PR 30. The combined branch passed `npm run check` (110 tests and standard build), scoped lint (13 files), and the owned synthetic build/dry-run. Earlier production dependency audit reported zero vulnerabilities; GitHub CI passed at `a835601`. Documentation received diff and local-link review; CI on subsequent commits must be checked separately.

## Owner action and next steps

The owner completed Zero Trust Free activation. The account overview confirms the plan and team name. The checkout displayed a $0 monthly base fee and protection for up to 50 users, but required a payment method and authorization for usage beyond free allowances. The agent did not enter payment details or accept those terms.

Next:

1. Access application and policy are saved and the real profile is complete. Preserve the exact owner email restriction, Cloudflare sign-in and 24-hour session; do not enable Everyone or Bypass.
2. The greeting fix from open [PR 30](https://github.com/alisid0/daywell/pull/30) is now included in this branch via cherry-pick `733c1a6` of published commit `81489b2`. Neither PR has been merged into main. Combined local checks passed.
3. Follow [the hosting runbook](../cloudflare-hosting.md). Run checks, then build with the complete real profile **last** and inspect the generated configuration. Current build artifacts may contain synthetic CI settings; never deploy those.
4. Confirm migrations remain current, deploy the private Worker, and configure only the intended server-side provider secrets. No audio generation or live agent edits are part of this rollout.
5. Record deployed commit/version and complete anonymous-denial, sign-in, separate-user isolation, logout/expiry and real-phone acceptance. A phone link is not available yet.

## Resources and work kept local

No Worker deployment or provider-secret upload has occurred yet. Real JWKS retrieval, hosted account isolation, phone audio and backup restoration remain unverified. No paid plan, domain, native build or store submission was purchased or created.

Real account and database identifiers remain in ignored local setup files; on another machine, use authorized Wrangler account/database discovery to recover them. Do not create a duplicate database or copy OAuth tokens, local databases or personal records through Git. Each machine authorizes its own CLI if needed.

The active `daywell-food` preview remains on PR 30 with its keys and records intact. The original PR 17 audio checkout is unchanged. Ignored setup configs, logs and browser evidence remain local by design; the handover and runbook are published through PR 31.
