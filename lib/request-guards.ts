// Shared checks for API routes that change data or call paid services.

// A state-changing request must come from Daywell itself. Browsers send Origin on cross-site
// POSTs and Sec-Fetch-Site on all modern requests, so a request that proves neither is refused.
export function sameOrigin(request: Request) {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return false;
  const origin = request.headers.get("origin");
  if (origin) {
    try { return new URL(origin).host === new URL(request.url).host; }
    catch { return false; }
  }
  return site === "same-origin";
}

// Reads a request body without trusting Content-Length. Returns null once the body passes maxBytes.
export async function readLimited(request: Request, maxBytes: number): Promise<Uint8Array<ArrayBuffer> | null> {
  if (!request.body) return new Uint8Array(new ArrayBuffer(0));
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) { await reader.cancel().catch(() => {}); return null; }
    chunks.push(value);
  }
  const body = new Uint8Array(new ArrayBuffer(size));
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  return body;
}

// An error whose message is written for the person using Daywell and is safe to show them.
// Anything else gets a generic message, so internal details never reach the browser.
export class UserFacingError extends Error {}
export function messageFor(error: unknown, fallback: string) {
  return error instanceof UserFacingError ? error.message : fallback;
}

// Per-user allowances, counted in fixed windows in the usage_limits table.
export const limits = {
  voice: { windowMs: 10 * 60 * 1000, max: 6 },
  capture: { windowMs: 24 * 60 * 60 * 1000, max: 20 },
} as const;
export type LimitedFeature = keyof typeof limits;
export function limitWindow(feature: LimitedFeature, now = Date.now()) { return Math.floor(now / limits[feature].windowMs); }

type Database = { prepare(query: string): { bind(...values: unknown[]): { first<T = unknown>(): Promise<T | null> } } };
// Counts one use and reports whether it fits the allowance. One atomic statement, so parallel
// requests can't both slip under the limit.
export async function takeAllowance(db: Database, userId: string, feature: LimitedFeature, now = Date.now()) {
  const row = await db.prepare(
    "INSERT INTO usage_limits(user_id,feature,window,count) VALUES(?,?,?,1) ON CONFLICT(user_id,feature) DO UPDATE SET window=excluded.window, count=CASE WHEN usage_limits.window=excluded.window THEN usage_limits.count+1 ELSE 1 END WHERE usage_limits.window<>excluded.window OR usage_limits.count<? RETURNING count"
  ).bind(userId, feature, limitWindow(feature, now), limits[feature].max).first<{ count: number }>();
  return row !== null;
}
