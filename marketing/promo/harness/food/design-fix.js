// Harness-only preview of the proposed design fixes 7–11 (23 October 2026), before anything is built: ?fix=design.
// None of this is app code. Tool names change in the app's own list; everything else is CSS or a light DOM touch-up.
import { modules } from "@/app/daywell";

// 8. One name per tool, the same as the buttons people tap.
const names = { alarm: "Alarms", clock: "Timers", focus: "Focus", grocery: "Trolley", food: "Eat", move: "Move" };
for (const m of modules) if (names[m.id]) m.name = names[m.id];

const icon = d => `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const mic = icon('<path d="M12 19v3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><rect x="9" y="2" width="6" height="13" rx="3"/>');
const chevron = icon('<path d="m6 9 6 6 6-6"/>');
const music = icon('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>');
const sheet = 'html [data-slot="dialog-content"]:not(.kitchen-sheet):not(.kitchen-steps):not(.appearance-studio)';

const style = document.createElement("style");
style.textContent = `
/* 7. No stray "Talk or type to Daywell" line on the area pages; the header's talk button opens the host there. */
.stillwater-shell .calendar-host-disclosure>summary{display:none}
/* 10. Every pop-up opens as a bottom sheet, like the kitchen and Move sheets. */
${sheet}{top:auto!important;bottom:0!important;left:0!important;right:0!important;width:100%!important;max-width:560px!important;margin:0 auto!important;translate:none!important;transform:none!important;max-height:calc(100dvh - 24px)!important;overflow-y:auto;padding:10px 18px calc(22px + env(safe-area-inset-bottom))!important;border:0!important;border-radius:30px 30px 0 0!important;box-shadow:0 -12px 40px rgba(65,35,55,.25)!important}
${sheet}::before{content:"";display:block;flex:none;width:42px;height:5px;border-radius:3px;background:var(--dw-line,#d8b7cc);margin:0 auto 14px}
${sheet} [data-slot="dialog-header"]{text-align:left!important;align-items:flex-start!important}
/* 8. The preview shows Nori's still picture in the middle; once built, Nori's moving parts take over from Pip's. */
.nook-company .dw-companion-animated .companion-canvas{display:none!important}
.nook-company .dw-companion-animated img{opacity:1!important;visibility:visible!important}
/* 11. "Refresh saved details" only when a save needs it (hidden here, where nothing failed). */
.kitchen-refresh{display:none!important}
/* 11. Relax folds the sounds into one row; Sleep keeps the full list. */
.rest-space:not(.rest-bedtime) .sleep-sounds:not(.dw-open){display:none}
.dw-sounds-row{display:flex;align-items:center;gap:12px;width:100%;margin:22px 0 4px;padding:16px 18px;border-radius:22px;border:1px solid var(--dw-line,#e3cbd8);background:var(--dw-surface,#fff7fb);color:var(--dw-ink,#522d46);font:inherit;font-weight:650;text-align:left;cursor:pointer}
.dw-sounds-row small{display:block;font-weight:400;color:var(--dw-muted,#7d536e);font-size:calc(14px*var(--rc-scale,1));margin-top:2px}
.dw-sounds-row>span{flex:1}
.dw-focus-empty{margin:10px 0 0;color:var(--dw-muted,#7d536e)}
`;
document.head.appendChild(style);

function touchUp() {
  // 7. A talk button in the header on every page except Today, where the host already is.
  const view = document.querySelector("main.workspace")?.getAttribute("data-view");
  const bar = document.querySelector(".stillwater-header > div");
  let talk = document.querySelector(".dw-preview-talk");
  if (bar && !talk) {
    talk = document.createElement("button");
    talk.className = "stillwater-header-button dw-preview-talk";
    talk.setAttribute("aria-label", "Talk or type to Daywell");
    talk.innerHTML = mic;
    talk.onclick = () => { const d = document.querySelector(".calendar-host-disclosure"); if (d) { d.open = !d.open; window.scrollTo({ top: 0, behavior: "instant" }); } };
    bar.insertBefore(talk, bar.querySelector("#stillwater-style-toggle"));
  }
  if (talk) talk.hidden = view === "today";
  // 8. Today's three companions are the area companions: Luma, Nori and Bounce.
  for (const el of document.querySelectorAll(".nook-company img, .nook-company [style]")) {
    if (el.tagName === "IMG" && el.src.includes("/pip/")) el.src = el.src.replace("/pip/", "/nori/");
    const s = el.getAttribute("style");
    if (s && s.includes("/pip/")) el.setAttribute("style", s.replaceAll("/pip/", "/nori/"));
  }
  // 9 and 11. No calorie wording while calorie tracking is off.
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!/kcal estimated|calories not added/.test(n.nodeValue)) continue;
    n.nodeValue = n.nodeValue.replace(/ · \d+ kcal estimated/g, "").replace(/ · Estimate\b/g, "").replace(/ · calories not added/g, "").replace(/calories not added/g, "");
  }
  // 11. No giant 0 on Focus before there's anything to count.
  for (const card of document.querySelectorAll(".focus-summary")) {
    const big = card.querySelector("strong");
    if (!big || !/^0/.test(big.textContent.trim()) || card.querySelector(".dw-focus-empty")) continue;
    for (const el of card.querySelectorAll("strong, [data-slot='progress'], p")) el.style.display = "none";
    const p = document.createElement("p");
    p.className = "dw-focus-empty";
    p.textContent = "Your focus time and finished priorities will show here.";
    card.appendChild(p);
  }
  // 11. Relax keeps the sounds one tap away instead of showing the whole list again.
  const sounds = document.querySelector(".rest-space:not(.rest-bedtime) .sleep-sounds");
  if (sounds && !sounds.previousElementSibling?.classList.contains("dw-sounds-row")) {
    const row = document.createElement("button");
    row.className = "dw-sounds-row";
    row.innerHTML = `${music}<span>Sounds for rest and sleep<small>Nature sounds and gentle music</small></span>${chevron}`;
    row.onclick = () => sounds.classList.toggle("dw-open");
    sounds.parentNode.insertBefore(row, sounds);
  }
}
new MutationObserver(touchUp).observe(document.documentElement, { childList: true, subtree: true });
setInterval(touchUp, 500);
