// Synthetic phrases from PR #35, exercised against the actual production router.
// Default: local timing only, no provider requests. --jev explicitly opts into paid calls.
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { eligibleReplies, localReplyDecision, routeReply } from '../lib/response-router.ts';
import { matchable, noFit } from './jev-picker-phrases.mjs';

const replies = eligibleReplies(JSON.parse(readFileSync(new URL('../public/audio-library/manifest.json', import.meta.url))));
const cases = [...matchable.map(([text, groups]) => ({ text, groups })), ...noFit.map(text => ({ text, groups: [] }))];
const useJev = process.argv.includes('--jev');
if (useJev && !process.env.TYPESAFE_API_KEY) throw Error('Save TYPESAFE_API_KEY privately before running the paid benchmark. Never put it in a command argument.');
const localTimings = [];
for (let repeat = 0; repeat < 20; repeat++) for (const { text } of cases) {
  const start = performance.now(); localReplyDecision(text, replies); localTimings.push(performance.now() - start);
}
const stats = values => {
  const sorted = [...values].sort((a,b) => a-b);
  return { p50: +sorted[Math.floor(sorted.length*.5)].toFixed(3), p95: +sorted[Math.floor(sorted.length*.95)].toFixed(3), max: +sorted.at(-1).toFixed(3) };
};
const report = { at: new Date().toISOString(), eligibleRecordings: replies.length, localDecisions: localTimings.length, localMs: stats(localTimings), providerTested: useJev };
if (useJev) {
  let calls = 0;
  const results = [];
  for (const { text, groups } of cases) {
    const start = performance.now();
    const decision = await routeReply({ text, area: 'today', replies, allowAi: true, pick: async (body, signal) => {
      signal.throwIfAborted();
      if (++calls > cases.length*2) throw Error('Benchmark request cap reached.');
      const response = await fetch('https://api.typesafe.ai/v1/systemone', { method:'POST', headers: { Authorization: `Bearer ${process.env.TYPESAFE_API_KEY}`, 'Content-Type':'application/json' }, body: JSON.stringify(body), signal });
      if (!response.ok) throw Error('Picker unavailable');
      return response.json();
    } });
    const group = decision.kind === 'recorded' ? replies.find(reply => reply.id === decision.id)?.groupId : null;
    results.push({ text, expected: groups, decision, correct: groups.length ? groups.includes(group) : !group, ms: +(performance.now()-start).toFixed(2) });
  }
  const match = results.filter(result => result.expected.length), none = results.filter(result => !result.expected.length);
  const accuracy = rows => rows.filter(row => row.correct).length / rows.length;
  const wrongRecordings = results.filter(row => !row.correct && row.decision.kind === 'recorded').length;
  Object.assign(report, { calls, matchAccuracy: accuracy(match), noFitAccuracy: accuracy(none), wrongRecordings, roundTripMs: stats(results.map(result=>result.ms)),
    numericalGatePassed: accuracy(match)>=.8 && accuracy(none)>=.8 && wrongRecordings<=3, results });
}
mkdirSync('work/jev-picker', { recursive: true });
writeFileSync('work/jev-picker/production-router.json', JSON.stringify(report,null,2)+'\n');
const summary = Object.fromEntries(Object.entries(report).filter(([key]) => key !== 'results'));
console.log(JSON.stringify(summary,null,2));
console.log('No configuration was activated. Review phrase-level fit, safety, real-phone timing and provider terms before enabling JEV.');
