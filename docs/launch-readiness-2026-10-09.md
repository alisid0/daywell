# Daywell launch readiness assessment

**Assessment date:** 9 October 2026, Europe/London. Daywell is ready for owner-led private web testing, but not for a public paid launch. The present planning estimate is six to eight weeks for public Android and iPhone availability, potentially longer if accounts, testing or store review are delayed.

The latest assessed GitHub checkpoint is `ca3e528` on `codex/private-tester-build`, [draft PR #36](https://github.com/alisid0/daywell/pull/36). The hosted code is `1fb07f5`, Cloudflare version `e9249756-2a85-4f9d-a9e4-bc0e85cec842`. The additional checkpoint contains handover documentation only. PR #36 incorporates PR #31 hosting and PR #32 Food/Move/voice work; it is not merged into main. [Deployment and test evidence](handover/2026-10-09-private-tester-build.md).

## Launch estimates

These are engineering planning ranges, not booked release dates or store approval guarantees. They assume focused daily development with mobile-build expertise, prompt owner decisions, an Android phone, an iPhone, and a supported iOS build environment. Keep the four-area scope stable. Unresolved access or account dependencies extend the dates.

| Milestone | Estimate from 9 October | Conditions |
| --- | --- | --- |
| Owner phone/browser testing | Available now | Use the private hosted link and allowed owner sign-in; actual phone acceptance remains to be recorded. |
| Small invited web beta | 5–10 days, 14–19 October | Add agreed testers, verify account isolation and recovery, complete basic privacy/support handling and phone walkthroughs. Clearly identify disabled AI features. |
| Public paid web launch | 3–5 weeks, 30 October–13 November | Customer accounts, data controls, advertised AI journeys, payments, measured allowances and operational acceptance must pass. |
| Public Android and iPhone launch | 6–8 weeks, 20 November–4 December, potentially longer | Signed builds, real-device checks, subscription handling, store eligibility, review materials and approval. |

The working 5 November review deadline is 27 days away. Retain it as a release-review checkpoint; public availability in both stores is high risk. The exact date and whether the owner means submission or public availability still need confirmation. This assessment does not silently replace the owner's target.

## What is established

- A private HTTPS app and hosted database work independently of the development computer. Access currently permits only the owner.
- Food basket, planning, purchases, preparation, leftovers, consumption and undo have implemented flows. The hosted food save/reload/delete journey passed using a synthetic entry that was then removed.
- Calories consumed and sugar logs are implemented. Unknown nutrition must remain unknown, and food use must stay separate from consumption.
- Movement routines include the one-kettlebell routine. Hosted setup controls were checked; no workout was saved during that walkthrough.
- Recorded relaxation navigation, play, pause, resume and stop passed in the hosted browser. There are 1,417 published short recordings and 18 guided tracks.
- The assessed code passed 172 automated tests, type checking, production build and scoped lint. GitHub checks passed at `ca3e528`. Earlier isolated integration checks covered 93 HTTP checkpoints and 1,435 audio assets.

These checks are not proof of native readiness, clinical suitability, load capacity or real-device live-voice performance. The assessment inspected current code, GitHub status and the hosted screen; it did not rerun the complete suite or make paid provider calls.

## Blocking work and acceptance evidence

| Priority | Gap | Required completion evidence |
| --- | --- | --- |
| 1 | Customer identity and hosted reliability | Ordinary customer onboarding and recovery; sign-out/session expiry; two real accounts unable to access each other's records; save/reload and cross-device checks; sensitive-data-free monitoring; exercised backup/restore and rollback. Private Cloudflare account sign-in is the current tester access mechanism. |
| 2 | Personal data and privacy | Review and integrate [PR #34](https://github.com/alisid0/daywell/pull/34), then finish its remaining provider deletion/retention and account lifecycle work. Fill controller/support details; publish accurate privacy information and consent; implement and test image handling, age/audience choices and restricted data-request procedures. Policy proposals alone are not enforcement. |
| 3 | Picture-first food | With later owner approval, connect server-side food AI and validate real photos, spoken corrections, portions, labels, restaurant meals and basket-to-plan-to-consumption flows. Handle uncertainty and network retries honestly. The owner deliberately left OpenAI disconnected for the private test; this publication does not enable it or authorise paid testing. |
| 4 | Voice and movement | Real Android/iPhone microphone tests for start, denial, mute, interruption and stop; verify the actual live agent's wellness instructions and generated replies. Routine cues currently use device speech. Expressive ElevenLabs coaching tied to actual workout progress, durable resume and qualified kettlebell content review remain work. No camera-based form-checking claim. |
| 5 | Billing and usage economics | Implement verified purchases, restore, cancellation/refund handling and server-enforced paid access. Define each tier's monthly voice/photo allowances, measure usage and reconcile provider events. Test limits, retries and interruptions. Prices discussed are not implemented subscription products. |
| 6 | Android and iPhone builds | No native projects or signed releases were found in tracked source. Establish a mobile architecture, reproducible APK/AAB and signed iOS builds, secure sign-in and device permissions. Check audio/background behaviour and avoid relying on browser timers for reliable alarms. |
| 7 | Store and launch operations | Confirm developer accounts, signing/build access, target countries/audience, required store declarations, screenshots, support/privacy URLs and reviewer access. Complete device accessibility and failure-path tests; resolve all data-loss, isolation, payment and core-flow defects before public release. |

Account/signing work and the first installable mobile build must begin immediately alongside identity and data work; the priority numbers are not a reason to postpone store eligibility until the final week.

Two concrete usage defects need attention before paid launch:

1. `app/api/capture/route.ts` takes allowance before request validation and has no corresponding failure refund. Move counting to the paid-call boundary and test which failures count, preserving the owner's rule that on-device and pre-recorded features do not consume paid allowances.
2. `app/api/voice/route.ts` issues signed connection URLs and does not persist a conversation-to-user usage ledger. Daily start caps in `lib/request-guards.ts` do not enforce monthly paid minutes or establish that every issued URL became a paid conversation. Add reliable duration accounting, reconciliation and server/provider enforcement before selling monthly allowances. [Current usage policy](usage-limits.md).

## Store timing and policy dependencies

For applicable personal Google Play accounts created after 13 November 2023, at least 12 testers must stay opted in continuously for 14 days before applying for production access. Access review usually takes seven days or less but may take longer. A compliant closed test beginning on 16 October reaches its earliest application point on 30 October, at the corresponding time. Web testing does not satisfy that store test. Production access and app approval are separate milestones. [Google testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465), [publishing status and review](https://support.google.com/googleplay/android-developer/answer/9859751).

Apple expects useful app functionality beyond a repackaged website. Its review rules also cover account deletion and explicit permission for sharing personal data with third-party AI. A wrapper and a successful web build do not establish acceptance. [Apple review guidelines](https://developer.apple.com/app-store/review/guidelines/).

Google's applicable account-deletion requirements include an external web route for requesting deletion. [Google deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111). Complete the store privacy/data declarations against actual app and provider behaviour. This is a product readiness assessment, not legal or clinical sign-off.

## Immediate execution order

1. Review the integrated PR #36 release baseline and PR #34 data work; resolve their overlap deliberately. Preserve the existing private service while preparing a separate customer launch environment.
2. Confirm Apple enrolment, Google Play account type/eligibility, build access and test devices. Start first mobile builds and recruit the required closed-test cohort when applicable; the owner controls invitations.
3. Complete account/data acceptance and a small invited phone beta. Add food-photo AI only when separately authorised, or explicitly limit the beta to the existing manual food tools.
4. Complete paid usage accounting and purchase flows; validate food, movement, live voice and recorded relaxation on both phones.
5. Freeze the release candidate, collect tester feedback, finish operational/store checks and review readiness on 5 November. Submit only when the applicable gates pass.

Keep Move, Relax, Eat and Sleep; one Daywell host; Food basket; and the calm Cosy cove direction. Defer additional mascot redesigns, appearance experiments, wearables, retailer integrations and social features. Preserve the [general-wellness scope](general-wellness-scope.md) and [picture/voice workflow](picture-and-voice-workflow.md). Do not market clinical benefit, longevity, allergy assurance, exact photo nutrition or reliable background alarms.

## Owner decisions still open

Google account readiness was reported but verified Play Console status and personal/organisation type remain unknown. Apple enrolment was previously incomplete; no new completion confirmation is recorded. The tester email, build-device access, exact November milestone, launch audience/countries and final paid allowances also remain open. Publishing this assessment is not evidence that these decisions or implementation tasks are complete.
