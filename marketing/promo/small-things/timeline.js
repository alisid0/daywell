// "Small things count": what happens in each 5-second moment, on Alice's words (voiceover-lines.mjs) and the measured
// music (take 2, 95.7 BPM, so each moment is two bars and starts on a beat). The engine (engine/moments.js) draws the
// hook, the turn, the stamps, the page and the end; the screens come from capture-plan.mjs.
const W = (n, w, k) => {
  const hits = window.FILM_DATA.vo[n - 1].words.filter(x => x.w.toLowerCase().replace(/[^a-z0-9'’-]/g, "") === w);
  if (!hits[k || 0]) throw Error(`no word ${n}:${w}`); return hits[k || 0].t;
};
const M = n => (n - 1) * 5; // when moment n starts
Moments({
  duration: 150,
  // Dawn, day, dusk, night and dawn again.
  sky: [[0, "#fae7ef", "#f6dbe9"], [9.5, "#fae7ef", "#f6dbe9"], [11, "#fde6d8", "#f8d6e2"], [34, "#fde6d8", "#f8d6e2"], [37, "#fbe5ee", "#f5d6e6"],
        [104, "#fbe5ee", "#f5d6e6"], [108, "#efdcef", "#d9c6e6"], [118, "#d7c3e6", "#b9a4d6"], [121.5, "#2b2142", "#171328"], [130, "#2b2142", "#171328"],
        [133.5, "#fde6d8", "#f8d6e2"], [150, "#fde6d8", "#f8d6e2"]],
  night: [[118, 0], [121.5, 1], [130, 1], [133.5, 0]],
  dim: [[124.6, 0], [125.6, 0.5], [129.4, 0.5], [130.4, 0]],
  accent: ["daywell", "count", "counts"],
  // 1 · Four to-dos drift down, each on a word of the line, and rest in a pile; the small heart settles on top; a pause;
  // then they slide away.
  hook: {
    out: 4.55,
    items: [
      { t: W(1, "looking") + 0.05, icon: "glass-water", text: "Drink more water", tone: "mint" },
      { t: W(1, "yourself"), icon: "footprints", text: "10,000 steps", tone: "peach" },
      { t: W(1, "feel"), icon: "bed", text: "Sleep 8 hours", tone: "lilac" },
      { t: W(1, "lot"), icon: "activity", text: "Track everything", tone: "peach" },
      { t: 3.77, icon: "heart", text: "", tone: "peach", keep: true },
    ],
  },
  // 2 · The sun arrives and drifts up through "So start small", "Daywell" settles in on its word, and the helpers rise
  // in together on "small things". The card then holds to the end of the moment; it lifts away as moment 3 begins.
  turn: {
    sun: 5.25, word: W(2, "daywell"), out: 10, leave: 0.7,
    helpers: [
      { name: "luma", t: W(2, "small", 1), x: 300, y: 1370 },
      { name: "nori", t: W(2, "small", 1) + 0.15, x: 540, y: 1410 },
      { name: "bounce", t: W(2, "small", 1) + 0.3, x: 780, y: 1370 },
    ],
  },
  phone: { in: 10.1, out: 139.6 },
  stamps: [
    { t: 14.25, text: "Noted" },
    { t: 19.2, icon: "heart", color: "#ffc7a6", pos: { x: 850, y: 1290 }, rot: 8 },
    { t: 24.25, text: "Planned" },
    { t: 29.2, icon: "timer", color: "#a9dfd4" },
  ],
  plus: [],
  page: { t: 140, fold: 144.75 },
  end: { t: 145, helpers: ["luma", "nori", "bounce"] },
  script({ S, tap, drag, hl, typing, flip, bubble, cue, camTo, camFull, R, layer, K, px, prog, spring, setStyle }) {
    // Moments 3–6 below are the FIRST CUT, which the owner found "way too fast": up to five actions and six camera
    // moves in 5 seconds, spins of under a second. They show the API, not the pace. Rebuild each with one action,
    // one push-in, a spin of 1.5 s or more and a result held for about a second (references/motion.md, "Calm pace").
    // 3 · How you slept: open the log, spin "Fell asleep" to 11:00 pm, save. Stamp: Noted.
    S(M(3) - 0.45, "s3-sleep", "cut");
    camFull(M(3) - 0.2);
    camTo(M(3) + 0.15, R(20, 380, 350, 160));
    tap(W(3, "note") + 0.05, "s3-sleep", "log");
    S(W(3, "note") + 0.2, "s3-sheet"); camTo(W(3, "note") + 0.25, R(0, 520, 390, 120));
    tap(W(3, "slept") - 0.05, "s3-sheet", "fell");
    S(W(3, "slept") + 0.08, "s3-open"); camTo(W(3, "slept") + 0.12, R(40, 250, 320, 390));
    drag(W(3, "spin") - 0.08, W(3, "spin") + 0.62, "s3-open", "hour", 0, -70);
    flip(W(3, "spin") - 0.04, W(3, "spin") + 0.66, "s3-spin", 7, { clicks: 2 });
    S(W(3, "spin") + 0.7, "s3-spun", "cut");
    S(W(3, "save") - 0.32, "s3-save"); camTo(W(3, "save") - 0.3, R(0, 650, 390, 180));
    tap(W(3, "save") + 0.05, "s3-save", "save"); cue(W(3, "save") + 0.15, "saved", -13);
    S(W(3, "save") + 0.2, "s3-saved"); camTo(W(3, "save") + 0.25, R(20, 160, 350, 360));

    // 4 · Today, with Luma, Nori and Bounce, each named as the line says "helpers".
    camFull(M(4) - 0.35); S(M(4) - 0.05, "s4-today");
    camTo(W(4, "three") - 0.05, R(40, 330, 310, 170));
    hl(W(4, "helpers"), "s4-today", "trio", 1.8);
    const names = ["Luma", "Nori", "Bounce"], xs = [102, 196, 290];
    layer(W(4, "helpers") - 0.05, M(5) - 0.4, names.map(n => `<div class="namechip">${n}</div>`).join(""), (t, el) => {
      [...el.children].forEach((c, i) => {
        const t0 = W(4, "helpers") + i * 0.16, pop = spring(t - t0, 16, 0.65);
        c.style.left = px(xs[i] * K); c.style.top = px(352 * K);
        setStyle(c, prog(t, t0 - 0.02, t0 + 0.06), `translate(-50%, -100%) scale(${(0.5 + 0.5 * pop).toFixed(4)})`);
      });
    });
    [0, 1, 2].forEach(i => cue(W(4, "helpers") + i * 0.16, "pop", -17, 1.05 + i * 0.07));

    // 5 · One small thing: Plan a task, type "Call the bank", save. Pip agrees. Stamp: Planned.
    camFull(M(5) - 0.35); S(M(5) - 0.05, "s5-focus");
    camTo(M(5) + 0.15, R(20, 430, 350, 130));
    tap(W(5, "pick") + 0.02, "s5-focus", "plan");
    S(W(5, "pick") + 0.17, "s5-sheet"); camTo(W(5, "pick") + 0.2, R(0, 470, 390, 150));
    typing(W(5, "one") - 0.05, W(5, "today") + 0.15, "s5-typed", "s5-type");
    S(W(5, "today") + 0.17, "s5-typed", "cut");
    camTo(W(5, "today") + 0.3, R(0, 600, 390, 230));
    tap(W(5, "today") + 0.75, "s5-typed", "save"); cue(W(5, "today") + 0.85, "saved", -13);
    S(W(5, "today") + 0.9, "s5-saved"); camTo(W(5, "today") + 0.95, R(20, 560, 350, 110));
    bubble(M(5) + 3.15, M(6) - 0.15, "pip", "One little thing. That’s a good place to start.");

    // 6 · A timer: spin the minutes from 10 to 25, Set timer, Start timer.
    camFull(M(6) - 0.35); S(M(6) - 0.05, "s6-card");
    camTo(M(6) + 0.1, R(20, 300, 350, 400));
    drag(M(6) + 0.45, M(6) + 1.35, "s6-card", "minutes", 0, -120);
    flip(M(6) + 0.5, M(6) + 1.4, "s6-spin", 8, { clicks: 9 });
    S(M(6) + 1.45, "s6-spun", "cut");
    tap(M(6) + 1.95, "s6-spun", "set");
    S(M(6) + 2.1, "s6-set"); camTo(M(6) + 2.12, R(20, 270, 350, 330));
    tap(M(6) + 2.85, "s6-set", "start"); cue(M(6) + 2.95, "timer", -13);
    S(M(6) + 3.0, "s6-running");
  },
});
