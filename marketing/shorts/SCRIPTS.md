# Daywell shorts: Eat, Move, Sleep, Relax, and the web app

Approved by the owner on 15 October 2026 ("approved, upbeat for all, build the web app basics") and filmed on
15–16 October. Five 2-minute vertical videos (1080×1920, 60 fps) for TikTok, Instagram Reels and YouTube Shorts.
Owner's request: "each eat, sleep, move, relax 2 minute shorts … tell this is included in app … use it in your
phone browser as a web app (2 minute video explaining this too)". They use the promo pipeline in
`marketing/promo/` (the shared shorts engine and one folder per film in `marketing/promo/shorts/`) and the
`promo-video` skill.

## Where things stand (16 October 2026)

- **All five films are rendered and checked:** −14 LUFS, no glitches, no frozen stretches. The source for each is in
  `marketing/promo/shorts/<film>/`. The MP4s aren't kept in Git; render them again with the commands in
  `marketing/promo/README.md`.
- **Line changes since approval.** Approved by the owner on 15 October ("keep all three fixes"):
  - Eat 3: "Wrong? Undo." became "Wrong? Edit it any time." (a saved meal is edited, not undone).
  - Eat 5: "One tap, and it's updated." became "Note it, and it's updated." (noting what you used takes more than
    one tap).
  - The web film signs in after adding Daywell to the home screen. An iPhone home-screen web app keeps its own
    storage, so signing in first in the browser wouldn't carry over.
- **Made while filming, waiting for the owner's OK** (both already recorded and in the films):
  - Sleep 3: "…and when to be in bed" became "…and when to wake up". The app asks for "Wind down at" and "Wake up
    at".
  - Relax 9: "And from anywhere in Daywell, Just rest is one tap away" became "And from Home, Just rest is one tap
    away". The Just rest button is on Home, not on every screen.
- **The films show work that isn't merged yet:** the new Eat, Move, Sleep and Relax design (branches
  `design/eat-ui` and `design/areas-ui`, both approved) and the web app basics (home-screen icon, manifest, full
  screen; branch `feat/web-app-basics`).

## Series format (all five)

- **0:00–0:06 Hook:** one everyday moment in the area.
- **0:06–0:12 Title:** "This is Eat, with Nori" (and so on): the helper and the area's real home screen.
- **0:12–1:36 Seven chapters, about 12 s each.** Each starts as an event card (the promo's signature move) that
  opens into the real app screen, with a badge saying what includes it: **Included in Daywell** (£4.99) or
  **Included in Daywell Plus** (£9.99). The web film's badges say **Works on both plans**, and its plan chapter says
  **From £4.99 a month**.
- **1:36–1:50 What's included:** all seven chapters on one card, each ticked with its plan. The web film shows the
  four areas instead ("One calm place").
- **1:50–2:00 Close:** the price and "Make a date with yourself. daywell.date".
- **Voice:** Alice (ElevenLabs `eleven_v4`), about 150–170 words a video, so there's room to breathe. The words on
  screen follow the voice.
- **Sound:** one ElevenLabs music take per video (upbeat, 120 BPM, for all five), composed to its sections; the
  promo's sound effects; Daywell's own sounds where they belong (Relax plays a recorded kind word and the Temple
  drum).
- **Screens:** the real app with the sample week (`?promo=1`), captured at phone size.

Plan facts come from `lib/plans.ts`. Daywell is "everything by hand"; Plus adds photos, meal plans from the
basket, sleep sounds, guided sessions and kind words, and spoken workout cues. ✅ means it works in the app today.
⏳ means it isn't ready yet, and the video can't be posted until it is.

## 1. Eat, with Nori

| # | Time | Chapter | Voiceover | Included in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | 0:00 | Hook | What's for dinner? What's in the fridge? Did you even have lunch? | | |
| 2 | 0:06 | Title | This is Eat, with Nori. Everyday food, made easier. | | ✅ |
| 3 | 0:12 | Snap a meal | Snap your plate. Daywell reads it, you check the portion, and it's saved. Wrong? Edit it any time. | Plus | ✅ |
| 4 | 0:24 | Add it by hand | Rather type? Food and portions are enough. Add nutrition only if you know it. | Daywell | ✅ |
| 5 | 0:34 | Your food basket | Keep a basket of what's at home. Used two eggs? Note it, and it's updated. | Daywell | ✅ |
| 6 | 0:46 | What can my basket make? | Ask what your basket can make, and get a few meals from what you already have. | Plus | ✅ |
| 7 | 0:58 | Just what's missing | Anything missing goes on your shopping list. Tick it off in the shop, then put it away. | Daywell | ✅ |
| 8 | 1:10 | Plans and ideas | Plan the next few days by hand, or borrow an idea from Nori's recipes. | Daywell | ✅ |
| 9 | 1:22 | Look back | Look back at your meals and your week, without judgement. | Daywell | ✅ |
| 10 | 1:36 | What's included | Your basket, shopping and food log come with Daywell. Photos and meal ideas come with Plus. | | |
| 11 | 1:50 | Close | Daywell, from four ninety-nine a month. Make a date with yourself. | | |

Screens: Eat home, the photo flow (still the stand-in photo unless the owner sends one), the by-hand form, Food
basket with "I ate / used some", "What can my basket make?", Shopping ("Just what's missing", "I bought this", "Put
shopping away"), Next meals ("A few days, gently planned", "A little inspiration"), and the 7-day strip with "Your
meal story".

## 2. Move, with Bounce

| # | Time | Chapter | Voiceover | Included in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | 0:00 | Hook | Sat at your desk all day? Good news: a stretch counts. | | |
| 2 | 0:06 | Title | This is Move, with Bounce. A little stronger, at your pace. | | ✅ |
| 3 | 0:12 | Eighteen routines | Eighteen routines, from a five-minute desk break to the gym. Anywhere, no equipment, at home or at the gym. | Daywell | ✅ |
| 4 | 0:24 | One step at a time | Bounce takes you through one step at a time, with a timer for each. | Daywell | ✅ |
| 5 | 0:36 | Easier or harder | Too much? Make a step easier. Feeling strong? Make it harder. | Daywell | ✅ |
| 6 | 0:46 | Steps read aloud | With Plus, Bounce reads each step aloud, so your eyes can stay off the screen. | Plus | ✅ (recorded cues planned) |
| 7 | 0:58 | Stop early, it counts | Stop early? Save what you really did. It still counts. | Daywell | ✅ |
| 8 | 1:08 | Record any move | A walk, a swim, a dance in the kitchen. Record any move by hand. | Daywell | ✅ |
| 9 | 1:20 | Fifteen minutes, then look back | No plan? Start fifteen minutes with Bounce. Then look back at your week, with no streaks. | Daywell | ✅ |
| 10 | 1:36 | What's included | Every routine, timer and record comes with Daywell. Plus adds Bounce's voice. | | |
| 11 | 1:50 | Close | Daywell, from four ninety-nine a month. Make a date with yourself. | | |

Routine facts: 18 routines (`content/workouts.json`: 9 with no equipment, 4 at home, 5 at the gym); Easier and
Harder swaps; "Read each step aloud"; sets, reps and weights in "Review and save". Activity calories stay hidden
unless calorie tracking is on, so the video doesn't mention them.

## 3. Sleep, with Luma

| # | Time | Chapter | Voiceover | Included in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | 0:00 | Hook | Bedtime came and went again? Let the day soften. | | |
| 2 | 0:06 | Title | This is Sleep, with Luma. Wind down well, and notice your rest. | | ✅ |
| 3 | 0:12 | Your evening rhythm | Choose when to wind down and when to wake up. Change it any time. (changed while filming; waiting for the owner's OK) | Daywell | ✅ |
| 4 | 0:24 | Wind down with Luma | When it's time, Luma keeps you quiet company. You can leave the day here. | Daywell | ✅ |
| 5 | 0:36 | Sleep sounds | Pick a sleep sound, from forest at night to waves on sand. It fades out by itself. | Plus | ✅ (⏳ playing with the phone locked needs the phone apps) |
| 6 | 0:48 | A softer goodnight | Or listen to a guided track, like A softer goodnight. | Plus | ✅ |
| 7 | 1:00 | Nothing at night | Then there's nothing to do, and nothing tracking you at night. | Daywell | ✅ |
| 8 | 1:10 | Morning note | In the morning, note when you fell asleep, and how you feel. | Daywell | ✅ |
| 9 | 1:22 | Your sleep journal | Look back at your week in a gentle journal. No scores. | Daywell | ✅ |
| 10 | 1:36 | What's included | Your rhythm, wind-down and sleep journal come with Daywell. Sleep sounds and guided tracks come with Plus. | | |
| 11 | 1:50 | Close | Daywell, from four ninety-nine a month. Make a date with yourself. | | |

No wake alarm in Sleep (owner decision: not until the phone app can ring with Daywell closed), so the video doesn't
show one. "Wake up at" in line 3 is the time the evening rhythm plans around, not an alarm.

## 4. Relax, with Luma

| # | Time | Chapter | Voiceover | Included in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | 0:00 | Hook | Everything feels like a lot? Step out of the scroll. | | |
| 2 | 0:06 | Title | This is Relax, with Luma. A pause from the scroll, and the day. | | ✅ |
| 3 | 0:12 | Your quiet corner | A quiet corner. Nothing to do. No timer, no catching up. | Daywell | ✅ |
| 4 | 0:24 | A little guidance | Want a little help? Follow one gentle step, like letting your shoulders settle. | Daywell | ✅ |
| 5 | 0:36 | Guided sessions | With Plus, choose a guided session, in one of five voices. | Plus | ✅ |
| 6 | 0:48 | Little words of comfort | Or just listen to a few kind words, for moments like after an awkward conversation. | Plus | ✅ |
| 7 | 1:00 | Sounds for rest | Sounds for rest, from forest at dawn to a temple drum. | Plus | ✅ |
| 8 | 1:10 | A private reflection | Want to remember something? Write a private reflection, only if you want to. | Daywell | ✅ |
| 9 | 1:22 | Just rest, from Home | And from Home, Just rest is one tap away. (changed while filming; waiting for the owner's OK) | Daywell | ✅ |
| 10 | 1:36 | What's included | The quiet corner, guidance and reflections come with Daywell. Voices, sounds and guided sessions come with Plus. | | |
| 11 | 1:50 | Close | Daywell, from four ninety-nine a month. Make a date with yourself. | | |

Library facts: three guided sessions in five voices ("Step out of the scroll", "Home, at last", "Let the journey
end"), six guided tracks, and about 30 sets of "little thoughts". These are everyday comfort, never treatment
claims.

## 5. Daywell in your phone's browser

| # | Time | Step | Voiceover | Status |
| --- | --- | --- | --- | --- |
| 1 | 0:00 | Hook | Daywell, right in your phone's browser. | |
| 2 | 0:06 | Title | Here's how to use Daywell as a web app. | |
| 3 | 0:12 | Open daywell.date | Open your browser and go to daywell dot date. | ⏳ daywell.date isn't live yet |
| 4 | 0:22 | iPhone: Add to Home Screen | On iPhone, tap Share, then Add to Home Screen. | ✅ icon built on `feat/web-app-basics`; ⏳ not merged |
| 5 | 0:34 | Android: Add to home screen | On Android, open the menu and tap Add to home screen. | ✅ manifest built on `feat/web-app-basics`; ⏳ not merged |
| 6 | 0:46 | Opens like an app | Now Daywell opens from your home screen, like any other app. | ✅ full screen built on `feat/web-app-basics`; ⏳ not merged |
| 7 | 0:58 | Sign in with a code | Type your email. We send a six-digit code. No password to remember. | ✅ built (#56, #57); ⏳ goes live with the deploy and email sending |
| 8 | 1:12 | One account everywhere | It's the same account everywhere: your phone, your laptop and the Daywell app. | ✅ |
| 9 | 1:24 | Choosing a plan | Choose your plan in the Daywell app for iPhone or Android, then use it in your browser too. | ✅ matches the plan screen; ⏳ needs the store apps live |
| 10 | 1:38 | All of it | Eat, Move, Sleep and Relax, in one calm place, wherever you are. | |
| 11 | 1:50 | Close | Daywell dot date. Make a date with yourself. | |

Notes:
- Reading comfort is saved per device, so the video doesn't claim it follows you between devices.
- The browser, keyboard, share sheet, menu, home screens and laptop are drawn as simple generic illustrations, not
  copies of Apple's or Google's UI. Everything inside them is the real app.

## Before any of these are posted

- Everything marked ⏳ must be working.
- The new design (`design/eat-ui`, `design/areas-ui`) and the web app basics (`feat/web-app-basics`) must be merged
  and live, because the films show them.
- The owner confirms the two lines changed while filming (Sleep 3, Relax 9).
- Never call Daywell a dating app. Everyday wellness only.

## Cost

About 1,500 credits of voice and one music take (about 2,300 credits) per video, so about 20,000 credits for all
five. The sound effects are reused.

## Decisions

Made on 15 October: the five scripts, upbeat music for all five, and building the web app basics.

Still open:
- **Paying on the web:** today the web says to subscribe in the iPhone or Android app, and the web film says the
  same. Web payments (for example Stripe) aren't built.
- **Posting:** the web film can only be posted once daywell.date is live.
