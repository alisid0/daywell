# Daywell promo v2: script (draft for the owner's approval)

14 October 2026. 120 seconds, vertical 1080×1920, for TikTok, Instagram Reels and YouTube Shorts. It replaces the v1 film's "four apps into one" story with **one day, from morning to night**, made of the things a person actually does in Daywell.

## Changes made while building (14 October)

- **The owner's choices:** Alice for the voice, and upbeat promo music for the rest. The music is ElevenLabs,
  120 BPM.
- **Scene times follow the measured music.** The scenes are now:
  - 0 hook
  - 7 brand ("Daywell" lands on the 8 s drop)
  - 12 one small thing
  - 18 breakfast
  - 28 desk break
  - 38 milk (on a drum break)
  - 46 dinner
  - 58 pause (the music goes muffled on the word "pause")
  - 72 bedtime (the music's soft stretch)
  - 88 morning
  - 98 Reading comfort
  - 104 plans
  - 110 end
- **The one small thing** is a typed request ("Focus on calling the bank for 10 minutes"), then "Here's the plan",
  then Pip's focus timer.
- **The breakfast photo is a stand-in** (the app's own salmon and quinoa bowl image), so the result reads
  "Salmon & quinoa bowl". A real breakfast photo can replace it later.
- **The helpers' real lines appear as text bubbles:**
  - Nori: "A little nourishment, without the judgement." and "Something good, made simple."
  - Bounce: "A stretch counts. A small walk counts, too."
  - Momo: "Pop it on the list. I'll keep it here for you."
  - Luma: "You can put the day down for a little while."
- **At 9 pm**, after "Just breathe", Luma gently rises and settles inside a slow breathing ring, as the app's
  companion movement does.
- **The day's eight dates gather into the sun** at the end, with "Make a date with yourself." and daywell.date.

## The idea

**One line:** your day is booked for everyone else, so Daywell helps you keep small dates with yourself: one small thing, breakfast, a desk break, dinner, a pause, winding down.

**Signature move:** every moment starts as an event in your day. The event card is the one shape that never cuts. It drops into the day, opens into the phone for that moment, then folds back into its time slot. Behind it, the sky moves from dawn to night and back to dawn. At the end, the day's events gather into one calendar, which folds into the Daywell sun.

**Feel:** calm but alive. Daywell is about relief, so the film goes from crowded to clear and from busy to quiet. Springs with a tiny overshoot, nothing bouncy, a fingertip with a tap ripple driving every change, and the camera pushing in on whatever is tapped.

## Script

✅ works in the app today (main, the `feat/plans` branch or the private test). ⏳ promised for version 1 but not built yet.

| # | Time | Moment | What you see | Words on screen | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | 0:00–0:05 | Hook | A day calendar fills fast with other people's plans: Team call, Reply to Jo, School forms, Dentist, Mum's present, Emails. At 0:03 they all slide down and one pink event drops in at the top: **You**. | "Your day is booked for everyone else." → "Make a date with yourself." | Story |
| 2 | 0:05–0:10 | Meet Daywell | The **You** event grows into the Daywell sun and name. The seven helpers pop in around it, one per beat. | "Daywell" / "Small, calm steps for your everyday basics." | ✅ |
| 3 | 0:10–0:18 | 7:00 · One small thing (Pip, Tock) | The event opens into Today. A fingertip adds a priority, "Call the bank", then starts a 10-minute focus. Tock's ring starts counting. | "Start with one small thing." → "Give it ten minutes." | ✅ |
| 4 | 0:18–0:30 | 8:00 · Breakfast (Nori) | Take a photo of the plate. Daywell reads it as "Eggs & greens on toast". Tap Save, and Undo appears. Then a quick swipe to the by-hand form. | "Snap your breakfast." → "Daywell notes it for you." `Plus` → "Or add it by hand." | ✅ private test |
| 5 | 0:30–0:44 | 10:30 · Desk break (Bounce) | Bounce: "A stretch counts." Desk break, 5 minutes, one step at a time: March in place with a 60-second ring, then Sit to stand ×10. Stop after step 4, then "Save what you did". | "Move with Bounce, one step at a time." → "Stop early? Save what you did." → "It still counts." | ✅ |
| 6 | 0:44–0:52 | 13:00 · Out of milk (Momo) | Type "we're out of milk" on Today. "Add milk to your shopping list?" Tap Add, and Momo ticks it onto the list. | "Type it the way you'd say it." → "It lands on the right list." `Plus` | ✅ |
| 7 | 0:52–1:08 | 17:30 · What's for dinner? (Nori). **The music lifts here.** | "What can my basket make?" Choose 3 meals and type "Three dinners for me, no mushrooms" (the typed path, not the microphone). Three dinners appear, with "2 of 3 meals covered by your basket". Tap "Review meals & save", and the missing items fly into the shopping list. | "What can my basket make?" → "Three dinners from what you have." → "The rest goes on your list." `Plus` | ✅ private test |
| 8 | 1:08–1:20 | 21:00 · Pause (Luma). Dusk; the music thins. | An endless feed scrolls. The "21:00 Pause" event slides over it and opens Just rest: "There's nothing to do here." Tap "A little guidance", and a breathing circle grows and settles on the beat. Choices: Quiet, A little guidance, A guided session `Plus`, A few kind words `Plus`. | "Still scrolling at 9 pm?" → "Take a pause instead." → "Nothing to do. Just breathe." | ✅ |
| 9 | 1:20–1:32 | 22:30 · Wind down (Luma). Night. | Luma: "You can put the day down for a little while." The sleep sounds: tap "Waves on sand", then "Stop after 30 min". The screen dims and stars come out. We hear a few seconds of the real recording. | "Wind down with a sleep sound." → "It fades out by itself." → "Nothing tracks you at night." `Plus` | ✅ (⏳ with the phone locked) |
| 10 | 1:32–1:42 | Next morning · Look back. Dawn; the music returns. | "How did you sleep?": fell asleep 23:10, woke 7:05, Save. Then the calendar's look-back: the week's walks, meals and sleep in one view. | "Note how you slept." → "Look back at your week." → "No streaks. No scores." | ✅ |
| 11 | 1:42–1:47 | Read it your way | The words reset themselves in Atkinson Hyperlegible, then Lexend, then OpenDyslexic, then grow to Larger. | "Read it your way." → "5 fonts. 3 text sizes." | ✅ |
| 12 | 1:47–1:54 | Two plans | The real plan screen. | "Daywell · £4.99 a month" / "Daywell Plus · £9.99 a month" | ✅ `feat/plans` |
| 13 | 1:54–2:00 | The end | The day's events fly back into one calendar: 7:00 One small thing, 8:00 Breakfast, 10:30 Desk break, 13:00 Milk, 17:30 Dinner, 21:00 Pause, 22:30 Wind down. The calendar folds into the sun. | "Make a date with yourself." / "daywell.date" | ✅ |

**A later swap for beat 7 (⏳):** when the Plus assistant ships, dinner can become "Ask in your own words → Here's the plan → Do it", the strongest reason to choose Plus. Until then, beat 7 uses the basket planner that already works.

## Voiceover (ElevenLabs, owner's request on 14 October)

One narrator, Eleven v4. The words on screen follow the voice exactly, as caption cards of two lines at most, so the film still works muted. Spoken numbers appear as figures on screen ("£4.99", "daywell.date"). Text in square brackets steers the delivery and isn't spoken. Each line is made separately, so one line can be redone without paying for the rest. ElevenLabs returns word timings, so every caption and reveal lands on its word.

| # | Starts | Line |
| --- | --- | --- |
| 1 | 0:00 | [Warm, calm narration] Your day is booked for everyone else. So make a date with yourself. |
| 2 | 0:05 | This is Daywell. Small, calm steps for your everyday basics. |
| 3 | 0:10 | Start with one small thing. Give it ten minutes. |
| 4 | 0:18 | Snap your breakfast, and Daywell notes it for you. Or add it by hand. |
| 5 | 0:30 | Move with Bounce, one step at a time. Stop early? Save what you did. It still counts. |
| 6 | 0:44 | Out of milk? Type it the way you'd say it. It lands on the right list. |
| 7 | 0:52 | What can my basket make? Three dinners from what you have. And the rest goes on your list. |
| 8 | 1:08 | [Softer and slower] Still scrolling at nine? Take a pause instead. Nothing to do. Just breathe. |
| 9 | 1:20 | [Quiet, measured narration] Wind down with a sleep sound. It fades out by itself. And nothing tracks you at night. |
| 10 | 1:32 | [Warm and a little brighter] In the morning, note how you slept. Look back at your week. No streaks. No scores. |
| 11 | 1:42 | Read it your way: five fonts, three text sizes. |
| 12 | 1:47 | Daywell is four ninety-nine a month. Daywell Plus is nine ninety-nine. |
| 13 | 1:54 | Make a date with yourself. Daywell dot date. |

About 180 words, roughly 65 seconds of speech in 120, so there's room to breathe, especially at night. The helpers don't get voices of their own, because they don't speak in the app. Their real hello lines appear as text bubbles, as they do in the app (Bounce: "A stretch counts. A small walk counts, too." Luma: "You can put the day down for a little while.").

**Voice samples** (`audio/voice-1…4`), each reading line 1:
1. Eric: the voice people hear in the app's recordings (American, smooth).
2. George: British, warm storyteller.
3. Lily: British, warm and velvety.
4. Alice: British, clear and friendly.

## Sound effects (ElevenLabs)

Every sound is made with ElevenLabs sound effects (`eleven_text_to_sound_v2`) and placed in the mix by its own peak, on the beat:

- Hook: notification pings as the calendar fills, and a soft whoosh and land as the **You** card drops.
- Helpers: a soft pop for each of the seven, slightly varied.
- Buttons: one soft tap sound for every tap the fingertip makes.
- The breakfast photo: a gentle phone camera shutter.
- Save, Add and ticks: a warm two-note chime.
- Typing "we're out of milk" and the dinner request: soft phone keyboard taps, in time with the letters appearing.
- Timers starting (focus, desk break): a gentle wooden tick.
- Missing items flying into the shopping list: a light swoosh.
- The 9 pm feed: soft scroll flicks.
- The end: a soft shimmer as the calendar folds into the sun, and one closing chime.

Four of these are already made as samples (`audio/sound-effects-preview.mp3`: tap, shutter, saved chime, pop).

**Daywell's own sound:** a few seconds of the real "Waves on sand" recording under the night scene.

## Music

Proposed: ElevenLabs Music (`music_v2_5`), composed to the film's exact timings with a composition plan. It's instrumental only, at about 96 BPM in one key throughout:

| Section | Time | Feel |
| --- | --- | --- |
| Busy | 0:00–0:05 | Quick plucks building, a little hectic |
| Reveal | 0:05–0:10 | A warm open chord; the groove starts gently |
| Morning | 0:10–0:30 | Light acoustic guitar and piano, brushed drums, bright |
| Midday | 0:30–0:52 | The same groove with a little more movement |
| Dinner lift | 0:52–1:08 | Fuller and uplifting |
| Dusk | 1:08–1:20 | Drums drop out; soft pads and piano |
| Night | 1:20–1:32 | Very sparse, low and calm, leaving room for "Waves on sand" |
| Dawn | 1:32–1:47 | The gentle groove returns |
| End | 1:47–2:00 | Resolves to a warm final chord |

ElevenLabs music is cleared for social media and advertising on paid plans. The beat grid is measured from the delivered music, and every cut, tap and pop is snapped to it. The music sits about 9 dB under the voice.

**Master:** −14 LUFS, true peak at or below −1 dBTP, measured on the delivered file.

## Credits

Paid audio was made only after the owner approved, with the balance checked first (`tools/credits.mjs`, a free call). The account and cost figures were shared with the owner directly and stay out of this public repo.

## Look

Daywell's own colours and fonts (Atkinson Hyperlegible). Real app screens are captured from the preview harness in each before and after state. Only the moving element is rebuilt on top, in the app's own styles. The words stay inside the safe area: nothing important in the bottom 20%, the right 12% or the top 10%. Two lines at most, and each line stays up long enough to read.

## Approved facts (nothing else goes on screen)

| On screen | Source |
| --- | --- |
| £4.99 / £9.99 a month (£39.99 / £79.99 a year) | `lib/plans.ts` on `feat/plans`, owner decisions 13 Oct |
| 5 fonts, 3 text sizes | `lib/reading-comfort.ts` |
| Desk break: 5 minutes, 5 steps | `content/workouts.json` |
| Sleep sounds, Stop after 15/30/60 min, fades out | `lib/sleep-sounds.ts` |
| "2 of 3 meals covered by your basket" | `app/food-plan-journey.tsx` wording |
| Seven helpers and their jobs | `content/companions.json` |
| No streaks or scores; nothing tracks you at night | `docs/product-areas.md` |

The times of day, "Call the bank", the meals and the other events are a sample day, shown with the demo data.

## Never

- Never call Daywell a dating app. "A date with yourself" is self-care wordplay.
- Everyday wellness only: no claims about better sleep, weight, anxiety or health.
- No free trial, because there isn't one.
- No invented numbers, ratings, user counts or reviews.
- No stock faces, and no other company's logos. The breakfast photo must be ours or properly licensed.
- No alarms (they only ring while the app is open), no live voice and no "Talk through my meal plan" microphone (both leave version 1).
- The narrator is clearly a narrator. The helpers don't speak aloud, because they don't in the app; their lines are text bubbles.
- Post only once everything shown works on real phones. Beat 9 needs the phone apps if it suggests the phone is locked.

## Decisions for the owner

1. Approve the script and the voiceover lines, or edit any line.
2. Pick the voice: 1 Eric (the app's own voice), 2 George, 3 Lily or 4 Alice.
3. Music: ElevenLabs Music composed to the film's timings (proposed), or a free-licence Mixkit track.
