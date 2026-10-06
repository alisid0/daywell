"use client";
import { useEffect, useId, useState } from "react";
import { applyReadingComfort, defaultReadingComfort, parseReadingComfort, readingComfortKey, readingFontOptions, readingFonts, readingSizeLabels, readingSizes, readingSpacingLabels, readingSpacings, type ReadingComfort } from "@/lib/reading-comfort";

function readSaved() {
  try { return parseReadingComfort(localStorage.getItem(readingComfortKey)); } catch { return defaultReadingComfort; }
}

// Font, text size and spacing for this device. Changes apply straight away and sync across open tabs.
export function ReadingComfortSettings() {
  const id = useId();
  // Only shown after someone opens settings, so the saved choice can be read straight away.
  const [value, setValue] = useState<ReadingComfort>(() => typeof window === "undefined" ? defaultReadingComfort : readSaved());
  const [saved, setSaved] = useState(true);
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== readingComfortKey) return;
      const next = readSaved(); setValue(next); applyReadingComfort(document.documentElement, next);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  function change(next: ReadingComfort) {
    setValue(next);
    applyReadingComfort(document.documentElement, next);
    try { localStorage.setItem(readingComfortKey, JSON.stringify(next)); setSaved(true); } catch { setSaved(false); }
  }
  const group = <K extends keyof ReadingComfort>(key: K, legend: string, options: readonly ReadingComfort[K][], label: (option: ReadingComfort[K]) => string, note?: (option: ReadingComfort[K]) => string) =>
    <fieldset className="reading-comfort-group"><legend>{legend}</legend><div className="reading-comfort-options">{options.map(option =>
      <label key={option}><input type="radio" name={`${id}-${key}`} value={option} checked={value[key] === option} onChange={() => change({ ...value, [key]: option })} /><span><strong>{label(option)}</strong>{note && <small>{note(option)}</small>}</span></label>)}</div></fieldset>;
  return <section className="reading-comfort" aria-labelledby={`${id}-title`}>
    <h3 id={`${id}-title`}>Reading comfort</h3>
    <p>Choose what’s easiest for you to read. It’s saved on this device and doesn’t change anything else.</p>
    {group("font", "Font", readingFonts, option => readingFontOptions[option].label, option => readingFontOptions[option].note)}
    {group("size", "Text size", readingSizes, option => readingSizeLabels[option])}
    {group("spacing", "Spacing", readingSpacings, option => readingSpacingLabels[option])}
    {!saved && <p role="status">Your browser isn’t saving settings, so this choice lasts until you close Daywell.</p>}
  </section>;
}
