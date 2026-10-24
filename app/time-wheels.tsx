"use client";
// Endless wheels for a clock time or a length, and form fields that open them (owner-approved, 24 October 2026). The
// arithmetic is in lib/time-wheels.ts; see docs/time-pickers.md.
import { memo, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { clockLabel, clockParts, clockValue, lengthLabel, lengthParts, lengthValue, recentredRow, wheelCopies, wheelIndex } from "@/lib/time-wheels";

const ROW = 48; // px: one row, as .time-wheel li in time-wheels.css
const hours12 = Array.from({ length: 12 }, (_, i) => i + 1);
const fiveMinutes = Array.from({ length: 12 }, (_, i) => i * 5);
const everyMinute = Array.from({ length: 60 }, (_, i) => i);
const halves = ["am", "pm"];
const plain = (value: string | number) => String(value);
const twoDigits = (value: string | number) => String(value).padStart(2, "0");
const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
// A soft tick as each number passes the middle, on phones that allow it (only after the person has tapped the page).
function tick() {
  try { if ((navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive) navigator.vibrate?.(2); }
  catch { /* not on this device */ }
}

type WheelProps<T extends string | number> = { values: T[]; value: T; label: (value: T) => string; name: string; loop?: boolean; onChange: (value: T) => void };

// One wheel. Endless ones stack copies of their values and, once settled two laps from the middle, jump to the same
// value there, so they never run out. Rows tilt away and fade like a drum.
function WheelBase<T extends string | number>({ values, value, label, name, loop = true, onChange }: WheelProps<T>) {
  const box = useRef<HTMLDivElement>(null);
  const count = values.length, copies = wheelCopies(count, loop), base = loop ? Math.floor(copies / 2) * count : 0;
  const start = base + Math.max(0, values.indexOf(value));
  const row = useRef(start), centre = useRef(start), tilted = useRef<HTMLElement[]>([]), settle = useRef(0), frame = useRef(0);
  const change = useRef(onChange);
  useEffect(() => { change.current = onChange; });
  const rows = useMemo(() => Array.from({ length: count * copies }, (_, i) => <li key={i} data-row={i}>{label(values[wheelIndex(i, count)])}</li>), [values, label, count, copies]);

  function drum() {
    const el = box.current, list = el?.firstElementChild?.children;
    if (!el || !list) return;
    const c = el.scrollTop / ROW;
    for (const li of tilted.current) { li.style.transform = ""; li.style.opacity = ""; }
    tilted.current = [];
    for (let i = Math.floor(c) - 3; i <= Math.ceil(c) + 3; i++) {
      const li = list[i] as HTMLElement | undefined;
      if (!li) continue;
      const d = i - c;
      li.style.transform = `perspective(320px) rotateX(${Math.max(-70, Math.min(70, -d * 24))}deg)`;
      li.style.opacity = String(Math.max(0.3, 1 - Math.abs(d) * 0.25));
      tilted.current.push(li);
    }
    const now = Math.round(c);
    if (now !== centre.current) { centre.current = now; tick(); }
  }
  function place(target: number, smooth: boolean) {
    row.current = loop ? target : Math.max(0, Math.min(count - 1, target));
    box.current?.scrollTo({ top: row.current * ROW, behavior: smooth && !reducedMotion() ? "smooth" : "auto" });
  }
  // Move to a row and say which value it shows, unless it shows the same value as before.
  function choose(target: number) {
    const before = wheelIndex(row.current, count);
    place(target, true);
    const after = wheelIndex(row.current, count);
    if (after !== before) change.current(values[after]);
  }
  useLayoutEffect(() => { centre.current = row.current; place(row.current, false); drum(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // A value set from outside (a shortcut chip, a length kept within its limits) moves the wheel without animating.
  useEffect(() => {
    const index = values.indexOf(value);
    if (index < 0 || index === wheelIndex(row.current, count)) return;
    row.current = centre.current = base + index;
    place(row.current, false); drum();
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { clearTimeout(settle.current); cancelAnimationFrame(frame.current); }, []);

  function onScroll() {
    cancelAnimationFrame(frame.current); frame.current = requestAnimationFrame(drum);
    clearTimeout(settle.current);
    settle.current = window.setTimeout(() => {
      const el = box.current; if (!el) return;
      const before = wheelIndex(row.current, count);
      row.current = Math.round(el.scrollTop / ROW);
      const after = wheelIndex(row.current, count);
      if (after !== before) change.current(values[after]);
      if (!loop) return;
      const again = recentredRow(row.current, count, copies);
      if (again !== row.current) { row.current = centre.current = again; el.scrollTop = again * ROW; }
    }, 120);
  }
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = ({ ArrowDown: 1, ArrowUp: -1, PageDown: 5, PageUp: -5 } as Record<string, number>)[event.key];
    if (step === undefined) return;
    event.preventDefault(); choose(row.current + step);
  }
  function onClick(event: MouseEvent<HTMLDivElement>) {
    const li = (event.target as HTMLElement).closest<HTMLElement>("li[data-row]");
    if (li) choose(Number(li.dataset.row));
  }
  const numeric = typeof value === "number";
  return <div className="time-wheel-wrap">
    <div ref={box} className="time-wheel" role="spinbutton" tabIndex={0} aria-label={name} aria-valuetext={label(value)}
      aria-valuenow={numeric ? Number(value) : undefined} aria-valuemin={numeric ? Number(values[0]) : undefined} aria-valuemax={numeric ? Number(values[count - 1]) : undefined}
      onScroll={onScroll} onKeyDown={onKeyDown} onClick={onClick}><ol aria-hidden="true">{rows}</ol></div>
    <span className="time-wheel-label" aria-hidden="true">{name}</span>
  </div>;
}
const Wheel = memo(WheelBase) as typeof WheelBase;

/** A clock time: hour, minutes in five-minute steps, and am or pm. A time saved before stays exact until it's changed. */
export function ClockWheels({ value, onChange }: { value: string; onChange: (time: string) => void }) {
  const { hour, minute, pm } = clockParts(value);
  return <div className="time-wheels">
    <Wheel values={hours12} value={hour} label={plain} name="hour" onChange={h => onChange(clockValue(h, minute, pm))} />
    <Wheel values={fiveMinutes} value={minute} label={twoDigits} name="minutes" onChange={m => onChange(clockValue(hour, m, pm))} />
    <Wheel values={halves} value={pm ? "pm" : "am"} label={plain} name="am / pm" loop={false} onChange={half => onChange(clockValue(hour, minute, half === "pm"))} />
  </div>;
}

/** A length: hours (up to 23, or the field's limit) and minutes, kept between the field's smallest and largest values. */
export function LengthWheels({ value, onChange, min = 1, max = 1440 }: { value: number; onChange: (minutes: number) => void; min?: number; max?: number }) {
  const { hours, minutes } = lengthParts(value);
  const hourValues = useMemo(() => Array.from({ length: Math.min(23, Math.floor(max / 60)) + 1 }, (_, i) => i), [max]);
  const shownHours = Math.min(hours, hourValues.length - 1);
  return <div className="time-wheels">
    <Wheel values={hourValues} value={shownHours} label={plain} name="hours" onChange={h => onChange(lengthValue(h, minutes, min, max))} />
    <Wheel values={everyMinute} value={minutes} label={twoDigits} name="minutes" onChange={m => onChange(lengthValue(shownHours, m, min, max))} />
  </div>;
}

type ClockField = { kind: "clock"; label: string; value: string; onChange: (time: string) => void };
type LengthField = { kind: "length"; label: string; value: number; onChange: (minutes: number) => void; min?: number; max?: number };
export type WheelField = ClockField | LengthField;

/** Form fields that show a time or a length on a button. Tapping one opens its wheels under the row; one at a time. */
export function WheelFields({ fields, startOpen = null }: { fields: WheelField[]; startOpen?: number | null }) {
  const [open, setOpen] = useState<number | null>(startOpen);
  const id = useId();
  const current = open === null ? undefined : fields[open];
  return <>
    <div className={fields.length > 1 ? "two-fields" : undefined}>{fields.map((field, i) => <div className="field time-field" key={field.label}>
      <span id={`${id}-label-${i}`}>{field.label}</span>
      <button type="button" className="time-button" id={`${id}-button-${i}`} aria-labelledby={`${id}-label-${i} ${id}-button-${i}`} aria-expanded={open === i} aria-controls={open === i ? `${id}-panel` : undefined} onClick={() => setOpen(open === i ? null : i)}>
        <span>{field.kind === "clock" ? clockLabel(field.value) : lengthLabel(field.value)}</span>
      </button>
    </div>)}</div>
    {current && <div className="time-panel" id={`${id}-panel`} role="group" aria-labelledby={`${id}-label-${open}`}>
      {fields.length > 1 && <span className="time-panel-title" aria-hidden="true">{current.label}</span>}
      {current.kind === "clock" ? <ClockWheels key={open} value={current.value} onChange={current.onChange} /> : <LengthWheels key={open} value={current.value} onChange={current.onChange} min={current.min} max={current.max} />}
    </div>}
  </>;
}
