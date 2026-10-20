# Handover: Move workout-guide pictures (20 October 2026)

```text
Session date: 20 October 2026
Branch and PR: feat/move-pictures, from main 0598fa4. Not merged, not deployed.
What changed:
  - The owner asked for pictures in the workouts so people can see the right form, made once and kept in the app. The
    pictures were made in the owner's ChatGPT (two chats: a female figure, the default, and a male one), each checked
    against its pose text, then turned into app files with scripts/move-pictures/process.mjs. See docs/move-pictures.md.
  - The routine player shows the exercise's picture above its name: start and end frames swap slowly; "Hold still" or
    reduced motion shows both at once (side by side for standing moves, one above the other for floor moves).
  - "Female" and "Male" buttons under the picture save a new setting, guideFigure (default female). Where the chosen
    figure has no picture yet, the other figure's is shown with a note.
  - The player now reads top to bottom: picture, exercise, amount, Bounce's tip, timer, buttons, then the voice
    controls (moved below the buttons so the picture and controls fit on a phone screen). It scrolls into view when a
    routine starts, and when a new step starts above the top of the screen.
  - Pictures so far: female squat, push-up, plank, kettlebell deadlift, hip hinge practice, kettlebell goblet squat,
    kettlebell carry (left; right is mirrored; the gym goblet squat shares the kettlebell one); male squat, push-up,
    plank. 20 files, about 430 KB.
Checks performed and their results:
  - npx tsc --noEmit: clean. 293 of 293 tests pass, with 3 new ones in tests/exercise-pictures.test.mjs.
  - npm run lint:changed: no new lint errors. npm run build: complete.
  - Real screens from the preview harness at phone size: the One kettlebell routine (rest with the next picture, hip
    hinge, Hold still, deadlift, the male fallback note), Hotel room fifteen with the male figure (squat, push-up, Hold
    still), larger text and the dark Moonlit den look.
What is not yet verified:
  - A real phone, and the deployed app.
Remaining work / next step:
  - The owner reviews the screens. Merge only on "merge"; deploy only when asked.
  - Make the remaining pictures (73 per figure in all; scripts/move-pictures/prompts.mjs lists them), ideally in the
    in-app browser so the owner's screen stays free, then rerun process.mjs and npm test.
  - The male kettlebell deadlift was made in ChatGPT but not saved yet; the female marching picture was being made.
Setup or migration steps needed on the other machine:
  - None. No database migration (guideFigure is a new optional setting with a default).
Any work still local, and why:
  - The source PNGs in the owner's Downloads/daywell-move-pictures folder (originals, not shipped).
```
