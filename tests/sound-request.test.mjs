import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHostRequest } from '../lib/host.ts';
import { safeAgentRequest } from '../lib/voice-tools.ts';
import { routeReply } from '../lib/response-router.ts';

test('song requests offer existing sounds without pretending to sing or starting playback', () => {
  for (const phrase of ['Sing', 'Sing to me', 'Can you sing me a song?', 'Sing a song for me', 'Sing me to sleep', 'Play me a song', 'Please play a lullaby', 'Hello Daywell, could you sing something please']) {
    const result = parseHostRequest(phrase);
    assert.equal(result.type, 'sounds', phrase);
    assert.equal(result.intent, 'suggest', phrase);
    assert.equal(result.music, true, phrase);
    assert.equal('actions' in result, false);
  }
  assert.equal(parseHostRequest('Sing me to sleep').area, 'sleep');
  assert.equal(parseHostRequest('Play a lullaby').area, 'sleep');
});

test('explicit sound requests open the correct collection without generating or saving', async () => {
  for (const [phrase, area, music] of [['Open sleep sounds', 'sleep', false], ['Show me music in Sleep', 'sleep', true], ['Play relaxing sounds', undefined, false], ['Open music in Relax', 'relax', true], ['Can you play some gentle music?', undefined, true]]) {
    assert.deepEqual(parseHostRequest(phrase), { type: 'sounds', intent: 'open', area, music });
    assert.equal(safeAgentRequest({request:phrase}), phrase);
    const decision = await routeReply({text:phrase,area:'today',replies:[],allowAi:true,pick:()=>{throw Error('Must not call JEV');}});
    assert.equal(decision.kind, 'local');
  }
  for (const phrase of ['Suggest music', 'Suggest sleep sounds', 'Sing me a song']) assert.equal(safeAgentRequest({request:phrase}),phrase);
});

test('negation, unrelated uses and compound instructions never trigger the sound shortcut', () => {
  for (const phrase of ["Don't sing", 'Do not play music', 'Stop the music', 'I am learning to sing', 'Can you sing and save my journal', 'Play music and delete everything', 'Open sleep sounds and start a timer', 'Sing me a song for 60 minutes']) assert.notEqual(parseHostRequest(phrase).type, 'sounds', phrase);
  assert.equal(parseHostRequest('Add a task to sing at rehearsal').type, 'plan');
  assert.equal(parseHostRequest('Sing a song about which sleeping pills to buy').type, 'reply');
});
