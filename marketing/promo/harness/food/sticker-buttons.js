// Harness-only preview of the owner's button recipe (23 October 2026): ?fix=sticker. Nothing here is app code.
// Recipe: main forest, second peach, round icons mint (satin), chips forest when chosen and peach otherwise (puffy).
// All of them: solid colour, a dark outline, a hard offset shadow, 16 px corners, heavy text, and a press that sinks
// the button into its shadow (chips also brighten and settle back gently).
const main = `:is(.well-button, .kitchen-primary, .host-primary, .calendar-primary, .sign-in-primary, .is-primary, .mv-btn:not(.is-ghost), .ai-report-send, .welcome-primary, [data-slot="button"][data-variant="default"])`;
const second = `:is(.mv-btn.is-ghost, .kitchen-secondary, .kitchen-soon > button, .mv-round:not(:has(> svg:only-child)), .ai-report-cancel, .welcome-back, .receipt-retake, .receipt-hand, .week-fill, [data-slot="button"]:is([data-variant="outline"], [data-variant="secondary"]))`;
const icons = `:is(.stillwater-header-button, .kitchen-round, .mv-round:has(> svg:only-child), .kitchen-toast-close, [data-slot="dialog-close"], [data-slot="button"][data-size^="icon"])`;
const chips = `:is(.mv-chip, .mv-seg > button, .calendar-areas > button, .calendar-view-tabs > button, .capture-choices > button, .preset-row > button, .assistant-chip, .week-day)`;
const style = document.createElement("style");
style.textContent = `
:root { --sk-ink: #2b1424; --sk-forest: #2f7a55; --sk-peach: #ffc7a6; --sk-peach-ink: #3a1424; --sk-mint: #a9dfd4; --sk-mint-ink: #0f3238 }
${main}, ${second}, ${icons}, ${chips} { border: 2.5px solid var(--sk-ink) !important; font-weight: 800 !important; text-shadow: none !important; -webkit-tap-highlight-color: transparent;
  transition: transform 120ms ease-out, box-shadow 120ms ease-out, filter 160ms ease !important }
${main} { background: var(--sk-forest) !important; color: #fff !important; border-radius: 16px !important; box-shadow: 4px 4px 0 var(--sk-ink) !important; min-height: 50px }
${second} { background: var(--sk-peach) !important; color: var(--sk-peach-ink) !important; border-radius: 16px !important; box-shadow: 4px 4px 0 var(--sk-ink) !important; min-height: 46px }
${icons} { background: linear-gradient(rgb(255 255 255 / .24), rgb(255 255 255 / 0) 55%), var(--sk-mint) !important; color: var(--sk-mint-ink) !important; border-radius: 14px !important;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / .45), 3px 3px 0 var(--sk-ink) !important; min-width: 44px !important; min-height: 44px !important; opacity: 1 !important; display: inline-grid !important; place-items: center }
[data-slot="dialog-close"] { top: 12px !important; right: 12px !important; width: 44px; height: 44px }
${chips} { background: var(--sk-peach) !important; color: var(--sk-peach-ink) !important; border-radius: 14px !important; min-height: 44px;
  box-shadow: inset 4px 4px 10px rgb(255 255 255 / .5), inset -5px -6px 12px rgb(58 20 36 / .14), 3px 3px 0 var(--sk-ink) !important;
  transition: transform 320ms cubic-bezier(.34, 1.35, .64, 1), box-shadow 320ms cubic-bezier(.34, 1.35, .64, 1), filter 160ms ease !important }
${chips}:is([aria-pressed="true"], [aria-selected="true"], [data-state="active"]) { background: var(--sk-forest) !important; color: #fff !important;
  box-shadow: inset 5px 5px 12px rgb(255 255 255 / .3), inset -6px -7px 14px rgb(0 0 0 / .22), 3px 3px 0 var(--sk-ink) !important }
.mv-seg, .calendar-view-tabs, .calendar-areas, .mv-chips, .capture-choices, .preset-row { gap: 8px !important; background: none !important; box-shadow: none !important; padding: 0 3px 3px 0 !important }
${main}:active, ${second}:active { transform: translate(4px, 4px) !important; box-shadow: 0 0 0 var(--sk-ink) !important; transition-duration: 60ms !important }
${icons}:active { transform: translate(3px, 3px) !important; box-shadow: inset 0 1px 0 rgb(255 255 255 / .45), 0 0 0 var(--sk-ink) !important; transition-duration: 60ms !important }
${chips}:active { transform: translate(3px, 3px) !important; filter: brightness(1.1) saturate(1.1) !important; box-shadow: 0 0 0 var(--sk-ink) !important; transition-duration: 60ms !important }
@media (prefers-reduced-motion: reduce) { ${main}, ${second}, ${icons}, ${chips} { transition-duration: 0s !important } }
`;
document.head.appendChild(style);
