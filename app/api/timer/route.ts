import { getChatGPTUser } from '@/app/chatgpt-auth';
import { database } from '@/db/store';
import { readLimited, sameOrigin } from '@/lib/request-guards';
import { readSavedTimer, startSavedTimer, timerStartSchema } from '@/lib/timer-store';

export const dynamic = 'force-dynamic';
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return json({ error: 'Sign in to check your timer.' }, 401);
  try {
    const { timer, version } = await readSavedTimer(database(), user.userId);
    return json({ timer, version });
  } catch { return json({ error: 'I couldn’t check your saved timer. Please try again.' }, 503); }
}
export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return json({ error: 'Sign in to start your timer.' }, 401);
  if (!sameOrigin(request)) return json({ error: 'Request origin is not allowed.' }, 403);
  try {
    const raw = await readLimited(request, 2000);
    if (!raw) return json({ error: 'Timer request is too large.' }, 413);
    const input = timerStartSchema.parse(JSON.parse(new TextDecoder().decode(raw)));
    const { timer, version, conflict } = await startSavedTimer(database(), user.userId, input);
    return conflict ? json({ error: 'Your timer changed since we discussed this. Check it before starting another.', timer, version }, 409) : json({ timer, version });
  } catch (error) {
    if (error instanceof SyntaxError || (error as Error)?.name === 'ZodError') return json({ error: 'Check the timer’s activity and duration, then try again.' }, 400);
    return json({ error: 'I couldn’t confirm the timer was saved. Check its status before trying again.' }, 503);
  }
}
