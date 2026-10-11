import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { database } from "@/db/store";
import { allowedVoiceOrigin, safeSignedUrl, voiceConfig } from "@/lib/voice-tools";
import { everyone, limits, returnAllowances, takeAllowances, type LimitedFeature } from "@/lib/request-guards";

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
  if(!voiceConfig(env.ELEVENLABS_API_KEY,env.ELEVENLABS_AGENT_ID)) return json({error:"Conversation is unavailable right now. Your other tools are ready to use."},503);
  // A start counts only once ElevenLabs hands back a conversation; any failure before that gives the uses back.
  const now = Date.now(), uses = [[user.userId, "voice"], [user.userId, "voice-day"], [everyone, "voice-all"]] as const;
  let counted: ReturnType<typeof database> | null = null;
  const giveBack = async () => { if (counted) await returnAllowances(counted, uses, now).catch(() => {}); };
  try {
    const db = database(), full = await takeAllowances(db, uses, now); if(full) return json({error:usedUp[full]},429); counted = db;
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(env.ELEVENLABS_AGENT_ID!)}&include_conversation_id=true`, {headers:{"xi-api-key":env.ELEVENLABS_API_KEY!},signal:AbortSignal.timeout(12000)});
    if(!response.ok) { await giveBack(); return json({error:response.status===401||response.status===403?"Conversation is unavailable right now. Your other tools are ready to use.":response.status===429?"Conversations are busy right now. Please try again shortly.":"Couldn’t start this conversation. Please try again."},502); }
    const result = await response.json() as { signed_url?: unknown };
    if(!safeSignedUrl(result.signed_url)) { await giveBack(); return json({error:"Couldn’t start this conversation. Please try again."},502); }
    return json({signedUrl:result.signed_url});
  } catch { await giveBack(); return json({error:"The voice connection is unavailable right now. You can still type an everyday command."},503); }
}
