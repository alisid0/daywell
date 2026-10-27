// Harness-only preview (23 October 2026): ?fix=sticker2 carries the owner's sticker buttons into the rest of the app —
// cards and tiles, the tab bar, Eat's section tabs, the Talk to Daywell button, fields, tick boxes and switches.
// Nothing here is app code.
import "./sticker-buttons.js";

const cards = `:is(.mv-card, .mv-week, .calendar-strip, .plate-soon, .well-card, .food-stat, .kitchen-soon, .sleep-hero, .sleep-sounds, section.card, .rest-sounds > summary, .rest-unwind a, .mv-quick button, .food-slot)`;
const tappable = `:is(.mv-week, .calendar-strip, .rest-unwind a, .mv-quick button, .food-slot, .rest-sounds > summary)`;
const fields = `:is(main, [role="dialog"]) :is(input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]), select, textarea)`;
const puffy = "inset 4px 4px 10px rgb(255 255 255 / .28), inset -5px -6px 12px rgb(0 0 0 / .22)";
const style = document.createElement("style");
style.textContent = `
/* Cards and tiles: the same outline and hard shadow as the buttons, a little softer. */
${cards} { border: 2px solid var(--sk-ink) !important; box-shadow: 4px 4px 0 var(--sk-ink) !important; border-radius: 20px !important }
${tappable} { transition: transform 120ms ease-out, box-shadow 120ms ease-out !important }
${tappable}:active { transform: translate(3px, 3px) !important; box-shadow: 1px 1px 0 var(--sk-ink) !important; transition-duration: 60ms !important }
/* The tab bar and Eat's sections: a sticker strip, with the current one in forest. */
:is(.stillwater-dock, nav.kitchen-places) { background: #fff7fb !important; border: 2.5px solid var(--sk-ink) !important; box-shadow: 4px 4px 0 var(--sk-ink) !important; border-radius: 22px !important }
:is(.stillwater-dock, nav.kitchen-places) button { font-weight: 800 !important; color: var(--sk-peach-ink) !important }
:is(.stillwater-dock, nav.kitchen-places) button[aria-current="page"] { background: var(--sk-forest) !important; color: #fff !important; border: 2px solid var(--sk-ink) !important; border-radius: 16px !important; box-shadow: ${puffy} !important }
:is(.stillwater-dock, nav.kitchen-places) button:active { transform: translateY(2px) }
/* Talk to Daywell: a big forest key. */
.host-talk-symbol { background: var(--sk-forest) !important; color: #fff !important; border: 3px solid var(--sk-ink) !important; border-radius: 30px !important;
  box-shadow: ${puffy}, 6px 6px 0 var(--sk-ink) !important; transition: transform 120ms ease-out, box-shadow 120ms ease-out }
.host-talk .mic-glow { display: none !important }
.host-talk:active .host-talk-symbol { transform: translate(5px, 5px); box-shadow: ${puffy}, 1px 1px 0 var(--sk-ink) !important }
/* Fields: a clear dark outline, and a forest ring when typing. */
${fields}, [data-slot="select-trigger"] { border: 2px solid var(--sk-ink) !important; border-radius: 14px !important; background-color: #fff !important; box-shadow: none !important; color: #2b1424 !important }
${fields}:focus-visible, [data-slot="select-trigger"]:focus-visible { outline: 3px solid var(--sk-forest) !important; outline-offset: 2px }
/* Tick boxes and switches */
[data-slot="checkbox"] { border: 2px solid var(--sk-ink) !important; border-radius: 7px !important; background: #fff !important }
[data-slot="checkbox"][data-state="checked"] { background: var(--sk-forest) !important; color: #fff !important }
[data-slot="switch"] { border: 2px solid var(--sk-ink) !important }
[data-slot="switch"][data-state="checked"] { background: var(--sk-forest) !important }
/* Page titles a step heavier, to match the buttons. */
main h1 { font-weight: 800 !important }
@media (prefers-reduced-motion: reduce) { ${tappable}, .host-talk-symbol { transition-duration: 0s !important } }
`;
document.head.appendChild(style);
