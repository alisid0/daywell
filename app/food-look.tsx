// How food looks in Eat: an icon and a soft colour family for each kind of ingredient or meal, and gentle wording for
// pack-date reminders. Colours are mixed from the palette in food.css (food-tone-*), so every look stays readable.
import { Apple, Banana, Bean, Beef, Candy, Carrot, Cherry, Citrus, Cookie, Croissant, Drumstick, Egg, Fish, Grape, LeafyGreen, Milk, Nut, Package, Salad, Sandwich, Soup, Wheat, type LucideIcon } from "lucide-react";

export type FoodTone = "grain" | "green" | "fruit" | "dairy" | "protein" | "meal" | "other";
// First match wins, so more specific names come first ("egg noodles" are noodles; "berry oats" are oats).
const kinds: [RegExp, LucideIcon, FoodTone][] = [
  [/noodle|pasta|spaghetti/, Wheat, "grain"],
  [/\beggs?\b/, Egg, "dairy"],
  [/\boats?\b|porridge|granola|muesli/, Wheat, "grain"],
  [/\bbowl\b/, Salad, "green"],
  [/milk|cream|yog(h)?urt|butter|cheese|kefir/, Milk, "dairy"],
  [/rice|bread|toast|loaf|sourdough|couscous|flour|quinoa|wrap|tortilla|cereal|bagel|barley|grain/, Wheat, "grain"],
  [/croissant|pastry|muffin|pancake/, Croissant, "grain"],
  [/spinach|lettuce|kale|greens|rocket|cabbage|herb|basil|parsley|coriander|leaf/, LeafyGreen, "green"],
  [/salad|cucumber|broccoli|courgette|\bpeas?\b|avocado|asparagus/, Salad, "green"],
  [/chilli|soup|stew|curry|leftover|casserole|bolognese|lasagne|risotto/, Soup, "meal"],
  [/carrot|onion|potato|pepper|tomato|garlic|mushroom|squash|sweetcorn|\bcorn\b|leek|celery|beetroot|aubergine|vegetable/, Carrot, "green"],
  [/banana/, Banana, "fruit"],
  [/lemon|lime|orange|grapefruit|citrus|clementine/, Citrus, "fruit"],
  [/grape/, Grape, "fruit"],
  [/berr|cherr/, Cherry, "fruit"],
  [/apple|pear|peach|plum|mango|melon|kiwi|fruit/, Apple, "fruit"],
  [/chicken|turkey|drumstick/, Drumstick, "protein"],
  [/beef|mince|lamb|pork|steak|bacon|sausage|\bham\b/, Beef, "protein"],
  [/fish|salmon|tuna|\bcod\b|prawn|shrimp|mackerel|sardine/, Fish, "protein"],
  [/bean|chickpea|lentil|tofu|tempeh|hummus/, Bean, "protein"],
  [/\bnuts?\b|almond|cashew|peanut|seed/, Nut, "protein"],
  [/sandwich|toastie|burger|pizza|roll\b/, Sandwich, "meal"],
  [/biscuit|cookie|cake|chocolate/, Cookie, "other"],
  [/sweet|candy|sugar|honey|\bjam\b/, Candy, "other"],
];
export function foodKind(name: string, unit?: string): { Icon: LucideIcon; tone: FoodTone } {
  const lower = name.toLowerCase();
  for (const [pattern, Icon, tone] of kinds) if (pattern.test(lower)) return { Icon, tone };
  return unit === "portion" ? { Icon: Soup, tone: "meal" } : { Icon: Package, tone: "other" };
}

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
