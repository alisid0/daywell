import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { database } from "@/db/store";
import { defaults } from "@/lib/daywell";
import { getFoodSpace } from "@/db/food-store";
import { wellnessInstructions, wellnessBoundary } from "@/lib/wellness-scope";
import { messageFor, readLimited, sameOrigin, UserFacingError } from "@/lib/request-guards";
import { paidRequest, AllowanceError } from "@/lib/paid-request";
import { basketForIdeas, basketIdeasDraft, basketIdeasInstructions, basketIdeasJsonSchema, mealStepsDraft, mealStepsInstructions, mealStepsJsonSchema, recipeRequestSchema, type RecipeRequest } from "@/lib/recipe-ideas";

// Recipe ideas from the Food basket, and steps for a meal being planned (lib/recipe-ideas.ts). Only the request and,
// for basket ideas, the basket's names, quantities and units go to OpenAI. Nothing is saved here.
export const dynamic = "force-dynamic";
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
export async function GET() {
  if (!await getChatGPTUser()) return json({ error: "Please sign in." }, 401);
  return json({ connected: !!env.OPENAI_API_KEY });
}
export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return json({ error: "Please sign in." }, 401);
  if (!sameOrigin(request)) return json({ error: "Request origin is not allowed." }, 403);
  if (!env.OPENAI_API_KEY) return json({ error: "Recipe ideas are unavailable right now. Your basket and meal plans still work." }, 503);
  const raw = await readLimited(request, 32 * 1024);
  if (!raw) return json({ error: "Please use a shorter request." }, 413);
  let input: RecipeRequest;
  try { input = recipeRequestSchema.parse(JSON.parse(new TextDecoder().decode(raw))); }
  catch { return json({ error: "Please check the ingredients and try again." }, 400); }
  const boundary = wellnessBoundary([input.wish, input.kind === "meal" ? input.title : ""].join(" ").trim());
  if (boundary) return json(input.kind === "basket" ? { summary: boundary, ideas: [] } : { summary: boundary, title: "", steps: [], extras: [] });
  try {
    const db = database();
    const row = await db.prepare("SELECT data FROM settings WHERE user_id=?").bind(user.userId).first<{ data: string }>();
    const settings = row ? JSON.parse(row.data) : defaults;
    if (!settings.modules.includes("food")) return json({ error: "Turn on Eat before asking for recipe ideas." }, 400);
    const food = input.kind === "basket" ? await getFoodSpace(db, user.userId) : null;
    const basket = food ? basketForIdeas(food.state) : [];
    if (food && !basket.length) return json({ error: "Add a few ingredients to your basket first." }, 400);
    const content = input.kind === "basket" ? { basket, wish: input.wish, avoid: input.avoid } : { meal: { name: input.title, servings: input.servings, ingredients: input.ingredients }, wish: input.wish };
    const response = await paidRequest(db, user.userId, "recipes", () => fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: env.OPENAI_MODEL || "gpt-4.1-mini", store: false, instructions: `${wellnessInstructions} ${input.kind === "basket" ? basketIdeasInstructions : mealStepsInstructions}`,
        input: [{ role: "user", content: [{ type: "input_text", text: JSON.stringify(content) }] }], max_output_tokens: 3000,
        text: { format: { type: "json_schema", name: "daywell_recipes", strict: true, schema: input.kind === "basket" ? basketIdeasJsonSchema : mealStepsJsonSchema } } }),
      signal: AbortSignal.timeout(45000) }));
    if (!response.ok) throw new UserFacingError(response.status === 429 ? "Recipe ideas are busy right now. Please try again later." : "Couldn’t find recipe ideas right now. Please try again later.");
    const result = await response.json() as { status?: string; output?: { content?: { type: string; text?: string }[] }[] };
    if (result.status === "incomplete") throw new UserFacingError("That took more than one try. Please ask again.");
    const output = result.output?.flatMap(item => item.content || []).find(item => item.type === "output_text")?.text;
    if (!output) throw new UserFacingError("Couldn’t find recipe ideas right now. Please try again.");
    const draft = input.kind === "basket" ? basketIdeasDraft(JSON.parse(output), food!.state) : mealStepsDraft(JSON.parse(output), input.ingredients.map(item => item.ingredient));
    return json({ ...draft, source: "ai" });
  } catch (error) {
    if (error instanceof AllowanceError) return json({ error: error.message }, 429);
    const name = error instanceof Error ? error.name : "";
    console.error("Recipe ideas failed", name);
    return json({ error: name === "TimeoutError" ? "That took too long. Please try again." : messageFor(error, "Couldn’t find recipe ideas right now. Please try again.") }, 502);
  }
}
