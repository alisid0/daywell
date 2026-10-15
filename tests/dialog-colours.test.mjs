import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const rules = css => [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({ selectors: selector.trim().split(','), body }));

test('dialogs get the colour tokens their buttons and fields read, without the page layout', () => {
  // Dialogs are portalled to <body>, outside .well-space, so the shared dialog component's slot must carry the tokens.
  assert.match(read('components/ui/dialog.tsx'), /data-slot="dialog-content"/);
  const tokens = rules(read('app/wellbeing.css')).find(rule => rule.body.includes('--well-accent:'));
  assert.deepEqual(tokens.selectors, ['.well-space', '.rest-space', '[data-slot="dialog-content"]']);
  const used = new Set(['app/wellbeing.css', 'app/food.css'].flatMap(file => [...read(file).matchAll(/var\((--well-[a-z]+)/g)].map(match => match[1])));
  for (const token of used) assert.match(tokens.body, new RegExp(`${token}:var\\(--dw-`), `${token} is defined for dialogs from the chosen look`);
  assert.doesNotMatch(tokens.body, /(^|;)(margin|max-width|color|font-family):/, 'the page layout stays off dialogs');
});

test('the capture sheet never squashes its rows below their content when it scrolls', () => {
  // Without this, the grid shrinks buttons to their 46px minimum and two-line labels spill out at large text sizes.
  const sheet = rules(read('app/capture.css')).find(rule => rule.selectors[0] === '.food-capture-dialog' && rule.body.includes('max-height:90dvh'));
  assert.match(sheet.body, /grid-auto-rows:max-content/);
});
