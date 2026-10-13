# AI consent and reports

Owner approval, 12 October 2026 ([preview](https://claude.ai/artifact/XTLCDkhUBvCBCPg7oGRxiJ)). Both stores require these before Daywell can be submitted:
- **Apple guideline 5.1.2(i):** say clearly where personal data goes, including to a third-party AI, and get permission first.
- **Google Play's AI-generated content policy:** let people report offensive AI output without leaving the app.

## What people see

- **Starting a conversation:** the consent card says that starting sends their voice (or messages) and the current timer details to ElevenLabs, which runs Daywell's conversations.
- **Food photos, descriptions and meal plans:** the line under the buttons names OpenAI and says what is sent.
- **Report link:** "Report this reply" appears under a conversation reply written by the AI, and "Report this estimate" or "Report this plan" under a food review.
  - Recorded replies and Daywell's own messages never show it; they are written and checked in advance.
  - The form offers four reasons (offensive or upsetting, unsafe or harmful, wrong or misleading, something else) and an optional note of up to 300 characters.

## What is kept

- **Contents:** the `ai_reports` table (`drizzle/0005_ai_reports.sql`) holds the person's account key, the time, where the text came from, the reason, the AI text (up to 4,000 characters) and the note. Nothing else from the conversation is sent or stored.
- **Daily maximum:** each person can send up to 20 reports a day.
- **Retention:** reports are kept for 90 days. Older ones are removed whenever a new report arrives, and every day at 03:17 UTC by the Worker's scheduled trigger (`build/cloudflare-worker.ts`, configured in `scripts/cloudflare-config.mjs`).

To review recent reports, run this in the Cloudflare D1 console for the Daywell database:

```sql
SELECT created_at, source, reason, reply, note FROM ai_reports ORDER BY created_at DESC LIMIT 50;
```

## Before and after deployment

- Apply migration 0005 to the hosted database before deploying. Until it exists, sending a report says it couldn't be sent; nothing else depends on it. The next deployment also adds the daily trigger.
- When the account work in [PR #47](https://github.com/alisid0/daywell/pull/47) lands, include `ai_reports` in the account export and closure:
  - add it to `personalTables`;
  - add the closure triggers;
  - guard `/api/ai-report` with the active-account check.
- The privacy page should mention reports and their 90-day retention.
- Before JEV is switched on, its consent ("share your request with an AI service") should name TypeSafe in the same way.
