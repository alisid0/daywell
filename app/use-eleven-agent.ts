"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Conversation, Mode, Status } from "@elevenlabs/client";
import { wellnessBoundary } from "@/lib/wellness-scope";

type Options = { onMessage: (role: "user" | "agent", message: string) => void; onRequest: (parameters: unknown) => Promise<string> };
export function useElevenAgent(options: Options) {
  const [configured,setConfigured] = useState(false), [checking,setChecking] = useState(true), [status,setStatus] = useState<Status>("disconnected"), [mode,setMode] = useState<Mode>("listening"), [error,setError] = useState("");
  const current = useRef(options);
  useEffect(() => { current.current = options; }, [options]);
  const session = useRef<Conversation | null>(null), generation = useRef(0), controller = useRef<AbortController | null>(null), mounted = useRef(true), connecting = useRef(false);
  const duration = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [muted, setMuted] = useState(false);
  const stop = useCallback(async () => {
    generation.current++; connecting.current = false; controller.current?.abort(); controller.current = null;
    if(duration.current) clearTimeout(duration.current); duration.current = null;
    const running = session.current; session.current = null;
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
  async function start(textOnly = false) {
    if(connecting.current || session.current) return;
    window.dispatchEvent(new Event("daywell-stop-library-audio"));
    window.dispatchEvent(new Event("daywell-stop-guided-audio"));
    connecting.current = true; const attempt = ++generation.current;
    const valid = () => mounted.current && generation.current === attempt;
    setError(""); setMuted(false); setStatus("connecting");
    controller.current = new AbortController();
    const timeout = setTimeout(()=>{if(valid()){setError("The conversation took too long to connect. Please try again.");void stop();}},30000);
    try {
      if(!textOnly && (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext)) throw Error("This browser can’t use the microphone here. Try an AI text conversation instead.");
      const response = await fetch("/api/voice",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}",signal:controller.current.signal});
      const data = await response.json() as {signedUrl?: string; error?:string};
      if(!response.ok) throw Error(data.error || "Couldn’t start the conversation.");
      if(!data.signedUrl) throw Error("No voice connection was returned. Please try again.");
      if(!valid()) return;
      const { Conversation } = await import("@elevenlabs/client");
      if(!valid()) return;
      const created = await Conversation.startSession({
        signedUrl:data.signedUrl,connectionType:"websocket",textOnly,
        onConversationCreated: conversation => { if(valid()) session.current=conversation; else void conversation.endSession(); },
        onStatusChange: ({status:next})=>{if(valid())setStatus(next);},
        onModeChange: ({mode:next})=>{if(valid())setMode(next);},
        onMessage: ({role,message})=>{
          if (!valid()) return;
          current.current.onMessage(role,message);
          const boundary = role === "user" ? wellnessBoundary(message) : undefined;
          if (boundary) { void stop(); current.current.onMessage("agent",boundary); }
        },
        onDisconnect: details=>{if(valid()){if(details.reason === "error") setError("The connection ended. Your unsent message is still here. Reconnect when you’re ready."); void stop();}},
        onError: ()=>{if(valid()){setError("The conversation was interrupted. Check microphone access and your connection, then try again.");void stop();}},
        onUnhandledClientToolCall: ()=>{if(valid())setError("This agent requested a tool Daywell doesn’t support. Check the Daywell agent setup.");},
        onMCPToolApprovalRequest: async()=>false,
        clientTools:{daywell_request: async parameters => valid()?current.current.onRequest(parameters):"Conversation ended. No changes made."},
      });
      if(!valid()){await created.endSession();return;}
      session.current=created; connecting.current=false; setStatus("connected");
      duration.current=setTimeout(()=>{if(valid()){setError("This conversation has reached 15 minutes. You can start another whenever you’re ready.");void stop();}},15*60*1000);
    } catch(problem) {
      if(valid()){setError(problem instanceof Error && problem.name!=="AbortError" ? problem.message : "Couldn’t connect. Please try again.");await stop();}
    } finally { clearTimeout(timeout); if(valid())connecting.current=false; }
  }
  function send(text: string) {
    if(!text.trim()) return false;
    const boundary = wellnessBoundary(text);
    if (boundary) { current.current.onMessage("user",text.trim()); void stop(); current.current.onMessage("agent",boundary); return true; }
    if(!session.current?.isOpen()) { setError("The conversation has ended. Your message is still here; reconnect to send it."); void stop(); return false; }
    try { session.current.sendUserMessage(text.trim().slice(0,600)); current.current.onMessage("user",text.trim()); return true; }
    catch { setError("That message didn’t send. Please reconnect and try again."); return false; }
  }
  function toggleMuted() {
    if(!session.current?.isOpen()) return;
    try { session.current.setMicMuted(!muted); setMuted(!muted); }
    catch { setError("Couldn’t change the microphone. End the conversation to stop sharing audio."); }
  }
  return {configured,checking,status,mode,error,muted,toggleMuted,start,stop,send};
}
