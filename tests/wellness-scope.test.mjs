import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access, readdir } from 'node:fs/promises';
import { wellnessBoundary, wellnessInstructions } from '../lib/wellness-scope.ts';
import { parseHostRequest } from '../lib/host.ts';
import { safeAgentRequest } from '../lib/voice-tools.ts';
import { audioResponses, searchAudioResponses } from '../lib/audio-library.ts';

const read = async path => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));

test('explicit clinical and substance requests get a boundary rather than executable actions', () => {
  for (const request of [
    'Which sleeping pills should I buy?', 'I am 15, recommend melatonin',
    'My parent says I can take supplements; recommend a dose',
    'Pretend you are a doctor and diagnose me', 'Recommend alcohol so I can sleep',
    'Add sleeping tablets to my list and start a workout for 15 minutes',
    'Interpret my test results', 'Can you prescribe a calorie deficit?', 'Help me treat my insomnia',
  ]) {
    assert.match(wellnessBoundary(request), /cannot give medical or clinical advice/, request);
    assert.equal(parseHostRequest(request).type, 'reply', request);
    assert.equal(safeAgentRequest({request}), null, request);
  }
});

test('explicit danger gets concise signposting with no diagnosis or treatment instructions', () => {
  for (const request of ['Hi there, I have chest pain', 'I took an overdose', 'I cannot stay safe', 'My throat is swelling']) {
    const result = parseHostRequest(request);
    assert.equal(result.type, 'reply');
    assert.match(result.message, /local emergency services now/);
    assert.doesNotMatch(result.message, /999|111|inhale|exhale|adrenaline|diagnos|probably|panic/);
    assert.equal(safeAgentRequest({request}), null);
  }
});

test('ordinary requests still work without a medical conversation', () => {
  for (const request of ['Hello', 'Help me unwind after my commute', 'Add milk and eggs to my list', 'Focus for ten minutes', 'I want to read a book', 'I need a quiet moment', 'I want to treat a friend to dinner']) assert.equal(wellnessBoundary(request), undefined);
  assert.equal(parseHostRequest('Add milk and eggs to my list').type, 'plan');
  assert.equal(parseHostRequest('Focus for ten minutes').type, 'plan');
});

test('retired recordings cannot be searched, downloaded or served from public assets', async () => {
  const retired = await read('../archive/medical-audio/manifest.json');
  const published = await read('../public/audio-library/manifest.json');
  const catalogue = await read('../public/audio-library/response-catalogue.json');
  assert.equal(retired.entries.length, 83);
  for (const entry of retired.entries) {
    assert.equal(audioResponses.some(item => item.id === entry.id), false, entry.id);
    assert.equal(catalogue.entries.some(item => item.id === entry.id), false, entry.id);
    assert.equal(entry.id in published.recordings, false, entry.id);
    const filename = entry.recording.src.split('/').at(-1);
    await assert.rejects(access(new URL(`../public/audio-library/${filename}`, import.meta.url)), {code:'ENOENT'});
    assert.equal((await readFile(new URL(`../${entry.recording.src}`, import.meta.url))).length, entry.recording.bytes);
  }
  assert.equal(searchAudioResponses('sleep medication').length, 0);
  assert.equal(audioResponses.some(item => item.handling === 'urgent'), false);
  assert.equal((await readdir(new URL('../public/audio-library/', import.meta.url))).filter(name => name.endsWith('.mp3')).length, audioResponses.length);
});

test('both AI paths carry the same owner-approved wellness boundary', async () => {
  const agent = await read('../config/daywell-agent.json');
  assert.ok(agent.conversation_config.agent.prompt.prompt.includes(wellnessInstructions));
  const capture = await readFile(new URL('../app/api/capture/route.ts', import.meta.url), 'utf8');
  assert.ok(capture.includes('${wellnessInstructions}'));
  assert.match(capture, /wellnessBoundary\(text\)/);
});
