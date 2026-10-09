# Usage limits: only paid API calls count

Owner decision, 8 October 2026: Daywell counts only requests that reach a paid API. Pre-recorded audio, and anything that runs on the person's own device, never count.

## What counts

| Feature | Paid service | One use is | Limits |
| --- | --- | --- | --- |
| Live voice and AI chat | ElevenLabs and its AI model | a conversation that ElevenLabs actually starts | 6 every 10 minutes and 10 a day per person; 100 a day for everyone together. Each conversation ends after 15 minutes. |
| Photo or voice understanding, and meal planning | OpenAI | a request sent to OpenAI | 20 a day per person |
| Optional recorded-reply matching | TypeSafe JEV | each classification request (topic and reply are separate) | 120 a day per person; disabled until acceptance testing |

## What never counts

- Pre-recorded replies in Just listen and the reply library.
- Guided and unwind sessions, which play saved recordings.
- Everyday commands, whether typed or spoken. Daywell understands them itself, and the browser turns speech into text.
- Spoken workout cues, which use the device's own voice, and tap-to-talk workout commands.
- The food basket, plans, shopping, calendar, timers, and anything else saved without AI.

## When a limit is reached

The request is refused before any paid call, so it costs nothing. The person sees a plain message, and every free feature keeps working.

| Limit reached | Message |
| --- | --- |
| 6 starts in 10 minutes | You've started several conversations. Give it a few minutes, or use your everyday tools. |
| 10 a day for one person | You've had today's 10 live conversations. More are available tomorrow, and typing everyday commands still works. |
| 100 a day for everyone | Live conversations are unavailable until tomorrow because Daywell's daily limit has been reached. Typing everyday commands still works. |
| 20 photo or voice checks a day | You've used today's photo and voice checks. Typing an entry still works, and checks reset tomorrow. |
| 120 picker requests a day | The picker falls back to offering a new conversation; exact recordings and everyday commands remain free. |

Daily limits reset at midnight UTC, which is 1 am in UK summer time. A limit never cuts off a conversation that has already started; it ends at 15 minutes as usual.

## Rules for code

1. Take the allowance immediately before each paid call, after the complete request has been validated. A spoken capture can use one request for transcription and another for interpretation. Allowances live in `limits` in `lib/request-guards.ts`.
2. If the paid service fails before doing any work, give the uses back with `returnAllowances`, using the same `now` that took them.
3. Never take an allowance for pre-recorded audio or for on-device features.
4. A new paid feature adds its own allowance to `limits`, and a row to the tables above.
5. When a pre-recorded reply fits a request, use it before starting a paid conversation.

## Still to do

- Capture validation now runs before paid calls. Explicit provider refusals and cancelled dispatches are refunded; a timeout after dispatch stays counted because provider billing is unknown. See [response routing](response-routing.md).
- Monthly paid plans will need minutes measured per conversation. ElevenLabs conversation IDs make this possible.
