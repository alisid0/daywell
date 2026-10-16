// "Sleep, with Luma": what happens in each chapter, synced to Alice's words (voiceover-lines.mjs). The engine
// (engine/short.js) draws the hook, title, cards, badges, recap and close; screens come from capture-plan.mjs.
// The film's sky follows a real evening: dusk, then night for "nothing tracking you at night", then the morning.
const W = (n, w, k) => window.FILM_DATA.vo[n - 1].words.filter(x => x.w.toLowerCase().replace(/[^a-z0-9'’-]/g, "") === w)[k || 0].t;
Short({
  name: "Sleep", helper: "luma", helperName: "Luma", color: "#D9C9F2",
  sky: [[0, "#efe4f7", "#e2d2f0"], [12, "#f0e6f8", "#e4d6f2"], [36, "#e2d5f3", "#d4c2ec"], [56, "#c9b5e6", "#b39ad8"], [58.6, "#5b4880", "#3a2d58"], [60.6, "#2b2142", "#191430"], [69.2, "#2b2142", "#191430"], [71.6, "#fde3d4", "#f7cfdf"], [82, "#fff1e5", "#f9dbe8"], [95, "#fcebf3", "#f4d8e8"], [120, "#fcebf3", "#f4d8e8"]],
  night: [[57.4, 0], [60.6, 1], [69.2, 1], [71.4, 0]],
  dim: [[62.4, 0], [64.0, 0.88], [69.2, 0.88], [70.6, 0]],
  accent: ["sleep", "luma", "plus", "daywell", "soften", "rest", "wake", "company", "itself", "goodnight", "night", "feel", "scores", "yourself"],
  hook: { chips: [
    { t: W(1, "came") - 0.1, icon: "clock", text: "11:47 pm" },
    { t: W(1, "again") - 0.1, icon: "tv", text: "One more episode" },
    { t: W(1, "let") - 0.05, icon: "smartphone", text: "Still scrolling" },
  ] },
  title: { slam: W(2, "sleep"), with: W(2, "with") },
  home: "s-home",
  chapters: [
    { t: 12, title: "Your evening rhythm", plan: "daywell", shot: "s1-rhythm" },
    { t: 24, title: "Wind down with Luma", plan: "daywell", shot: "s2-door" },
    { t: 36, title: "Sleep sounds", recap: "Sleep sounds that fade out", plan: "plus", shot: "s3-sounds" },
    { t: 48, title: "A softer goodnight", recap: "Guided bedtime tracks", plan: "plus", shot: "s4-link" },
    { t: 60, title: "Nothing at night", recap: "Nothing tracking you at night", plan: "daywell", shot: "s2-wind" },
    { t: 70, title: "Morning note", recap: "A morning note", plan: "daywell", shot: "s6-journal" },
    { t: 82, title: "Your sleep journal", recap: "A gentle sleep journal", plan: "daywell", shot: "s7-last" },
  ],
  recap: { t: 96, title: "Included in Sleep", glow: { daywell: [W(10, "your") - 0.1, W(10, "daywell") + 0.7], plus: [W(10, "sleep", 1) - 0.1, W(10, "plus") + 0.8] }, pricesAt: W(10, "plus") + 0.9 },
  close: { t: 110, priceAt: W(11, "four") - 0.05 },
  script({ S, tap, hl, bubble, cue, camTo, camFull, R, layer, K, eio }) {
    // 1 · Your evening rhythm (Daywell): wind down and wake up, changed any time.
    camTo(12.85, R(16, 140, 358, 290));
    tap(W(3, "change"), "s1-rhythm", "change");
    S(W(3, "change") + 0.12, "s1-times"); camTo(W(3, "change") + 0.15, R(16, 330, 358, 220));
    S(W(3, "time") - 0.35, "s1-typed", "cut");
    tap(W(3, "time") + 0.35, "s1-typed", "save"); cue(W(3, "time") + 0.45, "saved", -12);
    S(W(3, "time") + 0.47, "s1-saved"); camTo(W(3, "time") + 0.5, R(16, 140, 358, 290));
    bubble(19.8, 23.3, "luma", "Whatever time works for you.");

    // 2 · Wind down with Luma (Daywell): quiet company, and somewhere to leave the day.
    camTo(24.85, R(16, 60, 358, 330));
    tap(W(4, "luma"), "s2-door", "wind");
    S(W(4, "luma") + 0.12, "s2-wind"); camTo(W(4, "luma") + 0.15, R(16, 100, 358, 520), 1.2);
    // A slow breath around Luma's nest: in for three seconds, out for three.
    layer(26.4, 35.8, `<div style="position:absolute;left:${(195 * K).toFixed(1)}px;top:${(445 * K).toFixed(1)}px;width:0;height:0"><div style="position:absolute;left:-210px;top:-210px;width:420px;height:420px;border-radius:50%;border:5px solid rgba(128,60,101,.28);background:radial-gradient(circle,rgba(217,201,242,0) 55%,rgba(217,201,242,.4) 72%,rgba(217,201,242,0) 74%)"></div></div>`,
      (t, el) => { const b = 0.5 - 0.5 * Math.cos(((t - 26.4) / 6) * 2 * Math.PI); el.firstChild.firstChild.style.transform = `scale(${(0.82 + 0.22 * eio(b)).toFixed(4)})`; el.firstChild.firstChild.style.opacity = (0.5 + 0.5 * b).toFixed(3); });
    bubble(30.6, 34.0, "luma", "You can put the day down for a little while.");

    // 3 · Sleep sounds (Plus): from forest at night to waves on sand; it fades out by itself.
    camTo(36.85, R(16, 140, 358, 220));
    hl(W(5, "forest"), "s3-sounds", "forest", 1.0);
    tap(W(5, "waves"), "s3-sounds", "waves"); S(W(5, "waves") + 0.12, "s3-waves", "cut");
    S(W(5, "it") - 0.25, "s3-stop", "scroll"); camTo(W(5, "it") - 0.2, R(16, 220, 358, 220));
    tap(W(5, "fades"), "s3-stop", "thirty");
    tap(W(5, "itself") + 0.15, "s3-stop", "play");
    S(W(5, "itself") + 0.27, "s3-playing"); camTo(W(5, "itself") + 0.3, R(16, 220, 358, 260));
    hl(43.8, "s3-playing", "note", 2.4);

    // 4 · A softer goodnight (Plus): a guided bedtime track.
    camTo(48.85, R(16, 400, 358, 120));
    tap(W(6, "guided"), "s4-link", "link");
    S(W(6, "guided") + 0.12, "s4-goodnight"); camTo(W(6, "guided") + 0.15, R(16, 60, 358, 340));
    S(W(6, "goodnight") + 0.7, "s4-begin", "scroll"); camTo(W(6, "goodnight") + 0.75, R(16, 330, 358, 160));
    tap(54.0, "s4-begin", "begin");
    S(54.12, "s4-playing"); camTo(54.15, R(16, 300, 358, 200));

    // 5 · Nothing at night (Daywell): the screen goes dark, nothing to do, nothing tracking you.
    camTo(60.85, R(16, 120, 358, 520), 1.15);
    cue(61.2, "stars", -18); cue(66.2, "stars", -20);

    // 6 · Morning note (Daywell): when you fell asleep, and how you feel.
    camTo(70.85, R(16, 60, 358, 300));
    tap(W(8, "note"), "s6-journal", "add");
    S(W(8, "note") + 0.12, "s6-log"); camTo(W(8, "note") + 0.15, R(16, 300, 358, 360));
    hl(W(8, "fell"), "s6-log", "asleep", 1.4);
    tap(W(8, "feel") + 0.55, "s6-log", "save"); cue(W(8, "feel") + 0.65, "saved", -12);
    S(W(8, "feel") + 0.67, "s6-saved"); camTo(W(8, "feel") + 0.7, R(16, 120, 358, 160));
    hl(75.6, "s6-saved", "night", 2.6);
    bubble(76.8, 80.8, "luma", "Good morning. Go gently today.");

    // 7 · Your sleep journal (Daywell): the week, gently. No scores.
    camTo(82.85, R(16, 60, 358, 330));
    S(W(9, "journal") - 0.2, "s7-journal", "scroll"); camTo(W(9, "journal") - 0.15, R(16, 60, 358, 560), 1.25);
    bubble(87.0, 91.6, "luma", "Just noticing. No scores, no streaks.");
    camFull(92.6);
  },
});
