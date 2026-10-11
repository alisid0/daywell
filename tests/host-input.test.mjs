import test from 'node:test';
import assert from 'node:assert/strict';
import { hostInputRoute } from '../lib/host-input.ts';

test('AI messages never become local save/undo commands after disconnect', () => {
  for (const text of ['yes', 'undo', 'Add milk to my list']) {
    assert.equal(hostInputRoute(text, 'connected', true), 'agent');
    assert.equal(hostInputRoute(text, 'disconnected', true), 'reconnect');
    assert.equal(hostInputRoute(text, 'connecting', true), 'ignore');
    assert.equal(hostInputRoute(text, 'disconnecting', true), 'ignore');
  }
});

test('everyday commands remain available only after choosing that mode', () => {
  assert.equal(hostInputRoute('Add milk to my list', 'disconnected', false), 'command');
  assert.equal(hostInputRoute('yes', 'disconnected', false, true), 'ignore');
  assert.equal(hostInputRoute(' ', 'disconnected', false), 'ignore');
});
