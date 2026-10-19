import { z } from 'zod';

// People can report an AI-written reply or estimate without leaving the app (Google Play's AI-generated content
// policy; owner approval, 12 October 2026). A report keeps only that text, the reason and the person's optional note,
// for 90 days, so the team can review it. See docs/ai-reports.md.
// Recipe ideas are reported as 'meal-plan': they are meal suggestions, and ai_reports only accepts these three.
export const aiReportSources = ['conversation', 'food-estimate', 'meal-plan'] as const;
export type AiReportSource = typeof aiReportSources[number];
export const aiReportReasons = [
  ['offensive', 'Offensive or upsetting'], ['unsafe', 'Unsafe or harmful'], ['wrong', 'Wrong or misleading'], ['other', 'Something else'],
] as const;
export const aiReportRetentionDays = 90;
export const aiReportsPerDay = 20;
export const aiReportSchema = z.object({
  source: z.enum(aiReportSources),
  reason: z.enum(['offensive', 'unsafe', 'wrong', 'other']),
  reply: z.string().trim().min(1).max(4000),
  note: z.string().trim().max(300).default(''),
}).strict();

type Store = Pick<D1Database, 'prepare' | 'batch'>;
const day = 86_400_000;
const purge = (db: Pick<D1Database, 'prepare'>, now: number) =>
  db.prepare('DELETE FROM ai_reports WHERE created_at<?').bind(new Date(now - aiReportRetentionDays * day).toISOString());

// Returns false when this person has already sent today's maximum, which stops a script filling the table.
export async function saveAiReport(db: Store, userId: string, input: z.infer<typeof aiReportSchema>, now = Date.now(), id: string = crypto.randomUUID()) {
  const recent = await db.prepare('SELECT count(*) AS n FROM ai_reports WHERE user_id=? AND created_at>?').bind(userId, new Date(now - day).toISOString()).first<{ n: number }>();
  if (Number(recent?.n ?? 0) >= aiReportsPerDay) return false;
  await db.batch([
    purge(db, now),
    db.prepare('INSERT INTO ai_reports(id,user_id,created_at,source,reason,reply,note) VALUES(?,?,?,?,?,?,?)')
      .bind(id, userId, new Date(now).toISOString(), input.source, input.reason, input.reply, input.note),
  ]);
  return true;
}

// Run daily by the Worker's scheduled trigger, so no report outlives 90 days even when no new ones arrive.
export async function purgeExpiredAiReports(db: Pick<D1Database, 'prepare'>, now = Date.now()) {
  await purge(db, now).run();
}
