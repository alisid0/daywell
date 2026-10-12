# Store launch plan

Owner request, 12 October 2026: make Daywell launch-ready for Google Play and the App Store as soon as possible. This plan supersedes the timing in the [mobile release plan](mobile-release-plan.md) and the [9 October assessment](launch-readiness-2026-10-09.md); their requirements still apply.

## Owner decisions, 12 October

- **Paid only, with a demo and no free trial.** Anyone can download Daywell and try a demo. Using the real app needs a subscription, so store billing is part of version 1. This replaces the plan, made earlier the same day, for a free version 1 with subscriptions in a later update.
- **One plan with everything:** Eat, Move, Sleep, Relax and Talk, at $19.99 a month or $199.99 a year (£19.99 and £199.99 in the UK, including VAT). Daywell is meant to replace three or four separate apps.
- **Launch when the promise works.** Everything that the listing, the demo and the videos show must work on real phones before submission. Speed matters, but not at the cost of a feature that doesn't do what it says.
- **Version 1 includes AI chat, live voice and food-photo understanding**, with the consent and reporting controls below.
- **Marketing starts with short videos** on Instagram, TikTok and YouTube Shorts. Affiliate partnerships with health brands, gyms and grocers come later.
- **The public app uses a Cloudflare workers.dev address for now.** The app ID `com.daywell.app` is used on both stores. Confirm it before the first store upload; it cannot change afterwards.
- **Apple Developer Program enrolment had not started.** The owner is enrolling as an organisation, with the same D-U-N-S number as the verified organisation Google Play account. The personal-account rule of 12 testers for 14 days should not apply to an organisation account; confirm this in Play Console.

## Decisions still needed

| Decision | Recommendation | Why it matters |
| --- | --- | --- |
| What a subscription includes each month | An hour of live conversation. Food readouts in Daywell's voice for the first 20, then in the phone's own voice. Photo checks stay at 20 a day. Recorded replies, guided sessions and typed commands are unlimited. | Today's limits are daily, so one heavy user could cost more in AI than they pay. Someone who uses all of this costs about £7.50 a month in AI, or up to £11 if every readout is the longest allowed. Daywell receives £11.80–£14.16 a month per subscriber. The listing must state the allowances. |
| Billing service | RevenueCat | It handles both stores, renewals, refunds and restores, and supports Capacitor 8. It is free until $2,500 of revenue a month, then takes 1%. Building our own avoids the fee but adds about a week and more to test. It would process purchase records, so it goes in the privacy policy. |
| Terms of use | A short Daywell terms page for both stores and the web, checked in the legal review | Both stores need terms and privacy links next to the purchase button. On iPhone, Apple's standard licence can apply alongside it. |

## What the stores need

| Requirement | Status on 12 October | Owner of the work |
| --- | --- | --- |
| Public sign-up and sign-in | Only the owner can sign in, through Cloudflare Access. Email sign-in codes avoid Apple's extra login rule (4.8) that Google or Facebook sign-in would trigger. | Codex |
| A reviewer account that signs in without an emailed code (Apple 2.1) | Not started. For example, one review address with a fixed code kept as a Cloudflare secret, holding no real data. | Codex |
| Subscriptions through Apple in-app purchase and Google Play Billing, with Restore purchases (Apple 3.1.1) | Not started | Claude, preview first |
| The server checks for an active subscription before any paid AI call or new saved record, and follows renewals, cancellations, refunds and failed payments | Not started | Claude, with Codex's sign-in work |
| A demo for people without a subscription: sample data and recorded replies, with no live AI and nothing saved | Not started | Claude, preview first |
| Price, length, auto-renewal and what's included, shown before purchase, with links to the terms and privacy policy (Apple 3.1.2, Google subscriptions policy). The listing says that a subscription is needed (Apple 2.3.2). | Not started; needs the terms page | Claude drafts, owner approves |
| Manage or cancel the subscription from inside the app (Google) | Not started | Claude |
| Android and iPhone apps | Capacitor projects, a test APK and an iPhone simulator build ([phone apps](mobile-app.md)) | Claude |
| Account deletion in the app, plus a public web page to request deletion (Google). Deletion warns that store billing continues until the subscription is cancelled, and links to it (Apple). | [#47](https://github.com/alisid0/daywell/pull/47) draft; pages are behind Access | Codex |
| Public privacy policy, terms and support pages naming the operator and a contact email | `config/owner.json` is empty | Owner details, then Codex |
| Explicit permission, naming the provider, before personal data goes to an AI service (Apple 5.1.2(i)) | Done in [#49](https://github.com/alisid0/daywell/pull/49), waiting to merge | Claude |
| In-app reporting of offensive AI replies (Google AI-generated content policy) | Done in [#49](https://github.com/alisid0/daywell/pull/49), waiting to merge | Claude |
| More than a repackaged website (Apple 4.2): sounds that keep playing on the lock screen, timer notifications with the app closed, an offline screen | Offline screen done; native audio and notifications next | Claude |
| Spoken commands and workout cues in the phone apps, using the phone's own speech services | The web app uses the browser's speech features. Android's in-app browser doesn't provide them, and speech recognition inside iPhone apps is unreliable, so Move's voice cues and "say it" would fail in the apps. | Claude |
| Store listings: icon, screenshots, descriptions, subscription details, Apple privacy labels, Google data safety, age ratings, reviewer sign-in | Not started | Claude drafts, owner approves |
| Test purchases on both stores: buy, restore, cancel, expire, refund and failed payment | Not started; needs the store accounts | Claude, then the owner on real phones |
| Real-phone testing on Android and iPhone | Not started | Owner |

## How subscriptions will work

This is a proposal; the screens come to the owner as a preview first.

- The download opens on the demo. "Start Daywell" leads to sign-up, then the choice of plan and the store's own payment sheet.
- Two products, monthly and yearly, use the same names on both stores. A subscription bought on one phone works on any device signed in to the same account. The web app doesn't sell subscriptions in version 1.
- The server records each subscription against the Daywell account. When a subscription ends, paid features and new records stop, but the person can still open, export and delete what they saved.
- Restore purchases links an existing store subscription to the signed-in account. A store subscription belongs to one Daywell account at a time.

## Launch when the promise works

Daywell is submitted when each part does what the listing says, on real Android phones and iPhones, measured against [what each area is for](product-areas.md):

- **Eat with Nori:** show or tell, check, confirm and undo. Adding by hand always works.
- **Move with Bounce:** plan, do it with timers and voice, record what really happened and look back.
- **Sleep with Luma:** wind down, with sounds that keep playing when the screen locks. One tap in the morning and a gentle look at the week.
- **Relax with Luma:** arrive, choose how much help, and leave when ready.
- **Today and Talk:** everyday commands, recorded replies first, and live conversation within the monthly allowance.

Before submission:

1. The [end-to-end journeys](product-areas.md#end-to-end-journeys) pass on the hosted service at phone size, with Standard and Larger text.
2. The same journeys work by hand on a real Android phone and iPhone, including the microphone, camera and sound with the screen locked.
3. Two accounts cannot see each other's records.
4. Test purchases work on both stores, and paid features stop when a subscription ends.
5. The demo shows only what the paid app really does.
6. A feature that isn't ready is left out of the listing, the demo and the videos, rather than shipped half-working.

## Marketing

- **At launch:** short videos on Instagram, TikTok and YouTube Shorts. The demo should be easy to screen-record, because it is what the videos show.
- **Claims:** everyday wellness only, following the [general-wellness scope](general-wellness-scope.md): no medical, weight-loss or calorie-burn claims. Paid posts and affiliate links are labelled as ads, as UK advertising rules (ASA and CAP) require.
- **Measure:** App Store Connect and Play Console show product-page views, installs and subscriptions. Paid ads are worth testing once at least 4–5% of installs subscribe. Any in-app analytics needs consent and goes in the privacy labels.
- **Later:** affiliate partnerships with health brands, gyms and grocers. Links to physical goods and gym memberships don't use store billing (Apple 3.1.3(e)).

## Order of work

1. **Now:** the owner starts Apple enrolment, creates the app in Play Console, sends the operator name, contact email and transcript retention period, and makes the decisions above.
2. **This week:** public sign-up and the reviewer account (Codex); native audio, notifications and speech, plus a preview of the demo, the plan choice and subscription settings (Claude); the owner installs the Android test build.
3. **After the preview is approved:** subscriptions and the demo, tested with test purchases once the store accounts exist; the monthly allowances; store listings and declarations.
4. **Then:** the launch checks above, and an Android submission. TestFlight follows as soon as Apple approves the account, then the iPhone submission. Apple and Google set their own review times.

Paid-only adds about one to two weeks of work before the first submission.

## Sources

[Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) (2.1 app completeness, 2.3.2 in-app purchase disclosure, 3.1.1 in-app purchase and restore, 3.1.2 subscriptions, 3.1.3(e) goods and services outside the app, 4.2 minimum functionality, 4.8 login services, 5.1.1(v) account deletion, 5.1.2(i) third-party AI). [Apple: offering account deletion](https://developer.apple.com/support/offering-account-deletion-in-your-app/). [Google Play payments and subscriptions policy](https://support.google.com/googleplay/android-developer/answer/9900533). [Google Play AI-generated content](https://support.google.com/googleplay/android-developer/answer/13985936). [Google Play account deletion](https://support.google.com/googleplay/android-developer/answer/13327111). [Google Play testing requirements for new personal accounts](https://support.google.com/googleplay/android-developer/answer/14151465). [RevenueCat pricing](https://www.revenuecat.com/pricing/).
