import test from 'node:test';
import assert from 'node:assert/strict';
import { handlePublicCloudflareRequest, sessionCookie } from '../lib/public-access.ts';
import { readSession } from '../lib/email-sign-in.ts';
import { signInStore, testSecret } from './fixtures/sign-in-db.mjs';

const origin = 'https://daywell-public.test', day = 86_400_000;
let clock;

function setup(extra = {}) {
  clock = Date.parse('2026-10-13T12:00:00Z');
  const store = signInStore(), outbox = [];
  const env = {
    DAYWELL_APP_ORIGIN: origin, DAYWELL_AUTH_SECRET: testSecret, DAYWELL_EMAIL_FROM: 'sign-in@daywell-public.test', DB: store.db,
    EMAIL: { send: async message => { outbox.push(message); return { messageId: `m${outbox.length}` }; } },
    ...extra,
  };
  async function call(path, { method = 'GET', body, headers = {}, cookie, raw } = {}) {
    let received;
    const json = body !== undefined;
    const request = new Request(`${path.startsWith('http') ? '' : origin}${path}`, {
      method, body: raw ?? (json ? JSON.stringify(body) : undefined),
      headers: { ...(json ? { 'content-type': 'application/json', origin, 'sec-fetch-site': 'same-origin' } : {}), ...(cookie ? { cookie } : {}), ...headers },
    });
    const response = await handlePublicCloudflareRequest(request, env, async forwarded => {
      received = forwarded;
      return new Response('from the app', { headers: { 'Cache-Control': 'public, max-age=300' } });
    }, () => clock);
    return { response, received, body: response.headers.get('content-type')?.includes('json') ? await response.json() : await response.text() };
  }
  const code = () => outbox.at(-1).subject.slice(0, 6);
  async function signIn(email = 'sam@example.com', cookie) {
    await call('/api/sign-in/code', { method: 'POST', body: { email } });
    const { response } = await call('/api/sign-in/verify', { method: 'POST', body: { email, code: code() }, cookie });
    const setCookie = response.headers.get('set-cookie');
    return { setCookie, cookie: setCookie.split(';')[0] };
  }
  return { ...store, env, outbox, call, code, signIn };
}
const identity = request => [request.headers.get('oai-authenticated-user-id'), request.headers.get('oai-authenticated-user-email')];

test('a code by email signs the person in with a secure cookie, and the app receives their identity', async () => {
  const { call, outbox, signIn } = setup();
  const sent = await call('/api/sign-in/code', { method: 'POST', body: { email: 'Sam@Example.com' } });
  assert.equal(sent.response.status, 200);
  assert.deepEqual(sent.body, { ok: true });
  assert.equal(sent.received, undefined, 'sign-in never reaches the app');
  assert.deepEqual(outbox[0].from, { email: 'sign-in@daywell-public.test', name: 'Daywell' });
  assert.equal(outbox[0].to, 'sam@example.com');

  const { setCookie, cookie } = await signIn('sam@example.com');
  assert.match(setCookie, new RegExp(`^${sessionCookie}=[A-Za-z0-9_-]{43}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=7776000$`));
  const page = await call('/api/state', { cookie: `theme=calm; ${cookie}; other=1` });
  assert.equal(page.response.status, 200);
  const [userId, email] = identity(page.received);
  assert.match(userId, /^dw:[a-f0-9]{32}$/);
  assert.equal(email, 'sam@example.com');
  assert.equal(page.received.headers.get('cookie'), 'theme=calm; other=1', 'the session token never reaches the app');
  assert.equal(page.response.headers.get('cache-control'), 'private, no-store');
  assert.equal(page.response.headers.get('content-security-policy'), "frame-ancestors 'none'");
  assert.equal(page.response.headers.get('set-cookie'), null);
});

test('headers claiming an identity never reach the app', async () => {
  const { call, signIn } = setup();
  const spoof = { 'oai-authenticated-user-id': 'victim', 'oai-authenticated-user-email': 'victim@example.com', 'oai-authenticated-user-full-name': 'Victim', 'oai-authenticated-user-full-name-encoding': 'percent-encoded-utf-8' };
  for (const path of ['/', '/api/state', '/api/food', '/eat']) {
    const { received } = await call(path, { headers: { ...spoof, cookie: '__sites_local_auth=1' } });
    assert.deepEqual(identity(received), [null, null], path);
    assert.equal(received.headers.get('oai-authenticated-user-full-name'), null);
  }
  const { cookie } = await signIn('sam@example.com');
  const { received } = await call('/api/state', { headers: spoof, cookie });
  assert.equal(identity(received)[1], 'sam@example.com');
  assert.notEqual(identity(received)[0], 'victim');
  assert.equal(received.headers.get('oai-authenticated-user-full-name'), null);
  const forged = await call('/api/state', { cookie: `${sessionCookie}=${'A'.repeat(43)}` });
  assert.deepEqual(identity(forged.received), [null, null]);
});

test('missing settings, other addresses and local-only paths fail closed', async () => {
  const store = signInStore();
  const good = { DAYWELL_APP_ORIGIN: origin, DAYWELL_AUTH_SECRET: testSecret, DAYWELL_EMAIL_FROM: 'sign-in@daywell-public.test', DB: store.db };
  for (const env of [{}, { ...good, DAYWELL_AUTH_SECRET: 'too-short' }, { ...good, DB: undefined }, { ...good, DAYWELL_EMAIL_FROM: 'not an address' },
    { ...good, DAYWELL_APP_ORIGIN: 'http://daywell-public.test' }, { ...good, DAYWELL_APP_ORIGIN: `${origin}/app` }]) {
    let reached = false;
    const response = await handlePublicCloudflareRequest(new Request(`${origin}/`), env, async () => { reached = true; return new Response(); });
    assert.equal(response.status, 503);
    assert.equal(reached, false);
  }
  const { call } = setup();
  assert.equal((await call('https://daywell-public.workers.dev/')).response.status, 403);
  for (const path of ['/__daywell/local-voice-setup', '/callback']) {
    const { response, received } = await call(path);
    assert.equal(response.status, 404);
    assert.equal(received, undefined);
  }
});

test('sign-in requests must be same-site JSON posts with a valid address', async () => {
  const { call, outbox } = setup();
  assert.equal((await call('/api/sign-in/code')).response.status, 405);
  const crossSite = await call('/api/sign-in/code', { method: 'POST', body: { email: 'sam@example.com' }, headers: { origin: 'https://evil.example', 'sec-fetch-site': 'cross-site' } });
  assert.equal(crossSite.response.status, 403);
  const notJson = await call('/api/sign-in/code', { method: 'POST', raw: 'email=sam@example.com', headers: { origin, 'content-type': 'application/x-www-form-urlencoded' } });
  assert.equal(notJson.response.status, 400);
  const huge = await call('/api/sign-in/code', { method: 'POST', body: { email: 'sam@example.com', padding: 'x'.repeat(5000) } });
  assert.equal(huge.response.status, 400);
  const bad = await call('/api/sign-in/code', { method: 'POST', body: { email: 'sam' } });
  assert.equal(bad.response.status, 400);
  assert.equal(bad.body.error, 'Enter your email address, like name@example.com.');
  assert.equal(outbox.length, 0);
});

test('wrong, expired and too many codes get plain answers', async () => {
  const { call, code } = setup();
  await call('/api/sign-in/code', { method: 'POST', body: { email: 'sam@example.com' } });
  const right = code(), wrong = String((Number(right) + 1) % 1e6).padStart(6, '0');
  const first = await call('/api/sign-in/verify', { method: 'POST', body: { email: 'sam@example.com', code: wrong } });
  assert.equal(first.response.status, 400);
  assert.deepEqual(first.body, { error: "That code isn't right. Check the newest email from Daywell.", triesLeft: 4 });
  assert.equal(first.response.headers.get('set-cookie'), null);
  const shape = await call('/api/sign-in/verify', { method: 'POST', body: { email: 'sam@example.com', code: '12' } });
  assert.equal(shape.body.error, 'Enter the 6-digit code from the email.');
  clock += 11 * 60_000;
  const late = await call('/api/sign-in/verify', { method: 'POST', body: { email: 'sam@example.com', code: right } });
  assert.equal(late.body.error, 'That code has expired. Ask for a new one.');
  for (let index = 0; index < 4; index++) await call('/api/sign-in/code', { method: 'POST', body: { email: 'sam@example.com' } });
  const busy = await call('/api/sign-in/code', { method: 'POST', body: { email: 'sam@example.com' } });
  assert.equal(busy.response.status, 429);
  assert.equal(busy.body.error, "You've asked for several codes. Wait a few minutes, then try again.");
});

test('when email sending fails, the person is told to try again shortly', async () => {
  const { call } = setup({ EMAIL: { send: async () => { const error = new Error('limit'); error.code = 'E_DAILY_LIMIT_EXCEEDED'; throw error; } } });
  const failed = await call('/api/sign-in/code', { method: 'POST', body: { email: 'sam@example.com' } });
  assert.equal(failed.response.status, 503);
  assert.equal(failed.body.error, "We couldn't send a code just now. Try again in a few minutes.");
  const { call: unconnected } = setup({ EMAIL: undefined });
  assert.equal((await unconnected('/api/sign-in/code', { method: 'POST', body: { email: 'sam@example.com' } })).response.status, 503);
});

test('signing in on a device signs the previous account out of it', async () => {
  const { db, signIn } = setup();
  const first = await signIn('sam@example.com');
  const firstToken = first.cookie.split('=')[1];
  assert.ok(await readSession(db, firstToken, clock));
  const second = await signIn('ali@example.com', first.cookie);
  assert.equal(await readSession(db, firstToken, clock), null);
  assert.equal((await readSession(db, second.cookie.split('=')[1], clock)).email, 'ali@example.com');
});

test('sign-out works from Daywell itself, but not from a link on another site', async () => {
  const { db, call, signIn } = setup();
  const { cookie } = await signIn();
  const token = cookie.split('=')[1];
  const crossPost = await call('/api/sign-out', { method: 'POST', cookie, headers: { origin: 'https://evil.example', 'sec-fetch-site': 'cross-site' } });
  assert.equal(crossPost.response.status, 403);
  const crossLink = await call('/signout-with-chatgpt', { cookie, headers: { 'sec-fetch-site': 'cross-site' } });
  assert.equal(crossLink.response.status, 403);
  assert.ok(await readSession(db, token, clock), 'still signed in');

  const link = await call('/signout-with-chatgpt', { cookie, headers: { 'sec-fetch-site': 'same-origin' } });
  assert.equal(link.response.status, 303);
  assert.equal(link.response.headers.get('location'), `${origin}/`);
  assert.equal(link.response.headers.get('set-cookie'), `${sessionCookie}=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0`);
  assert.equal(await readSession(db, token, clock), null);

  const again = await signIn();
  const posted = await call('/api/sign-out', { method: 'POST', body: {}, cookie: again.cookie });
  assert.equal(posted.response.status, 200);
  assert.match(posted.response.headers.get('set-cookie'), /Max-Age=0$/);
  assert.equal(await readSession(db, again.cookie.split('=')[1], clock), null);
});

test('the sign-in link sends signed-out people to the sign-in page and keeps return paths on Daywell', async () => {
  const { call, signIn } = setup();
  const out = await call('/signin-with-chatgpt?return_to=%2Feat%3Ftab%3Dbasket');
  assert.equal(out.response.status, 303);
  assert.equal(out.response.headers.get('location'), `${origin}/sign-in?return_to=%2Feat%3Ftab%3Dbasket`);
  for (const target of ['https://evil.example', '//evil.example', '/\\evil.example', '/sign-in', '/api/state', '/signout-with-chatgpt']) {
    const { response } = await call(`/signin-with-chatgpt?return_to=${encodeURIComponent(target)}`);
    assert.equal(response.headers.get('location'), `${origin}/sign-in?return_to=%2F`, target);
  }
  const { cookie } = await signIn();
  const back = await call('/signin-with-chatgpt?return_to=%2Feat', { cookie });
  assert.equal(back.response.headers.get('location'), `${origin}/eat`);
});

test('built files skip the session and keep their caching; recordings need an account', async () => {
  const { call, signIn } = setup();
  const { cookie } = await signIn();
  for (const path of ['/_next/static/chunks/app.js', '/fonts/lexend.woff2', '/companions/fox.png', '/favicon.svg']) {
    const { response, received } = await call(path, { cookie });
    assert.equal(response.status, 200, path);
    assert.deepEqual(identity(received), [null, null], path);
    assert.equal(received.headers.get('cookie'), null);
    assert.equal(response.headers.get('cache-control'), 'public, max-age=300', path);
  }
  const signedOut = await call('/sleep-sounds/forest-night-daa3cc2ffc25.mp3');
  assert.equal(signedOut.response.status, 401);
  assert.equal(signedOut.received, undefined);
  const signedIn = await call('/sleep-sounds/forest-night-daa3cc2ffc25.mp3', { cookie });
  assert.equal(signedIn.response.status, 200);
  assert.equal(signedIn.response.headers.get('cache-control'), 'private, max-age=604800');
});

test('a session in use is renewed once a day, and the cookie is sent again', async () => {
  const { call, signIn } = setup();
  const { cookie } = await signIn();
  assert.equal((await call('/api/state', { cookie })).response.headers.get('set-cookie'), null);
  clock += day + 1;
  const renewed = await call('/api/state', { cookie });
  assert.equal(renewed.response.headers.get('set-cookie'), `${cookie}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=7776000`);
  assert.equal((await call('/api/state', { cookie })).response.headers.get('set-cookie'), null);
});

test('the App Review address signs in with the fixed code, only when the code is well formed', async () => {
  const review = { DAYWELL_REVIEW_EMAIL: 'review@daywell-public.test', DAYWELL_REVIEW_CODE: '246810' };
  const { call, outbox } = setup(review);
  assert.equal((await call('/api/sign-in/code', { method: 'POST', body: { email: 'review@daywell-public.test' } })).response.status, 200);
  assert.equal(outbox.length, 0);
  const signedIn = await call('/api/sign-in/verify', { method: 'POST', body: { email: 'review@daywell-public.test', code: '246810' } });
  assert.equal(signedIn.response.status, 200);
  assert.match(signedIn.response.headers.get('set-cookie'), new RegExp(`^${sessionCookie}=`));
  const weak = setup({ ...review, DAYWELL_REVIEW_CODE: '2468' });
  await weak.call('/api/sign-in/code', { method: 'POST', body: { email: 'review@daywell-public.test' } });
  assert.equal(weak.outbox.length, 1, 'a malformed review code switches the review account off');
  assert.equal((await weak.call('/api/sign-in/verify', { method: 'POST', body: { email: 'review@daywell-public.test', code: '246810' } })).response.status, 400);
});

test('a database outage gets a plain message instead of an error page', async () => {
  const broken = { prepare() { throw new Error('D1_ERROR: network'); }, batch: async () => { throw new Error('D1_ERROR: network'); } };
  const { call } = setup({ DB: broken });
  const code = await call('/api/sign-in/code', { method: 'POST', body: { email: 'sam@example.com' } });
  assert.equal(code.response.status, 503);
  assert.equal(code.body.error, "Daywell can't reach its records just now. Please try again in a minute.");
  const page = await call('/eat', { cookie: `${sessionCookie}=${'A'.repeat(43)}` });
  assert.equal(page.response.status, 503);
  assert.equal(page.received, undefined);
  assert.equal((await call('/_next/static/app.js')).response.status, 200, 'built files need no database');
});
