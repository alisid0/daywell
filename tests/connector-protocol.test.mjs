import test from 'node:test';
import assert from 'node:assert/strict';
import { invocationSchema, driverMessageSchema } from '../scripts/connector-preview/protocol.mjs';

test('connector envelopes retain arbitrary JSON objects without accepting arrays or extra authority fields', () => {
  const request = { connectorId: 'example', actionName: 'read', arguments: { query: 'hello', limit: 3, nested: { enabled: true } } };
  assert.deepEqual(invocationSchema.parse(request), request);
  for (const argumentsValue of [null, [], 'hello']) assert.equal(invocationSchema.safeParse({ ...request, arguments: argumentsValue }).success, false);
  assert.equal(invocationSchema.safeParse({ ...request, accountId: 'untrusted' }).success, false);
  const response = { jsonrpc: '2.0', id: 'd4f7734f-b33d-454e-a6c5-c473f172ce9a', result: { content: [{ type: 'text', text: 'hello' }], isError: false } };
  assert.deepEqual(driverMessageSchema.parse(response), response);
  assert.equal(driverMessageSchema.safeParse({ ...response, result: [] }).success, false);
});
