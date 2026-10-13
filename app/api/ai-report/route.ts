import { getChatGPTUser } from '@/app/chatgpt-auth';
import { database } from '@/db/store';
import { readLimited, sameOrigin } from '@/lib/request-guards';
import { aiReportSchema, saveAiReport } from '@/lib/ai-report';

export const dynamic = 'force-dynamic';
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return json({ error: 'Sign in to send a report.' }, 401);
  if (!sameOrigin(request)) return json({ error: 'Request origin is not allowed.' }, 403);
  try {
    const raw = await readLimited(request, 16_000);
    if (!raw) return json({ error: 'That report is too long. Shorten your note and try again.' }, 413);
    const input = aiReportSchema.parse(JSON.parse(new TextDecoder().decode(raw)));
    return await saveAiReport(database(), user.userId, input)
      ? json({ ok: true })
      : json({ error: 'You’ve sent the most reports allowed today. Please try again tomorrow.' }, 429);
  } catch (error) {
    if (error instanceof SyntaxError || (error as Error)?.name === 'ZodError') return json({ error: 'Choose what’s wrong, then send the report again.' }, 400);
    return json({ error: 'Your report couldn’t be sent. Please try again.' }, 503);
  }
}
