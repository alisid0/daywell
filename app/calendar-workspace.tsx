"use client";

import { useState, type KeyboardEvent } from "react";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Download, Footprints, History, ListChecks, Moon, NotebookPen, Plus, Timer } from "lucide-react";
import { toast } from "sonner";
import { today, displayTime, type Entry, type Kind } from "@/lib/daywell";
import { areaLabels, calendarAreas, calendarFile, dateLabel, dayMarks, historyCsv, historyRecords, inArea, monthDays, monthlyProgress, plannedEntries, progressTotals, shiftDay, shiftMonth, validDay, type HistoryRecord } from "@/lib/calendar";
import { EntryActions } from "./parts";
import { FoodCalendarPlans } from "./food-calendar";
import type { AppState } from "./use-daywell";

function download(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a"); link.href = url; link.download = filename;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
const labels: Partial<Record<Kind, string>> = { task: "Priorities", event: "Plans", session: "Focus", move: "Movement", sleep: "Rest", food: "Meals", grocery: "Shopping", reflection: "Reflections" };

export function CalendarWorkspace({ a }: { a: AppState }) {
  const now = today();
  const [selected, setSelected] = useState(now);
  const [month, setMonth] = useState(`${now.slice(0, 7)}-01`);
  const [range, setRange] = useState<"month" | "day" | "all">("month");
  const [filter, setFilter] = useState<Kind | "all">("all");
  const [metric, setMetric] = useState<"tasks" | "focus" | "movement">("tasks");
  const [pageSize, setPageSize] = useState(40);
  const end = shiftDay(shiftMonth(month, 1), -1);
  const mealPlans = a.food.snapshot?.state.plans ?? [];
  const dayMeals = mealPlans.filter(plan=>plan.date===selected);
  const upcomingMeals = mealPlans.filter(plan=>plan.date>=now&&plan.date<=shiftDay(now,30));
  const plans = plannedEntries(a.entries, month, end);
  const dayPlans = plannedEntries(a.entries, selected, selected);
  const comingUp = plannedEntries(a.entries, now, shiftDay(now, 30)).filter(entry => !entry.data.done);
  const area = a.calendarArea;
  const history = historyRecords(a.entries, now, { activityCalories: a.settings.calorieTracking });
  const dated = history.filter(row => row.date);
  const undated = history.filter(row => !row.date);
  const period = dated.filter(row => inArea(row.entry.kind, area) && (range === "all" || (range === "day" ? row.date === selected : row.date!.startsWith(month.slice(0, 7)))));
  const dayRecords = dated.filter(row => row.date === selected && inArea(row.entry.kind, area));
  const visibleHistory = period.filter(row => filter === "all" || row.entry.kind === filter);
  const totals = progressTotals(period);
  const months = monthlyProgress(dated, now);
  const maxMetric = Math.max(1, ...months.map(item => item[metric]));
  const exportable = plans.filter(entry => !entry.data.done);
  const monthName = dateLabel(month, { month: "long", year: "numeric" });
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  function chooseDate(value: string) {
    if (!validDay(value)) return;
    setSelected(value); setMonth(`${value.slice(0, 7)}-01`); setPageSize(40);
  }
  function newEntry(kind: "event" | "reflection" | "task", date = selected) {
    a.openEditor(kind); a.setDraft((draft: Record<string, unknown>) => ({ ...draft, date }));
  }
  function changeMonth(offset: number) { chooseDate(shiftMonth(month, offset)); }
  function moveDate(event: KeyboardEvent<HTMLButtonElement>, date: string) {
    const offset = ({ ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 } as Record<string, number>)[event.key];
    if (offset === undefined) return;
    event.preventDefault(); const next = shiftDay(date, offset); chooseDate(next);
    requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(`[data-calendar-date="${next}"]`)?.focus());
  }
  function exportMonth() {
    try { download(calendarFile(exportable), `daywell-plans-${month.slice(0, 7)}.ics`, "text/calendar;charset=utf-8"); toast.success("Calendar file prepared"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Couldn’t export this calendar."); }
  }
  const periodName = range === "all" ? "All recorded time" : range === "day" ? dateLabel(selected, { day: "numeric", month: "long", year: "numeric" }) : monthName;

  return <section className="calendar-workspace" aria-label="Calendar and history">
    {area !== "all" && <button className="calendar-back" onClick={() => a.setActive(area)}><ChevronLeft size={16} />{areaLabels[area]}</button>}
    <div className="calendar-intro"><div>{area === "all" ? <><h2>A place for what’s next.<br />And what you’ve already done.</h2><p>Your plans, little steps and moments worth remembering.</p></> : <><h2>{areaLabels[area]} history</h2><p>Only your {areaLabels[area].toLowerCase()} records. Choose Everything to see your whole day.</p></>}</div><CalendarDays size={42} aria-hidden="true" /></div>
    <div className="calendar-view-tabs" role="group" aria-label="Calendar view"><button aria-pressed={a.calendarView === "plan"} onClick={() => a.setCalendarView("plan")}><CalendarDays size={18} />Calendar</button><button aria-pressed={a.calendarView === "history"} onClick={() => a.setCalendarView("history")}><History size={18} />Look back</button></div>
    <div className="calendar-areas" role="group" aria-label="Show">{calendarAreas.map(item => <button key={item} aria-pressed={area === item} onClick={() => a.setCalendarArea(item)}>{item !== "all" && <i className={`area-dot area-${item}`} aria-hidden="true" />}{areaLabels[item]}</button>)}</div>
    <div className="calendar-navigation"><div className="calendar-month-controls"><button aria-label="Previous month" onClick={() => changeMonth(-1)} disabled={month <= "1900-01-01"}><ChevronLeft size={19} /></button><h3 aria-live="polite">{monthName}</h3><button aria-label="Next month" onClick={() => changeMonth(1)} disabled={month >= "9998-12-01"}><ChevronRight size={19} /></button></div><div><button className="calendar-today" onClick={() => chooseDate(now)}>Today</button><label>Go to date<input aria-label="Go to date" type="date" min="1900-01-01" max="9998-12-31" value={selected} onChange={event => chooseDate(event.target.value)} /></label></div></div>
    {a.calendarView === "plan" ? <>
      <div className="calendar-plan-layout"><div className="calendar-month"><div className="calendar-weekdays" aria-hidden="true">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => <span key={day}><span className="day-long">{day}</span><span className="day-short">{day[0]}</span></span>)}</div><div className="calendar-days" role="group" aria-label={monthName}>{monthDays(month).map(date => {
        const count = plannedEntries(a.entries, date, date).filter(entry => !entry.data.done).length + mealPlans.filter(plan=>plan.date===date).length;
        const recorded = dated.filter(row => row.date === date && inArea(row.entry.kind, area)).length;
        const marks = dayMarks(dated, plans, date, area);
        if((area==="all"||area==="eat")&&mealPlans.some(plan=>plan.date===date)&&!marks.includes("eat"))marks.push("eat");
        return <button key={date} data-calendar-date={date} aria-label={area === "all" ? `${dateLabel(date)}, ${count} planned, ${recorded} recorded` : `${dateLabel(date)}, ${recorded} ${areaLabels[area]} ${recorded === 1 ? "record" : "records"}`} aria-pressed={date === selected} aria-current={date === now ? "date" : undefined} className={`${date.startsWith(month.slice(0, 7)) ? "" : "calendar-other-month"} ${date === now ? "calendar-is-today" : ""}`} onClick={() => chooseDate(date)} onKeyDown={event => moveDate(event, date)}><span>{Number(date.slice(-2))}</span><span className="calendar-day-marks">{marks.map(mark => <i key={mark} className={`area-dot area-${mark}`} />)}</span></button>;
      })}</div><div className="calendar-legend">{(area === "all" ? (["move", "eat", "sleep", "relax", "plan"] as const) : [area]).map(mark => <span key={mark}><i className={`area-dot area-${mark}`} />{mark === "plan" ? "Plans & tasks" : areaLabels[mark]}</span>)}</div></div>
      <section className="calendar-day-agenda" aria-label="Selected day"><div className="calendar-day-heading"><span>{dateLabel(selected, { weekday: "long" })}</span><h3>{dateLabel(selected, { day: "numeric", month: "long" })}</h3></div>{area === "all" ? <><div className="calendar-add-actions"><button className="calendar-primary" onClick={() => newEntry("event")}><Plus size={16} />Add a plan</button>{a.enabled("focus") && <button onClick={() => newEntry("task")}><ListChecks size={16} />Plan a task</button>}</div><PlanRows a={a} entries={dayPlans} />{!dayPlans.length && !dayMeals.length && <p className="calendar-empty">Nothing planned for this date. Leave the space open, or add something you’d like to make time for.</p>}</> : dayRecords.length ? <div>{dayRecords.map(row => <HistoryRow key={row.entry.id} a={a} row={row} />)}</div> : <p className="calendar-empty">Nothing recorded for {areaLabels[area]} on this day. Quiet days count, too.</p>}{(area==="all"||area==="eat")&&<FoodCalendarPlans plans={dayMeals} a={a}/>}<button className="calendar-link" onClick={() => { setRange("day"); a.setCalendarView("history"); }}>Look back at this day<ChevronRight size={15} /></button></section></div>
      {(area==="all"||area==="eat")&&a.food.error&&<p role="status">Meal plans couldn’t load. <button className="well-text-button" onClick={()=>void a.food.refresh()}>Retry meal plans</button></p>}
      {(area==="all"||area==="eat")&&<FoodCalendarPlans plans={upcomingMeals} a={a}/>}
      <details className="calendar-upcoming" open><summary>Other plans in the next 30 days <span>{comingUp.length} {comingUp.length === 1 ? "plan" : "plans"}</span></summary>{comingUp.length ? <PlanRows a={a} entries={comingUp.slice(0, 20)} showDate /> : <p className="calendar-empty">Your next plans will appear here when you add them.</p>}{comingUp.length > 20 && <p className="calendar-small">Showing the next 20. Choose a date above to see the rest.</p>}</details>
      <details className="calendar-connections"><summary>Google & Apple calendars <span>Export available</span></summary><div><h3>Take your plans with you</h3><p>Download the unfinished tasks and events in {monthName}, then import the file into Google Calendar or Apple Calendar. Tasks appear as all-day planning items.</p><button className="calendar-primary" disabled={!exportable.length} onClick={exportMonth}><Download size={16} />Export {monthName} (.ics)</button><p className="calendar-small">{exportable.length} {exportable.length === 1 ? "plan" : "plans"} included. Times use {timeZone || "your device’s time zone"}. Meal plans, reflections and wellbeing history stay in Daywell.</p><div className="calendar-provider-help"><p><strong>Google Calendar</strong>On a computer, open Settings → Import & export and choose this file. <a href="https://support.google.com/calendar/answer/37118?hl=en" target="_blank" rel="noreferrer">Google’s instructions</a></p><p><strong>Apple Calendar</strong>On a Mac, choose File → Import and choose this file. <a href="https://support.apple.com/guide/calendar/import-or-export-calendars-icl1023/mac" target="_blank" rel="noreferrer">Apple’s instructions</a></p></div><p className="calendar-connection-status">Live sync isn’t connected. This file is a one-time copy; later edits won’t sync back. Importing another copy may create duplicates.</p><p className="calendar-small">Plans here don’t send notifications yet. Use your calendar app’s reminders after importing.</p></div></details>
    </> : <>
      <div className="calendar-history-tools"><div role="group" aria-label="History period">{([ ["month", "Selected month"], ["day", "Selected day"], ["all", "All time"] ] as const).map(([value, label]) => <button key={value} aria-pressed={range === value} onClick={() => { setRange(value); setPageSize(40); }}>{label}</button>)}</div><button className="calendar-primary" onClick={() => newEntry("reflection", selected > now ? now : selected)}><NotebookPen size={16} />Add a reflection</button></div>
      <section className="calendar-progress" aria-label="Recorded progress"><div><h3>{periodName}</h3><p>A record of what you’ve done. Quiet days count as living, too.</p></div><div className="calendar-progress-metrics">{[{ icon: Check, value: totals.tasks, label: "priorities completed" }, { icon: Timer, value: `${totals.focus} min`, label: "time spent focusing" }, { icon: Footprints, value: `${totals.movement} min`, label: "movement recorded" }, { icon: Moon, value: totals.rest, label: "nights of rest recorded" }].map(item => <div key={item.label}><item.icon size={19} /><strong>{item.value}</strong><span>{item.label}</span></div>)}</div><p className="calendar-small">Only saved records are counted. Unlogged time isn’t treated as zero effort.</p></section>
      <section className="calendar-growth" aria-label="Month by month progress"><div><h3>Little steps over time</h3><label>Show<select aria-label="Progress measure" value={metric} onChange={event => setMetric(event.target.value as typeof metric)}><option value="tasks">Completed priorities</option><option value="focus">Focus minutes</option><option value="movement">Movement minutes</option></select></label></div><div className="calendar-bars">{months.map(item => <button key={item.month} onClick={() => { chooseDate(`${item.month}-01`); setRange("month"); }} aria-label={`${dateLabel(`${item.month}-01`, { month: "long", year: "numeric" })}: ${item[metric]} ${metric === "tasks" ? "priorities completed" : "minutes recorded"}`}><span>{dateLabel(`${item.month}-01`, { month: "short" })}</span><span className="calendar-bar-track"><i style={{ width: `${item[metric] / maxMetric * 100}%` }} /></span><strong>{item[metric]}</strong></button>)}</div><p className="calendar-small">The current month is still in progress. Select a month to explore its records.</p></section>
      <section className="calendar-history-list" aria-label="Your history"><div className="calendar-history-title"><h3>Your days, remembered</h3><button disabled={!visibleHistory.length} onClick={() => download(historyCsv(visibleHistory), `daywell-history-${range === "all" ? "all" : range === "day" ? selected : month.slice(0, 7)}.csv`, "text/csv;charset=utf-8")}><Download size={16} />Save this history</button></div><label className="calendar-history-filter">Include<select aria-label="History record type" value={filter} onChange={event => { setFilter(event.target.value as typeof filter); setPageSize(40); }}><option value="all">Everything</option>{Object.entries(labels).map(([kind, label]) => <option key={kind} value={kind}>{label}</option>)}</select></label>
      {visibleHistory.length ? <div>{visibleHistory.slice(0, pageSize).map((row, index) => <HistoryRow key={row.entry.id} row={row} a={a} showDate={index === 0 || visibleHistory[index - 1].date !== row.date} />)}{visibleHistory.length > pageSize && <button className="calendar-link" onClick={() => setPageSize(pageSize + 40)}>Show more records</button>}</div> : <p className="calendar-empty">No saved records for this selection yet. Your completed tasks, focus sessions and everyday logs will gather here. You can also leave a reflection in your own words.</p>}
      </section>
      {undated.length > 0 && <details className="calendar-undated"><summary>Earlier records without a completion date <span>{undated.length}</span></summary><p className="calendar-small">These were completed before Daywell recorded completion dates. They’re kept here and excluded from dated totals.</p>{undated.map(row => <HistoryRow key={row.entry.id} a={a} row={row} />)}<button className="calendar-link" onClick={() => download(historyCsv(undated), "daywell-earlier-records.csv", "text/csv;charset=utf-8")}><Download size={15} />Save earlier records</button></details>}
      <p className="calendar-history-note">Completion dates are recorded when you mark an item done. Reopening removes that completion; completing it again records the new date. Plans aren’t counted as achievements until marked done. Deleting an entry also removes it from this history.</p>
    </>}
  </section>;
}

function PlanRows({ a, entries, showDate = false }: { a: AppState; entries: Entry[]; showDate?: boolean }) {
  return <div className="calendar-plan-rows">{entries.map(entry => <article key={entry.id} className={entry.data.done ? "calendar-plan-done" : ""}><button className="calendar-complete" disabled={a.saving > 0} aria-label={`${entry.data.done ? "Reopen" : "Mark done"}: ${entry.data.title}`} aria-pressed={entry.data.done} onClick={() => void a.save([{ ...entry, data: { ...entry.data, done: !entry.data.done } }])}>{entry.data.done ? <Check size={15} /> : null}</button><div><span className="calendar-plan-meta">{showDate ? `${dateLabel(entry.data.date, { day: "numeric", month: "short" })} · ` : ""}{entry.kind === "task" ? "Priority" : entry.data.allDay ? "All day" : `${displayTime(entry.data.time)} · ${entry.data.minutes} min`}</span><strong>{entry.data.title}</strong>{entry.data.location && <p>{entry.data.location}</p>}{entry.data.notes && <p className="calendar-plan-notes">{entry.data.notes}</p>}</div><div className="calendar-entry-actions"><EntryActions a={a} e={entry} /></div></article>)}</div>;
}
function HistoryRow({ a, row, showDate = false }: { a: AppState; row: HistoryRecord; showDate?: boolean }) {
  return <div>{showDate && row.date && <h4 className="calendar-history-date">{dateLabel(row.date)}</h4>}<article className={`calendar-history-row calendar-record-${row.entry.kind}`}><span className="calendar-record-mark" aria-hidden="true">{row.entry.kind === "reflection" ? <NotebookPen size={19} /> : <Check size={16} />}</span><div><small>{labels[row.entry.kind]}</small><strong>{row.title}</strong><p>{row.detail}</p>{["task", "event"].includes(row.entry.kind) && row.entry.data.date !== row.date && <small>Originally planned for {dateLabel(row.entry.data.date, { day: "numeric", month: "short", year: "numeric" })}</small>}</div>{row.entry.kind !== "session" && <div className="calendar-entry-actions"><EntryActions a={a} e={row.entry} /></div>}</article></div>;
}
