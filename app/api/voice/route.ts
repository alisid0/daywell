import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { database } from "@/db/store";
import { allowedVoiceOrigin, safeSignedUrl, voiceConfig } from "@/lib/voice-tools";
import { everyone, limits, takeAllowances, type LimitedFeature } from "@/lib/request-guards";

export const dynamic = "force-dynamic";
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store", "Vary": "Cookie, Origin" } });
const usedUp: Partial<Record<LimitedFeature, string>> = {
  voice: "You’ve started several conversations. Give it a few minutes, or use your everyday tools.",
  "voice-day": `You’ve had today’s ${limits["voice-day"].max} live conversations. More are available tomorrow, and typing everyday commands still works.`,
  "voice-all": "Live conversations are unavailable until tomorrow because Daywell’s daily limit has been reached. Typing everyday commands still works.",
};
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
    const full = await takeAllowances(database(), [[user.userId, "voice"], [user.userId, "voice-day"], [everyone, "voice-all"]]); if(full) return json({error:usedUp[full]},429);
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(env.ELEVENLABS_AGENT_ID!)}`, {headers:{"xi-api-key":env.ELEVENLABS_API_KEY!},signal:AbortSignal.timeout(12000)});
    if(!response.ok) return json({error:response.status===401||response.status===403?"ElevenLabs couldn’t authorise this connection. Check your key permissions and agent settings.":response.status===429?"ElevenLabs is at its conversation limit. Please try again shortly.":"ElevenLabs couldn’t start this conversation. Please try again."},502);
    const result = await response.json() as { signed_url?: unknown };
    if(!safeSignedUrl(result.signed_url)) return json({error:"The voice service returned an invalid connection. Please try again."},502);
    return json({signedUrl:result.signed_url});
  } catch { return json({error:"The voice connection is unavailable right now. You can still type an everyday command."},503); }
}
