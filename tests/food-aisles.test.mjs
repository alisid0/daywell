import test from "node:test";
import assert from "node:assert/strict";
import { aisleFor, aisleIds, aisleNames } from "../lib/food-aisles.ts";

test("everyday foods land in the aisle a supermarket would put them in", () => {
  const expected = {
    rice: "grains", "basmati rice": "grains", couscous: "grains", "egg noodles": "grains", oats: "grains",
    egg: "dairy", milk: "dairy", "greek yoghurt": "dairy", cheddar: "dairy", "oat milk": "dairy",
    "sourdough loaf": "bakery", "wholegrain bread": "bakery", "tortilla wraps": "bakery",
    tomato: "vegetables", spinach: "vegetables", "spring onion": "vegetables", "red pepper": "vegetables",
    lime: "fruit", bananas: "fruit", apples: "fruit", watermelon: "fruit",
    "chicken thighs": "meat", mince: "meat", "salmon fillet": "fish",
    chickpeas: "beans", tofu: "beans", "black pepper": "herbs", "chilli flakes": "herbs",
    "vegetable chilli": "ready", "tinned tomatoes": "cupboard", "peanut butter": "cupboard", "olive oil": "cupboard",
    "frozen peas": "frozen", "orange juice": "drinks", "mint tea": "drinks",
    "dark chocolate": "snacks", almonds: "snacks", "washing-up liquid": "household", "bin bags": "household",
  };
  for (const [food, aisle] of Object.entries(expected)) assert.equal(aisleFor(food), aisle, food);
});

test("unknown foods fall back gently, and leftovers in portions are ready meals", () => {
  assert.equal(aisleFor("something new"), "other");
  assert.equal(aisleFor("Sunday roast", "portion"), "ready");
  assert.equal(aisleFor("RICE"), "grains");
});

test("every aisle has a name, in shop order", () => {
  assert.deepEqual(Object.keys(aisleNames).sort(), [...aisleIds].sort());
  assert.equal(aisleIds[0], "fruit");
  assert.equal(aisleIds.at(-1), "other");
});
