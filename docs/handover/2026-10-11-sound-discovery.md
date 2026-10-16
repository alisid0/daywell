# Sound discovery — 11 October 2026

Branch: `codex/sound-discovery`, based on `f8ee12e` on GitHub main. The PR head is the published checkpoint.

## Change

- Sleep shows the existing 11-sound player directly, alongside its wind-down entry. Relax keeps the same sounds.
- “Sing me a song” and lullaby requests offer an honest alternative with an Open music and sounds button. Explicit sound requests can open the player; opening never starts playback or saves a timer. Music opens with Pan flute selected; sleep requests choose Sleep.
- The live agent template knows the sound library and uses the existing client tool. Provider voice, model and privacy configuration are unchanged by this source change.
- Audio ownership now stops other Daywell audio when a loop starts, and cancels a pending loop load when another recording/conversation starts.

## Verification

- `npm run check`: typecheck, all 218 tests and production build pass.
- `npm run lint:changed`: no new errors in changed files.
- Isolated browser preview and test database: direct Sleep player, Pan flute Play/Pause, song suggestion → Relax with no autoplay, direct Open sleep sounds → focused Sleep player. 390 × 844 viewport tested with Standard and Larger text; no horizontal overflow and no browser console errors.
- Unit coverage includes singing/lullaby variants, sound navigation, local routing, negative/compound requests, unrelated tasks, and wellness boundary precedence.

## Release and remaining verification

Private deployment and the narrowly scoped live-agent prompt update are recorded in the PR once applied. A source push alone does not update either service. No new audio was generated; no dependency or database migration is needed. Physical iPhone speaker output and locked-screen playback have not been verified by this desktop test.

The existing JEV connection is separate from sound navigation. Do not claim this change enables it or routes every continuous live-conversation turn through the picker. Shared recordings still require authored, reviewed content; private conversations are never automatically added to the library.

The temporary QA database, screenshots, provider backups and test logs remain ignored under `work/`; real saved data and credentials are untouched. The owner preview stays at localhost:5190.
