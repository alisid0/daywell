# Move workout-guide pictures

Owner request, 20 October 2026: pictures for the workouts, so people can see that what they're doing is right. They are
made once, checked, and kept in the app as files. Nothing is generated while people use Daywell, so they cost nothing to
show, work offline and are the same on both plans.

## What they look like

- A smooth, faceless mannequin in light warm grey with a thin plum outline, in the style of an anatomy muscle chart (the
  owner's example, described in words only).
- The muscles an exercise works are raspberry pink; everything else stays grey.
- Two figures, chosen in the workout itself and saved as the `guideFigure` setting:
  - **female** (the default): unisex, leaning feminine, plum crop top and shorts;
  - **male**: broader shoulders, shirtless, plum shorts.
- A move has two frames, the start and the end, which swap slowly. "Hold still", or a device set to reduce motion, shows
  them side by side. Holds, stretches and steady movement have one frame.
- The pictures sit on a light card in every look, because the figure is drawn in light grey and plum.
- If the chosen figure has no picture for an exercise yet, the other figure's picture is shown, with a note.

## Where things are

| What | Where |
| --- | --- |
| Pictures | `public/move-guides/<figure>/<exercise-id>-<n>.webp` (800×600, transparent) |
| Which pictures exist | `content/exercise-pictures.json` (made by the script below) |
| Looking one up | `lib/exercise-pictures.ts` (`exercisePicture`) |
| Showing one | `app/exercise-picture.tsx` and `app/move-guides.css`, used in the routine player (`app/move-routines.tsx`) |
| What each picture must show | `scripts/move-pictures/poses.mjs`: camera, start and end poses, muscles |
| The ChatGPT prompts | `scripts/move-pictures/prompts.mjs` |
| Turning saved pictures into app files | `scripts/move-pictures/process.mjs` |

## Making more

1. In ChatGPT, start one chat per figure. Send the reference sheet prompt first (`node scripts/move-pictures/prompts.mjs
   female`, or `male`), then one exercise prompt at a time.
2. Check every picture against its pose text in `poses.mjs` before keeping it: a straight back where it says so, knees in
   line with the toes, the right muscles in pink, nothing extra (text, labels, extra limbs). Ask ChatGPT to fix anything
   wrong, or make it again.
3. Save each picture as `<exercise-id>.png` in `Downloads/daywell-move-pictures/<figure>/` (or pass another folder).
4. Run `node scripts/move-pictures/process.mjs`. It cuts two-panel pictures into start and end frames with the same crop,
   so the figure stays put when they swap, adds the mirrored and shared pictures (`mirrorOf`, `sameAs` in `poses.mjs`) and
   rewrites `content/exercise-pictures.json`.
5. Run `npm test`. It checks that every listed picture is a real exercise with its files, and that no stray files ship.

## Done so far (20 October 2026)

- **Female figure:** squat, push-up, plank, kettlebell deadlift, hip hinge practice, kettlebell goblet squat and kettlebell
  carry (left), plus the right-hand carry (mirrored) and the gym goblet squat (the same pictures). This covers the
  "One kettlebell, steady strength" routine except marching on the spot.
- **Male figure:** squat, push-up and plank.
- Still to make: the other exercises for both figures (73 pictures each in all; `prompts.mjs` lists them in order).
