# General-wellness boundary — 8 October 2026

Branch: `codex/connected-food-recovery`, [PR #32](https://github.com/alisid0/daywell/pull/32). The current PR head is the published checkpoint. GitHub `main` at `e93face` was merged into this branch without conflicts before this change; PR #17 audio is now included here.

## Owner decision and changes

Daywell offers everyday relaxation, unwinding after travel/work, food organisation, comfortable movement and bedtime routines. It must not provide medical or clinical advice, mental-health treatment/improvement claims, medicines, sleeping pills, supplements or alcohol recommendations. Claimed age, parental permission and role-play do not relax these boundaries. The shared [scope](../general-wellness-scope.md) is linked from AGENTS.md and the mobile release plan so both machines follow it.

- Added a shared policy to the capture API and ElevenLabs agent template. Explicit out-of-scope local commands, live text and recognised voice transcripts return a short boundary; matching requests clear pending host proposals and stop the live conversation. Explicit danger gets concise local-emergency signposting, without diagnosis or procedures.
- Removed 83 medical/clinical/crisis examples from the runtime library, download, generation inputs, public MP3s and manifest. Historical scripts and recordings remain under `archive/medical-audio/`, outside static serving. All surviving IDs and audio are unchanged: 1,417 published replies (500 original + 917 examples), plus the existing 18 guided tracks. No new recordings were generated.
- Updated the existing live ElevenLabs agent's prompt and read it back. Voice (`eleven_v4_turbo`), AI model, tools, workflow and privacy settings were verified unchanged. This was an explicitly scoped active-session update, not a background sync action. Private before/after snapshots remain ignored.

## Verification

- `npm run check` passed type checking, all 126 tests and the production build; changed-file lint passed without new errors. After narrowing a false-positive phrase in the boundary matcher, the five dedicated wellness tests passed again.
- Regression cases cover medical requests combined with app actions, claimed minor age, parental permission, role-play, direct danger, ordinary requests, and preserving benign phrases such as treating a friend to dinner.
- All 83 retired files are absent from `public/`, search, downloads and the built static asset folder. The built folder contains exactly 1,417 published reply MP3s. Archived file byte sizes match their historical manifest.
- Five short synthetic provider conversations used text-only mode: ordinary post-commute unwinding worked; sleeping-pill advice, alcohol despite minor/parental-permission framing, and a role-play depression treatment request were declined; inability to stay safe received brief emergency signposting. None of the four out-of-scope cases invoked an app tool. The ordinary unwind request proposed a rest action; the test did not execute it. No microphone, personal records or generated audio were used.
- Browser verification on port 5190: consent describes everyday scope; an everyday-command sleeping-pill request shows the fixed referral and no action proposal; a subsequent Hello receives the normal greeting. The response browser shows 917 examples, a 1,417-script download, and no results for the retired sleep-medication topic. Restarted only the verified stalled port-5190 preview after the source update; existing QA records and completed activity remained present.

## Limits / next step

These are specific regression and provider checks, not proof that every phrasing, transcript or model response is safe. The local matcher is deliberately bounded, not a symptom checker. Microphone audio reaches the provider before its transcript reaches the app; real speech timing and interruption remain unverified. Wider adversarial testing and editorial listening remain required before public release. This policy does not establish suitability for children or age verification.

The separate OpenAI photo/capture service still has no local key, so its updated instructions have not been tested against live OpenAI. The app has not been deployed, merged to GitHub main or certified on physical phones. The Cloudflare permission decision remains unchanged. Historical hosted/cached versions require their own update; repository source changes do not revoke an old download.

On the other machine, fetch this PR branch and follow the repository checks. No new dependency or database migration is required. Existing provider credentials remain in ignored local files; the same configured agent has the new prompt, while any other agent must be updated and verified separately. Do not restore retired recordings to public assets. Source and archive changes belong on GitHub; ignored provider snapshots, preview logs and synthetic test outputs stay local.
