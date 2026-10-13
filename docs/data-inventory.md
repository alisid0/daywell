# What Daywell stores

Review date: 13 October 2026. It covers `main` (`f8ee12e`), the live build (#46), account closure (#47) and AI reports (#49). Read it with [account lifecycle](account-lifecycle.md) in #47, which designs export and closure. Update it whenever a table, a stored field or an outside service changes.

## Where and how

- **Database:** Cloudflare D1 `daywell-private-db`. It was created with the Western Europe location hint. A location hint isn't a promise that data stays in Europe; the public database should be created with D1's EU jurisdiction setting so that it does.
- **Encryption and backups:** Cloudflare encrypts D1 at rest. Time Travel can restore the database to any point in the last 30 days, so deleted records can exist in restore points for up to 30 days. The privacy policy must say so. A restore must never bring back records from a closed account; see #47.
- **Identity:** each person is a SHA-256 hash of Cloudflare Access's issuer and subject (`lib/cloudflare-access.ts`), checked against Access's signed token on every request. Request headers that claim an identity are removed first. Email addresses are not written to the database.
- **Isolation:** every query is scoped by `user_id` (reviewed 13 October).

## Tables

| Table | What it holds | Personal | Kept for | Export / closure (#47) |
| --- | --- | --- | --- | --- |
| `settings` | Name, tools, bedtime, reading and voice choices; About you: birth year, optional sex, height and weight history (only with `bodyConsentAt`), calorie tracking | Yes. Body details are health data | Until changed or the account closes | Yes / yes |
| `entries` | Everything saved in the day: tasks, shopping, meals with calories and sugar, workouts, sleep nights, alarms, the timer, calendar events and private reflections | Yes. Meals, workouts and sleep are health data, and reflections may be very personal | Until the person deletes them; up to 20,000 a person | Yes / yes |
| `food_spaces` | Food basket, meal plans and shopping, one record a person | Yes | Until changed or closed | Yes / yes |
| `food_operations` | Each food change and how to undo it | Yes | **Forever: no limit today** | Yes / yes |
| `usage_limits` | Counts of paid AI uses in the current window | Low | Overwritten each window | Yes / yes |
| `account_closures` (#47) | A closed account's hashed ID, request ID and time | Pseudonymous | Kept, so old devices can't restore deleted records | Yes / kept by design |
| `ai_reports` (#49) | Reported AI text, reason and optional note | Yes | 90 days | **Not yet** / **not yet** |

## Not stored by Daywell

- Photos and voice recordings are sent for one estimate and never saved.
- Live conversation transcripts are held by ElevenLabs under the agent's retention setting, and go away when live voice is removed.
- Payment details are never seen; Apple and Google handle payment.
- Device-only drafts and reading or appearance choices stay in the browser.

## Sent to outside services

| Service | What goes | When |
| --- | --- | --- |
| OpenAI | Food photo or description, basket and reserved amounts for a meal plan (`store: false`) | Only when asked |
| ElevenLabs | Voice or typed messages, timer details, readout text | Live voice and readouts, which leave version 1 |
| TypeSafe (US) | Unmatched requests to pick a recorded reply | Switched off |
| Cloudflare | Everything above runs on its network; the planned chat would use its AI service, which doesn't train on customer data | Always |

## Problems found on 13 October

1. **Closure misses AI reports.** #47's `personalTables` and triggers don't include `ai_reports` from #49. After both merge, a closed account's reports aren't exported or deleted, and a late report can still be saved. Add the table to both.
2. **Food history is kept forever.** `food_operations` grows with every food change, although undo only needs recent ones. Keep the latest 90 days, plus the newest receipt per operation needed for retries, and delete older rows on the daily schedule.
3. **Shared devices keep other people's drafts.** #47 no longer clears other accounts' food drafts. If a session expires without signing out, the draft stays in that browser. Clear drafts older than 7 days, or any draft for another account, when someone else signs in.
4. **Errors fail as raw pages.** In #47, a database error during the closure check gives a raw 500, or a crashed page, instead of the planned "couldn't check your account" message.
5. **Refunds abort after closure.** In #47, a paid request in flight when an account closes can't return its allowance, because of the closure trigger, and shows a provider error instead of "account closed".
6. **No written retention for chat or provider data.** `config/owner.json` has no retention period yet. That is an owner decision before launch.

The full review is in the 13 October session; the #47 items go to Codex.

## Planned additions

These must exist before the plans and the chat launch. Each must be in the export, deleted at closure and covered by the closure triggers.

| New store | Fields | Kept for |
| --- | --- | --- |
| `subscriptions` | Store (Apple or Google), original transaction ID, product, plan (`basic` or `plus`), status, renewal or expiry time, last checked | While active, then as long as tax and refund rules need the record. Card details are never stored |
| `chat_messages` | Who sent it, text, time, any plan it proposed | 30 days (owner to confirm), and clearable at any time |
| `assistant_actions` | What the assistant changed, before and after, so Undo works, and whether the person confirmed it or it was a small thing done straight away | 30 days |
| `consents` | Which consent (body details, chat, food AI, each provider), the wording version, when given and when withdrawn | As long as the account, as proof of consent |
| `settings` fields | "What Daywell can see" switches and "Small things straight away" | With settings |

## Launch checks

- [ ] Create the public database with the EU jurisdiction setting, and apply migrations in order (0004 before #47's code, 0005 before #49's code).
- [ ] Two real accounts can't see each other's records, by API and in the app.
- [ ] Export and closure cover every personal table, including the new ones above.
- [ ] Privacy policy lists each table's purpose, the services above, retention, the 30-day restore window and the person's rights.
- [ ] Body details, food, workouts and sleep are health data under UK GDPR. They need explicit consent, recorded in `consents`, and a data protection impact assessment before public launch.
- [ ] Logs never contain message text, food details or email addresses. The current code follows this.
- [ ] A restore drill shows that closed accounts stay closed after a restore.
