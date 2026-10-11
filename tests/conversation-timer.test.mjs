import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { TimerConfirmation, timerConsent } from '../lib/conversation-timer.ts';
import { readSavedTimer, startSavedTimer, timerStartSchema } from '../lib/timer-store.ts';
import { timerStatusReply } from '../lib/timer-context.ts';
import { parseHostRequest } from '../lib/host.ts';

const actions = parseHostRequest('Play PlayStation for one hour').actions;
const id = '750e8400-e29b-41d4-a716-446655440000';
const input = {confirmationId:id,version:null,title:actions[0].title,minutes:60,companion:'tock'};
function store() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('CREATE TABLE entries(user_id TEXT NOT NULL,id TEXT NOT NULL,kind TEXT NOT NULL,data TEXT NOT NULL,PRIMARY KEY(user_id,id))');
  const db = {prepare:sql=>({bind:(...values)=>({first:async()=>sqlite.prepare(sql).get(...values)??null,run:async()=>({meta:{changes:sqlite.prepare(sql).run(...values).changes}})})})};
  return {db,sqlite};
}
test('okay starts only the specific fresh timer proposal and duplicate transcripts cannot restart it',async()=>{
  const gate=new TimerConfirmation(),{db,sqlite}=store();
  assert.equal(gate.claim('okay',1000).kind,'none');
  gate.prepare(actions,null,null,id,1000);
  const approval=gate.claim('Okay.',2000);assert.equal(approval.kind,'confirmed');
  assert.deepEqual(approval.offer.action,actions[0]);
  assert.equal(gate.claim('Okay.',2001).kind,'none');
  const saved=await startSavedTimer(db,'tester',input,2000);
  assert.equal(saved.conflict,false);assert.equal(saved.timer.title,'Play PlayStation');
  assert.match(timerStatusReply(saved.timer,62000),/running.*59 minutes/);
  const retry=await startSavedTimer(db,'tester',input,90000);
  assert.equal(retry.timer.endAt,saved.timer.endAt,'lost-response retry must not extend the timer');
  assert.equal(sqlite.prepare('SELECT count(*) n FROM entries').get().n,1);
  sqlite.close();
});
test('cancel, another subject, stale suggestions and reconnect clear spoken approval',()=>{
  for(const text of ['No thanks','What should I cook?','Okay but not now','yes, add milk too','yes?']) {
    const gate=new TimerConfirmation();gate.prepare(actions,null,null,id,1000);
    assert.notEqual(gate.claim(text,2000).kind,'confirmed',text);
    assert.equal(gate.claim('okay',3000).kind,'none');
  }
  const gate=new TimerConfirmation();gate.prepare(actions,null,null,id,1000);
  assert.equal(gate.claim('okay',122000).kind,'expired');
  gate.prepare(actions,null,null,id,1000);gate.clear();assert.equal(gate.claim('okay',2000).kind,'none');
  for(const text of ['okay','ok','yes please','Okay, start the timer','start it'])assert.equal(timerConsent(text),'start');
  gate.prepare([...actions,{type:'task',title:'Milk'}],null,null,id,1000);assert.equal(gate.claim('yes',2000).kind,'none');
});
test('an existing running or paused timer needs explicit replacement consent',()=>{
  for(const endAt of [200000,null]) {
    const gate=new TimerConfirmation();gate.prepare(actions,'a'.repeat(64),{title:'Reading',duration:600,remaining:500,startedAt:1,endAt},id,1000);
    assert.equal(gate.claim('okay',2000).kind,'replace');
    assert.equal(gate.claim('replace the timer',3000).kind,'confirmed');
  }
});
test('saved timer re-entry preserves purpose, manual pause, finish and user isolation',async()=>{
  const {db,sqlite}=store();const saved=await startSavedTimer(db,'alice',input,1000);
  assert.deepEqual((await readSavedTimer(db,'alice')).timer,saved.timer);
  assert.equal((await readSavedTimer(db,'bob')).timer,null);
  const paused={...saved.timer,endAt:null,remaining:900};
  sqlite.prepare('UPDATE entries SET data=? WHERE user_id=?').run(JSON.stringify(paused),'alice');
  const fresh=await readSavedTimer(db,'alice');assert.notEqual(fresh.version,saved.version);
  assert.match(timerStatusReply(fresh.timer,2000),/Play PlayStation.*paused.*15 minutes/);
  assert.match(timerStatusReply(saved.timer,3601000),/finished/);
  sqlite.close();
});
test('stale confirmation and simultaneous proposals cannot overwrite a newer manual timer',async()=>{
  const {db,sqlite}=store();const first=await startSavedTimer(db,'tester',input,1000);
  const second={...input,confirmationId:crypto.randomUUID(),title:'Reading',version:first.version};
  const third={...second,confirmationId:crypto.randomUUID(),title:'Walk'};
  const results=await Promise.all([startSavedTimer(db,'tester',second,2000),startSavedTimer(db,'tester',third,2000)]);
  assert.equal(results.filter(result=>!result.conflict).length,1);
  const final=await readSavedTimer(db,'tester');
  assert.equal((await startSavedTimer(db,'tester',{...input,confirmationId:crypto.randomUUID()},3000)).conflict,true);
  assert.deepEqual((await readSavedTimer(db,'tester')).timer,final.timer);
  sqlite.close();
});
test('timer start input is bounded and does not accept provider-supplied unrelated changes',()=>{
  for(const patch of [{minutes:0},{minutes:241},{minutes:1.5},{title:''},{title:'x'.repeat(161)},{confirmationId:'repeat'},{version:'fake'},{removeIds:['timer']},{companion:'unknown'}])assert.equal(timerStartSchema.safeParse({...input,...patch}).success,false);
  const config=JSON.parse(readFileSync(new URL('../config/daywell-agent.json',import.meta.url),'utf8'));
  assert.match(config.conversation_config.agent.prompt.prompt,/daywell_timer_context/);
  assert.doesNotMatch(config.conversation_config.agent.prompt.prompt,/Even if the user says yes, ask them to press Do this/);
});
