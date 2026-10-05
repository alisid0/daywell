import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, request as httpRequest } from 'node:http';
import { mkdtemp, readFile, rm, rmdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createVoiceSetupHandler, localVoiceSetup } from '../build/local-voice-setup.ts';

test('local key entry preserves settings and never returns saved credentials', async () => {
  const root = await mkdtemp(join(tmpdir(), 'daywell-voice-test-'));
  const handler = createVoiceSetupHandler(root);
  const server = createServer((req, res) => {
    // Simulates the identity injected by the preceding local sign-in plugin.
    if (req.headers['x-test-signed-in'] === 'yes') req.headers['oai-authenticated-user-id'] = 'local_seedy';
    void handler(req, res, () => { res.statusCode = 404; res.end(); });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const url = `${origin}/__daywell/local-voice-setup`;
  const headers = { 'x-test-signed-in': 'yes', origin, 'content-type': 'application/json' };
  const post = (body, overrides = {}) => fetch(url, { method: 'POST', headers: { ...headers, ...overrides }, body: JSON.stringify(body) });
  const fixtureKey = 'synthetic_fixture_key_not_real';
  try {
    assert.equal((await fetch(url)).status, 401);
    assert.equal((await post({ apiKey: fixtureKey }, { origin: 'https://untrusted.example' })).status, 403);
    const rejectedHost = await new Promise((resolve, reject) => {
      const req = httpRequest(url, { method: 'POST', headers: { ...headers, host: 'untrusted.example' } }, res => {
        res.resume();
        res.on('end', () => resolve(res.statusCode));
      });
      req.on('error', reject);
      req.end(JSON.stringify({ apiKey: fixtureKey }));
    });
    assert.equal(rejectedHost, 403);
    assert.equal((await post({ apiKey: fixtureKey }, { origin: '', 'content-type': 'text/plain' })).status, 403);
    assert.equal((await post({ apiKey: fixtureKey }, { 'sec-fetch-site': 'cross-site' })).status, 403);
    assert.equal((await post({ apiKey: 'bad\nINJECTED=true' })).status, 400);
    assert.equal((await post({ apiKey: 'x'.repeat(5000) })).status, 413);
    await writeFile(join(root, '.dev.vars'), 'UNRELATED=keep-this\nELEVENLABS_AGENT_ID=agent_existing123\n');
    const saved = await post({ apiKey: fixtureKey });
    assert.equal(saved.status, 200);
    assert.deepEqual(await saved.json(), { available: true, keySaved: true, agentSaved: true, saved: true });
    assert.equal(await readFile(join(root, '.dev.vars'), 'utf8'), `UNRELATED=keep-this\nELEVENLABS_AGENT_ID=agent_existing123\nELEVENLABS_API_KEY=${fixtureKey}\n`);
    assert.equal((await post({ agentId: 'agent_replacement' })).status, 200);
    const contents = await readFile(join(root, '.dev.vars'), 'utf8');
    assert.ok(contents.includes(`ELEVENLABS_API_KEY=${fixtureKey}`));
    assert.ok(contents.includes('ELEVENLABS_AGENT_ID=agent_replacement'));
    assert.ok(!contents.includes('agent_existing123'));
    const status = await fetch(url, { headers });
    assert.equal(status.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await status.json(), { available: true, keySaved: true, agentSaved: true });
    assert.equal(localVoiceSetup().apply, 'serve');
    assert.ok(localVoiceSetup().config().server.fs.deny.includes('**/.dev.vars*'));
  } finally {
    await new Promise(resolve => server.close(resolve));
    await rm(join(root, '.dev.vars'), { force: true });
    await rmdir(root);
  }
});
