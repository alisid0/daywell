# Bringing AI voice back

Owner decision, 12 October 2026: live AI voice is left out of version 1, so that paying people never hit a usage limit. It returns when it can be offered without one. This page says how to keep that door open now, and what must be true before switching voice on.

## The rule for going live

Voice goes live only when an everyday heavy user's voice costs fit inside what their plan brings in. Recorded audio already meets this. Working figures:
- **Live voice today:** ElevenLabs costs about 7p a minute, so an hour a day costs about £125 a month.
- **Plans:** Plus brings in £7.08 a month after VAT and store fees.

Any of these routes can meet the rule:

| Route | Cost a minute | What has to happen |
| --- | --- | --- |
| Our own voice on our own graphics server | Under 0.5p once busy, plus £190–£440 a month for each server | Record a voice actor with a written AI licence, train an open model (Orpheus or Chatterbox), and reach enough daily voice use to keep a server busy |
| Phone listens and speaks, our assistant thinks | About 0.05p | The phone's own voice is less expressive. It needs the native speech plugins and a listening test |
| A cheaper live voice service (Gemini Live, OpenAI's realtime mini) | 2–3p | An hour a day still costs £32–£50 a month, so this fits only a higher-priced voice plan |
| A separate voice plan, priced to cover a heavy user | Any | A new price for the owner to decide, for example a Plus Voice plan |

## What we build now so voice can return easily

1. **One assistant for typing and speaking.** The Plus chat's tools, consent, safety rules and "Here's the plan" cards don't care how a request arrived. Voice then only adds a microphone in and a speaker out.
2. **Switch voice off; don't delete it.** Keep the voice routes and settings behind a server setting such as `DAYWELL_VOICE=off`, so the app shows no voice controls. Delete code that's no longer used, but keep the design notes.
3. **Measure minutes from the start of any test.** Record each voice session's length against the account (`usage_limits` or a voice log), so real costs replace estimates.
4. **Consent already has a voice wording.** The consent card names the voice provider. Store privacy labels list audio data only while voice is on.
5. **Keep a global safety switch, not a personal limit.** A daily total across all users protects against a runaway bill or abuse. It is never a limit an individual meets in normal use.

## Go-live checklist

- [ ] The owner picks a route above, with real per-minute costs from a two-week tester trial.
- [ ] Heavy users' voice costs fit inside the plan's income, with no personal limit.
- [ ] Voice uses the same assistant tools, confirmation and Undo as the chat.
- [ ] Safety: the fixed crisis message is spoken and also shown on screen, and long sessions get a gentle break prompt.
- [ ] Consent, privacy policy, Apple privacy labels and Google data safety list the voice provider and audio.
- [ ] Real Android phone and iPhone tests cover the microphone, interruptions, Bluetooth headphones and a locked screen.
- [ ] The minutes, the cost dashboard and the global safety switch are working.
- [ ] The owner says "voice on". The server setting changes without a new app release, because the phone apps open the hosted service.
