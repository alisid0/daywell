// "Relax, with Luma": what happens in each chapter, synced to Alice's words (voiceover-lines.mjs). The engine
// (engine/short.js) draws the hook, title, cards, badges, recap and close; screens come from capture-plan.mjs.
// Two of the app's own sounds play where the film shows them (film.json): the recorded kind words after "Listen",
// and the Temple drum after "Play".
const W = (n, w, k) => window.FILM_DATA.vo[n - 1].words.filter(x => x.w.toLowerCase().replace(/[^a-z0-9'’-]/g, "") === w)[k || 0].t;
// A slow breath around Luma's nest, centred at (x, y) in app CSS px: in for three seconds, out for three.
const breath = (layer, K, eio, t0, t1, x, y) => layer(t0, t1, `<div style="position:absolute;left:${(x * K).toFixed(1)}px;top:${(y * K).toFixed(1)}px;width:0;height:0"><div style="position:absolute;left:-220px;top:-220px;width:440px;height:440px;border-radius:50%;border:5px solid rgba(128,60,101,.26);background:radial-gradient(circle,rgba(207,230,218,0) 55%,rgba(207,230,218,.45) 72%,rgba(207,230,218,0) 74%)"></div></div>`,
  (t, el) => { const b = 0.5 - 0.5 * Math.cos(((t - t0) / 6) * 2 * Math.PI); el.firstChild.firstChild.style.transform = `scale(${(0.82 + 0.22 * eio(b)).toFixed(4)})`; el.firstChild.firstChild.style.opacity = (0.5 + 0.5 * b).toFixed(3); });
Short({
  name: "Relax", helper: "luma", helperName: "Luma", color: "#CFE6DA",
  sky: [[0, "#ecf4ef", "#e3dbf3"], [12, "#eef5f1", "#e6def5"], [95, "#eef5f1", "#e6def5"], [97, "#fcebf3", "#f4d8e8"], [120, "#fcebf3", "#f4d8e8"]],
  accent: ["relax", "luma", "plus", "daywell", "scroll", "corner", "help", "voices", "kind", "drum", "private", "rest", "yourself"],
  hook: { chips: [
    { t: W(1, "everything") + 0.05, icon: "bell", text: "12 new alerts" },
    { t: W(1, "lot") - 0.1, icon: "smartphone", text: "Endless feed" },
    { t: W(1, "step") - 0.05, icon: "wind", text: "A pause" },
  ] },
  title: { slam: W(2, "relax"), with: W(2, "with") },
  home: "r-home",
  chapters: [
    { t: 12, title: "Your quiet corner", plan: "daywell", shot: "r-home" },
    { t: 24, title: "A little guidance", plan: "daywell", shot: "r1-quiet" },
    { t: 36, title: "Guided sessions", recap: "Guided sessions, five voices", plan: "plus", shot: "r3-sessions" },
    { t: 48, title: "Little words of comfort", plan: "plus", shot: "r4-library" },
    { t: 60, title: "Sounds for rest", plan: "plus", shot: "r5-sounds" },
    { t: 70, title: "A private reflection", recap: "Private reflections", plan: "daywell", shot: "r6-remember" },
    { t: 82, title: "Just rest, from Home", plan: "daywell", shot: "r7-home" },
  ],
  recap: { t: 96, title: "Included in Relax", glow: { daywell: [W(10, "the") - 0.1, W(10, "daywell") + 0.7], plus: [W(10, "voices") - 0.1, W(10, "plus") + 0.8] }, pricesAt: W(10, "plus") + 0.9 },
  close: { t: 110, priceAt: W(11, "four") - 0.05 },
  script({ S, tap, hl, typing, bubble, cue, camTo, camFull, R, layer, K, eio }) {
    // 1 · Your quiet corner (Daywell): nothing to do, no timer, no catching up.
    camTo(12.85, R(16, 60, 358, 470), 1.15);
    breath(layer, K, eio, 13.0, 23.5, 195, 290);
    bubble(18.8, 22.8, "luma", "Stay as long as you like.");

    // 2 · A little guidance (Daywell): one gentle step, like letting your shoulders settle.
    camTo(24.85, R(16, 380, 358, 240));
    tap(W(4, "help") + 0.05, "r1-quiet", "guide");
    S(W(4, "help") + 0.17, "r2-guide"); camTo(W(4, "help") + 0.2, R(16, 440, 358, 280));
    hl(W(4, "shoulders") - 0.3, "r2-guide", "words", 2.2);
    tap(31.6, "r2-guide", "next");
    S(31.72, "r2-next"); camTo(31.75, R(16, 440, 358, 280));
    bubble(32.6, 35.6, "luma", "No rush. One step is plenty.");

    // 3 · Guided sessions (Plus), in one of five voices.
    camTo(36.85, R(16, 150, 358, 300));
    tap(W(5, "guided"), "r3-sessions", "scroll");
    S(W(5, "guided") + 0.12, "r3-voices"); camTo(W(5, "guided") + 0.15, R(16, 180, 358, 220));
    tap(W(5, "five") + 0.05, "r3-voices", "lily"); S(W(5, "five") + 0.17, "r3-lily", "cut");
    S(42.0, "r3-begin", "scroll"); camTo(42.05, R(16, 300, 358, 200));
    tap(43.0, "r3-begin", "begin");
    S(43.12, "r3-playing"); camTo(43.15, R(16, 280, 358, 260));
    bubble(44.4, 47.4, "luma", "A voice you feel comfortable with.");

    // 4 · Little words of comfort (Plus): find a moment, then just listen.
    camTo(48.85, R(16, 140, 358, 300));
    tap(W(6, "kind"), "r4-library", "search");
    typing(W(6, "for"), W(6, "awkward") + 0.2, "r4-typed", "r4-typing");
    S(W(6, "awkward") + 0.21, "r4-typed", "cut"); camTo(W(6, "awkward") + 0.25, R(16, 220, 358, 360));
    hl(W(6, "conversation"), "r4-typed", "item", 0.4);
    tap(53.95, "r4-typed", "item");
    S(54.07, "r4-moment", "slide"); camTo(54.1, R(16, 300, 358, 420));
    tap(54.75, "r4-moment", "listen"); S(54.87, "r4-listen", "cut");

    // 5 · Sounds for rest (Plus): from forest at dawn to a temple drum.
    camTo(60.85, R(16, 140, 358, 380));
    tap(W(7, "forest"), "r5-sounds", "dawn"); S(W(7, "forest") + 0.12, "r5-dawn", "cut");
    tap(W(7, "temple"), "r5-dawn", "drum"); S(W(7, "temple") + 0.12, "r5-drum", "cut");
    tap(65.4, "r5-drum", "play"); S(65.52, "r5-playing", "cut"); camTo(65.55, R(16, 420, 358, 220));

    // 6 · A private reflection (Daywell), only if you want to.
    camTo(70.85, R(16, 500, 358, 140));
    tap(W(8, "something"), "r6-remember", "summary"); S(W(8, "something") + 0.12, "r6-open", "slide");
    tap(W(8, "write"), "r6-open", "write");
    S(W(8, "write") + 0.12, "r6-editor"); camTo(W(8, "write") + 0.15, R(16, 300, 358, 340));
    typing(W(8, "reflection") + 0.1, 76.0, "r6-typed", "r6-typing");
    S(76.01, "r6-typed", "cut");
    tap(76.8, "r6-typed", "save"); cue(76.9, "saved", -12);
    S(76.92, "r6-saved"); camTo(76.95, R(16, 380, 358, 260));
    bubble(77.8, 81.1, "luma", "Your pause doesn’t need a record.");

    // 7 · From Home, Just rest is one tap away (Daywell).
    camTo(82.85, R(16, 330, 358, 160));
    tap(W(9, "tap"), "r7-home", "rest");
    S(W(9, "tap") + 0.12, "r7-rest"); camTo(W(9, "tap") + 0.15, R(16, 60, 358, 520), 1.15);
    breath(layer, K, eio, 86.4, 95.4, 195, 400);
    bubble(87.6, 91.8, "luma", "Luma is here with you.");
    camFull(92.6);
  },
});
