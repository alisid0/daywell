import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { paidRequest, AllowanceError } from '../lib/paid-request.ts';
import { limits } from '../lib/request-guards.ts';

test('paid requests reserve at dispatch, refund refusals and block excess use per person', async () => {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../drizzle/0001_usage_limits.sql', import.meta.url), 'utf8').replaceAll('--> statement-breakpoint', ''));
  const db = { prepare: sql => ({ bind: (...values) => ({ first: async () => sqlite.prepare(sql).get(...values) ?? null }) }) };
  const count = user => sqlite.prepare('SELECT count FROM usage_limits WHERE user_id=? AND feature=?').get(user, 'capture')?.count ?? 0;
  let dispatches = 0;
  const send = status => async () => { dispatches++; return new Response(null, { status }); };
  try {
    await paidRequest(db, 'one', 'capture', send(200));
    await paidRequest(db, 'one', 'capture', send(401));
    assert.equal(count('one'), 1);
    const cancelled = AbortSignal.abort();
    await assert.rejects(paidRequest(db, 'one', 'capture', send(200), cancelled), { name: 'AbortError' });
    assert.equal(dispatches, 2);
    assert.equal(count('one'), 1);
    for (let i = 1; i < limits.capture.max; i++) await paidRequest(db, 'one', 'capture', send(200));
    await assert.rejects(paidRequest(db, 'one', 'capture', send(200)), AllowanceError);
    assert.equal(count('one'), limits.capture.max);
    assert.equal(dispatches, limits.capture.max + 1);
    await paidRequest(db, 'two', 'capture', send(200));
    assert.equal(count('two'), 1);
    await assert.rejects(paidRequest(db, 'two', 'capture', async () => { throw Error('network timeout after dispatch'); }));
    assert.equal(count('two'), 2, 'ambiguous provider usage is not silently refunded');
  } finally { sqlite.close(); }
});

test('cancelling during reservation refunds it without dispatch', async () => {
  const controller = new AbortController();
  let updates = 0, sent = false;
  const db = { prepare: sql => ({ bind: () => ({ first: async () => { updates++; if (sql.startsWith('INSERT')) controller.abort(); return { count: 1 }; } }) }) };
  await assert.rejects(paidRequest(db, 'one', 'picker', async () => { sent = true; return new Response(); }, controller.signal), { name: 'AbortError' });
  assert.equal(updates, 2);
  assert.equal(sent, false);
});
