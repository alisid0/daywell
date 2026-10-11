import { foodDetail } from './food-tracking.ts';
import type { Entry } from './daywell';
export function foodDraftDetail(data: Entry['data']) {
  return foodDetail(data).replace(/\beaten\b/g,'shown').replace('kcal recorded','kcal estimated').replace('My estimate','Estimate');
}
export function narrationInput(value: unknown): string | null {
  if (!value || typeof value !== 'object' || !('text' in value) || typeof value.text !== 'string') return null;
  const text = value.text.trim();
  return text.length > 0 && text.length <= 1800 ? text : null;
}
export function foodNarration(draft: { summary: string; question: string | null; entries: Entry[] }) {
  const meals = draft.entries.filter(entry => entry.kind === 'food');
  // Read the current portion, including half/double adjustments, rather than stale AI totals.
  const description = meals.length ? `Here is your estimate. ${meals.map(entry => `${entry.data.title}: ${foodDraftDetail(entry.data)}`).join('. ')}. Check the food and portion before saving.` : draft.summary;
  return `${description}${draft.question ? ' '+draft.question : ''}`.slice(0,1800);
}
