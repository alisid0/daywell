import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

// The web app (docs/web-app.md): what a phone needs to add Daywell to its home screen and open it full screen.
const manifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8'));
const pngSize = path => { const b = readFileSync(path); assert.equal(b.toString('ascii', 1, 4), 'PNG', path); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };

test('the manifest opens Daywell full screen from the home screen', () => {
  assert.equal(manifest.name, 'Daywell');
  assert.equal(manifest.short_name, 'Daywell');
  assert.equal(manifest.start_url, '/');
  assert.equal(manifest.scope, '/');
  assert.equal(manifest.display, 'standalone');
  assert.match(manifest.theme_color, /^#[0-9a-f]{6}$/i);
  assert.match(manifest.background_color, /^#[0-9a-f]{6}$/i);
  assert.doesNotMatch(JSON.stringify(manifest).toLowerCase(), /dating/, 'never described as a dating app');
});

test('every manifest icon exists at its stated size, with a maskable one for Android', () => {
  for (const icon of manifest.icons) {
    const file = `public${icon.src}`;
    assert.ok(existsSync(file), icon.src);
    assert.ok(!icon.src.slice(1).includes('/'), `${icon.src} sits at the site root, which the public front door serves without a sign-in`);
    if (icon.type === 'image/png') assert.deepEqual(pngSize(file), icon.sizes.split('x').map(Number), icon.src);
  }
  assert.ok(manifest.icons.some(icon => icon.purpose === 'maskable' && icon.sizes === '512x512'));
  assert.ok(manifest.icons.some(icon => icon.purpose === 'any' && icon.sizes === '192x192'));
  assert.deepEqual(pngSize('public/apple-touch-icon.png'), [180, 180]);
});

test('the page links the manifest, the iPhone icon and the theme colour', () => {
  const layout = readFileSync('app/layout.tsx', 'utf8');
  assert.match(layout, /manifest: "\/manifest\.webmanifest"/);
  assert.match(layout, /apple: "\/apple-touch-icon\.png"/);
  assert.match(layout, /appleWebApp: \{ capable: true, title: "Daywell"/);
  assert.match(layout, new RegExp(`themeColor: "${manifest.theme_color}"`));
});
