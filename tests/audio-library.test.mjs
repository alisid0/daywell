import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { audioCategories, audioGroups, audioResponses, audioResponseById, searchAudioResponses, responseInGroup, recordingFor } from '../lib/audio-library.ts';

test('the library has 1431 distinct scripts across 144 situations', () => {
  assert.equal(audioGroups.length, 144);
  assert.equal(audioResponses.length, 1431);
  assert.equal(audioResponseById.size, 1431);
  assert.equal(new Set(audioResponses.map(item => item.text)).size, 1431);
  assert.ok(audioCategories.every(category => audioResponses.some(item => item.category === category.id)));
  for (const group of audioGroups) {
    assert.ok(group.responses.length > 0 && group.responses.length <= 12);
    for (const response of group.responses) {
      assert.match(response.id, /^[a-z0-9-]+$/);
      assert.equal(response.groupId, group.id);
      assert.ok(response.text.trim().length > 20 && response.text.length < 300);
    }
  }
});

test('927 published examples have unique user utterances and explicit response handling', () => {
  const examples = audioResponses.filter(item=>item.prompt);
  assert.equal(examples.length,927);
  assert.equal(new Set(examples.map(item=>item.prompt.toLowerCase().replace(/[^a-z0-9]/g,''))).size,927);
  for(const entry of examples) assert.ok(['recorded','tool','live','urgent'].includes(entry.handling),entry.id);
  assert.equal(audioResponses.filter(item=>!item.prompt).length,504);
});

test('variations cycle predictably and unknown situations do not invent responses', () => {
  assert.equal(responseInGroup('missing'), undefined);
  const first = responseInGroup('relax-arrive');
  assert.equal(responseInGroup('relax-arrive', 10), first);
  assert.equal(responseInGroup('relax-arrive', -4), first);
  assert.equal(responseInGroup('relax-arrive', NaN), first);
  assert.equal(responseInGroup('relax-arrive', 1.5), audioGroups[0].responses[1]);
});

test('local search respects every term, case and optional category', () => {
  const result = searchAudioResponses('  PHONE   DOWN  ');
  assert.ok(result.some(item => item.id === 'relax-scroll-01'));
  assert.ok(result.every(item => /phone/i.test(item.title + item.prompt + item.text) && /down/i.test(item.title + item.prompt + item.text)));
  assert.ok(searchAudioResponses('phone','sleep').every(item => item.category === 'sleep'));
  assert.equal(searchAudioResponses('zzzzzunknown').length, 0);
});

test('only matching local recordings are playable', () => {
  const entry = audioResponses[0];
  const clip = { text:entry.text, src:'/audio-library/test-123.mp3', bytes:12000 };
  const manifest = recording => ({ version:1, recordings:{ [entry.id]:recording } });
  assert.deepEqual(recordingFor(entry,manifest(clip)),clip);
  assert.equal(recordingFor(entry,null),undefined);
  assert.equal(recordingFor(entry,{version:1,recordings:{}}),undefined);
  for (const invalid of [{...clip,text:'An old script'}, {...clip,src:'https://example.com/voice.mp3'}, {...clip,src:'/audio-library/../private.mp3'}, {...clip,bytes:0}]) assert.equal(recordingFor(entry,manifest(invalid)),undefined);
});

test('all 1431 shipped MP3 assets match their scripts and manifest sizes', async () => {
  const root = new URL('../public/',import.meta.url);
  const manifest = JSON.parse(await readFile(new URL('audio-library/manifest.json',root),'utf8'));
  assert.equal(manifest.version,1);
  assert.equal(Object.keys(manifest.recordings).length,1431);
  for (const entry of audioResponses) {
    const clip = recordingFor(entry,manifest);
    assert.ok(clip,entry.id);
    const buffer = await readFile(new URL(clip.src.slice(1),root));
    assert.equal(buffer.length,clip.bytes,entry.id);
    assert.ok(buffer.subarray(0,3).toString() === 'ID3' || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0),`${entry.id}: MP3 header`);
  }
});

test('the downloadable complete catalogue stays aligned with the playable library', async () => {
  const catalogue = JSON.parse(await readFile(new URL('../public/audio-library/response-catalogue.json',import.meta.url),'utf8'));
  const manifest = JSON.parse(await readFile(new URL('../public/audio-library/manifest.json',import.meta.url),'utf8'));
  assert.equal(catalogue.entries.length,1431);
  catalogue.entries.forEach((entry,index)=>{
    const {recording,...script} = entry;
    assert.deepEqual(script,audioResponses[index]);
    assert.equal(recording,recordingFor(audioResponses[index],manifest).src);
  });
});
