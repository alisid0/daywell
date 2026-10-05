"use client";
import { ChevronRight } from "lucide-react";
import { today } from "@/lib/daywell";
import { areaLabels, dateLabel, dayMarks, historyRecords, plannedEntries, recentDays, type CalendarArea } from "@/lib/calendar";
import type { AppState } from "./use-daywell";

// The last seven days at a glance. From Today it opens everything; from an area, only that area's history.
export function CalendarStrip({ a, area }: { a: AppState; area: CalendarArea }) {
  const now = today();
  const days = recentDays(now);
  const records = historyRecords(a.entries, now);
  const plans = plannedEntries(a.entries, days[0], now);
  const label = areaLabels[area];
  function open() { a.setCalendarArea(area); a.setCalendarView("plan"); a.setActive("calendar"); }
  return <button type="button" className="calendar-strip" onClick={open} aria-label={area === "all" ? "Open your calendar and history" : `Open your ${label} history`}>
    <span className="calendar-strip-head"><b>{area === "all" ? "Last 7 days" : `${label}, last 7 days`}</b><span>Calendar<ChevronRight size={14} aria-hidden="true" /></span></span>
    <span className="calendar-strip-days" aria-hidden="true">{days.map(date => <span key={date} className={date === now ? "calendar-strip-today" : undefined}>
      <small>{dateLabel(date, { weekday: "narrow" })}</small><b>{Number(date.slice(-2))}</b>
      <span className="calendar-strip-dots">{dayMarks(records, plans, date, area).map(mark => <i key={mark} className={`area-dot area-${mark}`} />)}</span>
    </span>)}</span>
  </button>;
}
