// Candidate styles for the bottom bar proposal. Injected only when ?bar=attached or ?bar=fade is in the URL.
export const compactToday = `
@media (max-width:767px) and (max-height:720px){
  .stillwater-shell .stillwater-header{padding-top:8px;padding-bottom:8px;min-height:60px}
  .stillwater-shell .calendar-strip{margin-bottom:8px}
  html[data-appearance-composition] .stillwater-shell .host-invitation{margin-bottom:6px}
  html[data-appearance-composition] .stillwater-shell .host-invitation p{margin-top:6px}
  html[data-appearance-company] .stillwater-shell .nook-company{margin-top:0;height:66px}
  html[data-appearance-company] .stillwater-shell .nook-company .dw-companion-image{width:27%}
  html[data-appearance-composition] .stillwater-shell .host-input-actions{padding-top:2px}
}`;
export const attached = `
@media (max-width:767px){
  html .stillwater-dock[data-tabs="5"]{left:0;right:0;bottom:0;border-radius:24px 24px 0 0;border-width:1px 0 0;padding:6px 8px calc(6px + env(safe-area-inset-bottom,0px));box-shadow:0 -10px 24px -16px color-mix(in srgb,var(--dw-ink,#522d46) 45%,transparent)}
}`;
export const fade = `
@media (max-width:767px){
  .stillwater-shell::after{content:"";position:fixed;left:0;right:0;bottom:0;height:118px;background:linear-gradient(to top,var(--dw-canvas,#fae7ef) 50%,color-mix(in srgb,var(--dw-canvas,#fae7ef) 0%,transparent));pointer-events:none;z-index:29}
}`;
export const gradient = `
@media (max-width:767px){
  /* A soft pink gradient rises behind the menu so it separates from white content above it. */
  html[data-appearance-palette] .stillwater-shell::after{content:"";position:fixed;left:0;right:0;bottom:0;height:140px;pointer-events:none;z-index:29;background:linear-gradient(to top,color-mix(in srgb,var(--dw-soft,#edd0e2) 92%,var(--dw-canvas,#fae7ef)) 0%,color-mix(in srgb,var(--dw-soft,#edd0e2) 70%,transparent) 45%,transparent 100%)}
  /* The bar itself is tinted, so its white tab buttons read as buttons. */
  html[data-appearance-palette] .stillwater-dock{background:color-mix(in srgb,var(--dw-soft) 72%,var(--dw-surface));border-color:color-mix(in srgb,var(--dw-line) 70%,var(--dw-accent));box-shadow:0 10px 26px -14px color-mix(in srgb,var(--dw-ink) 55%,transparent)}
  html[data-appearance-palette] .stillwater-dock button:not([aria-current="page"]){background:var(--dw-surface)}
  /* Room at the end of each page so the last lines sit above the gradient, not in it. */
  html[data-appearance-palette] .stillwater-shell .workspace{padding-bottom:calc(150px + env(safe-area-inset-bottom,0px))}
}`;
