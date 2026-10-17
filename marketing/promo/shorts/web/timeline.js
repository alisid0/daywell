// "Daywell in your phone's browser": what happens in each chapter, synced to Alice's words (voiceover-lines.mjs).
// The browser, keyboard, share sheet, menu, home screens and laptop are simple generic illustrations drawn here in
// Daywell's own style (not copies of Apple's or Google's screens). Everything shown inside them is the real app: the
// sign-in page, the six-digit code, Today, the plan screen (capture-plan.mjs) and the new home-screen icon.
// Drawn layers are in film px on the phone screen (560×1212); taps (tapAt) are in app CSS px (film px ÷ K).
const W = (n, w, k) => window.FILM_DATA.vo[n - 1].words.filter(x => x.w.toLowerCase().replace(/[^a-z0-9'’-]/g, "") === w)[k || 0].t;
const K = 560 / 390, ic = (name, size, stroke = 2.2) => window.icon(name, size, stroke);
const ICON = "assets/art/apple-touch-icon.png", ICON_ROUND = "assets/art/icon-512.png";
const ink = "#3d2c38", soft = "#8a7383", plum = "#803c65";
const sp = (t, t0, w = 16, z = 0.75) => { if (t <= t0) return 0; const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * (t - t0)) * (Math.cos(wd * (t - t0)) + ((z * w) / wd) * Math.sin(wd * (t - t0))); };
const pr = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const ease = x => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

// A web page inside a browser frame: a capture from app CSS y `from`, placed at film y `top`.
const page = (shot, top, from = 60) => `<div class="wb-page" style="position:absolute;left:0;right:0;top:${top}px;bottom:0;overflow:hidden;background:#fbeef4"><img src="assets/shots/${shot}.png" alt="" style="position:absolute;left:0;top:${(-from * K).toFixed(1)}px;width:560px;height:1212px"></div>`;
// A generic phone browser: address bar on top; back, forward, share, bookmarks and tabs at the bottom.
const browser = (shot, { url = "daywell.date" } = {}) => `<div style="position:absolute;inset:0;background:#fbeef4">
  ${shot ? page(shot, 156) : `<div class="wb-page" style="position:absolute;left:0;right:0;top:156px;bottom:0;background:#fff"></div>`}
  <div style="position:absolute;left:0;right:0;top:0;height:156px;background:#f8f4f8;border-bottom:1px solid #eadfe6"></div>
  <div style="position:absolute;left:24px;right:24px;top:76px;height:66px;border-radius:20px;background:#fff;border:1px solid #e3d6df;display:flex;align-items:center;justify-content:center;gap:10px;font-size:31px;font-weight:700;color:${ink}">
    <span class="wb-lock" style="color:${soft}">${ic("lock", 22)}</span><span class="wb-url">${url}</span><i class="wb-caret" style="width:3px;height:36px;background:${plum};opacity:0"></i></div>
  <div class="wb-progress" style="position:absolute;left:24px;top:148px;height:5px;width:0;border-radius:3px;background:${plum}"></div>
  <div class="wb-tools" style="position:absolute;left:0;right:0;bottom:0;height:104px;background:#f8f4f8;border-top:1px solid #eadfe6;display:flex;justify-content:space-around;align-items:center;color:#7d536e">${["chevron-left", "chevron-right", "share", "book-open", "copy"].map(n => `<span style="width:56px;display:grid;place-items:center">${ic(n, 34)}</span>`).join("")}</div>
</div>`;
// A plain keyboard (film px): letter rows, then 123, a dot, space and a go key.
const KB = { top: 712, rows: [728, 828, 928, 1028], kw: 49.4, kh: 84 };
const kbKeys = [];
"qwertyuiop".split("").forEach((k, i) => kbKeys.push({ k, x: 6 + i * 55.4, y: KB.rows[0], w: KB.kw }));
"asdfghjkl".split("").forEach((k, i) => kbKeys.push({ k, x: 33.7 + i * 55.4, y: KB.rows[1], w: KB.kw }));
"zxcvbnm".split("").forEach((k, i) => kbKeys.push({ k, x: 89.1 + i * 55.4, y: KB.rows[2], w: KB.kw }));
kbKeys.push({ k: "shift", x: 6, y: KB.rows[2], w: 70, icon: "chevron-left" }, { k: "back", x: 484, y: KB.rows[2], w: 70, icon: "x" });
kbKeys.push({ k: "123", x: 6, y: KB.rows[3], w: 96, label: "123" }, { k: ".", x: 108, y: KB.rows[3], w: 60, label: "." }, { k: " ", x: 174, y: KB.rows[3], w: 250, label: "" }, { k: "go", x: 430, y: KB.rows[3], w: 124, label: "go" });
const keyboard = `<div class="wb-kb" style="position:absolute;left:0;right:0;top:${KB.top}px;bottom:0;background:#ece4eb;border-top:1px solid #ddd0da;transform:translateY(105%)">${kbKeys.map(({ k, x, y, w, icon, label }) =>
  `<span data-k="${k}" style="position:absolute;left:${x.toFixed(1)}px;top:${y - KB.top}px;width:${w}px;height:${KB.kh}px;border-radius:12px;background:${k === "go" ? plum : k.length > 1 && k !== " " ? "#d9ccd6" : "#fff"};box-shadow:0 2px 0 rgba(60,30,50,.18);display:grid;place-items:center;font-size:${k === "go" || k === "123" ? 26 : 32}px;font-weight:${k === "go" ? 800 : 600};color:${k === "go" ? "#fff" : ink}">${icon ? ic(icon, 26) : label ?? k}</span>`).join("")}</div>`;
const pressKeys = (el, t, t0, t1, text) => {
  const lit = new Set(); text.split("").forEach((ch, i) => { const at = t0 + ((i + 1) / text.length) * (t1 - t0); if (t >= at && t < at + 0.13) lit.add(ch); });
  el.querySelectorAll(".wb-kb [data-k]").forEach(s => { if (s.dataset.k.length === 1) s.style.background = lit.has(s.dataset.k) ? "#e9c9db" : "#fff"; });
};
// The share sheet: a header, places to share, and the list with Add to Home Screen.
const shareSheet = `<div class="wb-sheet" style="position:absolute;left:0;right:0;bottom:0;height:640px;border-radius:38px 38px 0 0;background:#f6f1f5;box-shadow:0 -12px 40px rgba(60,30,50,.2);transform:translateY(105%)">
  <div style="display:flex;align-items:center;gap:18px;padding:30px 30px 22px;border-bottom:1px solid #e9dfe6"><img src="${ICON}" alt="" style="width:72px;height:72px;border-radius:18px"><div><b style="display:block;font-size:30px;color:${ink}">Daywell</b><span style="font-size:24px;color:${soft}">daywell.date</span></div><span style="margin-left:auto;width:50px;height:50px;border-radius:50%;background:#e9e1e7;display:grid;place-items:center;color:#7d536e">${ic("x", 24)}</span></div>
  <div style="display:flex;justify-content:space-around;padding:24px 10px 18px">${[["Message", "#bfe3c8"], ["Mail", "#bcd6f2"], ["Notes", "#f4e2a8"], ["More", "#e4dbe8"]].map(([l, c]) => `<div style="display:flex;flex-direction:column;align-items:center;gap:10px;font-size:21px;line-height:25px;color:#6d5a67"><span style="width:88px;height:88px;border-radius:26px;background:${c}"></span>${l}</div>`).join("")}</div>
  <div style="margin:0 24px;border-radius:24px;background:#fff;overflow:hidden">${[["Copy", "copy"], ["Add to Home Screen", "square-plus"], ["Add bookmark", "book-open"]].map(([l, n], i) => `<div style="display:flex;align-items:center;justify-content:space-between;height:84px;padding:0 28px;font-size:30px;color:${ink};${i ? "border-top:1px solid #efe6ec;" : ""}${i === 1 ? "font-weight:700;" : ""}">${l}<span style="color:#6d5a67">${ic(n, 32)}</span></div>`).join("")}</div>
</div>`;
// Confirming the new home-screen icon (iPhone).
const addConfirm = `<div class="wb-confirm" style="position:absolute;inset:0;background:#f6f1f5;transform:translateX(105%)">
  <div style="position:absolute;left:0;right:0;top:70px;height:92px;display:flex;align-items:center;justify-content:space-between;padding:0 32px;font-size:30px"><span style="color:${plum}">Cancel</span><b style="color:${ink}">Add to Home Screen</b><b style="color:${plum}">Add</b></div>
  <div style="position:absolute;left:30px;right:30px;top:196px;padding:30px;border-radius:28px;background:#fff;display:flex;gap:26px;align-items:center"><img src="${ICON}" alt="" style="width:124px;height:124px;border-radius:30px"><div style="flex:1"><div style="font-size:33px;font-weight:700;color:${ink};padding:10px 0;border-bottom:1px solid #efe6ec">Daywell</div><div style="font-size:25px;color:${soft};padding-top:12px">daywell.date</div></div></div>
  <p style="position:absolute;left:46px;right:46px;top:430px;margin:0;font-size:25px;line-height:1.5;color:${soft}">Daywell will open from your home screen, full screen.</p>
</div>`;
// A home screen of plain pastel apps; Daywell's new icon pops into place (iPhone: row 2, column 2; Android: column 3).
const pastels = ["#f6c9b8", "#c9e4d2", "#cfd9f3", "#f4e3ad", "#e3d1f1", "#f7c6d6", "#bfe1e8", "#e9dcc9"];
const homeSlot = android => ({ x: 44 + (android ? 2 : 1) * 124, y: 150 + 158 }); // the new icon's top-left, film px
function homeScreen({ android = false, shown = false } = {}) {
  const slot = homeSlot(android), icons = [], round = android ? "50%" : "26px";
  for (let r = 0; r < (android ? 5 : 4); r++) for (let c = 0; c < 4; c++) {
    const x = 44 + c * 124, y = 150 + r * 158;
    if (x === slot.x && y === slot.y) continue;
    icons.push(`<div style="position:absolute;left:${x}px;top:${y}px;width:104px;display:flex;flex-direction:column;align-items:center;gap:12px"><span style="width:104px;height:104px;border-radius:${round};background:linear-gradient(150deg,${pastels[(r * 4 + c) % 8]},${pastels[(r * 4 + c + 3) % 8]})"></span><span style="width:64px;height:12px;border-radius:6px;background:rgba(255,255,255,.7)"></span></div>`);
  }
  const dock = android ? `<div style="position:absolute;left:44px;right:44px;bottom:70px;height:76px;border-radius:38px;background:rgba(255,255,255,.75)"></div>`
    : `<div style="position:absolute;left:24px;right:24px;bottom:28px;height:142px;border-radius:44px;background:rgba(255,255,255,.35);display:flex;justify-content:space-around;align-items:center">${[0, 1, 2, 3].map(i => `<span style="width:104px;height:104px;border-radius:26px;background:linear-gradient(150deg,${pastels[i + 2]},${pastels[(i + 5) % 8]})"></span>`).join("")}</div>`;
  const wall = android ? "linear-gradient(170deg,#7fb7b4 0%,#cfe0c9 55%,#f6d7b8 100%)" : "linear-gradient(170deg,#b9a6e3 0%,#e7b8d4 55%,#f8d6c4 100%)";
  return `<div style="position:absolute;inset:0;background:${wall}">${icons.join("")}${dock}
    <div class="wb-ring" style="position:absolute;left:${slot.x - 8}px;top:${slot.y - 8}px;width:120px;height:120px;border-radius:${android ? "50%" : "32px"};border:5px solid rgba(255,255,255,.95);opacity:0"></div>
    <div class="wb-new" style="position:absolute;left:${slot.x}px;top:${slot.y}px;width:104px;display:flex;flex-direction:column;align-items:center;gap:10px;transform:scale(${shown ? 1 : 0})"><img src="${android ? ICON_ROUND : ICON}" alt="" style="width:104px;height:104px;border-radius:${round};box-shadow:0 10px 24px rgba(40,20,40,.28)"><span style="font-size:21px;font-weight:700;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.35)">Daywell</span></div></div>`;
}
// The new icon pops in at t0, then a soft ring pulses around it twice.
const popIcon = t0 => (t, el) => {
  el.querySelector(".wb-new").style.transform = `scale(${sp(t, t0, 16, 0.55).toFixed(4)})`;
  const ring = el.querySelector(".wb-ring"), k = (t - t0 - 0.35) / 0.9;
  if (k < 0 || k >= 2) { ring.style.opacity = "0"; return; }
  const f = k % 1; ring.style.opacity = ((1 - f) * 0.9).toFixed(3); ring.style.transform = `scale(${(1 + 0.32 * (1 - (1 - f) ** 3)).toFixed(4)})`;
};
// An Android-style browser: address bar with a menu button, the menu, and the add dialog.
const androidBrowser = shot => `<div style="position:absolute;inset:0;background:#fbeef4">
  ${page(shot, 158)}
  <div style="position:absolute;left:0;right:0;top:0;height:158px;background:#f4f2f6;border-bottom:1px solid #e3e0e8"></div>
  <div style="position:absolute;left:24px;right:96px;top:78px;height:64px;border-radius:32px;background:#e8e6ee;display:flex;align-items:center;gap:12px;padding:0 24px;font-size:30px;font-weight:700;color:${ink}"><span style="color:${soft}">${ic("lock", 22)}</span>daywell.date</div>
  <div style="position:absolute;right:24px;top:78px;width:60px;height:64px;border-radius:32px;display:grid;place-items:center;color:${ink}">${ic("ellipsis-vertical", 34)}</div>
  <div class="wb-menu" style="position:absolute;right:20px;top:66px;width:300px;padding:16px 0;border-radius:22px;background:#fff;box-shadow:0 18px 44px rgba(40,20,40,.25);transform-origin:100% 0;transform:scale(.6);opacity:0">${["New tab", "History", "Bookmarks", "Add to home screen", "Settings"].map((l, i) => `<div style="height:80px;display:flex;align-items:center;padding:0 28px;font-size:28px;color:${ink};${i === 3 ? "font-weight:700;background:#f6eef3;" : ""}">${l}</div>`).join("")}</div>
  <div class="wb-dialog" style="position:absolute;inset:0;background:rgba(30,20,30,.35);opacity:0"><div style="position:absolute;left:50px;right:50px;top:380px;padding:36px;border-radius:32px;background:#fff">
    <b style="display:block;font-size:34px;line-height:41px;color:${ink};margin-bottom:28px">Add to home screen</b>
    <div style="display:flex;align-items:center;gap:22px"><img src="${ICON_ROUND}" alt="" style="width:96px;height:96px;border-radius:50%"><span style="flex:1;font-size:30px;color:${ink};padding:12px 0;border-bottom:2px solid ${plum}">Daywell</span></div>
    <div style="display:flex;justify-content:flex-end;gap:44px;margin-top:40px;font-size:30px;line-height:36px;font-weight:700;color:${plum}"><span>Cancel</span><span>Add</span></div></div></div>
</div>`;
const splash = `<div style="position:absolute;inset:0;background:#fae7ef;display:grid;place-items:center"><img class="wb-splash" src="${ICON}" alt="" style="width:230px;height:230px;border-radius:56px;box-shadow:0 22px 50px rgba(128,60,101,.25)"></div>`;
// The browser's bars, drawn over the opened app and then swept away: the app has the whole screen.
const ghostBars = `<div class="wb-top" style="position:absolute;left:0;right:0;top:0;height:156px;background:rgba(248,244,248,.94);border-bottom:1px solid #eadfe6"><div style="position:absolute;left:24px;right:24px;top:76px;height:66px;border-radius:20px;background:#fff;border:1px solid #e3d6df;display:flex;align-items:center;justify-content:center;gap:10px;font-size:31px;font-weight:700;color:${ink}"><span style="color:${soft}">${ic("lock", 22)}</span>daywell.date</div></div>
  <div class="wb-bottom" style="position:absolute;left:0;right:0;bottom:0;height:104px;background:rgba(248,244,248,.94);border-top:1px solid #eadfe6;display:flex;justify-content:space-around;align-items:center;color:#7d536e">${["chevron-left", "chevron-right", "share", "book-open", "copy"].map(n => `<span style="width:56px;display:grid;place-items:center">${ic(n, 34)}</span>`).join("")}</div>`;

Short({
  name: "Web app", helper: "sunny", helperName: "Sunny", color: "#F5DF9E", phoneIn: 10.55,
  badge: { icon: "check", label: "Works on both plans" },
  accent: ["daywelldate", "browser", "share", "home", "screen", "menu", "code", "password", "everywhere", "plan", "calm", "yourself"],
  hook: { chips: [
    { t: 0.5, icon: "globe", text: "daywell.date" },
    { t: W(1, "phone's") - 0.15, icon: "smartphone", text: "In your browser" },
    { t: W(1, "browser") + 0.25, icon: "house", text: "On your home screen" },
  ] },
  title: { slam: W(2, "web"), with: W(2, "web") + 0.4, out: 10.15, withText: "at daywell.date" },
  chapters: [
    { t: 12, title: "Open daywell.date", plan: "daywell", inner: browser(null, { url: "" }) },
    { t: 22, title: "iPhone: Add to Home Screen", plan: "daywell", inner: browser("w-signin") },
    { t: 34, title: "Android: Add to home screen", plan: "daywell", inner: androidBrowser("w-signin") },
    { t: 46, title: "Opens like an app", plan: "daywell", inner: homeScreen({ shown: true }) },
    { t: 58, title: "Sign in with a code", plan: "daywell", shot: "w-signin" },
    { t: 72, title: "One account everywhere", plan: "daywell", shot: "w-today" },
    { t: 84, title: "Choosing a plan", plan: "daywell", shot: "w-plans", badge: { icon: "sun", label: "From £4.99 a month" } },
  ],
  recap: { t: 98, title: "One calm place", prices: false, pricesAt: W(10, "are") + 0.2, foot: "Wherever you are",
    areas: [
      { name: "Eat", helper: "nori", helperName: "Nori", color: "#F3C5B5", at: W(10, "eat") },
      { name: "Move", helper: "bounce", helperName: "Bounce", color: "#F3A6A9", at: W(10, "move") },
      { name: "Sleep", helper: "luma", helperName: "Luma", color: "#D9C9F2", at: W(10, "sleep") },
      { name: "Relax", helper: "luma", helperName: "Luma", color: "#CFE6DA", at: W(10, "relax") },
    ] },
  close: { t: 110 },
  script({ S, tapAt, tap, hl, typing, bubble, cue, camTo, camFull, camWorld, R, layer, worldArt, make, px }) {
    // Each chapter's drawing stays up until the next card has covered the phone (its t + 1), so no frame shows an
    // empty screen; the next chapter's drawing starts just before that.
    // Title: a new tab waits while the phone rises.
    layer(9.8, 12.95, browser(null, { url: "" }), null, 0.05);

    // 1 · Open your browser and go to daywell.date: tap the address bar, type, go.
    const tBar = W(3, "browser"), tType0 = W(3, "go") + 0.2, tType1 = W(3, "date") + 0.1, tGo = tType1 + 0.3;
    layer(12.9, 23.0, `${browser("w-signin", { url: "" })}${keyboard}`, (t, el) => {
      const url = el.querySelector(".wb-url"), n = Math.floor(pr(t, tType0, tType1) * 12 + 1e-6);
      url.textContent = "daywell.date".slice(0, n) || "​";
      el.querySelector(".wb-caret").style.opacity = t > tBar + 0.1 && t < tGo ? (Math.floor(t * 2.4) % 2 ? "1" : "0.15") : "0";
      el.querySelector(".wb-lock").style.display = t > tGo ? "" : "none";
      const kb = sp(t, tBar + 0.08, 15, 0.9) - sp(t, tGo + 0.05, 15, 0.95);
      el.querySelector(".wb-kb").style.transform = `translateY(${((1 - kb) * 105).toFixed(2)}%)`;
      pressKeys(el, t, tType0, tType1, "daywell.date");
      el.querySelector('[data-k="go"]').style.background = t >= tGo - 0.02 && t < tGo + 0.14 ? "#5e2a4a" : plum;
      const bar = el.querySelector(".wb-progress"); bar.style.width = px(pr(t, tGo, tGo + 0.7) * 512); bar.style.opacity = (1 - pr(t, tGo + 0.7, tGo + 1.0)).toFixed(3);
      el.querySelector(".wb-page img").style.opacity = pr(t, tGo + 0.1, tGo + 0.6).toFixed(3);
    }, 0.05);
    camTo(12.85, R(16, 20, 358, 300));
    tapAt(tBar, 17, 53, 356, 46);
    camFull(tBar + 0.15);
    cue(tType0, "typing", -14);
    tapAt(tGo, 430 / K, 1028 / K, 124 / K, 84 / K, { hold: 0.2 });
    camTo(tGo + 0.25, R(16, 20, 358, 560), 1.15);
    bubble(17.2, 21.0, "sunny", "That’s it. No download needed.");

    // 2 · On iPhone: Share, then Add to Home Screen, then Add; the icon joins the home screen.
    const tShare = W(4, "share") - 0.05, tAdd = W(4, "add") + 0.35, tConfirm = tAdd + 1.6, tHome = tConfirm + 0.2;
    layer(22.9, tHome + 0.02, `${browser("w-signin")}${shareSheet}${addConfirm}`, (t, el) => {
      el.querySelector(".wb-sheet").style.transform = `translateY(${((1 - sp(t, tShare + 0.1, 14, 0.9)) * 105).toFixed(2)}%)`;
      el.querySelector(".wb-confirm").style.transform = `translateX(${((1 - sp(t, tAdd + 0.12, 14, 0.95)) * 105).toFixed(2)}%)`;
    }, 0.05);
    layer(tHome, 35.0, homeScreen(), popIcon(tHome + 0.35), 0.12);
    camTo(22.85, R(16, 600, 358, 244));
    tapAt(tShare, 173, 786, 44, 44);
    camTo(tShare + 0.3, R(16, 400, 358, 444));
    tapAt(tAdd, 17, 659, 356, 58);
    camTo(tAdd + 0.25, R(16, 30, 358, 330));
    tapAt(tConfirm, 326, 58, 44, 44);
    camTo(tConfirm + 0.35, R(16, 140, 358, 360)); cue(tHome + 0.4, "pop", -12, 1.1);
    bubble(29.4, 33.2, "sunny", "There it is, with your other apps.");

    // 3 · On Android: the menu, Add to home screen, then Add.
    const tMenu = W(5, "menu") - 0.1, tItem = W(5, "tap") + 0.2, tOk = W(5, "screen") + 0.6, tHomeA = tOk + 0.2;
    layer(34.9, tHomeA + 0.02, androidBrowser("w-signin"), (t, el) => {
      const m = sp(t, tMenu + 0.08, 18, 0.85), d = pr(t, tItem + 0.1, tItem + 0.3);
      el.querySelector(".wb-menu").style.transform = `scale(${(0.6 + 0.4 * m).toFixed(4)})`; el.querySelector(".wb-menu").style.opacity = (pr(t, tMenu, tMenu + 0.12) * (1 - d)).toFixed(3);
      el.querySelector(".wb-dialog").style.opacity = d.toFixed(3);
    }, 0.05);
    layer(tHomeA, 47.0, homeScreen({ android: true }), popIcon(tHomeA + 0.3), 0.12);
    camTo(34.85, R(16, 20, 358, 300));
    tapAt(tMenu, 332, 53, 40, 46);
    tapAt(tItem, 172, 229, 200, 46);
    camTo(tItem + 0.2, R(16, 250, 358, 300));
    tapAt(tOk, 287, 423, 48, 44); cue(tHomeA + 0.35, "pop", -12, 1.1);
    camTo(tOk + 0.3, R(16, 140, 358, 360));
    bubble(40.6, 44.8, "sunny", "Android or iPhone, it works the same.");

    // 4 · Opens from the home screen like any other app: full screen, no address bar.
    const tOpen = W(6, "opens") - 0.05, tApp = tOpen + 1.4, tSweep = W(6, "app") + 0.75;
    layer(46.9, tOpen + 0.2, homeScreen({ shown: true }), null, 0.05);
    layer(tOpen + 0.18, tApp + 0.05, splash, (t, el) => { el.querySelector(".wb-splash").style.transform = `scale(${(0.55 + 0.45 * sp(t, tOpen + 0.18, 13, 0.7)).toFixed(4)})`; }, 0.08);
    S(tApp, "w-signin", "blur");
    layer(tSweep - 0.45, tSweep + 0.6, ghostBars, (t, el) => {
      const p = ease(pr(t, tSweep, tSweep + 0.55));
      el.querySelector(".wb-top").style.transform = `translateY(${px(-p * 175)})`; el.querySelector(".wb-bottom").style.transform = `translateY(${px(p * 120)})`;
    }, 0.12);
    camTo(46.85, R(16, 170, 358, 240));
    tapAt(tOpen, 126, 224, 54, 54); cue(tOpen + 0.2, "whoosh", -16);
    camFull(tOpen + 0.25);
    cue(tSweep, "swoosh", -15);
    camTo(tSweep + 0.7, R(16, 30, 358, 560), 1.12);
    bubble(51.4, 55.6, "sunny", "Full screen. No address bar.");

    // 5 · Sign in with your email and a six-digit code. No password.
    camTo(58.85, R(16, 150, 358, 300));
    tap(59.1, "w-signin", "email");
    typing(59.2, 60.0, "w-typed", "w-email");
    S(60.01, "w-typed", "cut");
    tap(W(7, "send") - 0.05, "w-typed", "send");
    S(W(7, "send") + 0.07, "w-code"); camTo(W(7, "send") + 0.1, R(16, 60, 358, 340));
    typing(W(7, "code") + 0.1, W(7, "no") + 0.2, "w-code-typed", "w-code-typing");
    S(W(7, "no") + 0.21, "w-code-full", "cut");
    S(W(7, "no") + 0.65, "w-code-typed", "blur"); cue(W(7, "no") + 0.65, "saved", -13);
    camTo(W(7, "no") + 0.7, R(16, 20, 358, 560), 1.15);
    bubble(64.6, 69.0, "sunny", "New here? The same code makes your account.");

    // 6 · The same account everywhere: phone, laptop and the Daywell app (world px; the camera pulls back to half size).
    const tWide = W(8, "everywhere") - 0.3, tOut = 81.6;
    // Framed for zoom 0.5 about (1250, 1100): the laptop lands on the left half of the film, the phone on the right.
    const laptop = make("div", null, worldArt, `<div style="position:absolute;left:-1040px;top:530px;width:1200px;height:770px;border-radius:42px;background:#231a26;box-shadow:0 50px 110px rgba(52,25,45,.35)"><img src="assets/shots/w-laptop.png" alt="" style="position:absolute;left:30px;top:29px;width:1140px;height:712px;border-radius:14px"></div>
      <div style="position:absolute;left:-1120px;top:1297px;width:1360px;height:44px;border-radius:0 0 40px 40px;background:linear-gradient(#d9ccd6,#b8a6b4)"></div>`);
    Object.assign(laptop.style, { position: "absolute", left: "0", top: "0", opacity: "0" });
    const chip = (html, x, y, at) => { const el = make("div", null, worldArt, html); Object.assign(el.style, { position: "absolute", left: "0", top: "0", display: "flex", alignItems: "center", gap: "28px", borderRadius: "999px", background: "rgba(255,247,251,.97)", boxShadow: "0 24px 50px rgba(82,45,70,.2)", whiteSpace: "nowrap", opacity: "0" }); return { el, x, y, at }; };
    const label = text => `<b style="padding:26px 72px;font-size:96px;font-weight:800;color:#4b2340">${text}</b>`;
    const chips = [
      chip(label("Your phone"), 530, 1790, W(8, "phone")),
      chip(label("Your laptop"), -440, 1420, W(8, "laptop")),
      chip(`<img src="${ICON}" alt="" style="width:150px;height:150px;border-radius:38px;margin:24px 0 24px 24px"><span style="padding-right:64px"><b style="display:block;font-size:96px;line-height:1.05;color:#4b2340">Daywell app</b><small style="font-size:64px;font-weight:700;color:#7d536e">iPhone &amp; Android</small></span>`, -170, 2010, W(8, "daywell")),
    ];
    // A dotted line between the two screens, with a dot going back and forth: one account, kept in step.
    const A0 = [-440, 515], A1 = [50, 180], A2 = [540, 458];
    const sync = make("div", null, worldArt, `<svg width="1" height="1" style="position:absolute;left:0;top:0;overflow:visible"><path d="M${A0} Q${A1} ${A2}" fill="none" stroke="rgba(128,60,101,.45)" stroke-width="10" stroke-linecap="round" stroke-dasharray="2 26"/></svg><div class="wb-dot" style="position:absolute;left:-24px;top:-24px;width:48px;height:48px;border-radius:50%;background:${plum};border:8px solid #fff7fb;box-sizing:border-box"></div>`);
    Object.assign(sync.style, { position: "absolute", left: "0", top: "0", opacity: "0" });
    const tSync = W(8, "app") + 0.4;
    camWorld(tWide, 1250, 1100, 0.5, 4.6);
    camFull(tOut + 0.2);
    this.drawWorld = t => {
      const on = t > tWide - 0.2 && t < tOut + 0.8, out = pr(t, tOut, tOut + 0.6), inn = sp(t, tWide + 0.15, 9, 0.85);
      laptop.style.opacity = on ? (pr(t, tWide, tWide + 0.3) * (1 - out)).toFixed(3) : "0";
      laptop.style.transform = `translateX(${px((1 - inn) * -700)})`;
      chips.forEach(c => { const p = sp(t, c.at, 16, 0.7); c.el.style.opacity = on ? (pr(t, c.at - 0.03, c.at + 0.07) * (1 - out)).toFixed(3) : "0"; c.el.style.transform = `translate(-50%, 0) translate(${px(c.x)}, ${px(c.y + (1 - p) * 60)}) scale(${(0.6 + 0.4 * p).toFixed(4)})`; });
      sync.style.opacity = on ? (pr(t, tSync - 0.2, tSync + 0.15) * (1 - out)).toFixed(3) : "0";
      const u = 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, t - tSync) / 1.25), q = 1 - u;
      sync.querySelector(".wb-dot").style.transform = `translate(${px(q * q * A0[0] + 2 * q * u * A1[0] + u * u * A2[0])}, ${px(q * q * A0[1] + 2 * q * u * A1[1] + u * u * A2[1])})`;
    };
    cue(tWide + 0.1, "swoosh", -15); cue(W(8, "phone"), "pop", -15); cue(W(8, "laptop"), "pop", -15, 1.06); cue(W(8, "daywell"), "pop", -14, 1.12);

    // 7 · Choose a plan in the Daywell app for iPhone or Android, then use it in the browser too.
    camTo(84.85, R(16, 20, 358, 460));
    S(W(9, "app") - 0.3, "w-plans2", "scroll"); camTo(W(9, "app") - 0.25, R(16, 590, 358, 190));
    hl(W(9, "app"), "w-plans2", "note", 2.0);
    layer(W(9, "then") + 0.05, 98.2, browser("w-today"), null, 0.2);
    camTo(W(9, "then") + 0.1, R(16, 20, 358, 560), 1.15);
    bubble(90.6, 94.8, "sunny", "Your plan works everywhere you sign in.");
    camFull(95.0);
  },
  draw(t) { this.drawWorld?.(t); },
});
