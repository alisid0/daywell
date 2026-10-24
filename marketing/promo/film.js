// Daywell promo v2: "one day, from morning to night", 1080×1920, 120 s. The whole film is a pure function of time:
// seek(t) sets every style for that moment and nothing else. The story is in SCRIPT.md; the voice, music and real
// app screens are described in data/film-data.js (built by tools/build-data.mjs). window.cues lists every sound
// effect, built from the same timeline, for tools/mix.mjs.
(() => {
const D = window.FILM_DATA;
const DURATION = 120;
const $ = id => document.getElementById(id);
const make = (tag, cls, parent, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (parent) parent.appendChild(e); return e; };

// ---------- Maths: springs, easing, colour
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, t0, t1) => clamp((t - t0) / (t1 - t0));
const eio = t => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const eout = t => 1 - (1 - t) ** 3;
const ein = t => t * t * t;
function spring(tau, w = 18, z = 0.85) {
  if (tau <= 0) return 0;
  if (z >= 1) { const x = w * tau; return 1 - Math.exp(-x) * (1 + x); }
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * tau) * (Math.cos(wd * tau) + ((z * w) / wd) * Math.sin(wd * tau));
}
class Track { // many target changes = one spring per change, summed, so the value is a pure function of t
  constructor(v0) { this.v0 = v0; this.cur = v0; this.ev = []; }
  to(t, v, w = 18, z = 0.85) { if (v !== this.cur) { this.ev.push([t, v - this.cur, w, z]); this.cur = v; } return this; }
  at(t) { let v = this.v0; for (const [t0, d, w, z] of this.ev) v += d * spring(t - t0, w, z); return v; }
}
const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mixHex = (a, b, t) => { const A = hexRgb(a), B = hexRgb(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(",")})`; };
function kf(t, keys, ease = eio) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const [t0, v0] = keys[i - 1], [t1, v1] = keys[i]; return lerp(v0, v1, ease(prog(t, t0, t1))); }
  return keys.at(-1)[1];
}
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// Content visibility: enters on a spring with a short blur, exits short and early so states never double-print.
function vis(t, tin, tout, dOut = 0.16) {
  const e = spring(t - tin, 22, 1), x = tout == null ? 0 : prog(t, tout, tout + dOut), xo = x * x;
  return { o: e * (1 - xo), b: (1 - e) * 10 + xo * 10, dy: (1 - e) * 18 - xo * 12, e };
}
const px = v => `${v.toFixed(2)}px`;
function setStyle(node, o, transform, filter) {
  const op = clamp(o);
  node.style.opacity = op.toFixed(3);
  node.style.visibility = op > 0.001 ? "visible" : "hidden";
  if (transform !== undefined) node.style.transform = transform;
  if (filter !== undefined) node.style.filter = filter;
}

// ---------- Geometry: the phone screen in world space, and the camera
const K = 560 / 390; // film px per app CSS px (captures are 390×844 CSS px)
const SCR = { x: 260, y: 494, w: 560, h: 1212, r: 64 };
const wr = b => ({ x: SCR.x + b.x * K, y: SCR.y + b.y * K, w: b.w * K, h: b.h * K });
const R = (x, y, w, h) => ({ x, y, w, h });
const box = (shot, name) => { const b = D.shots[shot]?.boxes?.[name]; if (!b) throw Error(`no box ${shot}.${name}`); return b; };
const A = { x: 540, y: 1060 }; // where the camera's focus point sits on the canvas (below the captions)
const cam = { x: new Track(540), y: new Track(1100), lz: new Track(0) };
const CAMK = []; // [t, x, y, zoom, w] collected from the whole timeline, applied in order below
const FULL = { x: 540, y: 1100 }; // phone centre in world space: at zoom 1 the phone sits where it was designed
function camFull(t, w = 5.4) { CAMK.push([t, FULL.x, FULL.y, 1, w]); }
function camTo(t, region, zoom, w = 5.4) {
  const r = wr(region);
  const z = zoom ?? clamp(Math.min(960 / r.w, 940 / r.h), 1, 2.3);
  CAMK.push([t, r.x + r.w / 2, r.y + r.h / 2, z, w]);
}
function camWorld(t, x, y, z, w = 5.4) { CAMK.push([t, x, y, z, w]); }
const camAt = t => {
  const z = Math.exp(cam.lz.at(t)), cx = cam.x.at(t), cy = cam.y.at(t);
  // At zoom 1 the world is untransformed; as zoom grows the focus point moves to A.
  const k = clamp((z - 1) / 0.25);
  return { cx, cy, z, ax: lerp(cx, A.x, k), ay: lerp(cy, A.y, k) };
};
const toScreen = (p, c) => ({ x: (p.x - c.cx) * c.z + c.ax, y: (p.y - c.cy) * c.z + c.ay });

// ---------- The timeline
const TL = { screens: [], taps: [], typing: [], ticks: [], bubbles: [], flashes: [], cues: [], hls: [] };
const cue = (t, sound, gain = -14, rate = 1) => TL.cues.push({ t: +t.toFixed(3), sound, gain, rate });
const S = (t, shot, fx = "blur") => TL.screens.push({ t, shot, fx });
function tap(t, shot, name, opts = {}) {
  const b = box(shot, name), r = wr(b);
  TL.taps.push({ t, x: r.x + r.w / 2 + (opts.dx || 0) * K, y: r.y + r.h / 2 + (opts.dy || 0) * K });
  TL.hls.push({ t, b, until: opts.hold ?? 0.35 });
  cue(t, "tap", -13, opts.rate || 1);
}
function typing(t0, t1, shot, crop, sound = true) {
  const c = box(shot, `${crop}:clip`);
  TL.typing.push({ t0, t1, crop, c });
  if (sound) for (let t = t0; t < t1 - 0.3; t += 1.35) cue(t, "typing", -14);
}
const ticks = (t0, shot, crop, from, to) => TL.ticks.push({ t0, crop, c: box(shot, `${crop}:clip`), from, to });
const bubble = (t0, t1, helper, text) => { TL.bubbles.push({ t0, t1, helper, text }); cue(t0 + 0.05, "pop", -18, 1.1); };
const word = (n, w, k = 0) => { const line = D.vo[n - 1]; const hits = line.words.filter(x => x.w.toLowerCase().replace(/[^a-z0-9']/g, "") === w.toLowerCase()); if (!hits[k]) throw Error(`no word ${n}:${w}`); return hits[k].t; };

const CARDS = [
  { t: 12.0, time: "7:00", title: "One small thing", color: "#F2BD72", helper: "pip", shot: "s3-type" },
  { t: 18.0, time: "8:00", title: "Breakfast", color: "#F3C5B5", helper: "nori", shot: "s4-eat" },
  { t: 28.0, time: "10:30", title: "Desk break", color: "#F3A6A9", helper: "bounce", shot: "s5-move" },
  { t: 38.0, time: "13:00", title: "Out of milk", color: "#D4E2B9", helper: "momo", shot: "s6-type" },
  { t: 46.0, time: "17:30", title: "Dinner", color: "#F3C5B5", helper: "nori", shot: "s7-planner" },
  { t: 61.0, time: "21:00", title: "Pause", color: "#D9C9F2", helper: "luma", shot: "s8-relax" },
  { t: 72.0, time: "22:30", title: "Wind down", color: "#D9C9F2", helper: "luma", shot: "s9-sleep" },
  { t: 88.0, time: "7:05", title: "Good morning", color: "#F5DF9E", helper: "sunny", shot: "s10-log" },
];
const CARD = { drop: 0.32, open0: 0.3, open1: 1.0 }; // drop lands on t (a bar); it opens into the screen by t + 1
for (const c of CARDS) { camFull(c.t - CARD.drop - 0.75); cue(c.t - CARD.drop, "card-drop", -11); S(c.t + CARD.open1, c.shot, "cut"); cue(c.t + CARD.open0, "whoosh", -16); }

// Scene 3, 7:00: one small thing, ten minutes of focus (Pip)
camTo(12.85, R(16, 150, 358, 125));
tap(13.25, "s3-type", "field");
typing(13.45, 14.55, "s3-typed", "s3-typing");
S(14.56, "s3-typed", "cut");
tap(14.78, "s3-typed", "send");
S(14.9, "s3-plan"); camTo(14.95, R(16, 285, 358, 235));
tap(15.72, "s3-plan", "start"); cue(15.8, "timer", -16);
S(15.82, "s3-focus"); camTo(15.88, R(16, 92, 358, 380));
ticks(16.82, "s3-focus-ticks", "s3-tick", 1, 2);

// Scene 4, 8:00: breakfast from a photo, or by hand (Nori)
camTo(18.85, R(16, 330, 358, 380));
tap(19.3, "s4-eat", "photo");
cue(19.42, "shutter", -9); TL.flashes.push({ t: 19.42 });
S(19.45, "s4-preview", "cut"); camTo(19.5, R(16, 210, 358, 390));
tap(19.98, "s4-preview", "review");
S(20.1, "s4-result"); camTo(20.12, R(16, 130, 358, 370));
camTo(20.9, R(16, 520, 358, 170));
S(21.35, "s4-result2"); camTo(21.4, R(16, 290, 358, 210));
tap(21.78, "s4-result2", "save"); cue(21.88, "saved", -12);
S(21.9, "s4-saved"); camTo(21.95, R(16, 230, 358, 340));
S(22.62, "s4-hand"); camTo(22.68, R(16, 60, 358, 380));
bubble(23.75, 26.9, "nori", "A little nourishment, without the judgement.");

// Scene 5, 10:30: a desk break with Bounce, saved even though it stopped early
camTo(28.85, R(16, 470, 358, 260));
tap(29.35, "s5-move", "start");
S(29.47, "s5-step1"); camTo(29.52, R(16, 20, 358, 250));
S(30.12, "s5-step1b", "scroll"); camTo(30.16, R(16, 330, 358, 300));
ticks(30.62, "s5-step1-ticks", "s5-tick", 1, 1);
tap(31.05, "s5-step1b", "next"); cue(31.12, "tick", -18);
S(31.15, "s5-step2", "blur");
tap(31.5, "s5-step2", "next", { rate: 1.06 }); cue(31.57, "tick", -18, 1.06);
S(31.6, "s5-step4", "blur");
tap(32.1, "s5-step4", "end");
S(32.22, "s5-ended"); camTo(32.26, R(16, 24, 358, 175));
camTo(32.7, R(16, 300, 358, 170));
tap(33.15, "s5-ended", "review"); cue(33.25, "saved", -12);
S(33.27, "s5-saved"); camTo(33.3, R(16, 20, 358, 300));
bubble(34.35, 37.3, "bounce", "A stretch counts. A small walk counts, too.");

// Scene 6, 13:00: out of milk, typed the way you'd say it (Momo)
camTo(38.85, R(16, 150, 358, 125));
tap(39.25, "s6-type", "field");
typing(39.45, 40.55, "s6-typed", "s6-typing");
S(40.56, "s6-typed", "cut");
tap(40.85, "s6-typed", "send");
S(40.97, "s6-plan"); camTo(41.0, R(16, 280, 358, 200));
tap(41.72, "s6-plan", "do"); cue(41.82, "tick", -14);
S(41.84, "s6-done"); camTo(41.88, R(16, 120, 358, 290));
bubble(43.4, 45.6, "momo", "Pop it on the list. I’ll keep it here for you.");

// Scene 7, 17:30: what can my basket make? (Nori)
camTo(46.85, R(16, 90, 358, 560));
tap(47.3, "s7-planner", "three");
S(47.62, "s7-typed", "blur"); camTo(47.66, R(16, 500, 358, 150));
typing(47.95, 48.95, "s7-typed", "s7-typing");
tap(49.1, "s7-typed", "continue");
S(49.22, "s7-result"); camTo(49.26, R(16, 110, 358, 420));
S(50.1, "s7-result2"); camTo(50.14, R(16, 90, 358, 380));
tap(50.62, "s7-result2", "review");
S(50.74, "s7-review"); camTo(50.78, R(16, 90, 358, 330));
S(51.3, "s7-review2", "slide"); camTo(51.34, R(16, 300, 358, 190));
tap(51.75, "s7-review2", "save"); cue(51.85, "saved", -12);
S(51.88, "s7-shopping"); camTo(51.92, R(16, 280, 358, 450));
cue(53.95, "swoosh", -16); camTo(54.0, R(16, 400, 358, 330));
bubble(54.6, 57.4, "nori", "Something good, made simple.");

// Scene 8, 21:00: still scrolling? A pause instead (Luma)
camFull(57.6);
for (const t of [58.15, 58.95, 59.7, 60.35]) cue(t, "scroll", -13);
camTo(61.85, R(16, 110, 358, 120));
camTo(63.0, R(40, 220, 310, 360));
tap(64.75, "s8-relax", "guide");
S(64.87, "s8-guide"); camTo(64.9, R(16, 240, 358, 470), 1.25);
cue(70.3, "stars", -18);

// Scene 9, 22:30: wind down with a sleep sound; nothing tracks you at night (Luma)
camTo(72.85, R(16, 430, 358, 230));
tap(73.25, "s9-sleep", "wind");
S(73.37, "s9-wind"); camTo(73.4, R(16, 240, 358, 480), 1.3);
S(74.05, "s9-sounds", "slide"); camTo(74.1, R(16, 90, 358, 300));
tap(74.45, "s9-sounds", "waves"); cue(74.55, "tick", -20);
tap(75.3, "s9-sounds", "thirty"); cue(75.38, "tick", -20, 1.08);
camTo(75.5, R(16, 560, 358, 210));
bubble(79.4, 83.2, "luma", "You can put the day down for a little while.");
cue(78.9, "stars", -20);

// Scene 10, the next morning: note how you slept, look back without scores (Sunny's morning)
camTo(88.85, R(16, 200, 358, 470), 1.3);
tap(90.15, "s10-log", "save"); cue(90.25, "saved", -12);
S(90.27, "s10-saved"); camTo(90.3, R(16, 105, 358, 230));
S(91.05, "s10-cal"); camTo(91.1, R(16, 150, 358, 260));
tap(91.45, "s10-cal", "look");
S(91.58, "s10-look"); camTo(91.62, R(16, 160, 358, 430), 1.45);
camTo(94.7, R(16, 170, 358, 120), 2.1, 2.2);

// Scene 11: read it your way
S(98.0, "s11-atk"); camTo(98.05, R(16, 110, 358, 560), 1.3);
tap(99.75, "s11-atk", "lexend"); S(99.87, "s11-lex");
tap(100.45, "s11-lex", "od"); S(100.57, "s11-od");
S(101.25, "s11-odl"); cue(101.25, "whoosh", -16);

// Scene 12: two plans
S(104.0, "s12-plans"); camTo(104.05, R(16, 140, 358, 250));
camTo(106.75, R(16, 395, 358, 320));
camFull(109.4);

// Scene 1 and 2 and 13 effects
[0.25, 0.75, 1.15, 1.5, 1.8, 2.1].forEach((t, i) => cue(t, "ping", -16 + i * 0.6, 1 + i * 0.045));
cue(2.62, "card-drop", -10);
cue(6.2, "whoosh", -18);
cue(8.0, "logo-hit", -6); cue(8.05, "shimmer", -16);
[8.5, 9.0, 9.5, 10.0, 10.5, 11.0, 11.5].forEach((t, i) => cue(t, "pop", -15, [1, 1.12, 0.94, 1.06, 0.9, 1.15, 1].at(i)));
cue(11.75, "swoosh", -16);
cue(110.0, "whoosh", -18);
const CHIP_T = [110.15, 110.4, 110.62, 110.84, 111.04, 111.24, 111.44, 111.64];
CHIP_T.forEach((t, i) => cue(t, "pop", -14, 0.9 + i * 0.04));
cue(112.0, "logo-hit", -5); cue(112.05, "shimmer", -14);

CAMK.sort((a, b) => a[0] - b[0]).forEach(([t, x, y, z, w]) => { cam.x.to(t, x, w, 1); cam.y.to(t, y, w, 1); cam.lz.to(t, Math.log(z), w, 1); });
TL.screens.sort((a, b) => a.t - b.t);
for (const h of TL.hls) { const next = TL.screens.find(x => x.t > h.t + 0.001); if (next) h.until = Math.min(h.until, Math.max(0.04, next.t - h.t - 0.2)); }
TL.taps.sort((a, b) => a.t - b.t);
window.cues = TL.cues.sort((a, b) => a.t - b.t);

// ---------- Build the DOM
const IMG = n => `assets/shots/${n}.png`;
const shotsEl = $("shots"), shotImgs = {};
const usedShots = new Set([...TL.screens.map(s => s.shot), ...CARDS.map(c => c.shot)]);
for (const n of usedShots) { const im = make("img", "shot", shotsEl); im.src = IMG(n); im.alt = ""; shotImgs[n] = im; }
for (const ty of TL.typing) {
  ty.imgs = ty.c.counts.map(n => { const im = make("img", "crop", shotsEl); im.src = IMG(`${ty.crop}-${String(n).padStart(2, "0")}`); im.alt = "";
    Object.assign(im.style, { left: px(ty.c.x * K), top: px(ty.c.y * K), width: px(ty.c.w * K), height: px(ty.c.h * K), zIndex: 5 }); return im; });
  ty.len = ty.c.counts.at(-1);
}
for (const tk of TL.ticks) {
  tk.imgs = [];
  for (let i = tk.from; i <= tk.to; i++) { const im = make("img", "crop", shotsEl); im.src = IMG(`${tk.crop}-${i}`); im.alt = "";
    Object.assign(im.style, { left: px(tk.c.x * K), top: px(tk.c.y * K), width: px(tk.c.w * K), height: px(tk.c.h * K), zIndex: 6 }); tk.imgs.push({ i, im }); }
}
const scroller = make("div", null, shotsEl), scrollA = make("img", null, scroller), scrollB = make("img", null, scroller);
Object.assign(scroller.style, { position: "absolute", left: "0", top: "0", width: "560px", height: px(760 * K), overflow: "hidden", zIndex: 3, visibility: "hidden" });
for (const im of [scrollA, scrollB]) Object.assign(im.style, { position: "absolute", left: "0", top: "0", width: "560px", height: "1212px" });
// The 9 pm breath: Luma (cropped from the real guidance screen) gently rises and settles, as the app's companion does,
// inside a slow ring: in for three seconds, out for three.
const breathRing = make("div", null, shotsEl), lumaBreath = make("div", null, shotsEl);
Object.assign(breathRing.style, { position: "absolute", left: px(196 * K - 200), top: px(413 * K - 200), width: "400px", height: "400px", borderRadius: "50%", zIndex: 4,
  border: "4px solid rgba(128,60,101,.32)", background: "radial-gradient(circle, rgba(217,201,242,.0) 52%, rgba(217,201,242,.45) 70%, rgba(217,201,242,0) 72%)", visibility: "hidden" });
Object.assign(lumaBreath.style, { position: "absolute", left: px(92 * K), top: px(296 * K), width: px(210 * K), height: px(236 * K), zIndex: 5, transformOrigin: "50% 92%",
  background: `url(${IMG("s8-guide")}) ${px(-92 * K)} ${px(-296 * K)} / 560px 1212px no-repeat`, visibility: "hidden",
  webkitMaskImage: "radial-gradient(ellipse 50% 50% at 50% 52%, #000 70%, transparent 100%)", maskImage: "radial-gradient(ellipse 50% 50% at 50% 52%, #000 70%, transparent 100%)" });
const hlEls = TL.hls.map(h => { const d = make("div", "hl", $("hls")); Object.assign(d.style, { left: px(h.b.x * K - 6), top: px(h.b.y * K - 6), width: px(h.b.w * K + 12), height: px(h.b.h * K + 12) }); return d; });

// The generic feed for "still scrolling" (no real app or brand): plain posts with soft colour blocks.
const feed = $("feed"), POSTS = [];
{ const rnd = mulberry32(7), hues = [[221, 214, 234], [235, 214, 205], [210, 228, 222], [232, 222, 205], [214, 222, 236]];
  for (let i = 0; i < 9; i++) { const p = make("div", "post", feed, '<div class="av"></div><div class="nm"></div><div class="nm2"></div><div class="im"></div><div class="ac"></div>');
    const [r, g, b] = hues[i % hues.length]; p.querySelector(".im").style.background = `linear-gradient(${Math.round(rnd() * 180)}deg, rgb(${r},${g},${b}), rgb(${r - 30},${g - 25},${b - 20}))`; POSTS.push(p); } }

// Hook calendar: other people's plans, then You
const cal = $("hookCal");
make("div", "hdr", cal, "Today");
const HOURS = ["8:00", "9:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];
HOURS.forEach((h, i) => { const y = 150 + i * 70; const r = make("div", "row", cal); r.style.top = px(y); const l = make("div", "hr", cal, h); l.style.top = px(y + 8); });
const HOOK = [["9:00", "Team call", 1], ["10:30", "Reply to Jo", 2.5], ["12:00", "School forms", 4], ["15:00", "Dentist", 7], ["17:00", "Mum’s present", 9], ["20:00", "Emails", 12]];
const HOOK_T = [0.25, 0.75, 1.15, 1.5, 1.8, 2.1];
const hookEvs = HOOK.map(([tm, title, row]) => { const e = make("div", "ev", cal, `<small>${tm}</small>${title}`); e.dataset.y = 150 + row * 70 + 6; return e; });
const you = make("div", "ev you", $("brand"), "<small>All day</small>You");
you.style.left = "0px"; you.style.top = "0px";

// Brand: Daywell's sun mark and name, the seven helpers
const SUN_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%"><circle cx="12" cy="12" r="4"/><path class="ray" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`;
const mark = $("mark");
const markSun = make("div", "sun", mark, SUN_SVG), markWord = make("div", "word", mark, "daywell.");
const HELPERS = ["sunny", "pip", "nori", "bounce", "momo", "tock", "luma"];
const helperEls = HELPERS.map(h => { const d = make("div", "helper", $("helpers"), `<img src="assets/mascots/${h}.webp" alt="">`); return d; });

// The event card
const card = $("card"), cardFill = card.querySelector(".fill"), cardInner = card.querySelector(".inner"), cardLab = card.querySelector(".lab"), cardPor = card.querySelector(".por");
const cardInnerImgs = {};
for (const c of CARDS) { const im = make("img", null, cardInner); im.src = IMG(c.shot); im.alt = ""; Object.assign(im.style, { position: "absolute", left: "0", top: "0", width: "560px", height: "1212px", opacity: "0" }); cardInnerImgs[c.shot] = im; }

// Ending: the day's dates, gathered
const CHIPS = [["7:00", "One small thing", "#F2BD72", "pip"], ["8:00", "Breakfast", "#F3C5B5", "nori"], ["10:30", "Desk break", "#F3A6A9", "bounce"], ["13:00", "Out of milk", "#D4E2B9", "momo"],
  ["17:30", "Dinner", "#F3C5B5", "nori"], ["21:00", "Pause", "#D9C9F2", "luma"], ["22:30", "Wind down", "#D9C9F2", "luma"], ["7:05", "Good morning", "#F5DF9E", "sunny"]];
const chipEls = CHIPS.map(([tm, title, col, h]) => { const d = make("div", "chip", $("chips"), `<b>${tm}</b><span>${title}</span><i><img src="assets/mascots/${h}/portrait.webp" alt=""></i>`); d.style.background = col; return d; });
const endcard = $("endcard");
const endSun = make("div", "sun", endcard, SUN_SVG), endUrl = make("div", "url", endcard, "daywell.date");

// Sky: stars, blobs
const STARS = []; { const rnd = mulberry32(42); for (let i = 0; i < 54; i++) { const s = make("div", "star", $("stars")); const x = rnd() * 1080, y = 80 + rnd() * 1500; s.style.left = px(x); s.style.top = px(y); const sc = 0.5 + rnd() * 1.1; STARS.push({ s, sc, ph: rnd() * 6.28, sp: 0.6 + rnd() * 1.6 }); } }
const blobA = $("blobA"), blobB = $("blobB");
Object.assign(blobA.style, { width: "900px", height: "900px", left: "-300px", top: "-200px", background: "radial-gradient(circle, rgba(255,255,255,.7) 0%, rgba(255,255,255,0) 66%)" });
Object.assign(blobB.style, { width: "1000px", height: "1000px", left: "420px", top: "1100px", background: "radial-gradient(circle, rgba(217,201,242,.6) 0%, rgba(217,201,242,0) 66%)" });

// Bubbles
const bubbleEls = TL.bubbles.map(b => make("div", "bubble", $("bubbles"), `<i><img src="assets/mascots/${b.helper}/portrait.webp" alt=""></i><span>${b.text}</span>`));

// ---------- Captions: the voiceover's own words, in cards, each word rising on its spoken start time
// A card is [line, first word index, last word index] plus optional display text (figures shown for spoken prices).
const CAPS = [
  [1, 0, 6], [1, 7, 12], [2, 0, 2], [2, 3, 9], [3, 0, 4], [3, 5, 8], [4, 0, 2], [4, 3, 8], [4, 9, 13],
  [5, 0, 7], [5, 8, 9], [5, 10, 13], [5, 14, 16], [6, 0, 2], [6, 3, 9], [6, 10, 15],
  [7, 0, 4], [7, 5, 10], [7, 11, 17], [8, 0, 3], [8, 4, 7], [8, 8, 10], [8, 11, 12], [9, 0, 5], [9, 6, 10], [9, 11, 16],
  [10, 0, 6], [10, 7, 11], [10, 12, 15], [11, 0, 3], [11, 4, 8],
  [12, 0, 5, "Daywell · £4.99 a month"], [12, 6, 10, "Daywell Plus · £9.99 a month"], [13, 0, 4],
];
const ACCENT = new Set(["date", "Daywell", "counts", "breathe", "scores", "list", "basket", "yourself"]);
const capWrap = $("captions");
const CAP = CAPS.map(([n, a, b, display, accentFrom], i) => {
  const line = D.vo[n - 1], words = line.words.slice(a, b + 1);
  const next = CAPS[i + 1];
  const tin = words[0].t - 0.08;
  const tEndSpoken = words.at(-1).e;
  const tNext = next ? D.vo[next[0] - 1].words[next[1]].t - 0.12 : tEndSpoken + 1.2;
  const tout = next ? Math.min(tNext - 0.02, tEndSpoken + 1.4) : DURATION + 1;
  const el = make("div", "cap", capWrap); const p = make("p", null, el);
  let spans = [];
  if (display) {
    display.split(" ").forEach((w, j) => { const o = make("span", "w", p); const inner = make("span", "wi", o, w); if (/£/.test(w)) inner.classList.add("acc"); p.appendChild(document.createTextNode(" ")); spans.push({ inner, t: words[Math.min(j, words.length - 1)].t }); });
  } else {
    words.forEach(w => { const o = make("span", "w", p); const clean = w.w.replace(/[.,?!:]$/, ""); const inner = make("span", "wi", o, w.w); if (ACCENT.has(clean)) inner.classList.add("acc"); p.appendChild(document.createTextNode(" ")); spans.push({ inner, t: w.t }); });
  }
  return { el, p, spans, tin, tout, n };
});

// ---------- Draw a frame
let skyTopNow = "#fcebf3";
function drawSky(t) {
  const SKY = [
    [0, "#f7e4ee", "#efd2e1"], [7, "#f7e4ee", "#efd2e1"], [8.2, "#fcebf3", "#f4d8e8"], [11.6, "#fcebf3", "#f4d8e8"],
    [13, "#fde3d4", "#f7cfdf"], [18, "#fff1e5", "#f9dbe8"], [28, "#fff6ef", "#fbe2ed"], [38, "#fff8f2", "#fce6ef"],
    [46, "#ffe6cb", "#f7cbd9"], [57, "#f6cab9", "#e9b2c9"], [62, "#9877b0", "#dba7c2"], [68, "#4b3a6b", "#7d5a8a"],
    [72.5, "#2b2142", "#191430"], [86.2, "#2b2142", "#191430"], [89.2, "#fde3d4", "#f7cfdf"], [96, "#fff1e5", "#f9dbe8"],
    [104, "#fcebf3", "#f4d8e8"], [120, "#fcebf3", "#f4d8e8"]];
  let i = 1; while (i < SKY.length - 1 && t > SKY[i][0]) i++;
  const [t0, a0, b0] = SKY[i - 1], [t1, a1, b1] = SKY[i], k = eio(prog(t, t0, t1));
  const top = mixHex(a0, a1, k); $("sky").style.background = `linear-gradient(180deg, ${top} 0%, ${mixHex(b0, b1, k)} 100%)`; skyTopNow = top;
  const night = kf(t, [[64, 0], [72, 1], [86, 1], [89, 0]]);
  document.documentElement.style.setProperty("--night", mixHex("#3a2d58", "#241c3a", night));
  blobA.style.opacity = (1 - night).toFixed(3); blobB.style.opacity = (0.8 - night * 0.6).toFixed(3);
  STARS.forEach(({ s, sc, ph, sp }) => { const tw = 0.55 + 0.45 * Math.sin(t * sp + ph); s.style.opacity = (night * tw).toFixed(3); s.style.transform = `scale(${sc})`; });
  // Sun: rises left at dawn, high at noon, sets right; rises again next morning.
  const sx = kf(t, [[12, 110], [38, 540], [58, 990], [86, 990], [88.5, 120], [104, 330], [120, 330]], x => x);
  const sy = kf(t, [[12, 900], [24, 420], [38, 250], [52, 420], [60, 980], [86, 1100], [89.5, 780], [104, 420], [120, 420]]);
  const so = kf(t, [[11.6, 0], [12.6, 1], [57, 1], [61, 0], [87, 0], [89.5, 1], [109.5, 1], [110.5, 0]]);
  setStyle($("sun"), so, `translate(${px(sx)}, ${px(sy)})`);
  setStyle($("moon"), kf(t, [[66, 0], [71, 1], [86, 1], [88, 0]]), `translate(${px(860)}, ${px(kf(t, [[66, 420], [72, 300], [86, 300], [88, 520]]))})`);
  return night;
}

function drawHook(t) {
  const on = t < 7.6;
  const o = 1 - eio(prog(t, 5.9, 6.9));
  setStyle(cal, on ? o * eout(prog(t, 0, 0.25)) : 0, `translateY(${px((1 - eout(prog(t, 0, 0.35))) * 40)})`);
  const squeeze = spring(t - 2.62, 16, 0.85);
  hookEvs.forEach((e, i) => {
    const land = spring(t - HOOK_T[i] + 0.12, 20, 0.78), y0 = Number(e.dataset.y);
    const y = lerp(y0 - 220, y0, land) + squeeze * 96;
    const grey = prog(t, 3.6, 5.2);
    e.style.top = px(y); setStyle(e, prog(t, HOOK_T[i] - 0.12, HOOK_T[i]) * (1 - 0.6 * grey), undefined, `saturate(${1 - grey}) blur(${(grey * 1.5).toFixed(2)}px)`);
  });
  // You: drops into the top of the day, waits, then becomes Daywell's sun.
  const youLand = spring(t - 2.62, 17, 0.8);
  const calX = 90 + 190, calY = 520 + 150 + 6;
  let x = calX, y = lerp(calY - 260, calY, youLand), w = 650, h = 92, r = 28;
  const m = spring(t - 6.15, 9, 0.92); // morph into a disc at the centre
  x = lerp(x, 540 - 150, m); y = lerp(y, 900 - 150, m); w = lerp(w, 300, m); h = lerp(h, 300, m); r = lerp(r, 150, m);
  const grow = 1 + 0.05 * spring(t - 4.2, 6, 1) * (1 - m);
  you.style.left = px(x); you.style.top = px(y); you.style.width = px(w); you.style.height = px(h); you.style.borderRadius = px(r);
  you.style.fontSize = px(44 * (1 - m)); you.querySelector("small").style.opacity = (1 - prog(t, 6.1, 6.4)).toFixed(3);
  const youOut = prog(t, 8.0, 8.25);
  setStyle(you, prog(t, 2.5, 2.62) * (1 - youOut), `scale(${grow.toFixed(4)})`, `blur(${(youOut * 8).toFixed(2)}px)`);
  you.style.background = mixHex("#f3a6c4", "#f6c6d8", m);
  you.style.boxShadow = `0 ${px(14 + 30 * m)} ${px(30 + 50 * m)} rgba(128,60,101,${(0.18 + 0.12 * m).toFixed(3)})`;
}

function drawBrand(t) {
  const on = t > 7.5 && t < 12.6;
  const slam = spring(t - 8.0, 16, 0.62);
  const out = eio(prog(t, 11.55, 12.15));
  mark.style.transform = `translate(0px, ${px(-100 - out * 500)}) scale(${(1 - out * 0.6).toFixed(4)})`;
  setStyle(markSun, on ? prog(t, 7.98, 8.04) * (1 - out) : 0, `scale(${(0.6 + 0.4 * slam).toFixed(4)}) rotate(${((1 - slam) * -40).toFixed(2)}deg)`);
  const wv = vis(t, 8.08, 11.5, 0.3);
  setStyle(markWord, on ? wv.o : 0, `translateY(${px(wv.dy)})`, `blur(${wv.b.toFixed(2)}px)`);
  // Helpers along an arc below the name, one per beat
  helperEls.forEach((h, i) => {
    const t0 = 8.5 + i * 0.5, pop = spring(t - t0, 20, 0.62), leave = eio(prog(t, 11.55 + i * 0.03, 11.95 + i * 0.03));
    const n = HELPERS.length, u = i / (n - 1) - 0.5;
    const x = 540 + u * 840, y = 1340 + Math.abs(u) * 2 * 36;
    h.style.left = px(x); h.style.top = px(y + leave * 600);
    const bob = Math.sin((t - t0) * 2.4 + i) * 6 * (1 - leave);
    setStyle(h, on ? prog(t, t0 - 0.02, t0 + 0.06) * (1 - leave) : 0, `translateY(${px(bob)}) scale(${(0.3 + 0.7 * pop).toFixed(4)})`);
  });
}

function drawPhone(t, c) {
  // The phone rises at 11.6 and leaves at 110.
  const rise = spring(t - 11.62, 7.5, 0.86), leave = eio(prog(t, 109.9, 110.55));
  const phone = $("phone");
  const y = (1 - rise) * 1500 + leave * 1400;
  setStyle(phone, t > 11.5 && t < 110.7 ? 1 : 0, `translateY(${px(y)}) scale(${(1 - leave * 0.25).toFixed(4)})`);
  // Screens: current and previous, with a short blur swap (or an upward slide for scrolling).
  let i = -1; for (let k = 0; k < TL.screens.length; k++) if (TL.screens[k].t <= t) i = k;
  for (const n in shotImgs) shotImgs[n].style.visibility = "hidden";
  if (i >= 0) {
    const cur = TL.screens[i], prev = TL.screens[i - 1];
    const d = cur.fx === "slide" ? 0.46 : cur.fx === "scroll" ? 0.55 : cur.fx === "cut" ? 0 : 0.24;
    const k = d ? prog(t, cur.t, cur.t + d) : 1;
    const ci = shotImgs[cur.shot];
    scroller.style.visibility = "hidden";
    if (cur.fx === "scroll" && prev && k < 1) {
      // A real scroll: the two captures overlap by their scroll difference, so they move as one page above the dock.
      const delta = (D.shots[cur.shot].scrollY - D.shots[prev.shot].scrollY) * K, e = eio(k);
      scrollA.src = shotImgs[prev.shot].src; scrollB.src = ci.src;
      scrollA.style.transform = `translateY(${px(-e * delta)})`; scrollB.style.transform = `translateY(${px((1 - e) * delta)})`;
      scroller.style.visibility = "visible";
      setStyle(ci, 1, "none", "none"); ci.style.zIndex = 2;
    } else if (cur.fx === "slide") {
      // A jump down the page: the old view lifts away, then the new one rises in (never both at once).
      const a = eio(prog(k, 0, 0.55)), b = eout(prog(k, 0.38, 1));
      if (prev && k < 1) { const pi = shotImgs[prev.shot]; setStyle(pi, 1 - a, `translateY(${px(-a * 150)})`, `blur(${(a * 4).toFixed(2)}px)`); pi.style.zIndex = 1; }
      setStyle(ci, k < 1 ? b : 1, `translateY(${px((1 - b) * 150)})`, k < 1 ? `blur(${((1 - b) * 4).toFixed(2)}px)` : "none"); ci.style.zIndex = 2;
    } else {
      if (prev && k < 1 && prev.shot !== cur.shot) { const pi = shotImgs[prev.shot]; setStyle(pi, 1, "none", `blur(${(k * 6).toFixed(2)}px)`); pi.style.zIndex = 1; }
      setStyle(ci, d ? eout(k) : 1, `translateY(${px((1 - eout(k)) * 10)})`, k < 1 && d ? `blur(${((1 - k) * 6).toFixed(2)}px)` : "none"); ci.style.zIndex = 2;
    }
  }
  // Typing crops over the field
  for (const ty of TL.typing) {
    ty.imgs.forEach(im => (im.style.visibility = "hidden"));
    if (t >= ty.t0 && t < ty.t1 + 0.05) {
      const chars = Math.floor(prog(t, ty.t0, ty.t1) * ty.len + 1e-6);
      let j = 0; ty.c.counts.forEach((n, k) => { if (n <= chars) j = k; });
      setStyle(ty.imgs[j], 1);
    }
  }
  for (const tk of TL.ticks) for (const { i: n, im } of tk.imgs) { const ts = tk.t0 + (n - tk.from); const show = t >= ts && t < ts + 1 + (n === tk.to ? 5 : 0) && t < (TL.screens.find(s => s.t > ts)?.t ?? 999); setStyle(im, show ? 1 : 0); }
  // Taps make the touched control light up for a moment.
  TL.hls.forEach((h, k) => { const e = prog(t, h.t - 0.02, h.t + 0.06) * (1 - prog(t, h.t + h.until, h.t + h.until + 0.25)); setStyle(hlEls[k], e * 0.9); });
  // Camera flash for the photo
  let fl = 0; for (const f of TL.flashes) fl = Math.max(fl, prog(t, f.t - 0.03, f.t) * (1 - prog(t, f.t + 0.02, f.t + 0.3)));
  setStyle($("flash"), fl * 0.85);
  // The generic feed, scrolling fast until the pause card lands
  const fOn = kf(t, [[57.9, 0], [58.15, 1], [61.7, 1], [61.9, 0]], x => x);
  setStyle(feed, fOn);
  if (fOn > 0) { const v = 1500, stop = 61.0; const dist = t < stop ? (t - 57.9) * v : (stop - 57.9) * v + eout(prog(t, stop, stop + 0.6)) * 220;
    POSTS.forEach((p, j) => { const y = ((j * 560 - dist) % (9 * 560) + 9 * 560) % (9 * 560) - 560; p.style.transform = `translateY(${px(y + 120)})`; }); feed.style.filter = t < stop ? "blur(1.2px)" : "none"; }
  const br = t < 68.6 ? eio(prog(t, 65.6, 68.6)) : 1 - eio(prog(t, 68.6, 71.6)), bo = prog(t, 65.2, 65.7) * (1 - prog(t, 71.7, 72.3));
  setStyle(breathRing, bo * (0.55 + 0.45 * br), `scale(${(0.82 + 0.3 * br).toFixed(4)})`);
  setStyle(lumaBreath, bo > 0 ? 1 : 0, `translateY(${px(-br * 10)}) scale(${(1 + 0.035 * br).toFixed(4)})`);
  // Night: the phone goes dark after "nothing tracks you at night", and wakes for the morning
  const dim = kf(t, [[77.4, 0], [79.2, 0.88], [86.6, 0.88], [87.6, 0]]);
  setStyle($("dim"), dim);
}

function drawCard(t, c) {
  let active = null; for (const cd of CARDS) if (t >= cd.t - CARD.drop - 0.05 && t < cd.t + CARD.open1 + 0.06) active = cd;
  if (!active) { setStyle(card, 0); return; }
  const t0 = active.t;
  const land = spring(t - (t0 - CARD.drop), 18, 0.8);
  const ly = SCR.y + 120;
  let x = 540 - 270, y = lerp(ly - 330, ly, land), w = 540, h = 124, r = 34;
  const m = spring(t - (t0 + CARD.open0), 12, 0.95);
  x = lerp(x, SCR.x, m); y = lerp(y, SCR.y, m); w = lerp(w, SCR.w, m); h = lerp(h, SCR.h, m); r = lerp(r, SCR.r, m);
  Object.assign(card.style, { left: px(x), top: px(y), width: px(w), height: px(h), borderRadius: px(r) });
  const phoneY = (1 - spring(t - 11.62, 7.5, 0.86)) * 1500; // the card rides with the phone while it rises
  setStyle(card, prog(t, t0 - CARD.drop - 0.05, t0 - CARD.drop + 0.08), `translateY(${px(phoneY)})`);
  cardFill.style.background = active.color; cardFill.style.opacity = (1 - prog(m, 0.45, 0.95)).toFixed(3);
  for (const s in cardInnerImgs) cardInnerImgs[s].style.opacity = s === active.shot ? prog(m, 0.3, 0.8).toFixed(3) : "0";
  cardInner.style.opacity = "1"; cardInner.style.left = px(SCR.x - x); cardInner.style.top = px(SCR.y - y);
  const lv = vis(t, t0 - CARD.drop + 0.05, t0 + CARD.open0 - 0.05, 0.14);
  cardLab.querySelector("b").textContent = active.time; cardLab.querySelector("span").textContent = active.title;
  setStyle(cardLab, lv.o, `translateY(${px(lv.dy)})`, `blur(${lv.b.toFixed(2)}px)`);
  const pi = cardPor.querySelector("img"); const want = `assets/mascots/${active.helper}/portrait.webp`; if (!pi.src.endsWith(want)) pi.src = want;
  setStyle(cardPor, lv.o, `scale(${(0.7 + 0.3 * lv.e).toFixed(4)})`);
  card.style.boxShadow = `0 ${px(30 * (1 - m))} ${px(70 * (1 - m) + 1)} rgba(82,45,70,${(0.28 * (1 - m)).toFixed(3)})`;
}

function drawFinger(t, c) {
  const f = $("finger");
  // Which taps belong together: a gap of more than 2.4 s starts a new group (the finger fades between groups).
  let g0 = -1, g1 = -1;
  for (let i = 0; i < TL.taps.length; i++) {
    let a = i; while (a > 0 && TL.taps[a].t - TL.taps[a - 1].t < 2.4) a--;
    let b = i; while (b < TL.taps.length - 1 && TL.taps[b + 1].t - TL.taps[b].t < 2.4) b++;
    if (t >= TL.taps[a].t - 0.75 && t <= TL.taps[b].t + 0.55) { g0 = a; g1 = b; break; }
  }
  if (g0 < 0) { setStyle(f, 0); return; }
  // Position: approach each tap on springs with different x/y stiffness so the path bows.
  const fx = new Track(TL.taps[g0].x + 60), fy = new Track(TL.taps[g0].y + 160);
  for (let i = g0; i <= g1; i++) { fx.to(TL.taps[i].t - 0.42, TL.taps[i].x, 15, 0.95); fy.to(TL.taps[i].t - 0.42, TL.taps[i].y, 11.5, 0.95); }
  const last = TL.taps[g1]; fx.to(last.t + 0.2, last.x + 40, 8, 1); fy.to(last.t + 0.2, last.y + 120, 8, 1);
  const p = toScreen({ x: fx.at(t), y: fy.at(t) }, c);
  let press = 0, ring = 0, ringK = 0;
  for (let i = g0; i <= g1; i++) { const d = t - TL.taps[i].t; press = Math.max(press, Math.exp(-((d / 0.07) ** 2))); if (d >= 0 && d < 0.5) { ringK = d / 0.5; ring = 1; } }
  const o = prog(t, TL.taps[g0].t - 0.6, TL.taps[g0].t - 0.36) * (1 - prog(t, last.t + 0.25, last.t + 0.55));
  setStyle(f, o, `translate(${px(p.x)}, ${px(p.y)}) scale(${(1 - 0.18 * press).toFixed(4)})`);
  const rg = f.querySelector(".ring"); rg.style.opacity = (ring * (1 - ringK) * 0.9).toFixed(3); rg.style.transform = `scale(${(0.5 + 1.6 * eout(ringK)).toFixed(4)})`;
  f.querySelector(".dot").style.background = `rgba(255,255,255,${(0.86 - 0.18 * press).toFixed(3)})`;
}

function drawBubbles(t) {
  TL.bubbles.forEach((b, i) => {
    const e = bubbleEls[i], pop = spring(t - b.t0, 16, 0.7), out = prog(t, b.t1 - 0.2, b.t1);
    e.style.left = "70px"; e.style.top = "1330px";
    setStyle(e, prog(t, b.t0 - 0.02, b.t0 + 0.08) * (1 - out), `scale(${(0.6 + 0.4 * pop).toFixed(4)}) translateY(${px(out * 20)})`, out > 0 ? `blur(${(out * 6).toFixed(2)}px)` : "none");
  });
}

function drawBand(t, c, skyTop) {
  const band = $("capband"), o = clamp((c.z - 1.03) / 0.2);
  band.style.background = `linear-gradient(180deg, ${skyTop} 0%, ${skyTop} 62%, transparent 100%)`;
  setStyle(band, o);
}

function drawCaptions(t, night) {
  const [r0, g0, b0] = skyTopNow.match(/\d+/g).map(Number); const lum = (0.2126 * r0 + 0.7152 * g0 + 0.0722 * b0) / 255;
  const ink = lum < 0.62 ? "#f8eef4" : "#522d46"; capWrap.classList.toggle("light", lum < 0.62);
  const font = t > 100.5 && t < 104 ? '"OpenDyslexic", sans-serif' : t > 99.85 && t < 104 ? '"Lexend", sans-serif' : '"Atkinson", sans-serif';
  const size = t > 101.25 && t < 104 ? 1.12 : 1;
  CAP.forEach(cp => {
    if (t < cp.tin - 0.1 || t > cp.tout + 0.25) { setStyle(cp.el, 0); return; }
    const out = prog(t, cp.tout, cp.tout + 0.18);
    setStyle(cp.el, 1 - out * out, `translateY(${px(-out * 14)})`, out > 0 ? `blur(${(out * 8).toFixed(2)}px)` : "none");
    cp.p.style.color = ink; cp.p.style.fontFamily = font; cp.p.style.fontSize = px(76 * size * (font.includes("Dyslexic") ? 0.86 : 1));
    cp.p.style.fontWeight = font.includes("Dyslexic") ? "400" : "800";
    cp.spans.forEach(s => { const e = spring(t - (s.t - 0.06), 24, 1); s.inner.style.transform = `translateY(${px((1 - e) * 110)})`; });
  });
}

function drawEnding(t) {
  // The day's dates fly in and stack, then gather into the sun with the address.
  chipEls.forEach((d, i) => {
    const t0 = CHIP_T[i], land = spring(t - t0, 17, 0.8), gather = spring(t - 111.92, 13, 0.9);
    const x = 540, y = 600 + i * 104;
    const sx = lerp(x + (i % 2 ? 700 : -700), x, land), sy = y;
    const gx = lerp(sx, 540, gather), gy = lerp(sy, 840, gather);
    const sc = lerp(1, 0.15, gather);
    setStyle(d, (t >= t0 - 0.05 ? 1 : 0) * (1 - prog(t, 112.1, 112.35)), `translate(${px(gx)}, ${px(gy)}) scale(${sc.toFixed(4)}) rotate(${((1 - land) * (i % 2 ? 8 : -8)).toFixed(2)}deg)`);
  });
  const e = spring(t - 112.0, 15, 0.62), o = prog(t, 111.98, 112.06);
  setStyle(endcard, o);
  endSun.style.transform = `scale(${(0.4 + 0.6 * e).toFixed(4)}) rotate(${((1 - e) * -60).toFixed(2)}deg)`;
  const u = vis(t, 112.4, null); endUrl.style.opacity = u.o.toFixed(3); endUrl.style.transform = `translateY(${px(u.dy)})`; endUrl.style.filter = `blur(${u.b.toFixed(2)}px)`;
  const drift = 1 + 0.015 * prog(t, 112.5, 120);
  endcard.style.transform = `scale(${drift.toFixed(4)})`; endcard.style.transformOrigin = "540px 960px";
}

window.seek = t => {
  t = clamp(t, 0, DURATION);
  const night = drawSky(t);
  const c = camAt(t);
  $("world").style.transform = `translate(${px(c.ax)}, ${px(c.ay)}) scale(${c.z.toFixed(5)}) translate(${px(-c.cx)}, ${px(-c.cy)})`;
  drawHook(t); drawBrand(t); drawPhone(t, c); drawCard(t, c); drawBand(t, c, skyTopNow); drawFinger(t, c); drawBubbles(t); drawCaptions(t, night); drawEnding(t);
};
window.duration = DURATION;
window.ready = (async () => {
  await Promise.all(["Atkinson", "Lexend", "OpenDyslexic"].map(f => document.fonts.load(`800 76px "${f}"`)));
  await Promise.all([...document.images].map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; })));
  window.seek(0);
  return true;
})();
})();
