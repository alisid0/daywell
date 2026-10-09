# Food AI and recorded-first responses

Session: 9–10 October 2026, Europe/London. Branch: `codex/private-tester-build`, [draft PR #36](https://github.com/alisid0/daywell/pull/36). Started from clean, published `03bc554`; fetched again before publication and found no competing branch commits. The PR head identifies the pushed checkpoint. Do not merge automatically.

## Changes

- Shared host checks local commands and current exact-match recordings before optional two-stage JEV matching or new ElevenLabs conversation. Original requests carry into new sessions and remain available if connection fails. Explicit continuous live conversations generate their subsequent turns; they are not routed clip-by-clip.
- JEV follows the GitHub notes and synthetic phrases in PR #35. Both stages allow no-fit, validate confidence/probabilities and select only approved current audio. It remains off until a real key and acceptance test are available. No private response cache or automatically generated library entries.
- Food statements preserve their words when opening consumed-meal, basket or meal-plan review. Food quantities and estimates bypass generic recordings. Nothing is saved by selection/classification.
- Added the masked local TypeSafe setup field. All keys remain server-side and ignored. Hosted setup reports configured status without accepting tester keys.
- Complete capture validation now precedes provider calls. Usage is reserved per request; explicit provider refusals and pre-dispatch cancellation are refunded. Added a separate per-person daily JEV allowance. No schema or dependency changes.
- Browser testing found the minimalist design hid the recording control. Listen/Stop playback now sits inside the response card and works in Home and the shared Move host.

## Evidence

- Final `npm run check`: type check, **196 tests passed**, production build passed.
- Cloudflare synthetic build and Wrangler dry-run passed before the final playback layout/request-retention refinements. A subsequent full app build passed those refinements; GitHub's check reruns the hosting gate on the published checkpoint. Nothing was deployed.
- New-source ESLint passed; the final staged scoped gate checked 21 code files with no added lint errors.
- Isolated HTTP router smoke: **34 checks passed** for authentication, forged identity/origin rejection, bad/oversized input, and local/recorded/boundary/fresh decisions in all six areas. No provider calls or record writes in that script.
- Browser on isolated `localhost:5192`: synthetic onboarding; exact clip selection, Listen/Stop playback, pending shopping review retained without confirmation, unknown-request disconnected fallback, egg/noodle words transferred into basket review, and recorded reply from Move.
- Food review preserved input after a provider refusal. The separate QA copy still contained an old synthetic invalid OpenAI fixture; that attempted request was rejected. No successful paid food/voice/JEV generation or real credential use occurred in this test. Do not describe it as real food recognition.
- Warm local benchmark: 1,281 eligible recordings, 1,860 decisions; p50 **0.714 ms**, p95 **0.899 ms**, max **2.915 ms** on this Windows runtime. These are decision-only timings, not speech/network/generation or phone latency. JEV was not called.

## Connection blocker and next steps

The owner now asks to connect food AI, superseding the earlier “leave disconnected” choice, and reports having saved only the OpenAI key. The active local setup still reports no OpenAI or TypeSafe key; the existing hosted `/voice-setup` also explicitly reports food understanding awaiting setup. A pending question asks for the form's save-status message only. Never ask for or paste a key in chat.

1. Save OpenAI through `http://localhost:5190/voice-setup#food-ai`, restart only this checkout's preview and verify model/account access. Run one small synthetic photo/description test through review, correction and confirmation; do not invent estimates or claim connected from a saved key alone.
2. Save TypeSafe separately. Run the opt-in synthetic benchmark and review actual reply suitability, no-fit behaviour and timing before setting `TYPESAFE_PICKER_ENABLED=true`. Exact recordings and everyday commands work while it is off.
3. Rebuild using the real ignored Cloudflare profile before any secret upload/deployment. Inspect the intended Worker/account/database and preserve the existing Access policy, records and ElevenLabs agent. The present source checkpoint has **not** updated the phone app. Follow [response routing](../response-routing.md) for gates and data-sharing details.
4. Verify real phone microphone/camera, browser speech support, first audio and interruptions, live seed-message delivery, food accuracy and provider retention before launch claims. The current Google Play account is owner-reported verified organisation; this does not prove store readiness.

The existing private deployment remains code `0f6ffed`, version `5b88dad3-5c36-4142-9811-3bc68f54811e`. No provider secrets, Access settings, live agent, database migrations or hosted code were changed. Local development remains `localhost:5190`; the isolated QA preview is stopped after checks. Keep all separate greeting/audio checkouts intact. Other machine: fetch this branch, use the locked dependencies and ignored local keys, run checks, then follow the activation gates; no new migration is required.
