// How food looks in Eat: one icon and one soft colour per supermarket aisle (lib/food-aisles.ts decides the aisle),
// looks for the four meals, and gentle wording for pack-date reminders. Colours are mixed from the palette in food.css
// (food-tone-*), so every look stays readable.
import { Apple, Bean, Carrot, CookingPot, Cookie, Croissant, CupSoda, Drumstick, Fish, Leaf, Milk, Package, Sandwich, ShoppingBasket, Snowflake, Soup, SprayCan, Wheat, type LucideIcon } from "lucide-react";
import { aisleFor, aisleIds, aisleNames, type AisleId } from "@/lib/food-aisles";

export type FoodTone = "green" | "fruit" | "meat" | "sea" | "dairy" | "grain" | "meal" | "treat" | "other";
export type Aisle = { id: AisleId; name: string; Icon: LucideIcon; tone: FoodTone };
const looks: Record<AisleId, [LucideIcon, FoodTone]> = {
  fruit: [Apple, "fruit"], vegetables: [Carrot, "green"], herbs: [Leaf, "green"], bakery: [Croissant, "grain"], meat: [Drumstick, "meat"],
  fish: [Fish, "sea"], dairy: [Milk, "dairy"], ready: [CookingPot, "meal"], grains: [Wheat, "grain"], beans: [Bean, "green"],
  cupboard: [Package, "other"], frozen: [Snowflake, "sea"], drinks: [CupSoda, "sea"], snacks: [Cookie, "treat"], household: [SprayCan, "other"],
  other: [ShoppingBasket, "other"],
};
const aisles = Object.fromEntries(aisleIds.map(id => [id, { id, name: aisleNames[id], Icon: looks[id][0], tone: looks[id][1] }])) as Record<AisleId, Aisle>;
export const aisleOf = (name: string, unit?: string): Aisle => aisles[aisleFor(name, unit)];
// Where an aisle comes on a walk round the shop (for sorting and grouping).
export const aisleRank = (aisle: Aisle) => aisleIds.indexOf(aisle.id);

// Meals have their own looks, used for the day's plate, planned meals, recipe ideas and the meal story.
export const mealLooks = {
  Breakfast: { Icon: Croissant, tone: "dairy" },
  Lunch: { Icon: Sandwich, tone: "green" },
  Dinner: { Icon: Soup, tone: "meal" },
  Snack: { Icon: Apple, tone: "fruit" },
} as const satisfies Record<string, { Icon: LucideIcon; tone: FoodTone }>;

const shortDate = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
// A pack date is a reminder, not a food-safety check, so the words stay plain and never say "expired".
export function reminder(date: string, today: string): { text: string; state: "past" | "today" | "soon" | "later" } {
  const days = Math.round((Date.parse(`${date}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 864e5);
  if (days < 0) return { text: `Reminder ${shortDate(date)}`, state: "past" };
  if (days === 0) return { text: "Reminder today", state: "today" };
  if (days === 1) return { text: "Reminder tomorrow", state: "soon" };
  return { text: `Reminder ${shortDate(date)}`, state: days <= 3 ? "soon" : "later" };
}

export function dayBadge(date: string) {
  const d = new Date(`${date}T12:00:00Z`);
  return { weekday: d.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" }), day: d.getUTCDate(), month: d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }) };
}

export const quantityText = (quantity: number) => quantity.toLocaleString("en-GB", { maximumFractionDigits: 3 });
export const unitText = (unit: string, quantity: number) => unit === "each" ? "each" : unit === "portion" ? (quantity === 1 ? "portion" : "portions") : unit;
