# Wearables: steps, workouts and sleep

**Owner decision, 17 October 2026:** Daywell reads steps, workouts and sleep from the phone's own health store, in
the phone apps, after the first store release. That's Apple Health on iPhone and Health Connect on Android. Daywell
has no hardware of its own. A direct WHOOP connection is parked, because WHOOP owners are covered through the same
health stores.

## Why this route

- **Steps reach almost everyone.** iPhones and most Android phones count steps on their own, with no wearable.
- **Sleep and workouts come from what people already wear.** Apple Watch, Fitbit, Garmin, Oura, Samsung and WHOOP
  all sync into the same two stores. People without a wearable log sleep in Daywell, as now.
- **Only the phone apps can read these stores, not the browser.** Both stores also add a review: Google's Health apps
  declaration in Play Console, and Apple's HealthKit entitlement. Doing this after the first release keeps the
  early-November review on track.
- **No paid aggregator is needed.** Services that bundle every wearable, such as Terra, start at about $499 a month.

## What carries over from the WHOOP preview

The WHOOP preview is on branch `feat/whoop` (8a4081d), unmerged. These parts of it apply to any source:

- **Connected apps in Settings,** with a consent step that says what Daywell keeps and what it doesn't.
- **A Steps today card on Move:** a plain count, with no target.
- **Workouts and nights as ordinary entries.** They become Move and Sleep entries with `source` and `externalId`, and
  a night from a wearable waits for "How did you feel?".

## To build, after the first store release

1. **Choose the Capacitor plugin.** Candidates are `@capgo/capacitor-health` and Capawesome Health. Read steps,
   workouts and sleep sessions, starting with Android.
2. **Ask only for those data types.** Explain each one in the Health apps declaration and in Apple's usage strings.
3. **Publish the privacy policy as a public web page.** Google requires a page, not a PDF, and it must match the
   policy linked inside Health Connect.
4. **Treat it as special-category data:**
   - explicit consent;
   - retention, and deletion when someone disconnects or closes their account;
   - add the new data to the [data inventory](data-inventory.md) and to account closure (#47).
5. **Store it the way the preview does.** Steps are one total per day. Workouts and nights become entries, deduplicated
   by the store's record id, and a deleted entry stays deleted.

Sources: [Google Play: publishing a Health Connect app](https://developer.android.com/health-and-fitness/health-connect/publish),
[Capacitor health plugins (Capgo)](https://capgo.app/docs/plugins/health/), [Terra pricing](https://tryterra.co/community/pricing).
