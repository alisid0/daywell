# Handover: promo v2, the promo-video skill, and the plans branch, 14 October 2026

For Claude or Codex continuing on any machine. Read [the 13 October launch-state handover](2026-10-13-launch-state.md)
first: everything in it still stands unless this file says otherwise.

## Handover summary

```text
Session date: 14 October 2026 (Claude, on the owner's Windows machine)
Branches:
  marketing/promo-v2: this file, marketing/promo/ (the promo film), .claude/skills/promo-video/ (the skill).
    Based on main at 1367d1c.
  feat/plans at 6c2ce1d: the two plans (pushed on 14 Oct). No PR yet, see section 2.
What changed: a 120 s vertical promo built in code (real app screens, ElevenLabs voice, music and sound effects),
  a reusable promo-video skill, and an app bug found on the way (section 4).
Checks: the delivered v2 MP4 passed the spec, loudness (-14.2 LUFS, -1.0 dBTP) and glitch checks (section 1).
  No app code changed on this branch.
Not yet verified: the promo on real phones and on each platform's upload; the owner hasn't seen v2 yet.
Next step: the owner watches v2 and gives notes. Open the plans PR. Fix the invisible capture-sheet buttons.
```

## 1. The promo (marketing/promo/)

- **What it is:** "One day with Daywell", 1080×1920, 60 fps, 120 s, for TikTok, Instagram Reels and YouTube Shorts.
  Each moment of a sample day (7:00 one small thing, 8:00 breakfast, 10:30 desk break, 13:00 out of milk, 17:30
  dinner, 21:00 pause, 22:30 wind down, the next morning) arrives as an event card that opens into the phone and
  shows the real app doing it. It ends with "Make a date with yourself" and daywell.date.
- **Owner decisions (14 Oct):**
  - The script in `marketing/promo/SCRIPT.md`.
  - An ElevenLabs voiceover in Alice's voice, plus ElevenLabs sound effects.
  - "Promo typical upbeat music", which is ElevenLabs Music at 120 BPM.
  - No dating-app framing; general wellness only.
- **Everything to rebuild is in git:** the screen captures, voice lines, music take, sound effects, the engine and
  the tools. Renders and mixes are not (git-ignored). `marketing/promo/README.md` has the commands. On a new
  machine, run `npm run install:ci`, install Chrome and FFmpeg, then from `marketing/promo` run
  `node render.mjs --cues && node tools/mix.mjs && node render.mjs` (about 11 minutes).
- **QA of the delivered v2** (`tools/qa.mjs`, 14 Oct):
  - **Spec:** H.264 High, 1080×1920, 60 fps, yuv420p, BT.709 limited range; AAC 48 kHz stereo; exactly 2:00; 60 MB.
  - **Loudness:** -14.2 LUFS, true peak -1.0 dBFS, LRA 5.4 LU.
  - **Glitch scan:** no unplanned jumps and no one-frame flashes.
  - **Mix balance:** the voice sits 8–12 dB over the music in every line, and every sound effect stands clear of the
    bed.
  - **Still stretches:** the night (about 79–87 s) is a deliberate dark, quiet hold with the waves sound. It's the
    first thing to tighten if it feels long on social. The end card holds for its last 6 s.
  - **Repo copy:** the tools were made portable (`tools/paths.mjs`), and rendering stills from the repo copy was
    tested.
- **Before posting:**
  1. **Wait for version 1 and re-capture.** Post only when version 1 ships, and re-capture the screens then. A few
     small controls leaving version 1 are visible: "Hear this", the meal-plan microphone, "Tap to give a command".
  2. **Fix the capture-sheet buttons** (section 4) first; the captures show them fixed.
  3. **Breakfast photo:** it's a stand-in (the app's own `public/grain-bowl.jpg`, so the result reads "Salmon &
     quinoa bowl"). A real photo of the owner's breakfast would be better.
- **ElevenLabs:** the owner's paid Creator plan, which allows commercial use, with overspend switched off. Voice,
  music and effects used about 4,000–5,000 credits. The key stays in the git-ignored `.dev.vars`; the tools read it
  and never print it.

## 2. The plans branch (feat/plans, 6c2ce1d)

The two plans are built and pushed: the `subscriptions` table, plan checks (402s), the plan screen, Your plan, and
the tester switch. See the 13 October handover for the design. **There is no PR yet,** because GitHub was signed
out in the browser and `gh` isn't installed on the owner's machine. Open it from
https://github.com/alisid0/daywell/compare/main...feat/plans?quick_pull=1. Merge only on the owner's
"merge it" / "merge #N".

## 3. The promo-video skill (.claude/skills/promo-video/)

A project skill, so Claude Code loads it in this repo on any machine. It combines three public motion-design skills
(AbubakrChan/product-launch-motion, charlie947/motion-graphics-skills, howseen-ai/claude-motion-design) with what
worked here.

- **The pipeline:** truth pass, then script approval, then voice, then music measured with the film moved to it,
  then effects, real captures, the seek(t) engine, stills with critique, the mix, the render, and checks on the
  delivered file.
- **The references:** story and truth, motion, sound, render and QA, Daywell's rules, and a traps list.
- **The tools:** in `marketing/promo/tools`.

A copy is also in the owner's user skills folder on the Windows machine.

## 4. Bug found: invisible buttons in the capture sheets

`.well-button` uses `--well-accent`, which is only defined on `.well-space`/`.rest-space`. The food capture dialog
is portalled outside those, so its main buttons are white on a transparent background:
- "Review this photo"
- "Continue"
- "Review meals & save"
- "Save food consumed"
- "Suggest from my saved basket"

This is in the app today, including the private test. The likely fix is to define the same variables for the
dialog. On 14 Oct the owner started a separate Claude session for it (preview first, then a PR). Check GitHub for
its branch or PR before starting again.

## 5. Owner to-do (unchanged unless noted)

- **New:** watch promo v2 and give notes; send a real breakfast photo if wanted; open the plans PR from the link.
- **Hosting:** buy Workers Paid; approve the Wrangler sign-in; then say "deploy" (the 13 Oct handover, section 5).
- **Stores and accounts:** Apple enrolment, the Play Console app, the RevenueCat account; the operator name and
  contact email; the App Store name; a UK trade mark search.

## 6. Material only on the owner's Windows machine

- The scratch clone and its session folder, including the full v1 and v2 renders under `promo/out/`. Re-render
  from git instead.
- The preview harness in `.harness/food/` (git-ignored). A snapshot is in `marketing/promo/harness/`, with setup
  steps.
- Claude's memory notes for this project.
