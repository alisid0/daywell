# Daywell: brand, rules and the October 2026 films

Daywell is a calm everyday-wellbeing app (Move with Bounce, Eat with Nori, Sleep and Relax with Luma, plus
Pip, Tock, Momo and Sunny), designed first for autistic, ADHD and dyslexic people. Public domain: daywell.date.
Repo: github.com/alisid0/daywell (public; keep account IDs, keys, testers' details and cost figures out of it).

## Rules that bind every Daywell video

- **"A date with yourself"** is self-care wordplay on the .date domain. Never call Daywell a dating app or site,
  in videos, captions, store text or ads. Store category: Health & Fitness.
- **General wellness only:** no claims about better sleep, weight loss, anxiety, health or treatment. "Drift off
  to waves on sand" describes the sound, not a promise about sleep.
- **No free trial** (there isn't one). Plans: Daywell £4.99 a month / £39.99 a year (everything by hand);
  Daywell Plus £9.99 a month / £79.99 a year (photos, meal plans from the basket, typed requests, sleep sounds,
  guided sessions, kind words, spoken workout cues). Source: `lib/plans.ts`, `docs/plans.md`,
  `docs/store-launch.md`. The plan screen (`feat/plans`) isn't merged as of 24 Oct 2026, so prices appear as text
  only ("From £4.99 a month"), never as a captured screen.
- **Only show what works on real phones when it's posted.** Not in version 1: live voice, "Talk through my meal
  plan" (microphone), alarms with the app closed, reminders and notifications. The Plus assistant works typed in
  the private test app as of 24 Oct 2026 ("Here's the plan", Do this; `app/assistant.tsx`), so show it typed.
  Subscriptions aren't built yet, so a finished film waits for the store launch before posting.
- **No pressure:** no streaks, scores, counters or progress bars, not even in a film's own graphics. Calorie
  tracking is off unless the person turns it on (`calorieTracking: false`); never show deficits or calories
  burned. Helpers' real lines live in `content/companions.json` (`hello`).
- **Customisable stays customisable:** looks, fonts and palettes are the person's choice. Show the defaults, and
  show that they can be changed, never that they're fixed.
- Paid calls (ElevenLabs) need the owner's go-ahead; keys stay in the clone's `.dev.vars`.

## Look

- **The sticker personality** (the app's default look since late October 2026, used in "Small things count"):
  ink outlines `#2b1424` and hard offset shadows, paper `#fff7fb`, ink `#3a1f33`, muted `#7d536e`, on the pink
  speckle ground `#fae7ef`. One accent, forest `#2f7a55` (the finger's tap ripple and the stamps). Fill colours:
  peach `#ffc7a6`, mint `#a9dfd4`, lilac `#ddd2f7`, butter `#fde7a8`. Captions and the wordmark in Bricolage
  Grotesque 800 (OFL; `promo/assets/fonts/bricolage.ttf`, licence beside it); the app's text in Atkinson.
- **The "cove" palette** (the 14 October film): ground `#fae7ef` / `#f6dbe9`, surface `#fff7fb`, ink `#522d46`,
  muted `#7d536e`, accent `#803c65`, soft `#edd0e2`, line `#d8b7cc`; Plus `#5b3a8c` on `#e8defa`; good `#2f6b4f`
  on `#dcefe4`; night `#2b2142` → `#171328`.
- **Choices people have:** 5 palettes (Berry, Sage, Butter, Dusk, Lake; `lib/appearance.ts`), 5 fonts and 3 text
  sizes (`lib/reading-comfort.ts`; Atkinson Hyperlegible Next by default, with Lexend and OpenDyslexic).
- **Characters:** `assets/mascots/<name>.webp` (and layered parts) for Pip (focus, `#F2BD72`), Tock (timers,
  `#C7DCF4`), Momo (groceries, `#D4E2B9`), Luma (sleep, `#D9C9F2`), Nori (food, `#F3C5B5`), Bounce (movement,
  `#F3A6A9`), Sunny (mornings, `#F5DF9E`). The trio of Luma, Nori and Bounce leads the films; the others appear
  in their own moments. The helpers don't speak in the app, so their lines appear as text bubbles. The mark is a
  sun.

## Screens

Capture from the preview harness. Its source is in the repo at `marketing/promo/harness/food` (with a README): copy
it to `.harness/food` (git-ignored) in a checkout of main and start it on port 5194 (`vite.fix.config.mjs`; the
desktop app's server `fix-harness`). It renders the whole app with sample data and mocks the app's APIs.
`/api/capture` (photo and plan AI) needs a mock that returns a realistic result for promo captures.

- URL parameters: `view=today|eat|move|sleep|relax|calendar|focus|clock…`, `page=…`, `font/size/spacing`,
  `still`, `nopatch`, `account`, `planstate=…`. Each capture group sets the story's clock (`clock`).
- The harness imports CSS from its own list (`css.js`): add every new stylesheet there, or controls capture
  unstyled.
- The desktop app stops it between turns: start it (preview_start, `fix-harness`) before each capture run.

## Worked example 1: the promo of 14 Oct 2026

- Folder: `marketing/promo/` in the repo (`SCRIPT.md`, `index.html`, `film.js`, `tools/`, `audio/`, `assets/`); copy
  in `scripts/example/`.
- Story: one day, morning to night, made of things a person really does in the app; event cards open into the
  phone (the signature move); sky dawn → night → dawn; the day's events gather into the sun → daywell.date.
- Voice: ElevenLabs Alice (looked up by name), `eleven_v4`, 13 lines, owner-picked from four samples.
- Music: ElevenLabs `music_v2_5`, upbeat promo at 120 BPM (owner's request), 10-chunk plan. Measured: drop at 8 s,
  drum breaks at 38/54/70 s, soft stretch 72–88 s, fade from 112 s. The scenes were moved to fit: "Daywell" on the
  8 s drop, bedtime in the soft section, and the music muffled from the word "pause" until the soft section starts.
- Sound effects: 15 ElevenLabs sounds (`sfx-list.json`).

## Worked example 2: "Small things count", 24 Oct 2026

- Brief: "a 2.5 minute promo for the app… 5 seconds at a time and do a compilation", plus each moment as its own
  clip. Folder: `marketing/promo/small-things/` in the repo's studio; copy in `scripts/example-moments/`.
- Claim: small things count (close to Bounce's real "A stretch counts" and the app's "rest days count too"). The
  killed direction, "Five seconds flat", promised a time some moments can't keep.
- Shape: 30 moments of 5 s across a day, dawn to night to dawn. Each ends with a sticker stamp beside the phone
  (Noted, Planned, Saved…); at the end the stamps gather into a page that folds into the sun, then "Make a date
  with yourself.", daywell.date and "From £4.99 a month".
- Voice: Alice again, `eleven_v4`, seed 2410, 29 lines and one wordless moment (26, the waves and Luma's bubble).
- Music: `music_v2_5`, planned at 96 BPM (5 s = two bars), 8 chunks. Take 1 (adherence "high" throughout) kept
  one groove; take 2 (high, then medium, low for the breakdown and night, medium for the outro) measured 95.7 BPM,
  drums out 105–125 s, very quiet 125–130 s, moments within 25 ms of a beat until 130 s.
- Sound: the October effects plus a sticker slap and a wheel click; the app's real "Waves on sand" recording under
  the night (119.6–131.2 s at −14 dB).
- Screens: the new time wheels spun frame by frame from the real app; every Plus moment tagged Plus.
- What happened: the first six moments went over as one batch and came back "way too fast". The hook was slowed
  (to-dos drift and settle) and sent alone as `moment-01-v2.mp4`; from then on, one moment per review. Moments 3–6
  in the example are the first cut, kept to show the API, and need rebuilding at the calm pace.
