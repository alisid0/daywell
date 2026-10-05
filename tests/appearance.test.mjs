import test from 'node:test';
import assert from 'node:assert/strict';
import { readAppearanceProfile, normaliseAppearance, originalLook, starterLooks, palettes, sameLook, maxFavourites, referenceLook, designIterations, iterationLook } from '../lib/appearance.ts';

test('appearance migrates the previous style without discarding it and defaults to Cosy cove', () => {
  assert.equal(readAppearanceProfile(null, 'stillwater').current.style, 'stillwater');
  assert.equal(readAppearanceProfile(null, 'grove').current.lettering, 'journal');
  assert.deepEqual(readAppearanceProfile(null, 'unknown').current, iterationLook('cove'));
  assert.equal(readAppearanceProfile('{broken', 'moonlight').current.style, 'moonlight');
  assert.equal(readAppearanceProfile('{"version":999}', 'cloud').current.style, 'cloud');
});
test('appearance accepts only supported dimensions and keeps independent choices', () => {
  const mixed = normaliseAppearance({ style:'stillwater', palette:'berry', backdrop:'gingham', lettering:'journal', buttons:'pillowy', company:'perch' });
  assert.equal(mixed.palette, 'berry'); assert.equal(mixed.company, 'perch');
  assert.equal(mixed.backdrop, 'gingham'); assert.equal(mixed.lettering, 'journal');
  const invalid = normaliseAppearance({ style:'nook', palette:'url(https://example.com)', backdrop:'anything', lettering:null, buttons:{}, company:'other' });
  assert.deepEqual(invalid, originalLook());
});
test('older saved selections gain the original composition without losing their materials', () => {
  const { composition, ...oldSelection } = referenceLook;
  const profile = readAppearanceProfile(JSON.stringify({ version:1, current:oldSelection, favourites:[{id:'old',name:'My reference',look:oldSelection}] }));
  assert.deepEqual(profile.current, referenceLook);
  assert.deepEqual(profile.favourites[0].look, referenceLook);
  assert.equal(composition, 'original');
});
test('iterations round-trip, stay distinct from the reference, and cannot leak into other layouts', () => {
  for (const iteration of designIterations) {
    const current = iterationLook(iteration.id);
    assert.equal(sameLook(current, referenceLook), false);
    const profile = readAppearanceProfile(JSON.stringify({ version:1, current, favourites:[{id:iteration.id,name:iteration.name,look:current}] }));
    assert.deepEqual(profile.current, current);
    assert.deepEqual(profile.favourites[0].look, current);
    assert.equal(normaliseAppearance({...current,style:'nook'}).composition, 'original');
  }
  assert.equal(normaliseAppearance({...referenceLook,composition:'unknown'}).composition, 'original');
});
test('named combinations round-trip and malformed favourites cannot poison the profile', () => {
  const current = starterLooks[2].look;
  const favourites = [{ id:'saved', name:'My evening', look:current }, { id:'saved', name:'Duplicate', look:{} }, { id:'invalid' }, ...Array.from({length:20}, (_, i) => ({ id:`look-${i}`, name:'x'.repeat(80), look:originalLook() }))];
  const result = readAppearanceProfile(JSON.stringify({version:1,current,favourites}));
  assert.ok(sameLook(result.current,current)); assert.equal(result.favourites.length,maxFavourites);
  assert.equal(result.favourites[0].name,'My evening'); assert.equal(result.favourites[1].name.length,40);
  assert.equal(new Set(result.favourites.map(f => f.id)).size,maxFavourites);
});
function luminance(hex) {
  const components = hex.slice(1).match(/../g).map(c => parseInt(c,16)/255).map(c => c <= .04045 ? c/12.92 : ((c+.055)/1.055)**2.4);
  return components[0]*.2126 + components[1]*.7152 + components[2]*.0722;
}
function contrast(a,b) { const x=luminance(a),y=luminance(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); }
test('mixable palettes keep text and primary controls readable', () => {
  for (const palette of Object.values(palettes)) {
    const t=palette.tokens;
    for (const [fg,bg] of [['ink','canvas'],['ink','surface'],['muted','canvas'],['on-accent','accent'],['ink','luma']]) {
      assert.ok(contrast(t[`--dw-${fg}`],t[`--dw-${bg}`])>=4.5,`${palette.name}: ${fg} on ${bg}`);
    }
  }
});
