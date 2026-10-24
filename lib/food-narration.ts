import { foodDetail } from './food-tracking.ts';
import type { Entry } from './daywell';
// While calorie tracking is off, the review shows the portion and the place, not the calorie estimate (owner-approved, 23 October 2026).
export function foodDraftDetail(data: Entry['data'], calories = true) {
  return foodDetail(calories ? data : { ...data, nutritionKnown: false }, { calories }).replace(/\beaten\b/g,'shown').replace('kcal recorded','kcal estimated').replace('My estimate','Estimate');
}
export function foodNarration(draft: { summary: string; question: string | null; entries: Entry[] }, calories = true) {
  const meals = draft.entries.filter(entry => entry.kind === 'food');
  // Read the current portion, including half/double adjustments, rather than stale AI totals.
  const description = meals.length ? `Here is your estimate. ${meals.map(entry => `${entry.data.title}: ${foodDraftDetail(entry.data, calories)}`).join('. ')}. Check the food and portion before saving.` : draft.summary;
  return `${description}${draft.question ? ' '+draft.question : ''}`.slice(0,1800);
}
