// Daywell "moments" engine: a vertical film (1080×1920) made of 5-second moments, as a pure function of time. Written
// for "Small things count" (24 October 2026) from the shorts engine (engine/short.js): the same springs, camera,
// phone, finger, captions and sky, with this film's own pieces:
//   hook  to-do stickers drift down a short way into a pile, rest, then slide away, leaving one small sticker
//   turn  that sticker becomes the Daywell sun, "Daywell" settles in, the three helpers rise in together
//   stamps  every moment ends with a sticker landing beside the phone, then tucking away
//   plus  a Plus tag over the phone during Plus moments
//   page  the film's stickers come back as one sheet, which folds into the sun
//   end   the sun, daywell.date and the price
// A film's timeline.js calls Moments({ … }) with these and a script(api) for what happens inside each moment.
(() => {
const ROOT = document.currentScript.src.replace(/engine\/moments\.js(\?.*)?$/, "");
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
class Track {
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
const SUN_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`;

window.Moments = cfg => {
  const D = window.FILM_DATA, DURATION = cfg.duration ?? 150;
  const mascot = n => `${ROOT}assets/mascots/${n}.webp`, portrait = n => `${ROOT}assets/mascots/${n}/portrait.webp`;
  const stage = $("stage");
  stage.innerHTML = `
    <div id="sky" class="layer"><div class="blob" id="blobA"></div><div class="blob" id="blobB"></div><div id="stars" class="layer"></div><div id="moon" class="abs"></div></div>
    <div id="hook" class="layer"></div>
    <div id="turn" class="layer"></div>
    <div id="world" class="layer">
      <div id="phone" class="abs"><div id="screen"><div id="shots"></div><div id="art"></div><div id="hls"></div><div id="flash"></div><div id="dim"></div></div><div id="island"></div></div>
      <div id="worldArt" class="layer"></div>
    </div>
    <div id="page" class="abs"></div>
    <div id="endcard" class="abs"></div>
    <div id="capband" class="abs" style="left:0;top:0;width:1080px;height:640px;opacity:0"></div>
    <div id="plus" class="abs"></div>
    <div id="stamps" class="layer"></div>
    <div id="bubbles" class="layer"></div>
    <div id="captions" class="abs"></div>
    <div id="finger" class="abs"><div class="ring"></div><div class="dot"></div></div>`;

  // ---------- Geometry: the phone screen in world space, and the camera
  const K = 560 / 390; // film px per app CSS px (captures are 390×844 CSS px)
  const SCR = { x: 260, y: 494, w: 560, h: 1212, r: 64 };
  const wr = b => ({ x: SCR.x + b.x * K, y: SCR.y + b.y * K, w: b.w * K, h: b.h * K });
  const R = (x, y, w, h) => ({ x, y, w, h });
  const box = (shot, name) => { const b = D.shots[shot]?.boxes?.[name]; if (!b) throw Error(`no box ${shot}.${name}`); return b; };
  const A = { x: 540, y: 1080 };
  const cam = { x: new Track(540), y: new Track(1100), lz: new Track(0) };
  const CAMK = [];
  const FULL = { x: 540, y: 1100 };
  // A calm camera: w 3 settles in about 1.5 s. The first cut used 5.4 (0.85 s) with several moves a moment, which
  // read as rushed; one push-in per moment is plenty.
  const camFull = (t, w = 3) => CAMK.push([t, FULL.x, FULL.y, 1, w]);
  function camTo(t, region, zoom, w = 3) {
    const r = wr(region);
    const z = zoom ?? clamp(Math.min(960 / r.w, 900 / r.h), 1, 2.3);
    CAMK.push([t, r.x + r.w / 2, r.y + r.h / 2, z, w]);
  }
  const HOLDS = [];
  const holdDrift = t => { let d = 0; for (const h of HOLDS) if (t > h.a) d += h.amp * eio(prog(t, h.a, h.b)) * (1 - spring(t - h.b, h.w, 1)); return d; };
  const camAt = t => {
    const z = Math.exp(cam.lz.at(t) + holdDrift(t)), cx = cam.x.at(t), cy = cam.y.at(t);
    const k = clamp((z - 1) / 0.25);
    return { cx, cy, z, ax: lerp(cx, A.x, k), ay: lerp(cy, A.y, k) };
  };
  const toScreen = (p, c) => ({ x: (p.x - c.cx) * c.z + c.ax, y: (p.y - c.cy) * c.z + c.ay });

  // ---------- The timeline API
  const TL = { screens: [], taps: [], typing: [], bubbles: [], flashes: [], cues: [], hls: [], layers: [] };
  const cue = (t, sound, gain = -14, rate = 1) => TL.cues.push({ t: +t.toFixed(3), sound, gain, rate });
  const S = (t, shot, fx = "blur") => TL.screens.push({ t, shot, fx });
  function tap(t, shot, name, opts = {}) {
    const b = box(shot, name), r = wr(b);
    TL.taps.push({ t, x: r.x + r.w / 2 + (opts.dx || 0) * K, y: r.y + r.h / 2 + (opts.dy || 0) * K });
    if (opts.hl !== false) TL.hls.push({ t, b, until: opts.hold ?? 0.35 });
    cue(t, "tap", -13, opts.rate || 1);
  }
  const hl = (t, shot, name, hold = 1.4) => TL.hls.push({ t, b: box(shot, name), until: hold, soft: true });
  function tapAt(t, x, y, w = 44, h = 44, opts = {}) {
    TL.taps.push({ t, x: SCR.x + (x + w / 2) * K, y: SCR.y + (y + h / 2) * K });
    if (opts.hl !== false) TL.hls.push({ t, b: { x, y, w, h }, until: opts.hold ?? 0.3 });
    cue(t, "tap", -13, opts.rate || 1);
  }
  // A drag (a finger spinning a wheel or swiping a strip): the finger travels from one point to another.
  function drag(t0, t1, shot, name, dx, dy, opts = {}) {
    const b = box(shot, name), r = wr(b), x = r.x + r.w / 2, y = r.y + r.h / 2;
    TL.taps.push({ t: t0, x, y, drag: { t1, dx: dx * K, dy: dy * K } });
    if (opts.sound !== false) cue(t0, "tap", -16);
  }
  const camWorld = (t, x, y, z, w = 3) => CAMK.push([t, x, y, z, w]);
  function typing(t0, t1, shot, crop, sound = true) {
    const c = box(shot, `${crop}:clip`);
    TL.typing.push({ t0, t1, crop, c });
    if (sound) for (let t = t0; t < t1 - 0.3; t += 1.35) cue(t, "typing", -14);
  }
  // A flipbook of full captures (a wheel spinning, say): frames name-0 … name-(n-1) over t0 → t1, slowing to a stop like
  // a flicked wheel, whose position follows the ease-out 1 − (1 − τ)². Frames captured at even steps are shown when the
  // ease-out reaches them, τ = 1 − √(1 − p) (the default); frames captured on the ease-out already are shown evenly
  // (eased: true), which stays smooth at the slow end; linear: true is a steady scroll. Each row passing gets the
  // wheel's soft click, thinning out as the wheel slows.
  function flip(t0, t1, name, n, opts = {}) {
    const slow = p => 1 - Math.sqrt(1 - p);
    for (let i = 0; i < n; i++) { const p = i / (n - 1); S(t0 + (t1 - t0) * (opts.linear || opts.eased ? p : slow(p)), `${name}-${i}`, "cut"); }
    const clicks = opts.clicks ?? n;
    for (let i = 0; i < clicks; i++) { const p = (i + 0.5) / clicks; cue(t0 + (t1 - t0) * (opts.linear ? p : slow(p)), "wheel", -15, 1 + (i % 3) * 0.04); }
  }
  const bubble = (t0, t1, who, text) => { TL.bubbles.push({ t0, t1, helper: who, text }); cue(t0 + 0.05, "pop", -18, 1.1); };
  const flash = t => { TL.flashes.push({ t }); cue(t, "shutter", -9); };
  const clean = s => s.toLowerCase().replace(/[^a-z0-9'’-]/g, "");
  const word = (n, w, k = 0) => { const line = D.vo[n - 1]; const hits = line.words.filter(x => clean(x.w) === clean(w)); if (!hits[k]) throw Error(`no word ${n}:${w}`); return hits[k].t; };
  const layer = (t0, t1, html, draw, fade = 0.18) => { TL.layers.push({ t0, t1, html, draw, fade }); };
  const api = { S, tap, tapAt, drag, hl, typing, flip, bubble, cue, flash, word, camTo, camFull, camWorld, R, layer, worldArt: $("worldArt"), K, SCR, wr, box, spring, prog, eio, eout, lerp, clamp, kf, vis, px, setStyle, make, icon: window.icon, ROOT, mascot, portrait };

  // ---------- The film's sections
  const HK = { out: 4.85, ...cfg.hook }, TN = { sun: 5.25, word: 6.6, out: 9.55, leave: 0.7, ...cfg.turn };
  const PH = { in: 9.85, out: 139.6, ...cfg.phone };
  const PG = { t: 140, fold: 144.75, ...cfg.page }, EN = { t: 145, ...cfg.end };
  const STAMPS = (cfg.stamps || []).map(s => ({ hold: 0.75, ...s }));
  const PLUS = cfg.plus || [];
  // Sounds for the built-in sections
  (HK.items || []).forEach((it, i) => cue(it.t, "ping", -19 + (i % 3), 1 + (i % 4) * 0.05));
  cue(HK.out + 0.02, "swoosh", -15);
  cue(TN.sun, "pop", -14, 0.95); cue(TN.word, "logo-hit", -10); cue(TN.word + 0.05, "shimmer", -18);
  (TN.helpers || []).forEach((h, i) => cue(h.t, "pop", -19, 1.05 + i * 0.06));
  cue(PH.in - 0.05, "swoosh", -16);
  STAMPS.forEach((s, i) => { cue(s.t, "sticker", -11, 1 + (i % 4) * 0.03); });
  cue(PG.t + 0.1, "swoosh", -16);
  STAMPS.forEach((s, i) => cue(PG.t + 0.45 + i * 0.045, "sticker", -19, 1.08 + (i % 5) * 0.03));
  cue(PG.fold, "whoosh", -15); cue(EN.t + 0.05, "logo-hit", -6); cue(EN.t + 0.1, "shimmer", -14);
  if (EN.priceAt) cue(EN.priceAt, "pop", -15);
  camFull(0);

  cfg.script?.(api);

  CAMK.sort((a, b) => a[0] - b[0]).forEach(([t, x, y, z, w]) => { cam.x.to(t, x, w, 1); cam.y.to(t, y, w, 1); cam.lz.to(t, Math.log(z), w, 1); });
  for (let i = 0; i < CAMK.length - 1; i++) {
    const [t0] = CAMK[i], [t1, , , , w1] = CAMK[i + 1];
    if (t0 >= PH.in + 1 && t1 - t0 > 2.4) HOLDS.push({ a: t0 + 0.9, b: t1, w: w1, amp: Math.min(0.035, 0.012 * (t1 - t0 - 0.9)) });
  }
  TL.screens.sort((a, b) => a.t - b.t);
  for (const h of TL.hls) { const next = TL.screens.find(x => x.t > h.t + 0.001); if (next) h.until = Math.min(h.until, Math.max(0.04, next.t - h.t - 0.2)); }
  TL.taps.sort((a, b) => a.t - b.t);
  window.cues = TL.cues.sort((a, b) => a.t - b.t);

  // ---------- Build the DOM
  const IMG = n => `assets/shots/${n}.png`;
  const shotsEl = $("shots"), shotImgs = {};
  for (const n of new Set(TL.screens.map(s => s.shot))) { const im = make("img", "shot", shotsEl); im.src = IMG(n); im.alt = ""; shotImgs[n] = im; }
  for (const ty of TL.typing) {
    ty.imgs = ty.c.counts.map(n => { const im = make("img", "crop", shotsEl); im.src = IMG(`${ty.crop}-${String(n).padStart(2, "0")}`); im.alt = "";
      Object.assign(im.style, { left: px(ty.c.x * K), top: px(ty.c.y * K), width: px(ty.c.w * K), height: px(ty.c.h * K), zIndex: 5 }); return im; });
    ty.len = ty.c.counts.at(-1);
  }
  const hlEls = TL.hls.map(h => { const d = make("div", "hl", $("hls")); Object.assign(d.style, { left: px(h.b.x * K - 6), top: px(h.b.y * K - 6), width: px(h.b.w * K + 12), height: px(h.b.h * K + 12) }); return d; });
  for (const L of TL.layers) { L.el = make("div", null, $("art"), L.html); Object.assign(L.el.style, { position: "absolute", inset: "0", visibility: "hidden" }); }

  // Hook: to-do stickers that rain down and pile up
  const hookEl = $("hook"), rndH = mulberry32(7);
  const PILE = (HK.items || []).map((it, i) => {
    const d = make("div", `todo ${it.tone || ""}`, hookEl, `<i>${window.icon(it.icon, 50, 2.4)}</i><span>${it.text}</span>`);
    const x = 540 + (rndH() - 0.5) * 300, y = 1350 - i * 118 + (rndH() - 0.5) * 30, rot = (rndH() - 0.5) * 14;
    return { ...it, d, x, y, rot, fallRot: (rndH() - 0.5) * 50, fallX: (rndH() - 0.5) * 400 };
  });
  // Turn: the one small sticker becomes the sun; Daywell settles in; the helpers rise in around it
  const turnEl = $("turn");
  const sunSticker = make("div", "sunsticker", turnEl, `<div class="disc">${SUN_SVG}</div>`);
  const wordmark = make("div", "wordmark", turnEl, "Daywell");
  const turnHelpers = (TN.helpers || []).map(h => ({ ...h, d: make("div", "thelper", turnEl, `<img src="${mascot(h.name)}" alt="">`) }));
  // Stamps: a word stamp or an icon sticker, each with its own slot on the closing page
  const stampsEl = $("stamps");
  const COLS = 5, CELL = { w: 168, h: 150 };
  const PAGE = { x: 90, y: 560, w: 900, h: 0 };
  const rows = Math.ceil(STAMPS.length / COLS);
  PAGE.h = 150 + rows * CELL.h + 60;
  const rndS = mulberry32(11);
  STAMPS.forEach((s, i) => {
    const kind = s.text ? "word" : "icon";
    s.d = make("div", `stamp ${kind}`, stampsEl, s.text ? `<i>${window.icon(s.icon || "check", 38, 3)}</i><b>${s.text}</b>` : `<i style="background:${s.color || "#ffc7a6"}">${window.icon(s.icon, 64, 2.4)}</i>`);
    s.rot = s.rot ?? (i % 2 ? 6 : -8);
    s.pos = s.pos || { x: 220, y: 760 };
    const col = i % COLS, row = Math.floor(i / COLS);
    s.slot = { x: PAGE.x + 90 + col * CELL.w + (rndS() - 0.5) * 20, y: PAGE.y + 210 + row * CELL.h + (rndS() - 0.5) * 16, rot: (rndS() - 0.5) * 16, sc: s.text ? 0.62 : 0.72 };
  });
  // The page the stickers gather on
  const pageEl = $("page");
  Object.assign(pageEl.style, { left: px(PAGE.x), top: px(PAGE.y), width: px(PAGE.w), height: px(PAGE.h) });
  make("div", "pagehead", pageEl, cfg.pageTitle || "Your small things");
  // Plus tag
  const plusEl = make("div", "pluspill", $("plus"), `<i>${window.icon("sparkles", 30, 2.4)}</i><span>Daywell Plus</span>`);
  // End card
  const endcard = $("endcard");
  const endSun = make("div", "sun", endcard, `<div class="disc">${SUN_SVG}</div>`);
  const endUrl = make("div", "url", endcard, "daywell.date");
  const endPrice = make("div", "price", endcard, EN.price || "From £4.99 a month");
  const endHelpers = (EN.helpers || []).map((n, i) => ({ n, i, d: make("div", "ehelper", endcard, `<img src="${mascot(n)}" alt="">`) }));
  // Sky: stars and blobs
  const STARS = []; { const rnd = mulberry32(42); for (let i = 0; i < 64; i++) { const s = make("div", "star", $("stars")); const x = rnd() * 1080, y = 80 + rnd() * 1600; s.style.left = px(x); s.style.top = px(y); STARS.push({ s, sc: 0.5 + rnd() * 1.1, ph: rnd() * 6.28, sp: 0.6 + rnd() * 1.6 }); } }
  const blobA = $("blobA"), blobB = $("blobB");
  Object.assign(blobA.style, { width: "900px", height: "900px", left: "-300px", top: "-200px", background: "radial-gradient(circle, rgba(255,255,255,.7) 0%, rgba(255,255,255,0) 66%)" });
  Object.assign(blobB.style, { width: "1000px", height: "1000px", left: "420px", top: "1100px", background: "radial-gradient(circle, rgba(255,199,166,.55) 0%, rgba(255,199,166,0) 66%)" });
  // Bubbles
  const bubbleEls = TL.bubbles.map(b => make("div", "bubble", $("bubbles"), `<i><img src="${portrait(b.helper)}" alt=""></i><span>${b.text}</span>`));

  // ---------- Captions: the voiceover's own words, a sentence or clause per card, each word rising on its start
  const SHOW = [[["four", "ninety-nine"], "£4.99"], [["nine", "ninety-nine"], "£9.99"], [["daywell", "dot", "date"], "daywell.date"], [["twenty-five"], "25"]];
  const ACCENT = new Set((cfg.accent || []).map(w => w.toLowerCase()));
  const capWrap = $("captions"), CAPS = [];
  for (const line of D.vo) {
    if (!line.words.length) continue;
    const toks = [];
    for (let i = 0; i < line.words.length; i++) {
      const hit = SHOW.find(([seq]) => seq.every((s, k) => clean(line.words[i + k]?.w || "").replace(/[.,?!:]$/, "") === s));
      if (hit) { const last = line.words[i + hit[0].length - 1]; toks.push({ w: hit[1] + (last.w.match(/[.,?!:]$/)?.[0] || ""), t: line.words[i].t, e: last.e, money: hit[1].startsWith("£") }); i += hit[0].length - 1; }
      else toks.push({ ...line.words[i] });
    }
    const len = ws => ws.map(x => x.w).join(" ").length;
    const split = ws => {
      if (len(ws) <= 34 || ws.length < 2) return [ws];
      let best = -1, score = 1e9;
      ws.forEach((x, i) => { if (i < ws.length - 1 && /,$/.test(x.w)) { const s = Math.abs(len(ws.slice(0, i + 1)) - len(ws.slice(i + 1))); if (s < score) { score = s; best = i; } } });
      if (best < 0) ws.forEach((x, i) => { if (i < ws.length - 1) { const s = Math.abs(len(ws.slice(0, i + 1)) - len(ws.slice(i + 1))); if (s < score) { score = s; best = i; } } });
      return [...split(ws.slice(0, best + 1)), ...split(ws.slice(best + 1))];
    };
    // A line's sentences share a card when they fit together (short lines read better whole).
    if (len(toks) <= 46) CAPS.push(toks);
    else { let cur = []; for (const x of toks) { cur.push(x); if (/[.?!]$/.test(x.w)) { CAPS.push(...split(cur)); cur = []; } } if (cur.length) CAPS.push(...split(cur)); }
  }
  const CAP = CAPS.map((words, i) => {
    const next = CAPS[i + 1];
    const tin = words[0].t - 0.08, tEnd = words.at(-1).e;
    const tout = next ? Math.min(next[0].t - 0.14, tEnd + 1.3) : DURATION + 1;
    const el = make("div", "cap", capWrap), p = make("p", null, el), spans = [];
    words.forEach(w => { const o = make("span", "w", p), inner = make("span", "wi", o, w.w); const c = clean(w.w).replace(/[’']s$/, ""); if (w.money || ACCENT.has(c) || ACCENT.has(clean(w.w))) inner.classList.add("acc"); p.appendChild(document.createTextNode(" ")); spans.push({ inner, t: w.t }); });
    return { el, p, spans, tin, tout };
  });

  // ---------- Draw a frame
  let skyTopNow = "#fcebf3";
  const SKY = cfg.sky || [[0, "#fcebf3", "#f4d8e8"], [DURATION, "#fcebf3", "#f4d8e8"]];
  function drawSky(t) {
    let i = 1; while (i < SKY.length - 1 && t > SKY[i][0]) i++;
    const [t0, a0, b0] = SKY[i - 1], [t1, a1, b1] = SKY[i], k = eio(prog(t, t0, t1));
    const top = mixHex(a0, a1, k); $("sky").style.background = `linear-gradient(180deg, ${top} 0%, ${mixHex(b0, b1, k)} 100%)`; skyTopNow = top;
    const night = cfg.night ? kf(t, cfg.night) : 0;
    document.documentElement.style.setProperty("--night", mixHex("#3a2d58", "#241c3a", night));
    blobA.style.opacity = (1 - night).toFixed(3); blobB.style.opacity = (0.8 - night * 0.7).toFixed(3);
    STARS.forEach(({ s, sc, ph, sp }) => { const tw = 0.55 + 0.45 * Math.sin(t * sp + ph); s.style.opacity = (night * tw).toFixed(3); s.style.transform = `scale(${sc})`; });
    setStyle($("moon"), night, `translate(${px(860)}, ${px(300 + (1 - night) * 120)})`);
    return night;
  }

  function drawHook(t) {
    if (t > TN.sun + 1) { PILE.forEach(p => setStyle(p.d, 0)); return; }
    PILE.forEach((p, i) => {
      // Each to-do drifts down a short way and settles (a slow spring, so nothing snaps), turning as it lands.
      const land = spring(t - p.t, HK.landW ?? 7, 0.8);
      const keep = !!p.keep;
      // At the turn, everything but the keeper slides away, unhurried; the keeper glides to the middle and becomes the sun.
      const fall = keep ? 0 : ein(prog(t, HK.out + i * 0.06, HK.out + 1.05 + i * 0.06));
      const glide = keep ? eio(prog(t, HK.out, TN.sun)) : 0;
      const y0 = p.y - (1 - land) * 320, x = lerp(p.x + p.fallX * fall, 540, glide), y = lerp(y0 + fall * 1300, 1000, glide);
      const rot = lerp(p.rot + (1 - land) * (i % 2 ? 12 : -12) + p.fallRot * fall, 0, glide), sc = keep ? lerp(1, 0.4, glide) : 1;
      const o = prog(t, p.t - 0.02, p.t + 0.3) * (keep ? 1 - prog(t, TN.sun - 0.05, TN.sun + 0.08) : 1 - prog(t, HK.out + 0.8, HK.out + 1.05));
      setStyle(p.d, o, `translate(-50%, -50%) translate(${px(x)}, ${px(y)}) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(4)})`);
    });
  }

  function drawTurn(t) {
    const on = t > TN.sun - 0.1 && t < TN.out + TN.leave + 0.1;
    if (!on) { setStyle(sunSticker, 0); setStyle(wordmark, 0); turnHelpers.forEach(h => setStyle(h.d, 0)); return; }
    // One thing at a time, all on slow springs: the sun grows and drifts up in one arrival, "Daywell" settles in on its
    // word, the helpers rise together, then the card holds with only the sun turning a little, until it lifts away.
    const leave = eio(prog(t, TN.out, TN.out + TN.leave)), lift = leave * 320, fade = 1 - leave;
    const grow = spring(t - TN.sun, 5.5, 0.9), settle = (1 - spring(t - TN.sun, 4.5, 1)) * -40;
    const turning = 4 * eio(prog(t, TN.word + 0.8, TN.out + TN.leave));
    const sy = lerp(1000, 820, spring(t - TN.sun - 0.2, 3.5, 1)) - lift;
    setStyle(sunSticker, fade * prog(t, TN.sun - 0.02, TN.sun + 0.12), `translate(-50%, -50%) translate(540px, ${px(sy)}) rotate(${(settle + turning).toFixed(2)}deg) scale(${(0.25 + 0.75 * grow).toFixed(4)})`);
    const land = spring(t - TN.word, 8, 0.9);
    setStyle(wordmark, fade * prog(t, TN.word - 0.04, TN.word + 0.26), `translateY(${px((1 - land) * 40 - lift)}) scale(${(0.92 + 0.08 * land).toFixed(4)})`);
    turnHelpers.forEach(h => {
      const rise = spring(t - h.t, 5.5, 0.92);
      setStyle(h.d, fade * prog(t, h.t - 0.02, h.t + 0.35), `translate(-50%, -50%) translate(${px(h.x)}, ${px(h.y + (1 - rise) * 70 - lift)}) scale(${(0.9 + 0.1 * rise).toFixed(4)})`);
    });
  }

  const scroller = make("div", null, shotsEl), scrollA = make("img", null, scroller), scrollB = make("img", null, scroller);
  Object.assign(scroller.style, { position: "absolute", left: "0", top: "0", width: "560px", height: px(760 * K), overflow: "hidden", zIndex: 3, visibility: "hidden" });
  for (const im of [scrollA, scrollB]) Object.assign(im.style, { position: "absolute", left: "0", top: "0", width: "560px", height: "1212px" });
  function drawPhone(t, c) {
    const rise = spring(t - PH.in, 7.5, 0.86), leave = eio(prog(t, PH.out - 0.1, PH.out + 0.45));
    const y = (1 - rise) * 1500 + leave * 1500;
    setStyle($("phone"), t > PH.in - 0.1 && t < PH.out + 0.5 ? 1 : 0, `translateY(${px(y)}) scale(${(1 - leave * 0.2).toFixed(4)})`);
    let i = -1; for (let k = 0; k < TL.screens.length; k++) if (TL.screens[k].t <= t) i = k;
    for (const n in shotImgs) shotImgs[n].style.visibility = "hidden";
    scroller.style.visibility = "hidden";
    if (i >= 0) {
      const cur = TL.screens[i], prev = TL.screens[i - 1];
      const d = cur.fx === "slide" ? 0.46 : cur.fx === "scroll" ? 0.55 : cur.fx === "cut" ? 0 : 0.24;
      const k = d ? prog(t, cur.t, cur.t + d) : 1;
      const ci = shotImgs[cur.shot];
      if (cur.fx === "scroll" && prev && k < 1) {
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
    TL.hls.forEach((h, k) => { const e = prog(t, h.t - (h.soft ? 0.15 : 0.02), h.t + (h.soft ? 0.2 : 0.06)) * (1 - prog(t, h.t + h.until, h.t + h.until + 0.25)); setStyle(hlEls[k], e * 0.9); });
    let fl = 0; for (const f of TL.flashes) fl = Math.max(fl, prog(t, f.t - 0.03, f.t) * (1 - prog(t, f.t + 0.02, f.t + 0.3)));
    setStyle($("flash"), fl * 0.85);
    setStyle($("dim"), cfg.dim ? kf(t, cfg.dim) : 0);
    for (const L of TL.layers) {
      // Off means display: none, so a child the layer made visible can't show through a hidden parent.
      const on = t >= L.t0 - L.fade && t < L.t1 + L.fade;
      L.el.style.display = on ? "" : "none";
      if (!on) continue;
      setStyle(L.el, prog(t, L.t0 - L.fade, L.t0) * (1 - prog(t, L.t1, L.t1 + L.fade)));
      L.draw?.(t, L.el);
    }
  }

  function drawStamps(t) {
    const gather = t >= PG.t;
    STAMPS.forEach((s, i) => {
      if (t < s.t - 0.05) { setStyle(s.d, 0); return; }
      if (!gather) {
        // Land with a press, hold, then tuck away to the lower left, shrinking.
        const land = spring(t - s.t, 20, 0.62), tuck = eio(prog(t, s.t + s.hold, s.t + s.hold + 0.5));
        const x = lerp(s.pos.x, -120, tuck), y = lerp(s.pos.y, 1760, tuck), sc = lerp(lerp(1.7, 1, land), 0.35, tuck);
        setStyle(s.d, prog(t, s.t - 0.04, s.t + 0.02) * (1 - prog(t, s.t + s.hold + 0.35, s.t + s.hold + 0.5)), `translate(-50%, -50%) translate(${px(x)}, ${px(y)}) rotate(${(s.rot * (0.6 + 0.4 * land)).toFixed(2)}deg) scale(${sc.toFixed(4)})`);
        return;
      }
      // The page: every sticker comes back to its slot, then folds away with the page.
      const ta = PG.t + 0.45 + i * 0.045, fly = spring(t - ta, 14, 0.78), fold = eio(prog(t, PG.fold, PG.fold + 0.45));
      const x = lerp(-120, s.slot.x, fly), y = lerp(1760, s.slot.y, fly);
      const fx = lerp(x, 540, fold), fy = lerp(y, 860, fold), sc = s.slot.sc * (0.3 + 0.7 * fly) * (1 - 0.85 * fold);
      setStyle(s.d, prog(t, ta - 0.02, ta + 0.08) * (1 - prog(t, PG.fold + 0.3, PG.fold + 0.45)), `translate(-50%, -50%) translate(${px(fx)}, ${px(fy)}) rotate(${(s.slot.rot * (1 - fold)).toFixed(2)}deg) scale(${sc.toFixed(4)})`);
    });
  }

  function drawPage(t) {
    const inn = spring(t - PG.t, 12, 0.82), fold = eio(prog(t, PG.fold, PG.fold + 0.45));
    const on = t > PG.t - 0.05 && t < PG.fold + 0.5;
    setStyle(pageEl, on ? prog(t, PG.t - 0.02, PG.t + 0.1) * (1 - prog(t, PG.fold + 0.3, PG.fold + 0.45)) : 0,
      `translateY(${px((1 - inn) * 500)}) perspective(1600px) rotateX(${(fold * 70).toFixed(2)}deg) scale(${(1 - fold * 0.75).toFixed(4)})`);
  }

  function drawPlus(t) {
    let o = 0, t0 = -1;
    for (const [a, b] of PLUS) if (t > a - 0.1 && t < b + 0.3) { o = prog(t, a, a + 0.1) * (1 - prog(t, b, b + 0.22)); t0 = a; }
    if (t0 < 0) { setStyle(plusEl, 0); return; }
    const pop = spring(t - t0, 16, 0.7);
    plusEl.style.marginLeft = px(-plusEl.offsetWidth / 2);
    setStyle(plusEl, o, `scale(${(0.6 + 0.4 * pop).toFixed(4)})`);
  }

  function drawFinger(t, c) {
    const f = $("finger");
    let g0 = -1, g1 = -1;
    for (let i = 0; i < TL.taps.length; i++) {
      let a = i; while (a > 0 && TL.taps[a].t - TL.taps[a - 1].t < 2.2) a--;
      let b = i; while (b < TL.taps.length - 1 && TL.taps[b + 1].t - TL.taps[b].t < 2.2) b++;
      const end = TL.taps[b].drag ? TL.taps[b].drag.t1 : TL.taps[b].t;
      if (t >= TL.taps[a].t - 0.75 && t <= end + 0.55) { g0 = a; g1 = b; break; }
    }
    if (g0 < 0) { setStyle(f, 0); return; }
    const fx = new Track(TL.taps[g0].x + 60), fy = new Track(TL.taps[g0].y + 160);
    for (let i = g0; i <= g1; i++) {
      const tp = TL.taps[i];
      fx.to(tp.t - 0.42, tp.x, 15, 0.95); fy.to(tp.t - 0.42, tp.y, 11.5, 0.95);
      if (tp.drag) { fx.to(tp.t + 0.02, tp.x + tp.drag.dx, 9, 1); fy.to(tp.t + 0.02, tp.y + tp.drag.dy, 9, 1); }
    }
    const last = TL.taps[g1], lastEnd = last.drag ? last.drag.t1 : last.t;
    const lx = last.x + (last.drag?.dx || 0), ly = last.y + (last.drag?.dy || 0);
    fx.to(lastEnd + 0.2, lx + 40, 8, 1); fy.to(lastEnd + 0.2, ly + 120, 8, 1);
    const p = toScreen({ x: fx.at(t), y: fy.at(t) }, c);
    let press = 0, ring = 0, ringK = 0;
    for (let i = g0; i <= g1; i++) {
      const tp = TL.taps[i], d = t - tp.t;
      if (tp.drag) { if (t >= tp.t - 0.05 && t <= tp.drag.t1) press = Math.max(press, 0.8); }
      else { press = Math.max(press, Math.exp(-((d / 0.07) ** 2))); if (d >= 0 && d < 0.5) { ringK = d / 0.5; ring = 1; } }
    }
    const o = prog(t, TL.taps[g0].t - 0.6, TL.taps[g0].t - 0.36) * (1 - prog(t, lastEnd + 0.25, lastEnd + 0.55));
    setStyle(f, o, `translate(${px(p.x)}, ${px(p.y)}) scale(${(1 - 0.18 * press).toFixed(4)})`);
    const rg = f.querySelector(".ring"); rg.style.opacity = (ring * (1 - ringK) * 0.9).toFixed(3); rg.style.transform = `scale(${(0.5 + 1.6 * eout(ringK)).toFixed(4)})`;
    f.querySelector(".dot").style.background = `rgba(255,255,255,${(0.86 - 0.18 * press).toFixed(3)})`;
  }

  function drawBubbles(t) {
    TL.bubbles.forEach((b, i) => {
      const e = bubbleEls[i], pop = spring(t - b.t0, 16, 0.7), out = prog(t, b.t1 - 0.2, b.t1);
      e.style.left = "70px"; e.style.top = "1330px";
      e.firstChild.firstChild.style.transform = `translateY(${px(Math.sin(t * 2.8 + i) * 4)}) rotate(${(Math.sin(t * 1.4 + i) * 2.5).toFixed(2)}deg) scale(1.08)`;
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
    const ink = lum < 0.62 ? "#f8eef4" : "#3a1f33"; capWrap.classList.toggle("light", lum < 0.62);
    CAP.forEach(cp => {
      if (t < cp.tin - 0.1 || t > cp.tout + 0.25) { setStyle(cp.el, 0); return; }
      const out = prog(t, cp.tout, cp.tout + 0.18);
      setStyle(cp.el, 1 - out * out, `translateY(${px(-out * 14)})`, out > 0 ? `blur(${(out * 8).toFixed(2)}px)` : "none");
      cp.p.style.color = ink;
      cp.spans.forEach(s => { const e = spring(t - (s.t - 0.06), 24, 1); s.inner.style.transform = `translateY(${px((1 - e) * 110)})`; });
    });
  }

  function drawEnd(t) {
    const e = spring(t - EN.t, 13, 0.62);
    setStyle(endcard, prog(t, EN.t - 0.02, EN.t + 0.06));
    endSun.style.transform = `scale(${(0.35 + 0.65 * e).toFixed(4)}) rotate(${((1 - e) * -70).toFixed(2)}deg)`;
    const u = vis(t, EN.urlAt ?? EN.t + 0.5, null); endUrl.style.opacity = u.o.toFixed(3); endUrl.style.transform = `translateY(${px(u.dy)})`; endUrl.style.filter = `blur(${u.b.toFixed(2)}px)`;
    const pa = EN.priceAt ?? EN.t + 1.4, pp = spring(t - pa, 16, 0.7);
    endPrice.style.marginLeft = px(-endPrice.offsetWidth / 2);
    setStyle(endPrice, prog(t, pa - 0.02, pa + 0.08), `translateY(${px((1 - pp) * 30)}) scale(${(0.7 + 0.3 * pp).toFixed(4)})`);
    endHelpers.forEach(({ d, i }) => {
      const ha = (EN.helpersAt ?? EN.t + 1.9) + i * 0.16, hp = spring(t - ha, 14, 0.6), x = 540 + (i - (endHelpers.length - 1) / 2) * 250;
      setStyle(d, prog(t, ha - 0.02, ha + 0.08), `translate(${px(x)}, ${px(1530 + (1 - hp) * 200 + Math.sin(t * 2.2 + i) * 8)}) scale(${(0.6 + 0.4 * hp).toFixed(4)})`);
    });
    const drift = 1 + 0.03 * eio(prog(t, EN.t + 0.5, DURATION));
    endcard.style.transform = `scale(${drift.toFixed(4)})`; endcard.style.transformOrigin = "540px 960px";
  }

  window.seek = t => {
    t = clamp(t, 0, DURATION);
    drawSky(t);
    const c = camAt(t);
    $("world").style.transform = `translate(${px(c.ax)}, ${px(c.ay)}) scale(${c.z.toFixed(5)}) translate(${px(-c.cx)}, ${px(-c.cy)})`;
    drawHook(t); drawTurn(t); drawPhone(t, c); cfg.draw?.(t, c, api); drawBand(t, c); drawPlus(t); drawPage(t); drawStamps(t); drawFinger(t, c); drawBubbles(t); drawCaptions(t); drawEnd(t);
  };
  window.duration = DURATION;
  window.ready = (async () => {
    await Promise.all([document.fonts.load('800 76px "Bricolage"'), document.fonts.load('800 76px "Atkinson"')]);
    await Promise.all([...document.images].map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; })));
    window.seek(0);
    return true;
  })();
};
})();
