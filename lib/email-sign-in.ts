import { z } from 'zod';
import { everyone, limitWindow, returnAllowances, takeAllowances, type LimitedFeature } from './request-guards.ts';

// Email sign-in for the public app (owner, 13 October 2026). A person types their address, gets a 6-digit code by
// email and types it back; their first code creates the account. There are no passwords, and no Google or Facebook
// sign-in, which would also require Sign in with Apple (App Review 4.8). See docs/sign-in.md.

export const appName = 'Daywell';
export const codeLifetimeMs = 10 * 60 * 1000;
export const triesPerCode = 5;
export const sessionLifetimeMs = 90 * 24 * 60 * 60 * 1000;
// A session in use is extended at most once a day, so checking it rarely writes to the database.
const extendAfterMs = 24 * 60 * 60 * 1000;

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254));
// People often paste codes with a space or dash in the middle.
export const codeSchema = z.string().transform(value => value.replace(/[\s-]/g, '')).pipe(z.string().regex(/^\d{6}$/));

export type SignInEmail = { to: string; subject: string; text: string; html: string };
export type SignInSettings = {
  // Keys the stored hashes. Without it, nobody can work back from the database to an address or a code.
  secret: string;
  send: (email: SignInEmail) => Promise<void>;
  // The App Review account (Apple 2.1): this address signs in with a fixed code and is never emailed.
  review?: { email: string; code: string } | null;
};
type Store = Pick<D1Database, 'prepare' | 'batch'>;

const encoder = new TextEncoder();
const hex = (bytes: ArrayBuffer | Uint8Array) => Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
const keys = new Map<string, Promise<CryptoKey>>();
async function keyedHash(secret: string, value: string) {
  let key = keys.get(secret);
  if (!key) {
    key = crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    keys.set(secret, key);
  }
  return hex(await crypto.subtle.sign('HMAC', await key, encoder.encode(value)));
}
const sha256 = async (value: string) => hex(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
// Compares in the same time whatever the input, so response times don't reveal how much of a code matched.
function sameText(a: string, b: string) {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index++) difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return difference === 0;
}

// Every code is equally likely: 4,294,000,000 is the largest multiple of a million below 2³².
export function newCode() {
  const value = new Uint32Array(1);
  do crypto.getRandomValues(value); while (value[0] >= 4_294_000_000);
  return String(value[0] % 1_000_000).padStart(6, '0');
}
// 32 random bytes, so a session can't be guessed. Only its hash is stored.
function newToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}
const tokenPattern = /^[A-Za-z0-9_-]{43}$/;
const reviewAccount = (settings: SignInSettings, email: string) => (settings.review?.email === email ? settings.review : null);

export function signInEmail(to: string, code: string): SignInEmail {
  const note = "It works for 10 minutes. If you didn't ask for it, you can ignore this email: nobody can sign in without the code.";
  return {
    to,
    subject: `${code} is your ${appName} code`,
    text: `Your ${appName} sign-in code is ${code}.\n\n${note}\n`,
    html: `<!doctype html><html><body style="font-family:system-ui,sans-serif;color:#1d2420;line-height:1.5"><p>Your ${appName} sign-in code is</p><p style="font-size:30px;font-weight:700;letter-spacing:6px;margin:8px 0 16px">${code}</p><p>${note}</p></body></html>`,
  };
}

export type CodeResult = 'sent' | 'invalid' | 'busy' | 'unavailable';
// `network` is the visitor's IP address. Only a keyed hash of it is used, to limit codes sent from one place.
export async function sendSignInCode(db: Store, settings: SignInSettings, input: { email: unknown; network?: string | null }, now = Date.now()): Promise<CodeResult> {
  const parsed = emailSchema.safeParse(input.email);
  if (!parsed.success) return 'invalid';
  const email = parsed.data;
  if (reviewAccount(settings, email)) return 'sent';
  const emailKey = await keyedHash(settings.secret, `email:${email}`);
  const uses: [string, LimitedFeature][] = [[`sign-in:${emailKey}`, 'sign-in-email-hour'], [`sign-in:${emailKey}`, 'sign-in-email-day']];
  if (input.network) uses.push([`network:${await keyedHash(settings.secret, `network:${input.network}`)}`, 'sign-in-network']);
  uses.push([everyone, 'sign-in-all']);
  if (await takeAllowances(db, uses, now)) return 'busy';
  const code = newCode();
  // A new code replaces any earlier one for the same address.
  await db.prepare('INSERT INTO sign_in_codes(email_key,code_hash,expires_at,attempts) VALUES(?,?,?,0) ON CONFLICT(email_key) DO UPDATE SET code_hash=excluded.code_hash, expires_at=excluded.expires_at, attempts=0')
    .bind(emailKey, await keyedHash(settings.secret, `code:${emailKey}:${code}`), now + codeLifetimeMs).run();
  try {
    await settings.send(signInEmail(email, code));
    return 'sent';
  } catch {
    // Nothing was sent, so nothing counts, and the person can try again straight away.
    await returnAllowances(db, uses, now);
    return 'unavailable';
  }
}

export type VerifyResult =
  | { status: 'signed-in'; token: string; userId: string; created: boolean }
  | { status: 'wrong'; triesLeft: number }
  | { status: 'invalid' | 'expired' | 'busy' };
export async function verifySignInCode(db: Store, settings: SignInSettings, input: { email: unknown; code: unknown }, now = Date.now()): Promise<VerifyResult> {
  const email = emailSchema.safeParse(input.email), code = codeSchema.safeParse(input.code);
  if (!email.success || !code.success) return { status: 'invalid' };
  const emailKey = await keyedHash(settings.secret, `email:${email.data}`);
  // Every try counts until one succeeds, so guesses stay limited however many codes are requested.
  const tries: [string, LimitedFeature][] = [[`sign-in:${emailKey}`, 'sign-in-try']];
  if (await takeAllowances(db, tries, now)) return { status: 'busy' };
  const review = reviewAccount(settings, email.data);
  if (review) {
    if (!sameText(code.data, review.code)) return { status: 'wrong', triesLeft: triesPerCode };
  } else {
    const live = await db.prepare('UPDATE sign_in_codes SET attempts=attempts+1 WHERE email_key=? AND expires_at>? AND attempts<? RETURNING code_hash, attempts')
      .bind(emailKey, now, triesPerCode).first<{ code_hash: string; attempts: number }>();
    if (!live) return { status: 'expired' };
    if (!sameText(live.code_hash, await keyedHash(settings.secret, `code:${emailKey}:${code.data}`))) return { status: 'wrong', triesLeft: triesPerCode - Number(live.attempts) };
    // A code works once. If two devices race with it, only one is signed in.
    const used = await db.prepare('DELETE FROM sign_in_codes WHERE email_key=? AND code_hash=? RETURNING email_key').bind(emailKey, live.code_hash).first();
    if (!used) return { status: 'expired' };
  }
  await returnAllowances(db, tries, now);

  const at = new Date(now).toISOString(), token = newToken();
  const candidate = `dw:${hex(crypto.getRandomValues(new Uint8Array(16)))}`;
  await db.batch([
    db.prepare('INSERT INTO accounts(user_id,email,created_at,signed_in_at) VALUES(?,?,?,?) ON CONFLICT(email) DO UPDATE SET signed_in_at=excluded.signed_in_at')
      .bind(candidate, email.data, at, at),
    db.prepare('INSERT INTO sessions(token_hash,user_id,created_at,seen_at,expires_at) SELECT ?,user_id,?,?,? FROM accounts WHERE email=?')
      .bind(await sha256(token), now, now, now + sessionLifetimeMs, email.data),
  ]);
  const account = await db.prepare('SELECT user_id FROM accounts WHERE email=?').bind(email.data).first<{ user_id: string }>();
  if (!account) throw new Error('The account was not saved.');
  return { status: 'signed-in', token, userId: account.user_id, created: account.user_id === candidate };
}

export type Session = { userId: string; email: string; extended: boolean };
// `extended` means the session was renewed for another 90 days, so the cookie should be sent again.
export async function readSession(db: Pick<D1Database, 'prepare'>, token: string | null | undefined, now = Date.now()): Promise<Session | null> {
  if (!token || !tokenPattern.test(token)) return null;
  const tokenHash = await sha256(token);
  const row = await db.prepare('SELECT s.user_id AS userId, a.email AS email, s.seen_at AS seenAt FROM sessions s JOIN accounts a ON a.user_id=s.user_id WHERE s.token_hash=? AND s.expires_at>?')
    .bind(tokenHash, now).first<{ userId: string; email: string; seenAt: number }>();
  if (!row) return null;
  const extended = now - Number(row.seenAt) >= extendAfterMs;
  if (extended) await db.prepare('UPDATE sessions SET seen_at=?, expires_at=? WHERE token_hash=?').bind(now, now + sessionLifetimeMs, tokenHash).run();
  return { userId: row.userId, email: row.email, extended };
}

export async function endSession(db: Pick<D1Database, 'prepare'>, token: string | null | undefined) {
  if (!token || !tokenPattern.test(token)) return;
  await db.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await sha256(token)).run();
}

// Run daily by the Worker's scheduled trigger: expired codes and sessions go, and so do the sign-in protection
// counts from finished windows, which are keyed by address and would otherwise build up.
const signInLimits = ['sign-in-email-hour', 'sign-in-email-day', 'sign-in-network', 'sign-in-all', 'sign-in-try'] as const;
export async function purgeExpiredSignIns(db: Store, now = Date.now()) {
  await db.batch([
    db.prepare('DELETE FROM sign_in_codes WHERE expires_at<=?').bind(now),
    db.prepare('DELETE FROM sessions WHERE expires_at<=?').bind(now),
    ...signInLimits.map(feature => db.prepare('DELETE FROM usage_limits WHERE feature=? AND window<?').bind(feature, limitWindow(feature, now))),
  ]);
}
