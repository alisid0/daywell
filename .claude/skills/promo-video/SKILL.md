---
name: promo-video
description: Make a polished promo, launch or explainer video for an app or product, built in code and rendered to MP4 — vertical 9:16 for TikTok, Reels and Shorts by default, with an ElevenLabs voiceover, music and sound effects. Use when someone asks for a promo video, launch film, app ad, product reel, "show what users can do", a voiceover video, motion graphics for a product, a compilation of short clips, a film built "5 seconds at a time", or wants an existing promo remade, slowed down or improved. Covers the truth pass, script approval, voice/music/SFX generation, beat-grid timing, the seek(t) HTML engines (chapter films and films of short moments), real app screens including frame-by-frame captures of moving controls, calm pacing, one-moment-at-a-time reviews, rendering, mixing to -14 LUFS, separate clips and checking the delivered file.
---

# Promo videos that look directed, not generated

A promo is finished when a stranger, scrolling with the sound off, knows in three seconds what the product does
for them, and when every frame, word and sound in it is true. Everything below serves those two things.

This skill distils three public motion-design skills (AbubakrChan/product-launch-motion,
charlie947/motion-graphics-skills, howseen-ai/claude-motion-design) plus what proved itself, and what the owner
pushed back on, making two Daywell films in October 2026. The craft rules are fixed; the look is not. Two films
made with this skill should look different, because they argue different claims.

## The stance

- **You are the director.** Make creative choices yourself, write each down as a `DECISION:` line, and list them
  in the hand-off so the owner can overturn any in one reply. Ask only for what you cannot know.
- **Truth before beauty.** Show only what the product really does today, in its real screens, with its real
  words. A beautiful film with one invented feature or number is unshippable. See `references/story-and-truth.md`.
- **Agree the script before building anything.** Script, voiceover lines and status of every claim go to the
  owner first. Building before the words are agreed wastes renders and paid audio.
- **Music first, then picture.** The measured music (not the plan you asked for) sets the timing. Scenes move
  to the music's real sections; important words and hits land on beats.
- **Calm beats busy.** A viewer needs time to see a screen change and read it. One thing happens per beat of the
  story, each result holds about a second, and the camera moves at most once per moment, slowly. The first cut of
  the Daywell "Small things count" film packed a tap, a sheet, a spin, a save and a stamp into every 5 seconds,
  and the owner's verdict was "the movements and animations are way too fast". Scrubbing stills hides speed: if a
  moment feels brisk in stills, it is far too quick at playback.
- **Show it in small pieces.** Send the owner one moment or scene (about 5 seconds) at a time, with sound, and fold
  in their notes before building the next. A 30-second batch hides pace and taste problems until they are six
  times as expensive to fix.
- **Muted first.** Most views start silent. The words on screen carry the story; they follow the voiceover
  exactly, so the film works with and without sound.
- **Look at the delivered file.** Green checks catch broken, not bad. Judge stills, contact sheets and the final
  MP4 yourself, score them harshly, and fix until every scene scores 8/10 or better.

## The laws (break one and it reads amateur)

1. **One claim, said early.** The promise lands in the first 3 seconds on screen and the first 10 in the voice.
2. **Only real features, screens and figures.** Keep an approved-facts list with a source for each; nothing else
   appears as a number or a claim. Mark anything not yet shipped and don't post it until it ships.
3. **One shape never cuts.** Transitions are morphs: the same element changes size, radius and colour while its
   content swaps with a short blur. Cuts are rare and deliberate.
4. **Springs, not bounces.** Closed-form damped springs, damping 0.72–0.9 for UI, 1.0 for camera and text. A tiny
   overshoot at most. No `back`/`elastic` cartoon easing, no linear movement.
5. **A finger (or cursor) causes every change.** Taps have a press, a ripple and a reaction in the control. The
   camera pushes in on what is touched, about the touched point, so it stays put while the world grows.
6. **Every reveal lands on its word or its beat.** Word timings come from the TTS alignment; beats come from
   analysing the actual music file. Never estimate either.
7. **Nothing ends moving.** Each scene resolves before it changes; at most one element keeps living during a hold.
8. **Ration the accent.** One accent colour with a written job list; everything else is ground, ink and muted.
9. **Readable at phone size, inside the safe area.** Two caption lines at most, at least 0.7 s each; keep
   important things out of the bottom 20%, right 12% and top 10% of a 9:16 frame.
10. **Determinism.** Every frame is a pure function of time: `seek(t)` draws exactly that moment. No CSS
    transitions, timers, `Math.random` or state carried between frames.

## Films made of short moments

Use this shape when the brief asks for a long film built from short pieces ("2.5 minutes, 5 seconds at a time,
then a compilation"), or for clips that must also stand alone.

- **Fix the moment length, then pick a tempo where it is whole bars:** 5 s is two bars at 96 BPM; 4 s is two bars
  at 120 BPM; 6 s is three bars at 120 BPM. Plan the music in chunks that start on moment boundaries, then measure.
  In the Daywell take every moment started within 25 ms of a beat.
- **One small thing per moment:** one action, one voice line (under about 4 s, starting about 0.3 s in), one
  result, then a closing signature. Daywell's signature is a sticker stamp that lands beside the phone, holds and
  tucks away. The signature gives each moment an ending, so it can be cut out as its own clip, and gives the
  compilation its rhythm. Avoid counters or progress bars when the product rejects streaks and scores.
- **Wordless moments:** a moment with no voice keeps its number with empty text, which the voice and mix tools
  skip, so line numbers keep matching moment numbers.
- **Build and review:** use `scripts/engine/moments.js` (worked example: `scripts/example-moments/`). Show each
  moment as it's finished: render it with `--from/--to` at full quality, with the film's full mix. Re-export the
  cues and re-mix after any timing change, because the mix is built from the film's own cue list.
- **The finale gathers the signatures.** In Daywell's film the stamps form one page, which folds into the brand
  sun before the end card.
- **Separate clips:** cut the final render at moment boundaries with short audio fades (about 0.15 s), named by
  number and title. Check that each clip starts and ends on a settled frame. A signature that spills into the next
  moment (Daywell's stamp tucks away in its first 0.5 s) will open the next clip, so decide early whether each
  signature finishes inside its own moment or clips are rendered one by one (render-and-qa, "Separate clips").

## The pipeline

Do the steps in order. Steps 1–3 loop until the facts, the direction and the script agree.

| # | Step | Output | Reference |
| --- | --- | --- | --- |
| 1 | **Intake and truth pass.** Product, audience, platform, length, brand files. Read the product's code and docs; list what really works, with sources. | `SCRIPT.md` facts table | story-and-truth |
| 2 | **Direction.** Write three different directions (thesis, look, signature move, sound), kill two, record the winner and why. | Direction block in `SCRIPT.md` | story-and-truth |
| 3 | **Script for approval.** Scene table (time, moment, what's seen, words on screen, ✅/⏳ status), voiceover lines, sound plan, credits estimate. **Stop until the owner approves.** | `SCRIPT.md` | story-and-truth |
| 4 | **Voice.** One line in 3–4 candidate voices for the owner to pick. Then one clip per line with word timings, each transcribed back to catch slips. | `audio/vo/` | sound |
| 5 | **Music.** Compose to the scene plan (composition plan, one chunk per section), then **measure** tempo, beats, breaks and loudness, and move scenes to the music's real shape. | `audio/music/*.beats.json` | sound |
| 6 | **Sound effects.** One prompt per action type (tap, shutter, save, pop, typing…); measure each peak for placement. | `audio/sfx/` | sound |
| 7 | **Screens and assets.** Capture the real app in each before/after state at device size, with the box of every control the finger touches. Capture moving controls (wheels, sliders, carousels) frame by frame from the real app rather than rebuilding them. Look at every state before scripting, because real flows surprise (Daywell's "Set timer" readies a "Start timer" button). Brand fonts, colours and characters are self-hosted. | `assets/shots/` + `shots.json` | render-and-qa |
| 8 | **Build.** One HTML file with `seek(t)`; layers for sky/ground, world (camera), phone, captions and HUD; cues exported from the film for the mix. | `index.html` | motion |
| 9 | **Stills, critique and the owner's eye.** A frame in the payload of every scene and around each transition; contact sheet; score each scene; fix; repeat until 8+. Then send the owner that one moment or scene as a short clip with sound, and wait for their notes before the next. | `out/stills/`, critique notes, review clips | render-and-qa |
| 10 | **Mix.** Voice on top; music ducked under speech; effects placed by their peaks on the cue times; master two-pass to -14 LUFS, true peak ≤ -1 dBTP. | `audio/mix.wav` | sound |
| 11 | **Render.** Chrome over CDP captures each frame; FFmpeg encodes H.264 yuv420p BT.709 limited range, AAC, `+faststart`. Versioned name, never overwrite. | `out/<name>-vN.mp4` | render-and-qa |
| 12 | **Verify the delivered file.** Spec check (ffprobe), loudness, one-per-second storyboard, frame-difference scan for glitches, frames at every changed beat, key effects audible. | QA report | render-and-qa |
| 13 | **Hand off.** MP4, poster, captions (.srt from the word timings), stills, short cut-downs or separate moment clips if wanted, and a README: facts and sources, decisions, licences, what still blocks posting. | `out/` | render-and-qa |

## Paid services

ElevenLabs (voice, music, sound effects) costs credits. Before any paid call: confirm the owner wants it, check
the plan allows commercial use (Starter or higher; the free plan doesn't), check the remaining credits and keep a
reserve, and state the expected cost. Generate per line or per sound so a fix costs only that piece. Read keys
from a local secrets file inside the process; never print, log or commit them.

## Definition of done

- [ ] Every claim, number and screen is on the approved-facts list; unshipped items are marked and gated.
- [ ] The owner approved the script and voiceover lines before audio was generated.
- [ ] Scenes sit on the measured music; the key word or reveal lands on its beat (spot-check five).
- [ ] Captions match the voice word for word and stay inside the safe area.
- [ ] No scene is still moving when it changes; nothing pops or flashes unintentionally (frame-diff scan).
- [ ] Every scene scored 8/10 or better on the contact sheet critique.
- [ ] Pace: one action per moment or scene, each result held about a second, at most one camera move per moment;
      the owner saw and approved each piece as it was built.
- [ ] For a film of moments, each moment is also exported as its own clip when asked.
- [ ] The delivered MP4 passes the spec check and measures -14 LUFS ±1, true peak ≤ -1 dBTP.
- [ ] Renders are versioned; the README lists facts, decisions, licences and anything blocking posting.

## Red flags

| The thought | What it means |
| --- | --- |
| "I'll guess the timings and tidy them later" | Every cue will be wrong. Measure the voice and the music first. |
| "The app probably does that" | Check the code. If you can't find it, it isn't in the film. |
| "It sounds fine to me" | You can't hear it. Measure loudness, peaks and the envelope of each key effect. |
| "The change is in the source, so it's in the film" | Sample the delivered MP4 at that moment. |
| "One more effect will make it premium" | Premium is one object changing shape, real content, and timing. Remove instead. |
| "I'll overwrite the last render" | Then you can't prove the fix or give back the version the owner liked. |
| "I'll show the first 30 seconds together" | Show one moment. A pace problem found after 30 seconds of work costs six times as much to fix. |
| "Promos should feel energetic, so faster is better" | Energy comes from rhythm and contrast, not speed. Dense cuts read as rushed. |
| "I know how this screen works" | Capture it and look first. The real flow decides the choreography. |

## References

- `references/story-and-truth.md` — claim, arc, direction, the facts list, writing the script and voiceover.
- `references/motion.md` — springs, the morphing shape, content swaps, the finger, camera, captions, holds.
- `references/sound.md` — ElevenLabs voice, music and effects; beat analysis; mixing and mastering.
- `references/render-and-qa.md` — the seek(t) contract, screen capture, rendering, QA and platform specs.
- `references/traps.md` — every trap hit making the Daywell films, with the fix. Read before building or debugging.
- `references/daywell.md` — Daywell's brand, rules, facts and assets, and its two October 2026 films as worked
  examples.
- `scripts/` — the studio: tools (credits, voiceover, music, beats, bands, effects, capture, data, render, mix, QA),
  two engines (chapter films and films of moments) and two worked examples. Set up as one `promo/` folder with a
  sub-folder per film; see `scripts/README.md`.
