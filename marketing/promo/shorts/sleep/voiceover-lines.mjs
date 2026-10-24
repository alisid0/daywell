// Daywell shorts: Sleep, with Luma (marketing/shorts/SCRIPTS.md, approved by the owner on 15 October 2026).
// `at` is when each line starts, in seconds: hook 0, title 6, chapters 12, 24, 36, 48, 60, 70, 82, what's included 96,
// close 110 (120 BPM, so every chapter starts on a bar). `tag` steers delivery and isn't spoken.
export const voice = { name: "Alice", id: "Xb7hH8MSUJpSbSDYk0k2", model: "eleven_v4", stability: 0.5, similarity: 0.75, seed: 1405 };

const hook = "[Playful, upbeat, friendly narration]", upbeat = "[Warm, upbeat, friendly narration]";
const chapter = "[Warm, calm, friendly narration]", close = "[Warm and confident]";
export const lines = [
  { at: 0.3, tag: hook, text: "Bedtime came and went again? Let the day soften." },
  { at: 6.5, tag: upbeat, text: "This is Sleep, with Luma. Wind down well, and notice your rest.", seed: 3307 },
  { at: 12.6, tag: chapter, text: "Choose when to wind down and when to wake up. Change it any time." },
  { at: 24.6, tag: chapter, text: "When it's time, Luma keeps you quiet company. You can leave the day here." },
  { at: 36.6, tag: chapter, text: "Pick a sleep sound, from forest at night to waves on sand. It fades out by itself." },
  { at: 48.6, tag: chapter, text: "Or listen to a guided track, like A softer goodnight." },
  { at: 60.6, tag: chapter, text: "Then there's nothing to do, and nothing tracking you at night." },
  { at: 70.6, tag: chapter, text: "In the morning, note when you fell asleep, and how you feel." },
  { at: 82.6, tag: chapter, text: "Look back at your week in a gentle journal. No scores." },
  { at: 96.6, tag: upbeat, text: "Your rhythm, wind-down and sleep journal come with Daywell. Sleep sounds and guided tracks come with Plus." },
  { at: 110.6, tag: close, text: "Daywell, from four ninety-nine a month. Make a date with yourself." },
];
