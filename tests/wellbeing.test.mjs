import test from 'node:test';
import assert from 'node:assert/strict';
import { schemas } from '../lib/daywell.ts';
import { exerciseHistory, matchingRecipes, missingIngredients } from '../lib/wellbeing.ts';
import { allowedVoiceOrigin, safeAgentRequest, safeSignedUrl, voiceConfig } from '../lib/voice-tools.ts';

test('strength records validate sets and keep older movement entries compatible',()=>{
  const base={title:'Strength',date:'2026-10-05',minutes:20};
  assert.deepEqual(schemas.move.parse(base),base);
  const sets=[{exercise:'Squat',reps:8,kg:10}];
  assert.deepEqual(schemas.move.parse({...base,sets}).sets,sets);
  for(const bad of [{exercise:'',reps:8,kg:0},{exercise:'Squat',reps:0,kg:0},{exercise:'Squat',reps:8,kg:-1},{exercise:'Squat',reps:2.5,kg:0}]) assert.equal(schemas.move.safeParse({...base,sets:[bad]}).success,false);
  assert.equal(schemas.move.safeParse({...base,sets:Array(21).fill(sets[0])}).success,false);
});
test('progress compares only the same exercise and does not rearrange saved entries',()=>{
  const old={id:'old',kind:'move',data:{date:'2026-10-03',sets:[{exercise:'Squat',reps:8,kg:5}]}}, next={id:'new',kind:'move',data:{date:'2026-10-05',sets:[{exercise:'Squat',reps:9,kg:5},{exercise:'Row',reps:12,kg:10}]}};
  const entries=[old,next];
  assert.deepEqual(exerciseHistory(entries,' squat ').map(x=>x.reps),[9,8]);
  assert.deepEqual(entries,[old,next]);
});
test('recipes match available ingredients and avoid duplicate unbought shopping items',()=>{
  assert.equal(matchingRecipes('oats, milk')[0].id,'oats');
  assert.deepEqual(missingIngredients(['Oats','Milk','Berries','Oats'],'oats',[{kind:'grocery',data:{title:'MILK',done:false}},{kind:'grocery',data:{title:'Berries',done:true}}]),['Berries']);
  assert.deepEqual(missingIngredients(['Oats'],'Oats',[]),[]);
});
test('meal journals can explicitly record unknown nutrition without inventing estimates',()=>{
  const data={title:'Homemade lunch',date:'2026-10-05',meal:'Lunch',calories:0,protein:0,carbs:0,fat:0,nutritionKnown:false};
  assert.equal(schemas.food.parse(data).nutritionKnown,false);
  const {nutritionKnown,...legacy}=data;
  assert.deepEqual(schemas.food.parse(legacy),legacy);
});
test('agent tools can propose bounded actions but cannot confirm or alter saved records',()=>{
  for(const request of ['yes','Do this','undo','pause','save it','delete all my data','add milk and then book a flight','a'.repeat(601)]) assert.equal(safeAgentRequest({request}),null,request);
  assert.equal(safeAgentRequest({request:'Add milk to my list'}),'Add milk to my list');
  assert.equal(safeAgentRequest({request:'Open eat'}),'Open eat');
  assert.equal(safeAgentRequest({request:'Just rest'}),'Just rest');
  for(const input of [null,{},'yes',{request:42}]) assert.equal(safeAgentRequest(input),null);
});
test('voice requests require same-origin JSON and valid configuration',()=>{
  const req=(origin,type='application/json')=>new Request('https://daywell.example/api/voice',{method:'POST',headers:{origin,'content-type':type}});
  assert.equal(allowedVoiceOrigin(req('https://daywell.example')),true);
  assert.equal(allowedVoiceOrigin(req('https://evil.example')),false);
  assert.equal(allowedVoiceOrigin(req('https://daywell.example','text/plain')),false);
  assert.equal(allowedVoiceOrigin(new Request('https://daywell.example/api/voice')),false);
  assert.equal(voiceConfig('key','agent_test123'),true);
  assert.equal(voiceConfig(undefined,'agent_test123'),false);
  assert.equal(voiceConfig('key','../something'),false);
});
test('voice tickets only connect to the secure ElevenLabs conversation endpoint',()=>{
  assert.equal(safeSignedUrl('wss://api.elevenlabs.io/v1/convai/conversation?conversation_signature=fixture'),true);
  for(const url of ['https://api.elevenlabs.io/v1/convai/conversation','wss://api.elevenlabs.io.evil.example/v1/convai/conversation','wss://evil.example/v1/convai/conversation','wss://api.elevenlabs.io/elsewhere',null]) assert.equal(safeSignedUrl(url),false);
});
