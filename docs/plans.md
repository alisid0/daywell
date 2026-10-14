# Plans

Owner decisions, 12–13 October 2026: Daywell is paid-only, with no free trial. There are two plans, and paying people never meet usage limits. Plan names and prices were approved in the plans preview on 13 October.

| Plan | Monthly | Yearly | What it is |
| --- | --- | --- | --- |
| **Daywell** | £4.99 | £39.99 (£3.33 a month) | Everything by hand: food basket, meal plans, shopping and food log; workouts, walks and routines with timers; sleep log; relax notes, calendar, timers and alarms |
| **Daywell Plus** | £9.99 | £79.99 (£6.67 a month) | Everything in Daywell, plus the AI (ask in your own words, food from a photo or a few words, meal plans from the basket) and Daywell's recordings (sleep sounds, guided sessions, kind words, spoken workout cues) |

## What each plan allows

| | No plan | Daywell | Daywell Plus |
| --- | --- | --- | --- |
| Open, export and delete what's saved | Yes | Yes | Yes |
| Save new things (`/api/state` upserts, `/api/food`, `/api/timer`) | No | Yes | Yes |
| AI (`/api/capture`, `/api/respond`, `/api/food-narration`, `/api/voice`) | No | No | Yes |
| Recordings (`/audio-library/`, `/guided-audio/`, `/sleep-sounds/`) | No | No | Yes |

Timer alerts sound on every plan, because the device makes the sound.

The rules live in `lib/plans.ts`. A refused API request gets status 402 with a plain message, from `planBlocked`. People without a plan who open the app are sent to the plan screen, by `requirePlanUser` in `app/chatgpt-auth.ts`.

## How the app knows the plan

The hosting's front door sets the `oai-authenticated-user-plan` header, just as it sets the identity headers. Any plan header sent by a browser is removed first.

| Hosting | Plan |
| --- | --- |
| Public app (`lib/public-access.ts`) | Read from `subscriptions`, in the same database query that checks the session |
| Private test (`lib/cloudflare-access.ts`) | Always `plus`, for the owner and invited testers |
| Local preview | `plus`, because there are no subscriptions there |

`getChatGPTUser()` returns it as `plan`. Hosted, a missing header means no plan.

## Subscriptions

`drizzle/0007_subscriptions.sql` holds one row per store subscription. The columns are:
- the store (`app_store`, `play_store` or `test`);
- the product;
- the plan;
- the status (`active`, `grace`, `cancelled`, `expired` or `refunded`);
- when it ends, and whether it renews.

Card details are never stored. Plus beats Daywell. A cancelled subscription keeps working until it ends, and a payment grace period still counts. Closing the account removes its rows through the foreign key.

**Store products:** `daywell_monthly`, `daywell_yearly`, `daywell_plus_monthly` and `daywell_plus_yearly`. They use the same IDs on both stores and sit in one subscription group, so people can move between plans. In RevenueCat they map to the entitlements `daywell` and `plus`. Moving up to Plus starts straight away; moving down starts at the next renewal.

## Screens

- **Choose your plan** (`/plans`) follows the approved preview. In the phone apps, the button will open the store's own payment sheet once RevenueCat is connected; until then it says payments open soon. On the web it says to subscribe in the phone app, because the web app doesn't sell subscriptions in version 1.
- **Your plan** in settings shows the plan, its price and when it renews or ends. It links to Change plan, and to Manage or cancel in the store. It warns that deleting the account doesn't cancel a store subscription.
- **After sign-up,** the welcome screen leads to Choose a plan.

## Testing plans before store purchases

Testers named in the Worker secret `DAYWELL_PLAN_TESTERS` (comma-separated addresses) can pick a plan without paying. The plan screen shows "Use … for testing", and Your plan offers "Clear test plan". A test plan lasts 30 days. The owner sets the addresses at the prompt:

```sh
npx wrangler secret put DAYWELL_PLAN_TESTERS --config dist/server/wrangler.json
```

Delete the secret before launch.

## Still to do

- **RevenueCat:**
  - the SDK in the phone apps, for buying, changing and restoring;
  - a webhook that writes `subscriptions` rows;
  - the four products and the subscription group in both stores.

  This needs the owner's store and RevenueCat accounts.
- **Restore purchases** and the **Terms of use** and **Privacy policy** links on the plan screen. The links wait for the public pages.
- **When a subscription ends,** people should still be able to open, export and delete what they saved, as the approved preview says. Today, anyone without a plan sees the plan screen. Nobody can lapse until store purchases exist, so read-only access comes with RevenueCat.
- **Plus labels across the app.** Following the approved pattern ("Food photos come with Daywell Plus", then Add by hand or See plans), people on Daywell get the by-hand way instead of an error.
- **Account closure (#47)** must include `subscriptions` in the export. Rows are already removed with the account.
