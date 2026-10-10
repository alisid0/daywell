# Conversational timers and remembered activity context

Session: 10 October 2026. Branch: `codex/private-tester-build`, [PR #36](https://github.com/alisid0/daywell/pull/36), left unmerged.

## Behaviour

The owner reported that Dave suggested an hour of gaming, but agreeing did not create a timer and returning to the conversation lost its purpose. The new flow prepares a named timer before asking for agreement. Actual typed input or a live user transcript can confirm that single proposal with “yes”, “okay” or “start it”. Agent speech and tool arguments cannot approve a change. Food, tasks and mixed plans retain their existing review controls.

Confirmation expires after two minutes, a changed subject, cancellation or the end of the conversation. An active or paused timer requires explicit replacement wording or the visible Start timer button. Confirmation is consumed before the asynchronous save. Duplicate transcripts and repeated delivery cannot extend a saved timer. An atomic comparison against the reviewed timer prevents replacing a newer timer from another tab. Saving failures are explicitly passed back as unconfirmed, not treated as success or retried automatically.

The named timer is saved in the existing account data. Conversation startup, return to the foreground and timer-status questions refresh it from an authenticated, timer-only endpoint. The initial context is supplied before the first generated turn, with later updates for running, paused and finished states. User-input handling finishes before a status tool responds. No new transcript/history storage is introduced, and a generic manual timer does not acquire an invented purpose. The text-chat input remains available after confirmation.

## Verification

- All 208 tests, type checking and production build passed, including six new tests covering consent expiry, duplicates, replacement, concurrent writes, named activity persistence, user isolation and bounded input.
- Scoped lint passed without new errors. Private Cloudflare build and deployment dry-run passed; no dependency or database migration was needed.
- Isolated browser testing verified quick-request “okay” creates a real saved one-hour PlayStation timer, navigation away and back retains it, and pause survives reload.
- A deterministic local WebSocket provider exercised the installed ElevenLabs SDK and real app callbacks: prepare proposal, typed agreement, echoed user transcript, timer save before status read, manual pause, fresh connection with initial saved context, and an accurate status response. It used synthetic test data, no provider credentials and no paid generation. This validates the app/protocol path, not the live model's compliance or Android speech recognition.
- Four local endpoint probes rejected anonymous reads/writes, cross-origin writes and invalid timer input, leaving the saved test timer unchanged.
- Mobile-size visual check at 393 × 851 matched the paused PlayStation timer to its status response. The separate QA environment kept owner records intact.

## Live activation is pending

The tracked `config/daywell-agent.json` contains the revised timer instructions and a default `daywell_timer_context` dynamic variable. A read-only check confirmed that the saved live agent still uses the preceding template and `eleven_v4_turbo`. Its existing voice and other configuration should be preserved.

Automatic approval review rejected the attempted live-agent update and proposed QA credential copy, citing the background monitor's no-live-agent-change rule. The rejected command did not run. No live agent, credentials, Access policy or hosted deployment was changed during this session. QA instead used a local synthetic provider.

Next steps after explicit owner approval: update only the live agent's timer instructions and initial-context default; verify all other configuration remains unchanged; publish the verified private build; exercise a small synthetic live text conversation without audio or owner-record changes; then ask the owner to test spoken agreement on Android. Do not copy provider credentials into QA. Keep background sync non-deploying.

The existing private hosted app remains on its earlier deployment until activation. Web timers still cannot guarantee an audible alert with a locked phone or closed app. This is saved activity context, not general memory of prior conversations or proof of store readiness.

Implementation follows ElevenLabs' [dynamic-variable](https://elevenlabs.io/docs/eleven-agents/customization/personalization/dynamic-variables) and [JavaScript SDK](https://elevenlabs.io/docs/eleven-agents/libraries/java-script) interfaces.
