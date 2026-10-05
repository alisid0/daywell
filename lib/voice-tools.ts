import { parseHostRequest } from "./host.ts";

// An agent may prepare a request, never confirm, undo, or directly write records.
export function safeAgentRequest(value: unknown): string | null {
  if (!value || typeof value !== "object" || !("request" in value) || typeof value.request !== "string") return null;
  const request = value.request.trim();
  if (!request || request.length > 600) return null;
  if (/^(?:open |show )?(?:explore|move|eat|sleep)$/i.test(request)) return request;
  if (/^(?:just rest|take a break|stop scrolling|help me stop scrolling|open relax)$/i.test(request)) return request;
  const parsed = parseHostRequest(request);
  return parsed.type === "plan" || parsed.type === "open" ? request : null;
}

export function allowedVoiceOrigin(request: Request) {
  try { return new URL(request.headers.get("origin") || "").origin === new URL(request.url).origin && request.headers.get("content-type")?.split(";")[0] === "application/json"; }
  catch { return false; }
}
export function voiceConfig(key?: string, agent?: string) { return Boolean(key?.trim() && agent && /^[a-zA-Z0-9_-]{5,100}$/.test(agent)); }
export function safeSignedUrl(value: unknown): value is string {
  if(typeof value !== "string") return false;
  try { const url = new URL(value); return url.protocol === "wss:" && (url.hostname === "api.elevenlabs.io" || url.hostname.endsWith(".elevenlabs.io")) && url.pathname.startsWith("/v1/convai/"); }
  catch { return false; }
}
