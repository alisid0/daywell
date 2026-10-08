# Connected food and recovery checkpoint

Session date: 8 October 2026
Branch: `codex/connected-food-recovery`
Base: GitHub `main` at `84b256b`. The PR head is the published checkpoint.

## What changed

- Spoken/typed host shopping and older grocery notes now appear in the main Shopping view. Records remain in their original store; no destructive migration or guessed inventory import occurs. A food purchase asks for the actual amount and unit, then updates stock and the original note in one transaction. Household notes can be completed without creating ingredients.
- Grocery writes from the host/older entry endpoint invalidate open food reviews. Food saves compare both the revision and current shopping rows; purchases, retry receipts, undo and original notes commit together. The same reviewed host proposal also retains its entry IDs during an in-page retry.
- Food forms and uncertain saves have account-scoped, validated browser recovery. Reloading offers an explicit return/continue flow. Pending commands retain their original operation ID, revision and payload. Server requests verify the restored account scope. Account changes and the app sign-out link clear recovery copies. Blocked browser storage warns instead of promising recovery. Idle tabs do not clear another tab's draft; a stale recovery write is rejected. This is local draft protection, not a multi-device or simultaneous-tab editing system.
- Next meals now has a reviewed 2/3/7-day editor, with existing meals included, optional starters, custom ingredients and serving scaling. It uses the existing `plan.window` transaction; dates outside the reviewed range are preserved. It does not generate a personalised diet or automatically validate dietary suitability. Shopping still covers all saved plans, with the existing explicit outside-date warning.
- Calendar reads original food plans, shows the planned days and opens the corresponding date in Next meals. No duplicate calendar entry is written. Calendar export still excludes these meal plans, and the UI states that limitation.
- Included the already-published greeting fix from PR #30 (`81489b2`, cherry-picked as `a7e854b`), plus validated state-request envelopes and their regression tests from the hosting work. Hosting/auth integration from PR #31 is not included. Checkout-local hosting configuration remains ignored.

## Checks performed

- `npm run check`: passed type checking, all **115 tests**, and the production build.
- `npm run lint:changed`: passed, no new lint errors in the 25 changed code files.
- `git diff --cached --check`: passed.
- New automated cases exercise original-note projection, combined host actions, per-user separation, actual-quantity purchase, lost-response replay, undo, stale shopping conflicts, long legacy IDs, account-switch rejection, incomplete/corrupt recovery records, exact-command restoration, and stale-tab recovery-write protection.
- Browser walkthrough on an isolated local D1 preview (`http://localhost:5190/`, synthetic QA records): typed a combined shopping/focus request, reviewed and saved it, and found the new item in Shopping. Reviewed an oat-drink purchase for 2 litres, reloaded and recovered it, stopped only this preview server before submission, restored the server and retried from a fresh tab. The result was one 2,000 ml lot and the original note marked picked up.
- Reviewed three days together: retained an existing rice plan, added eggs/greens and berry oats, changed oats to two servings, reloaded during the draft, continued and saved all three. Verified dates and scaled ingredient totals.
- Calendar displayed the correct planned meals on 8, 9 and 10 October. Opening the 9 October meal returned to the original plan/date. Calendar/meal display at 390 pixels and the expanded planner at 320 pixels had no horizontal overflow. These are desktop browser viewport checks, not physical-device evidence.
- No production deployment, live provider changes, microphone/camera session or purchased audio was used. Port 5184 and the separate PR #17 checkout were left intact.

## Not yet complete or verified

This closes the first product-connectivity batch from the [improvements report on PR #31](https://github.com/alisid0/daywell/blob/codex/cloudflare-private-hosting/docs/handover/2026-10-08-improvements-report.md), not every recommendation or launch gate.

- Independent phone hosting remains blocked by the unchanged Cloudflare deployment-permission decision. Do not broaden permissions or use an alternative credential to bypass it.
- Customer account lifecycle, hosted logout/session-expiry and two hosted accounts, consumer data export/deletion, real-device interruption and accessibility, signed native builds, store billing and monthly AI entitlements remain open.
- Workout recovery, host access to saved context, photo-to-basket, meal preferences, richer recipes, trip-scoped shopping and weekly reflection remain follow-up work.
- Browser recovery depends on available device storage. Browser data clearing loses it. Concurrent active editing across tabs is not a supported collaboration mode; the stale-write guard preserves the newer copy and asks the user to finish in the other tab. No automatic microphone restart occurs.
- The final preview uses synthetic test records. Local browser data, logs, screenshots, databases and keys are intentionally untracked. The published source does not copy those between machines.

## Handover and setup

No dependency/lockfile or database migration changes are required by this batch. Existing checkouts need migrations through `0003_food_history_index.sql` from main; a fresh checkout follows README setup. Do not regenerate the lockfile. Review integration with PR #30 and draft PR #31, both of which touch the host/state boundary, before merging. PR #17 audio work remains separate.

The owner preview on port 5184 remains the PR #30 checkout. Port 5190 is this branch's QA preview. Publishing this branch does not merge it or deploy it. The other machine should fetch the PR branch and run the documented checks before continuing. All implementation and this handover are intended for the PR; only ignored runtime/test material remains local.
