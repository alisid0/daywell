// Daywell shorts: Eat, with Nori (marketing/shorts/SCRIPTS.md, approved by the owner on 15 October 2026).
// `at` is when each line starts, in seconds: hook 0, title 6, chapters 12, 24, 34, 46, 58, 70, 82, what's included 96,
// close 110 (120 BPM, so every chapter starts on a bar). `tag` steers delivery and isn't spoken.
export const voice = { name: "Alice", id: "Xb7hH8MSUJpSbSDYk0k2", model: "eleven_v4", stability: 0.5, similarity: 0.75, seed: 1405 };

const hook = "[Playful, upbeat, friendly narration]", upbeat = "[Warm, upbeat, friendly narration]";
const chapter = "[Warm, upbeat, friendly narration]", close = "[Warm and confident]";
export const lines = [
  { at: 0.3, tag: hook, text: "What's for dinner? What's in the fridge? Did you even have lunch?" },
  { at: 6.5, tag: upbeat, text: "This is Eat, with Nori. Everyday food, made easier." },
  { at: 12.6, tag: chapter, text: "Snap your plate. Daywell reads it, you check the portion, and it's saved. Wrong? Edit it any time." },
  { at: 24.6, tag: chapter, text: "Rather type? Food and portions are enough. Add nutrition only if you know it." },
  { at: 34.6, tag: chapter, text: "Keep a basket of what's at home. Used two eggs? Note it, and it's updated." },
  { at: 46.6, tag: chapter, text: "Ask what your basket can make, and get a few meals from what you already have." },
  { at: 58.6, tag: chapter, text: "Anything missing goes on your shopping list. Tick it off in the shop, then put it away." },
  { at: 70.6, tag: chapter, text: "Plan the next few days by hand, or borrow an idea from Nori's recipes." },
  { at: 82.6, tag: chapter, text: "Look back at your meals and your week, without judgement." },
  { at: 96.6, tag: upbeat, text: "Your basket, shopping and food log come with Daywell. Photos and meal ideas come with Plus." },
  { at: 110.6, tag: close, text: "Daywell, from four ninety-nine a month. Make a date with yourself." },
];
