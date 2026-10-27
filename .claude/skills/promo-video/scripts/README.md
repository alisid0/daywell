# Scripts

Working tools from the Daywell promos (October 2026). They are plain Node (24+) with no install, except `sharp` for
images (any project's `node_modules/sharp`) and FFmpeg (found by `ffmpeg-path.mjs`: the `FFMPEG` variable,
ffmpeg-static at a short path or anywhere Node finds it, then `ffmpeg` on the PATH).

## Layout: one studio, many films

Copy this folder's contents into a `promo/` folder (the studio), next to the product's code or inside it. The
studio shares the engines, tools, fonts, characters and sound effects; every film lives in its own sub-folder and
each tool takes `--film=<folder>`.

```
promo/
  render.mjs                 renders any film
  engine/                    short.js + short.css (chapter films), moments.js + moments.css (films of N-second moments), icons.js
  tools/                     every *.mjs below, plus paths.mjs and sfx-list.json
  assets/fonts, assets/mascots
  audio/sfx/                 the shared effects (made by tools/sfx.mjs)
  <film>/                    film.json, SCRIPT.md, voiceover-lines.mjs, music-plan.json, capture-plan.mjs,
                             timeline.js, index.html, audio/, assets/shots/, data/, out/
```

`tools/paths.mjs` finds the studio, the film (`--film=`, which must hold a `film.json`), the product's checkout (for
`sharp`, the secrets file and real product sounds) and Chrome. Adjust its `repoRoot` detection for a new product. In
the Daywell repo the studio is `marketing/promo/`, with every film's sources, captures and audio (renders and mixes
stay out of git).

## Tools

| Script | What it does |
| --- | --- |
| `credits.mjs` | ElevenLabs plan, credits left and reset date (free call; the key is never printed). Run before and after paid work. |
| `voiceover.mjs` | One ElevenLabs clip per line (`eleven_v4`, timestamps, `previous_text`/`next_text`, fixed seed), each transcribed back and compared. A line with empty `text` is a wordless moment: it keeps its number and gets no clip. The lines name the voice and the tool finds its ID by name (a free call), so no ID is stored. Keeps a 20,000-credit reserve. Redo lines with `… 4,7`. |
| `music.mjs` | Composes from `<film>/music-plan.json` (`music_v2_5`); `… - take2 [seed]`. Never overwrites a take. |
| `beats.mjs` | Tempo, every beat (dynamic-programming tracker on spectral flux), loudness per bar, and how far planned section starts sit from a beat. |
| `bands.mjs` | The music's character in windows (default 5 s): overall, high band (hi-hats, above 6 kHz) and low band (kick and bass, below 150 Hz). Drums dropping out shows here even when overall loudness doesn't move. |
| `sfx.mjs` | Makes the effects in `tools/sfx-list.json` that don't exist yet (0.5 s minimum), then reports length and levels. |
| `capture.mjs` | Drives the real app in headless Chrome at 390×844 @2× through `<film>/capture-plan.mjs`: steps `click`, `type`, `scroll`, `scrollY`, `scrollTo`, `select`, `file`, `eval`, `boxAs`, `boxMaybe`, `tag`, `typeShots`, `tickShots`. Saves screenshots, typing and clock crops, and the box of every control the finger touches. Each group can set a fake clock (`clock`), a `viewport` and a `base` URL, and starts from clean storage. `--explore <query> [steps] [WxH]` lists visible controls (`FULL=1` adds a full-page shot). |
| `build-data.mjs` | Builds `<film>/data/film-data.js`: absolute word times, shot boxes, beat times, image sizes. |
| `render.mjs` | Serves the studio, drives Chrome's `seek(t)`, pipes JPEG frames into FFmpeg (H.264 yuv420p BT.709 limited, AAC 48 kHz, `+faststart`). `--stills=`, `--cues`, `--fps=`, `--from/--to` (with the matching slice of the mix), `--name`. Never overwrites. |
| `mix.mjs` | Sample-exact mix in Node: voice, music ducked per line (and muffled stretches), effects from the film's cues placed by peak or onset, ambience; then two-pass loudnorm and a limiter, with a balance report. Settings in `film.json` `mix`. |
| `qa.mjs` | Checks a delivered MP4: spec, loudness, storyboard, glitch scan, still stretches. |
| `check.mjs`, `sheet.mjs` | Stills plus a contact sheet; a contact sheet from any images. |
| `add-icons.mjs` | Copies Lucide icons (as the app uses) into `engine/icons.js`, following alias files. |

## Engines

- `engine/short.js`: a 120 s chapter film (hook, title, event cards that open into real screens, a recap, a close).
  Used by the Daywell shorts.
- `engine/moments.js`: a film of fixed-length moments, used by "Small things count" (150 s, thirty 5-second
  moments). Built in: a hook (to-do stickers drifting into a pile), a turn (the brand sun, the name, the helpers),
  a stamp that ends each moment, a Plus tag, the closing page of stamps and the end card. The script API adds
  `flip()` (play real captured frames as a flipbook that slows like a flicked wheel, with a click per row;
  `eased: true` for frames captured on the ease-out), `drag()` (a finger that travels while pressed), `layer()`
  (custom drawing on the phone screen) and the usual `S`, `tap`, `hl`, `typing`, `bubble`, `cue`, `camTo`,
  `camFull`, `word`. The camera defaults to a calm spring (`w` 3).

Both are pure functions of time and export `window.cues` for the mix.

## Examples

- `example/`: the October 2026 Daywell promo (one day, event cards): its own `film.js` engine, capture plan,
  voiceover lines, music plan and effects list. Read `film.js` for how every piece is a pure function of time.
- `example-moments/`: "Small things count" (October 2026): `SCRIPT.md`, `film.json`, `voiceover-lines.mjs`
  (with a wordless moment), `music-plan.json` (take 2, which loosens context adherence for the quiet sections),
  `capture-plan.mjs` (frame-by-frame wheel spins, `data-promo` marking) and `timeline.js`. In the timeline, the
  hook was slowed after the owner's pace feedback; moments 3–6 are the first, too-fast cut, kept to show the API.
  Rebuild them at the calm pace (`references/motion.md`) before reusing any.
