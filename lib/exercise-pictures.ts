import manifest from "../content/exercise-pictures.json" with { type: "json" };
import type { Settings } from "./daywell.ts";

// Workout-guide pictures for Move exercises (owner, 20 October 2026): made once in ChatGPT, checked against their pose
// texts and kept in the app as files (docs/move-pictures.md). Each exercise has one picture, or two for the start and
// end of the move, per figure. Nothing is generated while people use the app.
export type GuideFigure = Settings["guideFigure"];
// aspect: the figures' width ÷ height inside the 800×600 frames, so a picture can be shown without empty bands.
export type ExercisePicture = { figure: GuideFigure; frames: string[]; aspect: number };

const figures = manifest.figures as Record<GuideFigure, Record<string, { frames: number; aspect: number }>>;

// The chosen figure's pictures, or the other figure's while the chosen one has none for this exercise yet.
export function exercisePicture(id: string, figure: GuideFigure): ExercisePicture | null {
  for (const f of figure === "male" ? ["male", "female"] as const : ["female", "male"] as const) {
    const entry = figures[f]?.[id];
    if (entry?.frames) return { figure: f, aspect: entry.aspect, frames: Array.from({ length: entry.frames }, (_, i) => `/move-guides/${f}/${id}-${i + 1}.webp`) };
  }
  return null;
}
