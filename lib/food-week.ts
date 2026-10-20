import { foodOverview, type Plan } from "./food.ts";
import { windowEnd } from "./food-planning.ts";

// The Week board (owner-approved Kitchen design, part 2, 20 October 2026): seven days from today by breakfast, lunch
// and dinner. Snacks show in a day's own view.
type Overview = ReturnType<typeof foodOverview>;
export const boardMeals = ["Breakfast", "Lunch", "Dinner"] as const;
export const dayMeals = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;
export type Meal = typeof dayMeals[number];

export const weekDates = (start: string, count = 7) => Array.from({ length: count }, (_, i) => windowEnd(start, i));
export const plansFor = (plans: Plan[], date: string, meal?: Meal) => plans.filter(plan => plan.date === date && (!meal || plan.meal === meal));

// What a planned meal still needs, from the shopping needs worked out across all planned meals.
export function planNeeds(plan: Plan, overview: Overview) {
  return overview.toBuy.filter(row => plan.ingredients.some(item => item.ingredient === row.ingredient));
}

// The first run of days, from the first empty one, whose meal is still unplanned: what "Fill empty slots with ideas"
// asks for, so no day gets a second dinner.
export function emptyRun(plans: Plan[], dates: string[], meal: Meal) {
  const first = dates.findIndex(date => !plansFor(plans, date, meal).length);
  if (first < 0) return null;
  let count = 0;
  while (first + count < dates.length && !plansFor(plans, dates[first + count], meal).length) count++;
  return { start: dates[first], count };
}

// Plain words for a day: "Today", "Tomorrow", or "Thursday 9 October".
export function dayWords(date: string, today: string) {
  const day = new Date(`${date}T12:00:00Z`);
  const weekday = day.toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" });
  const dayMonth = day.toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });
  const short = day.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" });
  const dayShort = day.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  const relative = date === today ? "Today" : date === windowEnd(today, 1) ? "Tomorrow" : "";
  return { weekday, short, dayMonth, dayShort, relative, dayNumber: day.getUTCDate() };
}
