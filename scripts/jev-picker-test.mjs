// Talk picker test: can Jev choose the right recorded reply from everyday sentences?
// Compares Jev with a free keyword matcher. Reads TYPESAFE_API_KEY from the environment and never prints it.
// Only synthetic test sentences are sent. See docs/talk-picker.md. Run: node --experimental-strip-types scripts/jev-picker-test.mjs [--baseline-only]
import { mkdirSync, writeFileSync } from "node:fs";
import { audioGroups } from "../lib/audio-library.ts";
import { matchable, noFit } from "./jev-picker-phrases.mjs";

const key = process.env.TYPESAFE_API_KEY;
const useJev = Boolean(key) && !process.argv.includes("--baseline-only");
const out = new URL("../work/jev-picker/", import.meta.url);
mkdirSync(out, { recursive: true });
const optionKey = id => id.replace(/-/g, "_");
const byKey = new Map(audioGroups.map(group => [optionKey(group.id), group]));

// A short description of each group: its title plus a few things people say, or a few of its replies.
const describe = group => {
  const prompted = group.responses.filter(item => item.prompt);
  const samples = prompted.length ? prompted.slice(0, 3).map(item => `“${item.prompt}”`) : group.responses.slice(0, 2).map(item => item.text);
  return `${group.title}. ${prompted.length ? "People say things like" : "Replies like"}: ${samples.join(" ")}`;
};
const topicCriteria = Object.fromEntries([
  ...audioGroups.map(group => [optionKey(group.id), describe(group)]),
  ["none_fit", "None of these fits. The request is about something else, such as facts, news, other apps, writing, or tasks Daywell can't do."],
]);

// Free baseline: keyword overlap with each group's title, prompts and replies, weighted by how rare each word is.
const stop = new Set("a an the and or but i i'm im me my to of in on for at it is be do does can could this that so just with have has had about what how ve ll re d s t really very bit".split(" "));
const words = text => text.toLowerCase().replace(/[’']/g, "").split(/[^a-z0-9]+/).filter(word => word.length > 1 && !stop.has(word));
const docs = audioGroups.map(group => ({ group, terms: words(`${group.title} ${group.title} ${group.responses.map(item => `${item.prompt ?? ""} ${item.text}`).join(" ")}`) }));
const df = new Map();
for (const doc of docs) for (const term of new Set(doc.terms)) df.set(term, (df.get(term) ?? 0) + 1);
function keywordPick(text) {
  const query = words(text);
  let best = null, bestScore = 0;
  for (const doc of docs) {
    const counts = new Map(); for (const term of doc.terms) counts.set(term, (counts.get(term) ?? 0) + 1);
    let score = 0;
    for (const term of query) if (counts.has(term)) score += Math.log(1 + docs.length / df.get(term)) * (counts.get(term) / (counts.get(term) + 1.2));
    if (score > bestScore) { bestScore = score; best = doc.group.id; }
  }
  return bestScore >= 1.5 ? best : "none";
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function jev(state, questions) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const started = performance.now();
    const response = await fetch("https://api.typesafe.ai/v1/systemone", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "jev-latest", state, questions }),
      signal: AbortSignal.timeout(30000),
    });
    const ms = performance.now() - started;
    if (response.status === 429 || response.status === 529) { await sleep(1000 * 2 ** attempt); continue; }
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`Jev ${response.status}: ${JSON.stringify(body).slice(0, 300)}`);
    return { ...body, ms };
  }
  throw new Error("Jev kept returning 429/529");
}
const stateFor = text => `Someone using Daywell, a calm everyday-wellness app, says: “${text}”`;
async function jevPick(text) {
  const result = await jev(stateFor(text), {
    topic: { type: "choice", instructions: "Which Daywell topic best fits what this person needs right now? Choose none_fit if no topic fits.", criteria: topicCriteria },
    wants_live: { type: "noul", instructions: "The person wants to talk something through or have a back-and-forth conversation, rather than a short reply." },
  });
  const topic = result.answers.topic;
  const top = Object.entries(topic.probabilities).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const group = byKey.get(topic.choice);
  let reply = null, replyConfidence = null, replyMs = 0, replyTokens = 0;
  if (group && group.responses.some(item => item.prompt)) {
    const options = Object.fromEntries(group.responses.map((item, index) => [`r${index + 1}`, item.prompt ? `When someone says “${item.prompt}” the reply is: ${item.text}` : item.text]));
    const second = await jev(stateFor(text), { reply: { type: "choice", instructions: "Which reply best answers this person?", criteria: options } });
    const index = Number(second.answers.reply.choice.slice(1)) - 1;
    reply = group.responses[index]?.text ?? null; replyConfidence = second.answers.reply.confidence; replyMs = second.ms; replyTokens = second.usage?.input_tokens ?? 0;
  } else if (group) reply = group.responses[0].text;
  return { choice: group ? group.id : "none", confidence: topic.confidence, top: top.map(([k, p]) => [byKey.get(k)?.id ?? k, Math.round(p * 1000) / 1000]), wantsLive: result.answers.wants_live?.noul ?? null,
    reply, replyConfidence, ms: result.ms + replyMs, tokens: (result.usage?.input_tokens ?? 0) + replyTokens };
}

const rows = [];
const cases = [...matchable.map(([text, ok]) => ({ text, ok })), ...noFit.map(text => ({ text, ok: ["none"] }))];
for (const item of cases) {
  const keyword = keywordPick(item.text);
  const row = { text: item.text, expected: item.ok, keyword, keywordRight: item.ok.includes(keyword) };
  if (useJev) {
    try { Object.assign(row, { jev: await jevPick(item.text) }); row.jevRight = item.ok.includes(row.jev.choice); }
    catch (error) { row.error = error instanceof Error ? error.message : String(error); }
    await sleep(150);
  }
  rows.push(row);
  process.stdout.write(useJev ? (row.error ? "x" : row.jevRight ? "." : "!") : ".");
}
process.stdout.write("\n");

const pct = (n, d) => d ? `${Math.round(100 * n / d)}%` : "n/a";
const m = rows.filter(row => !row.expected.includes("none")), n = rows.filter(row => row.expected.includes("none"));
const lines = [
  `Cases: ${m.length} everyday sentences that should match, ${n.length} that shouldn't.`,
  `Keyword matcher (free): right ${pct(m.filter(r => r.keywordRight).length, m.length)} of matchable; says "none" for ${pct(n.filter(r => r.keyword === "none").length, n.length)} of no-fit.`,
];
if (useJev) {
  const ok = rows.filter(r => r.jev), errors = rows.filter(r => r.error);
  const mj = m.filter(r => r.jev), nj = n.filter(r => r.jev);
  lines.push(`Jev: right ${pct(mj.filter(r => r.jevRight).length, mj.length)} of matchable; says none_fit for ${pct(nj.filter(r => r.jev.choice === "none").length, nj.length)} of no-fit. Errors: ${errors.length}.`);
  for (const threshold of [0.5, 0.6, 0.7]) {
    const sure = mj.filter(r => r.jev.confidence >= threshold);
    const wrongSure = [...mj.filter(r => !r.jevRight), ...nj.filter(r => r.jev.choice !== "none")].filter(r => r.jev.confidence >= threshold);
    lines.push(`  At confidence ≥ ${threshold}: answers ${pct(sure.length, mj.length)} of matchable, right ${pct(sure.filter(r => r.jevRight).length, sure.length)} of those; confident mistakes: ${wrongSure.length}.`);
  }
  const ms = ok.map(r => r.jev.ms).sort((a, b) => a - b), tokens = ok.reduce((s, r) => s + r.jev.tokens, 0);
  lines.push(`Speed per turn (both steps): median ${Math.round(ms[Math.floor(ms.length / 2)] ?? 0)} ms, slowest ${Math.round(ms.at(-1) ?? 0)} ms.`);
  lines.push(`Tokens: ${tokens} for ${ok.length} turns, about ${Math.round(tokens / Math.max(1, ok.length))} per turn; at $0.042 per million that's $${(tokens / 1e6 * 0.042).toFixed(4)} in total.`);
  lines.push("", "Misses (sentence → Jev pick [confidence]; expected):");
  for (const r of [...mj.filter(r => !r.jevRight), ...nj.filter(r => r.jev.choice !== "none")]) lines.push(`  “${r.text}” → ${r.jev.choice} [${r.jev.confidence?.toFixed(2)}]; expected ${r.expected.join(" / ")}; keyword: ${r.keyword}`);
  lines.push("", "Chosen replies for your four examples:");
  for (const r of rows.filter(r => /scrolling\.\.\.|relax before my test|date will go well|couldn't sleep even/.test(r.text))) lines.push(`  “${r.text}” → ${r.jev?.choice} [${r.jev?.confidence?.toFixed(2)}]: ${r.jev?.reply}`);
}
writeFileSync(new URL("results.json", out), JSON.stringify(rows, null, 2));
writeFileSync(new URL("summary.txt", out), lines.join("\n") + "\n");
console.log(lines.join("\n"));
