// The promo voiceover (SCRIPT.md). Owner picked Alice on 14 October 2026. `tag` steers delivery and isn't spoken;
// `at` is when the line starts in the film, in seconds (scenes follow the measured music: 0 hook, 7 brand with "Daywell" on the 8 s drop, 12, 18, 28, 38, 46, 58 pause, 72 bedtime in the soft section, 88, 98, 104, 110).
export const voice = { name: "Alice", model: "eleven_v4", stability: 0.5, similarity: 0.75, seed: 1405 };

const upbeat = "[Warm, upbeat, friendly narration]";
export const lines = [
  { at: 0.3, tag: upbeat, text: "Your day is booked for everyone else. So make a date with yourself." },
  { at: 7.0, tag: upbeat, text: "This is Daywell. Small, calm steps for your everyday basics." },
  { at: 12.8, tag: upbeat, text: "Start with one small thing. Give it ten minutes." },
  { at: 18.6, tag: upbeat, text: "Snap your breakfast, and Daywell notes it for you. Or add it by hand." },
  { at: 28.6, tag: upbeat, text: "Move with Bounce, one step at a time. Stop early? Save what you did. It still counts." },
  { at: 38.6, tag: upbeat, text: "Out of milk? Type it the way you'd say it. It lands on the right list." },
  { at: 46.6, tag: upbeat, text: "What can my basket make? Three dinners from what you have. And the rest goes on your list." },
  { at: 58.6, tag: "[Softer, slower and calm]", text: "Still scrolling at nine? Take a pause instead. Nothing to do. Just breathe." },
  { at: 72.6, tag: "[Quiet, gentle, calm narration]", text: "Wind down with a sleep sound. It fades out by itself. And nothing tracks you at night." },
  { at: 88.6, tag: "[Warm and brighter again]", text: "In the morning, note how you slept. Look back at your week. No streaks. No scores." },
  { at: 98.4, tag: upbeat, text: "Read it your way: five fonts, three text sizes." },
  { at: 104.4, tag: upbeat, text: "Daywell is four ninety-nine a month. Daywell Plus is nine ninety-nine." },
  { at: 110.4, tag: "[Warm and confident]", text: "Make a date with yourself. Daywell dot date." },
];
