# Customer-facing language

Session date: 10 October 2026.
Branch: `codex/private-tester-build`, [PR #36](https://github.com/alisid0/daywell/pull/36), left unmerged.

## What changed

The owner found that the app described its implementation instead of speaking to customers. Food review buttons now say “Hear this”, “Start speaking” and “Review this photo”. Chat uses “Start chat” and explains the conversation without model names or recorded-versus-generated routing narration. Welcome, meal suggestions, listening pages and movement instructions follow the same approach. The customer response library no longer offers a development-script download or production inventory counts.

Provider, sharing and retention information remains available before an action in a native, keyboard-accessible “Privacy & details” disclosure. AI identity, approximate nutrition, recording duration, save confirmations, conversation consent, daily limits and honest unavailable states remain. Customer errors give a useful next step rather than API-key, permission or agent-setup instructions; the separate owner setup screen remains available. The product-area guide now records this language rule and the owner's subsequent decision to connect food AI.

This changes presentation only: no routing, model, voice, provider configuration, credentials, data storage, Access policy, limits or confirmation rules were changed. Quick-command and workout readouts still use the device voice, as disclosed; food narration and live conversations retain their existing ElevenLabs integration.

## Validation

- Type checking, all 202 existing tests and the production build passed.
- Scoped lint passed with no new errors.
- Isolated browser checks verified the food dialog's shorter controls, keyboard expansion of the sharing notice and the unavailable-conversation settings without setup instructions. No owner records were created or changed, and no paid generation was needed for these copy checks.
- Private Cloudflare build and dry-run passed, including the existing Worker, database and Access binding checks.
- GitHub's complete Check Daywell run [38008972534](https://github.com/alisid0/daywell/actions/runs/38008972534) passed for application source `1c17cf96ed51619400943ce8b0dee11a19892b79`.

## Remaining verification and setup

Physical Android microphone, camera and speaker behaviour should continue through the owner's phone testing. This copy pass does not claim new recognition accuracy, background timer support or store readiness. No installation, migration or secret change is required. Source updates alone do not deploy the hosted phone app.

## Private deployment and readback

- Application source `1c17cf96ed51619400943ce8b0dee11a19892b79` was deployed at 00:27:30 UTC on 10 October. Cloudflare version `fa8ccd32-0fdb-4bb6-9fa6-c7c215cd7f97` was read back serving 100% of traffic on the existing private app.
- The hosted food dialog was verified at a 393 × 851 responsive viewport. The initial screen shows the simple photo/voice actions; expanding Privacy & details reveals the providers, sharing, retention links and readout limits. The chat consent was also checked before connecting, including keyboard access to its timer-context and provider notice.
- Sixteen anonymous and forged-sign-in probes all remained protected. No owner entries were saved, no live conversation was started and no paid generation was used during this wording pass.
- The temporary isolated QA server was stopped. The normal local preview and private hosted app remain available. The final handover-only commit does not change deployed application code.
