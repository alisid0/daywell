# Handover: Move redesign (22 October 2026)

```text
Session date: 22 October 2026
Branch and PR: feat/move-redesign, from release/tester-1022 0a1108f (merged into main as #69). PR to main. Not deployed.
What changed:
  - The owner chose the Move design on the "Move upgrade options" canvas: 1A today, 2A all workouts, 3C doing it with
    Bounce, 4B recording with pictures, 5.2 looking back with Bounce ("5.2 Approved", 22 October). Planning the week
    was left out for now (owner, 22 October).
  - Move home (app/move-space.tsx): "Your move today" with this week's days, one suggested workout with its moves and
    a reason, Not today (shorter, no kit, gentler, a walk, or rest today), quick moves (walk with a timer, stretch,
    desk break), Record a move and All workouts. Someone new gets "A gentle start".
  - All workouts with where and how-long filters, and Before you start: what you'll do (rounds and left/right moves
    read as one line), the routine's safety notes, the picture figure, Start with Bounce.
  - Doing it (app/move-routines.tsx): one step per screen with its picture or a tile, Bounce's tip, a count of the reps
    really done, timers, rest with what's next and +15 s, easier/harder/skip, and the same voice commands. Done records
    the reps counted; counting none records nothing. Ending early keeps only the steps done.
  - Recording (app/move-record.tsx): after a workout the moves done are filled in to check (bell weight once); strength
    by tapping pictures (recent moves first, Find another, your own move); walk or run, and something else, by chips.
    Saved moves can be changed or removed from Every move.
  - Your week (app/move-week.tsx): Bounce's note on the last seven days (rest days count), the days, what they worked,
    What next? (after a new best, two more reps a set; Try or Keep is saved in the new setting moveTargets, and the
    player uses it), and Ask Bounce, which opens Bounce's chat with the question typed (AI chat, part of Plus).
  - The rules (suggestion, not-today choices, outline, bests, note, next step) are in lib/move-plan.ts, all fixed and
    on the device: no AI and nothing counted against usage limits.
  - Styles in app/move.css use the palette tokens, so every look and dark mode work. Moves without pictures yet (66 of
    75) show a tile with an icon for what they work.
Checks performed and their results:
  - npm run check: type check clean, 309 of 309 tests pass (9 new in tests/move-plan.test.mjs), build complete.
  - npm run lint:changed: no new lint errors. New files lint clean apart from the usual <img> warning.
  - Preview harness (fix-harness, phone size, Sam's sample fortnight with &move): home, Not today, rest today, first
    visit, all workouts and filters, Before you start, warm-up, rest and +15 s, counting reps, ending early, the
    after-workout record, saving, Your week with Try 2 × 10 (then the target shows in the player), Every move with
    change and find a move, the walk timer surviving a reload, Ask Bounce, a dark look and larger text.
What is not yet verified:
  - A real phone, and the deployed app.
Remaining work / next step:
  - The owner reviews the screens. Merge only on "merge"; deploy only when asked.
  - Later: planning the week (the owner's row 5), the remaining workout pictures.
Setup or migration steps needed on the other machine:
  - None. moveTargets is a new optional setting with a default; no database migration.
Any work still local, and why:
  - None in the repo. The preview harness and its capture plan are local tools, outside Git.
```
