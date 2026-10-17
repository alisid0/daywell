// "Eat, with Nori": what happens in each chapter, synced to Alice's words (voiceover-lines.mjs). The engine
// (engine/short.js) draws the hook, title, cards, badges, recap and close; screens come from capture-plan.mjs.
const W = (n, w, k) => window.FILM_DATA.vo[n - 1].words.filter(x => x.w.toLowerCase().replace(/[^a-z0-9'’-]/g, "") === w)[k || 0].t;
Short({
  name: "Eat", helper: "nori", helperName: "Nori", color: "#F3C5B5",
  sky: [[0, "#fdeee6", "#f8d9e3"], [12, "#fde8dc", "#f6d2e0"], [95, "#fde8dc", "#f6d2e0"], [97, "#fcebf3", "#f4d8e8"], [120, "#fcebf3", "#f4d8e8"]],
  accent: ["eat", "nori", "plus", "daywell", "basket", "edit", "updated", "missing", "idea", "judgement", "yourself"],
  hook: { chips: [
    { t: W(1, "dinner") - 0.12, icon: "utensils", text: "Dinner?" },
    { t: W(1, "fridge") - 0.12, icon: "refrigerator", text: "In the fridge?" },
    { t: W(1, "lunch") - 0.12, icon: "sandwich", text: "Lunch?" },
  ] },
  title: { slam: W(2, "eat"), with: W(2, "with") },
  home: "e-home",
  chapters: [
    { t: 12, title: "Snap a meal", plan: "plus", shot: "e1-eat" },
    { t: 24, title: "Add it by hand", plan: "daywell", shot: "e2-eat" },
    { t: 34, title: "Your food basket", plan: "daywell", shot: "e3-basket" },
    { t: 46, title: "What can my basket make?", recap: "Meal ideas from your basket", plan: "plus", shot: "e4-planner" },
    { t: 58, title: "Just what’s missing", recap: "Your shopping list", plan: "daywell", shot: "e5-saved" },
    { t: 70, title: "Plans and ideas", recap: "Plans and Nori’s recipes", plan: "daywell", shot: "e6-next" },
    { t: 82, title: "Look back", recap: "Your meals and your week", plan: "daywell", shot: "e7-strip" },
  ],
  recap: { t: 96, title: "Included in Eat", glow: { daywell: [W(10, "your") - 0.1, W(10, "daywell") + 0.7], plus: [W(10, "photos") - 0.1, W(10, "plus") + 0.8] }, pricesAt: W(10, "plus") + 0.9 },
  close: { t: 110, priceAt: W(11, "four") - 0.05 },
  script({ S, tap, hl, typing, bubble, cue, flash, camTo, camFull, R }) {
    // 1 · Snap a meal (Plus): the photo is read, the portion checked, saved; later it can be edited.
    camTo(12.85, R(16, 470, 358, 260));
    tap(W(3, "snap") + 0.1, "e1-eat", "photo"); flash(W(3, "snap") + 0.22);
    S(W(3, "snap") + 0.25, "e1-preview", "cut"); camTo(W(3, "snap") + 0.3, R(16, 60, 358, 540));
    tap(W(3, "daywell"), "e1-preview", "review");
    S(W(3, "daywell") + 0.12, "e1-result"); camTo(W(3, "daywell") + 0.15, R(16, 330, 358, 330));
    S(W(3, "check") - 0.1, "e1-result2", "slide"); camTo(W(3, "check") - 0.05, R(16, 110, 358, 380));
    tap(W(3, "saved") - 0.3, "e1-result2", "save"); cue(W(3, "saved") - 0.2, "saved", -12);
    S(W(3, "saved") - 0.18, "e1-saved"); camTo(W(3, "saved") - 0.15, R(16, 230, 358, 300));
    S(W(3, "wrong"), "e1-story", "slide"); camTo(W(3, "wrong") + 0.05, R(16, 270, 358, 130));
    tap(W(3, "edit"), "e1-story", "edit");
    S(W(3, "edit") + 0.12, "e1-edit"); camTo(W(3, "edit") + 0.15, R(16, 40, 358, 330));
    bubble(20.4, 23.3, "nori", "Close enough is good enough.");

    // 2 · By hand (Daywell): food and portion are enough; nutrition stays optional.
    camTo(24.85, R(16, 330, 358, 160));
    tap(W(4, "type") + 0.05, "e2-eat", "byhand");
    S(W(4, "type") + 0.17, "e2-form"); camTo(W(4, "type") + 0.2, R(16, 60, 358, 260));
    tap(W(4, "food") - 0.15, "e2-form", "food");
    typing(W(4, "food") + 0.05, W(4, "enough") + 0.3, "e2-typed", "e2-typing");
    S(W(4, "enough") + 0.31, "e2-typed", "cut");
    S(W(4, "add") - 0.05, "e2-optional", "slide"); camTo(W(4, "add"), R(16, 150, 358, 140));
    hl(W(4, "nutrition"), "e2-optional", "kcal", 1.6);
    S(W(4, "it") + 0.6, "e2-save", "slide"); camTo(W(4, "it") + 0.65, R(16, 640, 358, 140));
    tap(W(4, "it") + 1.3, "e2-save", "save"); cue(W(4, "it") + 1.4, "saved", -12);
    S(W(4, "it") + 1.42, "e2-saved"); camTo(W(4, "it") + 1.45, R(16, 100, 358, 420));

    // 3 · The food basket (Daywell): two eggs used, noted, and the basket shows four.
    camTo(34.85, R(16, 290, 358, 330));
    tap(W(5, "used") + 0.05, "e3-basket", "use");
    S(W(5, "used") + 0.17, "e3-form"); camTo(W(5, "used") + 0.2, R(16, 300, 358, 300));
    tap(W(5, "eggs") - 0.05, "e3-form", "amount");
    S(W(5, "eggs") + 0.07, "e3-two", "cut");
    S(W(5, "note") + 0.02, "e3-typed", "slide"); camTo(W(5, "note") + 0.05, R(16, 380, 358, 170));
    tap(W(5, "note") + 0.45, "e3-typed", "checked");
    tap(W(5, "it's") + 0.05, "e3-typed", "save"); cue(W(5, "it's") + 0.15, "saved", -12);
    S(W(5, "it's") + 0.17, "e3-saved"); camTo(W(5, "it's") + 0.2, R(16, 110, 358, 200));
    S(41.0, "e3-egg", "slide"); camTo(41.05, R(16, 290, 358, 330));
    hl(41.6, "e3-egg", "card", 2.6);

    // 4 · What can my basket make? (Plus): three dinners from what's already there.
    camTo(46.85, R(16, 90, 358, 560));
    tap(W(6, "basket") - 0.1, "e4-planner", "three");
    S(W(6, "basket") + 0.02, "e4-three", "cut");
    tap(W(6, "make") + 0.05, "e4-three", "plan");
    S(W(6, "make") + 0.17, "e4-sheet"); camTo(W(6, "make") + 0.2, R(16, 480, 358, 150));
    typing(W(6, "and") + 0.05, W(6, "meals") + 0.2, "e4-typed", "e4-typing");
    S(W(6, "meals") + 0.21, "e4-typed", "cut");
    tap(W(6, "from") + 0.05, "e4-typed", "continue");
    S(W(6, "from") + 0.17, "e4-result"); camTo(W(6, "from") + 0.2, R(16, 110, 358, 420));
    S(52.3, "e4-result2", "slide"); camTo(52.35, R(16, 90, 358, 380));
    tap(53.4, "e4-result2", "review");
    S(53.52, "e4-review"); camTo(53.55, R(16, 120, 358, 400));
    bubble(54.4, 57.2, "nori", "Something good, made simple.");

    // 5 · Just what's missing (Daywell): bought, then put away into the basket.
    camTo(58.85, R(16, 230, 358, 290));
    hl(W(7, "missing"), "e5-saved", "onion", 1.6);
    tap(W(7, "tick") + 0.03, "e5-saved", "bought");
    S(W(7, "tick") + 0.15, "e5-purchase"); camTo(W(7, "tick") + 0.18, R(16, 100, 358, 560));
    tap(W(7, "put") + 0.02, "e5-purchase", "add"); cue(W(7, "put") + 0.12, "saved", -12);
    S(W(7, "put") + 0.14, "e5-added"); camTo(W(7, "put") + 0.17, R(16, 150, 358, 400));
    S(64.8, "e5-basket", "slide"); camTo(64.85, R(16, 290, 358, 290)); hl(65.4, "e5-basket", "card", 2.6);
    bubble(66.2, 69.1, "nori", "Just what you need, aisle by aisle.");

    // 6 · Plans by hand, and an idea from Nori's recipes (Daywell).
    camTo(70.85, R(16, 120, 358, 260));
    tap(W(8, "days") + 0.05, "e6-next", "days");
    S(W(8, "days") + 0.17, "e6-days"); camTo(W(8, "days") + 0.2, R(16, 60, 358, 420));
    S(W(8, "borrow") - 0.05, "e6-ideas", "slide"); camTo(W(8, "borrow"), R(16, 70, 358, 470));
    tap(W(8, "recipes") - 0.2, "e6-ideas", "how");
    S(W(8, "recipes") - 0.08, "e6-how"); camTo(W(8, "recipes") - 0.05, R(16, 90, 358, 520));
    tap(76.3, "e6-how", "plan");
    S(76.42, "e6-review"); camTo(76.45, R(16, 40, 358, 520));
    S(78.2, "e6-review2", "scroll"); camTo(78.25, R(16, 300, 358, 200));
    tap(79.0, "e6-review2", "save"); cue(79.1, "saved", -12);
    S(79.12, "e6-saved"); camTo(79.15, R(16, 140, 358, 170));

    // 7 · Look back (Daywell): the week and the meals, without judgement.
    camTo(82.85, R(16, 80, 358, 160));
    S(W(9, "meals") + 0.1, "e7-story", "slide"); camTo(W(9, "meals") + 0.15, R(16, 60, 358, 560), 1.3);
    bubble(86.6, 91.0, "nori", "A little nourishment, without the judgement.");
    S(91.4, "e7-story2", "scroll");
    camFull(92.0);
  },
});
