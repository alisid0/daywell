import { z } from "zod";
import type { Entry } from "./daywell";

export const pillars = [
  { id: "move", title: "Move", companion: "bounce", line: "A little stronger, at your pace.", detail: "Workouts, walks and the strength you build." },
  { id: "relax", title: "Relax", companion: "luma", line: "You can put the world down.", detail: "Quiet company and a pause from scrolling." },
  { id: "eat", title: "Eat", companion: "nori", line: "Something good, made simple.", detail: "Meal ideas, ingredients and your food journal." },
  { id: "sleep", title: "Sleep", companion: "luma", line: "Let the day soften around you.", detail: "Wind down, find your rhythm and notice your rest." },
] as const;
// Each set is counted in reps or, for holds, walks and cardio, in seconds.
export const workoutSetSchema = z.object({
  exercise: z.string().trim().min(1).max(80),
  reps: z.number().int().min(1).max(200).optional(),
  seconds: z.number().int().min(1).max(3600).optional(),
  kg: z.number().min(0).max(500),
}).refine(set => (set.reps === undefined) !== (set.seconds === undefined), { message: "Count each set in reps or seconds." });
export type WorkoutSet = z.infer<typeof workoutSetSchema>;
export function describeSet(set: WorkoutSet) {
  const amount = set.seconds !== undefined ? (set.seconds >= 60 && set.seconds % 60 === 0 ? `${set.seconds / 60} min` : `${set.seconds} sec`) : `${set.reps} reps`;
  return `${amount} · ${set.kg === 0 ? "bodyweight" : `${set.kg} kg`}`;
}
export const recipeIdeas = [
  { id: "chickpeas", title: "Chickpea sunshine bowl", time: "15 minutes", ingredients: ["Chickpeas", "Couscous", "Tomatoes", "Cucumber", "Lemon"], steps: ["Prepare couscous following its packet instructions.", "Drain and rinse canned chickpeas. Chop the tomato and cucumber.", "Toss everything with lemon juice, a little olive oil and your favourite seasoning."], note: "Contains wheat. Use rice or a suitable alternative if needed." },
  { id: "eggs", title: "Eggs & greens on toast", time: "10 minutes", ingredients: ["Eggs", "Spinach", "Wholegrain bread", "Tomatoes"], steps: ["Wash and soften the spinach and chopped tomatoes in a pan with a little oil.", "Scramble the eggs in the pan until fully cooked.", "Serve on toast. Add a little pepper or herbs if you like."], note: "Contains eggs and wheat. Check ingredients for your own dietary needs." },
  { id: "oats", title: "A bowl of berry oats", time: "10 minutes", ingredients: ["Oats", "Milk", "Berries", "Pumpkin seeds"], steps: ["Cook the oats with milk or a suitable alternative, following the packet instructions.", "Add washed berries and a spoonful of pumpkin seeds.", "Adjust the texture with a little more milk, then settle in."], note: "Choose milk and oats that suit your dietary needs; check labels for allergens." },
] as const;
export function matchingRecipes(pantry: string) {
  const words = pantry.toLowerCase().split(/[,\n]+/).map(x => x.trim()).filter(Boolean);
  const score = (ingredients: readonly string[]) => words.filter(word => ingredients.some(i => i.toLowerCase().includes(word) || word.includes(i.toLowerCase()))).length;
  return [...recipeIdeas].sort((a, b) => score(b.ingredients) - score(a.ingredients));
}
export function missingIngredients(ingredients: readonly string[], pantry: string, entries: Entry[]) {
  const have = new Set([...pantry.split(/[,\n]+/), ...entries.filter(e => e.kind === "grocery" && !e.data.done).map(e => e.data.title as string)].map(x => x.trim().toLowerCase()).filter(Boolean));
  return [...new Set(ingredients)].filter(item => !have.has(item.toLowerCase()));
}
export function exerciseHistory(entries: Entry[], exercise: string) {
  return entries.filter(e => e.kind === "move" && Array.isArray(e.data.sets))
    .sort((a, b) => b.data.date.localeCompare(a.data.date))
    .flatMap(e => (e.data.sets as WorkoutSet[]).filter(s => s.exercise.toLowerCase() === exercise.trim().toLowerCase()).map(s => ({ ...s, date: e.data.date }))).slice(0, 6);
}
