// The real Daywell screens for "Eat, with Nori", in chapter order. Each group loads the harness once (?promo=1, Sam's
// sample week) and its shots follow on from each other, so every state is reached by really using the app.
// Steps: click/type/scroll/scrollY/select/box/boxAs/boxMaybe/tag/typeShots/file/wait/eval (see tools/capture.mjs).
import { join } from "node:path";
import { repoRoot } from "../../tools/paths.mjs";

// The meal photo: a stand-in from the app itself until the owner supplies a real one.
const photo = process.env.PROMO_PHOTO || join(repoRoot, "public", "grain-bowl.jpg");
// Tags a basket card (by ingredient) and one of its buttons, so the finger can find them.
const tagStock = (ingredient, button, as) => `(() => { const card = [...document.querySelectorAll('article.food-stock')].find(c => c.querySelector('h3')?.innerText.trim() === '${ingredient}'); if (!card) throw Error('no ${ingredient}'); card.setAttribute('data-promo', '${as}-card'); const b = [...card.querySelectorAll('button')].find(x => x.innerText.trim() === '${button}'); b.setAttribute('data-promo', '${as}'); return true; })()`;
const edit = "css=button[aria-label='Edit Salmon & quinoa bowl']";
const handFood = "css=[role=dialog] input[placeholder^=\"e.g.\"]";

export const plan = [
  // Title and chapter 1: snap a meal (Plus). Saved, and editable later from the meal story.
  { query: "view=eat&promo=1&still", clock: "2026-10-14T08:10:00", shots: [
    { name: "e-home", steps: [["wait", 300]] },
    { name: "e1-eat", steps: [["scrollTo", 200], ["wait", 400], ["boxAs", "Take a photo", "photo"]] },
    { name: "e1-preview", steps: [["click", "Take a photo", "photo"], ["wait", 1200], ["file", "input[capture=environment]", photo], ["wait", 1500], ["boxAs", "Review this photo", "review"]] },
    { name: "e1-result", steps: [["click", "Review this photo", "review"], ["wait", 2500], ["boxAs", "=Salmon & quinoa bowl", "title"], ["boxMaybe", "=Breakfast", "breakfast"]] },
    { name: "e1-result2", steps: [["scroll", "Save food consumed", "center"], ["wait", 400], ["click", "I consumed this and checked", "consumed"], ["wait", 400], ["boxAs", "Save food consumed", "save"], ["boxMaybe", "Half of the shown portion", "half"]] },
    { name: "e1-saved", steps: [["click", "Save food consumed", "save"], ["wait", 2200], ["boxAs", "=Back to my day", "back"]] },
    { name: "e1-story", steps: [["click", "=Back to my day", "back"], ["wait", 900], ["scroll", "=Your meal story", "center"], ["click", "=Your meal story", "story"], ["wait", 1200], ["scrollY", "Meals to remember", 90], ["wait", 300], ["boxAs", edit, "edit"], ["boxMaybe", "=Salmon & quinoa bowl", "meal"]] },
    { name: "e1-edit", steps: [["click", edit, "edit"], ["wait", 1200]] },
  ] },
  // Chapter 2: by hand (Daywell). Food and portion are enough; nutrition is optional.
  { query: "view=eat&promo=1&still", clock: "2026-10-14T12:40:00", shots: [
    { name: "e2-eat", steps: [["scroll", "Add by hand instead", "center"], ["wait", 300], ["boxAs", "Add by hand instead", "byhand"]] },
    { name: "e2-form", steps: [["click", "Add by hand instead", "byhand"], ["wait", 1200], ["boxAs", handFood, "food"]] },
    { name: "e2-typed", steps: [["typeShots", handFood, "Tomato soup and a bread roll", 3, "e2-typing"], ["wait", 300], ["boxAs", handFood, "food"]] },
    { name: "e2-optional", steps: [["scroll", "Portions I ate", "start"], ["wait", 400], ["boxMaybe", "Portions I ate", "portions"], ["boxMaybe", "Total calories consumed", "kcal"], ["boxMaybe", "Total sugar consumed", "sugar"]] },
    { name: "e2-save", steps: [["scroll", "css=[role=dialog] button[type=submit]", "center"], ["wait", 400], ["boxAs", "css=[role=dialog] button[type=submit]", "save"]] },
    { name: "e2-saved", steps: [["click", "css=[role=dialog] button[type=submit]", "save"], ["wait", 1500], ["scrollY", "Your food today", 120], ["wait", 300], ["boxMaybe", "Tomato soup and a bread roll", "meal"]] },
  ] },
  // Chapter 3: the food basket (Daywell). Two eggs used, noted, and the basket is updated.
  { query: "view=eat&promo=1&still", clock: "2026-10-14T13:00:00", shots: [
    { name: "e3-basket", steps: [["eval", tagStock("egg", "I ate / used some", "egg-use")], ["scrollY", "css=[data-promo=egg-use-card]", 300], ["wait", 300], ["boxAs", "css=[data-promo=egg-use]", "use"], ["boxAs", "css=[data-promo=egg-use-card]", "card"], ["boxMaybe", "Start with what you have.", "start"]] },
    { name: "e3-form", steps: [["click", "css=[data-promo=egg-use]", "use"], ["wait", 1000], ["scrollY", "A little from your basket.", 70], ["wait", 300], ["boxAs", "css=.food-form-grid input[type=number]", "amount"]] },
    { name: "e3-two", steps: [["type", "css=.food-form-grid input[type=number]", "2"], ["wait", 300], ["boxAs", "css=.food-form-grid input[type=number]", "amount"]] },
    { name: "e3-typed", steps: [["scroll", "checked the amount actually used", "center"], ["wait", 300], ["click", "checked the amount actually used", "checked"], ["wait", 300], ["boxAs", "Save food used", "save"]] },
    { name: "e3-saved", steps: [["click", "Save food used", "save"], ["wait", 1800], ["scrollY", "Meal remembered", 120], ["wait", 300], ["boxMaybe", "Meal remembered", "notice"], ["boxMaybe", "=Undo", "undo"]] },
    { name: "e3-egg", steps: [["eval", tagStock("egg", "Adjust", "egg-adjust")], ["scrollY", "css=[data-promo=egg-adjust-card]", 300], ["wait", 300], ["boxAs", "css=[data-promo=egg-adjust-card]", "card"]] },
  ] },
  // Chapters 4 and 5: what can my basket make? (Plus), then just what's missing, bought and put away (Daywell).
  { query: "view=eat&promo=1&still", clock: "2026-10-14T17:30:00", shots: [
    { name: "e4-planner", steps: [["click", "=Next meals", "next"], ["wait", 1200], ["scrollY", "What can my basket make?", 120], ["select", "css=.basket-planner select", "Dinner"], ["wait", 300], ["boxAs", "=3 meals", "three"], ["boxAs", "Talk through my meal plan", "plan"]] },
    { name: "e4-three", steps: [["click", "=3 meals", "three"], ["wait", 500], ["boxAs", "Talk through my meal plan", "plan"]] },
    { name: "e4-sheet", steps: [["click", "Talk through my meal plan", "plan"], ["wait", 1500], ["click", "Type instead", "type"], ["wait", 700], ["boxAs", "css=[role=dialog] input", "field"]] },
    { name: "e4-typed", steps: [["typeShots", "css=[role=dialog] input", "Three dinners for me, no mushrooms", 3, "e4-typing"], ["boxAs", "=Continue", "continue"]] },
    { name: "e4-result", steps: [["click", "=Continue", "continue"], ["wait", 3000], ["boxMaybe", "=Vegetable chilli with rice", "meal1"]] },
    { name: "e4-result2", steps: [["scroll", "Review meals & save", "center"], ["wait", 400], ["boxAs", "Review meals & save", "review"], ["boxMaybe", "2 of 3 meals covered", "coverage"]] },
    { name: "e4-review", steps: [["click", "Review meals & save", "review"], ["wait", 2500], ["scroll", "Save these meals", "center"], ["wait", 400], ["boxAs", "Save these meals", "save"]] },
    { name: "e5-saved", steps: [["click", "Save these meals", "save"], ["wait", 2500], ["scroll", "=Shopping", "center"], ["click", "=Shopping", "tab"], ["wait", 1500], ["scrollY", "Just what’s missing.", 110], ["wait", 300], ["boxMaybe", "=spring onion", "onion"], ["boxMaybe", "=lime", "lime"], ["boxAs", "=I bought this", "bought"], ["boxAs", "Put shopping away", "away"]] },
    { name: "e5-purchase", steps: [["click", "=I bought this", "bought"], ["wait", 1200], ["scrollY", "Enter what you actually bought", 120], ["wait", 300], ["boxAs", "Add bought food to basket", "add"]] },
    { name: "e5-added", steps: [["click", "Add bought food to basket", "add"], ["wait", 1800], ["scrollY", "Saved to your food basket", 160], ["wait", 300], ["boxMaybe", "Saved to your food basket", "notice"], ["boxMaybe", "=I bought this", "bought"], ["boxMaybe", "Put shopping away", "away"]] },
  ] },
  // Chapter 6: plans by hand, and ideas from Nori's recipes (Daywell).
  { query: "view=eat&promo=1&still", clock: "2026-10-14T18:30:00", shots: [
    { name: "e6-next", steps: [["click", "=Next meals", "next"], ["wait", 1200], ["scrollY", "A few days, gently planned.", 140], ["wait", 300], ["boxAs", "=Plan these 3 days", "days"]] },
    { name: "e6-days", steps: [["click", "=Plan these 3 days", "days"], ["wait", 1200], ["scrollY", "Your next 3 days, at your pace.", 90], ["wait", 300], ["boxMaybe", "css=.food-form-grid select", "idea"]] },
    { name: "e6-ideas", steps: [["eval", "document.querySelector('.food-form-actions button[type=button]')?.click(); true"], ["wait", 800], ["scrollY", "A little inspiration", 100], ["wait", 300], ["boxAs", "=How to make it", "how"]] },
    { name: "e6-how", steps: [["click", "=How to make it", "how"], ["wait", 700], ["scrollY", "Chickpea sunshine bowl", 110], ["wait", 300], ["boxMaybe", "=Review & plan", "plan"]] },
  ] },
  // Chapter 7: look back at the week, without judgement (Daywell).
  { query: "view=eat&promo=1&still", clock: "2026-10-14T20:00:00", shots: [
    { name: "e7-strip", steps: [["scrollTo", 300], ["wait", 300], ["boxAs", "Eat, last 7 days", "strip"]] },
    { name: "e7-story", steps: [["scroll", "=Your meal story", "center"], ["click", "=Your meal story", "story"], ["wait", 1200], ["scrollY", "Meals to remember", 90], ["wait", 300]] },
  ] },
];
