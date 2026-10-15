// Daywell shorts engine: a 120 s vertical film (1080×1920) as a pure function of time, generalised from the promo's
// film.js. A film's timeline.js calls Short({ … }) with its area, hook, title, chapters, recap and close, plus a
// script(api) for what happens inside each chapter; the engine builds the page, draws seek(t) and lists window.cues
// (every sound effect) for tools/mix.mjs. The voice, captures and beat grid come from data/film-data.js.
//
// Sections (all times in seconds; 120 BPM, so a bar is 2 s):
//   0–6 hook (the helper wondering, thought chips on the voice) · 6–12 title (the area's name, then its home screen)
//   chapters (an event card drops on the bar and opens into the real screen; a badge says which plan includes it)
//   recap (every chapter ticked with its plan, then both prices) · 110–120 close (sun, daywell.date, price)
(() => {
const ROOT = document.currentScript.src.replace(/engine\/short\.js(\?.*)?$/, ""); // the promo folder: shared art
const $ = id => document.getElementById(id);
const make = (tag, cls, parent, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (parent) parent.appendChild(e); return e; };

// ---------- Maths: springs, easing, colour (as in the promo)
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, t0, t1) => clamp((t - t0) / (t1 - t0));
const eio = t => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const eout = t => 1 - (1 - t) ** 3;
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
const SUN_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`;
const PLAN = { daywell: { label: "Included in Daywell", short: "Daywell", icon: "sun", price: "£4.99" }, plus: { label: "Included in Daywell Plus", short: "Plus", icon: "sparkles", price: "£9.99" } };

window.Short = cfg => {
  const D = window.FILM_DATA, DURATION = 120;
  const helper = cfg.helper, mascot = n => `${ROOT}assets/mascots/${n}.webp`, portrait = n => `${ROOT}assets/mascots/${n}/portrait.webp`;
  document.documentElement.style.setProperty("--area", cfg.color);
  const stage = $("stage");
  stage.innerHTML = `
    <div id="sky" class="layer"><div class="blob" id="blobA"></div><div class="blob" id="blobB"></div><div id="stars" class="layer"></div><div id="moon" class="abs"></div></div>
    <div id="hook" class="layer"></div>
    <div id="title" class="abs"></div>
    <div id="world" class="layer">
      <div id="phone" class="abs"><div id="screen"><div id="shots"></div><div id="art"></div><div id="hls"></div><div id="flash"></div><div id="dim"></div></div><div id="island"></div></div>
      <div id="card" class="abs"><div class="fill"></div><div class="inner"></div><div class="lab"><div class="num"></div><div class="txt"><b></b><small></small></div></div><div class="por"><img alt=""></div></div>
      <div id="worldArt" class="layer"></div>
    </div>
    <div id="recap" class="abs"></div>
    <div id="endcard" class="abs"></div>
    <div id="capband" class="abs" style="left:0;top:0;width:1080px;height:640px;opacity:0"></div>
    <div id="badge" class="abs"></div>
    <div id="bubbles" class="layer"></div>
    <div id="captions" class="abs"></div>
    <div id="finger" class="abs"><div class="ring"></div><div class="dot"></div></div>`;

  // ---------- Geometry: the phone screen in world space, and the camera
  const K = 560 / 390; // film px per app CSS px (captures are 390×844 CSS px)
  const SCR = { x: 260, y: 494, w: 560, h: 1212, r: 64 };
  const wr = b => ({ x: SCR.x + b.x * K, y: SCR.y + b.y * K, w: b.w * K, h: b.h * K });
  const R = (x, y, w, h) => ({ x, y, w, h });
  const box = (shot, name) => { const b = D.shots[shot]?.boxes?.[name]; if (!b) throw Error(`no box ${shot}.${name}`); return b; };
  const A = { x: 540, y: 1080 }; // where the camera's focus point sits on the canvas (below the captions and badge)
  const cam = { x: new Track(540), y: new Track(1100), lz: new Track(0) };
  const CAMK = []; // [t, x, y, zoom, w] collected from the whole timeline, applied in order below
  const FULL = { x: 540, y: 1100 };
  const camFull = (t, w = 5.4) => CAMK.push([t, FULL.x, FULL.y, 1, w]);
  function camTo(t, region, zoom, w = 5.4) {
    const r = wr(region);
    const z = zoom ?? clamp(Math.min(960 / r.w, 900 / r.h), 1, 2.3);
    CAMK.push([t, r.x + r.w / 2, r.y + r.h / 2, z, w]);
  }
  const camAt = t => {
    const z = Math.exp(cam.lz.at(t)), cx = cam.x.at(t), cy = cam.y.at(t);
    const k = clamp((z - 1) / 0.25); // at zoom 1 the world is untransformed; as zoom grows the focus point moves to A
    return { cx, cy, z, ax: lerp(cx, A.x, k), ay: lerp(cy, A.y, k) };
  };
  const toScreen = (p, c) => ({ x: (p.x - c.cx) * c.z + c.ax, y: (p.y - c.cy) * c.z + c.ay });

  // ---------- The timeline API (film scripts use these)
  const TL = { screens: [], taps: [], typing: [], ticks: [], bubbles: [], flashes: [], cues: [], hls: [], layers: [] };
  const cue = (t, sound, gain = -14, rate = 1) => TL.cues.push({ t: +t.toFixed(3), sound, gain, rate });
  const S = (t, shot, fx = "blur") => TL.screens.push({ t, shot, fx });
  function tap(t, shot, name, opts = {}) {
    const b = box(shot, name), r = wr(b);
    TL.taps.push({ t, x: r.x + r.w / 2 + (opts.dx || 0) * K, y: r.y + r.h / 2 + (opts.dy || 0) * K });
    TL.hls.push({ t, b, until: opts.hold ?? 0.35 });
    cue(t, "tap", -13, opts.rate || 1);
  }
  const hl = (t, shot, name, hold = 1.4) => TL.hls.push({ t, b: box(shot, name), until: hold, soft: true });
  function typing(t0, t1, shot, crop, sound = true) {
    const c = box(shot, `${crop}:clip`);
    TL.typing.push({ t0, t1, crop, c });
    if (sound) for (let t = t0; t < t1 - 0.3; t += 1.35) cue(t, "typing", -14);
  }
  const ticks = (t0, shot, crop, from, to) => TL.ticks.push({ t0, crop, c: box(shot, `${crop}:clip`), from, to });
  const bubble = (t0, t1, who, text) => { TL.bubbles.push({ t0, t1, helper: who, text }); cue(t0 + 0.05, "pop", -18, 1.1); };
  const flash = t => { TL.flashes.push({ t }); cue(t, "shutter", -9); };
  const clean = s => s.toLowerCase().replace(/[^a-z0-9'’-]/g, "");
  const word = (n, w, k = 0) => { const line = D.vo[n - 1]; const hits = line.words.filter(x => clean(x.w) === clean(w)); if (!hits[k]) throw Error(`no word ${n}:${w}`); return hits[k].t; };
  // A custom drawing on the phone screen (560×1212 film px), shown from t0 to t1: draw(t, el) runs every frame.
  const layer = (t0, t1, html, draw, fade = 0.18) => { TL.layers.push({ t0, t1, html, draw, fade }); };
  const api = { S, tap, hl, typing, ticks, bubble, cue, flash, word, camTo, camFull, R, layer, K, SCR, wr, box, spring, prog, eio, eout, lerp, clamp, kf, vis, px, setStyle, make, icon: window.icon, ROOT, mascot, portrait };

  // ---------- Built-in sections
  const CH = cfg.chapters, RC = { t: 96, ...cfg.recap }, CL = { t: 110, ...cfg.close };
  const PHONE_IN = cfg.phoneIn ?? 10.3, HOOK_OUT = cfg.hook?.out ?? 5.7;
  const TT = { slam: 7.2, with: 7.8, out: 9.85, ...cfg.title };
  // Hook: thought chips pop on the voice, then gather into the helper.
  (cfg.hook?.chips || []).forEach((c, i) => cue(c.t, "pop", -15 + i * 0.5, 1 + i * 0.06));
  cue(HOOK_OUT + 0.05, "whoosh", -17);
  // Title
  cue(TT.slam, "logo-hit", -7); cue(TT.slam + 0.05, "shimmer", -17); cue(TT.with, "pop", -15, 1.05);
  cue(PHONE_IN - 0.05, "swoosh", -16);
  if (cfg.home) S(PHONE_IN - 0.3, cfg.home, "cut");
  camFull(0);
  // Chapters: the card drops on the bar (t), opens into the first screen by t + 1.
  const CARD = { drop: 0.32, open0: 0.3, open1: 1.0 };
  for (const c of CH) { camFull(c.t - CARD.drop - 0.75); cue(c.t - CARD.drop, "card-drop", -11); S(c.t + CARD.open1, c.shot, "cut"); cue(c.t + CARD.open0, "whoosh", -16); }
  // Recap and close
  const rows = RC.rows || CH.map(c => ({ text: c.recap || c.title, plan: c.plan }));
  const ROW_T = rows.map((_, i) => RC.t + 0.35 + i * 0.3);
  cue(RC.t - 0.05, "swoosh", -16); ROW_T.forEach((t, i) => cue(t, "tick", -17, 1 + i * 0.045));
  const PRICE_T = RC.pricesAt ?? RC.t + 7.6; if (RC.prices !== false) [0, 0.25].forEach((d, i) => cue(PRICE_T + d, "pop", -14, 1 + i * 0.1));
  cue(CL.t - 0.3, "whoosh", -18); cue(CL.t, "logo-hit", -5); cue(CL.t + 0.05, "shimmer", -14);
  if (CL.priceAt) cue(CL.priceAt, "pop", -15);
  camFull(RC.t - 0.6);

  // The film's own moments
  cfg.script?.(api);

  CAMK.sort((a, b) => a[0] - b[0]).forEach(([t, x, y, z, w]) => { cam.x.to(t, x, w, 1); cam.y.to(t, y, w, 1); cam.lz.to(t, Math.log(z), w, 1); });
  TL.screens.sort((a, b) => a.t - b.t);
  for (const h of TL.hls) { const next = TL.screens.find(x => x.t > h.t + 0.001); if (next) h.until = Math.min(h.until, Math.max(0.04, next.t - h.t - 0.2)); }
  TL.taps.sort((a, b) => a.t - b.t);
  window.cues = TL.cues.sort((a, b) => a.t - b.t);

  // ---------- Build the DOM
  const IMG = n => `assets/shots/${n}.png`;
  const shotsEl = $("shots"), shotImgs = {};
  const usedShots = new Set([...TL.screens.map(s => s.shot), ...CH.map(c => c.shot)]);
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
  const hlEls = TL.hls.map(h => { const d = make("div", "hl", $("hls")); Object.assign(d.style, { left: px(h.b.x * K - 6), top: px(h.b.y * K - 6), width: px(h.b.w * K + 12), height: px(h.b.h * K + 12) }); return d; });
  for (const L of TL.layers) { L.el = make("div", null, $("art"), L.html); Object.assign(L.el.style, { position: "absolute", inset: "0", visibility: "hidden" }); }

  // Hook: the helper, wondering, with thought chips
  const hookEl = $("hook");
  const hHelper = make("div", "hhelper", hookEl, `<img src="${mascot(helper)}" alt="">`);
  const SLOTS = [[350, 640], [740, 880], [360, 1560], [730, 1700]];
  const chips = (cfg.hook?.chips || []).map((c, i) => { const d = make("div", "thought", hookEl, `<i>${window.icon(c.icon, 46, 2.2)}</i><span>${c.text}</span>`); const [x, y] = c.at || SLOTS[i % SLOTS.length]; return { ...c, d, x, y }; });
  // Title
  const titleEl = $("title");
  const tWord = make("div", "word", titleEl, cfg.name), tWith = make("div", "with", titleEl, `<i><img src="${portrait(helper)}" alt=""></i><span>${TT.withText || `with ${cfg.helperName}`}</span>`);
  // Event card
  const card = $("card"), cardFill = card.querySelector(".fill"), cardInner = card.querySelector(".inner"), cardLab = card.querySelector(".lab"), cardPor = card.querySelector(".por");
  const cardInnerImgs = {};
  for (const c of CH) { const im = make("img", null, cardInner); im.src = IMG(c.shot); im.alt = ""; Object.assign(im.style, { position: "absolute", left: "0", top: "0", width: "560px", height: "1212px", opacity: "0" }); cardInnerImgs[c.shot] = im; }
  // Badges
  const badgeEls = CH.map((c, i) => { const p = PLAN[c.plan]; const d = make("div", `pill plan-${c.plan}`, $("badge"), `<i>${window.icon(p.icon, 28, 2.4)}</i><span>${p.label}</span>`); const next = CH[i + 1]?.t ?? RC.t; return { d, t0: c.t + 0.75, t1: next - CARD.drop - 0.25 }; });
  // Recap
  const recap = $("recap");
  make("div", "head", recap, `<i><img src="${portrait(helper)}" alt=""></i><b>${RC.title || `Included in ${cfg.name}`}</b>`);
  const rowEls = rows.map(r => { const p = PLAN[r.plan]; const d = make("div", "row", recap, `<div class="glow"></div><div class="tick">${window.icon("check", 32, 3)}</div><div class="t">${r.text}</div><div class="p plan-${r.plan}">${p.short}</div>`); return { d, plan: r.plan, glow: d.querySelector(".glow"), tick: d.querySelector(".tick") }; });
  const pricesEl = RC.prices !== false ? make("div", "prices", recap, `<div class="price plan-daywell"><b>Daywell</b><span>£4.99 <small>a month</small></span></div><div class="price plan-plus"><b>Daywell Plus</b><span>£9.99 <small>a month</small></span></div>`) : null;
  const priceEls = pricesEl ? [...pricesEl.children] : [];
  // Close
  const endcard = $("endcard");
  const endSun = make("div", "sun", endcard, SUN_SVG), endUrl = make("div", "url", endcard, "daywell.date");
  const endPrice = make("div", "price", endcard, CL.price || "From £4.99 a month");
  const endHelper = make("div", "helper", endcard, `<img src="${mascot(helper)}" alt="">`);
  // Sky: stars and blobs
  const STARS = []; { const rnd = mulberry32(42); for (let i = 0; i < 54; i++) { const s = make("div", "star", $("stars")); const x = rnd() * 1080, y = 80 + rnd() * 1500; s.style.left = px(x); s.style.top = px(y); const sc = 0.5 + rnd() * 1.1; STARS.push({ s, sc, ph: rnd() * 6.28, sp: 0.6 + rnd() * 1.6 }); } }
  const blobA = $("blobA"), blobB = $("blobB");
  Object.assign(blobA.style, { width: "900px", height: "900px", left: "-300px", top: "-200px", background: "radial-gradient(circle, rgba(255,255,255,.7) 0%, rgba(255,255,255,0) 66%)" });
  Object.assign(blobB.style, { width: "1000px", height: "1000px", left: "420px", top: "1100px", background: `radial-gradient(circle, ${cfg.color}99 0%, ${cfg.color}00 66%)` });
  // Bubbles
  const bubbleEls = TL.bubbles.map(b => make("div", "bubble", $("bubbles"), `<i><img src="${portrait(b.helper)}" alt=""></i><span>${b.text}</span>`));
  // Every portrait a card can switch to, loaded up front (window.ready waits for them), so no frame shows a blank face.
  const preload = make("div", null, stage); preload.style.display = "none";
  for (const n of new Set([helper, ...CH.map(c => c.helper || helper)])) make("img", null, preload).src = portrait(n);

  // ---------- Captions: the voiceover's own words, in cards of a sentence or a clause, each word rising on its
  // spoken start. Spoken forms are shown as written (prices as figures, the address as an address).
  const SHOW = [[["four", "ninety-nine"], "£4.99"], [["nine", "ninety-nine"], "£9.99"], [["daywell", "dot", "date"], "daywell.date"]];
  const ACCENT = new Set((cfg.accent || []).map(w => w.toLowerCase()));
  const capWrap = $("captions"), CAPS = [];
  for (const line of D.vo) {
    const toks = [];
    for (let i = 0; i < line.words.length; i++) {
      const hit = SHOW.find(([seq]) => seq.every((s, k) => clean(line.words[i + k]?.w || "").replace(/[.,?!:]$/, "") === s));
      if (hit) { const last = line.words[i + hit[0].length - 1]; toks.push({ w: hit[1] + (last.w.match(/[.,?!:]$/)?.[0] || ""), t: line.words[i].t, e: last.e, money: hit[1].startsWith("£") }); i += hit[0].length - 1; }
      else toks.push({ ...line.words[i] });
    }
    // Sentences, then clauses at commas, then halves, until each card fits two lines (about 34 characters).
    const len = ws => ws.map(x => x.w).join(" ").length;
    const split = ws => {
      if (len(ws) <= 34 || ws.length < 2) return [ws];
      let best = -1, score = 1e9;
      ws.forEach((x, i) => { if (i < ws.length - 1 && /,$/.test(x.w)) { const s = Math.abs(len(ws.slice(0, i + 1)) - len(ws.slice(i + 1))); if (s < score) { score = s; best = i; } } });
      if (best < 0) ws.forEach((x, i) => { if (i < ws.length - 1) { const s = Math.abs(len(ws.slice(0, i + 1)) - len(ws.slice(i + 1))); if (s < score) { score = s; best = i; } } });
      return [...split(ws.slice(0, best + 1)), ...split(ws.slice(best + 1))];
    };
    let cur = [];
    for (const x of toks) { cur.push(x); if (/[.?!]$/.test(x.w)) { CAPS.push(...split(cur)); cur = []; } }
    if (cur.length) CAPS.push(...split(cur));
  }
  const CAP = CAPS.map((words, i) => {
    const next = CAPS[i + 1];
    const tin = words[0].t - 0.08, tEnd = words.at(-1).e;
    const tout = next ? Math.min(next[0].t - 0.14, tEnd + 1.4) : DURATION + 1;
    const el = make("div", "cap", capWrap), p = make("p", null, el), spans = [];
    words.forEach(w => { const o = make("span", "w", p), inner = make("span", "wi", o, w.w); const c = clean(w.w).replace(/[’']s$/, ""); if (w.money || ACCENT.has(c) || ACCENT.has(clean(w.w))) inner.classList.add("acc"); p.appendChild(document.createTextNode(" ")); spans.push({ inner, t: w.t }); });
    return { el, p, spans, tin, tout };
  });

  // ---------- Draw a frame
  let skyTopNow = "#fcebf3";
  const SKY = cfg.sky || [[0, "#fcebf3", "#f4d8e8"], [120, "#fcebf3", "#f4d8e8"]];
  function drawSky(t) {
    let i = 1; while (i < SKY.length - 1 && t > SKY[i][0]) i++;
    const [t0, a0, b0] = SKY[i - 1], [t1, a1, b1] = SKY[i], k = eio(prog(t, t0, t1));
    const top = mixHex(a0, a1, k); $("sky").style.background = `linear-gradient(180deg, ${top} 0%, ${mixHex(b0, b1, k)} 100%)`; skyTopNow = top;
    const night = cfg.night ? kf(t, cfg.night) : 0;
    document.documentElement.style.setProperty("--night", mixHex("#3a2d58", "#241c3a", night));
    blobA.style.opacity = (1 - night).toFixed(3); blobB.style.opacity = (0.8 - night * 0.6).toFixed(3);
    STARS.forEach(({ s, sc, ph, sp }) => { const tw = 0.55 + 0.45 * Math.sin(t * sp + ph); s.style.opacity = (night * tw).toFixed(3); s.style.transform = `scale(${sc})`; });
    setStyle($("moon"), night, `translate(${px(860)}, ${px(300 + (1 - night) * 120)})`);
    return night;
  }

  function drawHook(t) {
    const out = eio(prog(t, HOOK_OUT, HOOK_OUT + 0.45));
    // The helper pops in, bobs while wondering, then moves up for the title and leaves with it.
    const pop = spring(t - 0.12, 15, 0.62), bob = Math.sin(t * 2.6) * 10 * (1 - out);
    const toTitle = spring(t - (HOOK_OUT + 0.1), 9, 0.9), leave = eio(prog(t, TT.out, TT.out + 0.5));
    const hx = 540, hy = lerp(1170, 860, toTitle) - leave * 520, sc = (0.35 + 0.65 * pop) * lerp(1, 0.94, toTitle) * (1 - leave * 0.5);
    setStyle(hHelper, t < TT.out + 0.55 ? prog(t, 0.1, 0.2) * (1 - leave) : 0, `translate(${px(hx)}, ${px(hy + bob)}) scale(${sc.toFixed(4)})`);
    chips.forEach((c, i) => {
      const land = spring(t - c.t, 17, 0.7), g = eio(prog(t, HOOK_OUT + i * 0.04, HOOK_OUT + 0.42 + i * 0.04));
      const x = lerp(c.x, hx, g), y = lerp(c.y + (1 - land) * 60, 1160, g), wob = Math.sin(t * 2.1 + i * 1.7) * 6 * (1 - g);
      setStyle(c.d, prog(t, c.t - 0.03, c.t + 0.06) * (1 - prog(t, HOOK_OUT + 0.3, HOOK_OUT + 0.45)), `translate(-50%, -50%) translate(${px(x)}, ${px(y + wob)}) scale(${((0.55 + 0.45 * land) * (1 - 0.7 * g)).toFixed(4)}) rotate(${((1 - land) * (i % 2 ? 7 : -7)).toFixed(2)}deg)`);
    });
  }

  function drawTitle(t) {
    const slam = spring(t - TT.slam, 15, 0.6), leave = eio(prog(t, TT.out, TT.out + 0.5));
    setStyle(tWord, t < TT.out + 0.55 ? prog(t, TT.slam - 0.02, TT.slam + 0.04) * (1 - leave) : 0, `translateY(${px(-leave * 520)}) scale(${((0.55 + 0.45 * slam) * (1 - 0.4 * leave)).toFixed(4)})`);
    const w = spring(t - TT.with, 16, 0.7);
    tWith.style.marginLeft = px(-tWith.offsetWidth / 2);
    setStyle(tWith, t < TT.out + 0.55 ? prog(t, TT.with - 0.02, TT.with + 0.06) * (1 - leave) : 0, `translateY(${px((1 - w) * 40 - leave * 520)}) scale(${(0.6 + 0.4 * w).toFixed(4)})`);
  }

  function drawPhone(t, c) {
    const rise = spring(t - PHONE_IN, 7.5, 0.86), leave = eio(prog(t, RC.t - 0.6, RC.t + 0.05));
    const y = (1 - rise) * 1500 + leave * 1500;
    setStyle($("phone"), t > PHONE_IN - 0.1 && t < RC.t + 0.1 ? 1 : 0, `translateY(${px(y)}) scale(${(1 - leave * 0.2).toFixed(4)})`);
    // Screens: current and previous, with a short blur swap (or a scroll, or a slide down the page).
    let i = -1; for (let k = 0; k < TL.screens.length; k++) if (TL.screens[k].t <= t) i = k;
    for (const n in shotImgs) shotImgs[n].style.visibility = "hidden";
    scroller.style.visibility = "hidden";
    if (i >= 0) {
      const cur = TL.screens[i], prev = TL.screens[i - 1];
      const d = cur.fx === "slide" ? 0.46 : cur.fx === "scroll" ? 0.55 : cur.fx === "cut" ? 0 : 0.24;
      const k = d ? prog(t, cur.t, cur.t + d) : 1;
      const ci = shotImgs[cur.shot];
      if (cur.fx === "scroll" && prev && k < 1) {
        // A real scroll: the two captures overlap by their scroll difference, so they move as one page.
        const delta = (D.shots[cur.shot].scrollY - D.shots[prev.shot].scrollY) * K, e = eio(k);
        scrollA.src = shotImgs[prev.shot].src; scrollB.src = ci.src;
        scrollA.style.transform = `translateY(${px(-e * delta)})`; scrollB.style.transform = `translateY(${px((1 - e) * delta)})`;
        scroller.style.visibility = "visible";
        setStyle(ci, 1, "none", "none"); ci.style.zIndex = 2;
      } else if (cur.fx === "slide") {
        const a = eio(prog(k, 0, 0.55)), b = eout(prog(k, 0.38, 1));
        if (prev && k < 1) { const pi = shotImgs[prev.shot]; setStyle(pi, 1 - a, `translateY(${px(-a * 150)})`, `blur(${(a * 4).toFixed(2)}px)`); pi.style.zIndex = 1; }
        setStyle(ci, k < 1 ? b : 1, `translateY(${px((1 - b) * 150)})`, k < 1 ? `blur(${((1 - b) * 4).toFixed(2)}px)` : "none"); ci.style.zIndex = 2;
      } else {
        if (prev && k < 1 && prev.shot !== cur.shot) { const pi = shotImgs[prev.shot]; setStyle(pi, 1, "none", `blur(${(k * 6).toFixed(2)}px)`); pi.style.zIndex = 1; }
        setStyle(ci, d ? eout(k) : 1, `translateY(${px((1 - eout(k)) * 10)})`, k < 1 && d ? `blur(${((1 - k) * 6).toFixed(2)}px)` : "none"); ci.style.zIndex = 2;
      }
    }
    for (const ty of TL.typing) {
      ty.imgs.forEach(im => (im.style.visibility = "hidden"));
      if (t >= ty.t0 && t < ty.t1 + 0.05) {
        const chars = Math.floor(prog(t, ty.t0, ty.t1) * ty.len + 1e-6);
        let j = 0; ty.c.counts.forEach((n, k) => { if (n <= chars) j = k; });
        setStyle(ty.imgs[j], 1);
      }
    }
    for (const tk of TL.ticks) for (const { i: n, im } of tk.imgs) { const ts = tk.t0 + (n - tk.from); const show = t >= ts && t < ts + 1 + (n === tk.to ? 5 : 0) && t < (TL.screens.find(s => s.t > ts)?.t ?? 999); setStyle(im, show ? 1 : 0); }
    TL.hls.forEach((h, k) => { const e = prog(t, h.t - (h.soft ? 0.15 : 0.02), h.t + (h.soft ? 0.2 : 0.06)) * (1 - prog(t, h.t + h.until, h.t + h.until + 0.25)); setStyle(hlEls[k], e * 0.9); });
    let fl = 0; for (const f of TL.flashes) fl = Math.max(fl, prog(t, f.t - 0.03, f.t) * (1 - prog(t, f.t + 0.02, f.t + 0.3)));
    setStyle($("flash"), fl * 0.85);
    setStyle($("dim"), cfg.dim ? kf(t, cfg.dim) : 0);
    for (const L of TL.layers) {
      const on = t >= L.t0 - L.fade && t < L.t1 + L.fade;
      if (!on) { L.el.style.visibility = "hidden"; continue; }
      setStyle(L.el, prog(t, L.t0 - L.fade, L.t0) * (1 - prog(t, L.t1, L.t1 + L.fade)));
      L.draw?.(t, L.el);
    }
  }

  function drawCard(t) {
    let active = null, idx = -1; CH.forEach((cd, i) => { if (t >= cd.t - CARD.drop - 0.05 && t < cd.t + CARD.open1 + 0.06) { active = cd; idx = i; } });
    if (!active) { setStyle(card, 0); return; }
    const t0 = active.t;
    const land = spring(t - (t0 - CARD.drop), 18, 0.8);
    const ly = SCR.y + 110, W0 = 720, H0 = 150;
    let x = 540 - W0 / 2, y = lerp(ly - 330, ly, land), w = W0, h = H0, r = 36;
    const m = spring(t - (t0 + CARD.open0), 12, 0.95);
    x = lerp(x, SCR.x, m); y = lerp(y, SCR.y, m); w = lerp(w, SCR.w, m); h = lerp(h, SCR.h, m); r = lerp(r, SCR.r, m);
    Object.assign(card.style, { left: px(x), top: px(y), width: px(w), height: px(h), borderRadius: px(r) });
    setStyle(card, prog(t, t0 - CARD.drop - 0.05, t0 - CARD.drop + 0.08));
    cardFill.style.background = active.color || cfg.color; cardFill.style.opacity = (1 - prog(m, 0.45, 0.95)).toFixed(3);
    for (const s in cardInnerImgs) cardInnerImgs[s].style.opacity = s === active.shot ? prog(m, 0.3, 0.8).toFixed(3) : "0";
    cardInner.style.opacity = "1"; cardInner.style.left = px(SCR.x - x); cardInner.style.top = px(SCR.y - y);
    const lv = vis(t, t0 - CARD.drop + 0.05, t0 + CARD.open0 - 0.05, 0.14);
    cardLab.querySelector(".num").textContent = String(idx + 1); cardLab.querySelector("b").textContent = active.title;
    const small = cardLab.querySelector("small"), want = `${window.icon(PLAN[active.plan].icon, 26, 2.6)}${PLAN[active.plan].label}`;
    if (small.dataset.plan !== active.plan) { small.innerHTML = want; small.dataset.plan = active.plan; }
    setStyle(cardLab, lv.o, `translateY(${px(lv.dy)})`, `blur(${lv.b.toFixed(2)}px)`);
    const pi = cardPor.querySelector("img"), src = portrait(active.helper || helper); if (pi.getAttribute("src") !== src) pi.setAttribute("src", src);
    setStyle(cardPor, lv.o, `scale(${(0.7 + 0.3 * lv.e).toFixed(4)})`);
    card.style.boxShadow = `0 ${px(30 * (1 - m))} ${px(70 * (1 - m) + 1)} rgba(82,45,70,${(0.28 * (1 - m)).toFixed(3)})`;
  }

  function drawBadge(t) {
    badgeEls.forEach(({ d, t0, t1 }) => {
      if (t < t0 - 0.05 || t > t1 + 0.3) { setStyle(d, 0); return; }
      const pop = spring(t - t0, 16, 0.7), out = prog(t, t1, t1 + 0.22);
      d.style.marginLeft = px(-d.offsetWidth / 2); d.style.marginTop = px(-d.offsetHeight / 2);
      setStyle(d, prog(t, t0 - 0.02, t0 + 0.08) * (1 - out), `scale(${((0.6 + 0.4 * pop) * (1 - 0.15 * out)).toFixed(4)})`, out > 0 ? `blur(${(out * 6).toFixed(2)}px)` : "none");
    });
  }

  function drawFinger(t, c) {
    const f = $("finger");
    let g0 = -1, g1 = -1; // taps closer than 2.4 s belong together (the finger fades between groups)
    for (let i = 0; i < TL.taps.length; i++) {
      let a = i; while (a > 0 && TL.taps[a].t - TL.taps[a - 1].t < 2.4) a--;
      let b = i; while (b < TL.taps.length - 1 && TL.taps[b + 1].t - TL.taps[b].t < 2.4) b++;
      if (t >= TL.taps[a].t - 0.75 && t <= TL.taps[b].t + 0.55) { g0 = a; g1 = b; break; }
    }
    if (g0 < 0) { setStyle(f, 0); return; }
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

  function drawBand(t, c) {
    const band = $("capband"), o = clamp((c.z - 1.03) / 0.2);
    band.style.background = `linear-gradient(180deg, ${skyTopNow} 0%, ${skyTopNow} 84%, transparent 100%)`;
    setStyle(band, o);
  }

  function drawCaptions(t) {
    const [r0, g0, b0] = skyTopNow.match(/\d+/g).map(Number); const lum = (0.2126 * r0 + 0.7152 * g0 + 0.0722 * b0) / 255;
    const ink = lum < 0.62 ? "#f8eef4" : "#522d46"; capWrap.classList.toggle("light", lum < 0.62);
    CAP.forEach(cp => {
      if (t < cp.tin - 0.1 || t > cp.tout + 0.25) { setStyle(cp.el, 0); return; }
      const out = prog(t, cp.tout, cp.tout + 0.18);
      setStyle(cp.el, 1 - out * out, `translateY(${px(-out * 14)})`, out > 0 ? `blur(${(out * 8).toFixed(2)}px)` : "none");
      cp.p.style.color = ink;
      cp.spans.forEach(s => { const e = spring(t - (s.t - 0.06), 24, 1); s.inner.style.transform = `translateY(${px((1 - e) * 110)})`; });
    });
  }

  function drawRecap(t) {
    const inn = spring(t - RC.t, 12, 0.8), out = eio(prog(t, CL.t - 0.45, CL.t - 0.05));
    const on = t > RC.t - 0.05 && t < CL.t;
    setStyle(recap, on ? prog(t, RC.t - 0.02, RC.t + 0.12) * (1 - out) : 0, `translateY(${px((1 - inn) * 420 - out * 120)}) scale(${(1 - out * 0.35).toFixed(4)})`, out > 0 ? `blur(${(out * 10).toFixed(2)}px)` : "none");
    if (!on) return;
    rowEls.forEach((r, i) => {
      const land = spring(t - ROW_T[i], 18, 0.75), tk = spring(t - ROW_T[i] - 0.08, 20, 0.55);
      setStyle(r.d, prog(t, ROW_T[i] - 0.05, ROW_T[i] + 0.06), `translateX(${px((1 - land) * 60)})`);
      r.tick.style.transform = `scale(${(0.3 + 0.7 * tk).toFixed(4)})`;
      const [g0, g1] = RC.glow?.[r.plan] || [0, 0];
      setStyle(r.glow, prog(t, g0, g0 + 0.25) * (1 - prog(t, g1, g1 + 0.35)));
    });
    priceEls.forEach((p, i) => { const pop = spring(t - (PRICE_T + i * 0.25), 16, 0.68); setStyle(p, prog(t, PRICE_T + i * 0.25 - 0.02, PRICE_T + i * 0.25 + 0.08), `translateY(${px((1 - pop) * 30)}) scale(${(0.7 + 0.3 * pop).toFixed(4)})`); });
  }

  function drawClose(t) {
    const e = spring(t - CL.t, 15, 0.62);
    setStyle(endcard, prog(t, CL.t - 0.02, CL.t + 0.06));
    endSun.style.transform = `scale(${(0.4 + 0.6 * e).toFixed(4)}) rotate(${((1 - e) * -60).toFixed(2)}deg)`;
    const u = vis(t, CL.t + 0.45, null); endUrl.style.opacity = u.o.toFixed(3); endUrl.style.transform = `translateY(${px(u.dy)})`; endUrl.style.filter = `blur(${u.b.toFixed(2)}px)`;
    const pa = CL.priceAt ?? CL.t + 1.6, pp = spring(t - pa, 16, 0.7);
    endPrice.style.marginLeft = px(-endPrice.offsetWidth / 2);
    setStyle(endPrice, prog(t, pa - 0.02, pa + 0.08), `translateY(${px((1 - pp) * 30)}) scale(${(0.7 + 0.3 * pp).toFixed(4)})`);
    const ha = CL.helperAt ?? CL.t + 2.4, hp = spring(t - ha, 14, 0.6);
    setStyle(endHelper, prog(t, ha - 0.02, ha + 0.08), `translateY(${px((1 - hp) * 200 + Math.sin(t * 2.2) * 8)}) scale(${(0.6 + 0.4 * hp).toFixed(4)})`);
    const drift = 1 + 0.015 * prog(t, CL.t + 0.5, DURATION);
    endcard.style.transform = `scale(${drift.toFixed(4)})`; endcard.style.transformOrigin = "540px 960px";
  }

  window.seek = t => {
    t = clamp(t, 0, DURATION);
    drawSky(t);
    const c = camAt(t);
    $("world").style.transform = `translate(${px(c.ax)}, ${px(c.ay)}) scale(${c.z.toFixed(5)}) translate(${px(-c.cx)}, ${px(-c.cy)})`;
    drawHook(t); drawTitle(t); drawPhone(t, c); drawCard(t); cfg.draw?.(t, c, api); drawBand(t, c); drawBadge(t); drawFinger(t, c); drawBubbles(t); drawCaptions(t); drawRecap(t); drawClose(t);
  };
  window.duration = DURATION;
  window.ready = (async () => {
    await Promise.all(["Atkinson", "Lexend"].map(f => document.fonts.load(`800 76px "${f}"`)));
    await Promise.all([...document.images].map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; })));
    window.seek(0);
    return true;
  })();
};
})();
