// "Move, with Bounce": what happens in each chapter, synced to Alice's words (voiceover-lines.mjs). The engine
// (engine/short.js) draws the hook, title, cards, badges, recap and close; screens come from capture-plan.mjs.
const W = (n, w, k) => window.FILM_DATA.vo[n - 1].words.filter(x => x.w.toLowerCase().replace(/[^a-z0-9'’-]/g, "") === w)[k || 0].t;
Short({
  name: "Move", helper: "bounce", helperName: "Bounce", color: "#F3A6A9",
  sky: [[0, "#ffece2", "#fbd6d6"], [12, "#ffe7dc", "#f9d1d8"], [95, "#ffe7dc", "#f9d1d8"], [97, "#fcebf3", "#f4d8e8"], [120, "#fcebf3", "#f4d8e8"]],
  accent: ["move", "bounce", "plus", "daywell", "stretch", "counts", "easier", "harder", "aloud", "kitchen", "streaks", "yourself"],
  hook: { chips: [
    { t: W(1, "desk") - 0.12, icon: "armchair", text: "Desk all day?" },
    { t: W(1, "good") - 0.05, icon: "sparkles", text: "Good news" },
    { t: W(1, "stretch") - 0.12, icon: "heart", text: "A stretch counts" },
  ] },
  title: { slam: W(2, "move"), with: W(2, "with") },
  home: "m-home",
  chapters: [
    { t: 12, title: "Eighteen routines", recap: "18 routines, desk to gym", plan: "daywell", shot: "m1-list" },
    { t: 24, title: "One step at a time", recap: "One step at a time, with a timer", plan: "daywell", shot: "m2-desk" },
    { t: 36, title: "Easier or harder", recap: "Easier or harder steps", plan: "daywell", shot: "m3-squat" },
    { t: 46, title: "Steps read aloud", recap: "Bounce reads each step aloud", plan: "plus", shot: "m4-player" },
    { t: 58, title: "Stop early, it counts", recap: "Save what you really did", plan: "daywell", shot: "m5-step" },
    { t: 68, title: "Record any move", recap: "Record any move by hand", plan: "daywell", shot: "m6-today" },
    { t: 80, title: "Fifteen minutes, then look back", recap: "Company, and your week", plan: "daywell", shot: "m7-company" },
  ],
  recap: { t: 96, title: "Included in Move", glow: { daywell: [W(10, "every") - 0.1, W(10, "daywell") + 0.7], plus: [W(10, "plus") - 0.1, W(10, "voice") + 0.8] }, pricesAt: W(10, "voice") + 0.9 },
  close: { t: 110, priceAt: W(11, "four") - 0.05 },
  script({ S, tap, hl, typing, ticks, bubble, cue, camTo, camFull, R, layer, K, prog, eout }) {
    // 1 · Eighteen routines, from a desk break to the gym; filters for anywhere, no equipment, home and gym.
    camTo(12.85, R(16, 230, 358, 330));
    S(W(3, "from") - 0.1, "m1-more", "scroll"); camTo(W(3, "from") - 0.05, R(16, 40, 358, 700), 1.15);
    S(W(3, "anywhere") - 0.62, "m1-list", "scroll"); camTo(W(3, "anywhere") - 0.6, R(16, 240, 358, 130));
    tap(W(3, "anywhere"), "m1-list", "any"); S(W(3, "anywhere") + 0.12, "m1-anywhere", "cut");
    tap(W(3, "no"), "m1-anywhere", "none"); S(W(3, "no") + 0.12, "m1-none", "cut");
    tap(W(3, "home"), "m1-none", "house"); S(W(3, "home") + 0.12, "m1-house", "cut");
    tap(W(3, "gym", 1), "m1-house", "gym"); S(W(3, "gym", 1) + 0.12, "m1-gym", "cut");
    camTo(W(3, "gym", 1) + 0.5, R(16, 240, 358, 520));

    // 2 · One step at a time, with a timer for each (Daywell).
    camTo(24.85, R(16, 320, 358, 200));
    tap(W(4, "bounce") + 0.05, "m2-desk", "start");
    S(W(4, "bounce") + 0.17, "m2-step1"); camTo(W(4, "bounce") + 0.2, R(16, 20, 358, 200));
    S(W(4, "one") - 0.1, "m2-step1b", "scroll"); camTo(W(4, "one") - 0.05, R(16, 330, 358, 200));
    tap(W(4, "timer"), "m2-step1b", "timer"); cue(W(4, "timer") + 0.1, "timer", -16);
    S(W(4, "timer") + 0.12, "m2-timer"); ticks(W(4, "timer") + 1.0, "m2-ticks", "m2-tick", 1, 4);
    tap(W(4, "each") + 0.9, "m2-timer", "next"); cue(W(4, "each") + 0.97, "tick", -18);
    S(W(4, "each") + 1.02, "m2-step2"); camTo(W(4, "each") + 1.05, R(16, 320, 358, 230));
    bubble(30.6, 34.4, "bounce", "A stretch counts. A small walk counts, too.");

    // 3 · Easier or harder (Daywell): a squat made easier, then harder.
    camTo(36.85, R(16, 330, 358, 260));
    tap(W(5, "easier") - 0.2, "m3-squat", "easier"); S(W(5, "easier") - 0.08, "m3-easy");
    tap(W(5, "strong"), "m3-easy", "harder"); S(W(5, "strong") + 0.12, "m3-back");
    tap(W(5, "harder") - 0.05, "m3-back", "harder"); S(W(5, "harder") + 0.07, "m3-hard");
    hl(W(5, "harder") + 0.5, "m3-hard", "title", 2);

    // 4 · With Plus, Bounce reads each step aloud.
    camTo(46.85, R(16, 20, 358, 300));
    tap(W(6, "reads") - 0.05, "m4-player", "aloud"); S(W(6, "reads") + 0.07, "m4-aloud", "cut");
    // Bounce speaking: soft rings from Bounce's picture while the step is read.
    layer(W(6, "each") - 0.1, 53.6, `${[0, 1, 2].map(() => `<div style="position:absolute;left:${(95 * K).toFixed(1)}px;top:${(140 * K).toFixed(1)}px;width:0;height:0"><div style="position:absolute;left:-90px;top:-90px;width:180px;height:180px;border-radius:50%;border:5px solid rgba(128,60,101,.55)"></div></div>`).join("")}`,
      (t, el) => [...el.children].forEach((r, i) => { const k = ((t * 0.9 + i / 3) % 1); r.firstChild.style.transform = `scale(${(0.45 + 0.9 * eout(k)).toFixed(4)})`; r.firstChild.style.opacity = ((1 - k) * 0.9).toFixed(3); }));
    bubble(W(6, "so") - 0.1, 54.2, "bounce", "“Lift your knees to a comfortable height and swing your arms.”");

    // 5 · Stop early? Save what you really did. It still counts (Daywell).
    camTo(58.85, R(16, 300, 358, 320));
    tap(W(7, "early") - 0.05, "m5-step", "end");
    S(W(7, "early") + 0.07, "m5-ended"); camTo(W(7, "early") + 0.1, R(16, 20, 358, 420));
    tap(W(7, "save"), "m5-ended", "review");
    S(W(7, "save") + 0.12, "m5-review"); camTo(W(7, "save") + 0.15, R(16, 20, 358, 520));
    S(W(7, "did") + 0.25, "m5-save", "scroll"); camTo(W(7, "did") + 0.3, R(16, 300, 358, 200));
    tap(W(7, "still"), "m5-save", "save"); cue(W(7, "still") + 0.1, "saved", -12);
    S(W(7, "still") + 0.12, "m5-done"); camTo(W(7, "still") + 0.15, R(16, 100, 358, 300));

    // 6 · A walk, a swim, a dance in the kitchen: recorded by hand (Daywell).
    camTo(68.6, R(16, 380, 358, 200));
    tap(W(8, "walk"), "m6-today", "record");
    S(W(8, "walk") + 0.12, "m6-menu"); camTo(W(8, "walk") + 0.15, R(16, 470, 358, 160));
    tap(W(8, "swim"), "m6-menu", "walk");
    S(W(8, "swim") + 0.12, "m6-form"); camTo(W(8, "swim") + 0.15, R(16, 200, 358, 420));
    tap(W(8, "dance") - 0.25, "m6-form", "name");
    typing(W(8, "dance"), W(8, "kitchen") + 0.5, "m6-typed", "m6-typing");
    S(W(8, "kitchen") + 0.51, "m6-typed", "cut");
    tap(W(8, "hand") - 0.1, "m6-typed", "save"); cue(W(8, "hand"), "saved", -12);
    S(W(8, "hand") + 0.02, "m6-saved"); camTo(W(8, "hand") + 0.05, R(16, 90, 358, 240));

    // 7 · No plan? Fifteen minutes with Bounce; then the week, with no streaks (Daywell).
    camTo(80.85, R(16, 300, 358, 160));
    tap(W(9, "start"), "m7-company", "start"); cue(W(9, "start") + 0.1, "timer", -16);
    S(W(9, "start") + 0.12, "m7-timer"); camTo(W(9, "start") + 0.15, R(16, 280, 358, 260)); ticks(W(9, "start") + 1.0, "m7-ticks", "m7-tick", 1, 3);
    S(W(9, "then") - 0.1, "m7-strip", "slide"); camTo(W(9, "then") - 0.05, R(16, 120, 358, 140));
    S(W(9, "streaks") + 0.4, "m7-story", "slide"); camTo(W(9, "streaks") + 0.45, R(16, 100, 358, 560), 1.25);
    bubble(87.8, 92.0, "bounce", "Any day, any amount. It all counts.");
    camFull(92.6);
  },
});
