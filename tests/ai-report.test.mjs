import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { aiReportSchema, aiReportsPerDay, purgeExpiredAiReports, saveAiReport } from '../lib/ai-report.ts';

const day = 86_400_000, now = Date.parse('2026-10-12T12:00:00Z');
const report = { source: 'conversation', reason: 'offensive', reply: 'An AI reply.', note: '' };
function store() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../drizzle/0005_ai_reports.sql', import.meta.url), 'utf8').replaceAll('--> statement-breakpoint', ''));
  const statement = (sql, values = []) => ({
    bind: (...next) => statement(sql, next),
    first: async () => sqlite.prepare(sql).get(...values) ?? null,
    run: async () => ({ meta: { changes: sqlite.prepare(sql).run(...values).changes } }),
    apply: () => sqlite.prepare(sql).run(...values),
  });
  const db = {
    prepare: sql => statement(sql),
    batch: async statements => { sqlite.exec('BEGIN'); try { const out = statements.map(item => item.apply()); sqlite.exec('COMMIT'); return out; } catch (error) { sqlite.exec('ROLLBACK'); throw error; } },
  };
  return { db, sqlite, rows: () => sqlite.prepare('SELECT * FROM ai_reports ORDER BY created_at').all() };
}

test('a report holds only a known source and reason, the AI text and a short optional note', () => {
  assert.deepEqual(aiReportSchema.parse({ ...report, reply: '  An AI reply.  ', note: undefined }), report);
  for (const bad of [{ ...report, source: 'recorded' }, { ...report, reason: 'boring' }, { ...report, reply: '   ' }, { ...report, reply: 'x'.repeat(4001) },
    { ...report, note: 'x'.repeat(301) }, { ...report, userId: 'someone-else' }]) assert.equal(aiReportSchema.safeParse(bad).success, false, JSON.stringify(bad).slice(0, 60));
});

test('saving keeps the report, removes reports older than 90 days and stops after the daily maximum', async () => {
  const { db, sqlite, rows } = store();
  sqlite.prepare("INSERT INTO ai_reports VALUES('old','u','2026-07-01T00:00:00.000Z','conversation','wrong','Old reply','')").run();
  sqlite.prepare("INSERT INTO ai_reports VALUES('recent','u','2026-08-01T00:00:00.000Z','food-estimate','wrong','Recent estimate','')").run();
  assert.equal(await saveAiReport(db, 'u', { ...report, note: 'Felt dismissive' }, now, 'new'), true);
  assert.deepEqual(rows().map(row => row.id), ['recent', 'new']);
  assert.deepEqual({ ...rows()[1] }, { id: 'new', user_id: 'u', created_at: '2026-10-12T12:00:00.000Z', source: 'conversation', reason: 'offensive', reply: 'An AI reply.', note: 'Felt dismissive' });
  for (let index = 1; index < aiReportsPerDay; index++) assert.equal(await saveAiReport(db, 'u', report, now + index, `n${index}`), true);
  assert.equal(await saveAiReport(db, 'u', report, now + 100, 'over'), false);
  assert.equal(await saveAiReport(db, 'other', report, now + 100, 'other'), true, 'the maximum is per person');
  assert.equal(await saveAiReport(db, 'u', report, now + day + 100, 'tomorrow'), true, 'yesterday’s reports stop counting after a day');
  sqlite.close();
});

test('the daily clean-up removes only reports older than 90 days, and the table refuses unknown values', async () => {
  const { db, sqlite, rows } = store();
  for (const [id, age] of [['expired', 91], ['kept', 89]]) sqlite.prepare("INSERT INTO ai_reports VALUES(?,'u',?,'meal-plan','other','A plan','')").run(id, new Date(now - age * day).toISOString());
  await purgeExpiredAiReports(db, now);
  assert.deepEqual(rows().map(row => row.id), ['kept']);
  assert.throws(() => sqlite.prepare("INSERT INTO ai_reports VALUES('x','u','2026-10-12','recorded','wrong','t','')").run(), /CHECK/);
  assert.throws(() => sqlite.prepare("INSERT INTO ai_reports VALUES('y','u','2026-10-12','conversation','boring','t','')").run(), /CHECK/);
  sqlite.close();
});

test('AI consent names the provider before anything is sent (Apple 5.1.2(i))', () => {
  const read = file => readFileSync(new URL(`../app/${file}`, import.meta.url), 'utf8');
  // The Plus assistant asks first, in its own sheet, and the panel's details say where questions go (22 October 2026).
  assert.match(read('assistant.tsx'), /Asking sends your message and the records it needs to OpenAI to write the reply\./);
  assert.match(read('daywell-host.tsx'), /Other questions go to the assistant, which uses OpenAI; before it first looks at your records, you choose what it can see\./);
  assert.match(read('receipt.tsx'), /The photo goes to OpenAI to read it\. Daywell doesn’t keep it\./);
  assert.match(read('capture-hub.tsx'), /Asking for a plan sends your request, basket and reserved amounts to OpenAI\.".*"Your photo or description goes to OpenAI for an estimate\."/);
  // Recipe ideas from the kitchen: the recipe cards, and the Week's idea for an empty slot.
  assert.match(read('cook.tsx'), /Asking sends the names and quantities of the food in your kitchen to OpenAI\./);
  assert.match(read('week.tsx'), /Asking sends the names and quantities of the food in your kitchen to OpenAI\./);
  for (const file of ['daywell-host.tsx', 'assistant.tsx', 'receipt.tsx', 'capture-hub.tsx', 'cook.tsx', 'week.tsx']) assert.doesNotMatch(read(file), /with the AI service|AI estimates\. Nothing|Starting shares/);
});
