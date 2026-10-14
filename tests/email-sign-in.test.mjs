import test from 'node:test';
import assert from 'node:assert/strict';
import { codeLifetimeMs, endSession, newCode, purgeExpiredSignIns, readSession, sendSignInCode, sessionLifetimeMs, triesPerCode, verifySignInCode } from '../lib/email-sign-in.ts';
import { everyone, limits, limitWindow } from '../lib/request-guards.ts';
import { signInStore, testSecret } from './fixtures/sign-in-db.mjs';

const now = Date.parse('2026-10-13T12:00:00Z'), minute = 60_000, hour = 60 * minute, day = 24 * hour;
function mailbox() {
  const sent = [];
  return { sent, send: async message => { sent.push(message); }, code: () => sent.at(-1).subject.slice(0, 6) };
}
const settings = (box, extra = {}) => ({ secret: testSecret, send: box.send, review: null, ...extra });
const wrongCode = code => String((Number(code) + 1) % 1_000_000).padStart(6, '0');

test('codes are six digits, from the whole range', () => {
  const codes = Array.from({ length: 2000 }, newCode);
  assert.ok(codes.every(code => /^\d{6}$/.test(code)));
  assert.ok(new Set(codes).size > 1990);
  assert.ok(codes.some(code => code.startsWith('0')), 'leading zeros are kept');
});

test('a code is emailed, works once, and the first one creates the account', async () => {
  const { db, rows } = signInStore(), box = mailbox(), options = settings(box);
  assert.equal(await sendSignInCode(db, options, { email: '  Sam@Example.COM ', network: '203.0.113.9' }, now), 'sent');
  assert.equal(box.sent.length, 1);
  const [message] = box.sent, code = box.code();
  assert.equal(message.to, 'sam@example.com');
  assert.match(message.subject, /^\d{6} is your Daywell code$/);
  assert.match(message.text, new RegExp(`code is ${code}\\.[\\s\\S]*10 minutes`));
  assert.match(message.html, new RegExp(`>${code}<`));
  // Neither the address nor the code can be read from the database.
  const stored = JSON.stringify([rows('sign_in_codes'), rows('usage_limits')]);
  assert.doesNotMatch(stored, /sam@example\.com|203\.0\.113\.9/);
  assert.doesNotMatch(JSON.stringify(rows('sign_in_codes')), new RegExp(code));

  const first = await verifySignInCode(db, options, { email: 'sam@example.com', code: `${code.slice(0, 3)} ${code.slice(3)}` }, now + minute);
  assert.equal(first.status, 'signed-in');
  assert.equal(first.created, true);
  assert.match(first.userId, /^dw:[a-f0-9]{32}$/);
  assert.match(first.token, /^[A-Za-z0-9_-]{43}$/);
  assert.deepEqual(rows('accounts').map(row => [row.user_id, row.email]), [[first.userId, 'sam@example.com']]);
  assert.equal(rows('sessions').length, 1);
  assert.doesNotMatch(JSON.stringify(rows('sessions')), new RegExp(first.token));
  assert.equal(rows('sign_in_codes').length, 0, 'a used code is removed');
  assert.deepEqual(await verifySignInCode(db, options, { email: 'sam@example.com', code }, now + minute), { status: 'expired' });

  await sendSignInCode(db, options, { email: 'SAM@example.com' }, now + 2 * minute);
  const again = await verifySignInCode(db, options, { email: 'sam@example.com', code: box.code() }, now + 3 * minute);
  assert.equal(again.status, 'signed-in');
  assert.equal(again.userId, first.userId, 'the same address opens the same account');
  assert.equal(again.created, false);
  assert.equal(rows('accounts').length, 1);
  assert.equal(rows('sessions').length, 2, 'each device has its own session');
});

test('a wrong code says how many tries are left, and a code stops working after five', async () => {
  const { db } = signInStore(), box = mailbox(), options = settings(box);
  await sendSignInCode(db, options, { email: 'ali@example.com' }, now);
  const code = box.code();
  for (let left = triesPerCode - 1; left >= 0; left--) {
    assert.deepEqual(await verifySignInCode(db, options, { email: 'ali@example.com', code: wrongCode(code) }, now), { status: 'wrong', triesLeft: left });
  }
  assert.deepEqual(await verifySignInCode(db, options, { email: 'ali@example.com', code }, now), { status: 'expired' });
});

test('codes last 10 minutes, and a new code replaces the one before', async () => {
  const { db } = signInStore(), box = mailbox(), options = settings(box);
  await sendSignInCode(db, options, { email: 'ali@example.com' }, now);
  assert.deepEqual(await verifySignInCode(db, options, { email: 'ali@example.com', code: box.code() }, now + codeLifetimeMs), { status: 'expired' });
  await sendSignInCode(db, options, { email: 'ali@example.com' }, now + hour);
  const older = box.code();
  await sendSignInCode(db, options, { email: 'ali@example.com' }, now + hour + minute);
  const newer = box.code();
  if (older !== newer) assert.equal((await verifySignInCode(db, options, { email: 'ali@example.com', code: older }, now + hour + minute)).status, 'wrong');
  assert.equal((await verifySignInCode(db, options, { email: 'ali@example.com', code: newer }, now + hour + minute)).status, 'signed-in');
});

test('codes for one address are limited per hour and per day', async () => {
  const { db } = signInStore(), box = mailbox(), options = settings(box);
  const send = at => sendSignInCode(db, options, { email: 'ali@example.com' }, at);
  for (let index = 0; index < limits['sign-in-email-hour'].max; index++) assert.equal(await send(now + index), 'sent');
  assert.equal(await send(now + 10), 'busy');
  const nextHour = (limitWindow('sign-in-email-hour', now) + 1) * hour;
  for (let index = 0; index < limits['sign-in-email-day'].max - limits['sign-in-email-hour'].max; index++) assert.equal(await send(nextHour + index), 'sent');
  assert.equal(await send(nextHour + 3 * hour), 'busy', 'ten a day');
  assert.equal(box.sent.length, limits['sign-in-email-day'].max);
  assert.equal(await sendSignInCode(db, options, { email: 'someone-else@example.com' }, nextHour + 3 * hour), 'sent', 'other addresses are unaffected');
  assert.equal(await send(now + day), 'sent', 'a new day');
});

test('one network, and everyone together, can only send so many codes', async () => {
  const { db, sqlite } = signInStore(), box = mailbox(), options = settings(box);
  for (let index = 0; index < limits['sign-in-network'].max; index++) {
    assert.equal(await sendSignInCode(db, options, { email: `person${index}@example.com`, network: '198.51.100.7' }, now), 'sent');
  }
  assert.equal(await sendSignInCode(db, options, { email: 'one-more@example.com', network: '198.51.100.7' }, now), 'busy');
  assert.equal(await sendSignInCode(db, options, { email: 'one-more@example.com', network: '198.51.100.8' }, now), 'sent');
  // The refused request gave back what it had taken, so its address can still have a code.
  sqlite.prepare("UPDATE usage_limits SET count=? WHERE user_id=? AND feature='sign-in-all'").run(limits['sign-in-all'].max, everyone);
  assert.equal(await sendSignInCode(db, options, { email: 'late@example.com', network: '192.0.2.1' }, now), 'busy');
  assert.equal(box.sent.length, limits['sign-in-network'].max + 1);
});

test('guesses are limited per address per day, across codes', async () => {
  const { db } = signInStore(), box = mailbox(), options = settings(box);
  let guesses = 0;
  for (let round = 0; guesses < limits['sign-in-try'].max; round++) {
    await sendSignInCode(db, options, { email: 'ali@example.com' }, now + round * hour);
    for (let tryIndex = 0; tryIndex < triesPerCode && guesses < limits['sign-in-try'].max; tryIndex++, guesses++) {
      assert.equal((await verifySignInCode(db, options, { email: 'ali@example.com', code: wrongCode(box.code()) }, now + round * hour)).status, 'wrong');
    }
  }
  const tomorrow = (limitWindow('sign-in-try', now) + 1) * day;
  await sendSignInCode(db, options, { email: 'ali@example.com' }, tomorrow - minute);
  assert.deepEqual(await verifySignInCode(db, options, { email: 'ali@example.com', code: box.code() }, tomorrow - minute), { status: 'busy' }, 'even the right code waits');
  assert.equal((await verifySignInCode(db, options, { email: 'ali@example.com', code: box.code() }, tomorrow)).status, 'signed-in');
});

test('a successful sign-in does not count as a guess', async () => {
  const { db, rows } = signInStore(), box = mailbox(), options = settings(box);
  await sendSignInCode(db, options, { email: 'ali@example.com' }, now);
  await verifySignInCode(db, options, { email: 'ali@example.com', code: box.code() }, now);
  assert.equal(rows('usage_limits').find(row => row.feature === 'sign-in-try')?.count ?? 0, 0);
});

test('when the email cannot be sent, nothing counts', async () => {
  const { db, rows } = signInStore();
  const failing = { secret: testSecret, review: null, send: async () => { throw new Error('E_DAILY_LIMIT_EXCEEDED'); } };
  assert.equal(await sendSignInCode(db, failing, { email: 'ali@example.com', network: '192.0.2.1' }, now), 'unavailable');
  assert.ok(rows('usage_limits').every(row => row.count === 0));
  const box = mailbox();
  assert.equal(await sendSignInCode(db, settings(box), { email: 'ali@example.com', network: '192.0.2.1' }, now), 'sent');
});

test('badly formed addresses and codes are refused without counting', async () => {
  const { db, rows } = signInStore(), box = mailbox(), options = settings(box);
  for (const email of [undefined, null, 42, '', 'not-an-address', 'a@b', `${'x'.repeat(250)}@example.com`, 'ali@example.com\r\nBcc: x@example.com']) {
    assert.equal(await sendSignInCode(db, options, { email }, now), 'invalid', String(email).slice(0, 40));
  }
  for (const code of [undefined, 12345, '12345', '1234567', 'abcdef', '12 34 5']) {
    assert.deepEqual(await verifySignInCode(db, options, { email: 'ali@example.com', code }, now), { status: 'invalid' });
  }
  assert.equal(box.sent.length, 0);
  assert.deepEqual(rows('usage_limits'), []);
});

test('the App Review account uses its fixed code and is never emailed', async () => {
  const { db, rows } = signInStore(), box = mailbox();
  const options = settings(box, { review: { email: 'review@daywell.test', code: '246810' } });
  assert.equal(await sendSignInCode(db, options, { email: 'Review@Daywell.test' }, now), 'sent');
  assert.equal(box.sent.length, 0);
  assert.equal((await verifySignInCode(db, options, { email: 'review@daywell.test', code: '135790' }, now)).status, 'wrong');
  const review = await verifySignInCode(db, options, { email: 'review@daywell.test', code: '246810' }, now);
  assert.equal(review.status, 'signed-in');
  assert.deepEqual(rows('accounts').map(row => row.email), ['review@daywell.test']);
  assert.deepEqual(await verifySignInCode(db, settings(box), { email: 'review@daywell.test', code: '246810' }, now), { status: 'expired' }, 'only while the review code is set');
});

test('a session lasts 90 days from its last use, is renewed once a day, and can be ended', async () => {
  const { db, rows } = signInStore(), box = mailbox(), options = settings(box);
  await sendSignInCode(db, options, { email: 'ali@example.com' }, now);
  const { token, userId } = await verifySignInCode(db, options, { email: 'ali@example.com', code: box.code() }, now);
  assert.deepEqual(await readSession(db, token, now + hour), { userId, email: 'ali@example.com', plan: 'none', extended: false });
  assert.equal((await readSession(db, token, now + 2 * day)).extended, true);
  assert.equal(rows('sessions')[0].expires_at, now + 2 * day + sessionLifetimeMs);
  assert.equal((await readSession(db, token, now + 2 * day + hour)).extended, false);
  assert.equal(await readSession(db, token, now + 2 * day + sessionLifetimeMs), null, 'unused for 90 days');
  for (const bad of [null, undefined, '', 'short', `${token}x`, token.replace(/.$/, '!')]) assert.equal(await readSession(db, bad, now), null);
  await endSession(db, token);
  assert.equal(await readSession(db, token, now + 2 * day + hour), null);
  assert.equal(rows('sessions').length, 0);
});

test('closing an account removes its sessions', async () => {
  const { db, sqlite, rows } = signInStore(), box = mailbox(), options = settings(box);
  await sendSignInCode(db, options, { email: 'ali@example.com' }, now);
  const { userId } = await verifySignInCode(db, options, { email: 'ali@example.com', code: box.code() }, now);
  sqlite.prepare('DELETE FROM accounts WHERE user_id=?').run(userId);
  assert.deepEqual(rows('sessions'), []);
});

test('the daily clean-up removes expired codes, sessions and finished sign-in counts only', async () => {
  const { db, sqlite, rows } = signInStore(), box = mailbox(), options = settings(box);
  await sendSignInCode(db, options, { email: 'old@example.com', network: '192.0.2.1' }, now - 2 * day);
  await verifySignInCode(db, options, { email: 'old@example.com', code: box.code() }, now - 2 * day);
  await sendSignInCode(db, options, { email: 'stale@example.com' }, now - 2 * day);
  await sendSignInCode(db, options, { email: 'live@example.com' }, now - minute);
  sqlite.prepare("INSERT INTO usage_limits VALUES('dw:someone','capture',1,3)").run();
  sqlite.prepare('UPDATE sessions SET expires_at=?').run(now - 1);
  await sendSignInCode(db, options, { email: 'old@example.com' }, now);
  const { token } = await verifySignInCode(db, options, { email: 'old@example.com', code: box.code() }, now);
  await purgeExpiredSignIns(db, now);
  assert.equal(rows('sign_in_codes').length, 1, 'only the live code is left');
  assert.equal(rows('sessions').length, 1);
  assert.ok(await readSession(db, token, now));
  assert.ok(rows('usage_limits').some(row => row.user_id === 'dw:someone'), 'other features are left alone');
  const signInCounts = rows('usage_limits').filter(row => row.feature.startsWith('sign-in-'));
  assert.ok(signInCounts.length > 0);
  assert.ok(signInCounts.every(row => row.window === limitWindow(row.feature, now)));
});
