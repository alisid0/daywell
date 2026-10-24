"use client";
// How Move shows a move (owner-approved design, 22 October 2026): its guide picture where there is one, otherwise a soft
// tile with an icon for what it works. Only some moves have pictures so far (docs/move-pictures.md); tiles fill the rest.
import { BicepsFlexed, CircleDot, Dumbbell, Footprints, Hand, HeartPulse, PersonStanding, Scale, type LucideIcon } from "lucide-react";
import { exercisePicture, type GuideFigure } from "@/lib/exercise-pictures";
import { exerciseById, type Exercise, type Routine } from "@/lib/workouts";
import type { AreaTone } from "./area-look";

export const focusLooks: Record<string, { name: string; Icon: LucideIcon; tone: AreaTone }> = {
  legs: { name: "Legs", Icon: Footprints, tone: "warm" },
  push: { name: "Push", Icon: Hand, tone: "dusk" },
  pull: { name: "Back", Icon: BicepsFlexed, tone: "sea" },
  core: { name: "Core", Icon: CircleDot, tone: "sun" },
  cardio: { name: "Warm-up", Icon: HeartPulse, tone: "treat" },
  mobility: { name: "Stretch", Icon: PersonStanding, tone: "green" },
  balance: { name: "Balance", Icon: Scale, tone: "other" },
};
const strengthLook = { name: "Strength", Icon: Dumbbell, tone: "other" as AreaTone };
export const focusLook = (focus?: string) => (focus && focusLooks[focus]) || strengthLook;

// One move's face: the last frame of its picture (the move at work), or its tile. "label" puts the move's name in the tile.
export function MoveFace({ exercise, figure, className = "", label }: { exercise?: Pick<Exercise, "id" | "name" | "focus">; figure: GuideFigure; className?: string; label?: string }) {
  const picture = exercise ? exercisePicture(exercise.id, figure) : null;
  if (picture) return <img className={`mv-face ${className}`} src={picture.frames.at(-1)} alt="" width={800} height={600} decoding="async" />;
  const look = focusLook(exercise?.focus);
  return <span className={`mv-face mv-tile area-tone-${look.tone} ${className}`} aria-hidden><look.Icon size={22} />{label && <small>{label}</small>}</span>;
}

// The moves to show for a routine: each move once, in order, those with pictures first and warm-ups last.
export function routineMoves(routine: Routine, figure: GuideFigure, count = 3) {
  const seen = new Set<string>(), moves: Exercise[] = [];
  for (const [id] of routine.blocks) {
    const exercise = exerciseById.get(id);
    const key = id.replace(/-(left|right)$/, "");
    if (exercise && !seen.has(key)) { seen.add(key); moves.push(exercise); }
  }
  // Pictures first, then the main moves before warm-ups.
  const rank = (m: Exercise) => (exercisePicture(m.id, figure) ? 0 : 2) + (m.focus === "cardio" ? 1 : 0);
  return moves.map((m, i) => ({ m, i })).sort((x, y) => rank(x.m) - rank(y.m) || x.i - y.i).map(({ m }) => m).slice(0, count);
}

// What a routine needs, in a few words: "No kit", its one short piece of kit, or where it happens.
export function kitWords(routine: Routine) {
  if (routine.where === "none") return "No kit";
  if (routine.where === "gym") return "Gym";
  const kits = new Set(routine.blocks.map(([id]) => exerciseById.get(id)?.kit).filter((kit): kit is string => !!kit));
  const [kit] = kits;
  return kits.size === 1 && kit.length <= 18 ? kit : "At home";
}
