# Phone feedback: food recognition, voice and timer context

Branch: `codex/private-tester-build`, [PR #36](https://github.com/alisid0/daywell/pull/36), left unmerged.

The owner reported that a meal photo needed a description, food replies sounded like browser speech, and the live host did not understand a one-hour PlayStation session or know the timer state. The subsequent clarification identified a 30-second food-recording display, not evidence that biryani created an activity timer.

## Changes

- Photo understanding is the primary action after choosing a photo; recording a description is explicitly optional. The recording counter is labelled as a microphone recording with a 30-second maximum and a Finished speaking button.
- Meal-photo instructions identify visible food and draft the shown portion without requiring the user to name it or confirm consumption first. Confirmation remains mandatory on the review screen before saving. Recognition remains visible above any clarification. Hidden ingredients, allergens and sugar are not inferred.
- Food review readouts use the configured Daywell agent's voice through ElevenLabs `eleven_v4`. The signed-in, same-origin endpoint validates length before paid dispatch, caps new readouts at 20/day/person and returns explicit failures. There is no browser-voice fallback. Audio stays in memory for replay of the same review; closing, correcting, navigating away or starting other audio stops playback. Half/double adjustments update both visible and spoken totals.
- Everyday gaming/reading/watching requests with bounded minute/hour durations prepare named timers. Negations, past-tense reports, unrelated food descriptions and unsupported compounds do not start timers. The user still reviews and confirms.
- During an explicitly started live conversation, the host shares only current timer state and pending proposals. A read-only `daywell_request` status request returns fresh running/paused/finished/absent state. It cannot confirm, delete, undo or save. The consent copy discloses the timer context. The existing live agent's prompt was updated and read back; voice, model (`eleven_v4_turbo`), tools, privacy, access and workflow settings were verified unchanged.

## Validation

- Full typecheck, test suite and production build passed. The first sandboxed run could not open the existing key-entry test's loopback server; rerunning with local network permission passed.
- Added regression tests for natural durations and activity names, negative and unrelated requests, status lifecycle, context field limits, read-only tool boundary, readout input limits and corrected portion narration.
- Real photo-only recognition: [public eggs-and-toast photo](https://coffeeclub.com.au/products/eggs-on-toast), uploaded with a generic filename and no food-name prompt, returned “Scrambled eggs with toast”, a nutrition draft and no follow-up question. No food record was saved. This verifies the mechanism, not numerical nutrition accuracy or broad recognition accuracy.
- A short ElevenLabs v4 food readout returned playable MP3 bytes using the configured voice.
- One live AI text conversation called the real client tool for a named 60-minute PlayStation proposal, then correctly read synthetic running status (39 minutes) and paused status (15 minutes). No microphone, generated conversation audio or owner records were used in that test.
- Isolated browser QA confirmed the same natural request prepares a review, Do this starts the named timer, and status follows pause/resume without resetting the remaining time.
- Hosted browser QA on the first deployment (`70823d5`, Cloudflare version `c09f1a0c-ac02-4d46-8300-6a5ab3f9e242`) repeated the real photo-only flow, generated the configured ElevenLabs readout, replayed/stopped it and halved 350 kcal to 175 kcal. Closing the review left zero food entries. Sixteen anonymous/forged-sign-in probes stayed protected. Four local narration requests with wrong origin, empty/oversized text or oversized bodies were rejected before provider dispatch.
- Hosted review exposed old saved-record wording in a draft. The follow-up changes the unsaved screen and readout to “portion shown” and “kcal estimated”; the regression test excludes “eaten”, “recorded” and “saved” from the draft readout. A new allowance test also checks narration caps, isolation from photo checks and refund on explicit provider refusal.

## Setup and remaining testing

No lockfile changes or migrations. Existing OpenAI and ElevenLabs secrets are reused; the ElevenLabs key requires Agents read and text-to-speech permission. Live-agent prompt changes are not applied by the GitHub sync monitor. Deployment evidence is appended after publishing.

The owner must retest their actual biryani photo and Android microphone/speaker behaviour. A web timer can report elapsed time on return but cannot guarantee an alert while Android is locked or the browser is suspended. JEV remains separately gated. This is a private tester improvement, not a claim of Play Store readiness or background-alarm support.

## Final private deployment

- Deployed application source: `45655379ed65370f97cfa7f3ef0524aecfff14cb`; its GitHub Check Daywell run passed on 10 October at 00:13:51 UTC.
- Cloudflare version `873d36fd-d366-4caa-8f67-388e295b0975` serves 100% of the private app, deployed at 00:13:04 UTC. The existing Access policy and provider secrets were preserved; no migration was needed.
- After refreshing the hosted app, a 393 × 851 browser check again identified eggs and toast from the image alone and showed “1 portion shown · 350 kcal estimated”. The save remained behind consumption confirmation. Closing it still showed zero saved food entries. This was desktop-browser responsive verification, not a claim of controlling or testing the owner's physical Android phone.
- The temporary isolated QA server was stopped. The normal localhost:5190 preview remains available. The only commits after the deployed source are handover documentation; a GitHub sync does not redeploy the phone app.
