# Daywell end-to-end test checkpoint — 8 October 2026

Branch: `codex/cloudflare-private-hosting`, draft [PR 31](https://github.com/alisid0/daywell/pull/31).
Started from published commit `59a3875` (GitHub check passed). The PR head carries the validation fix, repeatable HTTP smoke test and this report. Neither this branch nor the greeting PR is merged into `main`.

## Outcome

The local MVP's principal user journeys passed the browser walkthrough below. One input-validation defect was reproduced and fixed. **This is not hosted, provider, native-device or store acceptance.** The current deployment permission blocker remains unchanged; see the [Cloudflare checkpoint](2026-10-08-cloudflare-connection.md).

Testing used a separate local database in the hosting checkout, synthetic “QA” records, and `http://localhost:5190`. The normal `daywell-food` preview at port 5184, its records/keys and the separate PR 17 audio checkout were untouched. All four existing migrations applied successfully to the new QA database. No new migration, external AI call, recording generation, agent modification or deployment was performed.

## Browser walkthrough

Windows Codex in-app browser. Desktop view plus 390 × 844 and 320 × 740 viewport checks; these dimensions do not emulate an actual phone's operating system.

| Area | Scenario and observed result |
| --- | --- |
| First use | Three-step welcome completed; QA name and completed onboarding persisted after reload. |
| One host | “Hello” produced a friendly local response. A combined milk/focus request produced a two-action review; saying hello again retained the unconfirmed plan. “Do this” saved the grocery and started the requested ten-minute activity. |
| Activity recovery | Paused at 09:39, reloaded, and found the same paused state. Ending and undoing restored the paused activity; undo was then unavailable. |
| Food basket | Added 200 g dry rice. Planned 300 g for two servings without consuming stock; Shopping showed a 100 g shortage. Draft survived navigation away and back before saving. |
| Actual purchases | Bought a 500 g pack through the purchase review. Stock became 700 g and the shortage cleared. |
| Partial cooking | Selected one of two planned servings. The proposed deduction changed to 150 g. Saving without the explicit cooking checkbox was blocked. Confirmed cooking left 550 g stock, one planned serving, a recorded meal and one leftover portion. |
| Food undo | Reviewed and confirmed undo. Stock returned to 700 g, the two-serving plan returned, the generated meal and leftovers disappeared, and the audit showed the cooking action as undone. |
| Lost connection and retry | Stopped only the verified QA server with a 250 g lentil draft open, then attempted save. The draft remained visible and locked with “Retry save safely”; no false success appeared. Restarted the same server, retried, and found one 250 g item after a full reload. |
| Recipe review | Opened Chickpea sunshine bowl; six proposed ingredient quantities were editable. Changing one serving to two doubled all six quantities. Cancel left the saved plans unchanged. |
| Meal journal | Saved a separate soup note without nutrition estimates; it appeared in meal/history views without a fabricated calorie target or inventory deduction. |
| Movement | Ran a Desk break step timer to zero; reset and chose a harder exercise. Completed one step, skipped another and ended early. Review showed only the completed exercise. Edited name/minutes and saved; the movement record appeared in history. |
| Sleep | Equal sleep/wake times were rejected with an explanatory message. 22:30–06:45 saved as 8 h 15 min and appeared in history. |
| Quiet rest | Opened the untimed Relax space; optional guidance and private reflection worked. Ambient sound switched on/off with a volume slider. Companion movement switched off and remained off after navigating away/back. Actual sound quality was not assessed. |
| Guided audio | All three current sessions loaded playable audio with durations 120/180/300 seconds. Begin, pause, continue, seek and end worked; seeking the breathing session to 75 seconds updated its caption. Switching sessions selected the corresponding recording. |
| Comfort recordings | Library displayed 500 ready responses. Searching “feed” returned ten matches; selecting a response, Listen, Another thought and Stop listening worked without microphone use. This is playback smoke coverage, not a listening review of all recordings. |
| Future plans | Added an October 10 plan at 17:30 for 25 minutes with punctuation and multiline notes. It appeared on the selected day and in Coming up. Marking it done recorded completion on October 8 and preserved its original planned date. |
| Retrospective history | Movement, sleep, reflection, completed priority, meal and completed plan appeared together. Rest-only filtering and the Relax area filter showed their respective records. |
| Exports | UI downloads succeeded. Inspected the actual `.ics`: escaped comma/semicolon/newline, private event, and 16:30–16:55 UTC for the 17:30 London plan. Inspected the actual CSV: all six saved records, sleep/movement minutes and original planned date present. No Google/Apple import or live sync was performed. |
| Priorities | Quick-add, completion and Completed filter worked; completion appeared in calendar history. |
| Timers and clocks | Set a custom one-minute timer, ran to zero and dismissed the completion prompt. Stopwatch start/pause/reset worked. World clocks displayed London, New York and Tokyo with appropriate date differences. |
| Alarms | Created a weekday 08:00 alarm, then disabled it. The UI clearly states that web alarms require the app to remain open. Actual alarm firing, notifications and closed-app waking were not verified. |
| Reading and mobile layout | Lexend, Larger text and Roomy spacing persisted after reload. At 320 px all four areas, food editing and calendar fit without horizontal document overflow. Home also passed at 390 px; no broken mascot images were observed. Original QA reading settings and the browser viewport override were restored afterward. |

The browser download-event observer timed out during the calendar export, but the expected file was actually saved in Downloads and its contents were inspected. This was a test-tool observation limitation, not a reproduced app export failure. No browser console errors were captured before the deliberate connection-loss test; failed requests during that test are expected.

## Defect corrected

`POST /api/state` previously returned 503 (“Couldn't save … try again”) for JSON `null` or an upsert containing a null entry. These are invalid requests, not a service outage. The route now validates the object and every entry before constructing a write batch and returns 400. Duplicate IDs in a batch are rejected instead of ambiguously overwriting one another. The existing shared stream reader now enforces the 30,000-byte UTF-8 body limit while reading, rather than reading an unbounded body and counting characters afterward.

Three regression tests cover invalid envelopes, invalid/mixed/duplicate batches and valid entries with domain-field validation. The real local HTTP run confirms that an invalid mixed batch writes nothing and valid save/edit flows still work.

## Automated evidence and reproduction

- `npm run check`: type check, **113 tests passed**, standard production build passed.
- `npm run lint:changed`: **17 changed code files, no new lint errors**. `npm run cloudflare:check`: owned build and Wrangler dry-run passed without deployment. The generated output uses synthetic settings and must not be deployed.
- `node scripts/smoke-local.mjs http://localhost:5190 --allow-test-writes`: **93 HTTP checkpoints passed**, **503 referenced audio assets passed** status/type/byte-length checks. Eight application pages returned HTML successfully.
- HTTP coverage includes anonymous and forged-identity rejection, cross-origin rejection, unconfigured voice/photo fallbacks, malformed/oversized bodies, all ten saved-entry kinds, atomic combined host changes, repeated purchase/cooking saves, conflicting revisions, simultaneous food updates and undo.
- The smoke runner compares the pre/post existing entries, preferences and food basket. It removes only its uniquely named fixtures; the synthetic food audit receipts remain. It never calls a configured provider.

To repeat, use an **isolated checkout and local database**, install the locked dependencies, run `npm run setup`, then `npm run dev -- --port 5190`. Run the smoke command above in another terminal. The runner refuses non-loopback origins and requires the explicit write flag and local mock-auth cookie before testing. Do not use the owner's everyday preview database. The runner is opt-in and is not claimed as a browser automation suite or an existing CI step.

Local logs and screenshots are ignored under `work/`; only synthetic exports were downloaded. No private records, database, keys or account identifiers are included in this report.

## Remaining release gaps / acceptance gates

The [improvements report](2026-10-08-improvements-report.md) turns these findings and a follow-up source review into prioritised product work and release acceptance criteria. Its recommendations are not yet implemented.

1. **Hosted service blocked:** Cloudflare still lacks the deployment permission the owner declined to add. No hosted Worker, mobile URL, real Access session, logout/expiry, separate hosted-user isolation or backup restoration test exists. Preserve the owner's permission choice.
2. **Live voice and photos unverified:** the isolated preview intentionally has no provider secrets. Friendly typed requests and unconfigured-service fallbacks passed; actual microphone permission/denial, transcription, ElevenLabs conversation, interruption and usage limits still need a controlled device/provider test. The current Eat surface provides manual inventory and reviewed recipe planning; the old photo component is not mounted into that flow, so photo-to-basket acceptance is still open.
3. **Audio integration pending:** this branch has 500 short recordings and three guided sessions. PR 17 contains the expanded responses and extra unwind/voice work; it remains separate. Do not describe 1,500 responses or selectable guided voices as integrated here.
4. **Native release gates open:** signed Android/iOS builds, real microphone/camera permissions, background/lock-screen audio, phone interruptions, reliable native reminders, store billing/restore/entitlements and account deletion are not completed by this web test. See the [mobile release plan](../mobile-release-plan.md).
5. **Coverage limits:** one food-save connection loss/retry was verified, but full offline operation, lost responses after server commit, screen readers, physical touch devices, sleep/closed-app alarms, external calendar imports and human review of every recipe/recording remain unverified. The automated conflict/atomicity tests do not replace these acceptance checks.

## Handover

No schema/dependency changes. Install the same lockfile on the other machine; run the checks and repeat the local smoke test against a separate migrated database. Keep PR 31 draft while hosted acceptance is blocked. Before any eventual deployment, rebuild with the real private profile last; synthetic check output must never be deployed. The PR head and session completion message identify the published commit and exact GitHub check status.
