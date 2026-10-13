import test from 'node:test';
import assert from 'node:assert/strict';
import { cantCheck, cantSend, codeDigits, codeProblem, looksLikeEmail, offline, signInRequest } from '../lib/sign-in-client.ts';

test('the screens check an address loosely and keep only the digits of a code', () => {
  for (const good of ['sam@example.com', ' Sam@Example.co.uk ', 'a.b+c@d.io']) assert.equal(looksLikeEmail(good), true, good);
  for (const bad of ['', 'sam', 'sam@', 'sam@example', 'sam example@x.com', '@example.com']) assert.equal(looksLikeEmail(bad), false, bad);
  assert.equal(codeDigits('246 810'), '246810');
  assert.equal(codeDigits('Your code is 246810.'), '246810');
  assert.equal(codeDigits('24681099'), '246810');
  assert.equal(codeDigits('abc'), '');
});

function fakeFetch(status, body, seen = []) {
  return async (path, init) => {
    seen.push({ path, init });
    return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  };
}

test('requests are same-origin JSON posts, and the server’s own messages are shown', async () => {
  const seen = [];
  const sent = await signInRequest('/api/sign-in/code', { email: 'sam@example.com' }, cantSend, fakeFetch(200, { ok: true }, seen));
  assert.deepEqual(sent, { ok: true, status: 200, error: cantSend, triesLeft: undefined, created: false });
  assert.equal(seen[0].path, '/api/sign-in/code');
  assert.equal(seen[0].init.method, 'POST');
  assert.equal(seen[0].init.headers['Content-Type'], 'application/json');
  assert.equal(seen[0].init.body, '{"email":"sam@example.com"}');

  const created = await signInRequest('/api/sign-in/verify', {}, cantCheck, fakeFetch(200, { ok: true, created: true }));
  assert.equal(created.created, true);
  const busy = await signInRequest('/api/sign-in/code', {}, cantSend, fakeFetch(429, { error: "You've asked for several codes. Wait a few minutes, then try again." }));
  assert.equal(busy.ok, false);
  assert.equal(busy.error, "You've asked for several codes. Wait a few minutes, then try again.");
});

test('broken answers and lost connections still get a plain message', async () => {
  assert.equal((await signInRequest('/api/sign-in/code', {}, cantSend, fakeFetch(502, '<html>Bad gateway</html>'))).error, cantSend);
  assert.equal((await signInRequest('/api/sign-in/verify', {}, cantCheck, fakeFetch(200, { ok: false }))).error, cantCheck);
  assert.equal((await signInRequest('/api/sign-in/verify', {}, cantCheck, fakeFetch(200, { error: 'Odd' }))).ok, false, 'success needs ok: true');
  const lost = await signInRequest('/api/sign-in/code', {}, cantSend, async () => { throw new TypeError('Failed to fetch'); });
  assert.deepEqual(lost, { ok: false, status: 0, error: offline });
});

test('a wrong code says how many tries are left, and when the code has run out', () => {
  const wrong = { ok: false, status: 400, error: "That code isn't right. Check the newest email from Daywell." };
  assert.equal(codeProblem({ ...wrong, triesLeft: 3 }), "That code isn't right. Check the newest email from Daywell. 3 tries left.");
  assert.equal(codeProblem({ ...wrong, triesLeft: 1 }), "That code isn't right. Check the newest email from Daywell. 1 try left.");
  assert.equal(codeProblem({ ...wrong, triesLeft: 0 }), "That code isn't right, and it has now expired. Ask for a new one.");
  assert.equal(codeProblem({ ok: false, status: 400, error: 'That code has expired. Ask for a new one.' }), 'That code has expired. Ask for a new one.');
});
