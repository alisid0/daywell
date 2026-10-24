// Daywell shorts: Daywell in your phone's browser (marketing/shorts/SCRIPTS.md, approved by the owner on 15 October 2026).
// `at` is when each line starts, in seconds: hook 0, title 6, chapters 12, 22, 34, 46, 58, 72, 84, all of it 98,
// close 110 (120 BPM, so every chapter starts on a bar). `tag` steers delivery and isn't spoken.
// Sign-in comes after opening from the home screen, because an iPhone home-screen web app keeps its own storage.
export const voice = { name: "Alice", id: "Xb7hH8MSUJpSbSDYk0k2", model: "eleven_v4", stability: 0.5, similarity: 0.75, seed: 1405 };

const hook = "[Playful, upbeat, friendly narration]", upbeat = "[Warm, upbeat, friendly narration]";
const chapter = "[Warm, upbeat, friendly narration]", close = "[Warm and confident]";
export const lines = [
  { at: 0.3, tag: hook, text: "Daywell, right in your phone's browser." },
  { at: 6.5, tag: upbeat, text: "Here's how to use Daywell as a web app." },
  { at: 12.6, tag: chapter, text: "Open your browser and go to daywell dot date." },
  { at: 22.6, tag: chapter, text: "On iPhone, tap Share, then Add to Home Screen." },
  { at: 34.6, tag: chapter, text: "On Android, open the menu and tap Add to home screen." },
  { at: 46.6, tag: chapter, text: "Now Daywell opens from your home screen, like any other app." },
  { at: 58.6, tag: chapter, text: "Type your email. We send a six-digit code. No password to remember." },
  { at: 72.6, tag: chapter, text: "It's the same account everywhere: your phone, your laptop and the Daywell app." },
  { at: 84.6, tag: chapter, text: "Choose your plan in the Daywell app for iPhone or Android, then use it in your browser too." },
  { at: 98.6, tag: upbeat, text: "Eat, Move, Sleep and Relax, in one calm place, wherever you are." },
  { at: 110.6, tag: close, text: "Daywell dot date. Make a date with yourself." },
];
