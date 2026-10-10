import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHostRequest, entriesForActions } from '../lib/host.ts';
import { safeAgentRequest } from '../lib/voice-tools.ts';
import { timerSnapshot, timerStatusReply, timerConversationContext } from '../lib/timer-context.ts';
import { timerMinutes } from '../lib/timer-intent.ts';
import { foodNarration, narrationInput } from '../lib/food-narration.ts';
import { resizeCapturedMeal } from '../lib/food-tracking.ts';

test('natural gaming requests prepare a labelled timer, with words and hours',()=>{
  for(const text of ['I would want to play PlayStation for one hour','I want to play a game for an hour',"I'd like to watch TV for half an hour",'Read a book for 1 hour 30 minutes','Set a timer for two hours']) {
    const request=parseHostRequest(text); assert.equal(request.type,'plan',text);
    assert.equal(request.actions[0].type,'activity');assert.equal(request.actions[0].companion,'tock');
    assert.equal(safeAgentRequest({request:text}),text);
  }
  const request=parseHostRequest('I would want to play PlayStation for one hour');
  assert.equal(request.actions[0].title,'Play PlayStation');assert.equal(request.actions[0].minutes,60);
  assert.equal(entriesForActions(request.actions,'2026-10-10',1000,()=> 'id')[0].data.endAt,3601000);
  assert.equal(timerMinutes('1 hour and 30 minutes'),90);
});
test('food names, recording duration, negations, past activity and unsupported compounds do not propose timers',()=>{
  for(const text of ['It is biryani','I ate biryani','record for 30 seconds','I played PlayStation for one hour',"I don't want to play a game for an hour",'Play a game for an hour and delete my data','Play and watch TV for an hour','Play a game tomorrow for an hour','Play a game for 5 hours','Play a game for zero minutes']) {
    assert.equal(parseHostRequest(text).type,'unknown',text);
  }
  for(const text of ['0 minutes','5 hours','1 hour then delete everything','1.5 hours','-5 minutes']) assert.equal(timerMinutes(text),null,text);
});
test('status is read-only and current across start, pause, resume and completion',()=>{
  const timer={title:'Play PlayStation',duration:3600,remaining:3600,endAt:null};
  assert.equal(timerSnapshot(timer,1000).state,'none');
  const running={...timer,startedAt:1000,endAt:3601000};
  assert.equal(timerSnapshot(running,61000).secondsRemaining,3540);
  assert.match(timerStatusReply(running,61000),/running.*59 minutes/);
  assert.equal(timerSnapshot({...running,endAt:null,remaining:900},61000).state,'paused');
  assert.match(timerStatusReply({...running,endAt:null,remaining:900},61000),/paused.*15 minutes/);
  assert.equal(timerSnapshot(running,3601000).state,'finished');
  for(const text of ['How much time is left?','Is my timer running?','Timer status']) {
    assert.equal(parseHostRequest(text).type,'timer-status');assert.equal(safeAgentRequest({request:text}),text);
  }
  for(const text of ['Do this','yes','undo','pause']) assert.equal(safeAgentRequest({request:text}),null);
});
test('conversation context whitelists the timer and keeps proposals uncommitted',()=>{
  const context=timerConversationContext({title:'Game',duration:60,remaining:60,endAt:null,privateNotes:'SECRET'},['Start a 60-minute timer'],1000);
  assert.doesNotMatch(context,/SECRET|privateNotes/);assert.match(context,/proposal has NOT started/);assert.match(context,/"state":"none"/);
});
test('food readout uses current adjusted calories and includes clarifying recognition',()=>{
  const entry={id:'meal',kind:'food',data:{title:'Toast',calories:400,protein:10,carbs:40,fat:10,nutritionKnown:true,macrosKnown:true,nutritionSource:'estimate',portions:1,foodStatus:'eaten',meal:'Breakfast',date:'2026-10-10'}};
  const draft={summary:'Original 400 calorie estimate',question:null,entries:[resizeCapturedMeal(entry,.5)]};
  assert.match(foodNarration(draft),/200/);assert.doesNotMatch(foodNarration(draft),/400/);
  assert.equal(foodNarration({summary:'I can see rice.',question:'Is the topping egg?',entries:[]}), 'I can see rice. Is the topping egg?');
  for(const value of [null,{}, {text:''},{text:'x'.repeat(1801)}]) assert.equal(narrationInput(value),null);
  assert.equal(narrationInput({text:' Food review '}),'Food review');
});
