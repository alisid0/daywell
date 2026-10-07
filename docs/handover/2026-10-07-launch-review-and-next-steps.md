# Launch review and next steps — 7 October 2026

**Session date:** Wednesday 7 October 2026, written at 11:23 BST (10:23 UTC), by Claude (Claude Code) on the owner's Windows PC.

**Baseline:** GitHub `main` at `42017b3`. This file records what was reviewed, built and decided in this session, so the other machine can continue from GitHub alone.

## Pull requests ready for the owner's merge

Each has passing GitHub checks and no conflicts with `main`. They touch different files, so they can merge in any order.

| PR | What it does | Notes |
| --- | --- | --- |
| [#26](https://github.com/alisid0/daywell/pull/26) Food basket | Food basket, Next meals and Shopping on Eat: stock with quantities, 2/3/7-day plans, derived shopping, purchases, partial cooking, leftovers, journal and undo | Reviewed and ready. Locally: type check, 100 tests, build, lint and audit pass, and the real screens with sample data completed plan → buy → cook → undo correctly. **After merging, run `npm run setup` on each machine** to apply migrations 0002 and 0003 |
| [#27](https://github.com/alisid0/daywell/pull/27) Readability fixes | Phone layouts at large reading sizes (bottom bar, area headings, calendar controls and weekday names) and three contrast failures (calendar subtitle, Sleep evening caption, calendar small text) | Checked at 320–414px wide with all five Reading comfort fonts and sizes. Handover: `docs/handover/2026-10-07-readability-fixes.md` on its branch |
| [#28](https://github.com/alisid0/daywell/pull/28) Bottom menu backdrop | On phones, a pink gradient rises behind the bottom menu, the menu is tinted with white raised tab buttons, and Today tightens on phones under 720px tall so Talk to Daywell is never covered | Owner approved the before/after preview. New file `app/bottom-menu.css` |

Small follow-ups for #26 after it merges: show friendly dates ("Today", "Wed 7 Oct") instead of `2026-10-07`; in the cook form, list the recipe's ingredients first rather than the whole basket; add more than three recipe ideas.

## Biggest pre-launch gaps found in the review

Checked against the code on `main` and PR 26, and against [the release plan](../mobile-release-plan.md):

1. **Sign-in isn't safe outside ChatGPT's hosting.** `app/chatgpt-auth.ts` trusts the `oai-authenticated-user-id` and email request headers. On any other public host, anyone could send those headers and act as any user. Production needs real sign-in (for example Sign in with Apple and Google) with server sessions. This blocks launch.
2. **No hosted backend.** Everything runs on development machines, with no deployment, backups or tested restore.
3. **No Android or iPhone projects.** There are no native builds yet. iPhone builds need a Mac, and the Apple account isn't ready.
4. **Store privacy requirements.**
   - No in-app account deletion, no data export, and no privacy policy or support page. Deletion must include the Food basket tables, which keep a growing operation history per user.
   - Voice has an explicit opt-in naming ElevenLabs, but photos and recordings sent to OpenAI only show a notice.
5. **No store billing.** There are no subscriptions, and allowances are undecided.
6. **Google testing clock.** If the 12-tester, 14-day rule applies, testing must start by 12 October to apply on 26 October.
7. **Content review.** PR 17's 1,500 audio clips need a human check, especially the urgent-support wording, and Eat has only three recipes.
8. **Ingredient-photo journey.** Photo capture logs meals but doesn't update the Food basket yet. This is in launch scope.

## Waiting on the owner

- **Merges:** #26, #27 and #28.
- **Morning sleep check and steps preview.** Shared, not yet approved. The proposal:
  - Each morning, a one-tap "usual night" sleep check on Today, using the saved bedtime and wake time.
  - A "Steps today" card on Move, filled from the phone's Health app total or from a walk counted while Daywell is open.
  - The release plan defers HealthKit and Health Connect, so all-day automatic steps wait for the native apps.
  - The steps card is new scope: decide before the 26 October freeze.
- **PR 17 audio storage.** It adds 85.5 MB of generated mp3s. The recommendation is Cloudflare R2 rather than git history. The alternative is keeping them in git, which is fine at this size but permanent. PR 17 is still a draft.
- **PR 22 (development dependencies).** It fails because wrangler 4.147 needs `@cloudflare/workers-types` 5. A Dependabot group that lets the Cloudflare packages update together would fix it.
- **PR 12 (zod 4) and PR 13 (TypeScript 7)** stay on hold until tried in the app.
- **Release-plan decisions due 8 October:** what the deadline means, the Apple account, Mac access, hosting, launch countries and prices.

## Suggested next quick wins, in order

1. Ask before photos and recordings go to OpenAI, matching the voice opt-in.
2. Draft privacy policy and support pages, for the owner to check.
3. In-app delete-my-account and export-my-data, covering every table including the Food basket.
4. The Food basket follow-ups above.

## Checks performed this session

- PR 26: `npm run check` (100 tests), lint and production audit passed, plus a real-screen walkthrough with sample data.
- PRs 27 and 28: `npm run check` (70 tests on `main`) and lint passed. Layout and contrast were measured on real screens rendered locally.
- No real Android or iPhone device testing was possible from this machine.

## Setup on the other machine

Fetch `main` after the merges and run `npm run setup` once, for PR 26's migrations. No other setup is needed.

## Work still local

None of the project work. Local before/after preview pages and test scripts on this machine are working material only, not release evidence.
