// The real Daywell screens for "Move, with Bounce", in chapter order. Each group loads the harness once (?promo=1,
// Sam's sample week) and its shots follow on from each other, so every state is reached by really using the app.
// Steps: click/type/scroll/scrollY/select/box/boxAs/boxMaybe/tag/tickShots/typeShots/file/wait/eval (tools/capture.mjs).

// Tags a routine's Start button by the routine's name (opening "More routines" first if it's further down).
const startOf = (name, as) => [
  ["eval", `(() => { const find = () => [...document.querySelectorAll('.routine-card')].find(c => c.innerText.startsWith('${name}')); if (!find()) [...document.querySelectorAll('button')].find(b => b.innerText.startsWith('More routines'))?.click(); return true; })()`],
  ["wait", 600],
  ["eval", `(() => { const card = [...document.querySelectorAll('.routine-card')].find(c => c.innerText.startsWith('${name}')); card.setAttribute('data-promo', '${as}-card'); card.querySelector('button').setAttribute('data-promo', '${as}'); return true; })()`],
];
const player = (y = -250) => [["scrollY", "css=.routine-player", y], ["wait", 300]];

export const plan = [
  // Title and chapter 1: eighteen routines, anywhere to the gym (Daywell).
  { query: "view=move&promo=1&still", clock: "2026-10-14T10:30:00", shots: [
    { name: "m-home", steps: [["wait", 300]] },
    { name: "m1-list", steps: [["scrollY", "Your training partner", 120], ["wait", 300], ["boxAs", "=Anywhere", "any"], ["boxAs", "=No equipment", "none"], ["boxAs", "=Around the house", "house"], ["boxAs", "=Gym", "gym"], ["boxMaybe", "More routines", "more"]] },
    { name: "m1-more", steps: [["click", "More routines", "more"], ["wait", 700], ["scrollY", "Your training partner", -560], ["wait", 300]] },
    { name: "m1-anywhere", steps: [["scrollY", "Your training partner", 120], ["wait", 300], ["click", "=Anywhere", "any"], ["wait", 600], ["scrollY", "Your training partner", 120], ["wait", 300], ["boxAs", "=No equipment", "none"]] },
    { name: "m1-none", steps: [["click", "=No equipment", "none"], ["wait", 600], ["scrollY", "Your training partner", 120], ["wait", 300], ["boxAs", "=Around the house", "house"]] },
    { name: "m1-house", steps: [["click", "=Around the house", "house"], ["wait", 600], ["scrollY", "Your training partner", 120], ["wait", 300], ["boxAs", "=Gym", "gym"]] },
    { name: "m1-gym", steps: [["click", "=Gym", "gym"], ["wait", 600], ["scrollY", "Your training partner", 120], ["wait", 300]] },
  ] },
  // Chapter 2: one step at a time, with a timer for each (Daywell).
  { query: "view=move&promo=1&still", clock: "2026-10-14T10:30:00", shots: [
    { name: "m2-desk", steps: [...startOf("Desk break", "desk"), ["scrollY", "css=[data-promo=desk-card]", 330], ["wait", 300], ["boxAs", "css=[data-promo=desk]", "start"], ["boxAs", "css=[data-promo=desk-card]", "card"]] },
    { name: "m2-step1", steps: [["click", "css=[data-promo=desk]", "start"], ["wait", 1600], ...player(8), ["boxMaybe", "Step 1 of 5", "step"], ["boxMaybe", "Lift your knees", "cue"]] },
    { name: "m2-step1b", steps: [...player(), ["boxAs", "=Start timer", "timer"], ["boxAs", "=March in place", "title"]] },
    { name: "m2-timer", steps: [["click", "=Start timer", "timer"], ["wait", 2600], ...player(), ["tag", "^\\d:\\d\\d$", "step-digits"], ["boxMaybe", "css=[data-promo=step-digits]", "digits"], ["boxAs", "=Done, next", "next"]] },
    { name: "m2-ticks", steps: [["tickShots", "css=[data-promo=step-digits]", 5, "m2-tick"]] },
    { name: "m2-step2", steps: [["click", "=Done, next", "next"], ["wait", 900], ["eval", "__advance(70000)"], ...player(), ["boxAs", "=Done, next", "next"]] },
  ] },
  // Chapter 3: easier or harder (Daywell). Hotel room fifteen starts with a squat that has both swaps.
  { query: "view=move&promo=1&still", clock: "2026-10-14T18:00:00", shots: [
    { name: "m3-squat", steps: [...startOf("Hotel room fifteen", "hotel"), ["scroll", "css=[data-promo=hotel]", "center"], ["click", "css=[data-promo=hotel]", "start"], ["wait", 1600], ...player(), ["boxAs", "Easier: Chair sit-to-stand", "easier"], ["boxAs", "Harder: Split squat", "harder"], ["boxAs", "=Bodyweight squat", "title"]] },
    { name: "m3-easy", steps: [["click", "Easier: Chair sit-to-stand", "easier"], ["wait", 700], ...player(), ["boxAs", "Harder: Bodyweight squat", "harder"], ["boxMaybe", "=Chair sit-to-stand", "title"]] },
    { name: "m3-back", steps: [["click", "Harder: Bodyweight squat", "harder"], ["wait", 700], ...player(), ["boxAs", "Harder: Split squat", "harder"]] },
    { name: "m3-hard", steps: [["click", "Harder: Split squat", "harder"], ["wait", 700], ...player(), ["boxMaybe", "=Split squat", "title"]] },
  ] },
  // Chapter 4: with Plus, Bounce reads each step aloud.
  { query: "view=move&promo=1&still", clock: "2026-10-14T07:40:00", shots: [
    { name: "m4-player", steps: [...startOf("Desk break", "desk"), ["scroll", "css=[data-promo=desk]", "center"], ["click", "css=[data-promo=desk]", "start"], ["wait", 1600], ...player(8), ["boxAs", "Read each step aloud", "aloud"], ["boxMaybe", "Lift your knees", "cue"]] },
    { name: "m4-aloud", steps: [["click", "Read each step aloud", "aloud"], ["wait", 800], ...player(8), ["boxMaybe", "Hear this step", "hear"], ["boxMaybe", "Lift your knees", "cue"]] },
  ] },
  // Chapter 5: stop early, save what you really did; it still counts (Daywell).
  { query: "view=move&promo=1&still", clock: "2026-10-14T12:30:00", shots: [
    { name: "m5-step", steps: [...startOf("Desk break", "desk"), ["scroll", "css=[data-promo=desk]", "center"], ["click", "css=[data-promo=desk]", "start"], ["wait", 1600], ["click", "=Start timer", "timer"], ["wait", 1500], ["eval", "__advance(65000)"], ["click", "=Done, next", "next"], ["wait", 900], ["eval", "__advance(60000)"], ["click", "=Done, next", "next2"], ["wait", 900], ["eval", "__advance(50000)"], ...player(), ["boxAs", "=End routine", "end"]] },
    { name: "m5-ended", steps: [["click", "=End routine", "end"], ["wait", 1500], ...player(8), ["boxAs", "Review and save", "review"]] },
    { name: "m5-review", steps: [["click", "Review and save", "review"], ["wait", 1800], ["boxMaybe", "=Desk break", "name"]] },
    { name: "m5-save", steps: [["scroll", "=Save workout", "center"], ["wait", 400], ["boxAs", "=Save workout", "save"]] },
    { name: "m5-done", steps: [["click", "=Save workout", "save"], ["wait", 1800], ["scrollY", "Your movement today", 110], ["wait", 300], ["boxMaybe", "Movement logged", "logged"]] },
  ] },
  // Chapter 6: record any move by hand (Daywell).
  { query: "view=move&promo=1&still", clock: "2026-10-14T19:30:00", shots: [
    { name: "m6-today", steps: [["scrollY", "Your movement today", 110], ["wait", 300], ["boxAs", "=Record a move", "record"]] },
    { name: "m6-menu", steps: [["click", "=Record a move", "record"], ["wait", 900], ["boxAs", "A walk or other activity", "walk"]] },
    { name: "m6-form", steps: [["click", "A walk or other activity", "walk"], ["wait", 1200], ["boxAs", "css=[role=dialog] input", "name"]] },
    { name: "m6-typed", steps: [["typeShots", "css=[role=dialog] input", "Dance in the kitchen", 2, "m6-typing"], ["wait", 200], ["boxAs", "Save entry", "save"]] },
    { name: "m6-saved", steps: [["click", "Save entry", "save"], ["wait", 1500], ["scrollY", "Your movement today", 110], ["wait", 300], ["boxMaybe", "Dance in the kitchen", "entry"]] },
  ] },
  // Chapter 7: no plan? Fifteen minutes with Bounce; then look back at the week, with no streaks (Daywell).
  { query: "view=move&promo=1&still", clock: "2026-10-14T17:45:00", shots: [
    { name: "m7-company", steps: [["scrollY", "A little company while you move?", 260], ["wait", 300], ["boxAs", "Start 15 minutes with Bounce", "start"]] },
    { name: "m7-timer", steps: [["click", "Start 15 minutes with Bounce", "start"], ["wait", 2500], ["scrollY", "Your movement time", 300], ["wait", 300], ["tag", "^\\d\\d:\\d\\d$", "company-digits"], ["boxMaybe", "css=[data-promo=company-digits]", "digits"]] },
    { name: "m7-ticks", steps: [["tickShots", "css=[data-promo=company-digits]", 4, "m7-tick"]] },
    { name: "m7-strip", steps: [["scrollY", "Move, last 7 days", 130], ["wait", 300], ["boxAs", "Move, last 7 days", "strip"]] },
    { name: "m7-story", steps: [["scrollY", "Your movement story", 110], ["wait", 300], ["boxMaybe", "See your saved days", "saved"]] },
  ] },
];
