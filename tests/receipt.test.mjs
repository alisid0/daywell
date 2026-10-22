import test from 'node:test';
import assert from 'node:assert/strict';
import { matchList, receiptDraft, receiptJsonSchema } from '../lib/receipt.ts';
import { captureInput } from '../lib/capture-request.ts';

const line = (name, quantity, unit = 'each', food = true) => ({ name, quantity, unit, food });

test('a receipt is tidied: repeats combined, odd amounts dropped, foods before other things', () => {
  const receipt = receiptDraft({ unreadable: 1, items: [
    line('Washing-up liquid', 1, 'each', false), line('semi-skimmed milk', 568, 'ml'), line('Semi-skimmed milk ', 568, 'ml'),
    line('Bananas', 5), line('Cheddar', -2, 'g'), line('  ', 1), line('Frozen peas', 750, 'g'),
  ] });
  assert.deepEqual(receipt.items.map(item => [item.name, item.quantity, item.unit, item.food]), [
    ['Semi-skimmed milk', 1136, 'ml', true], ['Bananas', 5, 'each', true], ['Cheddar', null, 'g', true], ['Frozen peas', 750, 'g', true],
    ['Washing-up liquid', 1, 'each', false],
  ]);
  assert.equal(receipt.unreadable, 1);
  assert.equal(new Set(receipt.items.map(item => item.key)).size, receipt.items.length);
  // A repeat with an unknown amount makes the total unknown rather than wrong.
  assert.equal(receiptDraft({ unreadable: 0, items: [line('Eggs', 6), line('eggs', null)] }).items[0].quantity, null);
});

test('a receipt never holds more than a purchase can save', () => {
  const many = Array.from({ length: 60 }, (_, n) => line(`Food ${n}`, 1));
  const receipt = receiptDraft({ unreadable: 900, items: [...many, ...Array.from({ length: 30 }, (_, n) => line(`Thing ${n}`, 1, 'each', false))] });
  assert.equal(receipt.items.filter(item => item.food).length, 40);
  assert.equal(receipt.items.filter(item => !item.food).length, 20);
  assert.equal(receipt.unreadable, 50);
  assert.throws(() => receiptDraft({ items: [line('Milk', 1, 'pints')], unreadable: 0 }));
});

test('receipt lines tick off the trolley list only when they are that thing', () => {
  const list = ['Milk', 'Garlic', 'Sourdough loaf', 'Washing-up liquid', 'Eggs', 'Tomatoes', 'Butter'];
  const lines = ['Semi-skimmed milk', 'Milk chocolate', 'Garlic', 'Sourdough loaves', 'Washing up liquid', 'Egg noodles', 'Free-range eggs', 'Cherry tomatoes', 'Cheddar'];
  assert.deepEqual(matchList(lines, list), [0, null, 1, 2, 3, null, 4, 5, null]);
  // Each list name is ticked once, and the most specific name wins.
  assert.deepEqual(matchList(['Milk', 'Whole milk'], ['Milk']), [0, null]);
  assert.deepEqual(matchList(['Peanut butter'], ['Butter', 'Peanut butter']), [1]);
});

test('the receipt reader asks for a strict, small reply', () => {
  assert.equal(receiptJsonSchema.additionalProperties, false);
  assert.deepEqual(receiptJsonSchema.properties.items.items.required, ['name', 'quantity', 'unit', 'food']);
});

test('a receipt is read from a photo alone', () => {
  const form = values => { const data = new FormData(); Object.entries({ date: '2026-10-22', mode: 'receipt', ...values }).forEach(([key, value]) => data.set(key, value)); return data; };
  const photo = new File(['jpeg'], 'receipt.jpg', { type: 'image/jpeg' });
  assert.equal(captureInput(form({ image: photo })).mode, 'receipt');
  assert.throws(() => captureInput(form({ text: 'I bought milk' })));
  assert.throws(() => captureInput(form({ image: photo, audio: new File(['x'], 'voice.webm', { type: 'audio/webm' }) })));
});
