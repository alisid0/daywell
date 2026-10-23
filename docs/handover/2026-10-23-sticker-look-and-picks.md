# Handover: the sticker look, and the picks still to make (23 October 2026)

```text
Session date: 23 October 2026
Branch and PR: docs/handover-2026-10-23, from main 915c816 (this file only). PR to main. The day's app work is already
  in main through #78, #79 and #80. Not deployed: the private app still runs main 3e2f12b (deployed the morning of 23
  October). The next deploy ships #78, #79 and #80 together, and only when the owner says "deploy".
What changed (all merged on the owner's word, each after an approved preview and green checks):
  - #78 Design fixes 7–11 (abce285): a talk button in the header; one set of names (Luma, Nori and Bounce; Focus,
    Timers, Alarms, Trolley, Eat and Move); "Hear this" reads the meal review in the phone's own voice (the paid
    readout route is gone); every pop-up opens as a bottom sheet; quieter calorie wording while calorie tracking is off.
  - #79 (2c2604c): calories people recorded show again while calorie tracking is off. Only "calories not added" stays
    hidden.
  - #80 Daywell's personality (915c816): the owner's recipe from the button tuner ("approved, full"). Solid buttons
    with a dark outline and a hard shadow (main forest #2f7a55, second peach #ffc7a6, round icons mint #a9dfd4, chips
    forest when chosen), and the same look for cards, tab bars, the Talk to Daywell key, fields and switches. See
    app/personality.css, docs/personality.md and tests/personality.test.mjs.
  - Owner decisions recorded today:
    - "There must be a calorie counter … for exercise and food both … maybe even sleep." This also settles the
      question left open in #78: the AI's one-line meal summary stays as it is.
    - "Things which are customizable should remain customizable." The owner's design picks become the default look or
      a new option, never a lock on what people choose for themselves in Your style (palette, backdrop, lettering,
      buttons) and Reading comfort (font, size, spacing).
Checks performed and their results:
  - #78 and #79: npm run check (322 tests) and npm run lint:changed passed. #80: npm run check (326 tests) and npm run
    lint:changed passed. GitHub checks were green before each merge. Each was tried in the phone-size preview harness
    against its approved preview.
  - This branch: documentation only; diff and link review.
What is not yet verified:
  - Nothing from today has run on the private app or a real phone yet.
  - Known gap in #80: the sticker buttons also replace Pillowy, Pebbles and Simple for people who picked one of those
    in Your style. The fix is part of "Your Picks on Daywell" below and waits for "approved".
Remaining work / next step (owner decisions first):
  The previews are private pages in the owner's claude.ai artifacts, named in quotes below. A page with a save button
  keeps the picks with the page itself, so they can be made from any computer signed in to claude.ai. If the desktop
  app's side panel can't save, open the page in a web browser, or copy its recipe into the chat.
  1. "Calendar and Time Pickers" (new tonight). Pick one version for each part:
     - how long a timer runs: chips and nudges, wheels, or a dial;
     - what time something happens (alarms, plans, bedtime, the sleep log): wheels, an hour grid, or likely times
       with five-minute nudges;
     - the calendar: a sticker month, a week strip with the day's plans as bubbles, or an activity month.
     Today, Timers offer 5, 15, 25 and 50 minute chips and a minutes box; alarms, Add a plan and the sleep log use
     the phone's own time and date boxes; the calendar is a plain month grid with a "Go to date" box. Next: show the
     picks on the real screens as a preview, then build only after "approved".
  2. "Your Picks on Daywell": waits for "approved". One PR builds both parts:
     a. Sticker as a choice people can change. Add "sticker" to buttonLooks in lib/appearance.ts and make it the
        default for every style and in referenceLook. Move saved looks to sticker once (bump the saved look's
        version), so testers start on it and can switch back in Your style, Mix your own, Buttons.
        app/design-switcher.tsx sets data-personality="sticker" on <html>, and data-scheme="dark" for the dark
        palettes (Dusk and Lake). Scope app/personality.css to the sticker choice and key its dark rule on
        data-scheme instead of the style.
     b. The owner's style-picker picks, with sticker only:
        - tags (.mv-pill, .sleep-feel, .kitchen-count) become stamps: a dashed 2 px forest outline, uppercase
          monospace 14 px text, turned 2 degrees;
        - section headings (.well-section-title h2, .section-title h2, .mv-quick > h2, .rest-unwind > h2,
          .sleep-sounds > h2) get a 34 px peach sticker icon that suits the section;
        - lists (.food-story-row, .task-row, .calendar-history-row) become bubbles: 26 px corners, a 10 per cent
          forest tint, no lines between them;
        - links (.host-type, .host-library-link, .rest-library-link, .well-text-button, .calendar-link, .plan-link,
          .mv-link, .food-capture-link, .calendar-today, .host-settings-toggle, main p a) get a mint highlighter and
          bold text instead of an underline;
        - small accents turn forest (#9fdcc4 in the dark looks), and Look back's period buttons (Selected month,
          Selected day, All time in .calendar-history-tools) become sticker chips.
        The headline font, background, cards, numbers, list icons and calm motion stay as they are. Picking Pillowy,
        Pebbles or Simple turns all of this off and brings back the palette's own accent. Add tests for the studio
        choice, the one-time move to sticker and the scoping.
  3. "Calories for Moves and Sleep": waits for "approved". Moves get an estimate from the 2024 Adult Compendium of
     Physical Activities, (MET − 1) × weight × hours, which people can change, labelled "Daywell's estimate", with
     week totals in Move. Sleep shows resting energy for the hours asleep (Mifflin–St Jeor ÷ 24 × hours) on Last
     night's rest, as information only. Only with calorie tracking on and the person's consented body details, worked
     out on the phone, with nothing sent to AI. Calorie tracking stays off by default, with no deficits or
     "earn it back" wording.
  4. "A Calmer Daywell": waits for "approved". Build order: reminders with a "Coming up" card (this needs
     @capacitor/local-notifications), then Your week, then a calmer Today and fewer places, each in its own PR.
  5. "Why Daywell Exists": the owner's calls on longevity lines (recommended: keep the 8 October general-wellness rule
     for launch), which gap to preview first, a research library in the repo, and which ending to use.
  6. After those, the screen-by-screen pass carries on one area at a time: Today, Move, Eat (Plate, Kitchen, Week and
     Trolley), Sleep, Relax, the extras and calendar, settings and style, first visit and sign-in, then the looks, dark
     mode and larger text. Each area gets a before-and-after preview and its own PR.
  7. Open PRs: draft #73 needs main merged in when the receipt work resumes; Dependabot #52, #53, #76 and #77; #60
     (promo v2); drafts #34 and #47.
  8. Clean-ups: the unused ElevenLabs chat code (app/use-eleven-agent.ts, app/api/voice, lib/host-input.ts,
     lib/voice-tools.ts) and the retired food, groceries and welcome code (app/welcome-flow.tsx is no longer used).
Setup or migration steps needed on the other machine:
  - None. No database migrations since main 3e2f12b. Fetch main (915c816) before working.
Any work still local, and why:
  - None in the repo. The preview harness and its preview layers (.harness/, ignored by Git) and the scripts that
    built the preview pages stay on the first machine as local tools, as before. The previews are published and the
    plans above are complete, so carrying on elsewhere doesn't need them. A real-screen preview needs a local preview
    harness on whichever machine makes it.
```
