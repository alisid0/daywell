// "Small things count": the real screens for each moment, from the test copy of the app on main 46eab3e (24 October
// 2026), at phone size with sample data and the story's own clock (Saturday 24 October). Wheel spins are captured
// frame by frame from the app's real wheels (snapping paused while capturing), so the film plays the app itself.
//   cd promo && HARNESS=http://localhost:5194/ node tools/capture.mjs --film=small-things [shot names]
const at = time => `2026-10-24T${time}:00`;
const q = extra => `still&nopatch&${extra}`;
const js = (code) => ["eval", `(() => { ${code}; return true; })()`];
const scrollTop = (sel, gap = 12) => js(`const el = document.querySelector(${JSON.stringify(sel)}); if (!el) throw Error('no ${sel}'); el.scrollIntoView({ block: 'start' }); window.scrollBy(0, -${gap})`);
// The time or length button under a label, in a sheet.
const fieldButton = label => `[...document.querySelectorAll('[role=dialog] .time-field')].find(f => f.querySelector('span').textContent.trim() === ${JSON.stringify(label)}).querySelector('.time-button')`;
const toggleField = label => js(`${fieldButton(label)}.click()`);
// Mark an element so its box can be recorded by name.
const mark = (sel, index, tag) => js(`const el = document.querySelectorAll(${JSON.stringify(sel)})[${index}]; if (!el) throw Error('no ${sel}'); document.querySelectorAll('[data-promo="${tag}"]').forEach(x => x.removeAttribute('data-promo')); el.setAttribute('data-promo', ${JSON.stringify(tag)})`);
// Mark the smallest element in a container whose whole text is the given text.
const markText = (within, text, tag) => js(`const els = [...document.querySelector(${JSON.stringify(within)}).querySelectorAll("*")].filter(e => e.textContent.trim() === ${JSON.stringify(text)} && e.getBoundingClientRect().width > 0); const el = els.at(-1); if (!el) throw Error("no text " + ${JSON.stringify(text)}); el.setAttribute("data-promo", ${JSON.stringify(tag)})`);
const keys = (sel, index, key, n) => js(`const w = document.querySelectorAll(${JSON.stringify(sel)})[${index}]; for (let i = 0; i < ${n}; i++) w.dispatchEvent(new KeyboardEvent('keydown', { key: ${JSON.stringify(key)}, bubbles: true }))`);
const sheetToBottom = js(`const d = document.querySelector('[role=dialog]'); d.scrollTop = d.scrollHeight`);
// A spin, frame by frame: the wheel's scroll position moves from its row by `rows`, in even steps (flip() then times
// the frames so the wheel slows like a flick), or with `eased` already on the flick's ease-out, for
// flip(…, { eased: true }), which stays smooth as the wheel creeps to its stop. Take about 24 frames per second of spin.
function spin(name, sel, index, rows, n, eased = false) {
  return Array.from({ length: n }, (_, i) => { const p = eased ? 1 - (1 - i / (n - 1)) ** 2 : i / (n - 1); return { name: `${name}-${i}`, steps: [
    js(`const w = document.querySelectorAll(${JSON.stringify(sel)})[${index}]; w.style.scrollSnapType = 'none'; if (w.__r0 === undefined) w.__r0 = Math.round(w.scrollTop / 48); w.scrollTop = (w.__r0 + ${rows} * ${p.toFixed(4)}) * 48`),
    ["wait", 120]] }; });
}
const unspin = (sel, index) => js(`const w = document.querySelectorAll(${JSON.stringify(sel)})[${index}]; w.style.scrollSnapType = ''; w.dispatchEvent(new Event('scroll'))`);

export const plan = [
  // 3 · How you slept: the sheet, "Fell asleep" from 9:00 pm spun to 11:00 pm, then Save.
  { query: q("view=sleep"), clock: at("07:20"), shots: [
    { name: "s3-sleep", steps: [["wait", 3000], ["scrollY", "Log your sleep", 430], ["boxAs", "Log your sleep", "log"]] },
    { name: "s3-sheet", steps: [["click", "Log your sleep"], ["wait", 1200], toggleField("Fell asleep"), ["wait", 500],
      keys("[role=dialog] .time-wheel", 0, "ArrowUp", 1), ["wait", 500], keys("[role=dialog] .time-wheel", 1, "ArrowUp", 6), ["wait", 800],
      toggleField("Fell asleep"), ["wait", 500], mark("[role=dialog] .time-button", 0, "fell"), ["boxAs", "css=[data-promo=fell]", "fell"]] },
    { name: "s3-open", steps: [toggleField("Fell asleep"), ["wait", 700], mark("[role=dialog] .time-wheel", 0, "hour"), ["boxAs", "css=[data-promo=hour]", "hour"]] },
    ...spin("s3-spin", "[role=dialog] .time-wheel", 0, 2, 7),
    { name: "s3-spun", steps: [unspin("[role=dialog] .time-wheel", 0), ["wait", 700]] },
    { name: "s3-save", steps: [sheetToBottom, ["wait", 400], ["boxAs", "Save entry", "save"]] },
    { name: "s3-saved", steps: [["click", "Save entry"], ["wait", 1600]] },
  ] },
  // 4 · Today, with Luma, Nori and Bounce.
  { query: q("view=today"), clock: at("07:35"), shots: [
    { name: "s4-today", steps: [["wait", 3000], ["boxAs", "css=.nook-company", "trio"]] },
  ] },
  // 5 · One small thing: Plan a task, "Call the bank", Save.
  { query: q("view=focus"), clock: at("07:40"), shots: [
    { name: "s5-focus", steps: [["wait", 3000], ["scrollY", "Plan a task", 470], ["boxAs", "Plan a task", "plan"]] },
    { name: "s5-sheet", steps: [["click", "Plan a task"], ["wait", 1200], ["boxAs", "css=[role=dialog] input[maxlength='160']", "name"]] },
    { name: "s5-typed", steps: [["typeShots", "css=[role=dialog] input[maxlength='160']", "Call the bank", 2, "s5-type"], ["wait", 300], ["boxAs", "Save entry", "save"]] },
    { name: "s5-saved", steps: [["click", "Save entry"], ["wait", 1600], ["scrollY", "Call the bank", 420], markText("main", "Call the bank", "task"), ["boxAs", "css=[data-promo=task]", "task"]] },
  ] },
  // 6 · A timer: the wheels from 10 to 25 minutes, Set timer, then Start timer.
  { query: q("view=clock"), clock: at("07:50"), shots: [
    { name: "s6-top", steps: [["wait", 3000]] },
    { name: "s6-card", steps: [scrollTop(".timer-settings", 110), ["wait", 400], keys(".timer-settings .time-wheel", 1, "ArrowUp", 15), ["wait", 900],
      mark(".timer-settings .time-wheel", 1, "mins"), ["boxAs", "css=[data-promo=mins]", "minutes"]] },
    ...spin("s6-spin", ".timer-settings .time-wheel", 1, 15, 8),
    { name: "s6-spun", steps: [unspin(".timer-settings .time-wheel", 1), ["wait", 700], markText(".timer-settings", "Set timer", "set"), ["boxAs", "css=[data-promo=set]", "set"]] },
    // Set timer readies it in the card at the top ("Time for your thing."), then Start timer runs it.
    { name: "s6-set", steps: [["click", "css=[data-promo=set]"], ["wait", 700], ["scrollTo", 0], ["wait", 800], ["boxAs", "Start timer", "start"]] },
    { name: "s6-running", steps: [["click", "Start timer"], ["wait", 1300]] },
  ] },
];
