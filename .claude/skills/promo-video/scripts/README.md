# Scripts

The tools live with the Daywell promo in `marketing/promo/` (repo root), so there's one copy to keep up to date.
For a new film, copy that folder, keep `tools/`, `render.mjs` and the engine parts of `film.js`, and replace the
timeline, the screens and the audio. `tools/paths.mjs` finds the repo, `sharp`, Chrome, FFmpeg and `.dev.vars` on
Windows, Mac or Linux.

| Tool | What it does |
| --- | --- |
| `tools/capture.mjs` + `capture-plan.mjs` | Drives the real app in headless Chrome at 390×844 @2× through a plan of steps (click, type, scroll, select, file, tag, `typeShots`, `tickShots`). It saves screenshots, typing and clock crops, and the box of every control the finger touches. Each group can have a fake clock (`clock`, `__advance(ms)`) and starts from clean storage. `--explore <query> [steps]` lists visible controls. |
| `tools/voiceover.mjs` + `voiceover-lines.mjs` | Makes one ElevenLabs clip per line (`eleven_v4`, with timestamps, previous and next text, fixed seed), transcribes each clip back and reports mismatches. It checks the plan and keeps a 20,000-credit reserve. |
| `tools/music.mjs` + `music-plan.json` | Composes from a composition plan (`music_v2_5`) and never overwrites a take. |
| `tools/sfx.mjs` + `sfx-list.json` | Makes any missing sound effects, then reports their length and levels. |
| `tools/beats.mjs` | Gives tempo, beats (a dynamic-programming tracker on spectral flux), loudness per 2-second bar, and the offsets of planned section starts. |
| `tools/build-data.mjs` | Builds `data/film-data.js`: absolute voice word times, shot boxes, beat times and image sizes. |
| `tools/mix.mjs` | Mixes in Node: voice, music with a per-line ducking envelope and a muffled stretch, and effects from the film's cues placed by peak or onset. It masters with two-pass loudnorm and a limiter, and prints a balance report. |
| `render.mjs` | Renders with Chrome's `seek(t)` into FFmpeg (H.264 yuv420p BT.709 limited range, AAC, `+faststart`). Flags: `--stills=`, `--cues`, `--fps=`, `--from/--to`, `--name`. It never overwrites. |
| `tools/check.mjs` / `sheet.mjs` | Stills and a contact sheet. |
| `tools/qa.mjs` | Checks the delivered MP4: spec, loudness, a storyboard, a glitch scan and still stretches. |
| `tools/srt.mjs` | Makes a captions file from the voice word timings. |

The engine in `film.js` is the reference for every technique in `references/motion.md`:
- springs and tracks, with camera keyframes sorted before use;
- the event card that morphs into the phone;
- screen swaps (blur, true scroll, sequential slide), and typing and clock crops;
- the finger with press, ripple and highlight;
- the camera, with a caption band;
- sky by time of day;
- captions from word timings;
- bubbles, the ending, and the cue export.

## A series of films (the Daywell shorts, October 2026)

For several films in one format, don't copy the folder: put each film in `shorts/<film>/` and share the engine.

- **Every tool takes `--film=shorts/<film>`.** The film's `film.json` holds its name, length, music take and mix
  settings. Its own `voiceover-lines.mjs`, `music-plan.json`, `capture-plan.mjs` and `timeline.js` sit beside it.
  Sound effects stay shared.
- **`engine/short.js`** builds the shared sections from a `Short({ … })` call:
  - hook chips, title, chapter cards with a plan badge (or the film's own `badge`), the recap (rows or `areas`) and
    the close;
  - `script(api)` for each chapter's moments: `S`, `tap`, `tapAt` (drawn controls, in app CSS px), `hl`, `typing`,
    `ticks`, `bubble`, `cue`, `camTo`, `camFull`, `camWorld`, `layer` (drawn HTML on the phone screen), `worldArt`;
  - `draw(t)` for anything the film animates itself.
- **The capture plan** can give each group its own `base` (another harness), `viewport` (a laptop view, say) and
  `clock`. It also has an `eval` step for in-page script and a `helpers` step to reload the helpers after the page
  reloads itself. `HARNESS=…` changes the default harness; `CLOCK=…` and `FULL=1` help `--explore`.
- **`RENDER_SLOT=n`** gives a render its own ports and Chrome profile, so several renders and stills can run at
  once.
- **`tools/qa.mjs`** compares each frame with the one half a second earlier to find frozen stretches, so slow drifts
  count as movement.
