// Reading comfort: each person's font, text size and spacing, saved on their device.

export const readingFonts = ["atkinson", "classic", "lexend", "opendyslexic", "system"] as const;
export const readingSizes = ["standard", "large", "larger"] as const;
export const readingSpacings = ["standard", "roomy"] as const;
export type ReadingFont = typeof readingFonts[number];
export type ReadingSize = typeof readingSizes[number];
export type ReadingSpacing = typeof readingSpacings[number];
export type ReadingComfort = { font: ReadingFont; size: ReadingSize; spacing: ReadingSpacing };

// Daywell's default. Changing the default font for everyone who hasn't chosen one is this one line.
export const defaultReadingComfort: ReadingComfort = { font: "atkinson", size: "standard", spacing: "standard" };
export const readingComfortKey = "daywell-reading-comfort";

export const readingFontOptions: Record<ReadingFont, { label: string; note: string }> = {
  atkinson: { label: "Atkinson Hyperlegible", note: "Every letter has its own shape. Recommended." },
  classic: { label: "Daywell classic", note: "Bricolage Grotesque headings with DM Sans text." },
  lexend: { label: "Lexend", note: "Wide, evenly spaced letters." },
  opendyslexic: { label: "OpenDyslexic", note: "Weighted letters that some people with dyslexia prefer." },
  system: { label: "My device’s font", note: "The font your phone or computer already uses." },
};
export const readingSizeLabels: Record<ReadingSize, string> = { standard: "Standard", large: "Large", larger: "Larger" };
export const readingSpacingLabels: Record<ReadingSpacing, string> = { standard: "Standard", roomy: "Roomy" };

const pick = <T extends string>(options: readonly T[], value: unknown, fallback: T): T => options.includes(value as T) ? value as T : fallback;

// Anything unreadable or out of date falls back to the default, one setting at a time.
export function parseReadingComfort(raw: string | null | undefined): ReadingComfort {
  let value: Partial<ReadingComfort> = {};
  try { const parsed = JSON.parse(raw || "{}"); if (parsed && typeof parsed === "object") value = parsed; } catch { /* Use the defaults. */ }
  return {
    font: pick(readingFonts, value.font, defaultReadingComfort.font),
    size: pick(readingSizes, value.size, defaultReadingComfort.size),
    spacing: pick(readingSpacings, value.spacing, defaultReadingComfort.spacing),
  };
}

export function applyReadingComfort(root: HTMLElement, value: ReadingComfort) {
  root.dataset.readingFont = value.font;
  root.dataset.readingSize = value.size;
  root.dataset.readingSpacing = value.spacing;
}

// Runs in the page head before the first paint, so text doesn't visibly jump to the saved choice.
export const readingComfortScript = `try{var d=document.documentElement,v=JSON.parse(localStorage.getItem(${JSON.stringify(readingComfortKey)})||"{}")||{},p=function(o,x,f){return o.indexOf(x)>-1?x:f};d.dataset.readingFont=p(${JSON.stringify(readingFonts)},v.font,${JSON.stringify(defaultReadingComfort.font)});d.dataset.readingSize=p(${JSON.stringify(readingSizes)},v.size,${JSON.stringify(defaultReadingComfort.size)});d.dataset.readingSpacing=p(${JSON.stringify(readingSpacings)},v.spacing,${JSON.stringify(defaultReadingComfort.spacing)})}catch(e){}`;
