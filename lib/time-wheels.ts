// Endless wheels for a clock time or a length (owner-approved, 24 October 2026): the arithmetic, kept apart from the
// component so it can be tested. See docs/time-pickers.md.
import { displayTime } from "./daywell.ts";

/** About how many rows an endless wheel holds. It jumps back to its middle as it settles, so nobody reaches the end. */
export const WHEEL_ROWS = 600;

/** How many copies of the values an endless wheel stacks: odd, so one copy sits in the middle. */
export function wheelCopies(count: number, loop = true) { return loop ? Math.ceil(WHEEL_ROWS / count) | 1 : 1; }

/** Which value a row shows, for any row of the stacked copies (rows above the first copy included). */
export function wheelIndex(row: number, count: number) { return ((row % count) + count) % count; }

/** Once a wheel settles two laps or more from its middle copy, the row there with the same value; otherwise the row. */
export function recentredRow(row: number, count: number, copies: number) {
  const middle = Math.floor(copies / 2) * count + wheelIndex(row, count);
  return Math.abs(row - middle) >= 2 * count ? middle : row;
}

const validTime = (time: unknown): time is string => typeof time === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(time);

/** "HH:MM" as the clock wheels show it: an hour from 1 to 12, minutes on the nearest step, and am or pm. */
export function clockParts(time: string | undefined, step = 5, fallback = "09:00") {
  const [h, m] = (validTime(time) ? time : fallback).split(":").map(Number);
  let hour24 = h, minute = Math.round(m / step) * step;
  if (minute === 60) { minute = 0; hour24 = (h + 1) % 24; }
  return { hour: hour24 % 12 || 12, minute, pm: hour24 >= 12 };
}

/** The clock wheels' hour, minutes and am or pm, back to "HH:MM". */
export function clockValue(hour: number, minute: number, pm: boolean) {
  return `${String((hour % 12) + (pm ? 12 : 0)).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** A time the way Daywell shows it ("7:00 am"), or the fallback's when a time is missing. */
export function clockLabel(time: string | undefined, fallback = "09:00") { return displayTime(validTime(time) ? time : fallback); }

/** Minutes as the length wheels show them: whole hours, and the minutes left over. */
export function lengthParts(total: number) {
  const minutes = Math.max(0, Math.round(Number(total) || 0));
  return { hours: Math.floor(minutes / 60), minutes: minutes % 60 };
}

/** A length from the wheels, kept between the field's smallest and largest allowed values. */
export function lengthValue(hours: number, minutes: number, min = 1, max = 1440) { return Math.min(max, Math.max(min, hours * 60 + minutes)); }

/** A length in words, the way the wheels and plans show it: "45 min", "1 h", "1 h 30 min". */
export function lengthLabel(total: number) {
  const { hours, minutes } = lengthParts(total);
  return hours ? `${hours} h${minutes ? ` ${minutes} min` : ""}` : `${minutes} min`;
}
