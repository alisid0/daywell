# Cloudflare connection checkpoint, 8 October 2026

Branch: `codex/cloudflare-private-hosting`. Draft [PR 31](https://github.com/alisid0/daywell/pull/31), based on GitHub `main` at `84b256b`. The PR head identifies the latest published documentation; implementation checks passed at `a835601`.

## Completed and verified

- Recovered the failed Wrangler OAuth callback using a fresh login bound to `127.0.0.1`, keeping its two-minute listener alive while the previously authorized consent was completed. The CLI reported successful login, the browser showed authorization granted, and `whoami` confirmed the intended account and scopes.
- Created the account's dedicated `daywell-private-db` D1 database in WEUR. Applied migrations 0000, 0001, 0002 and 0003 remotely; all passed. A follow-up remote migration listing reported no migrations to apply. No personal local records were uploaded.
- Saved account/database/origin identifiers in ignored `cloudflare.local.json` and a D1-only migration config in ignored `work/cloudflare-d1-setup.json`. No provider credentials are stored in these configurations. Access issuer and audience are deliberately blank until setup is complete, so the app build remains blocked by validation.
- Documentation-only changes received diff and local-link review. No app code changed in this session. Earlier implementation validation: `npm run check` (108 tests and standard build), scoped lint, owned synthetic build/dry-run and production dependency audit all passed; GitHub CI passed at `a835601`.

## Owner action and next steps

Zero Trust Free onboarding reached its payment/terms screen. It displays a $0 monthly base fee and protection for up to 50 users, but requires a payment method and authorization for usage beyond free allowances. The owner must review those terms and complete activation if accepted. Selecting the Free plan has not activated it.

After activation:

1. Create the exact-host self-hosted Access application with an Allow policy for the owner's exact email only. Record team issuer and application AUD in the ignored profile; do not enable Everyone or Bypass.
2. Before presenting the hosted user experience, integrate the greeting fix from open [PR 30](https://github.com/alisid0/daywell/pull/30) deliberately. It is not yet part of this main-based hosting branch.
3. Follow [the hosting runbook](../cloudflare-hosting.md). Run checks, then build with the complete real profile **last** and inspect the generated configuration. Current build artifacts may contain synthetic CI settings; never deploy those.
4. Confirm migrations remain current, deploy the private Worker, and configure only the intended server-side provider secrets. No audio generation or live agent edits are part of this rollout.
5. Record deployed commit/version and complete anonymous-denial, sign-in, separate-user isolation, logout/expiry and real-phone acceptance. A phone link is not available yet.

## Resources and work kept local

No Worker deployment, Access application/policy or provider-secret upload has occurred. Real JWKS retrieval, hosted account isolation, phone audio and backup restoration remain unverified. No paid plan, domain, native build or store submission was purchased or created.

Real account and database identifiers remain in ignored local setup files; on another machine, use authorized Wrangler account/database discovery to recover them. Do not create a duplicate database or copy OAuth tokens, local databases or personal records through Git. Each machine authorizes its own CLI if needed.

The active `daywell-food` preview remains on PR 30 with its keys and records intact. The original PR 17 audio checkout is unchanged. Ignored setup configs, logs and browser evidence remain local by design; the handover and runbook are published through PR 31.
