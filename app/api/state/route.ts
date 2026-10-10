import { validateHostChange } from "@/lib/host-change";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { database } from "@/db/store";
import { saveEntries } from "@/db/entry-store";
import { defaults, normalizeSettings, settingsSchema } from "@/lib/daywell";
import { readLimited, sameOrigin } from "@/lib/request-guards";
import { stateBodySchema, validateSavedEntries } from "@/lib/state-input";
import { recoveryScopeForUser } from "@/lib/recovery-scope";

const MAX_ENTRIES = 20000;
const FULL = "Your saved space is full. Remove a few older entries, then try again.";
async function hasRoom(db: ReturnType<typeof database>, userId: string, ids: string[]) {
  if (!ids.length) return true;
  const existing = await db.prepare(`SELECT id FROM entries WHERE user_id=? AND id IN (${ids.map(() => "?").join(",")})`).bind(userId, ...ids).all<{ id: string }>();
  const fresh = ids.length - existing.results.length;
  if (!fresh) return true;
  const row = await db.prepare("SELECT COUNT(*) AS n FROM entries WHERE user_id=?").bind(userId).first<{ n: number }>();
  return (row?.n ?? 0) + fresh <= MAX_ENTRIES;
}
export const dynamic = "force-dynamic";
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return json({ error: "Sign in to save your day." }, 401);
  try {
    const db = database();
    const [prefs, rows, recoveryScope] = await Promise.all([
      db.prepare("SELECT data FROM settings WHERE user_id=?").bind(user.userId).first<{ data: string }>(),
      db.prepare("SELECT id,kind,data FROM entries WHERE user_id=? ORDER BY rowid").bind(user.userId).all<{ id: string; kind: string; data: string }>(),
      recoveryScopeForUser(user.userId),
    ]);
    return json({ recoveryScope, settings: prefs ? normalizeSettings(JSON.parse(prefs.data)) : defaults, entries: rows.results.map(row => ({ ...row, data: JSON.parse(row.data) })) });
  } catch {
    console.error("Load failed");
    return json({ error: "Your saved day is unavailable. Please try again." }, 503);
  }
}
export async function POST(req: Request) {
  const user = await getChatGPTUser();
  if (!user) return json({ error: "Sign in to save your day." }, 401);
  if (!sameOrigin(req)) return json({ error: "Request origin is not allowed." }, 403);
  try {
    const raw = await readLimited(req, 30_000);
    if (!raw) return json({ error: "Entry is too large." }, 413);
    const body = stateBodySchema.parse(JSON.parse(new TextDecoder().decode(raw)));
    const db = database();
    if (body.action === "settings") {
      const incoming = body.data && typeof body.data === "object" && !Array.isArray(body.data) ? body.data : null;
      if (!incoming) return json({ error: "Please check the entry and try again." }, 400);
      // Start from what's stored, so a tab still running an older version can't wipe details it doesn't know about.
      const stored = await db.prepare("SELECT data FROM settings WHERE user_id=?").bind(user.userId).first<{ data: string }>();
      const data = settingsSchema.parse({ ...normalizeSettings(stored ? JSON.parse(stored.data) : defaults), ...incoming });
      await db.prepare("INSERT INTO settings(user_id,data) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data").bind(user.userId, JSON.stringify(data)).run();
      return json({ ok: true, data });
    }
    if (body.action === "upsert" || body.action === "host-change") {
      const change = body.action === "host-change" ? validateHostChange(body) : { entries: validateSavedEntries(body.entries), removeIds: [] };
      if (!await hasRoom(db, user.userId, change.entries.map(entry => entry.id))) return json({ error: FULL }, 413);
      await saveEntries(db, user.userId, change.entries, change.removeIds);
      return json({ ok: true, entries: change.entries });
    }
    if (body.action === "remove" && typeof body.id === "string" && /^[-a-zA-Z0-9]{1,80}$/.test(body.id)) {
      await saveEntries(db, user.userId, [], [body.id]);
      return json({ ok: true });
    }
    return json({ error: "Unknown action." }, 400);
  } catch (error) {
    if (error instanceof SyntaxError || (error as Error)?.name === "ZodError" || (error as Error)?.message === "Invalid entry") return json({ error: "Please check the entry and try again." }, 400);
    console.error("Save failed");
    return json({ error: "Couldn't save. Your entry is still here; please try again." }, 503);
  }
}
