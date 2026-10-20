# What Daywell stores

Review date: 13 October 2026. It covers `main` (`f8ee12e`), the live build (#46), account closure (#47) and AI reports (#49). Read it with [account lifecycle](account-lifecycle.md) in #47, which designs export and closure. Update it whenever a table, a stored field or an outside service changes.

## Where and how

- **Database:** Cloudflare D1 `daywell-private-db`. It was created with the Western Europe location hint. A location hint isn't a promise that data stays in Europe; the public database should be created with D1's EU jurisdiction setting so that it does.
- **Encryption and backups:** Cloudflare encrypts D1 at rest. Time Travel can restore the database to any point in the last 30 days, so deleted records can exist in restore points for up to 30 days. The privacy policy must say so. A restore must never bring back records from a closed account; see #47.
- **Identity:** in the private test, each person is a SHA-256 hash of Cloudflare Access's issuer and subject (`lib/cloudflare-access.ts`), checked against Access's signed token on every request, and email addresses are not written to the database. In the public app, people sign in with emailed codes ([sign-in](sign-in.md)). Each account has a random ID, and its email address is kept in `accounts`. Either way, request headers that claim an identity are removed first.
- **Isolation:** every query is scoped by `user_id` (reviewed 13 October).

## Tables

| Table | What it holds | Personal | Kept for | Export / closure (#47) |
| --- | --- | --- | --- | --- |
| `settings` | Name, tools, bedtime, reading and voice choices; the figure in workout pictures (female or male); About you: birth year, optional sex, height and weight history (only with `bodyConsentAt`), calorie tracking | Yes. Body details are health data | Until changed or the account closes | Yes / yes |
| `entries` | Everything saved in the day: tasks, shopping, meals with calories and sugar, workouts, sleep nights, alarms, the timer, calendar events and private reflections | Yes. Meals, workouts and sleep are health data, and reflections may be very personal | Until the person deletes them; up to 20,000 a person | Yes / yes |
| `food_spaces` | Food in the kitchen (with where each item is kept, and where each food usually goes), meal plans and shopping, one record a person | Yes | Until changed or closed | Yes / yes |
| `food_operations` | Each food change and how to undo it | Yes | **Forever today.** Owner decision 13 October: 365 days | Yes / yes |
| `usage_limits` | Counts of paid AI uses in the current window. In the public app, also sign-in protection counts, keyed by a hashed address or network | Low | Overwritten each window; sign-in counts removed daily | Yes / yes |
| `accounts` (public app) | Email address, random account ID, when it was created and last signed in | Yes | Until the account closes | **Not yet** / **not yet** |
| `sign_in_codes` (public app) | Keyed hashes of an address and its code, expiry and tries | Pseudonymous | 10 minutes; removed daily | Not linked to an account / expires |
| `sessions` (public app) | A hash of each device's session token, the account ID and times | Pseudonymous | 90 days after last use; removed daily | Not needed / removed with the account |
| `account_closures` (#47) | A closed account's hashed ID, request ID and time | Pseudonymous | Kept, so old devices can't restore deleted records | Yes / kept by design |
| `ai_reports` (#49) | Reported AI text, reason and optional note | Yes | 90 days | **Not yet** / **not yet** |

## Not stored by Daywell

- Photos and voice recordings are sent for one estimate and never saved.
- Live conversation transcripts are held by ElevenLabs under the agent's retention setting, and go away when live voice is removed.
- Payment details are never seen; Apple and Google handle payment.
- Device-only drafts, the trolley tray (what's been picked up while shopping) and reading or appearance choices stay in the browser.

## Sent to outside services

| Service | What goes | When |
| --- | --- | --- |
| OpenAI | Food photo or description; basket and reserved amounts for a meal plan; the basket's names, quantities and units for recipe ideas; a planned meal's name and ingredients for recipe steps (`store: false`) | Only when asked |
| ElevenLabs | Voice or typed messages, timer details, readout text | Live voice and readouts, which leave version 1 |
| TypeSafe (US) | Unmatched requests to pick a recorded reply | Switched off |
| Cloudflare | Everything above runs on its network; the planned chat would use its AI service, which doesn't train on customer data | Always |

## Problems found on 13 October

1. **Closure misses AI reports.** #47's `personalTables` and triggers don't include `ai_reports` from #49. After both merge, a closed account's reports aren't exported or deleted, and a late report can still be saved. Add the table to both.
2. **Food history is kept forever.** `food_operations` grows with every food change. Owner decision, 13 October: keep 365 days. Delete older rows on the daily schedule; undo and retries only ever need recent rows.
3. **Shared devices keep other people's drafts.** #47 no longer clears other accounts' food drafts. If a session expires without signing out, the draft stays in that browser. Clear drafts older than 7 days, or any draft for another account, when someone else signs in.
4. **Errors fail as raw pages.** In #47, a database error during the closure check gives a raw 500, or a crashed page, instead of the planned "couldn't check your account" message.
5. **Refunds abort after closure.** In #47, a paid request in flight when an account closes can't return its allowance, because of the closure trigger, and shows a provider error instead of "account closed".
6. **No written retention for chat or provider data.** Owner decision, 13 October: 90 days for chat history and for provider-held conversations. Record this in `config/owner.json` and the privacy policy.

The full review is in the 13 October session; the #47 items go to Codex.

## Planned additions

These must exist before the plans and the chat launch. Each must be in the export, deleted at closure and covered by the closure triggers.

| New store | Fields | Kept for |
| --- | --- | --- |
| `subscriptions` | Store (Apple or Google), original transaction ID, product, plan (`basic` or `plus`), status, renewal or expiry time, last checked | While active, then as long as tax and refund rules need the record. Card details are never stored |
| `chat_messages` | Who sent it, text, time, any plan it proposed | 90 days (owner decision), and clearable at any time |
| `assistant_actions` | What the assistant changed, before and after, so Undo works, and whether the person confirmed it or it was a small thing done straight away | 90 days |
| `memories` | Lasting preferences the assistant learns, such as "prefers savoury breakfasts" or "trains in the evening", and when it learned them. The person sees, edits and deletes them in "Daywell remembers" | Until the person deletes them, or the account closes |
| `daily_ideas` | Up to three suggestions a day, made from the last few days of food, drinks, muscles trained, sleep, plans and the to-do list | 7 days |
| `entries` changes | Strength sessions record the muscle groups trained, food entries can be drinks, and the to-do list becomes part of the assistant's context | With the entry |
| `safety_flags` | An exchange that an automatic check flagged: the message, the reply, the check's category and the model version | 90 days |
| `ai_reports` changes (#49) | New reasons: made something up, said something Daywell shouldn't, did the wrong thing in the app, unsafe, offensive, other. Optionally the message that led to the reply | 90 days |
| `consents` | Which consent (body details, chat, food AI, each provider), the wording version, when given and when withdrawn | As long as the account, as proof of consent |
| `settings` fields | "What Daywell can see" switches and "Small things straight away" | With settings |

## Using chats to improve Daywell

Owner request, 13 October: use replies and requests to make the service better, and make sure people can report poor replies, including made-up answers (hallucinations) and replies that break Daywell's rules (jailbreaks). There are four sources, each with a clear basis:

1. **Reports.** The person chooses to send a reply, a reason and, if they tick the box, the message before it. A report goes on every AI reply and on every change the assistant makes. Kept 90 days.
2. **Automatic safety checks.** Every chat message and reply is checked by a safety classifier (Llama Guard on Cloudflare, about 0.02p a message) and by Daywell's own scope rules (`wellnessBoundary`, no medical advice). Flagged exchanges go to `safety_flags` for review. The chat consent says so.
3. **"Help improve Daywell".** People can opt in to let the team read samples of their chats, with names and numbers removed, for up to 90 days. It is off until they turn it on. Food, sleep and body details are health data under UK GDPR, so this needs explicit consent, recorded in `consents`.
4. **Anonymous counts for everyone.** These hold no text: requests not understood, reports by reason, flags by category, and how often plans are confirmed or undone.

**How fixes happen.** Each week, review reports and flags.
- A fixed problem becomes a test: a library of known bad prompts and expected safe replies, which runs before each release.
- Made-up answers are reduced by answering from the person's own records, and by saying "I don't know" when the records don't hold the answer.
- Rule-breaking replies are limited because the assistant can only act through Daywell's own checked tools. A tricked reply still can't delete an account, spend money or share data.

**Not allowed:** selling chats, or letting outside AI companies train on them. Cloudflare's AI service doesn't train on customer data. Any future fine-tuning of Daywell's own model uses only opted-in, de-identified examples.

## Launch checks

- [ ] Create the public database with the EU jurisdiction setting, and apply migrations in order (0004 before #47's code, 0005 before #49's code).
- [ ] Two real accounts can't see each other's records, by API and in the app.
- [ ] Export and closure cover every personal table, including the new ones above.
- [ ] Privacy policy lists each table's purpose, the services above, retention, the 30-day restore window and the person's rights.
- [ ] Body details, food, workouts and sleep are health data under UK GDPR. They need explicit consent, recorded in `consents`, and a data protection impact assessment before public launch.
- [ ] Logs never contain message text, food details or email addresses. The current code follows this.
- [ ] A restore drill shows that closed accounts stay closed after a restore.
