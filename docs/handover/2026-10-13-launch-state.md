# Handover: launch state, 13 October 2026

This is for Claude or Codex continuing on any machine. It records where Daywell stands after the 13 October session, the owner's decisions in force, how the hosting is set up and what each person does next. Read [AGENTS.md](../../AGENTS.md) and the [GitHub workflow](../github-workflow.md) first. GitHub is the source of truth; anything below that is "local only" is not on GitHub.

## Handover summary

```text
Session date: 13 October 2026 (Claude, on the owner's Windows machine)
Branch and PR: main at 890e4d2 after merging #48, #49, #54, #55, #56 and #57. This file: docs/handover-2026-10-13.
What changed: public sign-up and sign-in (email codes) built and merged; phone app shell, AI consent and reports, shopping phrases and the data inventory merged; daywell.date bought; EU database daywell-db created.
Checks: main passes typecheck, 256 tests, build and the GitHub check; 35/35 end-to-end journeys pass in the local preview harness.
Not yet verified: real email delivery, the public deployment, sign-in inside the Android and iPhone apps.
Next step: owner buys Workers Paid and approves a Wrangler sign-in; then email sending, migrations, the secret and (on the owner's "deploy") the public deployment.
Setup on another machine: npm run install:ci. No new migration needs applying to the private test unless it is redeployed (then 0005 and 0006).
Work still local: the preview harness, the journeys suite, preview sources and the public hosting profile (section 9).
```

## 1. Where things stand

- **Sign-up and sign-in are finished on `main` but not live.** People type their email, get a 6-digit code and are in; the first code creates the account. See [sign-in](../sign-in.md).
- **The public domain is `daywell.date`**, bought by the owner through Cloudflare Registrar. It renews in October 2027.
- **The public database `daywell-db` exists**, restricted to the EU (Cloudflare shows "The European Union", region Eastern Europe). It is empty.
- **Email sending is blocked** until the Cloudflare account moves to Workers Paid, which only the owner can buy.
- **The private test still runs an older build.** It serves PR #46's branch at `f53d5bb`, which predates everything merged on 13 October.
- **The store release is paid-only, with two plans.** Billing, the plan screen, the demo and plan checks are not built yet.

## 2. Owner decisions in force

Newest first. Earlier documents that disagree are out of date.

| Date | Decision |
| --- | --- |
| 13 Oct | The brand line is "a date with yourself": self-care, using the `.date` domain as wordplay. Daywell is never described as a dating app or site, in the stores, in ads or anywhere else. The store category stays Health & Fitness. |
| 13 Oct | The public domain is `daywell.date`. |
| 13 Oct | Claude builds sign-up and sign-in (previously Codex's lane). RevenueCat handles store purchases. |
| 13 Oct | The sign-in screens were approved and built (#57). Email codes only; no Google, Facebook or Apple sign-in for now. |
| 13 Oct | Plans are named **Daywell** and **Daywell Plus**. Prices are £4.99 a month or £39.99 a year, and £9.99 a month or £79.99 a year. |
| 13 Oct | The Plus assistant starts on "Small things straight away". Typed quick requests are Plus-only. |
| 13 Oct | Retention: chat history 90 days, food history (`food_operations`) 365 days, flagged unsafe exchanges 90 days. |
| 13 Oct | "Help improve Daywell" is an opt-in, off by default. Replies and requests are used to improve the service. |
| 13 Oct | There are six report reasons: made something up, said something Daywell shouldn't, did the wrong thing in the app, unsafe, offensive, other. An optional box also sends the message before the reply. |
| 13 Oct | Plus vision: an assistant that knows the person's food, sleep, relaxing, wind-down, schedule and to-do list. It acts in the app for them and suggests from recent history, for example "eggs again?" or "lats today, after chest and legs". See the test page in section 10. |
| 12 Oct | Paid-only, with a free demo and no trial. Launch when every promised feature works on real phones. |
| 12 Oct | **Daywell** (£4.99): everything by hand, no AI and no audio; timer alerts still sound. **Daywell Plus** (£9.99): the AI chat, food photos, meal planning and recorded audio. "Limited voice" means recorded voices only. |
| 12 Oct | **No live AI voice in version 1, and no usage walls for paying users.** Drop a feature rather than cap it. Only hidden abuse limits far above real use are allowed. See [AI voice later](../ai-voice-later.md). |
| 12 Oct | Marketing is short videos on Instagram, TikTok and YouTube Shorts. Affiliates (health brands, gyms, grocers) come later. |
| 9 Oct | Gentle check-ins: no pressure to log. Capture automatically where possible; otherwise ask kind questions that take under 20 seconds. |
| 8 Oct | General-wellness scope only: no medical or clinical advice, treatment promises, or medicine, supplement or alcohol recommendations. See [general wellness scope](../general-wellness-scope.md). |
| 8 Oct | Only paid API calls count towards limits. Recorded audio and on-device features never count. See [usage limits](../usage-limits.md). |

## 3. Rules every agent follows

- **Workflow.** Fetch before working. Use one branch per change and a PR with a handover. Push, and confirm the remote commit matches.
- **Merging.** Merge only when the owner explicitly says "merge it" or "merge #N". Approval of a preview is not a merge instruction.
- **Visible changes.** Show the owner a preview of any visible UI change first. Build only after they say "approved".
- **Keys.** Never ask for keys in chat, and never print or commit them. The owner enters secrets in the secret prompts. Never commit `.dev.vars`, `.env` files, hosting profiles, local databases, personal records or build output.
- **Spending.** Agents never buy anything (domains, plans, store accounts). No paid AI or provider calls without the owner's approval; this includes model tests.
- **Testing.** Never save test data to the owner's live account.
- **Health data.** Body details, meals, workouts and sleep are UK GDPR special category data. They need explicit consent.
- **Styles.** New CSS sizes use `calc(Npx*var(--rc-scale,1))` with a 14px minimum, so Reading comfort works.

## 4. Repository state

### Merged on 13 October

| PR | What it did | Merge commit |
| --- | --- | --- |
| #48 | Android and iPhone apps (Capacitor 8.5.3), the store launch plan, and a "Phone apps" CI workflow that builds a debug APK (`daywell-android-test`) | `ab3e8ed` |
| #49 | Names AI providers before sharing (consent), and lets people report AI replies. Adds `ai_reports` (migration 0005), kept 90 days by a daily cron | `4d1837b` |
| #54 | Understands everyday shopping phrases. A typed request now offers a typed chat, not voice | `7912f7b` |
| #55 | [What Daywell stores](../data-inventory.md) and [bringing AI voice back](../ai-voice-later.md) | `b490f26` |
| #56 | Email sign-up and sign-in: migration 0006, the public Worker entry, sign-in protection and the review account | `07e2def` |
| #57 | The sign-in screens, and Your account with Sign out in settings | `890e4d2` |

### Open pull requests

| PR | State | What's needed |
| --- | --- | --- |
| #58 | Docs only: the public setup checkpoint | Can merge on the owner's say-so |
| #47 | Draft (Codex): exports and durable account closure, migration 0004 | Fix the findings in section 8, then review |
| #46 | Codex: music for song requests and sounds in Sleep. **This is the build running on the private test** | Decide whether to merge it or rebase it onto current `main` |
| #34 | Draft: Your data controls and privacy requirements | Fully contained in #47, which integrates and hardens it. Close #34 when #47 merges |
| #50–#53 | Dependabot. #53 is eslint 10 and #52 is raw-body 4, both major versions | Not reviewed. Try each on a branch with `npm run check` |

### Database migrations

`drizzle/` holds 0000–0003 (base, usage limits, food), **0004 (reserved for #47)**, 0005 (`ai_reports`) and 0006 (`accounts`, `sign_in_codes`, `sessions`). Wrangler applies every file it hasn't recorded yet, so 0004 can still apply after 0005 and 0006. Apply each migration before deploying the code that uses it.

## 5. Hosting

### Private test: owner only, behind Cloudflare Access

- **Address and parts:** https://daywell-private.alisid1994.workers.dev. Worker `daywell-private`, database `daywell-private-db` with the Western Europe location hint (not an EU jurisdiction).
- **Running build:** `f53d5bb` (#46).
- **Secrets:** ElevenLabs and OpenAI are connected.
- **Profile:** the ignored `cloudflare.local.json` is on the Codex machine.
- **Redeploying:** this needs migrations 0005 and 0006 first. See [Cloudflare hosting](../cloudflare-hosting.md).

### Public app: email sign-in, not deployed

| Part | State |
| --- | --- |
| Domain | `daywell.date`, active in the same Cloudflare account |
| Database | `daywell-db`, EU jurisdiction, empty |
| Email | Blocked: Email Sending needs **Workers Paid** ($5 a month plus usage, which includes email sending). The account is on Workers Free |
| Wrangler | Not signed in on the owner's Windows machine |
| Profile | The ignored `cloudflare.public.local.json`, only on the owner's Windows machine. Its build and dry run pass |

**Recreate the profile on another machine** from `cloudflare.public.example.json`:
- `"signIn": "email"` and `"workerName": "daywell"`;
- `accountId`: the 32-character ID in the dashboard's address bar;
- `"databaseName": "daywell-db"` and `databaseId`: from Workers & Pages → D1 → daywell-db;
- `"appOrigin": "https://daywell.date"` and `"emailFrom": "sign-in@daywell.date"`.

Keep the IDs out of the repo, which is public.

**Steps to go live, in order:**
1. **Owner:** buy Workers Paid (Compute → Workers plans → Upgrade).
2. **Owner approves a Wrangler sign-in.** Wrangler waits about 2 minutes for the Allow click:
   ```sh
   npx wrangler login --callback-host=127.0.0.1 --scopes account:read user:read workers:write workers_scripts:write workers_routes:write zone:read d1:write email_sending:write
   ```
3. Run `npm run install:ci`, then `npm run check` and `npm run cloudflare:check`, then `npm run cloudflare:build -- cloudflare.public.local.json`. Inspect `dist/server/wrangler.json`. It should show the `daywell.date` custom domain, `send_email` restricted to `sign-in@daywell.date`, and `daywell-db`.
4. Run `npx wrangler email sending enable daywell.date`. This adds the SPF and DKIM records.
5. Run `npx wrangler d1 migrations apply DB --remote --config dist/server/wrangler.json`.
6. Create the secret without displaying it:
   ```sh
   node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('base64url'))" | npx wrangler secret put DAYWELL_AUTH_SECRET --config dist/server/wrangler.json
   ```
7. **Only after the owner says "deploy":** run `npx wrangler deploy --config dist/server/wrangler.json`. Then sign up with a real address, sign out and sign in again. Check that codes reach the inbox in Gmail, Outlook and iCloud, and that two accounts can't see each other's records.
8. **Before store review:** set `DAYWELL_REVIEW_EMAIL` and a 6-digit `DAYWELL_REVIEW_CODE` as secrets, and put them in the review notes.

**Caveat until plans exist:** anyone who signs up gets the app free. The public Worker has no AI keys, so AI features are off there. Recordings already need an account. The plan checks come with subscriptions.

### Other services

| Service | State |
| --- | --- |
| Apple Developer Program | The owner is enrolling as an organisation, with the same D-U-N-S number as the Google account. US$99 a year |
| Google Play Console | Verified organisation account. The app may still need creating; check with the owner |
| RevenueCat | Chosen, but no account yet. Free until $2,500 of monthly revenue, then 1% |
| ElevenLabs | Used only by live voice and readouts, which leave version 1 |
| OpenAI | Food photos and meal plans on the private test. The Plus chat model is still to be tested (Workers AI open models first) |
| TypeSafe (Jev picker) | Switched off |

## 6. What exists, by area

- **Sign-in:**
  - `lib/public-access.ts` is the front door. It sets the identity headers and handles `/api/sign-in/*` and sign-out.
  - `lib/email-sign-in.ts` holds codes, accounts, sessions, sign-in protection and the daily clean-up.
  - `build/public-worker.ts` is the public Worker entry, and `drizzle/0006_email_sign_in.sql` the tables.
  - The screens are `app/sign-in/`, `app/your-account.tsx` and `lib/sign-in-client.ts`.
  - Tests: `tests/email-sign-in.test.mjs`, `tests/public-access.test.mjs` and `tests/sign-in-client.test.mjs`, using an in-memory SQLite stand-in for D1 (`tests/fixtures/sign-in-db.mjs`).
- **Identity contract:** the app reads `oai-authenticated-user-id` and `oai-authenticated-user-email` through `app/chatgpt-auth.ts`.
  - The private test sets them in `lib/cloudflare-access.ts`, with user IDs `cf-access:<hash>`.
  - The public app sets them in `lib/public-access.ts`, with user IDs `dw:<32 hex>`.
  - The local dev server sets a mock user.
- **Hosting profiles:** `scripts/cloudflare-config.mjs` builds either profile. `"signIn": "email"` selects the public one.
- **AI consent and reports:** `lib/ai-report.ts`, `app/ai-report.tsx` and [AI reports](../ai-reports.md).
- **Phone apps:** `capacitor.config.ts` reads `mobile/app.json` (app ID `com.daywell.app`). `scripts/mobile-sync.mjs` and `.github/workflows/mobile.yml` build them. See [phone apps](../mobile-app.md).
- **Everything earlier** (food basket, routines, timers, sounds, Reading comfort, wellness scope) is described in the earlier dated handovers in this folder.

## 7. Work queue

| # | Item | Lane | Status and notes |
| --- | --- | --- | --- |
| 1 | Public deployment | Claude + owner | Waiting on Workers Paid, the Wrangler sign-in and the owner's "deploy" (section 5) |
| 2 | Report reasons update: the six reasons, plus the optional message before the reply | Claude | Approved. Needs a new migration that rebuilds `ai_reports`, because its CHECK constraint changes |
| 3 | Two plans: `subscriptions` table and plan API, plan screen, Your plan, Plus labels and gating, plan check for recordings, test plan switch | Claude | Design approved in the plans preview. The welcome screen's Continue becomes Choose a plan |
| 4 | RevenueCat and store products (four: each plan monthly and yearly, one subscription group) | Claude + owner | Needs the RevenueCat account and both store accounts |
| 5 | Demo for signed-out visitors: a sample day, nothing saved, no AI | Claude | Design approved. Then add the sign-in page's Back to the demo link, and have Start Daywell open `/sign-in?start=1` |
| 6 | Remove live voice and spoken readouts; recorded workout cues; speaking through the keyboard microphone | Claude | Planned in the [store launch plan](../store-launch.md) |
| 7 | Plus assistant on the server: tools, context, memories, daily ideas, Llama Guard checks, reports | Claude | Needs the owner's approval for a small paid model test. Storage is planned in the [data inventory](../data-inventory.md) |
| 8 | Native audio and notifications (Apple 4.2: sounds on the lock screen, timer alerts with the app closed) | Claude | Not started |
| 9 | Store listings, screenshots, privacy labels, data safety | Claude drafts, owner approves | Use the "date with yourself" line, never "dating app" |
| 10 | Account closure (#47) | Codex | Fix the section 8 findings and include the new tables |
| 11 | Public privacy, terms and support pages | Codex | Must be public, not behind Access. Needs the operator name and a contact email, which could be `support@daywell.date` through Email Routing |
| 12 | Private test redeploy, and a decision on #46 | Codex + owner | Only if the owner wants the private test updated |
| 13 | Dependabot #50–#53 | Anyone | Major upgrades need a check run first |

**Owner to-do:**
- Workers Paid.
- Approve the Wrangler sign-in, then say "deploy".
- Apple enrolment, the Play Console app and the RevenueCat account.
- Operator name and contact email.
- The App Store name: the UK store already has an app called exactly "DayWell", so the listing needs something like "Daywell: Daily Wellbeing".
- A UK trade mark search.
- Approve the chat model test.

## 8. Findings for #47, from the 13 October review

1. `ai_reports` from #49 is missing from `personalTables` and the closure triggers. Now add `accounts` and `sessions` from #56 too. Deleting the `accounts` row removes the account's sessions through its foreign key.
2. Shared devices keep other accounts' food drafts. Clear drafts older than 7 days, or any draft that belongs to another account, when someone signs in.
3. `database()` and `readClosure` run outside try/catch. A database error gives a raw 500 instead of the "couldn't check your account" message.
4. A paid request in flight when an account closes can't return its allowance, because of the closure trigger. It shows a provider error instead of "account closed".
5. The closure check adds a query to every API call. Consider caching it per request, or folding it into the session lookup.
6. Export accepts same-site requests. It should require same-origin, like the other routes.

## 9. Material only on the owner's Windows machine

This lives in the folder the Claude desktop app made for that session, not on GitHub:

- **Preview harness.** `daywell/.harness/food/` is git-ignored. It renders the real screens with Vite and fakes the server, so screenshots can be taken. Useful pages: `?page=signin` (the code is always 246810; sam@example.com is a returning member), `&account` for Settings, `?welcome=1` and `?view=eat`.
- **End-to-end journeys.** `preview-areas/journeys.mjs` runs the 35 journeys against the harness through headless Chrome.
- **Preview sources.** `preview-plans/` holds the templates and build scripts behind the approved previews in section 10.
- **Public profile.** `daywell/cloudflare.public.local.json` (section 5).

**Recommendation:** move the harness and the journeys into the repo, for example under `tools/preview/`, so both machines can run them.

**Note for Claude on Windows:** the local Workers runtime (`workerd`) can't start inside the desktop app's sandbox. Test D1 code with `node:sqlite` stand-ins. `npm run cloudflare:check` (build plus `wrangler deploy --dry-run`) works.

## 10. Previews the owner approved or is reviewing

These are claude.ai artifacts that only the owner's account can open; ask the owner for screenshots if you can't see them.

- **Plans, demo and chat:** https://claude.ai/artifact/CVAKMw3PKrni5kn9MqLptU (version 3). Approved 13 October.
- **Sign-in:** https://claude.ai/artifact/9kkfzQJN9VqwkH2wfnvUTP. Approved and built in #57.
- **AI consent and report:** https://claude.ai/artifact/XTLCDkhUBvCBCPg7oGRxiJ. Built in #49.
- **Plus assistant test page:** https://claude.ai/artifact/7H61d7MZKhG28CswqTbD8Y. A working prototype of the owner's vision; the real assistant is item 7.
- **Gentle check-ins proposal:** https://claude.ai/artifact/83nYErKPNQm3t2fRRpRffn. Awaiting decisions.

## 11. Working figures

- **Monthly income after VAT and store fees:** £4.99 brings in £3.53; £9.99 brings in £7.08; £39.99 a year is £2.36 a month; £79.99 a year is £4.72 a month.
- **Plus chat on Workers AI:** about 0.03–0.08p a message. A typical AI user costs 20–40p a month and a heavy one £2–£3.70, inside the Plus income.
- **Live voice for comparison:** ElevenLabs is about 7p a minute, so an hour a day is about £125 a month. That is why voice is out of version 1.
- **Fixed costs:** Workers Paid is $5 a month plus usage; Apple is US$99 a year; RevenueCat is free until $2,500 of monthly revenue.

## 12. Risks to keep in view

- **Name.** Other apps already use "Daywell":
  - the UK App Store has "DayWell", plus "Daywell Parenting" and "Daywell: Control Screen time";
  - Google Play has "Daywell - Self Care Routine";
  - the US App Store has "DayWell Companion" (Universal Health Services);
  - getdaywell.com and daywell.co.uk are family-organiser products.

  No trade mark search has been done.
- **Email from `.date`.** It is a new domain with an uncommon ending. On 13 October it was on none of Spamhaus, SURBL or URIBL. Watch inbox placement; if one provider files codes as junk, send from a second domain, which is a profile setting.
- **Free access before billing.** A public deployment before plans exist gives the app away. Keep it unannounced until plans work.
- **UK GDPR.** Explicit consent for health data, a data protection impact assessment, the privacy policy with retention periods and the 30-day restore window, and closure covering every table.
- **Timeline.** The [mobile release plan](../mobile-release-plan.md) aims for store review around 5 November, with a feature freeze on 26 October. The owner's rule is to launch when the promise works, so report slippage honestly rather than cutting promised features.
