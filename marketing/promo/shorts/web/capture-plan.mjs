// The real Daywell screens for "Daywell in your phone's browser". The browser, share sheet, menu and home screens
// are drawn as simple generic illustrations in timeline.js (not copies of Apple's or Google's UI); everything inside
// them is the real app. Sign-in and the plan screen come from the main harness (5196, with the plans and sign-in
// pages); the approved Oct 2026 design comes from the design harness (5194).
const main = "http://localhost:5196/", design = "http://localhost:5194/";
const laptop = { width: 1280, height: 800, scale: 1, mobile: false };
export const plan = [
  // Sign in with a six-digit code (the harness's test code is 246810).
  { base: main, query: "page=signin&promo=1&still", clock: "2026-10-14T08:20:00", shots: [
    { name: "w-signin", steps: [["wait", 300], ["boxAs", "css=input[type=email], input[placeholder^='name@']", "email"], ["boxAs", "Send my code", "send"]] },
    { name: "w-typed", steps: [["typeShots", "css=input[type=email], input[placeholder^='name@']", "sam@example.com", 2, "w-email"], ["wait", 200], ["boxAs", "Send my code", "send"]] },
    { name: "w-code", steps: [["click", "Send my code", "send"], ["wait", 3000], ["helpers"], ["print", "[...document.querySelectorAll('h1,h2,label,button,input')].map(e => e.tagName + ':' + (e.innerText || e.placeholder || e.getAttribute('aria-label') || e.type).trim()).join(' | ')"], ["boxMaybe", "css=input[autocomplete=one-time-code], input[inputmode=numeric]", "code"]] },
    // The sixth digit signs in by itself, and the page reloads as signed in.
    { name: "w-code-typed", steps: [["helpers"], ["typeShots", "css=input[autocomplete=one-time-code], input[inputmode=numeric]", "246810", 1, "w-code-typing"], ["wait", 2800], ["helpers"], ["print", "[...document.querySelectorAll('h1,h2,p,button,a')].slice(0, 10).map(e => e.innerText.trim()).join(' | ')"]] },
  ] },
  // The whole code in the box, the moment before it signs in: the value is set without an input event, so the page
  // shows all six digits and stays put. Its crop (_w-code-six-0.png) replaces w-code-typing-06.png, which caught the
  // page mid-reload.
  { base: main, query: "page=signin&promo=1&still", clock: "2026-10-14T08:20:00", shots: [
    { name: "w-code-full", steps: [["type", "css=input[type=email], input[placeholder^='name@']", "sam@example.com"], ["click", "Send my code", "send"], ["wait", 3000], ["helpers"],
      ["eval", "(() => { const el = document.querySelector('input[autocomplete=one-time-code], input[inputmode=numeric]'); el.focus(); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, '246810'); return true; })()"],
      ["tickShots", "css=input[autocomplete=one-time-code], input[inputmode=numeric]", 1, "_w-code-six", 6]] },
  ] },
  // The plan screen: choose a plan in the Daywell app for iPhone or Android.
  { base: main, query: "page=plans&promo=1&still", clock: "2026-10-14T08:40:00", shots: [
    { name: "w-plans", steps: [["wait", 300], ["boxMaybe", "=Daywell Plus", "plus"]] },
    { name: "w-plans2", steps: [["scrollY", "You can subscribe in the Daywell app", 520], ["wait", 300], ["boxAs", "You can subscribe in the Daywell app", "note"]] },
  ] },
  // Signed in: Today on the phone, and the same account on a laptop.
  { base: design, query: "view=today&promo=1&still", clock: "2026-10-14T08:30:00", shots: [
    { name: "w-today", steps: [["wait", 400]] },
  ] },
  { base: design, viewport: laptop, query: "view=today&promo=1&still", clock: "2026-10-14T08:30:00", shots: [
    { name: "w-laptop", steps: [["wait", 600]] },
  ] },
];
