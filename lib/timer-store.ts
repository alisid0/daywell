import { z } from 'zod';
import { schemas } from './daywell.ts';

export const timerStartSchema = z.object({
  confirmationId: z.string().uuid(), version: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
  title: z.string().trim().min(1).max(160), minutes: z.number().int().min(1).max(240),
  companion: z.enum(['pip', 'luma', 'bounce', 'tock']),
}).strict();
type Store = Pick<D1Database, 'prepare'>;
export async function readSavedTimer(db: Store, userId: string) {
  const row = await db.prepare("SELECT data FROM entries WHERE user_id=? AND id='timer' AND kind='timer'").bind(userId).first<{ data: string }>();
  const version = row ? Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(row.data))), byte => byte.toString(16).padStart(2, '0')).join('') : null;
  return { timer: row ? schemas.timer.parse(JSON.parse(row.data)) : null, version, raw: row?.data ?? null };
}
export async function startSavedTimer(db: Store, userId: string, input: z.infer<typeof timerStartSchema>, now = Date.now()) {
  const before = await readSavedTimer(db, userId);
  if (before.timer?.confirmationId === input.confirmationId) return { ...before, conflict: false };
  if (before.version !== input.version) return { ...before, conflict: true };
  const seconds = input.minutes * 60;
  const timer = { title: input.title, duration: seconds, remaining: seconds, mode: input.companion === 'pip' ? 'Focus' : 'Timer', companion: input.companion, startedAt: now, endAt: now + seconds * 1000, confirmationId: input.confirmationId };
  // The compare-and-set is atomic: another tab's timer cannot be silently replaced.
  // An absent expected timer must stay absent, and an existing one must stay identical.
  if (before.raw === null)
    await db.prepare("INSERT OR IGNORE INTO entries(user_id,id,kind,data) VALUES(?,'timer','timer',?)").bind(userId, JSON.stringify(timer)).run();
  else await db.prepare("UPDATE entries SET data=? WHERE user_id=? AND id='timer' AND kind='timer' AND data=?").bind(JSON.stringify(timer), userId, before.raw).run();
  const saved = await readSavedTimer(db, userId);
  return { ...saved, conflict: saved.timer?.confirmationId !== input.confirmationId };
}
