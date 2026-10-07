import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

export type AccessEnvironment = {
  DAYWELL_APP_ORIGIN?: string;
  CF_ACCESS_ISSUER?: string;
  CF_ACCESS_AUD?: string;
};

const keySets = new Map<string, JWTVerifyGetKey>();

function accessSettings(env: AccessEnvironment) {
  const issuer = env.CF_ACCESS_ISSUER;
  const audience = env.CF_ACCESS_AUD;
  const origin = env.DAYWELL_APP_ORIGIN;
  if (!issuer || !/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer)) return null;
  if (!audience || !/^[a-f0-9]{64}$/.test(audience)) return null;
  try {
    if (!origin || new URL(origin).origin !== origin || !origin.startsWith("https://")) return null;
  } catch { return null; }
  return { issuer, audience, origin };
}

function privateResponse(body: string, status: number) {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "private, no-store" },
  });
}

function returnPath(value: string | null, origin: string) {
  if (!value?.startsWith("/") || value.startsWith("//")) return "/";
  const url = new URL(value, origin);
  if (url.origin !== origin || /^\/(?:signin-with-chatgpt|signout-with-chatgpt|callback|cdn-cgi)(?:\/|$)/.test(url.pathname)) return "/";
  return `${url.pathname}${url.search}${url.hash}`;
}

/** The owned Cloudflare entry point is the only caller in production.
 * Identity headers are constructed here after cryptographic verification; no
 * request-supplied identity, cookie or development login is accepted as proof.
 */
export async function handlePrivateCloudflareRequest(
  request: Request,
  env: AccessEnvironment,
  next: (authenticatedRequest: Request) => Promise<Response>,
  resolveKey?: JWTVerifyGetKey,
): Promise<Response> {
  const settings = accessSettings(env);
  if (!settings) return privateResponse("Daywell's private sign-in is not configured yet.", 503);
  const url = new URL(request.url);
  if (url.origin !== settings.origin) return privateResponse("Use Daywell's configured address to sign in.", 403);
  if (url.pathname.startsWith("/__daywell/")) return privateResponse("Not found.", 404);

  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token || token.length > 16_384) return privateResponse("Sign in through Cloudflare Access to open Daywell.", 401);
  let subject: string;
  let email: string;
  try {
    let keys = resolveKey ?? keySets.get(settings.issuer);
    if (!keys) {
      keys = createRemoteJWKSet(new URL(`${settings.issuer}/cdn-cgi/access/certs`), { timeoutDuration: 5_000 });
      keySets.set(settings.issuer, keys);
    }
    const { payload } = await jwtVerify(token, keys, {
      issuer: settings.issuer,
      audience: settings.audience,
      algorithms: ["RS256"],
      requiredClaims: ["sub", "email", "exp", "iat", "type"],
    });
    if (payload.type !== "app" || typeof payload.sub !== "string" || !payload.sub.trim()) throw new Error("No person identity");
    if (typeof payload.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) throw new Error("No person email");
    if (typeof payload.iat !== "number" || payload.iat > Date.now() / 1000 + 30) throw new Error("Future identity");
    subject = payload.sub;
    email = payload.email;
  } catch {
    // Do not log tokens, email addresses or provider error details.
    return privateResponse("Your Daywell sign-in could not be verified. Sign in again through Cloudflare Access.", 401);
  }

  if (url.pathname === "/signout-with-chatgpt") {
    return new Response(null, { status: 303, headers: {
      Location: `${settings.issuer}/cdn-cgi/access/logout`,
      "Cache-Control": "private, no-store",
    } });
  }
  if (url.pathname === "/signin-with-chatgpt") {
    return new Response(null, { status: 303, headers: {
      Location: new URL(returnPath(url.searchParams.get("return_to"), settings.origin), settings.origin).href,
      "Cache-Control": "private, no-store",
    } });
  }

  // Stable across email changes; namespaced by issuer to avoid identity collisions.
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify([settings.issuer, subject])));
  const userId = `cf-access:${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
  const trustedHeaders = new Headers(request.headers);
  for (const name of Array.from(trustedHeaders.keys())) {
    if (name.startsWith("oai-authenticated-user-")) trustedHeaders.delete(name);
  }
  trustedHeaders.delete("cf-access-jwt-assertion");
  trustedHeaders.set("oai-authenticated-user-id", userId);
  trustedHeaders.set("oai-authenticated-user-email", email);
  const response = await next(new Request(request, { headers: trustedHeaders }));
  const protectedResponse = new Response(response.body, response);
  protectedResponse.headers.set("Cache-Control", "private, no-store");
  protectedResponse.headers.set("X-Content-Type-Options", "nosniff");
  protectedResponse.headers.set("Referrer-Policy", "same-origin");
  return protectedResponse;
}
