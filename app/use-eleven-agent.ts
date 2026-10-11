"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Conversation, Mode, Status } from "@elevenlabs/client";
import { wellnessBoundary } from "@/lib/wellness-scope";

type Options = { contextKey: string; getContext: () => string; prepareContext: () => Promise<string>; onUserMessage: (message: string) => Promise<void>; onEnd: () => void; onMessage: (role: "user" | "agent", message: string) => void; onRequest: (parameters: unknown) => Promise<string> };
export function useElevenAgent(options: Options) {
  const [configured,setConfigured] = useState(false), [checking,setChecking] = useState(true), [status,setStatus] = useState<Status>("disconnected"), [mode,setMode] = useState<Mode>("listening"), [error,setError] = useState("");
  const current = useRef(options);
  useEffect(() => { current.current = options; }, [options]);
  const session = useRef<Conversation | null>(null), generation = useRef(0), controller = useRef<AbortController | null>(null), mounted = useRef(true), connecting = useRef(false);
  const duration = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [muted, setMuted] = useState(false);
  const userWork = useRef<Promise<void>>(Promise.resolve());
  const typedEchoes = useRef<{ text: string; at: number }[]>([]);
  const updateContext = useCallback(() => {
    try { if (session.current?.isOpen()) session.current.sendContextualUpdate(current.current.getContext()); }
    catch { /* A disconnected session is handled by the connection callbacks. */ }
  }, []);
  useEffect(() => { updateContext(); }, [options.contextKey, updateContext]);
  function handleUser(message: string) {
    const attempt = generation.current;
    current.current.onMessage("user", message);
    const work = userWork.current.then(() => { if (mounted.current && generation.current === attempt) return current.current.onUserMessage(message); });
    userWork.current = work.catch(() => { if(mounted.current)setError("I couldn’t update your timer. Please check it before trying again."); });
    return userWork.current.then(updateContext);
  }
  const stop = useCallback(async () => {
    generation.current++; connecting.current = false; controller.current?.abort(); controller.current = null;
    if(duration.current) clearTimeout(duration.current); duration.current = null;
    const running = session.current; session.current = null;
    current.current.onEnd(); typedEchoes.current = [];
    if(mounted.current) { setStatus("disconnected"); setMuted(false); }
    try { await running?.endSession(); } catch { /* A dropped connection is already stopped. */ }
  }, []);
  useEffect(() => {
    mounted.current = true;
    const check = new AbortController();
    fetch("/api/voice",{cache:"no-store",signal:check.signal}).then(async r=>{if(!r.ok)throw Error();return r.json() as Promise<{configured?:boolean}>;}).then(data=>{if(mounted.current)setConfigured(data.configured===true);}).catch(()=>{}).finally(()=>{if(mounted.current)setChecking(false);});
    const hidden = () => { if(document.hidden) void stop(); };
    const stopEvent = () => { void stop(); };
    document.addEventListener("visibilitychange",hidden); window.addEventListener("pagehide",stopEvent); window.addEventListener("daywell-stop-voice",stopEvent);
    return ()=>{mounted.current=false;check.abort();void stop();document.removeEventListener("visibilitychange",hidden);window.removeEventListener("pagehide",stopEvent);window.removeEventListener("daywell-stop-voice",stopEvent);};
  },[stop]);
  async function start(textOnly = false, initialRequest?: string) {
    if(connecting.current || session.current) return false;
    window.dispatchEvent(new Event("daywell-stop-library-audio"));
    window.dispatchEvent(new Event("daywell-stop-guided-audio"));
    window.dispatchEvent(new Event("daywell-stop-narration"));
    connecting.current = true; const attempt = ++generation.current;
    const valid = () => mounted.current && generation.current === attempt;
    setError(""); setMuted(false); setStatus("connecting");
    controller.current = new AbortController();
    const timeout = setTimeout(()=>{if(valid()){setError("The conversation took too long to connect. Please try again.");void stop();}},30000);
    try {
      if(!textOnly && (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext)) throw Error("This browser can’t use the microphone here. Try a text chat instead.");
      const initialContext = await current.current.prepareContext();
      if(!valid()) return false;
      const response = await fetch("/api/voice",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}",signal:controller.current.signal});
      const data = await response.json() as {signedUrl?: string; error?:string};
      if(!response.ok) throw Error(data.error || "Couldn’t start the conversation.");
      if(!data.signedUrl) throw Error("No voice connection was returned. Please try again.");
      if(!valid()) return false;
      const { Conversation } = await import("@elevenlabs/client");
      if(!valid()) return false;
      const created = await Conversation.startSession({
        signedUrl:data.signedUrl,connectionType:"websocket",textOnly,
        dynamicVariables: { daywell_timer_context: initialContext },
        onConversationCreated: conversation => { if(valid()) session.current=conversation; else void conversation.endSession(); },
        onStatusChange: ({status:next})=>{if(valid())setStatus(next);},
        onModeChange: ({mode:next})=>{if(valid())setMode(next);},
        onMessage: ({role,message})=>{
          if (!valid()) return;
          const boundary = role === "user" ? wellnessBoundary(message) : undefined;
          if (boundary) { current.current.onMessage("user",message); void stop(); current.current.onMessage("agent",boundary); return; }
          if (role === "user") {
            const echo = typedEchoes.current.findIndex(item => item.text === message.trim() && Date.now() - item.at < 10000);
            if (echo >= 0) typedEchoes.current.splice(echo, 1);
            else void handleUser(message);
          } else current.current.onMessage(role,message);
        },
        onDisconnect: details=>{if(valid()){if(details.reason === "error") setError("The connection ended. Your unsent message is still here. Reconnect when you’re ready."); void stop();}},
        onError: ()=>{if(valid()){setError("The conversation was interrupted. Check microphone access and your connection, then try again.");void stop();}},
        onUnhandledClientToolCall: ()=>{if(valid())setError("I couldn’t do that here. Please use the on-screen controls.");},
        onMCPToolApprovalRequest: async()=>false,
        clientTools:{daywell_request: async parameters => { await userWork.current; return valid()?current.current.onRequest(parameters):"Conversation ended. No changes made."; }},
      });
      if(!valid()){await created.endSession();return false;}
      session.current=created; connecting.current=false; setStatus("connected");
      updateContext();
      // Preserve the turn that needed generation, without sending saved records or profile data.
      if (initialRequest?.trim() && !wellnessBoundary(initialRequest)) {
        await send(initialRequest);
      }
      duration.current=setTimeout(()=>{if(valid()){setError("This conversation has reached 15 minutes. You can start another whenever you’re ready.");void stop();}},15*60*1000);
      return true;
    } catch(problem) {
      if(valid()){setError(problem instanceof Error && problem.name!=="AbortError" ? problem.message : "Couldn’t connect. Please try again.");await stop();}
      return false;
    } finally { clearTimeout(timeout); if(valid())connecting.current=false; }
  }
  async function send(text: string) {
    if(!text.trim()) return false;
    const boundary = wellnessBoundary(text);
    if (boundary) { current.current.onMessage("user",text.trim()); void stop(); current.current.onMessage("agent",boundary); return true; }
    if(!session.current?.isOpen()) { setError("The conversation has ended. Your message is still here; reconnect to send it."); void stop(); return false; }
    try {
      const target = session.current, attempt = generation.current, message = text.trim().slice(0,600);
      await handleUser(message);
      if (generation.current !== attempt || !target.isOpen()) return false;
      updateContext(); typedEchoes.current = [...typedEchoes.current.filter(item => Date.now()-item.at < 10000), {text:message,at:Date.now()}].slice(-10);
      target.sendUserMessage(message); return true;
    }
    catch { setError("That message didn’t send. Please reconnect and try again."); return false; }
  }
  function toggleMuted() {
    if(!session.current?.isOpen()) return;
    try { session.current.setMicMuted(!muted); setMuted(!muted); }
    catch { setError("Couldn’t change the microphone. End the conversation to stop sharing audio."); }
  }
  return {configured,checking,status,mode,error,muted,toggleMuted,start,stop,send};
}
