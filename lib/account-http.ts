import { readLimited, sameOrigin } from "./request-guards.ts";
import { deleteAccount, exportAccount, readableAccount } from "../db/account-store.ts";
import { readClosure, closureReceipt, type AccountDatabase } from "./account-lifecycle.ts";
import { recoveryScopeForUser } from "./recovery-scope.ts";
type Dependencies = { userId: string | null; database: () => AccountDatabase; now?: () => Date };
const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", Vary: "Cookie" };
const json = (value: unknown, status = 200) => Response.json(value, { status, headers });
export async function accountResponse(request: Request, { userId, database, now = () => new Date() }: Dependencies) {
  if (!userId) return json({ error: "Sign in to manage your data." }, 401);
  const url = new URL(request.url);
  if (request.method === "GET") {
    if (request.headers.get("sec-fetch-site") === "cross-site") return json({ error: "Open Your data in Daywell." }, 403);
    try {
      if (url.searchParams.get("view") === "status") {
        const closure = await readClosure(database(), userId);
        return json({ status: closure ? "closed" : "active", recoveryScope: await recoveryScopeForUser(userId), receipt: closure ? closureReceipt(closure) : null });
      }
      const format = url.searchParams.get("format") ?? "json";
      if (!["json", "html"].includes(format)) return json({ error: "Choose a readable report or JSON." }, 400);
      const time = now(), data = await exportAccount(database(), userId, time);
      return new Response(format === "html" ? readableAccount(data) : JSON.stringify(data, null, 2), { headers: {
        ...headers, "Content-Type": format === "html" ? "text/html; charset=utf-8" : "application/json; charset=utf-8",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
        "Content-Disposition": `attachment; filename="daywell-data-${time.toISOString().slice(0, 10)}.${format}"`,
      } });
    } catch { return json({ error: "Your data could not be checked. Please try again." }, 503); }
  }
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
  if (!sameOrigin(request)) return json({ error: "Request origin is not allowed." }, 403);
  const raw = await readLimited(request, 1_000);
  let body: { action?: unknown; requestId?: unknown } | null = null;
  try { body = raw ? JSON.parse(new TextDecoder().decode(raw)) : null; } catch { /* Invalid confirmation. */ }
  if (body?.action !== "delete-account" || typeof body.requestId !== "string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(body.requestId))
    return json({ error: "Review and confirm account closure in Your data." }, 400);
  try {
    return json({ ok: true, receipt: await deleteAccount(database(), userId, body.requestId, now()), recoveryScope: await recoveryScopeForUser(userId) });
  } catch {
    return json({ code: "CHECK_STATUS", error: "We could not confirm the result. Check account status before trying again." }, 503);
  }
}
