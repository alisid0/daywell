import library from "../content/workouts.json" with { type: "json" };
import type { WorkoutSet } from "./wellbeing.ts";

export type Where = "none" | "home" | "gym";
export type Measure = "reps" | "seconds" | "minutes";
export type Exercise = {
  id: string; name: string; where: Where; kit: string | null; focus: string; level: number; measure: Measure;
  start: string; met: number; cue: string; easier: string | null; harder: string | null; caution?: string;
};
export type Routine = {
  id: string; name: string; where: Where; level: number; minutes: number;
  companion: "bounce" | "luma" | "nori" | "pip" | "sunny"; when: string; rounds?: number; blocks: [string, string][];
  setup?: string; restSeconds?: number;
};
// A step's prescribed amount: how many sets, and either reps or a timed hold per set.
export type Amount = { sets: number; reps?: number; seconds?: number; text: string };
export type RoutineStep = { exercise: Exercise; amount: Amount; round: number; rounds: number };

export const exercises = library.exercises as unknown as Exercise[];
export const routines = library.routines as unknown as Routine[];
export const exerciseById = new Map(exercises.map(e => [e.id, e]));
export const whereLabels: Record<Where, string> = { none: "No equipment", home: "Around the house", gym: "Gym" };
export const levelLabels: Record<number, string> = { 1: "Gentle", 2: "Steady", 3: "Strong" };

// Reads amounts such as "10", "3 × 8–10", "2 × 20 seconds each side" or "10 minutes, easy pace".
// Untimed amounts like "1 song" have no count; reps are only read for rep-based exercises.
export function parseAmount(text: string, measure: Measure): Amount {
  const value = text.trim();
  const grouped = /^(\d+)\s*[×x]\s*(.*)$/.exec(value);
  const sets = grouped ? Math.min(Math.max(Number(grouped[1]), 1), 10) : 1;
  const rest = grouped ? grouped[2] : value;
  const minutes = /(\d+)(?:–\d+)?\s*minutes?\b/.exec(rest);
  if (minutes) return { sets, seconds: Math.min(Number(minutes[1]) * 60, 3600), text: value };
  const seconds = /(\d+)(?:–\d+)?\s*seconds?\b/.exec(rest);
  if (seconds) return { sets, seconds: Math.min(Math.max(Number(seconds[1]), 1), 3600), text: value };
  const reps = measure === "reps" ? /(\d+)/.exec(rest) : null;
  if (reps) return { sets, reps: Math.min(Math.max(Number(reps[1]), 1), 200), text: value };
  return { sets, text: value };
}

export function routineSteps(routine: Routine): RoutineStep[] {
  const rounds = routine.rounds ?? 1, steps: RoutineStep[] = [];
  for (let round = 1; round <= rounds; round++) {
    for (const [id, text] of routine.blocks) {
      const exercise = exerciseById.get(id);
      if (exercise) steps.push({ exercise, amount: parseAmount(text, exercise.measure), round, rounds });
    }
  }
  return steps;
}

// Swapping keeps the prescribed amount when both exercises are counted the same way,
// otherwise it uses the replacement's own starting amount.
export function swapStep(step: RoutineStep, id: string | null): RoutineStep {
  const next = id ? exerciseById.get(id) : undefined;
  if (!next) return step;
  const sameMeasure = (next.measure === "reps") === (step.exercise.measure === "reps");
  return { ...step, exercise: next, amount: sameMeasure ? parseAmount(step.amount.text, next.measure) : parseAmount(next.start, next.measure) };
}

// Turns finished steps into saved sets (bodyweight by default). The app stores at most 20 sets.
export function completedSets(done: RoutineStep[], equipmentLoads: Record<string, number> = {}): WorkoutSet[] {
  return done.flatMap(step => {
    const unit = step.amount.reps ? { reps: step.amount.reps } : step.amount.seconds ? { seconds: step.amount.seconds } : null;
    const load = step.exercise.kit ? equipmentLoads[step.exercise.kit] : 0;
    const kg = Number.isFinite(load) && load >= 0 && load <= 500 ? load : 0;
    return unit ? Array.from({ length: step.amount.sets }, () => ({ exercise: step.exercise.name.slice(0, 80), ...unit, kg })) : [];
  }).slice(0, 20);
}

export function elapsedMinutes(ms: number) { return Math.min(600, Math.max(1, Math.round(ms / 60000))); }
