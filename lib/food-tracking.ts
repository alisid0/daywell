import { z } from "zod";
import type { Entry } from "./daywell.ts";

export const nutritionSources = { label: "Food label", estimate: "My estimate", app: "Another app / source" } as const;
export const activitySources = { estimate: "My estimate", watch: "Watch / tracker", machine: "Exercise machine", app: "Another app" } as const;
const calories = z.number().finite().min(0).max(10000);
const macro = z.number().finite().min(0).max(1000);
export const intakeSchema = z.object({
  portions: z.number().finite().min(0.125).max(24),
  // These are totals for the portion(s) this person ate, never the household recipe.
  calories: calories.optional(),
  macros: z.object({ protein: macro, carbs: macro, fat: macro }).strict().optional(),
  source: z.enum(["label", "estimate", "app"]).optional(),
}).strict();
export type Intake = z.infer<typeof intakeSchema>;
export const foodTrackingFields = {
  foodStatus: z.enum(["eaten", "prepared", "used"]).optional(),
  portions: z.number().finite().min(0.125).max(24).optional(),
  macrosKnown: z.boolean().optional(),
  nutritionSource: z.enum(["label", "estimate", "app"]).optional(),
};
export const activityTrackingFields = {
  caloriesBurned: calories.optional(),
  calorieSource: z.enum(["estimate", "watch", "machine", "app"]).optional(),
};
export function intakeRecord(intake: Intake | undefined, status: "prepared" | "used") {
  return {
    foodStatus: intake ? "eaten" as const : status,
    ...(intake ? { portions: intake.portions } : {}),
    calories: intake?.calories ?? 0,
    protein: intake?.macros?.protein ?? 0, carbs: intake?.macros?.carbs ?? 0, fat: intake?.macros?.fat ?? 0,
    nutritionKnown: intake?.calories !== undefined, macrosKnown: !!intake?.macros,
    ...(intake?.source ? { nutritionSource: intake.source } : {}),
  };
}
export function isEaten(data: Entry["data"]) { return !data.foodStatus || data.foodStatus === "eaten"; }
export function nutritionSummary(entries: Entry[], date: string) {
  const meals = entries.filter(e => e.kind === "food" && e.data.date === date && isEaten(e.data));
  const activities = entries.filter(e => e.kind === "move" && e.data.date === date);
  const knownFood = meals.filter(e => e.data.nutritionKnown !== false);
  const knownActivity = activities.filter(e => Number.isFinite(e.data.caloriesBurned));
  const macros = meals.filter(e => e.data.macrosKnown === true || (e.data.macrosKnown === undefined && e.data.nutritionKnown !== false));
  return {
    eaten: knownFood.reduce((sum, e) => sum + e.data.calories, 0), eatenCount: knownFood.length,
    meals: meals.length, unknownFood: meals.length - knownFood.length,
    burned: knownActivity.reduce((sum, e) => sum + e.data.caloriesBurned, 0), burnedCount: knownActivity.length,
    activities: activities.length, unknownActivity: activities.length - knownActivity.length,
    macros: { protein: macros.reduce((n,e)=>n+e.data.protein,0), carbs: macros.reduce((n,e)=>n+e.data.carbs,0), fat: macros.reduce((n,e)=>n+e.data.fat,0) },
    macroCount: macros.length,
  };
}
export function foodDetail(data: Entry["data"]) {
  if (!isEaten(data)) return data.foodStatus === "prepared" ? "Prepared · not logged as eaten" : "Used · not logged as eaten";
  const portions = data.portions ? `${data.portions} portion${data.portions === 1 ? "" : "s"} eaten · ` : "Eaten · ";
  return portions + (data.nutritionKnown === false ? "calories not added" : `${data.calories} kcal recorded${data.nutritionSource ? ` · ${nutritionSources[data.nutritionSource as keyof typeof nutritionSources]}` : " (estimate)"}`);
}
export function activityDetail(data: Entry["data"]) {
  return Number.isFinite(data.caloriesBurned) ? `${data.caloriesBurned} kcal activity estimate${data.calorieSource ? ` · ${activitySources[data.calorieSource as keyof typeof activitySources]}` : ""}` : "Activity calories not added";
}
