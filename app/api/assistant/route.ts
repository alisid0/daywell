import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { database } from "@/db/store";
import { getFoodSpace } from "@/db/food-store";
import { defaults, normalizeSettings, type Entry } from "@/lib/daywell";
import { wellnessInstructions, wellnessBoundary } from "@/lib/wellness-scope";
import { messageFor, readLimited, sameOrigin, UserFacingError } from "@/lib/request-guards";
import { paidRequest, AllowanceError } from "@/lib/paid-request";
import { assistantContext, assistantDraft, assistantInstructions, assistantJsonSchema, assistantRequestSchema, type AssistantArea, type AssistantRequest } from "@/lib/assistant";

// The Plus assistant (lib/assistant.ts). It reads only the areas the person allowed, sends those records and this
// visit's conversation to OpenAI (store: false), and returns a reply with any changes for the person to confirm.
// Nothing is saved here, and the conversation isn't kept.
export const dynamic = "force-dynamic";
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
const kindsFor: Record<AssistantArea, string[]> = { food: ["food", "grocery"], move: ["move"], sleep: ["sleep"], plans: ["task", "event", "alarm"] };
const quiet = (reply: string) => ({ reply, companion: "pip", looked: [], steps: [], chips: [], source: "boundary" });

export async function GET() {
  if (!await getChatGPTUser()) return json({ error: "Please sign in." }, 401);
  return json({ connected: !!env.OPENAI_API_KEY });
}
export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return json({ error: "Please sign in." }, 401);
  if (!sameOrigin(request)) return json({ error: "Request origin is not allowed." }, 403);
  if (!env.OPENAI_API_KEY) return json({ error: "The assistant is unavailable right now. Your everyday tools still work." }, 503);
  const raw = await readLimited(request, 32 * 1024);
  if (!raw) return json({ error: "Please send a shorter message." }, 413);
  let input: AssistantRequest;
  try { input = assistantRequestSchema.parse(JSON.parse(new TextDecoder().decode(raw))); }
  catch { return json({ error: "Please refresh Daywell and ask again." }, 400); }
  const boundary = wellnessBoundary(input.messages.at(-1)!.text);
  if (boundary) return json(quiet(boundary));
  try {
    const db = database();
    const row = await db.prepare("SELECT data FROM settings WHERE user_id=?").bind(user.userId).first<{ data: string }>();
    const settings = row ? normalizeSettings(JSON.parse(row.data)) : defaults;
    if (!settings.assistantConsentAt) return json({ error: "Choose what Daywell can look at first.", code: "CONSENT_NEEDED" }, 403);
    // Only the areas the person allowed are read, and never one whose tool is switched off.
    const areas = settings.assistantAreas.filter(area => area === "plans" || settings.modules.includes(area));
    const kinds = areas.flatMap(area => kindsFor[area]);
    const rows = kinds.length ? await db.prepare(`SELECT id,kind,data FROM entries WHERE user_id=? AND kind IN (${kinds.map(() => "?").join(",")}) ORDER BY rowid`).bind(user.userId, ...kinds).all<{ id: string; kind: string; data: string }>() : { results: [] };
    const entries = rows.results.map(item => ({ id: item.id, kind: item.kind, data: JSON.parse(item.data) })) as Entry[];
    const food = areas.includes("food") ? (await getFoodSpace(db, user.userId)).state : null;
    const saved = assistantContext(areas, { entries, food, bedtime: settings.bedtime, wakeTime: settings.wakeTime }, input.date);
    const response = await paidRequest(db, user.userId, "assistant", () => fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: env.OPENAI_MODEL || "gpt-4.1-mini", store: false, instructions: `${wellnessInstructions} ${assistantInstructions}`,
        input: [{ role: "user", content: JSON.stringify({ saved, where: input.where, localTime: input.time }) }, ...input.messages.map(message => ({ role: message.role, content: message.text }))],
        max_output_tokens: 1500, text: { format: { type: "json_schema", name: "daywell_assistant", strict: true, schema: assistantJsonSchema } } }),
      signal: AbortSignal.timeout(30000) }));
    if (!response.ok) throw new UserFacingError(response.status === 429 ? "The assistant is busy right now. Please try again in a moment." : "Couldn’t answer that just now. Please try again.");
    const result = await response.json() as { status?: string; output?: { content?: { type: string; text?: string }[] }[] };
    if (result.status === "incomplete") throw new UserFacingError("That needed a shorter answer. Please ask again.");
    const output = result.output?.flatMap(item => item.content || []).find(item => item.type === "output_text")?.text;
    if (!output) throw new UserFacingError("Couldn’t answer that just now. Please try again.");
    const draft = assistantDraft(JSON.parse(output), input.date, areas);
    // A reply that crosses the wellness line becomes the boundary, with nothing proposed.
    const crossed = wellnessBoundary(draft.reply);
    return json(crossed ? quiet(crossed) : { ...draft, source: "ai" });
  } catch (error) {
    if (error instanceof AllowanceError) return json({ error: error.message }, 429);
    const name = error instanceof Error ? error.name : "";
    console.error("Assistant failed", name);
    return json({ error: name === "TimeoutError" ? "That took too long. Please ask again." : messageFor(error, "Couldn’t answer that just now. Please try again.") }, 502);
  }
}
