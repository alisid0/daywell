// The real Daywell screens for "Relax, with Luma", in chapter order, from the approved Oct 2026 design. Each group
// loads the harness once (?promo=1, Sam's sample week) and its shots follow on from each other.
// Steps: click/type/scroll/scrollY/select/box/boxAs/boxMaybe/tag/tickShots/typeShots/file/wait/eval (tools/capture.mjs).
const voice = name => `css=.meditation-voices label:has(input[value=${name}])`;

export const plan = [
  // Title and chapters 1–2: the quiet corner, then a little guidance (Daywell).
  { query: "view=relax&promo=1&still", clock: "2026-10-14T19:00:00", shots: [
    { name: "r-home", steps: [["wait", 300]] },
    { name: "r1-quiet", steps: [["scrollTo", 150], ["wait", 300], ["boxAs", "=A little guidance", "guide"]] },
    { name: "r2-guide", steps: [["click", "=A little guidance", "guide"], ["wait", 900], ["scrollTo", 150], ["wait", 300], ["boxMaybe", "css=.rest-words", "words"], ["boxMaybe", "Next, when I’m ready", "next"]] },
    { name: "r2-next", steps: [["click", "Next, when I’m ready", "next"], ["wait", 700], ["scrollTo", 150], ["wait", 300], ["boxMaybe", "css=.rest-words", "words"]] },
    { name: "r3-sessions", steps: [["scrollY", "A softer landing", 140], ["wait", 300], ["boxAs", "Step out of the scroll", "scroll"]] },
  ] },
  // Chapter 3: a guided session in one of five voices (Plus).
  { query: "page=meditate&session=scroll-unwind&promo=1&still", clock: "2026-10-14T19:05:00", shots: [
    { name: "r3-voices", steps: [["scrollY", "css=.meditation-voices", 220], ["wait", 400], ["boxAs", voice("lily"), "lily"], ["boxAs", voice("george"), "george"], ["boxAs", voice("river"), "river"]] },
    { name: "r3-lily", steps: [["click", voice("lily"), "lily"], ["wait", 500], ["scrollY", "css=.meditation-voices", 220], ["wait", 300]] },
    { name: "r3-begin", steps: [["scrollY", "=Begin", 400], ["wait", 300], ["boxAs", "=Begin", "begin"]] },
    { name: "r3-playing", steps: [["click", "=Begin", "begin"], ["wait", 3000], ["scrollY", "css=input[type=range]", 440], ["wait", 300]] },
  ] },
  // Chapter 4: a few kind words, found by typing a moment (Plus).
  { query: "page=library&promo=1&still", clock: "2026-10-14T19:20:00", shots: [
    { name: "r4-library", steps: [["scrollY", "What would help right now?", 140], ["wait", 300], ["boxAs", "css=input[type=search], input[placeholder^='Find']", "search"]] },
    { name: "r4-typed", steps: [["typeShots", "css=input[type=search], input[placeholder^='Find']", "awkward", 1, "r4-typing"], ["wait", 400], ["boxAs", "After an awkward conversation", "item"]] },
    { name: "r4-moment", steps: [["click", "After an awkward conversation", "item"], ["wait", 1200], ["boxMaybe", "=Listen", "listen"], ["print", "[scrollY, document.querySelector('h2')?.innerText]"]] },
    { name: "r4-listen", steps: [["click", "=Listen", "listen"], ["wait", 2000]] },
  ] },
  // Chapter 5: sounds for rest, from forest at dawn to a temple drum (Plus).
  { query: "view=relax&promo=1&still", clock: "2026-10-14T20:30:00", shots: [
    { name: "r5-sounds", steps: [["scrollY", "Sounds for rest and sleep", 90], ["wait", 300], ["boxAs", "=Forest at dawn", "dawn"], ["boxAs", "=Temple drum", "drum"]] },
    { name: "r5-dawn", steps: [["click", "=Forest at dawn", "dawn"], ["wait", 400], ["scrollY", "Sounds for rest and sleep", 90], ["wait", 300], ["boxAs", "=Temple drum", "drum"]] },
    { name: "r5-drum", steps: [["click", "=Temple drum", "drum"], ["wait", 400], ["scrollY", "Sounds for rest and sleep", 90], ["wait", 300], ["boxAs", "css=.sleep-sounds-row .well-button", "play"]] },
    { name: "r5-playing", steps: [["click", "css=.sleep-sounds-row .well-button", "play"], ["wait", 2400], ["scrollY", "Sounds for rest and sleep", 90], ["wait", 300]] },
  ] },
  // Chapter 6: a private reflection, only if you want to (Daywell).
  { query: "view=relax&promo=1&still", clock: "2026-10-14T21:00:00", shots: [
    { name: "r6-remember", steps: [["scrollY", "Something you’d like to remember?", 420], ["wait", 300], ["boxAs", "Something you’d like to remember?", "summary"]] },
    { name: "r6-open", steps: [["click", "Something you’d like to remember?", "summary"], ["wait", 500], ["scrollY", "Something you’d like to remember?", 420], ["wait", 300], ["boxAs", "Write a private reflection", "write"]] },
    { name: "r6-editor", steps: [["click", "Write a private reflection", "write"], ["wait", 1200], ["boxAs", "css=[role=dialog] textarea", "field"], ["print", "[...document.querySelectorAll('[role=dialog] button')].map(b => b.innerText.trim())"]] },
    { name: "r6-typed", steps: [["typeShots", "css=[role=dialog] textarea", "The walk home helped today.", 3, "r6-typing"], ["wait", 300], ["boxMaybe", "css=[role=dialog] button[type=submit]", "save"]] },
    { name: "r6-saved", steps: [["click", "css=[role=dialog] button[type=submit]", "save"], ["wait", 1500]] },
  ] },
  // Chapter 7: from Home, Just rest is one tap away (Daywell).
  { query: "view=today&promo=1&still", clock: "2026-10-14T21:30:00", shots: [
    { name: "r7-home", steps: [["scroll", "=Just rest", "center"], ["wait", 400], ["boxAs", "=Just rest", "rest"]] },
    { name: "r7-rest", steps: [["click", "=Just rest", "rest"], ["wait", 1500], ["scrollTo", 0], ["wait", 300], ["boxMaybe", "Back to my day", "back"]] },
  ] },
];
