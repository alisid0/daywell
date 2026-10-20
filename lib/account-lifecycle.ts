import { recoveryScopeForUser } from "./recovery-scope.ts";

export type AccountDatabase = Pick<D1Database, "prepare" | "batch">;
export type Closure = { request_id: string; closed_at: string; provider_status: "not_automated" };

export function readClosure(db: Pick<D1Database, "prepare">, userId: string) {
  return db.prepare("SELECT request_id,closed_at,provider_status FROM account_closures WHERE user_id=?")
    .bind(userId).first<Closure>();
}

export function closureReceipt(closure: Closure) {
  return { requestId: closure.request_id, closedAt: closure.closed_at, activeData: "deleted" as const,
    providerData: closure.provider_status,
    retained: "An account key and this receipt are kept to prevent old devices restoring deleted records. Provider and backup removal is not verified by this receipt." };
}

// Shared by every personal/paid API. Missing migrations fail closed.
export async function accountAccessResponse(db: Pick<D1Database, "prepare">, userId: string): Promise<Response | null> {
  try {
    if (!await readClosure(db, userId)) return null;
    return Response.json({ code: "ACCOUNT_CLOSED", error: "This Daywell account is closed.", recoveryScope: await recoveryScopeForUser(userId) },
      { status: 410, headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "Your account could not be checked. Please try again." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
}
