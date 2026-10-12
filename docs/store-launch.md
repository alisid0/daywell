# Store launch plan

Owner request, 12 October 2026: make Daywell launch-ready for Google Play and the App Store as soon as possible. This plan supersedes the timing in the [mobile release plan](mobile-release-plan.md) and the [9 October assessment](launch-readiness-2026-10-09.md); their requirements still apply.

## Owner decisions, 12 October

- **Version 1 is free.** Subscriptions (planned at £4.99, £9.99 and £19.99 a month) follow in an update, so store billing is off the critical path. The existing daily caps keep AI costs bounded.
- **Version 1 includes AI chat, live voice and food-photo understanding**, with the consent and reporting controls below.
- **The public app uses a Cloudflare workers.dev address for now.** The app ID `com.daywell.app` is used on both stores. Confirm it before the first store upload; it cannot change afterwards.
- **Apple Developer Program enrolment had not started.** The owner is enrolling as an organisation, with the same D-U-N-S number as the verified organisation Google Play account. The personal-account rule of 12 testers for 14 days should not apply to an organisation account; confirm this in Play Console.

## What the stores need

| Requirement | Status on 12 October | Owner of the work |
| --- | --- | --- |
| Public sign-up and sign-in | Only the owner can sign in, through Cloudflare Access. Email sign-in codes avoid Apple's extra login rule (4.8) that Google or Facebook sign-in would trigger. | Codex |
| Android and iPhone apps | Capacitor projects, a test APK and an iPhone simulator build ([phone apps](mobile-app.md)) | Claude |
| Account deletion in the app, plus a public web page to request deletion (Google) | [#47](https://github.com/alisid0/daywell/pull/47) draft; pages are behind Access | Codex |
| Public privacy policy and support pages naming the operator and a contact email | `config/owner.json` is empty | Owner details, then Codex |
| Explicit permission, naming the provider, before personal data goes to an AI service (Apple 5.1.2(i)) | Consent cards exist but don't name ElevenLabs or OpenAI | Claude, preview first |
| In-app reporting of offensive AI replies (Google AI-generated content policy) | Missing | Claude, preview first |
| More than a repackaged website (Apple 4.2): sounds that keep playing on the lock screen, timer notifications with the app closed, an offline screen | Offline screen done; native audio and notifications next | Claude |
| Store listings: icon, screenshots, descriptions, Apple privacy labels, Google data safety, age ratings, reviewer sign-in | Not started | Claude drafts, owner approves |
| Real-phone testing on Android and iPhone | Not started | Owner |

## Order of work

1. **Now:** the owner starts Apple enrolment, creates the app in Play Console and sends the operator name, contact email and transcript retention period.
2. **This week:** public service with sign-up (Codex); native audio, notifications, AI consent and reporting (Claude); the owner installs the Android test build.
3. **Next:** store listings and declarations, then an Android submission. TestFlight follows as soon as Apple approves the account, then the iPhone submission. Apple and Google set their own review times.

## Sources

[Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) (4.2 minimum functionality, 4.8 login services, 5.1.1(v) account deletion, 5.1.2(i) third-party AI). [Google Play AI-generated content](https://support.google.com/googleplay/android-developer/answer/13985936). [Google Play account deletion](https://support.google.com/googleplay/android-developer/answer/13327111). [Google Play testing requirements for new personal accounts](https://support.google.com/googleplay/android-developer/answer/14151465).
