import { ZodError } from "zod";
import { FoodError } from "./food.ts";
import { readLimited, sameOrigin } from "./request-guards.ts";
import { getFoodSpace, saveFoodCommand } from "../db/food-store.ts";
import { recoveryScopeForUser } from "./recovery-scope.ts";

type Dependencies = { userId: string | null; database: () => Pick<D1Database, "prepare" | "batch"> };
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
export async function foodResponse(request: Request, { userId, database }: Dependencies) {
  if (!userId) return json({ error: "Sign in to save your food space." }, 401);
  if (request.method !== "GET" && request.method !== "POST") return json({ error: "Method not allowed." }, 405);
  if (request.method === "POST" && !sameOrigin(request)) return json({ error: "Request origin is not allowed." }, 403);
  try {
    const recoveryScope = await recoveryScopeForUser(userId);
    const expectedScope = request.headers.get("X-Daywell-Recovery-Scope");
    if (expectedScope && expectedScope !== recoveryScope) return json({ error: "Your sign-in changed. Reload Daywell before using this draft." }, 403);
    if (request.method === "GET") return json({ ...await getFoodSpace(database(), userId), recoveryScope });
    const body = await readLimited(request, 32_000);
    if (!body) return json({ error: "This food update is too large. Save fewer items at once." }, 413);
    const command: unknown = JSON.parse(new TextDecoder().decode(body));
    return json(await saveFoodCommand(database(), userId, command));
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof ZodError) return json({ error: "Please check the food details and try again." }, 400);
    if (error instanceof FoodError) return json({ error: error.message }, error.status);
    // Do not log quantities, meal titles, dates or the body of failed statements.
    console.error("Food storage request failed");
    return json({ error: "Your food space is unavailable. Keep your changes and try again." }, 503);
  }
}
