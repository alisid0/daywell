// Supermarket aisles for food names. Like a shop, every food belongs to an aisle, so any ingredient gets a sensible
// picture without needing its own (owner's request, 15 Oct 2026). Aisles are listed in the order you'd walk round a
// shop, which is also how the shopping list is grouped. The pictures and colours live in app/food-look.tsx.
export const aisleIds = ["fruit", "vegetables", "herbs", "bakery", "meat", "fish", "dairy", "ready", "grains", "beans", "cupboard", "frozen", "drinks", "snacks", "household", "other"] as const;
export type AisleId = typeof aisleIds[number];
export const aisleNames: Record<AisleId, string> = {
  fruit: "Fruit", vegetables: "Vegetables", herbs: "Herbs & spices", bakery: "Bakery", meat: "Meat & poultry", fish: "Fish & seafood",
  dairy: "Dairy & eggs", ready: "Ready meals & leftovers", grains: "Rice, pasta & grains", beans: "Beans & pulses", cupboard: "Food cupboard",
  frozen: "Frozen", drinks: "Drinks", snacks: "Snacks & treats", household: "Household", other: "Other",
};

// First match wins, so the specific comes before the general: "egg noodles" are noodles, "tinned tomatoes" live in
// the cupboard, "orange juice" is a drink, "peanut butter" isn't dairy, and "vegetable chilli" is a ready meal.
const rules: [RegExp, AisleId][] = [
  [/washing|detergent|soap|shampoo|toilet|tissue|kitchen roll|bin bag|foil|cling film|batter(y|ies)|bulb|sponge|bleach|cleaner|toothpaste|nappy|nappies/, "household"],
  [/frozen|ice cream|lolly|fish fingers/, "frozen"],
  [/\b(oat|soy|soya|almond|coconut|rice) milk\b/, "dairy"],
  [/peanut butter|nut butter|almond butter/, "cupboard"],
  [/chilli (flakes|powder)/, "herbs"],
  [/chilli|soup|stew|curry|leftover|casserole|bolognese|lasagne|risotto|ready meal|pizza|\bpie\b/, "ready"],
  [/tinned|canned|\btins?\b|passata|pur[eé]e|\bjar\b/, "cupboard"],
  [/juice|\bwater\b|coffee|\btea\b|\bcola\b|lemonade|soda|wine|beer|smoothie|cordial/, "drinks"],
  [/noodle|pasta|spaghetti|penne|macaroni|\brice\b|\boats?\b|porridge|couscous|quinoa|flour|cereal|granola|muesli|barley|bulgur/, "grains"],
  [/bread|loaf|sourdough|\brolls?\b|bagel|croissant|\bwraps?\b|tortilla|pitta|naan|muffin|crumpet|\bbuns?\b|baguette|toast/, "bakery"],
  [/\beggs?\b|milk|cream|yog(h)?urt|butter|cheese|cheddar|mozzarella|parmesan|feta|halloumi|brie|kefir|cr[eè]me/, "dairy"],
  [/chicken|turkey|beef|mince|lamb|pork|steak|bacon|sausage|\bham\b|chorizo|meat|salami/, "meat"],
  [/fish|salmon|tuna|\bcod\b|haddock|prawn|shrimp|mackerel|sardine|seafood|crab/, "fish"],
  [/bean|chickpea|lentil|tofu|tempeh|hummus|houmous|edamame/, "beans"],
  [/basil|parsley|coriander|\bmint\b|thyme|rosemary|oregano|\bherbs?\b|spice|cumin|paprika|cinnamon|turmeric|black pepper|peppercorn/, "herbs"],
  [/apple|banana|orange|lemon|lime|grape|berr|cherr|\bpears?\b|peach|plum|mango|melon|kiwi|pineapple|fruit|clementine|satsuma|avocado/, "fruit"],
  [/carrot|onion|potato|pepper|tomato|garlic|mushroom|squash|sweetcorn|\bcorn\b|leek|celery|beetroot|aubergine|courgette|broccoli|cauliflower|cabbage|spinach|lettuce|kale|greens|salad|cucumber|\bpeas?\b|asparagus|vegetable|\bveg\b|rocket|sprouts/, "vegetables"],
  [/crisps|biscuit|cookie|chocolate|\bsweets?\b|cake|\bnuts?\b|almond|cashew|peanut|popcorn|flapjack|\bseeds?\b/, "snacks"],
  [/sauce|\boil\b|vinegar|stock|honey|\bjam\b|sugar|\bsalt\b|ketchup|mayo|mustard|\bsoy\b|baking/, "cupboard"],
];

export function aisleFor(name: string, unit?: string): AisleId {
  const lower = name.toLowerCase();
  for (const [pattern, id] of rules) if (pattern.test(lower)) return id;
  return unit === "portion" ? "ready" : "other";
}
