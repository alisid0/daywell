import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { guidedSessions, guidedMoment, guidedRecordingFor, sessionTranscript } from '../lib/guided-sessions.ts';

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
  assert.deepEqual(guidedSessions.map(s=>s.seconds),[120,180,300]);
  for(const session of guidedSessions) {
    const recording=guidedRecordingFor(session,manifest);
    assert.ok(recording,session.id);
    assert.equal(recording.model,'eleven_v4');
    assert.equal(session.segments[0].at,0);
    assert.equal(recording.transcript,sessionTranscript(session));
    const bytes=await readFile(new URL(recording.src.slice(1),root));
    assert.equal(bytes.length,recording.bytes);
    assert.ok(bytes.subarray(0,3).toString()==='ID3'||(bytes[0]===0xff&&(bytes[1]&0xe0)===0xe0));
    recording.segments.forEach((part,index)=>assert.ok(part.end<(session.segments[index+1]?.at??session.seconds)));
  }
});

test('stale scripts, remote recordings and inconsistent timing are rejected', async () => {
  const manifest=JSON.parse(await readFile(new URL('../public/guided-audio/manifest.json',import.meta.url),'utf8'));
  const session=guidedSessions[0], clip=manifest.recordings[session.id];
  assert.equal(guidedRecordingFor(session,null),undefined);
  const invalid=[{...clip,transcript:'old script'},{...clip,src:'https://example.com/clip.mp3'},{...clip,seconds:3},{...clip,segments:[]},{...clip,segments:clip.segments.map((s,i)=>i===0?{...s,end:999}:s)}];
  for(const value of invalid)assert.equal(guidedRecordingFor(session,{version:1,recordings:{[session.id]:value}}),undefined);
});
