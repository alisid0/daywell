// Read-only local HTTP checks. Never enables or calls a provider.
import assert from 'node:assert/strict';
const origin = new URL(process.argv[2] || 'http://localhost:5192');
assert.equal(origin.protocol, 'http:');
assert.ok(['localhost','127.0.0.1'].includes(origin.hostname) && origin.port && origin.pathname === '/' && !origin.search);
const base = origin.origin;
const login = await fetch(`${base}/signin-with-chatgpt?return_to=/`, { redirect:'manual' });
const cookie = login.headers.get('set-cookie')?.split(';')[0];
assert.equal(cookie, '__sites_local_auth=1', 'Only the isolated development adapter is allowed');
const headers = { Cookie:cookie, Origin:base, 'Content-Type':'application/json' };
const post = (body, extra={}) => fetch(`${base}/api/respond`, {method:'POST',headers:{...headers,...extra},body:typeof body==='string'?body:JSON.stringify(body)});
let checks=0;
const status = (response, expected) => { assert.equal(response.status,expected); checks++; };
status(await fetch(`${base}/api/respond`),401);
status(await fetch(`${base}/api/respond`,{headers:{'oai-authenticated-user-id':'forged'}}),401);
status(await post({text:'hello'},{Origin:'https://unrelated.invalid'}),403);
for(const body of [null,[],{},'invalid json',{text:'x'.repeat(601)},{text:'hello',unexpected:'field'}]) status(await post(body),400);
status(await post({text:'x'.repeat(5000)}),413);
for(const area of ['today','eat','move','sleep','relax','calendar']) {
  for(const [text,kind] of [['Add milk and eggs to my list','local'],['The news is making me anxious.','recorded'],['Recommend sleeping pills','boundary'],['How many calories are in this?','generate']]) {
    const response=await post({text,area,allowAi:false});status(response,200);
    assert.equal(response.headers.get('cache-control'),'no-store');
    const decision=await response.json();assert.equal(decision.kind,kind);
    assert.ok(Number.isFinite(decision.decisionMs));
    if(kind==='recorded')assert.equal(decision.source,'exact');
  }
}
console.log(`${checks} HTTP checks passed. No provider calls or saved app records changed.`);
