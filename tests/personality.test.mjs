import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const css = read('app/personality.css');

test('the personality loads last, so it wins over each look\'s own button styles', () => {
  const imports = [...read('app/layout.tsx').matchAll(/^import "\.\/([\w-]+\.css)";/gm)].map(match => match[1]);
  assert.equal(imports.at(-1), 'personality.css');
});

test('every dark look gets light shadows and outlines, and a chosen light palette keeps the dark ones', () => {
  // A look is dark when its own canvas is dark; its palette-free style name must appear in the dark rule.
  const dark = new Set();
  for (const file of readdirSync(new URL('../app', import.meta.url)).filter(name => name.endsWith('.css'))) {
    for (const [, selector, hex] of read(`app/${file}`).matchAll(/([^{}]+)\{[^{}]*--dw-canvas:\s*#([0-9a-f]{6})/gi)) {
      const n = parseInt(hex, 16), light = (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
      const style = selector.match(/data-daywell-style="([\w-]+)"/);
      if (light < 0.45 && style) dark.add(style[1]);
    }
  }
  assert.ok(dark.size >= 2, 'found the dark looks');
  const rule = css.match(/html:is\(([^)]*)\):not\(\[data-appearance-palette\]\)\s*\{([^}]*)\}/);
  assert.ok(rule, 'one rule covers the dark looks');
  for (const style of dark) assert.match(rule[1], new RegExp(`data-daywell-style="${style}"`), `${style} is covered`);
  assert.match(rule[2], /--sk-shadow:\s*#e9f4f1/i);
  assert.match(rule[2], /--sk-line:\s*#e9f4f1/i);
});

test('the four kinds of button keep their colours, and nothing tappable is smaller than a fingertip', () => {
  const block = selector => css.split('}').find(part => part.includes(selector) && /background:/.test(part)) ?? '';
  assert.match(block('.well-button, .kitchen-primary'), /background: var\(--sk-forest\)/);
  assert.match(block('.mv-btn.is-ghost, .kitchen-secondary'), /background: var\(--sk-peach\)/);
  assert.match(block('.stillwater-header-button, .kitchen-round'), /var\(--sk-mint\)/);
  assert.match(block('.stillwater-header-button, .kitchen-round'), /min-width: 44px !important; min-height: 44px !important/);
  assert.match(css, /:is\(\[aria-pressed="true"\], \[aria-selected="true"\], \[data-state="active"\]\) \{\s*background: var\(--sk-forest\)/);
  assert.match(css, /min-height: calc\(50px\*var\(--rc-scale,1\)\)/, 'main buttons grow with larger text');
});

test('presses still show with Reduce Motion on, without moving anything over time', () => {
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{[^@]*transition-duration: 0s !important/);
});
