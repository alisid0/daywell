# Daywell promo v2

A 120-second vertical promo (1080×1920, 60 fps) for TikTok, Instagram Reels and YouTube Shorts: one day with Daywell,
from morning to night, made of things people really do in the app. The script is in [SCRIPT.md](SCRIPT.md). The
skill that made it is in `.claude/skills/promo-video/` at the repo root, so Claude Code picks it up in this repo on
any machine.

- **Picture:** `index.html` + `film.js`. Every frame is a pure function of time (`seek(t)`).
- **Screens:** real Daywell screens captured from the local preview with a sample week (`?promo=1`), at phone size,
  with every tapped button's position recorded (`assets/shots/`, `shots.json`).
- **Voice:** ElevenLabs Alice, `eleven_v4`, 13 lines (`audio/vo/`), each checked by transcribing it back.
- **Music:** ElevenLabs Music, upbeat at 120 BPM, composed to the scene plan (`audio/music/take1.mp3`); the film
  follows its measured beats and sections.
- **Sound effects:** 15 ElevenLabs effects (`audio/sfx/`), placed from the film's own cue list. Under the night
  scene is Daywell's real "Waves on sand".
- **Mix:** `audio/mix.wav`, mastered to -14 LUFS with a true peak of -1.4 dBTP.

## Rebuild

Everything needed is in git: the screen captures, voice lines, music take and sound effects. The render, mix and
captions files are not, because each is rebuilt with one command.

**Setup:**
1. Run `npm run install:ci` at the repo root. The tools use the app's `sharp`.
2. Install Google Chrome. Set `CHROME=/path/to/chrome` if it's not in the usual place.
3. Get FFmpeg: `npm i -g ffmpeg-static`, or any `ffmpeg` on the PATH, or set `FFMPEG=/path/to/ffmpeg`. On the owner's
   Windows machine it's at a short path (`%TEMP%\claude\ffm`), because Windows there can't start programs from very
   long paths.

**To get the video back, from `marketing/promo`:**

```sh
node render.mjs --cues && node tools/mix.mjs           # the mixed, mastered soundtrack → audio/mix.wav
node render.mjs                            # the film → out/daywell-promo-v2.mp4 (or -b, -c … if it exists)
node tools/qa.mjs out/daywell-promo-v2.mp4 out/storyboard.png
node tools/srt.mjs out/daywell-promo-v2.srt            # captions file
```

**To change it:**
- Edit the timeline in `film.js`.
- Check stills: `node tools/check.mjs out/sheet.png 6 12,19.5,30,47`.
- Rebuild the data after new captures or audio: `node tools/build-data.mjs`.

**Paid steps (ElevenLabs credits, using the repo's git-ignored `.dev.vars`; files that already exist are kept):**

```sh
node tools/voiceover.mjs 4,7               # remake voice lines 4 and 7 (all missing lines if no numbers)
node tools/music.mjs - take2               # a new music take (never overwrites); then:
node tools/beats.mjs audio/music/take2.mp3 0,7,12,18   # its beats and sections
node tools/sfx.mjs                         # any missing sound effects in tools/sfx-list.json
```

**New screens:** set up the preview harness (`harness/README.md`), then `node tools/capture.mjs [group]`.

The full render takes about 11 minutes at 60 fps on the owner's Windows machine.

## The shorts (October 2026)

Five more 2-minute films made with the same tools: Eat, Move, Sleep, Relax and the web app. Their scripts, line
changes and what blocks posting are in [../shorts/SCRIPTS.md](../shorts/SCRIPTS.md).

- **One engine, five timelines.** `engine/short.js` (with `short.css` and `icons.js`) builds what the series shares:
  the hook's thought chips, the title, the event cards with their plan badge, the recap and the close. It gives
  each film's `timeline.js` its tools:
  - screens (`S`), and taps on captured (`tap`) or drawn (`tapAt`) controls;
  - highlights, typing and ticking crops, and bubbles;
  - drawings on the phone screen (`layer`) and around it (`worldArt`, `camWorld`);
  - the camera.

  When the camera holds for over 2.6 s, it pushes in slowly, so a held screen never sits frozen.
- **One folder per film,** `shorts/<film>/`, holds:
  - `film.json`: the name, length, music take and mix settings;
  - `voiceover-lines.mjs`, `music-plan.json`, `capture-plan.mjs` and `timeline.js`;
  - `index.html`, and the film's assets, audio and data.

  The sound effects are shared (`audio/sfx/`).
- **Every tool takes `--film=shorts/<film>`.** Without it, the tools work on the promo as before.

To get a film back, from `marketing/promo` (Eat shown):

```sh
node render.mjs --film=shorts/eat --cues && node tools/mix.mjs --film=shorts/eat
node render.mjs --film=shorts/eat          # → shorts/eat/out/daywell-short-eat.mp4
node tools/qa.mjs shorts/eat/out/daywell-short-eat.mp4
node tools/srt.mjs --film=shorts/eat
```

Renders can run side by side. Give each one its own `RENDER_SLOT` number, which picks its ports and Chrome
profile: for example `RENDER_SLOT=2 node render.mjs --film=shorts/move`. A render takes 10–20 minutes, depending on
what else is running.

**Screens:**
- The four area films show the approved October design. They were captured from a second copy of the harness that
  runs a checkout of `design/areas-ui` on port 5194 (see `harness/README.md`):
  `HARNESS=http://localhost:5194/ node tools/capture.mjs --film=shorts/eat`.
- The web film's capture plan names a harness per group (`base`): sign-in and the plan screen come from 5196,
  Today and the laptop view from 5194.
- A group can also set its own `viewport`. The laptop view is 1280×800.

**Mix settings in `film.json`:**
- `voiceDb`, `musicDb` and `duckDb`;
- per-line `lines` adjustments;
- a `muffle` stretch;
- `ambience` beds: a repo path, or `film:` plus a path inside the film's folder;
- extra `duck` windows;
- `musicFadeOut`;
- `ceilingDb`, the limiter's ceiling. The shorts use -2.5, because AAC encoding lifts sharp peaks; their MP4s
  measure -1.6 to -2.2 dBTP. The render encodes AAC at 256 kbps.

## What's real, and what blocks posting

Everything shown works in today's app (main, the plans branch or the private test), with sample data. Before posting:

1. **Post only once version 1 ships**, and re-capture the screens then (`node tools/capture.mjs`). A few small
   controls in today's screens are leaving version 1:
   - "Hear this" (spoken readouts);
   - the microphone on "Talk through my meal plan";
   - "Tap to give a command".
2. **The capture sheet's main buttons are invisible in the app today** ("Review this photo", "Continue",
   "Review meals & save", "Save food consumed"). `.well-button` uses `--well-accent`, which is only defined inside
   `.well-space`, and dialogs render outside it. The captures show them fixed. The fix needs to ship first.
3. **The breakfast photo is a stand-in.** It's the app's own `public/grain-bowl.jpg` (a salmon and quinoa bowl),
   so the AI result and the by-hand entry say "Salmon & quinoa bowl". A real photo of your own breakfast would be
   better. To use one:
   1. Set `PROMO_PHOTO=/path/to/photo.jpg`.
   2. Change the canned result (`cannedPhoto`) in the harness `main.jsx`.
   3. Re-capture the `s4-eat` group.
   4. Rebuild the data and re-render.
4. **Never call Daywell a dating app.** "A date with yourself" is self-care wordplay. Everyday wellness only.

## Licences

- **ElevenLabs:** voice, music and effects were made on the owner's paid Creator plan, which allows commercial use.
- **Daywell's own assets:** the mascots, screens, the "Waves on sand" recording and the stand-in food photo.
- **Fonts (SIL Open Font License):** Atkinson Hyperlegible Next, Lexend and OpenDyslexic.

## Versions

- **v1** (13–14 Oct): the first film, with Daywell's pan-flute sleep sound as music and no voice. It is superseded
  and not kept in git.
- **v2** (14 Oct): this one. Render it to `out/daywell-promo-v2.mp4`.
