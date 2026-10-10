import { schemas, type Entry } from "./daywell.ts";
import type { FoodState, Shopping } from "./food.ts";

// Existing host/list entries remain the source for these notes. A namespaced
// projection connects them to reviewed food purchases without copying records.
export const shoppingEntryPrefix = "entry--";
export type ShoppingEntry = { id: string; data: string };
export function shoppingEntryId(id: string) {
  return id.startsWith(shoppingEntryPrefix) ? id.slice(shoppingEntryPrefix.length) : null;
}
export function connectedShopping(state: FoodState, rows: ShoppingEntry[]): FoodState {
  return { ...state, shopping: [...state.shopping, ...rows.map(row => {
    const data = schemas.grocery.parse(JSON.parse(row.data));
    return { id: shoppingEntryPrefix + row.id, title: data.title, quantity: data.quantity, done: data.done, changedBy: data.foodChangedBy ?? "shopping-list" };
  })] };
}
export function shoppingEntryData(item: Shopping, previous?: string) {
  const data = previous ? schemas.grocery.parse(JSON.parse(previous)) : null;
  // Food-side edits preserve completion metadata only while completion is unchanged.
  return schemas.grocery.parse({ ...(data?.done === item.done ? data : {}), title: item.title, quantity: item.quantity, done: item.done, foodChangedBy: item.changedBy });
}
export function touchesShopping(entries: Entry[], removed: string[], previousKinds: string[]) {
  return entries.some(entry => entry.kind === "grocery") || previousKinds.includes("grocery") || removed.length > 0;
}
