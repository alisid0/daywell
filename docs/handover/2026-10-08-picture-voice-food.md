# Picture-first food and a training partner

Session: 8 October 2026. Branch `codex/connected-food-recovery`, PR #32. This checkpoint follows `f1e270d`; use the current PR head for the published revision.

## Changed

- Eat starts with camera and voice actions, with Meal or drink / Food basket / Shopping list destinations and a secondary manual option.
- Mounted the previously unused capture flow and removed its competing host listener. Added a mobile camera hint, existing-photo picker, resized previews, bounded recording, clarification/correction and explicit review. Capture resources are stopped on close, unmount and hiding; stale results cannot reopen another capture.
- Meal drafts retain unknown nutrition, require consumption/portion confirmation and never deduct inventory. Sugar is only proposed from supplied amounts or readable labels with a known portion. Pictures are not safety/allergen checks.
- Basket captures propose new stock, use the existing review/recovery/retry flow and support undo. Duplicate IDs cannot overwrite existing stock. Shopping captures create unchecked notes.
- Move leads with four routines and an optional expanded list. Routine guidance can be spoken using the device voice. Tap-to-talk commands have a bounded vocabulary; unknown or negated speech changes nothing. Skipping does not count as completion, and ending a partial routine does not claim the whole routine is complete. Completed sets are prefilled for review before saving.
- Recorded this product direction in AGENTS.md and docs/picture-and-voice-workflow.md for both machines.

## Validation

- `npm run check`: TypeScript, 148 tests and production build passed.
- Scoped lint gate: no additional errors; the existing capture file still has image/ref advisory warnings.
- Added tests for capture destinations, unknown nutrition/sugar, disabled tools, schema consistency, workout speech, atomic stock capture, retry, undo and recovery.
- Browser preview at localhost:5190: selected a repository sample photo, verified preview and retained image on unavailable-AI error; checked voice refusal before recording without a connection, basket destination, and phone-width capture controls.
- Exercised routine start, timer start/pause, completed and skipped steps, early end and prefilled review. Closed without saving sample activity. Restored normal viewport. No personal entries, credentials or database files were committed.

## Still unverified / next steps

- OPENAI_API_KEY is absent locally. Real photo recognition, audio transcription and corrections require that connection and testing with actual portions, labels and accented speech. This checkpoint does not claim a working live AI capture session.
- Browser microphone recognition/device audio and actual Android/iPhone camera permission flows require physical-device testing. Automated tests cover the command parser; browser testing covered button equivalents without recording the owner's microphone.
- ElevenLabs live conversation is separate from device routine guidance. Expressive coaching driven by routine state is not part of this checkpoint; no live agent was changed and no audio was purchased/generated.
- Multi-day planning retains its existing review forms. The primary capture flow is the first step toward the broader minimal-typing direction; it does not turn every food workflow into a voice agent.

## Other machine

No dependency changes or database migrations. Fetch this feature branch, use existing local credentials, then run the normal checks/preview. Private hosted deployment and GitHub main are unchanged. Local screenshots/logs stay in ignored work/.
