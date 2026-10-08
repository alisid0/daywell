# Daywell private test

This is a browser test of Daywell's current Food, Move, Relax and Sleep features. It is not a Play Store or App Store release. The owner supplies the working HTTPS link after deployment and sign-in checks; `localhost` links only work on the development computer.

## Start here

1. Open the supplied link in Safari on iPhone or Chrome on Android. Sign in with the email the owner has allowed. Each invited account has its own saved records.
2. Complete the welcome screen. Choose a name and an appearance you like. Reload once to check that your entries persist.
3. Use the four main areas below. The keyboard is a fallback; Food prioritises pictures and voice, and Move is a guided training partner.
4. If something fails, note the area, what you pressed, what you expected, the phone/browser and approximate time. A screenshot is useful, but exclude personal details, keys and sign-in codes.

Start with non-sensitive test entries. Daywell offers general wellness routines and estimates, not diagnosis, medical treatment or personalised clinical advice.

## Try these journeys

| Area | What to try | Expected result |
| --- | --- | --- |
| Talk | Say or type “Hello”; ask to add something to your list | A response and a review before a saved change. End or mute a live call and check the microphone stops. |
| Food photo | Photograph a simple meal or ingredient packet | With food AI connected, review recognised food, quantities and estimated nutrition before saving. Correct mistakes; photo estimates are not measurements. |
| Food basket | Add four eggs and a known amount of dry noodles; plan a meal | Review quantities and portions, see the plan, and confirm what was used. Preparing food and consuming it are separate actions. |
| Food record | Log a meal, calories consumed and sugar if known | The day's record updates and survives reload. Unknown nutrition stays unknown; check the label or correct the estimate. |
| Takeaway | Describe or photograph a meal and select the portion consumed | Review an estimate. Restaurant portions, sauces and preparation can change the result. |
| Move | Select the one-kettlebell routine | Read the setup, follow warm-up, exercises and rest, pause or skip, then review completed work before saving. No workout camera is required. |
| Relax | Open an unwind or breathing session | Available recorded narration and breathing cues play; pause, resume and stop work. |
| Sleep and history | Add a sleep entry and look back in the calendar | The saved entry appears on the correct date after reload. |
| Recovery | Briefly lose internet while preparing a change, then reconnect | The app should show an honest error or pending state rather than claim an unsaved change succeeded; check retries do not duplicate the entry. |

## Known boundaries

- Food photos and recorded descriptions need the owner's OpenAI connection. A saved key alone does not prove the feature works. Hosted setup reports whether the service has been configured.
- Live ElevenLabs conversations need configured credentials, permission to use the microphone, and a real-device test. The web browser may suspend background audio. This release does not claim reliable lock-screen coaching or alarms.
- Pre-recorded sessions do not need a live AI conversation. Their playback still needs testing on the actual phone.
- Personalisation stored only in the browser does not automatically transfer between devices. Saved account records should be checked on a second browser signed into the same account.
- Wearable imports, native health integrations, store billing and public customer onboarding are outside this private browser test.
- Do not enter highly sensitive information during this test. User-facing export/deletion work is tracked separately in PR #34 and is not included here.

## Before inviting a tester (owner checklist)

- [ ] Record the deployed GitHub commit and Cloudflare deployment version.
- [ ] Anonymous visitors see sign-in; non-invited accounts cannot read the app or APIs.
- [ ] The owner's phone works with the development computer's server stopped.
- [ ] Add only the agreed tester email to the Access policy; verify two accounts cannot see each other's records.
- [ ] Test a real food photo and one short live conversation if those services are enabled.
- [ ] Confirm reload, sign-out and session expiry behaviour, and agree how the tester's records will be removed after testing.

Until those hosted checks are recorded, passing local tests mean the build is prepared, not that a shareable service has been verified.
