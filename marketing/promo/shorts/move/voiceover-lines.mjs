// Daywell shorts: Move, with Bounce (marketing/shorts/SCRIPTS.md, approved by the owner on 15 October 2026).
// `at` is when each line starts, in seconds: hook 0, title 6, chapters 12, 24, 36, 46, 58, 68, 80, what's included 96,
// close 110 (120 BPM, so every chapter starts on a bar). `tag` steers delivery and isn't spoken.
export const voice = { name: "Alice", id: "Xb7hH8MSUJpSbSDYk0k2", model: "eleven_v4", stability: 0.5, similarity: 0.75, seed: 1405 };

const hook = "[Playful, upbeat, friendly narration]", upbeat = "[Warm, upbeat, friendly narration]";
const chapter = "[Warm, upbeat, friendly narration]", close = "[Warm and confident]";
export const lines = [
  { at: 0.3, tag: hook, text: "Sat at your desk all day? Good news: a stretch counts." },
  { at: 6.5, tag: upbeat, text: "This is Move, with Bounce. A little stronger, at your pace." },
  { at: 12.6, tag: chapter, text: "Eighteen routines, from a five-minute desk break to the gym. Anywhere, no equipment, at home or at the gym." },
  { at: 24.6, tag: chapter, text: "Bounce takes you through one step at a time, with a timer for each." },
  { at: 36.6, tag: chapter, text: "Too much? Make a step easier. Feeling strong? Make it harder." },
  { at: 46.6, tag: chapter, text: "With Plus, Bounce reads each step aloud, so your eyes can stay off the screen." },
  { at: 58.6, tag: chapter, text: "Stop early? Save what you really did. It still counts." },
  { at: 68.6, tag: chapter, text: "A walk, a swim, a dance in the kitchen. Record any move by hand." },
  { at: 80.6, tag: chapter, text: "No plan? Start fifteen minutes with Bounce. Then look back at your week, with no streaks." },
  { at: 96.6, tag: upbeat, text: "Every routine, timer and record comes with Daywell. Plus adds Bounce's voice." },
  { at: 110.6, tag: close, text: "Daywell, from four ninety-nine a month. Make a date with yourself." },
];
