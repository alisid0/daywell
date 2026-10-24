# Daywell promo studio

Daywell's promo films, made in code. Each film is an HTML page in which every frame is a pure function of time
(`seek(t)`). Chrome captures it frame by frame, FFmpeg encodes it, and an ElevenLabs voice, music and sound effects
are mixed under it to -14 LUFS. How to make one, and every lesson learned so far, is in the `promo-video` skill
(`.claude/skills/promo-video/` in this repo, which Claude Code loads automatically here).

## Films

| Folder | Film | Engine |
| --- | --- | --- |
| `.` (this folder) | "One day with Daywell", 120 s, 14 October 2026 ([SCRIPT.md](SCRIPT.md)) | its own `film.js` |
| `shorts/eat`, `shorts/move`, `shorts/relax`, `shorts/sleep`, `shorts/web` | five 120-second shorts, October 2026 | `engine/short.js` |
| `small-things/` | "Small things count", 150 s of thirty 5-second moments, from 24 October 2026 ([SCRIPT.md](small-things/SCRIPT.md)) | `engine/moments.js` |

"Small things count" is built one 5-second moment at a time, at a calm pace, after the owner's note that "the
movements and animations are way too fast". Each moment goes to the owner on its own before the next is built.

## What's in git, and what isn't

In git: the engines and tools, every film's script, plans, timeline, capture plan and data, the screen captures, the
voice lines, music takes and sound effects (paid, so keep them: a new take sounds different and every timing would
need measuring again), the fonts and characters, and a snapshot of the preview harness (`harness/`, with its own
README). Not in git (see `.gitignore` in this folder):

- **Renders, mixes and stills** (`out/`, `audio/mix.wav`), rebuilt by `render.mjs` and `tools/mix.mjs`.
- Voice takes and samples, scratch images, `v1/` (the first draft, superseded) and its music.
- Two of the owner's private review pages from the harness, which stay on the original machine.

## Set up on a new machine

1. Node 24 or later, and Google Chrome.
2. `npm ci` in the repo root (the tools borrow its `sharp`).
3. FFmpeg: `npm i --prefix %TEMP%\claude\ffm ffmpeg-static` (Windows can't start programs from very long paths),
   or set `FFMPEG`, or have `ffmpeg` on the PATH.
4. Only for the paid steps: `ELEVENLABS_API_KEY=…` in the repo's `.dev.vars`, which is git-ignored. Never print or
   commit it. The voice is found by its name ("Alice"), so no voice ID is stored.
5. For new captures, set up the preview harness (`harness/README.md`); rendering doesn't need it.

## Rebuild a film

From this folder (`marketing/promo` in the repo). `--film=` picks the film; leave it out for the October film. Steps marked PAID spend ElevenLabs
credits and need the owner's go-ahead first. Files that exist are kept.

```sh
node tools/credits.mjs                                    # plan and credits left (free)
node tools/capture.mjs --film=small-things                # real screens (start the preview harness first)
node tools/voiceover.mjs --film=small-things - 4,7        # PAID: missing voice lines, or the ones listed
node tools/music.mjs --film=small-things - take3          # PAID: a new music take (never overwrites one)
node tools/sfx.mjs ../../.dev.vars                        # PAID: sound effects in tools/sfx-list.json not made yet
node tools/beats.mjs small-things/audio/music/take2.mp3   # tempo, beats and where sections fall
node tools/bands.mjs small-things/audio/music/take2.mp3   # drums in and out, 5 seconds at a time
node tools/build-data.mjs --film=small-things             # data/film-data.js (word times, shot boxes, beats)
node tools/check.mjs --film=small-things sheet.png 6 5,7.2,8.3,9.9          # stills on a contact sheet
node render.mjs --film=small-things --cues && node tools/mix.mjs --film=small-things  # cues, then the mix
node render.mjs --film=small-things --from=5 --to=10 --name=moment-02       # one moment, for review
node tools/qa.mjs small-things/out/moment-02.mp4          # spec, loudness, glitch scan
```

## The October film: what blocked posting (14 October 2026)

1. **Post only once version 1 ships**, and capture the screens again then. A few small controls in those screens
   are leaving version 1: "Hear this" (spoken readouts), the microphone on "Talk through my meal plan" and "Tap to
   give a command".
2. **The capture sheet's main buttons were invisible in the app** ("Review this photo", "Continue", "Review meals &
   save", "Save food consumed"): `.well-button` used `--well-accent`, defined only inside `.well-space`, while
   dialogs render outside it. The captures show them fixed; the fix has to ship first.
3. **The breakfast photo is a stand-in**, the app's own `public/grain-bowl.jpg` (a salmon and quinoa bowl), so the
   AI result and the by-hand entry both say "Salmon & quinoa bowl". A real photo of your own breakfast would be
   better.
4. **Never call Daywell a dating app.** "A date with yourself" is self-care wordplay. Everyday wellness only.

## Licences

- **ElevenLabs:** voice, music and effects were made on a paid ElevenLabs plan, which allows commercial use.
- **Daywell's own assets:** the characters, the screens, the "Waves on sand" recording and the stand-in food photo.
- **Fonts (SIL Open Font License 1.1):** Atkinson Hyperlegible Next, Bricolage Grotesque (licence in
  `assets/fonts/`), Lexend and OpenDyslexic.
