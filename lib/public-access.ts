import { appName, emailSchema, endSession, readSession, sendSignInCode, sessionLifetimeMs, verifySignInCode, type Session, type SignInEmail, type SignInSettings } from './email-sign-in.ts';
import { readLimited, sameOrigin } from './request-guards.ts';
import { allows, planMessages } from './plans.ts';

// The public app's front door (docs/sign-in.md). Like lib/cloudflare-access.ts for the private test, it is the only
// place identity is set: headers that claim an identity are removed, and the signed-in person's are added only after
// their session cookie matches a live session. The app itself never sees codes or session tokens.

export type PublicEnvironment = {
  DAYWELL_APP_ORIGIN?: string;
  DAYWELL_AUTH_SECRET?: string;
  DAYWELL_EMAIL_FROM?: string;
  DAYWELL_REVIEW_EMAIL?: string;
  DAYWELL_REVIEW_CODE?: string;
  DB?: D1Database;
  EMAIL?: Pick<SendEmail, 'send'>;
};

export const sessionCookie = '__Host-daywell-session';
const cookieAttributes = 'Path=/; Secure; HttpOnly; SameSite=Lax';
const sessionSetting = (token: string) => `${sessionCookie}=${token}; ${cookieAttributes}; Max-Age=${sessionLifetimeMs / 1000}`;
const sessionClearing = `${sessionCookie}=; ${cookieAttributes}; Max-Age=0`;

// Built files that hold nothing personal (scripts, styles, fonts and pictures) skip the session lookup.
const publicFiles = /^\/(?:_next\/static\/|companions\/|fonts\/|scenes\/)|^\/[\w-]+\.(?:svg|png|jpe?g|webp|ico|txt|webmanifest)$/;
// Daywell's recordings come with Daywell Plus (docs/plans.md).
const recordings = /^\/(?:audio-library|guided-audio|sleep-sounds)\//;

const messages = {
  email: 'Enter your email address, like name@example.com.',
  codeBusy: "You've asked for several codes. Wait a few minutes, then try again.",
  unavailable: "We couldn't send a code just now. Try again in a few minutes.",
  code: 'Enter the 6-digit code from the email.',
  wrong: "That code isn't right. Check the newest email from Daywell.",
  expired: 'That code has expired. Ask for a new one.',
  tryBusy: 'Too many tries for this email today. Please try again tomorrow.',
  trouble: "Daywell can't reach its records just now. Please try again in a minute.",
};

function settingsFrom(env: PublicEnvironment) {
  const origin = env.DAYWELL_APP_ORIGIN, secret = env.DAYWELL_AUTH_SECRET, from = env.DAYWELL_EMAIL_FROM;
  try {
    if (!origin || new URL(origin).origin !== origin || !origin.startsWith('https://')) return null;
  } catch { return null; }
  if (!secret || secret.length < 32 || !env.DB || !from || !emailSchema.safeParse(from).success) return null;
  const reviewEmail = emailSchema.safeParse(env.DAYWELL_REVIEW_EMAIL), reviewCode = env.DAYWELL_REVIEW_CODE ?? '';
  const email = env.EMAIL;
  const signIn: SignInSettings = {
    secret,
    review: reviewEmail.success && /^\d{6}$/.test(reviewCode) ? { email: reviewEmail.data, code: reviewCode } : null,
    async send(message: SignInEmail) {
      if (!email) throw new Error('Email sending is not connected.');
      await email.send({ from: { email: from, name: appName }, to: message.to, subject: message.subject, text: message.text, html: message.html });
    },
  };
  return { origin, db: env.DB, signIn };
}
type Settings = NonNullable<ReturnType<typeof settingsFrom>>;

function plain(body: string, status: number) {
  return new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
}
function json(body: unknown, status = 200, cookie?: string) {
  const headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' });
  if (cookie) headers.set('Set-Cookie', cookie);
  return new Response(JSON.stringify(body), { status, headers });
}
function harden(response: Response, cacheControl?: string) {
  const out = new Response(response.body, response);
  if (cacheControl) out.headers.set('Cache-Control', cacheControl);
  out.headers.set('X-Content-Type-Options', 'nosniff');
  out.headers.set('Referrer-Policy', 'same-origin');
  out.headers.set('Content-Security-Policy', "frame-ancestors 'none'");
  return out;
}

const cookieParts = (request: Request) => (request.headers.get('cookie') ?? '').split(';').map(part => part.trim()).filter(Boolean);
function sessionToken(request: Request) {
  const found = cookieParts(request).find(part => part.startsWith(`${sessionCookie}=`));
  return found ? found.slice(sessionCookie.length + 1) : null;
}
// The forwarded request carries the verified identity, or none, and never the session cookie.
function forward(request: Request, session: Session | null) {
  const headers = new Headers(request.headers);
  for (const name of Array.from(headers.keys())) if (name.startsWith('oai-authenticated-user-')) headers.delete(name);
  const others = cookieParts(request).filter(part => !part.startsWith(`${sessionCookie}=`));
  if (others.length) headers.set('cookie', others.join('; '));
  else headers.delete('cookie');
  if (session) {
    headers.set('oai-authenticated-user-id', session.userId);
    headers.set('oai-authenticated-user-email', session.email);
    headers.set('oai-authenticated-user-plan', session.plan);
  }
  return new Request(request, { headers });
}

function returnPath(value: string | null, origin: string) {
  if (!value?.startsWith('/') || value.startsWith('//')) return '/';
  const url = new URL(value, origin);
  if (url.origin !== origin || /^\/(?:sign-in|signin-with-chatgpt|signout-with-chatgpt|callback|cdn-cgi|api)(?:\/|$)/.test(url.pathname)) return '/';
  return `${url.pathname}${url.search}${url.hash}`;
}

async function readJson(request: Request) {
  if (!/^application\/json\b/i.test(request.headers.get('content-type') ?? '')) return null;
  const body = await readLimited(request, 2048);
  if (!body) return null;
  try {
    const value: unknown = JSON.parse(new TextDecoder().decode(body));
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
  } catch { return null; }
}

async function sendCode(request: Request, settings: Settings, now: number) {
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
  if (!sameOrigin(request)) return json({ error: 'Request origin is not allowed.' }, 403);
  const body = await readJson(request);
  const result = await sendSignInCode(settings.db, settings.signIn, { email: body?.email, network: request.headers.get('cf-connecting-ip') }, now);
  if (result === 'sent') return json({ ok: true });
  if (result === 'busy') return json({ error: messages.codeBusy }, 429);
  if (result === 'unavailable') return json({ error: messages.unavailable }, 503);
  return json({ error: messages.email }, 400);
}

async function verifyCode(request: Request, settings: Settings, previous: string | null, now: number) {
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
  if (!sameOrigin(request)) return json({ error: 'Request origin is not allowed.' }, 403);
  const body = await readJson(request);
  const result = await verifySignInCode(settings.db, settings.signIn, { email: body?.email, code: body?.code }, now);
  if (result.status === 'signed-in') {
    // Signing in on a device signs the account that was open there out.
    await endSession(settings.db, previous);
    return json({ ok: true, created: result.created }, 200, sessionSetting(result.token));
  }
  if (result.status === 'wrong') return json({ error: messages.wrong, triesLeft: result.triesLeft }, 400);
  if (result.status === 'expired') return json({ error: messages.expired }, 400);
  if (result.status === 'busy') return json({ error: messages.tryBusy }, 429);
  return json({ error: messages.code }, 400);
}

async function signOut(request: Request, settings: Settings, token: string | null) {
  if (request.method === 'POST') {
    if (!sameOrigin(request)) return json({ error: 'Request origin is not allowed.' }, 403);
  } else if (request.method === 'GET') {
    // A link on another site can't sign someone out; only Daywell's own pages or a typed address can.
    const site = request.headers.get('sec-fetch-site');
    if (site && site !== 'same-origin' && site !== 'none') return plain('Sign out from inside Daywell.', 403);
  } else {
    return plain('Method not allowed.', 405);
  }
  await endSession(settings.db, token);
  if (request.method === 'POST') return json({ ok: true }, 200, sessionClearing);
  // The sign-in page says they are signed out and that their records are kept.
  return new Response(null, { status: 303, headers: { Location: `${settings.origin}/sign-in?signed_out=1`, 'Cache-Control': 'private, no-store', 'Set-Cookie': sessionClearing } });
}

export async function handlePublicCloudflareRequest(
  request: Request,
  env: PublicEnvironment,
  next: (identifiedRequest: Request) => Promise<Response>,
  clock: () => number = Date.now,
): Promise<Response> {
  const settings = settingsFrom(env);
  if (!settings) return plain("Daywell's sign-in is not configured yet.", 503);
  const url = new URL(request.url);
  if (url.origin !== settings.origin) return plain("Use Daywell's own address.", 403);
  if (url.pathname.startsWith('/__daywell/') || url.pathname === '/callback') return plain('Not found.', 404);

  const token = sessionToken(request);
  // A database outage gets a plain message, never a raw error page.
  try {
    if (url.pathname === '/api/sign-in/code') return await sendCode(request, settings, clock());
    if (url.pathname === '/api/sign-in/verify') return await verifyCode(request, settings, token, clock());
    if (url.pathname === '/api/sign-out' || url.pathname === '/signout-with-chatgpt') return await signOut(request, settings, token);
  } catch {
    return json({ error: messages.trouble }, 503);
  }
  if ((request.method === 'GET' || request.method === 'HEAD') && publicFiles.test(url.pathname)) return harden(await next(forward(request, null)));

  let session: Session | null;
  try {
    session = await readSession(settings.db, token, clock());
  } catch {
    return plain(messages.trouble, 503);
  }
  if (url.pathname === '/signin-with-chatgpt') {
    const back = returnPath(url.searchParams.get('return_to'), settings.origin);
    const location = session ? back : `/sign-in?return_to=${encodeURIComponent(back)}`;
    return new Response(null, { status: 303, headers: { Location: `${settings.origin}${location}`, 'Cache-Control': 'private, no-store' } });
  }
  const recording = recordings.test(url.pathname);
  if (recording) {
    if (!session) return plain('Sign in to play recordings.', 401);
    if (!allows(session.plan, 'recordings')) return plain(planMessages.recordings, 402);
  }
  const answer = await next(forward(request, session));
  // Recording names include a hash of their content, so a signed-in device may keep them for a week.
  const kept = recording && (answer.status === 200 || answer.status === 206);
  const response = harden(answer, kept ? 'private, max-age=604800' : 'private, no-store');
  if (session?.extended && token) response.headers.append('Set-Cookie', sessionSetting(token));
  return response;
}
