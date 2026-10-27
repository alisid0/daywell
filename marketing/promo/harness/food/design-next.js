// Harness-only preview of the next proposals (23 October 2026): reminders, Your week and a calmer Today. ?fix=next
// Builds on the approved design fixes 7–11 (design-fix.js). None of this is app code: sample content, light DOM work.
import "./design-fix.js";

const params = new URLSearchParams(location.search);
const icon = (d, size = 20) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const I = {
  bell: '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  timer: '<line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/>',
  alarm: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3 2 6"/><path d="m22 6-3-3"/>',
  sliders: '<path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>',
  chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  sparkles: '<path d="M9.94 14.06 4 20"/><path d="m18 6-5.94 5.94"/><path d="M12 3v3"/><path d="M18.36 5.64 16.24 7.76"/><path d="M21 12h-3"/><path d="M3 12h3"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
};
const portrait = (id, size) => `<img src="/companions/illustrated-v4/${id}/portrait.webp" width="${size}" height="${size}" alt="" style="width:${size}px;height:${size}px;flex:none">`;

const style = document.createElement("style");
style.textContent = `
/* A calmer Today: the small links fold into "More". */
.stillwater-shell [data-view="today"] :is(.host-suggestions,.host-library-link,.host-settings-toggle,.host-help,.privacy-details),.stillwater-shell .today-extras{display:none!important}
.dw-today-extra{width:min(100%,520px);margin:0 auto 16px;display:grid;gap:12px}
.dw-card{background:var(--dw-surface,#fff8fb);border:1px solid var(--dw-line,#ebd3e1);border-radius:22px;padding:14px 16px;color:var(--dw-ink,#522d46)}
.dw-card header{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px}
.dw-card header strong{font-size:calc(16px*var(--rc-scale,1))}
.dw-card header span{font-size:calc(14px*var(--rc-scale,1));color:var(--dw-accent,#803c65);font-weight:700}
.dw-next{list-style:none;margin:0;padding:0;display:grid}
.dw-next li{display:grid;grid-template-columns:4.6em 1fr auto;gap:10px;align-items:center;padding:9px 0;border-top:1px solid color-mix(in srgb,var(--dw-line,#ebd3e1) 70%,transparent)}
.dw-next li:first-child{border-top:0}
.dw-next .t{font-weight:700;font-variant-numeric:tabular-nums;font-size:calc(15px*var(--rc-scale,1))}
.dw-next b{display:block;font-size:calc(16px*var(--rc-scale,1))}
.dw-next small{display:block;color:var(--dw-muted,#7d536e);font-size:calc(14px*var(--rc-scale,1))}
.dw-next .bell{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--dw-accent,#803c65) 10%,transparent);color:var(--dw-accent,#803c65)}
.dw-week-card{display:flex;align-items:center;gap:12px;width:100%;text-align:left;font:inherit;cursor:pointer;background:color-mix(in srgb,var(--dw-accent,#803c65) 9%,var(--dw-surface,#fff8fb));border:1px solid var(--dw-line,#ebd3e1);border-radius:22px;padding:12px 14px;color:var(--dw-ink,#522d46)}
.dw-week-card span{flex:1}
.dw-week-card b{display:block;font-size:calc(17px*var(--rc-scale,1))}
.dw-week-card small{display:block;color:var(--dw-muted,#7d536e);font-size:calc(14px*var(--rc-scale,1))}
.dw-quiet{display:flex;justify-content:center;gap:10px;flex-wrap:wrap}
.dw-quiet button{font:inherit;font-size:calc(15px*var(--rc-scale,1));min-height:44px;padding:0 18px;border-radius:999px;border:1px solid var(--dw-line,#ebd3e1);background:var(--dw-surface,#fff8fb);color:var(--dw-ink,#522d46);cursor:pointer}
/* Sheets built from the app's own kitchen-sheet styles. */
.dw-overlay{position:fixed;inset:0;background:rgba(40,16,32,.42);z-index:60}
html [data-slot="dialog-content"].kitchen-sheet.dw-sheet,html [data-slot="dialog-content"].kitchen-steps.dw-steps{position:fixed;z-index:61;--well-surface:var(--dw-surface,#fff7fb);--well-ink:var(--dw-ink,#522d46);--well-accent:var(--dw-accent,#803c65);--well-muted:var(--dw-muted,#7d536e);--well-line:var(--dw-line,#d8b7cc)}
.dw-sheet::before{content:"";display:block;flex:none;width:42px;height:5px;border-radius:3px;background:var(--dw-line,#d8b7cc);margin:0 auto 14px}
.dw-sheet-head{display:flex;align-items:flex-start;gap:12px;margin-bottom:8px}
.dw-sheet-head div{flex:1}
.dw-sheet-head h2{margin:0;font-size:calc(24px*var(--rc-scale,1));font-weight:800}
.dw-sheet-head p{margin:4px 0 0;color:var(--well-muted);font-size:calc(15px*var(--rc-scale,1))}
.dw-rows{list-style:none;margin:6px 0 0;padding:0;display:grid}
.dw-rows li{display:flex;align-items:center;gap:14px;padding:13px 2px;border-top:1px solid color-mix(in srgb,var(--well-line) 60%,transparent)}
.dw-rows li:first-child{border-top:0}
.dw-rows .ic{width:40px;height:40px;border-radius:14px;display:grid;place-items:center;background:color-mix(in srgb,var(--well-accent) 9%,var(--well-surface));color:var(--well-accent);flex:none}
.dw-rows span.txt{flex:1}
.dw-rows b{display:block;font-size:calc(16.5px*var(--rc-scale,1))}
.dw-rows small{display:block;color:var(--well-muted);font-size:calc(14px*var(--rc-scale,1))}
.dw-switch{width:50px;height:30px;border-radius:999px;background:var(--well-accent,var(--dw-accent,#803c65));position:relative;flex:none!important}
.dw-switch::after{content:"";position:absolute;top:3px;left:23px;width:24px;height:24px;border-radius:50%;background:#fff}
.dw-switch.off{background:color-mix(in srgb,var(--well-line) 80%,var(--well-surface))}
.dw-switch.off::after{left:3px}
.dw-note{margin:12px 0 0;color:var(--well-muted);font-size:calc(14px*var(--rc-scale,1))}
.dw-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.dw-chips span{padding:9px 13px;border-radius:999px;border:1px solid var(--dw-line,#d8b7cc);font-size:calc(14.5px*var(--rc-scale,1));background:var(--dw-surface,#fff)}
.dw-chips span.on{background:var(--dw-accent,#803c65);border-color:var(--dw-accent,#803c65);color:var(--dw-on-accent,#fff7fb);font-weight:700}
.dw-field{margin:6px 0 16px}
.dw-field>b{display:block;font-size:calc(14px*var(--rc-scale,1));margin-bottom:2px}
.dw-switch-row{display:flex;align-items:center;gap:12px;margin:4px 0 16px}
.dw-switch-row>span:first-child{flex:1}
.dw-switch-row small{display:block;color:var(--dw-muted,#7d536e);font-size:calc(13.5px*var(--rc-scale,1))}
/* Your week: a full-screen sheet like the receipt and add-food steps. */
.dw-week{display:flex;flex-direction:column;height:100%}
.dw-week-top{display:flex;align-items:center;gap:12px;padding:14px 16px 6px}
.dw-week-top span{flex:1;text-align:center;font-weight:700;color:var(--well-muted)}
.dw-week-body{flex:1;overflow-y:auto;padding:4px 16px 18px;display:grid;gap:14px;align-content:start}
.dw-week-body .kitchen-step-title{margin-top:4px}
.dw-week-intro{display:flex;gap:12px;align-items:flex-end}
.dw-week-intro p{margin:0;padding:12px 14px;border-radius:18px 18px 18px 4px;background:var(--well-surface);border:1px solid color-mix(in srgb,var(--well-line) 70%,var(--well-surface));font-size:calc(16px*var(--rc-scale,1))}
.dw-area h3{margin:0;display:flex;align-items:center;gap:10px;font-size:calc(18px*var(--rc-scale,1))}
.dw-area ul{margin:0;padding:0;list-style:none;display:grid;gap:6px}
.dw-area li{display:flex;gap:8px;font-size:calc(15.5px*var(--rc-scale,1))}
.dw-area li::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--well-accent);margin-top:.6em;flex:none}
.dw-why{background:color-mix(in srgb,#2a7d6e 9%,var(--well-surface));border-color:color-mix(in srgb,#2a7d6e 30%,var(--well-surface))}
.dw-why small{display:block;color:var(--well-muted);margin-top:6px;font-size:calc(13px*var(--rc-scale,1))}
.dw-week-foot{padding:12px 16px calc(14px + env(safe-area-inset-bottom));display:grid;gap:10px;background:var(--dw-canvas,#fae7ef);border-top:1px solid color-mix(in srgb,var(--well-line) 60%,transparent)}
.dw-ai{display:flex;align-items:center;gap:10px;font:inherit;cursor:pointer;background:none;border:1px dashed var(--well-line);border-radius:18px;padding:12px 14px;color:var(--well-ink);text-align:left}
.dw-ai>span:not(.dw-tag){flex:1}
.dw-tag{flex:none}
.dw-ai small{display:block;color:var(--well-muted);font-size:calc(13.5px*var(--rc-scale,1))}
.dw-tag{font-size:12px;font-weight:700;padding:3px 7px;border-radius:99px;background:#f1d48a;color:#4a3300}
`;
document.head.appendChild(style);

function closeAll() { document.querySelectorAll(".dw-overlay,.dw-sheet,.dw-steps").forEach(el => el.remove()); }
function sheet(html, steps = false) {
  closeAll();
  const overlay = document.createElement("div"); overlay.className = "dw-overlay"; overlay.onclick = closeAll;
  const box = document.createElement("div");
  box.setAttribute("data-slot", "dialog-content"); box.setAttribute("role", "dialog");
  box.className = steps ? "kitchen-steps dw-steps" : "kitchen-sheet dw-sheet";
  box.innerHTML = html;
  box.querySelectorAll("[data-close]").forEach(b => b.onclick = closeAll);
  document.body.append(overlay, box);
  return box;
}
const close = `<button type="button" class="kitchen-round" data-close aria-label="Close">${icon(I.x)}</button>`;

function moreSheet() {
  const row = (ic, title, sub) => `<li><span class="ic">${icon(ic)}</span><span class="txt"><b>${title}</b><small>${sub}</small></span>${icon(I.right, 18)}</li>`;
  sheet(`<div class="dw-sheet-head"><div><h2>More</h2><p>Everything else, one tap away.</p></div>${close}</div>
    <ul class="dw-rows">${row(I.timer, "Focus &amp; timers", "Focus, timer, stopwatch and world clock")}${row(I.alarm, "Alarms", "Wake-up and reminders on this phone")}${row(I.sliders, "Voice &amp; company", "How Daywell sounds and what it can see")}${row(I.chat, "Things you can say", "Everyday phrases to try")}${row(I.shield, "Privacy &amp; details", "What happens to your words and photos")}</ul>`);
}
function remindersSheet() {
  const row = (title, sub, on = true) => `<li><span class="txt"><b>${title}</b><small>${sub}</small></span><span class="dw-switch${on ? "" : " off"}" role="img" aria-label="${on ? "On" : "Off"}"></span></li>`;
  sheet(`<div class="dw-sheet-head"><div><h2>Reminders</h2><p>Gentle nudges on your phone. Never about something you missed.</p></div>${close}</div>
    <ul class="dw-rows">${row("Plans you make", "10 minutes before, unless you choose otherwise")}${row("Wind-down", "At 10:30 pm, with Luma")}${row("Tonight's meal", "At 5:30 pm, when you've planned one")}${row("Your week", "Sundays at 7 pm")}${row("Quiet hours", "9:30 pm to 7:30 am. Wind-down still comes through.")}</ul>
    <p class="dw-note">At most three a day. Turning one on asks your phone for permission once.</p>
    <button type="button" class="kitchen-primary">${icon(I.bell)}Allow notifications</button>`);
}
function weekSheet() {
  const area = (id, title, items) => `<section class="mv-card dw-area"><h3>${portrait(id, 40)}${title}</h3><ul>${items.map(i => `<li>${i}</li>`).join("")}</ul></section>`;
  sheet(`<div class="dw-week"><div class="dw-week-top">${close}<span>17–23 October</span><span style="width:44px;flex:none"></span></div>
    <div class="dw-week-body">
      <h2 class="kitchen-step-title">Your week</h2>
      <div class="dw-week-intro">${portrait("luma", 54)}<p>A steady week. You moved on 4 days, cooked at home 5 times, and rested when you needed to.</p></div>
      ${area("bounce", "Move", ["Moved on 4 days, 55 minutes in all", "2 strength sessions", "New best: 12 push-ups in a set (from 8)"])}
      ${area("nori", "Eat", ["12 meals noted, 5 cooked at home", "3 of your 4 planned meals made", "Spinach and milk used before their dates"])}
      ${area("luma", "Sleep", ["5 nights noted", "Usually asleep around 11:10 pm", "Similar bedtimes on 4 nights"])}
      ${area("luma", "Relax", ["3 quiet moments", "1 guided unwind: “Home, at last”"])}
      <p class="kitchen-step-note" style="margin:0">Days without a record count as rest.</p>
      <section class="mv-card dw-why"><strong>Why it helps</strong><span>People who keep a record of their progress reach their goals more often.</span><small>Harkin et al., Psychological Bulletin, 2016 · Source</small></section>
      <button type="button" class="dw-ai">${icon(I.sparkles)}<span><b>A few words about your week</b><small>Written by the assistant from these numbers. Optional.</small></span><span class="dw-tag">Plus</span></button>
    </div>
    <div class="dw-week-foot"><button type="button" class="kitchen-primary" style="margin:0">Plan next week</button><button type="button" class="kitchen-secondary">Set reminders</button></div></div>`, true);
}

function touchUp() {
  const view = document.querySelector("main.workspace")?.getAttribute("data-view");
  // Today: what's coming up, the week card on Sundays, and one quiet row instead of seven small links.
  const host = document.querySelector("details.calendar-host-always");
  if (view === "today" && host && !document.querySelector(".dw-today-extra")) {
    const box = document.createElement("div");
    box.className = "dw-today-extra";
    const item = (t, what, sub) => `<li><span class="t">${t}</span><span><b>${what}</b><small>${sub}</small></span><span class="bell" aria-label="Reminder on">${icon(I.bell, 17)}</span></li>`;
    box.innerHTML = `${params.has("week") ? `<button type="button" class="dw-week-card">${portrait("luma", 46)}<span><b>Your week is ready</b><small>17–23 October · a gentle look back</small></span>${icon(I.right)}</button>` : ""}
      <section class="dw-card" aria-label="Coming up today"><header><strong>Coming up today</strong><span>Calendar ›</span></header>
      <ul class="dw-next">${item("6:30 pm", "Walk to the park", "Move · 25 minutes")}${item("7:30 pm", "Tomato rice", "Dinner · you have everything")}${item("10:30 pm", "Wind down", "Sleep · with Luma")}</ul></section>
      <nav class="dw-quiet" aria-label="More ways in"><button type="button">Just rest</button><button type="button">Just listen</button><button type="button" class="dw-more">More</button></nav>`;
    host.after(box);
    box.querySelector(".dw-more").onclick = moreSheet;
    box.querySelector(".dw-week-card")?.addEventListener("click", weekSheet);
  }
  // Settings: a Reminders row.
  const drawer = document.querySelector(".stillwater-drawer-body");
  if (drawer && !drawer.querySelector(".dw-reminders-link")) {
    const prefs = [...drawer.querySelectorAll(".stillwater-drawer-link")].find(b => /Name, tools/.test(b.textContent));
    if (prefs) {
      const b = prefs.cloneNode(false);
      b.classList.add("dw-reminders-link");
      b.innerHTML = `${icon(I.bell, 19)}Reminders`;
      b.onclick = remindersSheet;
      prefs.after(b);
    }
  }
  for (const dialog of document.querySelectorAll('[role="dialog"]:not(.dw-sheet):not(.dw-steps)')) {
    const title = dialog.querySelector("h2, [data-slot='dialog-title']")?.textContent || "";
    // A plan: when to be reminded.
    if (/space for a plan/.test(title) && !dialog.querySelector(".dw-remind")) {
      const save = [...dialog.querySelectorAll("button")].find(b => /Save entry/.test(b.textContent));
      for (const p of dialog.querySelectorAll("p")) if (/Calendar plans don.t send reminders yet./.test(p.textContent)) p.textContent = p.textContent.replace(/s*Calendar plans don.t send reminders yet./, "");
      if (save) { const f = document.createElement("div"); f.className = "dw-field dw-remind"; f.innerHTML = `<b>Remind me</b><div class="dw-chips"><span>No</span><span>At the time</span><span class="on">10 min before</span><span>30 min before</span></div>`; save.before(f); }
    }
    // Your evening: a wind-down nudge.
    if (/Your evening/.test(title) && !dialog.querySelector(".dw-remind")) {
      const save = [...dialog.querySelectorAll("button")].find(b => /Save times/.test(b.textContent));
      if (save) { const f = document.createElement("div"); f.className = "dw-switch-row dw-remind"; f.innerHTML = `<span><b>Remind me to wind down</b><small>A gentle nudge at your wind-down time, on the phone app.</small></span><span class="dw-switch" style="--well-accent:var(--dw-accent,#803c65);--well-line:var(--dw-line,#d8b7cc);--well-surface:var(--dw-surface,#fff)"></span>`; save.before(f); }
    }
  }
  if (params.get("open") === "week" && !document.querySelector(".dw-steps") && document.querySelector(".dw-week-card")) { params.delete("open"); weekSheet(); }
}
new MutationObserver(touchUp).observe(document.documentElement, { childList: true, subtree: true });
setInterval(touchUp, 500);
window.__dw = { moreSheet, remindersSheet, weekSheet };
