import type { Entry, Kind, Settings } from "./daywell";

export const starterModules: Settings["modules"] = ["focus", "clock", "grocery"];
export const firstSteps: { module: Settings["modules"][number]; kind: Kind; title: string; instruction: string; action: string }[] = [
  { module: "focus", kind: "task", title: "Choose one priority", instruction: "Add a task. Press the play button beside it when you want to focus, then tick it off when you finish.", action: "Add a priority" },
  { module: "grocery", kind: "grocery", title: "Lighten your mental list", instruction: "Add an item and its quantity. Check it off as you shop; it moves to the Bought tab.", action: "Add a grocery item" },
  { module: "clock", kind: "timer", title: "Make a little time", instruction: "Choose a timer length and press Start. Keep Daywell open to hear the finishing sound.", action: "Try a timer" },
  { module: "sleep", kind: "sleep", title: "Notice your sleep", instruction: "Enter when you fell asleep, when you woke up and how you feel. Overnight hours are worked out for you.", action: "Log your sleep" },
  { module: "move", kind: "move", title: "Count the small moves", instruction: "After a walk, stretch or workout, add the activity and how many minutes you spent on it.", action: "Log movement" },
  { module: "food", kind: "food", title: "Add your first meal", instruction: "Enter your food, portion and nutrition details. You can edit an entry later if you need to.", action: "Log a meal" },
  { module: "alarm", kind: "alarm", title: "Set a gentle reminder", instruction: "Choose a time and repeat days. Keep Daywell open for it to ring; use your phone for a wake-up alarm.", action: "Set an alarm" },
];

export function stepsFor(modules: Settings["modules"]) {
  return firstSteps.filter(step => modules.includes(step.module));
}

export function hasTriedStep(entries: Entry[], kind: Kind) {
  if (kind === "timer") return entries.some(e => e.kind === "session" || (e.kind === "timer" && (e.data.endAt !== null || e.data.remaining < e.data.duration)));
  return entries.some(e => e.kind === kind);
}
