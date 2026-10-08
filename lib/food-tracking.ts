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
  // Append optional fields to preserve hashes of previously saved commands.
  sugarGrams: macro.optional(),
}).strict();
export type Intake = z.infer<typeof intakeSchema>;
export const foodTrackingFields = {
  foodStatus: z.enum(["eaten", "prepared", "used"]).optional(),
  portions: z.number().finite().min(0.125).max(24).optional(),
  macrosKnown: z.boolean().optional(),
  nutritionSource: z.enum(["label", "estimate", "app"]).optional(),
  sugarGrams: macro.optional(),
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
    // Explicit undefined lets the editor clear a previously recorded amount.
    sugarGrams: intake?.sugarGrams,
  };
}
export function isEaten(data: Entry["data"]) { return !data.foodStatus || data.foodStatus === "eaten"; }
export function nutritionSummary(entries: Entry[], date: string) {
  const meals = entries.filter(e => e.kind === "food" && e.data.date === date && isEaten(e.data));
  const activities = entries.filter(e => e.kind === "move" && e.data.date === date);
  const knownFood = meals.filter(e => e.data.nutritionKnown !== false);
  const knownActivity = activities.filter(e => Number.isFinite(e.data.caloriesBurned));
  const macros = meals.filter(e => e.data.macrosKnown === true || (e.data.macrosKnown === undefined && e.data.nutritionKnown !== false));
  const sugar = meals.filter(e => Number.isFinite(e.data.sugarGrams));
  return {
    eaten: knownFood.reduce((sum, e) => sum + e.data.calories, 0), eatenCount: knownFood.length,
    meals: meals.length, unknownFood: meals.length - knownFood.length,
    burned: knownActivity.reduce((sum, e) => sum + e.data.caloriesBurned, 0), burnedCount: knownActivity.length,
    activities: activities.length, unknownActivity: activities.length - knownActivity.length,
    movementMinutes: activities.reduce((sum, e) => sum + e.data.minutes, 0),
    sugarGrams: sugar.reduce((sum, e) => sum + e.data.sugarGrams, 0), sugarCount: sugar.length,
    unknownSugar: meals.length - sugar.length,
    macros: { protein: macros.reduce((n,e)=>n+e.data.protein,0), carbs: macros.reduce((n,e)=>n+e.data.carbs,0), fat: macros.reduce((n,e)=>n+e.data.fat,0) },
    macroCount: macros.length,
  };
}
export function sugarHistory(entries: Entry[], endDate: string) {
  const end = new Date(`${endDate}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate) || !Number.isFinite(end.getTime()) || end.toISOString().slice(0, 10) !== endDate) return [];
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(end);
    day.setUTCDate(day.getUTCDate() - (6 - index));
    const date = day.toISOString().slice(0, 10);
    const total = nutritionSummary(entries, date);
    return { date, sugarGrams: total.sugarCount ? total.sugarGrams : null, recorded: total.sugarCount, entries: total.meals };
  });
}
export function foodDetail(data: Entry["data"]) {
  if (!isEaten(data)) return data.foodStatus === "prepared" ? "Prepared · not logged as eaten" : "Used · not logged as eaten";
  const portions = data.portions ? `${data.portions} portion${data.portions === 1 ? "" : "s"} eaten · ` : "Eaten · ";
  const energy = data.nutritionKnown === false ? "calories not added" : `${data.calories} kcal recorded`;
  const sugar = Number.isFinite(data.sugarGrams) ? ` · ${data.sugarGrams} g total sugar` : "";
  const source = data.nutritionSource ? ` · ${nutritionSources[data.nutritionSource as keyof typeof nutritionSources]}` : data.nutritionKnown === false && !sugar ? "" : " (estimate)";
  return portions + energy + sugar + source;
}
export function activityDetail(data: Entry["data"]) {
  return Number.isFinite(data.caloriesBurned) ? `${data.caloriesBurned} kcal activity estimate${data.calorieSource ? ` · ${activitySources[data.calorieSource as keyof typeof activitySources]}` : ""}` : "Activity calories not added";
}
