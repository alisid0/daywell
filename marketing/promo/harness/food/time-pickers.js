// Harness-only preview (24 October 2026): ?fix=time puts the owner's picks from "Calendar and Time Pickers" on the real
// screens. Endless wheels for how long (the timer, a plan's length) and for clock times (alarms, plans, the sleep log,
// Your evening), and a week strip with the day's plans as bubbles instead of the month grid. The phone's own boxes stay
// in the form, hidden, so saving works as before. Nothing here is app code.
const ROW = 48;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const pad = n => String(n).padStart(2, "0");
const displayTime = t => { const [h, m] = t.split(":").map(Number); return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? "pm" : "am"}`; };
const fmtLen = m => m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ""}` : `${m} min`;
const buzz = ms => { try { if (navigator.userActivation?.hasBeenActive) navigator.vibrate?.(ms); } catch { /* not on this device */ } };
// React keeps the hidden boxes in its state, so set them the way typing would.
function setInput(input, value) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, String(value));
  input.dispatchEvent(new Event("input", { bubbles: true })); input.dispatchEvent(new Event("change", { bubbles: true }));
}

const style = document.createElement("style");
style.textContent = `
.tp-hidden { position: absolute !important; width: 1px !important; height: 1px !important; opacity: 0 !important; pointer-events: none !important }
.tp-time { display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; min-height: 52px; padding: 0 14px; border-radius: 14px;
  border: 2px solid var(--sk-line, #2b1424); background: var(--dw-surface, #fff7fb); color: var(--dw-ink, #522d46); box-shadow: 3px 3px 0 var(--sk-shadow, #2b1424);
  font: 800 calc(18px*var(--rc-scale,1))/1 var(--dw-display, "Bricolage Grotesque", sans-serif); font-variant-numeric: tabular-nums; cursor: pointer; transition: transform 120ms ease-out, box-shadow 120ms ease-out }
.tp-time::after { content: ""; width: 9px; height: 9px; border-right: 2.5px solid currentColor; border-bottom: 2.5px solid currentColor; transform: rotate(45deg) translateY(-3px); transition: transform 160ms ease }
.tp-time[aria-expanded="true"] { background: #2f7a55; color: #fff }
.tp-time[aria-expanded="true"]::after { transform: rotate(-135deg) translateY(-3px) }
.tp-time:active { transform: translate(3px, 3px); box-shadow: 0 0 0 var(--sk-shadow, #2b1424) }
.tp-panel { display: grid; justify-items: center; gap: 6px; margin: 12px 0 4px }
.tp-panel[hidden] { display: none }
.tp-panel-title { font: 700 calc(14px*var(--rc-scale,1))/1.2 var(--dw-font, "DM Sans", sans-serif); color: var(--dw-muted, #7d536e) }
.tp-wheels { position: relative; display: flex; gap: 6px; justify-content: center; padding: 6px; background: var(--dw-surface, #fffbfd); border: 2.5px solid var(--sk-line, #2b1424); border-radius: 20px; box-shadow: 4px 4px 0 var(--sk-shadow, #2b1424) }
.tp-wheels::before { content: ""; position: absolute; left: 8px; right: 8px; top: 102px; height: 48px; border-radius: 14px; background: color-mix(in srgb, #a9dfd4 70%, transparent); border: 2px solid var(--sk-line, #2b1424); pointer-events: none }
.tp-wheel-wrap { position: relative; padding-bottom: 22px }
.tp-wheel { position: relative; height: 240px; width: 68px; overflow-y: auto; overscroll-behavior: contain; scroll-snap-type: y mandatory; scrollbar-width: none; outline: none; border-radius: 12px;
  -webkit-mask-image: linear-gradient(transparent, #000 25%, #000 75%, transparent); mask-image: linear-gradient(transparent, #000 25%, #000 75%, transparent) }
.tp-wheel::-webkit-scrollbar { display: none }
.tp-wheel:focus-visible { box-shadow: 0 0 0 3px #2f6fd6 }
.tp-wheel ol { list-style: none; margin: 0; padding: 96px 0 }
.tp-wheel li { height: 48px; display: grid; place-items: center; scroll-snap-align: center; font: 800 26px/1 var(--dw-display, "Bricolage Grotesque", sans-serif); font-variant-numeric: tabular-nums; color: var(--dw-ink, #522d46); cursor: pointer }
.tp-wheel-label { position: absolute; bottom: 0; left: 0; right: 0; text-align: center; font: 500 calc(14px*var(--rc-scale,1))/1 var(--dw-font, "DM Sans", sans-serif); color: var(--dw-muted, #7d536e) }
.timer-settings .tp-panel { margin: 14px 0 10px }
/* The calendar: a week strip and the day's plans as bubbles. */
.tp-strip { display: flex; gap: 8px; overflow-x: auto; padding: 4px 4px 10px 2px; margin: 4px 0 6px; scroll-snap-type: x mandatory; scrollbar-width: none; overscroll-behavior-x: contain }
.tp-strip::-webkit-scrollbar { display: none }
.tp-pill { scroll-snap-align: center; flex: none; width: 54px; min-height: 80px; border-radius: 18px; background: var(--dw-surface, #fffbfd); border: 2px solid var(--sk-line, #2b1424); box-shadow: 3px 3px 0 var(--sk-shadow, #2b1424);
  display: grid; justify-items: center; align-content: center; gap: 5px; cursor: pointer; color: var(--dw-ink, #522d46); font-family: var(--dw-font, "DM Sans", sans-serif); padding: 0; transition: transform 120ms ease-out, box-shadow 120ms ease-out }
.tp-pill small { font: 700 calc(14px*var(--rc-scale,1))/1 var(--dw-font, "DM Sans", sans-serif); color: var(--dw-muted, #7d536e) }
.tp-pill b { font: 800 20px/1 var(--dw-display, "Bricolage Grotesque", sans-serif); font-variant-numeric: tabular-nums }
.tp-pill .tp-dots { display: flex; gap: 2px; min-height: 8px }
.tp-pill .tp-dots i { width: 7px; height: 7px; margin: 0 }
.tp-pill.is-today { background: #ffc7a6; color: #3a1424 }
.tp-pill[aria-pressed="true"] { background: #2f7a55; color: #fff }
.tp-pill[aria-pressed="true"] small { color: #e9f4f1 }
.tp-pill.is-other small, .tp-pill.is-other b { opacity: .55 }
.tp-pill:active { transform: translate(3px, 3px); box-shadow: 0 0 0 var(--sk-shadow, #2b1424) }
.tp-legend { display: flex; flex-wrap: wrap; gap: 6px 14px; margin: 0 0 12px; font: 500 calc(14px*var(--rc-scale,1))/1.3 var(--dw-font, "DM Sans", sans-serif); color: var(--dw-muted, #7d536e) }
.tp-legend span { display: inline-flex; align-items: center; gap: 6px }
html.tp-calendar .calendar-plan-layout .calendar-month { display: none !important }
html.tp-calendar .calendar-day-agenda .calendar-plan-rows article { background: color-mix(in srgb, #2f7a55 10%, var(--dw-surface, #fff7fb)) !important; border: 0 !important; border-radius: 24px !important; box-shadow: none !important; padding-inline: 14px !important; margin-bottom: 8px !important }
@media (prefers-reduced-motion: reduce) { .tp-time, .tp-pill, .tp-time::after { transition: none } }
`;
document.head.appendChild(style);
document.documentElement.classList.add("tp-calendar");

// An endless wheel (a plain one for am / pm): the numbers repeat above and below, and once it settles far from the
// middle it jumps to the same number there. Rows tilt away and fade like a drum.
function wheel(values, label, index, onChange, name, loop = true) {
  const n = values.length, copies = loop ? Math.ceil(600 / n) | 1 : 1, base = loop ? Math.floor(copies / 2) * n : 0;
  const value = i => values[((i % n) + n) % n];
  const wrap = document.createElement("div"); wrap.className = "tp-wheel-wrap";
  const w = document.createElement("div"); w.className = "tp-wheel"; w.tabIndex = 0; w.setAttribute("role", "spinbutton"); w.setAttribute("aria-label", name);
  w.innerHTML = `<ol aria-hidden="true">${Array.from({ length: n * copies }, (_, i) => `<li data-i="${i}">${label(value(i))}</li>`).join("")}</ol>`;
  wrap.append(w); wrap.insertAdjacentHTML("beforeend", `<span class="tp-wheel-label" aria-hidden="true">${name}</span>`);
  const items = w.querySelectorAll("li");
  let current = base + Math.max(0, index), centre = current, shown = [], timer, frame;
  const set = (i, smooth, quiet) => {
    current = loop ? i : Math.max(0, Math.min(n - 1, i));
    w.scrollTo({ top: current * ROW, behavior: smooth && !reduce ? "smooth" : "auto" });
    w.setAttribute("aria-valuetext", label(value(current)));
    if (!quiet) onChange(value(current));
  };
  const drum = () => {
    const c = w.scrollTop / ROW;
    for (const li of shown) { li.style.transform = ""; li.style.opacity = ""; }
    shown = [];
    for (let i = Math.floor(c) - 3; i <= Math.ceil(c) + 3; i++) {
      const li = items[i]; if (!li) continue;
      const d = i - c;
      li.style.transform = `perspective(320px) rotateX(${Math.max(-70, Math.min(70, -d * 24))}deg)`;
      li.style.opacity = String(Math.max(0.3, 1 - Math.abs(d) * 0.25));
      shown.push(li);
    }
    const now = Math.round(c);
    if (now !== centre) { centre = now; buzz(2); }
  };
  const recentre = () => {
    if (!loop) return;
    const same = base + (((current % n) + n) % n);
    if (Math.abs(current - same) >= 2 * n) { current = centre = same; w.scrollTop = same * ROW; }
  };
  w.addEventListener("scroll", () => {
    cancelAnimationFrame(frame); frame = requestAnimationFrame(drum);
    clearTimeout(timer); timer = setTimeout(() => { const i = Math.round(w.scrollTop / ROW); if (i !== current) set(i, false); recentre(); }, 120);
  });
  w.addEventListener("click", e => { const li = e.target.closest("li"); if (li) set(Number(li.dataset.i), true); });
  w.addEventListener("keydown", e => { if (e.key === "ArrowDown") { e.preventDefault(); set(current + 1, true); } if (e.key === "ArrowUp") { e.preventDefault(); set(current - 1, true); } });
  // Wheels made inside a closed panel have no layout yet, so they are put in place again when the panel opens.
  wrap.refresh = () => { centre = current; set(current, false, true); drum(); };
  wrap.show = v => { const k = values.indexOf(v); if (k >= 0 && value(current) !== v) { current = base + k; wrap.refresh(); } };
  requestAnimationFrame(wrap.refresh);
  return wrap;
}
const wheelsBox = parts => { const box = document.createElement("div"); box.className = "tp-wheels"; box.append(...parts); return box; };

// Clock time: hour, minutes in five-minute steps, and am / pm.
function clockWheels(input, onPick) {
  const [h24, m0] = (input.value || "07:00").split(":").map(Number);
  let hour = h24 % 12 || 12, minute = (Math.round(m0 / 5) * 5) % 60, pm = h24 >= 12;
  const pick = () => { const t = `${pad((hour % 12) + (pm ? 12 : 0))}:${pad(minute)}`; setInput(input, t); onPick(t); };
  const parts = [
    wheel(Array.from({ length: 12 }, (_, i) => i + 1), String, hour - 1, v => { hour = v; pick(); }, "hour"),
    wheel(Array.from({ length: 12 }, (_, i) => i * 5), pad, minute / 5, v => { minute = v; pick(); }, "minutes"),
    wheel(["am", "pm"], v => v, pm ? 1 : 0, v => { pm = v === "pm"; pick(); }, "am / pm", false),
  ];
  const box = wheelsBox(parts);
  box.refresh = () => parts.forEach(p => p.refresh());
  return box;
}
// How long: hours and minutes, both endless.
function lengthWheels(input, onPick, maxHours = 23) {
  const total = Math.max(0, Number(input.value) || 0);
  let hours = Math.min(maxHours, Math.floor(total / 60)), minutes = total % 60;
  const pick = () => { const m = hours * 60 + minutes; setInput(input, m); onPick(m); };
  const h = wheel(Array.from({ length: maxHours + 1 }, (_, i) => i), String, hours, v => { hours = v; pick(); }, "hours");
  const m = wheel(Array.from({ length: 60 }, (_, i) => i), pad, minutes, v => { minutes = v; pick(); }, "minutes");
  const box = wheelsBox([h, m]);
  box.refresh = () => { h.refresh(); m.refresh(); };
  box.show = value => { const v = Math.max(0, Number(value) || 0); hours = Math.min(maxHours, Math.floor(v / 60)); minutes = v % 60; h.show(hours); m.show(minutes); };
  return box;
}

// A form field becomes a button showing the time or length; tapping it opens the wheels under the row.
const enhanced = new Set();
function enhanceField(input, kind) {
  input.dataset.tp = kind; enhanced.add(input);
  input.classList.add("tp-hidden");
  const button = document.createElement("button"); button.type = "button"; button.className = "tp-time"; button.setAttribute("aria-expanded", "false");
  const name = input.closest("label")?.querySelector("span");
  if (kind === "length" && name) name.textContent = "How long";
  const label = (name?.textContent || input.getAttribute("aria-label") || "").trim();
  const text = () => kind === "clock" ? displayTime(input.value || "07:00") : fmtLen(Number(input.value) || 0);
  button.innerHTML = `<span>${text()}</span>`;
  const box = kind === "clock" ? clockWheels(input, () => { button.firstChild.textContent = text(); }) : lengthWheels(input, () => { button.firstChild.textContent = text(); });
  const panel = document.createElement("div"); panel.className = "tp-panel"; panel.hidden = true; panel.dataset.for = label;
  const pair = input.closest(".two-fields");
  if (pair) panel.innerHTML = `<span class="tp-panel-title">${label}</span>`;
  panel.append(box);
  input.insertAdjacentElement("afterend", button);
  const row = pair || input.closest("label") || input.parentElement;
  row.insertAdjacentElement("afterend", panel);
  input.tpCleanup = () => { button.remove(); panel.remove(); };
  button.addEventListener("click", () => {
    const open = button.getAttribute("aria-expanded") !== "true";
    const form = input.closest("form") || document;
    for (const other of form.querySelectorAll(".tp-time[aria-expanded='true']")) if (other !== button) other.click();
    button.setAttribute("aria-expanded", String(open)); panel.hidden = !open;
    if (open) requestAnimationFrame(box.refresh);
  });
  return button;
}

// The timer card: the wheels sit where the minutes box was, and the length chips turn them.
function enhanceTimer(card) {
  const input = card.querySelector("input[type=number]");
  if (!input || input.dataset.tp) return;
  input.dataset.tp = "timer";
  const field = input.closest("label") || input.parentElement;
  field.classList.add("tp-hidden");
  const box = lengthWheels(input, () => {});
  const panel = document.createElement("div"); panel.className = "tp-panel"; panel.append(box);
  (card.querySelector(".preset-times") || field).insertAdjacentElement("afterend", panel);
  card.tpSync = () => { if (document.activeElement?.closest(".tp-wheel")) return; box.show(input.value); };
}

// The calendar: a strip of days built from the month grid (still there, hidden), so tapping a day works as before.
function enhanceCalendar(layout) {
  const month = layout.querySelector(".calendar-month");
  if (!month) return;
  let strip = layout.querySelector(".tp-strip"), legend = layout.querySelector(".tp-legend");
  if (!strip) {
    strip = document.createElement("div"); strip.className = "tp-strip"; strip.setAttribute("role", "group"); strip.setAttribute("aria-label", "Days");
    legend = document.createElement("div"); legend.className = "tp-legend";
    month.insertAdjacentElement("beforebegin", strip); strip.insertAdjacentElement("afterend", legend);
    strip.addEventListener("click", e => { const pill = e.target.closest(".tp-pill"); if (pill) month.querySelector(`[data-calendar-date="${pill.dataset.date}"]`)?.click(); });
  }
  const days = [...month.querySelectorAll("[data-calendar-date]")];
  const key = days.map(d => d.dataset.calendarDate + d.getAttribute("aria-pressed") + d.querySelectorAll(".area-dot").length).join("|");
  if (strip.dataset.key === key) return;
  const first = !strip.dataset.key; strip.dataset.key = key;
  strip.innerHTML = days.map(d => {
    const date = new Date(`${d.dataset.calendarDate}T12:00:00`);
    const dots = [...d.querySelectorAll(".area-dot")].slice(0, 3).map(i => `<i class="${i.className}"></i>`).join("");
    return `<button type="button" class="tp-pill${d.getAttribute("aria-current") === "date" ? " is-today" : ""}${d.classList.contains("calendar-other-month") ? " is-other" : ""}" data-date="${d.dataset.calendarDate}" aria-pressed="${d.getAttribute("aria-pressed")}" aria-label="${d.getAttribute("aria-label")}"><small>${date.toLocaleDateString("en-GB", { weekday: "short" })}</small><b>${date.getDate()}</b><span class="tp-dots">${dots}</span></button>`;
  }).join("");
  legend.innerHTML = month.querySelector(".calendar-legend")?.innerHTML || "";
  const chosen = strip.querySelector('[aria-pressed="true"]') || strip.querySelector(".is-today");
  if (chosen) {
    const left = chosen.offsetLeft - strip.offsetLeft - (strip.clientWidth - chosen.offsetWidth) / 2;
    if (first || chosen.offsetLeft < strip.scrollLeft || chosen.offsetLeft + chosen.offsetWidth > strip.scrollLeft + strip.clientWidth) strip.scrollLeft = left;
  }
}

function touchUp() {
  for (const input of document.querySelectorAll("[role=dialog] input[type=time]:not([data-tp])")) {
    const button = enhanceField(input, "clock");
    // A time on its own (an alarm): the wheels start open.
    if (!input.closest(".two-fields")) button.click();
  }
  for (const input of document.querySelectorAll("[role=dialog] input[type=number]:not([data-tp])")) {
    const label = input.closest("label")?.textContent || "";
    if (/minutes/i.test(label)) enhanceField(input, "length");
  }
  // Boxes React removed (a sheet closing, "All day" ticked) take their button and wheels with them.
  for (const input of enhanced) if (!input.isConnected) { input.tpCleanup(); enhanced.delete(input); }
  for (const card of document.querySelectorAll(".timer-settings")) { enhanceTimer(card); card.tpSync?.(); }
  for (const layout of document.querySelectorAll(".calendar-plan-layout")) enhanceCalendar(layout);
  // A plan's length reads the way the wheels show it: "9:00 am · 1 h" rather than "60 min".
  for (const meta of document.querySelectorAll(".calendar-plan-meta")) {
    const text = meta.textContent, next = text.replace(/· (\d+) min$/, (_, m) => `· ${fmtLen(Number(m))}`);
    if (next !== text) meta.textContent = next;
  }
}
new MutationObserver(touchUp).observe(document.documentElement, { childList: true, subtree: true });
setInterval(touchUp, 400);
