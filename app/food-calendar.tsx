"use client";
import type { Plan } from "@/lib/food";
import type { AppState } from "./use-daywell";

// Read the original meal plans; never create duplicate calendar/journal records.
export function FoodCalendarPlans({ plans, a }: { plans: Plan[]; a: AppState }) {
  if (!plans.length) return null;
  return <section aria-label="Planned meals"><h3>Meals you’ve planned</h3>{[...plans].sort((x,y)=>x.date.localeCompare(y.date)).map(plan=><article className="well-record" key={plan.id}><div><strong>{plan.title}</strong><small>{plan.date} · {plan.meal} · {plan.servings} {plan.servings===1?"serving":"servings"}</small></div><button className="well-text-button" onClick={()=>{a.food.setStart(plan.date);a.food.setView("meals");a.setActive("eat")}}>Open meal plan</button></article>)}</section>;
}
