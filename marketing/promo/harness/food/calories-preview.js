// Harness-only preview of automatic calorie estimates for moves and sleep (23 October 2026): ?fix=calories&details.
// Nothing is built. The numbers are for the harness person (35, 165 cm, 70 kg) with calorie tracking on:
//   moves: (activity value - 1) x 70 kg x hours, from the 2024 Adult Compendium of Physical Activities
//          (walking at a moderate pace 3.8, strength 3.8, stretching 2.3), so only the energy above resting;
//   sleep: the Mifflin-St Jeor resting rate (1,395 kcal a day, the daily guide's formula without its activity factor)
//          for the hours asleep: 7 h 45 min is about 450 kcal.
const setValue = (input, value) => {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
};

const style = document.createElement("style");
style.textContent = `
.dw-sleep-energy{margin:4px 0 10px;color:var(--dw-muted,#7d536e);font-size:calc(14px*var(--rc-scale,1));line-height:1.45}
`;
document.head.appendChild(style);

function touchUp() {
  // About you: the switch says what it covers.
  for (const hint of document.querySelectorAll("[id$='-tracking-hint']")) {
    const words = "A daily calorie guide from your details, plus estimates for your moves and your sleep. Off unless you turn it on.";
    if (hint.textContent !== words) hint.textContent = words;
  }
  // Record a move: Daywell fills in its estimate, and the person can change it.
  const field = document.querySelector(".mv-record .activity-calories");
  if (field && !field.dataset.dwEstimate) {
    field.dataset.dwEstimate = "1";
    setValue(field.querySelector("input"), "65");
  }
  if (field) {
    const label = field.querySelector("label");
    if (label?.firstChild?.nodeType === Node.TEXT_NODE && label.firstChild.nodeValue !== "Activity calories (kcal)") label.firstChild.nodeValue = "Activity calories (kcal)";
    // The source names Daywell's own estimate (a new choice beside "My estimate", "Watch / tracker" and the rest).
    const option = field.querySelector("select option:checked");
    if (option && option.textContent !== "Daywell's estimate") option.textContent = "Daywell's estimate";
    const helper = field.querySelector(".helper");
    const words = "For a 20-minute walk at your weight: the energy on top of what your body uses at rest. Change it if your watch or machine says otherwise.";
    if (helper && helper.textContent !== words) helper.textContent = words;
  }
  // Move: the week card and the last seven days add the activity calories.
  const head = document.querySelector(".mv-week-head > span");
  const first = head?.firstChild;
  if (first?.nodeType === Node.TEXT_NODE && /^\d+ days? · \d+ min$/.test(first.nodeValue)) first.nodeValue += " · about 140 kcal";
  for (const span of document.querySelectorAll(".mv-card-head > span")) {
    if (span.previousElementSibling?.id === "mv-last7" && /^\d+ min$/.test(span.textContent.trim())) span.textContent = `${span.textContent.trim()} · about 170 kcal`;
  }
  // Sleep: last night's rest says what the body used, as part of the day rather than on top of it.
  const last = document.querySelector(".sleep-last");
  if (last && /7h 45m/.test(last.textContent) && !last.querySelector(".dw-sleep-energy")) {
    const p = document.createElement("p");
    p.className = "dw-sleep-energy";
    p.textContent = "About 450 kcal used while you slept. It's already part of your daily guide.";
    last.querySelector("strong")?.after(p);
  }
}
new MutationObserver(touchUp).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
setInterval(touchUp, 500);
