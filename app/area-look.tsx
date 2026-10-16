// How Move, Sleep and Relax look (Oct 2026, after the Eat redesign): like Eat's supermarket aisles, activities and
// sounds belong to a few kinds with one icon and one soft colour each, and a night is drawn as a bar from bedtime to
// waking. Colours are mixed from the palette in areas.css (area-tone-*), so every look stays readable.
import { Activity, Bike, Droplet, Droplets, Drum, Dumbbell, Footprints, Headphones, House, MapPin, Music, PersonStanding, Smartphone, Trees, Waves, type LucideIcon } from "lucide-react";

export type AreaTone = "green" | "sea" | "warm" | "dusk" | "treat" | "sun" | "other";
export type Kind = { name: string; Icon: LucideIcon; tone: AreaTone };

// What kind of move an entry is, from its name (and whether it has strength sets). First match wins.
const moves: [RegExp, Kind][] = [
  [/walk|stroll|hike|ramble|\bsteps\b/, { name: "Walking", Icon: Footprints, tone: "green" }],
  [/\brun\b|running|jog/, { name: "Running", Icon: Footprints, tone: "warm" }],
  [/cycl|\bbike\b|spin/, { name: "Cycling", Icon: Bike, tone: "sea" }],
  [/swim/, { name: "Swimming", Icon: Waves, tone: "sea" }],
  [/danc|zumba/, { name: "Dancing", Icon: Music, tone: "treat" }],
  [/stretch|yoga|pilates|mobility|wake-up|desk break|wind-down|tai chi/, { name: "Stretch & mobility", Icon: PersonStanding, tone: "dusk" }],
  [/strength|weights|gym|squat|core|kettlebell|circuit|workout|lift|press/, { name: "Strength", Icon: Dumbbell, tone: "warm" }],
];
export function moveKind(title: string, hasSets = false): Kind {
  if (hasSets) return { name: "Strength", Icon: Dumbbell, tone: "warm" };
  const lower = title.toLowerCase();
  for (const [pattern, kind] of moves) if (pattern.test(lower)) return kind;
  return { name: "Activity", Icon: Activity, tone: "other" };
}

// Where a routine happens, for its card and the filters.
export const whereLooks: Record<string, Kind> = {
  all: { name: "Anywhere", Icon: MapPin, tone: "other" },
  none: { name: "No equipment", Icon: PersonStanding, tone: "green" },
  home: { name: "Around the house", Icon: House, tone: "dusk" },
  gym: { name: "Gym", Icon: Dumbbell, tone: "sea" },
};

// Sleep and rest sounds: one picture for each kind of sound.
export function soundLook(label: string): Kind {
  const lower = label.toLowerCase();
  if (/forest/.test(lower)) return { name: "Forest", Icon: Trees, tone: "green" };
  if (/wave/.test(lower)) return { name: "Sea", Icon: Waves, tone: "sea" };
  if (/waterfall|pool|stream|river/.test(lower)) return { name: "Water", Icon: Droplets, tone: "sea" };
  if (/drip|drop|rain/.test(lower)) return { name: "Drops", Icon: Droplet, tone: "sea" };
  if (/drum/.test(lower)) return { name: "Drum", Icon: Drum, tone: "warm" };
  return { name: "Music", Icon: Music, tone: "dusk" };
}

// Guided unwind sessions: a picture for the moment each one is for.
export function sessionLook(id: string): Kind {
  if (/scroll/.test(id)) return { name: "After the scroll", Icon: Smartphone, tone: "dusk" };
  if (/home/.test(id)) return { name: "Home", Icon: House, tone: "warm" };
  if (/journey/.test(id)) return { name: "After travel", Icon: MapPin, tone: "sea" };
  return { name: "Guided", Icon: Headphones, tone: "dusk" };
}

// A night drawn on an evening-to-morning scale (8 pm to 11 am): where the bar starts and how long it is, in %.
// Times are "HH:MM". It describes the night; it never scores it.
const SCALE_START = 20 * 60, SCALE = 15 * 60;
const sinceEvening = (time: string) => { const [h, m] = time.split(":").map(Number); return (h * 60 + m - SCALE_START + 1440) % 1440; };
export function nightBar(bedtime: string, wakeTime: string) {
  const start = Math.min(sinceEvening(bedtime), SCALE - 30), end = Math.min(Math.max(sinceEvening(wakeTime), start + 30), SCALE);
  return { left: (start / SCALE) * 100, width: ((end - start) / SCALE) * 100 };
}
export const feelingTone = (quality: string): AreaTone => quality === "Rested" ? "green" : quality === "Okay" ? "sun" : "dusk";
