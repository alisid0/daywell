import {foodDetail, activityDetail} from "./food-tracking.ts";
import type { Entry } from "./daywell";

export function validDay(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return y >= 1900 && y <= 9999 && date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}
export function shiftDay(value: string, days: number) {
  const date = new Date(`${value}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
export function shiftMonth(value: string, offset: number) {
  const date = new Date(`${value.slice(0, 7)}-01T12:00:00Z`); date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 10);
}
export function monthDays(value: string) {
  const first = `${value.slice(0, 7)}-01`;
  const offset = (new Date(`${first}T12:00:00Z`).getUTCDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, index) => shiftDay(first, index - offset));
}
export function dateLabel(value: string, options: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long", year: "numeric" }) {
  return new Date(`${value}T12:00:00Z`).toLocaleDateString("en-GB", { ...options, timeZone: "UTC" });
}

// Only a new completion gets today's date. Editing or rescheduling preserves it.
export function stampCompletions(items: Entry[], previous: Entry[], date: string, timestamp: string): Entry[] {
  return items.map(entry => {
    if (!["task", "grocery", "event"].includes(entry.kind)) return entry;
    const old = previous.find(item => item.id === entry.id);
    if (!entry.data.done) return { ...entry, data: { ...entry.data, completedDate: null, completedAt: null } };
    if (!old?.data.done && !entry.data.completedDate) return { ...entry, data: { ...entry.data, completedDate: date, completedAt: timestamp } };
    return { ...entry, data: { ...entry.data, completedDate: old?.data.completedDate ?? entry.data.completedDate, completedAt: old?.data.completedAt ?? entry.data.completedAt } };
  });
}
export function plannedEntries(entries: Entry[], from: string, to: string) {
  return entries.filter(entry => ["task", "event"].includes(entry.kind) && validDay(entry.data.date || "") && entry.data.date >= from && entry.data.date <= to)
    .sort((a, b) => a.data.date.localeCompare(b.data.date) || String(a.kind === "event" && !a.data.allDay ? a.data.time : "").localeCompare(String(b.kind === "event" && !b.data.allDay ? b.data.time : "")) || a.data.title.localeCompare(b.data.title));
}

export type HistoryRecord = { entry: Entry; date: string | null; title: string; detail: string; minutes: number };
export function historyRecords(entries: Entry[], today: string): HistoryRecord[] {
  const rows: HistoryRecord[] = [];
  for (const entry of entries) {
    const data = entry.data;
    if (["task", "grocery", "event"].includes(entry.kind)) {
      if (!data.done) continue;
      const date = validDay(data.completedDate || "") ? data.completedDate : null;
      if (date && date > today) continue;
      rows.push({ entry, date, title: data.title, detail: entry.kind === "task" ? "Priority completed" : entry.kind === "event" ? "Plan marked as done" : `Bought · ${data.quantity}`, minutes: 0 });
    } else if (["session", "move", "sleep", "food", "reflection"].includes(entry.kind) && validDay(data.date || "") && data.date <= today) {
      rows.push({ entry, date: data.date, title: entry.kind === "sleep" ? "A night of rest" : entry.kind === "reflection" ? "A moment to remember" : data.title, detail: entry.kind === "session" ? `${data.minutes} minutes of focus` : entry.kind === "move" ? `${data.minutes} minutes of movement · ${activityDetail(data)}` : entry.kind === "sleep" ? `${Math.floor(data.minutes / 60)}h ${data.minutes % 60}m recorded · ${data.quality}` : entry.kind === "food" ? `${data.meal} · ${foodDetail(data)}` : data.text, minutes: ["session", "move", "sleep"].includes(entry.kind) ? data.minutes : 0 });
    }
  }
  return rows.sort((a, b) => (b.date || "").localeCompare(a.date || "") || a.title.localeCompare(b.title));
}
export function progressTotals(records: HistoryRecord[]) {
  return {
    tasks: records.filter(row => row.entry.kind === "task").length,
    focus: records.filter(row => row.entry.kind === "session").reduce((sum, row) => sum + row.minutes, 0),
    movement: records.filter(row => row.entry.kind === "move").reduce((sum, row) => sum + row.minutes, 0),
    rest: new Set(records.filter(row => row.entry.kind === "sleep").map(row => row.date)).size,
    notes: records.filter(row => row.entry.kind === "reflection").length,
  };
}
export function monthlyProgress(records: HistoryRecord[], lastMonth: string, count = 6) {
  return Array.from({ length: count }, (_, index) => {
    const month = shiftMonth(lastMonth, index - count + 1).slice(0, 7);
    return { month, ...progressTotals(records.filter(row => row.date?.startsWith(month))) };
  });
}

function escapeIcal(text: string) { return text.replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,"); }
function foldLine(text: string) {
  const encoder = new TextEncoder(); let line = ""; let length = 0; const lines: string[] = [];
  for (const character of text) {
    const bytes = encoder.encode(character).length;
    if (length + bytes > 75) { lines.push(line); line = " "; length = 1; }
    line += character; length += bytes;
  }
  lines.push(line); return lines.join("\r\n");
}
const utcStamp = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
export function calendarFile(entries: Entry[], generatedAt = new Date()): string {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Daywell//Personal Calendar//EN", "CALSCALE:GREGORIAN", "X-WR-CALNAME:Daywell plans"];
  for (const entry of entries) {
    if (!["task", "event"].includes(entry.kind) || entry.data.done || !validDay(entry.data.date || "")) continue;
    const d = entry.data;
    lines.push("BEGIN:VEVENT", `UID:${entry.id}@daywell.local`, `DTSTAMP:${utcStamp(generatedAt)}`, `SUMMARY:${escapeIcal(d.title)}`, "CLASS:PRIVATE", "TRANSP:TRANSPARENT");
    if (entry.kind === "task" || d.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${d.date.replace(/-/g, "")}`, `DTEND;VALUE=DATE:${shiftDay(d.date, 1).replace(/-/g, "")}`);
    } else {
      // Convert local clock time to UTC for portable exports, including DST.
      const start = new Date(`${d.date}T${d.time}:00`);
      if (!Number.isFinite(start.getTime())) throw new Error("An event has an invalid time. Edit it before exporting.");
      lines.push(`DTSTART:${utcStamp(start)}`, `DTEND:${utcStamp(new Date(start.getTime() + d.minutes * 60000))}`);
    }
    lines.push(`DESCRIPTION:${escapeIcal(entry.kind === "task" ? "Daywell priority. This is a planning date, not a timed appointment." : d.notes || "Planned in Daywell.")}`);
    if (d.location) lines.push(`LOCATION:${escapeIcal(d.location)}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR"); return lines.map(foldLine).join("\r\n") + "\r\n";
}
export function historyCsv(records: HistoryRecord[]) {
  function cell(value: string) { const safe = /^[\s]*[=+@-]/.test(value) ? `'${value}` : value; return `"${safe.replace(/"/g, '""')}"`; }
  const rows = [["Date", "Record", "Title", "Details", "Minutes", "Planned date"], ...records.map(row => [row.date || "Date not recorded", row.entry.kind, row.title, row.detail, String(row.minutes || ""), ["task", "event"].includes(row.entry.kind) ? row.entry.data.date : ""])];
  return "\uFEFF" + rows.map(row => row.map(cell).join(",")).join("\r\n") + "\r\n";
}

// Calendar areas match the bottom bar. Plans, priorities, focus and shopping only appear under Everything.
export type CalendarArea = "all" | "move" | "eat" | "sleep" | "relax";
export type DayMark = Exclude<CalendarArea, "all"> | "plan";
export const calendarAreas: CalendarArea[] = ["all", "move", "eat", "sleep", "relax"];
export const areaLabels: Record<CalendarArea, string> = { all: "Everything", move: "Move", eat: "Eat", sleep: "Sleep", relax: "Relax" };
const areaByKind: Record<string, Exclude<CalendarArea, "all">> = { move: "move", food: "eat", sleep: "sleep", reflection: "relax" };
export function areaOf(kind: string): DayMark { return areaByKind[kind] ?? "plan"; }
export function inArea(kind: string, area: CalendarArea) { return area === "all" || areaByKind[kind] === area; }
export function recentDays(today: string, count = 7) { return Array.from({ length: count }, (_, index) => shiftDay(today, index - count + 1)); }
// One mark per kind of thing on a day, in a fixed order. Unfinished plans only count under Everything.
export function dayMarks(records: HistoryRecord[], plans: Entry[], date: string, area: CalendarArea): DayMark[] {
  const marks = new Set<DayMark>();
  for (const row of records) if (row.date === date && inArea(row.entry.kind, area)) marks.add(areaOf(row.entry.kind));
  if (area === "all" && plans.some(entry => entry.data.date === date && !entry.data.done)) marks.add("plan");
  return (["move", "eat", "sleep", "relax", "plan"] as DayMark[]).filter(mark => marks.has(mark));
}
