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
