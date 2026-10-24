// Harness-only preview (23 October 2026): ?fix=sticker3 adds the owner's picks from the style picker to the merged
// personality — stamp tags, section headings with a sticker icon, lists as bubbles, highlighter links and forest
// accents — and shows Sticker as the style studio's default button choice. &buttons=pillowy previews someone who
// picks another button style: the personality steps aside. Nothing here is app code.
const params = new URLSearchParams(location.search);
const off = params.get("buttons") && params.get("buttons") !== "sticker";

function personalitySheet() { return [...document.querySelectorAll("style")].find(s => (s.dataset.viteDevId || "").includes("personality.css")); }
if (off) {
  document.documentElement.classList.add("sk-off");
  const hide = () => { const s = personalitySheet(); if (s) s.disabled = true; };
  hide(); new MutationObserver(hide).observe(document.head, { childList: true });
}

const on = "html:not(.sk-off)";
const tags = `:is(.mv-pill, .sleep-feel, .kitchen-count)`;
const rows = `:is(.food-story-row, .task-row, .calendar-history-row)`;
const links = `:is(.host-type, .host-library-link, .rest-library-link, .well-text-button, .calendar-link, .plan-link, .mv-link, .food-capture-link, .calendar-today, .host-settings-toggle, main p a)`;
const style = document.createElement("style");
style.textContent = `
${on} { --sk-accent: #2f7a55; --dw-accent: #2f7a55 !important; --dw-on-accent: #ffffff !important; --dw-mark: #2f7a55 !important }
${on}:is([data-appearance-palette="dusk"], [data-appearance-palette="lake"], :is([data-daywell-style="moonlight"], [data-daywell-style="stillwater"]):not([data-appearance-palette])) { --sk-accent: #9fdcc4; --dw-accent: #9fdcc4 !important; --dw-on-accent: #0f3238 !important; --dw-mark: #9fdcc4 !important }
/* Tags: a stamp */
${on} ${tags} { background: transparent !important; border: 2px dashed var(--sk-accent) !important; color: var(--sk-accent) !important; border-radius: 8px !important; padding: 5px 9px !important;
  font: 700 calc(14px*var(--rc-scale,1))/1 ui-monospace, "SF Mono", Menlo, Consolas, monospace !important; text-transform: uppercase; letter-spacing: .05em; transform: rotate(-2deg); box-shadow: none !important }
/* Section headings: a peach sticker icon in front */
${on} .sk-sec { display: flex !important; align-items: center; gap: 10px }
${on} .sk-sec-ico { display: inline-grid; place-items: center; flex: none; width: 34px; height: 34px; border-radius: 11px; background: var(--sk-peach, #ffc7a6); color: var(--sk-on-peach, #3a1424); border: 2px solid var(--sk-ink, #2b1424); box-shadow: 2px 2px 0 var(--sk-shadow, #2b1424) }
${on} .sk-sec-ico svg { width: 18px; height: 18px }
.sk-off .sk-sec-ico { display: none }
/* Lists: bubbles */
${on} ${rows} { background: color-mix(in srgb, var(--sk-accent) 10%, var(--dw-surface, #fff7fb)) !important; border: 0 !important; border-radius: 26px !important; box-shadow: none !important; padding-inline: 16px !important; margin-bottom: 8px !important }
${on} ${rows} + ${rows} { border-top: 0 !important }
/* Links: a highlighter */
${on} ${links} { text-decoration: none !important; color: var(--dw-ink, #522d46) !important; font-weight: 800 !important;
  background-image: linear-gradient(transparent 58%, color-mix(in srgb, #a9dfd4 92%, transparent) 58% 94%, transparent 94%) !important; background-repeat: no-repeat !important; padding-inline: 2px }
${on}:is([data-appearance-palette="dusk"], [data-appearance-palette="lake"], :is([data-daywell-style="moonlight"], [data-daywell-style="stillwater"]):not([data-appearance-palette])) ${links} { background-image: linear-gradient(transparent 58%, rgb(169 223 212 / .4) 58% 94%, transparent 94%) !important }
/* The studio's new Sticker choice */
.studio-three.sk-four { grid-template-columns: repeat(2, minmax(0, 1fr)) !important }
.studio-button-sticker { background: #2f7a55 !important; color: #fff !important; border: 2.5px solid #2b1424 !important; border-radius: 12px !important; box-shadow: 3px 3px 0 #2b1424 !important; font-weight: 800 !important }
`;
document.head.appendChild(style);

const svg = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const icons = [
  [/quick move/i, svg('<path d="M4 16v-2.4C4 11.5 3 10.5 3 8c0-2.7 1.5-6 4.5-6C9.4 2 10 3.8 10 5.5c0 3.1-2 5.7-2 8.7V16a2 2 0 1 1-4 0Z"/><path d="M20 20v-2.4c0-2.1 1-3.1 1-5.6 0-2.7-1.5-6-4.5-6C14.6 6 14 7.8 14 9.5c0 3.1 2 5.7 2 8.7V20a2 2 0 1 0 4 0Z"/>')],
  [/meal story/i, svg('<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2Z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7Z"/>')],
  [/sleep journal/i, svg('<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>')],
  [/softer landing/i, svg('<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z"/><path d="M2 21c0-3 1.9-5.4 5.1-6"/>')],
  [/sounds/i, svg('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>')],
];
const sparkle = svg('<path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2Z"/>');
function touchUp() {
  if (!off) for (const h of document.querySelectorAll(".well-section-title h2, .section-title h2, .mv-quick > h2, .rest-unwind > h2, .sleep-sounds > h2")) {
    if (h.querySelector(".sk-sec-ico") || !h.textContent.trim()) continue;
    const icon = (icons.find(([re]) => re.test(h.textContent)) || [, sparkle])[1];
    h.classList.add("sk-sec");
    h.insertAdjacentHTML("afterbegin", `<span class="sk-sec-ico" aria-hidden="true">${icon}</span>`);
  }
  // The style studio: Sticker joins the button choices, first, as the default.
  const row = [...document.querySelectorAll(".studio-three")].find(r => /Pillowy/.test(r.textContent));
  if (row && !row.querySelector(".sk-choice")) {
    row.classList.add("sk-four");
    row.insertAdjacentHTML("afterbegin", `<button type="button" class="sk-choice" aria-pressed="${off ? "false" : "true"}"><span class="studio-button-sample studio-button-sticker">Hello</span>Sticker</button>`);
    if (!off) for (const b of row.querySelectorAll("button:not(.sk-choice)")) b.setAttribute("aria-pressed", "false");
    const label = [...document.querySelectorAll(".studio-preview-label")].find(l => /Pillowy/.test(l.textContent));
    if (label && !off) label.innerHTML = label.innerHTML.replace("Pillowy", "Sticker");
  }
}
new MutationObserver(touchUp).observe(document.documentElement, { childList: true, subtree: true });
setInterval(touchUp, 500);
