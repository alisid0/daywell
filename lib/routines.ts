import type { Entry } from "./daywell";

export type TaskFilter = "today" | "upcoming" | "completed" | "all";

export function filterTasks(entries: Entry[], filter: TaskFilter, date: string) {
  return entries.filter(e => e.kind === "task" && (
    filter === "all" ||
    (filter === "today" && !e.data.done && e.data.date <= date) ||
    (filter === "upcoming" && !e.data.done && e.data.date > date) ||
    (filter === "completed" && e.data.done)
  )).sort((a, b) => Number(a.data.done) - Number(b.data.done) || a.data.date.localeCompare(b.data.date));
}

export function formatDuration(seconds: number) {
  const value = Math.max(0, Math.floor(seconds));
  return [Math.floor(value / 3600), Math.floor(value / 60) % 60, value % 60]
    .map(n => String(n).padStart(2, "0")).join(":");
}

export function timerTitle(mode: string) {
  return mode === "Break" ? "A little breathing room." : mode === "Timer" ? "Time for your thing." : "One thing at a time.";
}
