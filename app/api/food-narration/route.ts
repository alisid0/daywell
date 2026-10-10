import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { database } from '@/db/store';
import { narrationInput } from '@/lib/food-narration';
import { allowedVoiceOrigin, voiceConfig } from '@/lib/voice-tools';
import { readLimited, messageFor, UserFacingError } from '@/lib/request-guards';
import { paidRequest, AllowanceError } from '@/lib/paid-request';

export const dynamic = 'force-dynamic';
const headers = {'Cache-Control':'no-store',Vary:'Cookie, Origin'};
const json = (error: string, status: number) => Response.json({error},{status,headers});
export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return json('Sign in to hear your food review.',401);
  if (!allowedVoiceOrigin(request)) return json('Start the readout from Daywell.',403);
  const raw = await readLimited(request,10000);
  if (!raw) return json('That review is too long to read aloud.',413);
  let text: string | null;
  try { text = narrationInput(JSON.parse(new TextDecoder().decode(raw))); } catch { text = null; }
  if (!text) return json('Choose a food review of up to 1,800 characters.',400);
  if (!voiceConfig(env.ELEVENLABS_API_KEY,env.ELEVENLABS_AGENT_ID)) return json('Read-aloud is unavailable right now. Your food review is still here.',503);
  try {
    const signal = AbortSignal.any([request.signal,AbortSignal.timeout(45000)]);
    const auth = {'xi-api-key':env.ELEVENLABS_API_KEY!};
    // Resolve the existing agent's voice server-side. Callers cannot select another voice.
    const agent = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${encodeURIComponent(env.ELEVENLABS_AGENT_ID!)}`,{headers:auth,signal});
    if (!agent.ok) throw new UserFacingError('Read-aloud is unavailable right now. Your food review is still here.');
    const config = await agent.json() as {conversation_config?:{tts?:{voice_id?:string}}};
    const voice = config.conversation_config?.tts?.voice_id;
    if (!voice || !/^[a-zA-Z0-9_-]{5,100}$/.test(voice)) throw new UserFacingError('Read-aloud is unavailable right now. Your food review is still here.');
    const response = await paidRequest(database(),user.userId,'narration',()=>fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_128`,{method:'POST',headers:{...auth,'Content-Type':'application/json'},body:JSON.stringify({text,model_id:'eleven_v4'}),signal}),signal);
    if (!response.ok) throw new UserFacingError('We couldn’t read this aloud right now. Please try again later.');
    if (!response.headers.get('content-type')?.startsWith('audio/')) throw new UserFacingError('We couldn’t play this readout. Your review is still here.');
    return new Response(response.body,{headers:{...headers,'Content-Type':'audio/mpeg','X-Daywell-Voice-Model':'eleven_v4'}});
  } catch (error) { return json(messageFor(error,'The food readout is unavailable right now. Your review is still here.'),error instanceof AllowanceError?429:502); }
}
