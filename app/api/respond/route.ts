import { env } from 'cloudflare:workers';
import { z } from 'zod';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { database } from '@/db/store';
import { readLimited, sameOrigin } from '@/lib/request-guards';
import { eligibleReplies, routeReply, type Pick } from '@/lib/response-router';
import { paidRequest } from '@/lib/paid-request';
import manifest from '@/public/audio-library/manifest.json';
import type { AudioManifest } from '@/lib/audio-library';

export const dynamic = 'force-dynamic';
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store', Vary: 'Cookie, Origin' } });
const input = z.object({ text: z.string().trim().min(1).max(600), area: z.enum(['today', 'eat', 'move', 'sleep', 'relax', 'calendar']).default('today'), allowAi: z.boolean().default(false) }).strict();
const replies = eligibleReplies(manifest as AudioManifest);

export async function GET() {
  if (!await getChatGPTUser()) return json({ error: 'Please sign in.' }, 401);
  return json({ picker: Boolean(env.TYPESAFE_API_KEY && env.TYPESAFE_PICKER_ENABLED === 'true'), generation: Boolean(env.ELEVENLABS_API_KEY && env.ELEVENLABS_AGENT_ID) });
}
export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return json({ error: 'Please sign in.' }, 401);
  if (!sameOrigin(request)) return json({ error: 'Use Daywell to send your request.' }, 403);
  const raw = await readLimited(request, 4096);
  if (!raw) return json({ error: 'Try a shorter request.' }, 413);
  let value;
  try { value = input.parse(JSON.parse(new TextDecoder().decode(raw))); }
  catch { return json({ error: 'Try a short request from Daywell.' }, 400); }
  const started = performance.now();
  const pick: Pick | undefined = env.TYPESAFE_API_KEY && env.TYPESAFE_PICKER_ENABLED === 'true' ? async (body, signal) => {
    const response = await paidRequest(database(), user.userId, 'picker', () => fetch('https://api.typesafe.ai/v1/systemone', {
      method: 'POST', headers: { Authorization: `Bearer ${env.TYPESAFE_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal,
    }), signal);
    if (!response.ok) throw Error('picker unavailable');
    return response.json();
  } : undefined;
  const decision = await routeReply({ ...value, replies, pick, signal: request.signal });
  // Metrics contain no request, identity, conversation or provider response.
  return json({ ...decision, decisionMs: Math.round((performance.now() - started) * 100) / 100 });
}
