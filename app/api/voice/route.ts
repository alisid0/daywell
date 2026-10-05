import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { database } from "@/db/store";
import { allowedVoiceOrigin, safeSignedUrl, voiceConfig } from "@/lib/voice-tools";

export const dynamic = "force-dynamic";
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store", "Vary": "Cookie, Origin" } });
export async function GET() {
  if(!await getChatGPTUser()) return json({error:"Sign in to use Daywell."},401);
  return json({configured:voiceConfig(env.ELEVENLABS_API_KEY,env.ELEVENLABS_AGENT_ID)});
}
export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if(!user) return json({error:"Sign in to start a conversation."},401);
  if(!allowedVoiceOrigin(request)) return json({error:"Start your conversation from Daywell."},403);
  if(!voiceConfig(env.ELEVENLABS_API_KEY,env.ELEVENLABS_AGENT_ID)) return json({error:"Your ElevenLabs connection needs an API key and agent ID. Your other tools are ready to use."},503);
  try {
    const db = database();
    await db.prepare("CREATE TABLE IF NOT EXISTS voice_limits (user_id TEXT PRIMARY KEY, window INTEGER NOT NULL, starts INTEGER NOT NULL)").run();
    const window = Math.floor(Date.now()/600000);
    const quota = await db.prepare("INSERT INTO voice_limits(user_id,window,starts) VALUES(?,?,1) ON CONFLICT(user_id) DO UPDATE SET window=excluded.window, starts=CASE WHEN voice_limits.window=excluded.window THEN voice_limits.starts+1 ELSE 1 END WHERE voice_limits.window<>excluded.window OR voice_limits.starts<6 RETURNING starts").bind(user.userId,window).first();
    if(!quota) return json({error:"You’ve started several conversations. Give it a few minutes, or use your everyday tools."},429);
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(env.ELEVENLABS_AGENT_ID!)}`, {headers:{"xi-api-key":env.ELEVENLABS_API_KEY!},signal:AbortSignal.timeout(12000)});
    if(!response.ok) return json({error:response.status===401||response.status===403?"ElevenLabs couldn’t authorise this connection. Check your key permissions and agent settings.":response.status===429?"ElevenLabs is at its conversation limit. Please try again shortly.":"ElevenLabs couldn’t start this conversation. Please try again."},502);
    const result = await response.json() as { signed_url?: unknown };
    if(!safeSignedUrl(result.signed_url)) return json({error:"The voice service returned an invalid connection. Please try again."},502);
    return json({signedUrl:result.signed_url});
  } catch { return json({error:"The voice connection is unavailable right now. You can still type an everyday command."},503); }
}
