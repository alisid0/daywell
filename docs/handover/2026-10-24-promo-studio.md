# Handover: the promo studio on GitHub, and "Small things count" moments 1–2 (24 October 2026)

```text
Session date: 24 October 2026
Branch and PR: marketing/promo-v2, PR #60 (https://github.com/alisid0/daywell/pull/60), with main 46eab3e merged in.
  Not merged into main. Nothing here changes the deployed app: the private app still runs main 46eab3e.
What changed:
  - marketing/promo/small-things/: the new film "Small things count" (150 s, thirty 5-second moments). The approved
    script (SCRIPT.md), the voice lines (Alice, eleven_v4) with word timings, music takes 1 and 2 (take 2 is used:
    95.7 BPM, with looser context adherence for dusk and night), the capture plan and captures, the timeline, the
    film data and the sound cues.
  - marketing/promo/engine/moments.js and moments.css: the engine for films of moments, made calm after the owner's
    note "The movements and animations are way too fast". The camera spring is w 3 (was 5.4). flip() now slows a
    spinning wheel to its stop (it used to speed up and stop dead), with eased frame capture as an option. The hook's
    to-dos drift down and settle. The turn does one thing at a time: the sun arrives, "Daywell" settles in on its
    word, the helpers rise in together, then the card holds.
  - marketing/promo/tools: new or updated credits.mjs, bands.mjs, add-icons.mjs, ui-audit.mjs, ui-collector.js,
    mix.mjs and build-data.mjs. voiceover.mjs finds the voice by its name, so no voice ID is stored in any film.
    ffmpeg-path.mjs no longer contains a machine path.
  - marketing/promo/README.md: rewritten for the whole studio (the films, setting up a new machine, the rebuild
    commands, what is in git and what isn't).
  - marketing/promo/harness: the preview harness snapshot, updated from the copy that runs on main (port 5194): the
    time picker, sticker look, design fix, calories and notification previews, and a css.js that includes
    time-wheels.css. Two private review pages stay out.
  - .claude/skills/promo-video: the whole promo-video skill (instructions, references, tools, both engines and two
    worked examples), with this film's lessons: calm pace, films made of short moments, one moment per review and
    separate clips. Claude Code loads it automatically in this repo.
  - Account and credit figures are gone from the film scripts and the skill.
  - eslint.config.mjs ignores marketing/** and .claude/** (video tools, not app code). app/globals.css keeps both
    folders out of Tailwind's class scanning: without that, the app's CSS grew by about 1.8 KB of stray utilities;
    with it, the CSS is byte-identical to main's.
Checks performed and their results:
  - npm run lint:changed -- origin/main: no new lint errors (58 changed files checked).
  - npm run typecheck: passed. npm test: 334 passed, 0 failed. npm run build: passed, and the built CSS matches a
    build of main byte for byte (index.CC3jmCgb.css, 540,879 bytes).
  - Moment 2's review clip: 5.00 s, 1080 x 1920, 60 fps, H.264 yuv420p BT.709, AAC 48 kHz, -13.3 LUFS for the slice
    (the full mix masters at -14.1 LUFS with a true peak of -1.4 dBTP); no jumps, flashes or frozen stretches.
  - Everything staged was scanned for keys, account IDs, email addresses (only the sample sam@example.com), machine
    paths and credit figures: clean.
What is not yet verified:
  - GitHub's checks on the new head.
  - The voice lookup by name was tested with a free, read-only call (one match, the same voice as before). No paid
    call has used it yet.
  - Moments 3–30 aren't built. Moments 3–6 in timeline.js are the first, too-fast cut, kept to show the API.
Remaining work / next step:
  - The owner approved moment 1. Moment 2 (the calm turn) went to the owner for review.
  - Then moment 3 onwards, one moment per review, at the calm pace (.claude/skills/promo-video/references/motion.md,
    "Calm pace"). Recapture the wheel spins with eased frames, about 24 per second of spin.
  - Before exporting separate clips, settle how stamps cross moment boundaries: each stamp tucks away during the
    first 0.5 s of the next moment. The plan is to render the clips one by one with the neighbouring stamps hidden.
  - Posting waits for the store launch and subscriptions. The plan screen (feat/plans) isn't merged, so prices
    appear as text only.
Setup or migration steps needed on the other machine:
  - Fetch and check out marketing/promo-v2. Then follow marketing/promo/README.md: Node 24 or later, Chrome, npm ci in
    the repo root, FFmpeg (ffmpeg-static at a short path on Windows), and ELEVENLABS_API_KEY in .dev.vars only for
    paid steps. For new captures, copy marketing/promo/harness/food to .harness/food and start it (harness/README.md).
Any work still local, and why:
  - Renders, mixes and stills (the out/ folders, audio/mix.wav): build output, rebuilt by render.mjs and mix.mjs.
  - Two of the owner's private review pages in the harness (launch costs; plans and chat) stay on the original machine.
```
