"use client";
import { useState, type CSSProperties } from "react";
import { Pause } from "lucide-react";
import { exercisePicture, type GuideFigure } from "@/lib/exercise-pictures";
import type { Exercise } from "@/lib/workouts";

const STILL_KEY = "daywell-guide-still";
const FIGURES: [GuideFigure, string][] = [["female", "Female"], ["male", "Male"]];

// The workout-guide picture for one exercise. Two frames (start and end) swap slowly to show the move; "Hold still", or
// a device set to reduce motion, shows both at once: side by side for standing moves, one above the other for moves along
// the floor. The figure choice is saved with the person's settings.
export function ExercisePicture({ exercise, figure, onFigure }: { exercise: Pick<Exercise, "id" | "name">; figure: GuideFigure; onFigure: (figure: GuideFigure) => void }) {
  // The player only opens after a tap, so this reads storage in the browser, never during server rendering.
  const [still, setStill] = useState(() => { try { return localStorage.getItem(STILL_KEY) === "1"; } catch { return false; } });
  const picture = exercisePicture(exercise.id, figure);
  if (!picture) return null;
  const moving = picture.frames.length > 1, wide = picture.aspect > 4 / 3;
  // Boxes take the figures' own shape where that's wider than 4:3 (or, side by side, taller), so no space is wasted.
  const shape = { "--guide-box": String(Math.min(Math.max(picture.aspect, 4 / 3), 3)), "--guide-half": String(Math.min(Math.max(picture.aspect, 0.5), 4 / 3)) } as CSSProperties;
  function hold() {
    const next = !still;
    setStill(next);
    try { localStorage.setItem(STILL_KEY, next ? "1" : "0"); } catch { /* storage unavailable: this visit only */ }
  }
  return <figure className="move-guide" style={shape} data-frames={picture.frames.length} data-shape={wide ? "wide" : "tall"} data-still={still || undefined}>
    <div className="move-guide-frames">
      {picture.frames.map((src, i) => <div className="move-guide-frame" key={src}>
        <img src={src} alt={moving ? `${exercise.name}, ${i ? "end" : "start"} position` : exercise.name} width={800} height={600} decoding="async" />
        {moving && <span aria-hidden>{i ? "End" : "Start"}</span>}
      </div>)}
    </div>
    <figcaption>
      {moving && <button type="button" className="move-guide-hold" aria-pressed={still} onClick={hold}><Pause size={15} aria-hidden />Hold still</button>}
      <span className="move-guide-figures" role="group" aria-label="Figure in the pictures">{FIGURES.map(([f, label]) => <button key={f} type="button" aria-pressed={figure === f} onClick={() => { if (f !== figure) onFigure(f); }}>{label}</button>)}</span>
      {picture.figure !== figure && <small>Shown with the {picture.figure} figure for now.</small>}
    </figcaption>
  </figure>;
}
