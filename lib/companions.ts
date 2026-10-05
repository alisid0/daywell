export const companions = {
  pip: { name: "Pip", job: "Focus & priorities", module: "focus", colour: "#F2BD72", hello: "One little thing. That’s a good place to start.", hint: "Write down one small priority. Give it a little focus time, then tick it off when you’re done.", action: "Add a priority" },
  tock: { name: "Tock", job: "Clocks & timers", module: "clock", colour: "#C7DCF4", hello: "I’ll keep the time. You take it at your pace.", hint: "Choose a length and press Start. You can pause whenever you need, or reset to begin again.", action: "Open timers" },
  momo: { name: "Momo", job: "Groceries", module: "grocery", colour: "#D4E2B9", hello: "Pop it on the list. I’ll keep it here for you.", hint: "Add the things you need. Tick each one when it’s in your bag; untick it if you need it again.", action: "Add a shopping item" },
  luma: { name: "Luma", job: "Sleep & winding down", module: "sleep", colour: "#D9C9F2", hello: "You can put the day down for a little while.", hint: "Choose a time to wind down. In your saved workspace, you can also log your sleep and how it felt.", action: "Log sleep" },
  nori: { name: "Nori", job: "Food & nourishment", module: "food", colour: "#F3C5B5", hello: "A little nourishment, without the judgement.", hint: "Add a meal and the details you want to remember. Daywell keeps your entries together for the day.", action: "Log a meal" },
  bounce: { name: "Bounce", job: "Movement", module: "move", colour: "#F3A6A9", hello: "A stretch counts. A small walk counts, too.", hint: "Record a walk, stretch or workout and how long it lasted. Small amounts of movement count here.", action: "Log movement" },
  sunny: { name: "Sunny", job: "Alarms & mornings", module: "alarm", colour: "#F5DF9E", hello: "A gentle nudge for your next fresh start.", hint: "Choose a time and the days for your alarm. Keep Daywell open to hear it; alarms don’t run after the app is closed.", action: "Set an alarm" },
} as const;

export type CompanionId = keyof typeof companions;
export const companionIds = Object.keys(companions) as CompanionId[];
export const companionForModule: Record<string, CompanionId> = Object.fromEntries(companionIds.map(id => [companions[id].module, id]));
