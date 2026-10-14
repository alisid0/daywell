# Preview harness snapshot (for capturing screens)

A copy, taken 14 October 2026, of the local Vite preview harness. On the owner's Windows machine it lives in
`.harness/food/`, which is git-ignored. It renders the whole app with sample data and mocks the APIs, so real screens
can be captured without the Workers runtime or any paid AI calls.

The promo needs its `?promo=1` mode (in `main.jsx`):
- a sample week for Sam (walks, meals, sleep, focus sessions and finished priorities, dated from 14 October 2026);
- a basket without milk and no saved meal plans;
- a `/api/capture` mock that runs canned model output through the app's own `draftEntries` and `mealPlanDraft`;
- a style fix that shows the capture sheet's buttons (in the app they are invisible; see the promo README).

## Use it

1. Copy this `food/` folder to `.harness/food/` at the repo root. Add `.harness/` to `.git/info/exclude` if it
   isn't ignored already.
2. Install the app's dependencies (`npm run install:ci`) and run `node .harness/food/gen-css.mjs`.
3. Start the preview server on port 5196, from the repo root:
   `node node_modules/vite/bin/vite.js --config .harness/food/vite.config.mjs`
   In Claude Code's desktop app, add it to `.claude/launch.json` as `food-harness` with `"port": 5196`.
4. From `marketing/promo`, run `node tools/capture.mjs` (all shots) or `node tools/capture.mjs s4-eat` (one group).

The harness tracks the app, so after big UI changes check that `main.jsx` still matches the app's API routes.
