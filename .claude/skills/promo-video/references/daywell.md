# Daywell: brand, rules and the October 2026 promo

Daywell is a calm everyday-wellbeing app (Move with Bounce, Eat with Nori, Sleep and Relax with Luma, plus
Pip, Tock, Momo and Sunny), designed first for autistic, ADHD and dyslexic people. Public domain: daywell.date.
Repo: github.com/alisid0/daywell (public; keep account IDs and keys out of it).

## Rules that bind every Daywell video

- **"A date with yourself"** is self-care wordplay on the .date domain. Never call Daywell a dating app or site,
  in videos, captions, store text or ads. Store category: Health & Fitness.
- **General wellness only:** no claims about better sleep, weight loss, anxiety, health or treatment.
- **No free trial** (there isn't one). Plans: Daywell £4.99 a month / £39.99 a year (everything by hand);
  Daywell Plus £9.99 a month / £79.99 a year (photos, meal plans from the basket, typed requests, sleep sounds,
  guided sessions, kind words, spoken workout cues). Source: `lib/plans.ts` and `docs/plans.md`.
- **Only show what works on real phones when it's posted.** Not in version 1: live voice, "Talk through my meal
  plan" (microphone), alarms with the app closed. The Plus assistant ("ask in your own words, Daywell does it")
  is promised but not built as of 14 Oct 2026.
- **No pressure:** no streaks, scores or guilt. Helpers' real lines live in `content/companions.json` (`hello`).
- Paid calls (ElevenLabs) need the owner's go-ahead; keys stay in the clone's `.dev.vars`.

## Look

- Palette ("cove"): ground `#fae7ef` / `#f6dbe9`, surface `#fff7fb`, ink `#522d46`, muted `#7d536e`, accent
  `#803c65`, soft `#edd0e2`, line `#d8b7cc`; Plus `#5b3a8c` on `#e8defa`; good `#2f6b4f` on `#dcefe4`; night
  `#2b2142` → `#171328`.
- Type: Atkinson Hyperlegible Next (the app default); Lexend and OpenDyslexic are Reading comfort options
  (5 fonts and 3 text sizes in total, `lib/reading-comfort.ts`).
- Characters: `assets/mascots/<name>.webp` (and layered parts) for Pip (focus, `#F2BD72`), Tock (timers,
  `#C7DCF4`), Momo (groceries, `#D4E2B9`), Luma (sleep, `#D9C9F2`), Nori (food, `#F3C5B5`), Bounce (movement,
  `#F3A6A9`), Sunny (mornings, `#F5DF9E`). The mark is a sun.

## Screens

The scratch clone's Vite preview harness (`daywell/.harness/food`, server `food-harness` on port 5196) renders
the whole app with sample data. URL parameters: `view=today|eat|move|sleep|relax|calendar…`, `page=…`,
`font/size/spacing`, `still`, `account`, `planstate=…`. It mocks the app's APIs; `/api/capture` (photo and plan
AI) needs a mock that returns a realistic result for promo captures. Restart the server between sessions.

## The promo (14 Oct 2026), as a worked example

- Folder: `marketing/promo/` in this repo (`SCRIPT.md`, `README.md`, `index.html`, `film.js`, `render.mjs`,
  `tools/`, `audio/`, `assets/`, `data/`, `harness/`). Renders go to `out/`, which is git-ignored.
- Story: one day, morning to night, made of things a person really does in the app; event cards open into the
  phone (the signature move); sky dawn → night → dawn; the day's events gather into the sun → daywell.date.
- Voice: ElevenLabs Alice (`Xb7hH8MSUJpSbSDYk0k2`), `eleven_v4`, 13 lines, owner-picked from four samples.
- Music: ElevenLabs `music_v2_5`, upbeat promo at 120 BPM (owner's request), 10-chunk plan
  (`tools/music-plan.json`). Measured: drop at 8 s, drum breaks at 38/54/70 s, soft stretch 72–88 s, fade from
  112 s. The scenes were moved to fit: "Daywell" on the 8 s drop, bedtime in the soft section, and the music
  muffled from the word "pause" until the soft section starts.
- Sound effects: 15 ElevenLabs sounds (`tools/sfx-list.json`).
- Cost: small next to a paid ElevenLabs plan's monthly credits. The voice took about 1,200 credits; music and
  effects a few thousand more.
