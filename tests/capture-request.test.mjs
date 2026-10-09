import test from 'node:test';
import assert from 'node:assert/strict';
import { captureInput } from '../lib/capture-request.ts';

function form(values = {}) {
  const data = new FormData();
  Object.entries({ date: '2026-10-09', mode: 'meal', text: 'I had noodles', ...values }).forEach(([key, value]) => data.set(key, value));
  return data;
}
test('food input validates both media files and all planning options before any provider call', () => {
  const audio = new File(['synthetic audio'], 'voice.webm', { type: 'audio/webm;codecs=opus' });
  assert.equal(captureInput(form({ audio })).audio.name, 'voice.webm');
  for (const values of [
    { date: 'tomorrow' }, { mode: 'unknown' }, { text: 'x'.repeat(6001) },
    { image: 'not a file', audio },
    { image: new File(['html'], 'photo.html', { type: 'text/html' }), audio },
    { image: new File([], 'empty.png', { type: 'image/png' }), audio },
    { audio: new File(['x'], 'unknown.bin', { type: 'application/octet-stream' }) },
    { image: new File([new Uint8Array(5*1024*1024+1)], 'big.png', { type: 'image/png' }) },
    { mode: 'plan', planCount: '8', audio }, { mode: 'plan', planMeal: 'medicine', audio },
  ]) assert.throws(() => captureInput(form(values)));
  assert.throws(() => captureInput(form({ text: '' })));
  assert.deepEqual(captureInput(form({ mode: 'plan', planCount: '2', planMeal: 'Dinner' })).planOptions, { start: '2026-10-09', count: 2, meal: 'Dinner' });
});
