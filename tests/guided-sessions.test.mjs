import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { guidedSessions, guidedMoment, guidedRecordingFor, sessionTranscript, guidedVoices, guidedRecordingKey, guidedBreath } from '../lib/guided-sessions.ts';

test('guided captions follow the audio timeline, including seeks and completion', () => {
  const session=guidedSessions[0];
  assert.equal(guidedMoment(session,-5).index,0);
  assert.equal(guidedMoment(session,NaN).index,0);
  assert.equal(guidedMoment(session,24.9).index,0);
  assert.equal(guidedMoment(session,25).index,1);
  assert.equal(guidedMoment(session,session.seconds).complete,true);
  assert.equal(guidedMoment(session,1000).index,session.segments.length-1);
});

test('all guided sessions ship v4 recordings with complete, non-overlapping narration', async () => {
  const root=new URL('../public/',import.meta.url);
  const manifest=JSON.parse(await readFile(new URL('guided-audio/manifest.json',root),'utf8'));
  assert.deepEqual(guidedSessions.map(s=>s.seconds),[120,180,300,180,240,240]);
  assert.equal(Object.keys(manifest.recordings).length,18);
  assert.equal(guidedVoices.length,5);
  for(const session of guidedSessions) {
   for(const voice of (session.voices ? guidedVoices.map(item=>item.id) : ['eric'])) {
    const recording=guidedRecordingFor(session,manifest,voice);
    assert.ok(recording,session.id);
    assert.equal(recording.model,'eleven_v4');
    assert.equal(session.segments[0].at,0);
    assert.equal(recording.transcript,sessionTranscript(session));
    const bytes=await readFile(new URL(recording.src.slice(1),root));
    assert.equal(bytes.length,recording.bytes);
    assert.ok(bytes.subarray(0,3).toString()==='ID3'||(bytes[0]===0xff&&(bytes[1]&0xe0)===0xe0));
    recording.segments.forEach((part,index)=>assert.ok(part.end<(session.segments[index+1]?.at??session.seconds)));
   }
  }
});

test('voice choices never silently fall back to a different recording', async () => {
  const manifest=JSON.parse(await readFile(new URL('../public/guided-audio/manifest.json',import.meta.url),'utf8'));
  const session=guidedSessions.find(item=>item.id==='scroll-unwind');
  const key=guidedRecordingKey(session,'lily');
  assert.equal(guidedRecordingFor(session,{version:1,recordings:{[key]:manifest.recordings[guidedRecordingKey(session,'eric')]}},'lily'),undefined);
  assert.equal(guidedRecordingFor(session,manifest,'unknown'),undefined);
  assert.notEqual(guidedRecordingFor(session,manifest,'lily').src,guidedRecordingFor(session,manifest,'river').src);
});

test('breathing gestures track the audio position and end after two easy cycles', () => {
  const session=guidedSessions.find(item=>item.id==='scroll-unwind');
  assert.equal(guidedBreath(session,81.9),undefined);
  assert.deepEqual(guidedBreath(session,82),{phase:'in',amount:0});
  assert.deepEqual(guidedBreath(session,84.5),{phase:'in',amount:.5});
  assert.deepEqual(guidedBreath(session,87),{phase:'out',amount:1});
  assert.deepEqual(guidedBreath(session,89.5),{phase:'out',amount:.5});
  assert.deepEqual(guidedBreath(session,92),{phase:'in',amount:0});
  assert.equal(guidedBreath(session,102),undefined);
  assert.equal(guidedBreath(session,session.seconds),undefined);
  assert.equal(guidedBreath(session,NaN),undefined);
  assert.equal(guidedBreath(guidedSessions[0],87),undefined);
});

test('stale scripts, remote recordings and inconsistent timing are rejected', async () => {
  const manifest=JSON.parse(await readFile(new URL('../public/guided-audio/manifest.json',import.meta.url),'utf8'));
  const session=guidedSessions[0], clip=manifest.recordings[session.id];
  assert.equal(guidedRecordingFor(session,null),undefined);
  const invalid=[{...clip,transcript:'old script'},{...clip,src:'https://example.com/clip.mp3'},{...clip,seconds:3},{...clip,segments:[]},{...clip,segments:clip.segments.map((s,i)=>i===0?{...s,end:999}:s)}];
  for(const value of invalid)assert.equal(guidedRecordingFor(session,{version:1,recordings:{[session.id]:value}}),undefined);
});
