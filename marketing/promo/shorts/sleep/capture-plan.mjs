// The real Daywell screens for "Sleep, with Luma", in chapter order, from the approved Oct 2026 design. Each group
// loads the harness once (?promo=1, Sam's sample week) and its shots follow on from each other.
// Steps: click/type/scroll/scrollY/select/box/boxAs/boxMaybe/tag/tickShots/typeShots/file/wait/eval (tools/capture.mjs).

// Last night, logged in the morning: fell asleep 23:10, woke 07:05, feeling rested.
const morningLog = "(() => { const t = [...document.querySelectorAll('[role=dialog] input[type=time]')]; __type(t[0], '23:10'); __type(t[1], '07:05'); const s = document.querySelector('[role=dialog] select'); if (s) { Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(s, 'Rested'); s.dispatchEvent(new Event('change', { bubbles: true })); } return true; })()";
const times = "css=[role=dialog] input[type=time]";

export const plan = [
  // Title and chapter 1: your evening rhythm, wind down and wake up, changed any time (Daywell).
  { query: "view=sleep&promo=1&still", clock: "2026-10-14T20:30:00", shots: [
    { name: "s-home", steps: [["wait", 300]] },
    { name: "s1-rhythm", steps: [["scrollY", "A softer landing tonight.", 150], ["wait", 300], ["boxAs", "=Change times", "change"]] },
    { name: "s1-times", steps: [["click", "=Change times", "change"], ["wait", 900], ["boxAs", times, "wind"], ["boxAs", "Save times", "save"]] },
    { name: "s1-typed", steps: [["eval", "(() => { const t = document.querySelectorAll('[role=dialog] input[type=time]'); __type(t[0], '22:00'); __type(t[1], '06:45'); return true; })()"], ["wait", 300], ["boxAs", "Save times", "save"]] },
    { name: "s1-saved", steps: [["click", "Save times", "save"], ["wait", 1200], ["scrollY", "A softer landing tonight.", 150], ["wait", 300]] },
  ] },
  // Chapters 2 and 3: wind down with Luma, then a sleep sound that fades out by itself.
  { query: "view=sleep&promo=1&still", clock: "2026-10-14T22:00:00", shots: [
    { name: "s2-door", steps: [["scrollY", "Make tonight a little softer.", 170], ["wait", 300], ["boxAs", "=Wind down with Luma", "wind"]] },
    { name: "s2-wind", steps: [["click", "=Wind down with Luma", "wind"], ["wait", 1800], ["scrollTo", 0], ["wait", 300]] },
    { name: "s3-sounds", steps: [["scrollY", "Sounds for rest and sleep", 90], ["wait", 300], ["boxAs", "=Forest at night", "forest"], ["boxAs", "=Waves on sand", "waves"]] },
    { name: "s3-waves", steps: [["click", "=Waves on sand", "waves"], ["wait", 400], ["scrollY", "Sounds for rest and sleep", 90], ["wait", 300], ["boxAs", "=Waves on sand", "waves"]] },
    { name: "s3-stop", steps: [["scrollY", "Stop after", 330], ["wait", 300], ["boxAs", "=30 min", "thirty"], ["boxAs", "css=.sleep-sounds-row .well-button", "play"]] },
    { name: "s3-playing", steps: [["click", "=30 min", "thirty"], ["wait", 300], ["click", "css=.sleep-sounds-row .well-button", "play"], ["wait", 2600], ["scrollY", "Stop after", 330], ["wait", 300], ["boxMaybe", "Stops at", "note"]] },
    { name: "s4-link", steps: [["scroll", "A five-minute bedtime meditation", "center"], ["wait", 400], ["boxAs", "A five-minute bedtime meditation", "link"]] },
  ] },
  // Chapter 4: a guided track, A softer goodnight (Plus).
  { query: "page=meditate&session=softer-goodnight&promo=1&still", clock: "2026-10-14T22:10:00", shots: [
    { name: "s4-goodnight", steps: [["scrollY", "A softer goodnight", 330], ["wait", 400], ["boxAs", "A softer goodnight", "title"]] },
    { name: "s4-begin", steps: [["scrollY", "=Begin", 380], ["wait", 300], ["boxAs", "=Begin", "begin"]] },
    { name: "s4-playing", steps: [["click", "=Begin", "begin"], ["wait", 3000], ["scrollY", "css=input[type=range]", 440], ["wait", 300]] },
  ] },
  // Chapters 6 and 7: the morning note, then the week's gentle journal (Daywell).
  { query: "view=sleep&promo=1&still", clock: "2026-10-15T07:20:00", shots: [
    { name: "s6-journal", steps: [["scrollY", "Your sleep journal", 100], ["wait", 300], ["boxAs", "=Add a night", "add"]] },
    { name: "s6-log", steps: [["click", "=Add a night", "add"], ["wait", 1300], ["eval", morningLog], ["wait", 500], ["boxAs", times, "asleep"], ["boxAs", "Save entry", "save"]] },
    { name: "s6-saved", steps: [["click", "Save entry", "save"], ["wait", 1500], ["scrollY", "Your sleep journal", 100], ["wait", 300], ["boxMaybe", "css=.sleep-night", "night"]] },
    { name: "s7-last", steps: [["scrollY", "Last night", 140], ["wait", 300], ["boxMaybe", "css=.sleep-last", "card"]] },
    { name: "s7-journal", steps: [["scrollY", "Your sleep journal", -260], ["wait", 300]] },
  ] },
];
