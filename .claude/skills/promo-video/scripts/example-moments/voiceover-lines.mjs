// "Small things count" (SCRIPT.md, approved by the owner on 24 October 2026, with Alice for the voice). One line per
// 5-second moment; `at` is when the line starts, 0.3 s into its moment. Moment 26 is wordless (the waves and Luma's
// bubble). `tag` steers delivery and isn't spoken.
export const voice = { name: "Alice", model: "eleven_v4", stability: 0.5, similarity: 0.75, seed: 2410 };

const day = "[Warm, friendly narration]", soft = "[Soft]";
const texts = [
  [day, "Looking after yourself can feel like a lot."],
  [day, "So start small. With Daywell, small things count."],
  [day, "Note how you slept. Spin, save, done."],
  [day, "Three gentle helpers keep it calm."],
  [day, "Pick one small thing for today."],
  [day, "Give it twenty-five minutes."],
  [day, "Snap your breakfast. Daywell notes it."],
  [day, "No calorie counting, unless you want it."],
  [day, "See what's in your kitchen."],
  [day, "Out of milk? It goes on the list."],
  [day, "Snap the receipt. It's all put away."],
  [day, "Fill the week with dinner ideas."],
  [day, "A move that fits your day."],
  [day, "One step at a time, with Bounce."],
  [day, "Not today? Go gentler, or rest."],
  [day, "Stop early? It still counts."],
  [day, "Record a walk with a spin."],
  [day, "And rest days count too."],
  [day, "Your week, one swipe at a time."],
  [day, "Make plans in a few spins."],
  [day, "Or just ask, in your own words."],
  ["[Softer and slower]", "Evening. Nothing to do. Just be."],
  [soft, "Breathe along with Luma."],
  [soft, "Pick a gentle time to wind down."],
  ["[Quiet, measured]", "Drift off to waves on sand."],
  ["", ""],
  ["[Warm and brighter]", "Read it your way."],
  [day, "Make it look like you."],
  [day, "No streaks. No scores. Small things count."],
  ["[Warm and confident]", "Make a date with yourself. Daywell dot date."],
];
export const lines = texts.map(([tag, text], i) => ({ at: i * 5 + 0.3, tag, text }));
