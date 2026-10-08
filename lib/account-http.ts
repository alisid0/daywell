import { readLimited, sameOrigin } from "./request-guards.ts";
import { deleteAccount, exportAccount } from "../db/account-store.ts";

type Dependencies = { userId: string | null; database: () => Pick<D1Database, "prepare" | "batch">; now?: () => Date };
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { "Cache-Control": "no-store" } });

// GET downloads a copy of everything Daywell holds for the signed-in person.
// POST {"action":"delete-account"} deletes all of it.
export async function accountResponse(request: Request, { userId, database, now = () => new Date() }: Dependencies) {
  if (!userId) return json({ error: "Sign in to manage your data." }, 401);
  if (request.method === "GET") {
    try {
      const time = now();
      const body = JSON.stringify(await exportAccount(database(), userId, time), null, 2);
      return new Response(body, { headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="daywell-data-${time.toISOString().slice(0, 10)}.json"`,
        "Cache-Control": "no-store",
      } });
    } catch {
      // Never log the person's records.
      console.error("Account download failed");
      return json({ error: "Your download couldn't be prepared. Please try again." }, 503);
    }
  }
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
  if (!sameOrigin(request)) return json({ error: "Request origin is not allowed." }, 403);
  const raw = await readLimited(request, 1_000);
  let body: unknown = null;
  try { body = raw ? JSON.parse(new TextDecoder().decode(raw)) : null; } catch { /* Treated as unconfirmed below. */ }
  if ((body as { action?: unknown } | null)?.action !== "delete-account") return json({ error: "Please confirm that you want to delete your account." }, 400);
  try {
    await deleteAccount(database(), userId);
    return json({ ok: true });
  } catch {
    console.error("Account deletion failed");
    return json({ error: "Your account couldn't be deleted just now. Nothing was removed. Please try again." }, 503);
  }
}
