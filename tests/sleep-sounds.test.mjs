import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { FADE_OUT_SECONDS, linearGain, loopPoints, sleepSoundGroups, sleepSounds, stopPlan } from '../lib/sleep-sounds.ts';

test('every sleep sound has its own file, a group and a sensible level', () => {
  assert.equal(sleepSounds.length, 11);
  assert.equal(new Set(sleepSounds.map(sound => sound.id)).size, sleepSounds.length);
  assert.equal(new Set(sleepSounds.map(sound => sound.label)).size, sleepSounds.length);
  assert.equal(new Set(sleepSounds.map(sound => sound.file)).size, sleepSounds.length);
  for (const sound of sleepSounds) {
    assert.ok(sleepSoundGroups.some(group => group.id === sound.group), sound.id);
    const size = statSync(new URL(`../public/sleep-sounds/${sound.file}`, import.meta.url)).size;
    assert.ok(size > 100_000, `${sound.file} is only ${size} bytes`);
    assert.ok(sound.gainDb >= -20 && sound.gainDb <= 36, `${sound.id} level`);
    for (const offset of sound.layers ?? [0]) assert.ok(offset >= 0 && offset < 30, `${sound.id} layer`);
  }
});

test('the committed files are the ones config/sleep-sounds.json describes', () => {
  const config = JSON.parse(readFileSync(new URL('../config/sleep-sounds.json', import.meta.url), 'utf8'));
  const hashes = config.sounds.flatMap(sound => sound.variants.map(text => {
    const request = { text, duration_seconds: config.seconds, prompt_influence: sound.promptInfluence ?? config.promptInfluence, loop: true, model_id: config.model };
    return createHash('sha256').update(JSON.stringify({ request, format: config.outputFormat })).digest('hex').slice(0, 12);
  }));
  assert.deepEqual(sleepSounds.map(sound => sound.file.match(/-([0-9a-f]{12})\.mp3$/)[1]).sort(), hashes.sort());
});

test('loop points trim encoder padding but keep quiet stretches that belong to the sound', () => {
  const padded = new Float32Array(1000).fill(0.2);
  padded.fill(0, 0, 30); padded.fill(0, 970);
  assert.deepEqual(loopPoints(padded, 1000), { start: 0.03, end: 0.97 });
  const quietStart = new Float32Array(1000).fill(0.2);
  quietStart.fill(0, 0, 200);
  assert.deepEqual(loopPoints(quietStart, 1000), { start: 0.06, end: 1 });
});

test('stop after fades out over the last minute, and Off sets no timer', () => {
  assert.equal(stopPlan(0), null);
  assert.deepEqual(stopPlan(15), { fadeFrom: 15 * 60 - FADE_OUT_SECONDS, end: 15 * 60 });
  assert.equal(linearGain(0), 1);
  assert.ok(Math.abs(linearGain(-6) - 0.501) < 0.001);
});
