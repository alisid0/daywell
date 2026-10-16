// Daywell shorts: Relax, with Luma (marketing/shorts/SCRIPTS.md, approved by the owner on 15 October 2026).
// `at` is when each line starts, in seconds: hook 0, title 6, chapters 12, 24, 36, 48, 60, 70, 82, what's included 96,
// close 110 (120 BPM, so every chapter starts on a bar). `tag` steers delivery and isn't spoken.
export const voice = { name: "Alice", id: "Xb7hH8MSUJpSbSDYk0k2", model: "eleven_v4", stability: 0.5, similarity: 0.75, seed: 1405 };

const hook = "[Playful, upbeat, friendly narration]", upbeat = "[Warm, upbeat, friendly narration]";
const chapter = "[Warm, calm, friendly narration]", close = "[Warm and confident]";
export const lines = [
  { at: 0.3, tag: hook, text: "Everything feels like a lot? Step out of the scroll." },
  { at: 6.5, tag: upbeat, text: "This is Relax, with Luma. A pause from the scroll, and the day." },
  { at: 12.6, tag: chapter, text: "A quiet corner. Nothing to do. No timer, no catching up." },
  { at: 24.6, tag: chapter, text: "Want a little help? Follow one gentle step, like letting your shoulders settle." },
  { at: 36.6, tag: chapter, text: "With Plus, choose a guided session, in one of five voices." },
  { at: 48.6, tag: chapter, text: "Or just listen to a few kind words, for moments like after an awkward conversation." },
  { at: 60.6, tag: chapter, text: "Sounds for rest, from forest at dawn to a temple drum." },
  { at: 70.6, tag: chapter, text: "Want to remember something? Write a private reflection, only if you want to." },
  { at: 82.6, tag: chapter, text: "And from Home, Just rest is one tap away." },
  { at: 96.6, tag: upbeat, text: "The quiet corner, guidance and reflections come with Daywell. Voices, sounds and guided sessions come with Plus." },
  { at: 110.6, tag: close, text: "Daywell, from four ninety-nine a month. Make a date with yourself." },
];
