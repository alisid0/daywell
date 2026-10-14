// The real Daywell screens the promo needs, in story order. Each group loads the harness once (?promo=1 sample week)
// and its shots follow on from each other, so every state is reached by really using the app.
// Steps: click/type/scroll/scrollY/select/box/boxAs/boxMaybe/tag/typeShots/file/wait/eval (see capture.mjs).
const desk = "(() => { const card = [...document.querySelectorAll('.routine-card')].find(c => c.innerText.startsWith('Desk break')); card.querySelector('button').setAttribute('data-promo', 'desk-start'); return true; })()";
import { join } from "node:path";
import { repoRoot } from "./paths.mjs";
// The breakfast photo. A stand-in from the app itself until the owner supplies a real breakfast photo.
const photo = process.env.PROMO_PHOTO || join(repoRoot, "public", "grain-bowl.jpg");
const sleepTimes = "(() => { const t = [...document.querySelectorAll('[role=dialog] input[type=time]')]; __type(t[0], '23:10'); __type(t[1], '07:05'); const s = document.querySelector('[role=dialog] select'); if (s) { Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(s, 'Rested'); s.dispatchEvent(new Event('change', { bubbles: true })); } return true; })()";

export const plan = [
  { query: "view=today&promo=1&still", clock: "2026-10-14T07:00:00", shots: [
    { name: "s3-type", steps: [["click", "Type instead"], ["wait", 500], ["scrollY", "Tell Daywell what you need", 150], ["wait", 300], ["boxAs", "css=textarea", "field"], ["boxAs", "Send request", "send"]] },
    { name: "s3-typed", steps: [["typeShots", "css=textarea", "Focus on calling the bank for 10 minutes", 3, "s3-typing"], ["boxAs", "Send request", "send"]] },
    { name: "s3-plan", steps: [["click", "Send request", "send"], ["wait", 2500], ["scrollY", "You: Focus on", 150], ["wait", 300], ["boxAs", "=Start timer", "start"]] },
    { name: "s3-focus", steps: [["click", "=Start timer", "start"], ["wait", 1800], ["scrollY", "Your focus time", 110], ["wait", 300], ["tag", "^\\d\\d:\\d\\d$", "digits"], ["boxAs", "css=[data-promo=digits]", "digits"], ["boxAs", "calling the bank", "title"]] },
    { name: "s3-focus-ticks", steps: [["tickShots", "css=[data-promo=digits]", 5, "s3-tick"]] },
  ] },
  { query: "view=eat&promo=1&still", clock: "2026-10-14T08:00:00", shots: [
    { name: "s4-eat", steps: [["scrollTo", 200], ["wait", 400], ["boxAs", "Take a photo", "photo"]] },
    { name: "s4-preview", steps: [["click", "Take a photo", "photo"], ["wait", 1200], ["file", "input[capture=environment]", photo], ["wait", 1500], ["boxAs", "Review this photo", "review"]] },
    { name: "s4-result", steps: [["click", "Review this photo", "review"], ["wait", 2500], ["boxAs", "=Salmon & quinoa bowl", "title"], ["boxMaybe", "=Breakfast", "breakfast"]] },
    { name: "s4-result2", steps: [["scroll", "Save food consumed", "center"], ["wait", 400], ["click", "I consumed this and checked", "consumed"], ["wait", 400], ["boxAs", "Save food consumed", "save"]] },
    { name: "s4-saved", steps: [["click", "Save food consumed", "save"], ["wait", 2200], ["boxMaybe", "=Undo", "undo"]] },
    { name: "s4-today", steps: [["click", "=Back to my day", "back"], ["wait", 900], ["scrollY", "Your food today", 150], ["wait", 400], ["boxMaybe", "=Salmon & quinoa bowl", "meal"]] },
    { name: "s4-hand", steps: [["eval", "document.querySelector('[role=dialog] button[aria-label=Close], [role=dialog] .close')?.click(); true"], ["wait", 800], ["scroll", "Add by hand instead", "center"], ["click", "Add by hand instead", "byhand"], ["wait", 1200], ["type", "css=[role=dialog] input[placeholder^=\"e.g.\"]", "Salmon & quinoa bowl"], ["select", "css=[role=dialog] select", "Breakfast"], ["wait", 300], ["boxAs", "css=[role=dialog] input[placeholder^=\"e.g.\"]", "food"]] },
  ] },
  { query: "view=move&promo=1&still", clock: "2026-10-14T10:30:00", shots: [
    { name: "s5-move", steps: [["scrollY", "Your training partner", 20], ["wait", 300], ["eval", desk], ["boxAs", "css=[data-promo=desk-start]", "start"]] },
    { name: "s5-step1", steps: [["click", "css=[data-promo=desk-start]", "start"], ["wait", 1600], ["click", "=Start timer", "timer"], ["wait", 2600], ["scrollY", "css=.routine-player", 8], ["wait", 300], ["tag", "^\\d:\\d\\d$", "step-digits"], ["boxMaybe", "css=[data-promo=step-digits]", "digits"], ["boxMaybe", "=Done, next", "next"]] },
    { name: "s5-step1b", steps: [["scrollY", "css=.routine-player", -250], ["wait", 300], ["tag", "^\\d:\\d\\d$", "step-digits"], ["boxMaybe", "css=[data-promo=step-digits]", "digits"], ["boxMaybe", "=Done, next", "next"]] },
    { name: "s5-step1-ticks", steps: [["tickShots", "css=[data-promo=step-digits]", 4, "s5-tick"]] },
    { name: "s5-step2", steps: [["click", "=Done, next", "next"], ["wait", 900], ["eval", "__advance(70000)"], ["scrollY", "css=.routine-player", -250], ["wait", 300], ["boxMaybe", "=Done, next", "next"]] },
    { name: "s5-step4", steps: [["click", "=Done, next", "next"], ["wait", 900], ["eval", "__advance(60000)"], ["click", "=Done, next", "next2"], ["wait", 900], ["eval", "__advance(50000)"], ["scrollY", "css=.routine-player", -250], ["wait", 300], ["boxMaybe", "=Done, next", "next"], ["boxMaybe", "=End routine", "end"]] },
    { name: "s5-step5", steps: [["click", "=Done, next", "next"], ["wait", 900], ["eval", "__advance(40000)"], ["scrollY", "css=.routine-player", -250], ["wait", 300], ["boxMaybe", "=End routine", "end"]] },
    { name: "s5-ended", steps: [["click", "=End routine", "end"], ["wait", 1500], ["scrollY", "css=.routine-player", 8], ["wait", 300], ["boxAs", "Review and save", "review"]] },
    { name: "s5-saved", steps: [["click", "Review and save", "review"], ["wait", 1800]] },
  ] },
  { query: "view=today&promo=1&still", clock: "2026-10-14T13:00:00", shots: [
    { name: "s6-type", steps: [["click", "Type instead"], ["wait", 500], ["scrollY", "Tell Daywell what you need", 150], ["wait", 300], ["boxAs", "css=textarea", "field"]] },
    { name: "s6-typed", steps: [["typeShots", "css=textarea", "We’re out of milk", 2, "s6-typing"], ["boxAs", "Send request", "send"]] },
    { name: "s6-plan", steps: [["click", "Send request", "send"], ["wait", 2500], ["scrollY", "You: We’re out of milk", 150], ["wait", 300], ["boxAs", "=Do this", "do"]] },
    { name: "s6-done", steps: [["click", "=Do this", "do"], ["wait", 2500], ["scrollY", "You: We’re out of milk", 150], ["wait", 300], ["boxMaybe", "Shopping list updated", "updated"]] },
    { name: "s7-planner", steps: [["eval", "__advance(4.5 * 3600e3)"], ["click", "=Eat", "eat"], ["wait", 1500], ["click", "=Next meals", "next"], ["wait", 1200], ["scrollY", "What can my basket make?", 120], ["select", "css=.basket-planner select", "Dinner"], ["wait", 300], ["click", "=3 meals", "three"], ["wait", 500], ["boxAs", "Talk through my meal plan", "plan"]] },
    { name: "s7-sheet", steps: [["click", "Talk through my meal plan", "plan"], ["wait", 1500], ["click", "Type instead", "type"], ["wait", 700], ["boxAs", "css=[role=dialog] input", "field"]] },
    { name: "s7-typed", steps: [["typeShots", "css=[role=dialog] input", "Three dinners for me, no mushrooms", 3, "s7-typing"], ["boxAs", "=Continue", "continue"]] },
    { name: "s7-result", steps: [["click", "=Continue", "continue"], ["wait", 3000], ["boxMaybe", "=Vegetable chilli with rice", "meal1"]] },
    { name: "s7-result2", steps: [["scroll", "Review meals & save", "center"], ["wait", 400], ["boxAs", "Review meals & save", "review"], ["boxMaybe", "2 of 3 meals covered", "coverage"]] },
    { name: "s7-review", steps: [["click", "Review meals & save", "review"], ["wait", 2500], ["scrollY", "Your meals, ready to review.", 100], ["wait", 300], ["boxMaybe", "2 of 3 meals covered", "coverage"]] },
    { name: "s7-review2", steps: [["scroll", "Save these meals", "center"], ["wait", 400], ["boxAs", "Save these meals", "save"]] },
    { name: "s7-shopping", steps: [["click", "Save these meals", "save"], ["wait", 2500], ["scroll", "=Shopping", "center"], ["click", "=Shopping", "tab"], ["wait", 1500], ["scrollY", "=Shopping", 100], ["wait", 300], ["boxMaybe", "spring onion", "onion"], ["boxMaybe", "=Milk", "milk"]] },
  ] },
  { query: "view=relax&promo=1&still", clock: "2026-10-14T21:00:00", shots: [
    { name: "s8-relax", steps: [["boxAs", "=A little guidance", "guide"]] },
    { name: "s8-guide", steps: [["click", "=A little guidance", "guide"], ["wait", 1400], ["boxMaybe", "Next, when I’m ready", "next"]] },
  ] },
  { query: "view=sleep&promo=1&still", clock: "2026-10-14T22:30:00", shots: [
    { name: "s9-sleep", steps: [["scrollTo", 120], ["wait", 400], ["boxAs", "=Wind down with Luma", "wind"]] },
    { name: "s9-wind", steps: [["click", "=Wind down with Luma", "wind"], ["wait", 1600], ["scrollTo", 0], ["wait", 300]] },
    { name: "s9-sounds", steps: [["scrollY", "Sounds for rest and sleep", 90], ["wait", 300], ["click", "=Waves on sand", "waves"], ["wait", 300], ["click", "=30 min", "thirty"], ["wait", 300], ["click", "=Play", "play"], ["wait", 2600], ["scrollY", "Sounds for rest and sleep", 90], ["wait", 300]] },
  ] },
  { query: "view=sleep&promo=1&still", clock: "2026-10-15T07:05:00", shots: [
    { name: "s10-log", steps: [["scroll", "=Add a night", "center"], ["click", "=Add a night", "add"], ["wait", 1300], ["eval", sleepTimes], ["wait", 500], ["boxAs", "Save entry", "save"]] },
    { name: "s10-saved", steps: [["click", "Save entry", "save"], ["wait", 1500]] },
    // Same visit, so last night's new entry is in the look back.
    { name: "s10-cal", steps: [["scrollTo", 0], ["wait", 300], ["click", "=Calendar", "calendar"], ["wait", 1500], ["scrollTo", 0], ["wait", 300], ["boxAs", "=Look back", "look"]] },
    { name: "s10-look", steps: [["click", "=Look back", "look"], ["wait", 1000], ["click", "=Everything", "everything"], ["wait", 1000], ["scrollY", "A record of what you", 210], ["wait", 300]] },
  ] },
  { query: "view=today&promo=1&still", clock: "2026-10-15T07:20:00", shots: [
    { name: "s11-atk", steps: [["click", "Your space settings", "settings"], ["wait", 1300], ["scroll", "=Reading comfort", "start"], ["wait", 400], ["boxAs", "=Lexend", "lexend"], ["boxAs", "=OpenDyslexic", "od"], ["boxMaybe", "=Larger", "larger"]] },
    { name: "s11-lex", steps: [["click", "=Lexend", "lexend"], ["wait", 900], ["scroll", "=Reading comfort", "start"], ["wait", 300], ["boxAs", "=OpenDyslexic", "od"]] },
    { name: "s11-od", steps: [["click", "=OpenDyslexic", "od"], ["wait", 900], ["scroll", "=Reading comfort", "start"], ["wait", 300], ["boxMaybe", "=Larger", "larger"]] },
    { name: "s11-odl", steps: [["scroll", "=Larger", "center"], ["click", "=Larger", "larger"], ["wait", 900], ["scroll", "=Reading comfort", "start"], ["wait", 300]] },
  ] },
  { query: "page=plans&promo=1&still", shots: [
    { name: "s12-plans", steps: [["boxMaybe", "=Daywell Plus", "plus"]] },
  ] },
];
