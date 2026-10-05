# Daywell mascot animation: handover for ChatGPT

**Created:** Monday 5 October 2026, 17:08 BST (16:08 UTC)
**Repository:** [alisid0/daywell](https://github.com/alisid0/daywell), files in `docs/handover/`
**Prepared by:** Claude (Claude Code), for the Daywell owner to hand to ChatGPT

This document lets ChatGPT take over illustrating Daywell's seven companions and assembling the drawings into animations. It's written so ChatGPT can follow it without any earlier conversation. Parts 1 to 5 are for ChatGPT. Part 6 explains how the results get into the app.

---

## How to use this document (for you)

1. **Open ChatGPT** with image generation and the Python tool available.
2. **One chat per companion** for the drawings, so styles don't blend. Upload that companion's original portrait from `public/companions/` (for example `pip.png`), then paste **Part 1** and that companion's section from **Part 2**.
3. **Ask for the key poses in Part 3**, one at a time. Download each as a transparent PNG named exactly as listed, for example `pip-happy.png`.
4. **Optional:** ask for the hand-drawn action frames in **Part 3b**.
5. **One final chat to assemble:** upload every PNG plus `build_mascot_animations.py` from this folder, then paste **Part 4**. ChatGPT runs the script and gives you a zip.
6. **Check the results** with **Part 5**, then send the zip back to Claude or your developer for **Part 6**.

Expect about 42 key poses (6 for each of 7 companions), plus up to 42 optional action frames.

---

## Part 1: Brief for ChatGPT (paste this first)

> You're illustrating the companions for **Daywell**, a calm wellbeing app for adults organised around Move, Eat, Sleep and Relax. Seven round, fluffy companions keep people company. Their tone is warm, gentle and never pushy: no guilt, no streaks, no exaggerated emotion.
>
> I've attached the companion's **original portrait**. Every image you make is an **edit of that portrait**, not a new drawing.
>
> **Keep identical in every image**
> - The same character: fur colour, fur length and texture, body shape and size, tuft, paws, feet and the accessory it holds.
> - The same canvas: **1254 × 1254 px, fully transparent background**, character centred and filling about 76% of the canvas, with the feet in the same place.
> - The same camera (front three-quarter view, facing the viewer), the same soft neutral studio lighting, and the same tactile 3D plush rendering with fine fur strands.
>
> **Never**
> - Move, resize, rotate or recrop the character, unless the pose asks for a paw or accessory to move.
> - Add text, letters, frames, floors, cast shadows, extra characters or new objects.
> - Make the companion look sad, crying, angry, scared or hyperactive. "Concerned" means kind and caring.
>
> **Change only** what each pose asks for, usually just the face. Give me each result as a transparent PNG at 1254 × 1254, and tell me the file name to save it as.

### The shared style, from the original generation prompts

All seven share this description (from `public/companions/generation-prompts.json`):

> A nearly perfect small round sphere of very soft long fine fur, dense fluffy halo, subtly squishy plush body, tiny mitten-like paws and tiny soft feet barely visible, no distinct head or torso. Two small glossy dark bead eyes, small curved contented smile, subtle blush, friendly reassuring expression. High quality tactile 3D character rendering with fine individual fur strands and natural plush shading, understated cute art direction, no plastic.

---

## Part 2: The companions

Paste only the section for the companion you're working on. The personality, voice and movement notes help ChatGPT pick expressions that feel like that character. The source of truth is `content/companions.json`.

### Pip: focus and priorities
- **Look:** warm golden apricot fur (#F2BD72), slightly tousled tuft on top, holds a small plum-coloured pencil against its body with one paw, other paw raised in a quiet wave.
- **Personality:** keen and earnest, a little fidgety. Happiest when one small thing gets done.
- **Voice:** short, plain sentences. Counts in ones. Always offers the smallest next step.
- **Signature movement:** alert head tilts with a pencil-tap rhythm. Reacts with a quick double hop.
- **Never:** rushes you, or lists more than one thing at a time.

### Tock: clocks and timers
- **Look:** soft powder blue fur (#C7DCF4), holds a small white round timer with a blue rim and two dark hands (no numbers) against its lower belly.
- **Personality:** steady and patient, with a dry sense of humour.
- **Voice:** measured and even. Light time puns, never a countdown in your ear.
- **Signature movement:** an even pendulum sway, one beat per second. Reacts with two firm ticks.
- **Never:** hurries you or makes time feel like pressure.

### Momo: groceries
- **Look:** pale pistachio sage fur (#D4E2B9), two little tufts on top (not ears), holds a small woven basket with one red apple peeking out.
- **Personality:** homely and a bit fussy, in a helpful way.
- **Voice:** chatty and practical. Thinks in short lists.
- **Signature movement:** a side-to-side shuffle with a little basket swing. Reacts with a pat and a wiggle.
- **Never:** judges what goes in the basket.

### Luma: sleep and winding down
- **Look:** dusty lavender and lilac fur (#D9C9F2), **eyes already gently closed** in the original, a tiny calm smile, one paw cuddling a pale yellow crescent-moon pillow. No hat.
- **Personality:** soft, dreamy and unhurried.
- **Voice:** few words, long pauses, all in lowercase.
- **Signature movement:** a slow float that rises and settles like breathing. Glows instead of jumping.
- **Never:** bounces, rushes, or raises its voice.

### Nori: food and nourishment
- **Look:** soft peachy pink fur (#F3C5B5), delicate rosy cheeks, holds a small warm-white bowl with a green leaf, an orange vegetable and a tiny spoon.
- **Personality:** warm and nourishing, with no judgement about food.
- **Voice:** kind and unfussy. Talks about food as comfort, not numbers.
- **Signature movement:** a contented wiggle and slow nods. Reacts with one deep, satisfied nod.
- **Never:** mentions calories unprompted, or calls food good or bad.

### Bounce: movement
- **Look:** soft coral pink fur (#F3A6A9), fluffy upward tuft, a narrow pale mint terrycloth headband around the upper body, one paw raised ready for a small stretch.
- **Personality:** upbeat and springy, but never pushy.
- **Voice:** energetic and short. Firmly believes a stretch counts.
- **Signature movement:** a springy idle with squash-and-stretch landings. Reacts with a big jump.
- **Never:** shames rest, or counts calories burned.

### Sunny: alarms and mornings
- **Look:** pale butter yellow fur (#F5DF9E), small rounded sunburst tuft on top (no rays on the body), holds a small white bell with a gold handle, cheerful open eyes.
- **Personality:** bright and hopeful, gentle about mornings.
- **Voice:** warm, quietly cheerful, never loud.
- **Signature movement:** a slow rise like the sun coming up, with a warm pulse. Reacts by rising and glowing.
- **Never:** blares, nags, or counts snoozes.

---

## Part 3: Key poses to draw

Six face changes per companion. The original portrait is the seventh pose, "neutral". Ask for them one at a time using this template:

> **Edit the attached portrait. Change only the facial expression; keep everything else identical as described in the brief.** Character: *[companion and look from Part 2]*. New expression: *[from the table]*. Save as *[file name]*.

| Pose | File name | Used for | Expression |
|---|---|---|---|
| blink | `<id>-blink.png` | Idle blinking | Eyes gently closed as two soft downward curves, mid-blink, same small contented closed-mouth smile. |
| talk | `<id>-talk.png` | Speaking (alternates with neutral) | Eyes as in the original, mouth a small soft open oval, as if gently saying "oh". |
| happy | `<id>-happy.png` | Happy, encouraging, reactions | Eyes closed into happy upward crescents, a wider open smile showing a little dark mouth, cheeks a touch rosier. Warm, not manic. |
| think | `<id>-think.png` | Thinking | Both eyes glancing up and to one side, mouth a tiny sideways squiggle. Curious and calm. |
| concern | `<id>-concern.png` | Concerned | Eyes slightly softer and a touch downturned at the outer corners, mouth a small soft line with a hint of a kind smile. Sympathetic, never sad, no tears. |
| sleepy | `<id>-sleepy.png` | Sleepy | Eyes heavy and half-closed, mouth a tiny small yawn. Relaxed and cosy. |

`<id>` is the companion's name in lowercase: `pip`, `tock`, `momo`, `luma`, `nori`, `bounce`, `sunny`.

**Luma's exception:** her original already has closed eyes. Instead of `blink`, draw **`luma-awake.png`**: eyes gently half-open with small glossy bead eyes visible under relaxed lids, the same tiny calm smile, still dreamy. Her `sleepy` pose can have the eyes fully closed with a tiny yawn.

**Check each pose before moving on.** Lay it over the original: the body, accessory and feet should line up exactly. If the character has moved or changed size, ask ChatGPT to redo it from the original. Small drift is fine; the script lines the poses up.

### Part 3b (optional): hand-drawn action frames

These are moments code can't fake, because a paw or accessory actually moves. Each is 4 to 6 frames that play forward and back as a loop. Use the same template, but say: *"Change only the paw and accessory position described; keep the face as in the original."* Name them `<id>-action-01.png`, `<id>-action-02.png` and so on.

| Companion | Action | Frames |
|---|---|---|
| Pip | Taps the pencil in the air | 01 pencil at chest · 02 pencil raised a little · 03 pencil raised high, tip forward · 04 pencil tapping down, small tilt |
| Tock | Holds the timer up to show you | 01 timer at belly · 02 timer lifted to chest · 03 timer held up in front, slight tilt · 04 timer tilted the other way |
| Momo | Lifts the basket, apple peeks out | 01 basket low · 02 basket at chest · 03 basket raised, apple more visible · 04 basket swung gently to one side |
| Luma | Hugs the moon pillow and settles | 01 loose hug · 02 hugging closer · 03 cheek resting on the pillow · 04 fully snuggled, body a touch lower |
| Nori | Lifts a spoonful | 01 spoon in bowl · 02 spoon lifting · 03 spoon raised to just below the smile · 04 spoon tilted, satisfied |
| Bounce | Stretches up | 01 paw at side · 02 both paws rising · 03 both paws high, body slightly taller · 04 paws coming back down |
| Sunny | Rings the bell gently | 01 bell still · 02 bell tilted left · 03 bell tilted right · 04 bell tilted left, a tiny sparkle near it (no text) |

---

## Part 4: Assemble the animations (paste into the final chat)

Upload all the PNGs (including the seven originals, named `pip.png`, `tock.png`, and so on) and `build_mascot_animations.py`, then paste:

> Run the attached `build_mascot_animations.py` exactly as it is, with Python and Pillow. It reads every PNG in `/mnt/data`, lines the poses up with each original, and builds the animations. Don't change the motion values: they match animation that's already been approved. If something fails, fix only what's needed to run it and tell me what you changed.
>
> When it finishes:
> 1. Show me each companion's `contact-sheet.png`, and the `idle`, `speaking` and `reaction` previews.
> 2. Tell me which poses were missing, if any.
> 3. Give me the download link for `daywell-mascot-animations.zip`.

### What the script makes for each companion

All clips are 512 × 512 px frames at 12 frames per second.

| Clip | Loops | What it shows |
|---|---|---|
| idle | yes | Signature movement, gentle breathing, an occasional blink |
| listening | yes | Leans in a little, quieter movement |
| thinking | yes | Looks up, slower movement, "think" face |
| speaking | yes | Talking squish, mouth alternating between "talk" and neutral |
| happy | yes | Bigger, quicker signature movement with the "happy" face |
| encouraging | yes | Leans in, warm, "happy" face |
| sleepy | yes | Slow, drooping, "sleepy" face |
| concerned | yes | Small, slow, leaning in kindly, "concern" face |
| reaction | no | The one-off reaction: Pip's double hop, Bounce's jump, Luma's glow and so on |
| action | yes | Only if Part 3b frames were uploaded |

Each clip comes as an animated WebP (transparent, for the app), a GIF on white (for sharing), and a sprite sheet. `manifest.json` lists everything.

---

## Part 5: Quality checklist

Go through this before sending the zip on:

- [ ] Every companion looks like itself in every pose: same fur colour, tuft, accessory and size.
- [ ] Backgrounds are transparent, with no white boxes, floors or shadows.
- [ ] In the contact sheets, the feet line up across all poses.
- [ ] The `idle` preview loops without a jump at the end.
- [ ] No face reads as sad, scared or manic. "Concern" looks kind.
- [ ] Luma never bounces. Bounce's jump lands with a squash.
- [ ] No text or letters anywhere.
- [ ] File names match the tables exactly (lowercase, hyphens).

---

## Part 6: Getting the animations into the Daywell app

Yes, there are good options. Here's how they compare:

| Option | What ships | Size (approx.) | Best for |
|---|---|---|---|
| **A. Key poses + in-app motion** (recommended) | 7 face images per companion | About 15 MB for all 49 as 512 px PNG; roughly 3 MB as WebP, loaded per companion as needed | The app itself. Crisp at any size, reacts instantly to mood, respects reduced motion. |
| **B. Sprite sheets** for the reaction and action clips | 1–2 clips per companion | Roughly 0.5–1.5 MB per clip at 512 px, a third of that at 256 px | Hand-drawn moments (Part 3b) that code can't fake |
| **C. Animated WebP or GIF** | Ready-made files | Largest | Marketing, app store screenshots, social posts, onboarding videos |
| **D. Rive or Lottie** (later) | A rigged animation file | Small | Full facial animation, if an animator rebuilds the characters |

**Recommended plan:**
1. **Key poses first (option A).** Add the aligned key poses from the zip to `public/companions/expressions/`, with a manifest and a test that checks every file exists, like the audio library has. A small `CompanionFace` component switches faces by mood, cross-fading in about 150 ms, while the motion the app already uses keeps playing. The moods come from what Daywell is doing:
   - Listening, thinking and speaking come from the Talk button, which already shows these states.
   - Happy plays when something is saved or finished.
   - Sleepy plays after the wind-down time.
2. **Then sprite clips for the hand-drawn actions (option B)**, loaded only when needed, at 256 px for small spots.
3. **Keep the GIFs and WebPs (option C)** for the website, app store and social media.

As with every visible change, this starts as an interactive preview and is only built after approval.

---

## Notes

- **Image licensing:** check that the image tool's terms allow commercial use of what it generates. The originals were made with ChatGPT's image generation.
- **Source of truth:** if a companion's personality or lines change, update `content/companions.json` and regenerate only the affected poses.
- **The script** (`build_mascot_animations.py`) holds the approved motion values in one table, so timing can be adjusted later without redrawing anything.
