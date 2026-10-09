# Daywell private test

This is a private browser test of Daywell's current Food, Move, Relax and Sleep features. It is not a Play Store or App Store release.

**Open [Daywell private test](https://daywell-private.alisid1994.workers.dev/) on your phone.** This is hosted on Cloudflare and does not depend on the development computer staying on. As of 9 October, access is owner-only; a tester must be added explicitly before they can enter. Food-photo AI is disconnected at the owner's request. Saved ElevenLabs credentials are connected, but live voice still needs a real-phone conversation test.

## Start here

1. Open the link in Safari on iPhone or Chrome on Android. Choose Cloudflare sign-in and use the account with the allowed email. This version uses Cloudflare account sign-in, not an emailed one-time code. Records are scoped to the signed-in account; a second tester account still needs a hosted isolation check.
2. Complete the welcome screen. Choose a name and an appearance you like. The latest build asks for an adult age in About you; existing accounts see this once too. Enter your own age directly in the app. Sex, height and weight are optional and may be left blank; do not add sensitive details just to test. Reload once to check that your entries persist.
3. Use the four main areas below. The keyboard is a fallback; Food prioritises pictures and voice, and Move is a guided training partner.
4. If something fails, note the area, what you pressed, what you expected, the phone/browser and approximate time. A screenshot is useful, but exclude personal details, keys and sign-in codes.

Start with non-sensitive test entries. Daywell offers general wellness routines and estimates, not diagnosis, medical treatment or personalised clinical advice.

## Try these journeys

| Area | What to try | Expected result |
| --- | --- | --- |
| Talk | Say or type “Hello”; ask to add something to your list | A response and a review before a saved change. End or mute a live call and check the microphone stops. |
| Food photo | Leave AI recognition off for this test; use the manual food controls | Recognition and recorded-description transcription are intentionally disconnected. Do not expect automatic food or nutrition estimates from a photo. |
| Food basket | Add four eggs and a known amount of dry noodles; plan a meal | Review quantities and portions, see the plan, and confirm what was used. Preparing food and consuming it are separate actions. |
| Food record | Log a meal, calories consumed and sugar if known | The day's record updates and survives reload. Unknown nutrition stays unknown; check the label or correct the estimate. |
| Takeaway | Enter the meal and known nutrition manually, then select the portion consumed | Review before saving. Automatic AI estimates are unavailable in this test; restaurant portions, sauces and preparation can change the result. |
| Move | Select the one-kettlebell routine | Read the setup, follow warm-up, exercises and rest, pause or skip, then review completed work before saving. No workout camera is required. |
| Relax | Open an unwind or breathing session | Available recorded narration and breathing cues play; pause, resume and stop work. |
| Sleep and history | Add a sleep entry and look back in the calendar | The saved entry appears on the correct date after reload. |
| Recovery | Briefly lose internet while preparing a change, then reconnect | The app should show an honest error or pending state rather than claim an unsaved change succeeded; check retries do not duplicate the entry. |

## Known boundaries

- Food photos and recorded descriptions need the owner's OpenAI connection. It was deliberately disconnected for the initial private test. The owner now asks to connect it, but the saved-key/verification step is outstanding; see the [latest source handover](handover/2026-10-10-response-router.md). Hosted setup still reports the missing connection.
- Live ElevenLabs conversations need configured credentials, permission to use the microphone, and a real-device test. The web browser may suspend background audio. This release does not claim reliable lock-screen coaching or alarms.
- Pre-recorded sessions do not need a live AI conversation. Their playback still needs testing on the actual phone.
- Personalisation stored only in the browser does not automatically transfer between devices. Saved account records should be checked on a second browser signed into the same account.
- Wearable imports, native health integrations, store billing and public customer onboarding are outside this private browser test.
- Do not enter highly sensitive information during this test. User-facing export/deletion work is tracked separately in PR #34 and is not included here.

## Before inviting a tester (owner checklist)

- [x] Record the deployed GitHub commit and Cloudflare deployment version in the [handover](handover/2026-10-09-private-tester-build.md).
- [x] Anonymous and forged-identity requests to the app, APIs and assets are redirected to Access sign-in. Owner-only policy inspected.
- [ ] Check a real non-invited account is denied, without expanding the policy.
- [ ] The owner's phone works with the development computer's server stopped.
- [ ] Add only the agreed tester email to the Access policy; verify two accounts cannot see each other's records.
- [ ] Test a real food photo and one short live conversation if those services are enabled.
- [ ] Confirm reload, sign-out and session expiry behaviour, and agree how the tester's records will be removed after testing.

Owner browser sign-in, onboarding, Food save/reload/delete, the kettlebell setup, and recorded meditation navigation/play/pause/resume/stop have been checked on the hosted service. Actual phone permissions/audio, a live conversation and a separately invited tester remain acceptance checks. Keep this private while completing them.
