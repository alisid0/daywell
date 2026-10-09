# Daywell Android and iPhone release plan

Daywell is now being prepared for launch on both Google Play and the Apple App Store. A personal APK is an early testing build within that release, not the final objective. The launch experience must work over the internet with the development computers switched off.

**Plan date:** 6 October 2026, Europe/London.

**Working review deadline:** 5 November 2026, thirty days from the plan date. The owner has requested an early-November review deadline; confirmation of the exact day and whether it means submission or public availability is pending. Plan for an internal release review on 27 October and initial store submissions from 29 October where account eligibility permits. Store approval and public availability are separate milestones controlled in part by Apple and Google.

**Readiness update, 9 October:** the [latest launch assessment](launch-readiness-2026-10-09.md) supersedes earlier status and timing assumptions below. Private web hosting now works, but public paid/store launch remains blocked by accounts/data controls, unverified AI/device journeys, billing and native builds. Keep 5 November as a review checkpoint; the current conditional estimate for public Android and iPhone availability is 20 November–4 December, potentially later. Earlier October delivery dates are at-risk targets, not completed milestones or a guarantee of public launch.

## Current state and immediate blockers

GitHub is authoritative. The assessed current app is `codex/private-tester-build` at `ca3e528`, [draft PR #36](https://github.com/alisid0/daywell/pull/36), which integrates the latest Food/Move/voice work from PR #32 and private hosting from PR #31. The deployed code is `1fb07f5`; the later checkpoint contains documentation. These changes are not merged into main. The published audio assets are present in this build; do not blindly merge older audio branches over newer wellness removals. A passing web build does not establish mobile release readiness.

| Area | Current state | Release requirement |
| --- | --- | --- |
| Android and iOS | No native projects or signed release builds in the repository | Reproducible builds, Android test APK and store AAB, signed iOS build and TestFlight distribution |
| Hosting and identity | Owner-only private Cloudflare service deployed; browser sign-in and food persistence checked | Customer onboarding/recovery, two-account isolation and real-phone acceptance |
| Eat | Food basket, planning, shopping, cooking/leftovers, calorie and sugar logs implemented; food-photo AI intentionally disconnected | Authorised real photo/voice verification, corrections and complete food journeys on hosted accounts and both phones |
| Audio and voice | Recorded hosted playback checked; ElevenLabs configured; workout cues use device speech | Real-device conversations, routine-state coaching, interruptions, intended background behaviour and measured monthly usage |
| Payments | Prices discussed, but no store billing implementation | Verified store purchases, restore, cancellations, refunds and server-side entitlements |
| Personal data | Per-user records; PR #34 export/deletion foundations and policy proposals remain separate | Integrate and complete account/provider data lifecycle, retention, privacy/support and image-handling controls |
| Release operations | 172 app tests and GitHub checks passed; hosted browser checks recorded | Mobile CI, device evidence, monitoring, store metadata, reviewer access and exercised restore/rollback |

Implementation checkpoint, 6 October: the [food inventory foundation](food-inventory.md) adds the persistent model/API, reviewed planning windows, transactional purchase/cooking history and retry/undo protection. The 7 October frontend checkpoint connects Food basket, Next meals and Shopping with quantity-reviewed recipe drafts, safe network retry and explicit conflict review. The real local D1/browser journey passed, including partial cooking, leftovers and undo. Ingredient-photo review, broader recipe/content review, hosted identity and mobile verification remain open; do not mark the complete food-cycle or launch milestone done from this checkpoint.

## Account history and outstanding decisions

- Owner update, 7 October: **Cloudflare selected; account created.** The [private hosting path](cloudflare-hosting.md) adds an authenticated Worker entry point and repeatable build. Account authorization, Access policy, hosted D1/deployment and real-device verification remain prerequisites. Private tester sign-in does not complete consumer/native identity or store readiness.

- Historical hosting checkpoint, 8 October: deployment was blocked by a missing permission. On 9 October the owner approved that permission and the private app was deployed, reusing the database and Access policy. This supersedes the earlier refusal and unavailable-link status for that deployment. See the [current hosting handover](handover/2026-10-09-private-tester-build.md). Future background source sync must not deploy automatically.

- Testing checkpoint, 8 October: an isolated local browser walkthrough covers onboarding, host review/undo, the food cycle, movement, sleep, rest/audio, calendar/exports and phone-width layouts. The branch has 113 passing regression tests plus an opt-in HTTP/asset smoke runner. An invalid-request handling defect was fixed. Hosted accounts, real devices/providers and native release gates remain open; see the [end-to-end evidence and limits](handover/2026-10-08-end-to-end-testing.md).

- Owner update, 7 October: **Google account reported ready; Apple account not yet ready.** Clarification is pending on whether Google means a registered, verified Google Play Console developer account. Do not mark Play publishing access or production eligibility verified from this statement alone. Apple enrolment remains an owner dependency; Android preparation can progress while the shared iPhone release target remains in scope.
- Confirm the exact November deadline and whether it is for submission or public availability.
- Complete [Apple Developer Program enrolment](https://developer.apple.com/programs/enroll/) and confirm Google Play Console account type, verification and access. The owner completes identity, agreements and payment steps; credentials stay out of GitHub and chat.
- Confirm a Mac with supported Xcode or an approved macOS build service, an iPhone and an Android phone for testing. Windows alone cannot produce an Xcode archive.
- Private hosting ownership and its address are established. Confirm the separate public launch address and staging arrangement; the owner-only tester address is not public customer onboarding.
- Confirm launch countries and audience. The planning assumption is a UK, English-language adult wellbeing launch; it is not an approved age rating or a promise of worldwide availability.
- Confirm paid launch products and exact allowances. Previously discussed prices are GBP 4.99, 9.99 and 19.99 monthly; voice minutes, photo allowances, trials and each tier's entitlements remain decisions. Do not advertise unlimited paid AI usage.
- If Google's new-personal-account testing rule applies, recruit at least 12 eligible testers immediately and keep a record of participation and feedback. The owner handles invitations unless separately authorising messages.

## Launch scope

Keep the selected Cosy cove direction, one Daywell host and the Move, Relax, Eat and Sleep structure. Helpers accompany tasks without becoming separate assistants users must remember. Prioritise readable screens, captions, reduced motion and short decisions over additional design variations.

Owner scope decision, 8 October: [general wellness only](general-wellness-scope.md). Keep relaxation and ordinary routines; exclude clinical care, mental-health improvement promises, medicines, supplements and alcohol recommendations, regardless of claimed age. This does not establish suitability for children.

### A complete food cycle

- Save a Food basket inventory with canonical ingredient names, quantity, unit and a clear unknown-quantity state. Store optional user-confirmed dates; do not infer expiry or allergen safety from appearance.
- Let the user photograph, speak or type ingredients. Show a review before creating or changing inventory. Ask only the quantities needed for the selected recipe or plan.
- Support two-, three- and seven-day plans with household servings, dietary exclusions, preparation time, confirmed inventory and a curated recipe collection. Swapping, moving, repeating or removing meals must update ingredient demand.
- Distinguish stock on hand, stock reserved for future meals and stock available for other meals. Planning reserves ingredients without consuming them.
- Combine compatible quantities into one shopping list, subtract confirmed available stock, and preserve manually added items. Do not treat an unpurchased shopping item as pantry stock or convert incompatible units without a defined conversion.
- On purchase confirmation, record the quantity actually bought, including a larger pack where relevant. Retrying a save must not add the purchase twice.
- Guide cooking one step at a time through the main host. After confirmation, deduct the actual amount used, record the meal and optionally record leftover portions. Partial cooking, cancellations and undo must remain consistent.
- Provide meal-photo assistance with correction of ingredients and portions, optional nutrition estimates and explicit confirmation before saving. Keep typed entry usable when recognition fails or the allowance is exhausted.
- Show meal history in the existing calendar. Editing or deleting a meal must not silently or repeatedly mutate pantry stock; related stock adjustments require an explicit reviewed action.

### The other three areas

- Move: a usable curated routine player, editable sets/reps/load and saved history; clear equipment and easier alternatives.
- Relax: the quiet resting space, grounding, breathing and approved recorded sessions with selectable calm voices. Pause, stop, seek and captions must agree with the audio.
- Sleep: wind-down routines, guided audio, bedtime preferences and the sleep journal. Avoid claims that the app diagnoses sleep conditions or guarantees waking someone.
- Calendar: reliable plans and retrospective records across the four areas, preserving the current no-guilt approach.

### Mobile and online foundations

- Reuse the React experience where practical and validate a shared mobile approach on both platforms in the first week. The existing server-rendered Vinext app cannot simply be copied into a static mobile package; separate or adapt its server-dependent boundaries deliberately.
- Use a hosted authenticated backend, with per-user authorisation, production database migrations, backups and a tested restore path. Never expose local mock authentication or accept arbitrary identity headers at a public endpoint.
- Keep provider keys on the server. Configure native sign-in callbacks, session renewal and API-origin protection without weakening existing security checks to make a wrapper work.
- Handle camera, microphone and notification permissions only when used. Test denial, revocation and returning from system settings.
- Implement guided background audio with lock-screen controls and headphone/call interruptions. Live conversations must have an explicit, visible microphone state and stop behaviour; background meditation does not authorise a background microphone.
- Use native reminders for features advertised as working while the app is closed. Remove or qualify unreliable alarm promises.
- Provide honest connection errors and retry behaviour that does not duplicate entries or purchases. Full offline editing and cross-device conflict resolution are outside the initial scope unless they become necessary to protect saved work.

### Billing and AI costs

- Implement Apple in-app purchase and Google Play Billing for the planned digital subscriptions, subject to the chosen storefront's applicable rules. Test purchase, cancellation, expiry, restore, refund and interrupted transactions. Store-side subscription status must be verified on the backend, not trusted from client flags. [Apple payment guidance](https://developer.apple.com/app-store/review/guidelines/#in-app-purchase), [Google payment policy](https://support.google.com/googleplay/android-developer/answer/9858738).
- Enforce the agreed voice and photo allowances on the server, display remaining usage clearly and provide a graceful fallback at the limit. Check the expected margin before enabling each product.
- Keep prerecorded comfort separate from live personalised assistance. If adding a clip-first router, test that it never presents a recording as proof of a saved task, diagnosis or completed action.
- Human-review the audio and recipes selected for release, including all exposed urgent-support wording. Exclude unreviewed content rather than claiming the entire library is editorially approved because file checks pass.

## Milestones

Dates are delivery targets, conditional on the account, hosting and device decisions above. They are not evidence of completed work or guarantees of store turnaround.

| Date | Deliverable | Acceptance evidence |
| --- | --- | --- |
| 6 to 8 October | Confirm accounts, date, hosting, launch scope, mobile architecture and billing allowances | Decisions linked here; named blockers with owners |
| 9 to 12 October | Authenticated staging service; first Android and iPhone builds; begin real-device testing | Install, sign in, save and reload a record on both phones with the development PCs off |
| By 12 October | Start Google closed testing if required; start TestFlight testing when eligible | At least 12 continuously opted-in Google testers where required; actual feedback channel; distribution status recorded |
| 13 to 18 October | Food inventory, plans, shopping and cooking cycle; photo review and corrections | End-to-end meal and stock scenarios pass, including duplicate saves and substitutions |
| 19 to 25 October | Native audio/reminders, subscriptions, usage limits, privacy and deletion; finish launch content | Device recordings and reproducible tests; verified sandbox purchases and deletion results |
| 26 October | Feature freeze and, if eligible, Google production-access application after the full test duration | Versioned candidate; no new features; critical defects tracked |
| 27 to 28 October | Owner release review and regression testing | Completed submission checklist and two-device walkthrough |
| 29 October to 5 November | Submit eligible release candidates and address review feedback | App Store Connect and Play Console submission receipts, exact versions and status |

For applicable personal Google Play accounts created after 13 November 2023, at least 12 testers must remain opted in continuously for at least 14 days before applying for production access. Google says that access review usually takes seven days or less but may take longer. Starting a compliant test on 12 October therefore makes 26 October the earliest application date, at the corresponding time; access is not automatic. Keep testing and fixing issues during this period. [Official testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465).

If the owner means public availability by 5 November, aim to submit earlier and mark the schedule at risk until account eligibility and review timing are confirmed. Never label a submitted or approved-but-unreleased app as publicly launched.

## Store submission checks

- [ ] Google production eligibility confirmed, including applicable testing and verification.
- [ ] Android AAB and signed iOS archive built from the documented GitHub release commit. Keep the Android APK for direct testing; it does not replace the store bundle.
- [ ] Current target SDK and toolchain requirements verified for the submission date. Apple's current notice requires Xcode 26 or later with the applicable version 26 SDK; recheck before upload. [Apple requirements](https://developer.apple.com/news/upcoming-requirements/), [Google target API policy](https://support.google.com/googleplay/android-developer/answer/11926878).
- [ ] Sign-in, sign-out, session renewal and separate-user data isolation tested on real devices. Apply Apple's login-service requirements if third-party sign-in is offered.
- [ ] Privacy policy and support URL work; App Privacy and Google Data safety answers match actual SDK and provider behaviour. Explain and obtain permission for personal data sent to third-party AI. [Apple review guidelines](https://developer.apple.com/app-store/review/guidelines/).
- [ ] Account and associated-data deletion work from the app; provide the required external deletion request resource for Google. Explain any retention and subscription implications. [Google deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111).
- [ ] Health apps declaration, audience and age-rating questionnaires completed accurately. Fitness, sleep and nutrition functionality must be reflected in the declaration. [Google health declaration](https://support.google.com/googleplay/android-developer/answer/14738291).
- [ ] Product copy describes wellbeing support without unsupported medical or life-extension promises. Review food estimates, exercise instructions and AI limits for the intended audience.
- [ ] Store subscriptions, restore and server entitlements tested; prices and allowances match the listing and paywall.
- [ ] Camera/microphone denial, screen lock, background/foreground, headphones, calls, low connectivity and interrupted saves tested on Android and iPhone.
- [ ] Larger text, screen readers, captions, contrast, touch targets and reduced motion checked on the supported screens.
- [ ] Reviewer account/instructions supplied securely, backend available and all advertised features accessible. No localhost dependencies, broken links, placeholder payment flows or inaccessible credentials. [Apple submission guidance](https://developer.apple.com/app-store/submitting/).
- [ ] Screenshots, icon, descriptions and review notes show the actual candidate. Assess the complete app against Apple's minimum-functionality requirement rather than assuming a website wrapper is sufficient. [Apple minimum functionality](https://developer.apple.com/app-store/review/guidelines/#minimum-functionality).
- [ ] No unresolved defects involving data loss, cross-user access, failed core saving, incorrect charges or inaccessible core journeys. Remaining smaller issues are documented with an owner and impact.
- [ ] Production monitoring avoids private journal/photo/transcript content; incident contact, provider cost limits, database restore and rollback have been exercised.

## Deferred features

Defer new mascot redesigns, further appearance experiments, retailer integrations, automatic food ordering, receipt/barcode automation, wearable/HealthKit/Health Connect integrations, live Google/Apple calendar sync, social features, medical diet planning and multilingual expansion. Keep the agreed core ingredient-photo and food-planning journey in scope. If it misses the freeze, explicitly decide whether to reduce scope or move the date; do not silently market an unfinished feature.

## Work across both machines

Use [the shared GitHub workflow](github-workflow.md). Each implementation PR must link its milestone, list acceptance evidence and identify any blocked dependency. Finish each session with a verified push and handover. Track mobile build versions and store submission references against an exact GitHub commit; a local preview is never the release reference.

The immediate implementation sequence is production identity and hosting, then real Android/iPhone builds, while the food inventory model and reviewed UI can progress independently. Do not wait until the final week to discover that signing, account verification or closed testing is unavailable.

This plan is preparation for active development sessions. It does not schedule unattended implementation, send tester invitations, enrol accounts, purchase services or submit an app on the owner's behalf.
