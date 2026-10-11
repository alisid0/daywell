# Daywell improvements report

8 October 2026 · Product and release recommendations

## Assessment

Daywell has a working local foundation: its main food, relaxation, movement, sleep and calendar journeys passed the latest walkthrough. The next investment should connect those journeys into a dependable personal assistant and make them work on real phones. More design variations or a larger recording library should come after that.

The strongest promise is simple: **tell one friendly host what you need, take one manageable next step, and have Daywell remember what you actually did.** Keep Move, Relax, Eat and Sleep as the four clear areas. Keep the cosy cove, optional companions, gentle motion and a place to rest without completing a task. Users should not need to remember mascot names, maintain a perfect streak or fill in every field before getting help.

This report proposes improvements; it does not implement or certify them. Findings combine the [local end-to-end test report](2026-10-08-end-to-end-testing.md) with source review at [commit 2eb1e9c](https://github.com/alisid0/daywell/commit/2eb1e9c99f0cc7b0c1960bc3411c56f7e24d3d04). That revision passed 113 automated tests, 93 HTTP checkpoints, checks of 503 audio assets, the build and GitHub CI. These results do not establish hosted, real-provider, physical-phone or store readiness.

## Priorities

“Launch gate” means required for the stated release, not that every item must block a private prototype. “Next” means the highest-value product work once the relevant foundation is available.

| Priority | Improvement | Why it matters | Completion evidence |
| --- | --- | --- | --- |
| Launch gate: private phone beta | Working hosted app and protected sign-in | A localhost preview cannot be used independently of the computer. | Owner signs in on a phone over mobile data; records survive reload; logout and expired sessions behave correctly. |
| Launch gate: customer beta | Customer accounts, separation and recovery | An owner-only Cloudflare gate is not customer account management. | Two test accounts cannot read or alter each other's records; sign-out clears personal drafts; recovery, export and deletion are exercised. |
| Launch gate: store release | Signed Android and iOS builds | Phone-width browser checks do not test native permissions, interruptions or distribution. | Installable builds pass microphone/camera denial, calls, headphones, screen locking, relaunch and accessible navigation on real devices. |
| Launch gate: paid release | Billing, entitlements and AI usage control | Session-start limits do not enforce a customer's monthly voice allowance or subscription. | Test purchase, restore, expiry and refund update access correctly; measured voice use enforces the chosen plan without duplicate charging. |
| Next | One shopping list shared by voice and Food basket | “Add milk” currently creates a legacy shopping note. | Spoken and typed additions appear in the main Shopping view; purchases update inventory only after reviewing actual quantities. |
| Next | Durable drafts and activity recovery | A phone can close an app midway through a task. | An interrupted draft or workout resumes; an uncertain save can be reconciled without repeating its effects. |
| Next | Saved context for the host | The current live agent cannot see the user's basket, schedule or history. | Answers use authorised saved data, ask about missing facts and review proposed changes before saving. |
| Next | Real multi-day planning and photo-to-basket | The current planner is manual; its 2/3/7-day buttons select a viewing window. | A reviewed plan for chosen days produces a scoped shopping list; confirmed photo items become usable inventory. |
| Next | One calendar and gentle weekly reflection | Meal plans and future calendar entries currently live separately. | Meals appear on their planned dates; history summaries reflect recorded activity and acknowledge missing data. |

The hosting gate currently requires an owner decision: the Cloudflare connection lacks the Worker deployment permission, and the owner chose to keep the existing permissions. No deployment or permission workaround is proposed here. Product work that does not depend on hosting can continue. See the [hosting checkpoint](2026-10-08-cloudflare-connection.md).

## Product improvements

### 1. Make spoken requests lead to the same food workflow

Today, the host's grocery action creates a generic grocery entry. The newer Shopping view keeps those entries under “Earlier shopping notes”, separate from recipe shortages and purchases. A new spoken request can therefore look like an old note instead of something just added. This is visible in the [host action mapping](../../lib/host.ts) and [food interface](../../app/food-space.tsx).

Use one visible Shopping experience. “Add milk” should add a current item without pretending the user already owns it. “I bought two litres” should offer a purchase review and then update Food basket. Keep household supplies, such as bin bags, available as shopping notes without treating them as meal ingredients. Preserve existing entries when connecting the two systems.

**Acceptance:** adding milk by voice or typing produces one visible item. Saying hello while reviewing it does not discard the proposal. Cancel changes nothing. Buying a different pack size updates the basket using the reviewed amount. Retrying or undoing does not duplicate inventory.

### 2. Preserve unfinished work when life interrupts

Food drafts currently survive navigation within the running app and the tested connection-loss retry. They are held in component state with a page-leave warning, however; that is not recovery after an operating system closes the app. Workout progress is also component-local. These are source-review findings, not a claim that every interruption has been reproduced. See [food state](../../app/use-food.ts) and [movement routines](../../app/move-routines.tsx).

Save recoverable drafts and workout progress under the correct user. Offer “Continue where you left off” or “Discard”. Preserve the pending operation identifier so a save that reached the server but lost its response can be checked before repeating it. Avoid retaining unnecessary raw images or audio, and clear personal cached work on sign-out. Never restart the microphone automatically.

**Acceptance:** close and reopen during meal planning and a workout, then recover the intended draft or step. Interrupt the response after a purchase commits; recovery still creates only one purchase. A different account never sees the previous user's draft.

### 3. Give the host useful, limited personal context

The [current agent configuration](../../config/daywell-agent.json) explicitly gives the agent no access to saved history, calendar contents or camera images. Its client tool can prepare actions or open an area; it is not a personal-data lookup. The conversational assistant therefore cannot yet reliably answer “What can I make with what I have?” from the user's real basket.

Add narrow, authenticated read tools for the information needed by a request: available ingredients, selected meal plans, upcoming events or recent recorded activity. Explain relevant AI data sharing and obtain the appropriate user choice before provider access. Send the minimum useful information rather than a whole journal. Preserve visible review for changes and only acknowledge a save after the server confirms it.

**Acceptance:** “What can I eat tonight?” uses confirmed stock and asks one necessary clarification at a time. “What's tomorrow?” matches saved plans. Unknown amounts remain unknown. The host does not invent meals, sleep, preferences or completed activity, and it cannot cross account boundaries.

### 4. Turn meal planning into a complete two-, three- or seven-day journey

The existing planner supports individual meals and a few recipe starters. Its day controls filter saved plans; they do not assemble a complete plan. Shopping also includes requirements outside the visible date window, with a warning. See [meal planning and shopping](../../app/food-space.tsx).

The improved flow should be: choose days and meal slots, confirm household portions and relevant food preferences, review what is already in Food basket, then receive an editable proposal. Ask about missing quantities when they affect the plan; do not demand a complete inventory first. Let users swap a meal, move it to another day, repeat a favourite or use a leftover. Make the shopping date range explicit so a three-day trip does not silently include unrelated future meals.

**Acceptance:** changing portions or swapping a meal recalculates only the relevant requirements. Confirmed stock reduces the shopping amount; unknown stock asks for clarification. Planning does not consume ingredients. Buying records actual quantities; cooking deducts only the servings prepared. Future plans outside the selected trip remain saved.

### 5. Connect photos to confirmation, then to action

The active Eat flow is manual. The older capture component is not mounted into it, and host help states that meal-photo recognition is outside the current MVP. Photo-to-basket must therefore be completed or clearly excluded from launch claims; an existing photo component is not an integrated feature.

Separate two intentions: “These are ingredients I have” and “This is a meal I ate”. For ingredients, show editable candidate names and quantities, flag uncertainty, then add only confirmed items to Food basket. For a meal journal, review the proposed record separately. Do not silently infer exact portions, expiry dates, allergens or nutrition from an image. Keep typing available if camera permission or recognition fails.

**Acceptance:** a real provider response can be corrected before saving; rejecting it changes nothing. Confirmed ingredients can be used immediately in planning. Logging a meal does not unexpectedly alter inventory. Provider failure retains the user's draft and offers a useful fallback.

### 6. Connect future plans with a reassuring record of progress

Recorded meals already appear in history, but upcoming meal plans use a separate store from the calendar's task/event entries. See [calendar projections](../../lib/calendar.ts). Bring planned meals into the calendar by reading their original records, rather than creating duplicate events that can drift apart.

Add an optional weekly reflection: “You recorded two walks, prepared three meals and made time for a quiet break.” Let users open the underlying entries. Treat an empty day as “nothing recorded”, not evidence of failure or inactivity. Keep rest valuable without requiring a timer, rating or journal entry.

**Acceptance:** moving a meal changes its calendar date; opening it returns to the same plan. Cooking records the meal once. Weekly counts can be traced to saved records and update after edits or undo. No streak-loss warning or invented health score is necessary.

## Voice, audio and a calm interface

Keep the one-host model. Companions can support the current activity without becoming additional assistants users must select or remember. Start with a few useful home actions such as “I need a break”, “Help me eat” and “Let's move”, alongside Talk to Daywell. Keep secondary tools available without presenting every capability on the first screen.

The tested branch contains **500 short recordings and three guided sessions**. The expanded response library and unwind voices remain in [PR #17](https://github.com/alisid0/daywell/pull/17); they are not integrated into this tested version. Review that work, its scripts, captions, voice consistency and asset loading before claiming the expanded library is available. Use reviewed recordings for repeatable guidance and live voice where conversation adds value. Do not generate more audio merely to increase the count.

Current voice controls limit starts and session length, not monthly paid minutes. Add server-verified usage accounting and a clear allowance display before paid access. Choose included minutes from measured costs and observed usage, rather than assuming the proposed £4.99/£9.99/£19.99 tiers can support unlimited interaction. See [voice connection](../../app/api/voice/route.ts), [request limits](../../lib/request-guards.ts) and [client session handling](../../app/use-eleven-agent.ts).

On phones, distinguish prerecorded relaxation playback from a live microphone session. Test appropriate screen-lock playback and interruption recovery for recordings; make live listening visible and easy to stop. Preserve transcripts, volume control, reduced motion and larger reading settings. Human listening review and real VoiceOver/TalkBack checks remain necessary; asset loading and narrow browser layouts do not substitute for them.

## Release sequence

1. **Agree the release baseline.** Main is still at `84b256b`. Hosting is in draft [PR #31](https://github.com/alisid0/daywell/pull/31), the greeting fix in open [PR #30](https://github.com/alisid0/daywell/pull/30), and expanded audio in PR #17. PR #31 already includes the greeting fix. Review integration carefully, run checks on the resulting revision and record exactly which revision a preview or build uses. Do not merge automatically.
2. **Close the immediate product disconnects.** Start with unified spoken shopping and recoverable drafts. Then add limited host context and the reviewed multi-day food journey. These can progress while the hosting permission decision remains unchanged.
3. **Prove a private phone beta.** Once hosting is authorised and available, test real sign-in, records, microphone, camera and playback over Wi-Fi and mobile data. Exercise backup restoration and a rollback on test data. Add privacy-conscious error reporting and a clear support route.
4. **Prepare customer and store release.** Complete customer account lifecycle, privacy information, AI-sharing choices, deletion, payment restoration and usage enforcement. Produce signed Android and iOS builds and run the same core journeys on real devices. The reported Google account is ready; Play Console readiness still needs verification. Apple enrolment remains outstanding.
5. **Freeze and review the exact build.** Reserve time for device defects, accessibility, store materials and review feedback. The [mobile release plan](../mobile-release-plan.md) uses 5 November 2026 as a working target, with review by 27 October and submission from 29 October if gates pass. The exact November deadline is unconfirmed; this is a conditional planning target, not a promise of store approval or availability.

Before inviting paying users, record evidence for five complete journeys: first sign-in and recovery; talk → reviewed action → saved result; basket → plan → shopping → purchase → cooking → undo; relaxation interrupted and resumed on a phone; and subscription purchase → restore → expiry with data export/deletion. Test both ordinary use and denied permissions, slow connections and interrupted saves. Measure response time, playback failures and provider usage during the beta instead of inventing performance or cost figures.

## What to defer

Defer additional themes, more mascot roles, bulk recording expansion, wearables, retailer integrations and live Google/Apple calendar sync until the core release is reliable. Keep the existing calendar export while live sync is undecided. Avoid promising medical treatment or guaranteed longevity; the product can clearly describe its support for everyday movement, rest, food and sleep without those claims.

**Recommended first implementation:** connect “add milk” to the current Shopping/Food basket workflow and protect unfinished drafts. Together these remove visible friction, reinforce the voice-first promise and make the next phone test more useful.

## Handover

Documentation only. No application, schema, dependency, account, deployment or provider changes are included with this report. The existing local test results apply to the baseline identified above; new features require their own implementation and acceptance evidence. Preserve both other-machine work and the separate audio checkout, and keep PR #31 draft while hosted acceptance remains blocked.
