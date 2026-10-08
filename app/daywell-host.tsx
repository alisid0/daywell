"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { AudioLines, Check, ChevronDown, Keyboard, Mic, MicOff, Pause, Play, Send, Settings2, Square, Sun, Undo2, Volume2, VolumeX, X } from "lucide-react";
import { CompanionPortrait } from "@/components/daywell-companions";
import { CompanionMotionControl } from "@/components/companion-motion-preference";
import { hostCompanionMotion, activityCompanionMotion } from "@/lib/companion-motion";
import { companions, type CompanionId } from "@/lib/companions";
import { today, type Entry } from "@/lib/daywell";
import { actionModule, canUndoHostChange, describeAction, entriesForActions, guidanceAt, parseHostRequest, type ActivityCompanion, type HostAction, type SupportLevel } from "@/lib/host";
import type { AppState } from "./use-daywell";
import { useHostVoice } from "./use-host-voice";
import { useElevenAgent } from "./use-eleven-agent";
import { safeAgentRequest } from "@/lib/voice-tools";
import { wellnessBoundary } from "@/lib/wellness-scope";
import { hostInputRoute } from "@/lib/host-input";

const supportOptions: { id: SupportLevel; title: string; description: string }[] = [
  { id: "quiet", title: "Stay quiet", description: "Company without check-ins" },
  { id: "occasional", title: "A little encouragement", description: "One check-in halfway" },
  { id: "guided", title: "Guide me through", description: "Check-ins at a quarter, halfway and three-quarters" },
];
const moduleNames: Record<string, string> = { focus: "Priorities & focus", sleep: "Sleep", move: "Movement", grocery: "Groceries", food: "Food & nutrition", alarm: "Alarms", clock: "Timers", calendar: "Calendar & history" };
const activityLabels = { pip: "Your focus time", luma: "Your wind-down", bounce: "Your movement time", tock: "Your timer" };
const activityMessages = { pip: "One thing in front of you. Everything else can wait here.", luma: "Nothing to finish. A little space to settle.", bounce: "At your pace. A pause is always welcome.", tock: "Time is taken care of." };
type LastChange = { before: Entry[]; applied: Entry[]; summary: string; undone?: boolean };

export function DaywellHost({ a, immersive = false, cozy = false, company = "quiet" }: { a: AppState; immersive?: boolean; cozy?: boolean; company?: "huddle" | "perch" | "quiet" }) {
  const [text, setText] = useState("");
  const [typed, setTyped] = useState(false);
  const [consent, setConsent] = useState<"voice" | "text" | null>(null);
  const [aiText, setAiText] = useState(false);
  const [aiChosen, setAiChosen] = useState(false);
  const [heard, setHeard] = useState("");
  const [reply, setReply] = useState("Tell me what you need. I’ll bring the right little helper along.");
  const [pending, setPending] = useState<HostAction[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [support, setSupport] = useState<SupportLevel>("quiet");
  const [spoken, setSpoken] = useState(false);
  const [hideCompanions, setHideCompanions] = useState(false);
  const [changes, setChanges] = useState<LastChange[]>([]);
  const lastChange = changes.at(-1);
  const undoable = [...changes].reverse().find(change => !change.undone);
  function setLastChange(change: LastChange) { setChanges(previous => [...previous.slice(-19), change]); }
  const [showChanges, setShowChanges] = useState(false);
  const [ack, setAck] = useState<{ id: CompanionId; text: string } | null>(null);
  const [cue, setCue] = useState("");
  const input = useRef<HTMLTextAreaElement>(null);
  const region = useRef<HTMLElement>(null);
  const planRegion = useRef<HTMLDivElement>(null);
  const replyRegion = useRef<HTMLDivElement>(null);
  const voiceErrorRegion = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (!immersive || !pending) return;
    const frame = requestAnimationFrame(() => {
      planRegion.current?.focus({ preventScroll: true });
      planRegion.current?.scrollIntoView({ block: "center", behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, [immersive, pending]);
  const lock = useRef(false);
  const preparedPlan = useRef<{ actions: HostAction[]; items: Entry[] } | null>(null);
  const mounted = useRef(true);
  const voice = useHostVoice(value => { setHeard(value); void receive(value); });
  const agent = useElevenAgent({ onMessage: (role, message) => { if(role === "user") { setHeard(message); if (wellnessBoundary(message)) { setPending(null); preparedPlan.current = null; setCue(""); setSupport("quiet"); voice.stop(); } } else setReply(message); }, onRequest: async value => { const allowed = safeAgentRequest(value); if (!allowed) return "Unsupported request. Ask the user to use the visible controls. Never claim a change was saved."; await receive(allowed); return "The request is shown in Daywell. Any record or timer change requires the user to press Do this. Nothing is saved by this tool."; } });
  const stopVoice = voice.stop;
  useEffect(() => {
    window.addEventListener("daywell-stop-voice", stopVoice);
    return () => window.removeEventListener("daywell-stop-voice", stopVoice);
  }, [stopVoice]);
  const agentActive = agent.status !== "disconnected";
  useEffect(() => {
    if (!immersive || pending || agentActive || (!heard && !voice.error)) return;
    const frame = requestAnimationFrame(() => {
      const target = voice.error ? voiceErrorRegion.current : replyRegion.current;
      target?.scrollIntoView({ block: "nearest", behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, [immersive, pending, agentActive, heard, reply, voice.error]);
  const agentSession = useRef(agentActive); agentSession.current = agentActive;
  const stopAgent = agent.stop;
  const previousView = useRef(a.active);
  useEffect(() => {
    if(previousView.current !== a.active) { previousView.current = a.active; stopVoice(); void stopAgent(); }
  }, [a.active, stopVoice, stopAgent]);
  async function startAgent(mode: "voice" | "text") { voice.stop(); setConsent(null); setAiChosen(true); setAiText(mode === "text"); if (mode === "text") setTyped(true); await agent.start(mode === "text"); }
  function openChat() { voice.stop(); setTyped(true); setAiChosen(true); setAiText(true); setConsent("text"); }
  function useCommands() { voice.stop(); void agent.stop(); setConsent(null); setAiChosen(false); setAiText(false); setTyped(true); }
  function goRest() { voice.stop(); void agent.stop(); a.setActive("relax"); }
  const companion: ActivityCompanion = a.timer.companion || (a.timer.mode === "Focus" ? "pip" : "tock");
  const hasActivity = Boolean(a.timer.startedAt || a.timer.endAt || a.remaining < a.timer.duration);
  const finished = hasActivity && a.remaining === 0;
  const live = useRef({ a, support, spoken, companion, voice, hasActivity });
  live.current = { a, support, spoken, companion, voice, hasActivity };

  function say(message: string) {
    setReply(message);
    if (spoken && !agentActive) voice.speak(message, companion === "luma" && hasActivity);
  }
  function rememberPreferences(next: { support?: SupportLevel; spoken?: boolean; hideCompanions?: boolean }) {
    try { localStorage.setItem("daywell-host-preferences", JSON.stringify({ support, spoken, hideCompanions, ...next })); } catch { /* Preferences still work for this visit. */ }
  }
  function changeSupport(level: SupportLevel) {
    setSupport(level); setCue(""); rememberPreferences({ support: level });
    if (level === "quiet") voice.silence();
  }
  const typeRequest = useCallback((value?: string) => {
    stopVoice(); setTyped(true);
    if (value) setText(value);
    requestAnimationFrame(() => input.current?.focus());
  }, [stopVoice]);
  async function applyPlan() {
    if (!pending || lock.current) return;
    const missing = pending.find(action => !a.enabled(actionModule(action)));
    if (missing) { say(`Enable ${moduleNames[actionModule(missing)]} in Customize tools first. Nothing has changed.`); return; }
    lock.current = true; setBusy(true); setError("");
    if (preparedPlan.current?.actions !== pending) preparedPlan.current = { actions: pending, items: entriesForActions(pending, today(), Date.now(), () => crypto.randomUUID()) };
    const items = preparedPlan.current.items;
    const before = a.entries.filter(entry => items.some(item => item.id === entry.id));
    try {
      a.unlockAudio();
      const applied = await a.hostChange(items);
      if (!mounted.current) return;
      const summary = pending.map(describeAction).join(". ") + ".";
      setLastChange({ before, applied, summary }); preparedPlan.current = null; setPending(null); setShowChanges(false); setText(""); setTyped(false);
      const activity = pending.find(action => action.type === "activity");
      setCue("");
      say(activity?.type === "activity" ? `${pending.length > 1 ? "Your other changes are saved. " : ""}${activity.minutes} minutes are yours. ${activityMessages[activity.companion]}` : "Done. Your changes are saved. You can undo them below.");
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Couldn’t save that. Your request is still here to retry."); }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  async function undo() {
    if (lock.current) return;
    if (!undoable) { say("There’s no host change to undo in this visit."); return; }
    if (!canUndoHostChange(a.entries, undoable.applied)) { say("One of those entries has changed since then. Open your tools to edit it; I’ve kept the newer change."); return; }
    lock.current = true; setBusy(true); setError("");
    try {
      await a.hostChange(undoable.before, undoable.applied.filter(entry => !undoable.before.some(old => old.id === entry.id)).map(entry => entry.id));
      if (!mounted.current) return;
      setChanges(previous => previous.map(change => change === undoable ? { ...change, undone: true } : change)); setPending(null); setCue(""); say("Undone. Your previous entries are restored.");
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Couldn’t undo that. Please try again."); }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  async function controlActivity(command: "pause" | "resume" | "end") {
    voice.stop();
    if (lock.current) return;
    if (!hasActivity || (finished && command !== "end")) { say("There’s no activity running. Tell me what you’d like to start."); return; }
    if (command === "resume" && a.timer.endAt) { say("Your activity is already running."); return; }
    lock.current = true; setBusy(true); setError("");
    const previous = a.entries.find(entry => entry.id === "timer");
    const data = command === "end" ? { ...a.timer, endAt: null, remaining: a.timer.duration, startedAt: undefined } : { ...a.timer, remaining: a.remaining, endAt: command === "pause" ? null : Date.now() + a.remaining * 1000 };
    try {
      const applied = await a.hostChange([{ id: "timer", kind: "timer", data }]);
      if (!mounted.current) return;
      setLastChange({ before: previous ? [previous] : [], applied, summary: command === "end" ? "Ended the activity." : command === "pause" ? "Paused the activity." : "Resumed the activity." });
      setCue(""); say(command === "end" ? "Your activity has ended. Take the next step whenever you’re ready." : command === "pause" ? "Paused. Pick it up whenever you’re ready." : "You’re going again. At your pace.");
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Couldn’t update your activity. Please try again."); }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  async function receive(value: string) {
    if (lock.current || !value.trim()) return;
    voice.silence(); setError(""); setHeard(value.trim());
    const boundary = wellnessBoundary(value);
    if (boundary) { setPending(null); preparedPlan.current = null; setCue(""); setSupport("quiet"); voice.stop(); void agent.stop(); setReply(boundary); return; }
    if (/^(?:just rest|take a break|stop scrolling|help me stop scrolling|open relax)$/i.test(value.trim())) { goRest(); return; }
    if (/^(?:open |show )?(?:explore|move|eat|sleep)$/i.test(value.trim())) { a.setActive(value.trim().toLowerCase().replace(/^(open |show )/, "")); return; }
    const request = parseHostRequest(value);
    // Conversation must not approve or clear a plan that is waiting for review.
    if (request.type === "reply") { say(request.message); return; }
    if (request.type === "control") {
      if (request.command === "confirm") { if (!pending) { say("Tell me what you’d like to do first."); return; } return applyPlan(); }
      if (request.command === "undo") return undo();
      if (request.command === "changes") { setShowChanges(true); say(lastChange ? `${lastChange.undone ? "Already undone: " : "Last change: "}${lastChange.summary}` : "I haven’t changed anything in this visit."); return; }
      if (request.command === "cancel") { setPending(null); say("That request is cleared. Your current activity stays as it is."); return; }
      setPending(null); return controlActivity(request.command);
    }
    setPending(null);
    if (request.type === "support") { changeSupport(request.level); setReply(request.level === "quiet" ? "I’ll keep you company quietly." : "Your encouragement preference is updated."); return; }
    if (request.type === "unknown") { say(request.message); return; }
    if (request.type === "open") {
      if (request.module !== "calendar" && !a.enabled(request.module)) { say(`Enable ${moduleNames[request.module]} in Customize tools first.`); return; }
      a.setActive(request.module); if (request.view) a.setCalendarView(request.view); if (request.kind) a.openEditor(request.kind);
      say(request.kind ? "Fill in the details, then press Save. I won’t guess them." : request.module === "calendar" ? request.view === "history" ? "Your saved progress and reflections are in Look back." : "Your calendar is open. Choose a day to see or add plans." : "Your list is open. Your current activity stays here."); return;
    }
    const missing = request.actions.find(action => !a.enabled(actionModule(action)));
    if (missing) { say(`Enable ${moduleNames[actionModule(missing)]} in Customize tools first. Nothing has changed.`); return; }
    setPending(request.actions);
    say(`Here’s what I understood. ${request.actions.map(describeAction).join(". ")}. ${request.actions.some(action => action.type === "activity") && hasActivity && !finished ? "This will replace your current activity. " : ""}${agentActive ? "Press Do this to confirm." : "Say yes or press Do this."}`);
  }
  function sendText() {
    voice.clearError();
    const route = hostInputRoute(text, agent.status, aiChosen, busy);
    if (route === "ignore") return;
    if (route === "agent") { if (agent.send(text)) setText(""); }
    else if (route === "reconnect") setConsent("text");
    else void receive(text);
  }
  function submit(event: FormEvent) { event.preventDefault(); sendText(); }

  useEffect(() => {
    mounted.current = true;
    queueMicrotask(() => {
      if (!mounted.current) return;
      try {
        const saved = JSON.parse(localStorage.getItem("daywell-host-preferences") || "null");
        if (saved && supportOptions.some(option => option.id === saved.support)) setSupport(saved.support);
        if (typeof saved?.spoken === "boolean") setSpoken(saved.spoken);
        if (typeof saved?.hideCompanions === "boolean") setHideCompanions(saved.hideCompanions);
      } catch { /* Use quiet defaults when browser storage is unavailable. */ }
    });
    const openHost = (event: Event) => {
      const disclosure = region.current?.closest("details"); if (disclosure) disclosure.open = true;
      region.current?.scrollIntoView({ behavior: "instant", block: "start" });
      const detail = (event as CustomEvent<{ text?: string; mode?: string }>).detail;
      const request = detail?.text || (detail?.mode === "meal" ? "Log a meal" : undefined);
      typeRequest(request);
    };
    window.addEventListener("daywell-host", openHost);

    return () => { mounted.current = false; window.removeEventListener("daywell-host", openHost); };
  }, [typeRequest]);

  // Notice persisted changes, including ones made through the ordinary tools.
  const previousEntries = useRef(a.entries);
  useEffect(() => {
    const changed = a.entries.find(entry => ["grocery", "food", "alarm"].includes(entry.kind) && JSON.stringify(previousEntries.current.find(old => old.id === entry.id)) !== JSON.stringify(entry));
    previousEntries.current = a.entries;
    if (!changed) return;
    const id = ({ grocery: "momo", food: "nori", alarm: "sunny" } as const)[changed.kind as "grocery" | "food" | "alarm"];
    const text = changed.kind === "grocery" ? "Shopping list updated" : changed.kind === "food" ? "Meal saved" : "Alarm updated";
    const show = setTimeout(() => setAck({ id, text }), 0);
    const hide = setTimeout(() => setAck(null), 5500);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, [a.entries]);

  useEffect(() => {
    let key = ""; let stage = -1;
    const tick = () => {
      const current = live.current;
      const timer = current.a.timer;
      const nextKey = `${timer.startedAt || ""}:${timer.title}:${timer.duration}`;
      const fraction = 1 - current.a.remaining / timer.duration;
      const nextStage = Math.floor(fraction * 4);
      if (key !== nextKey) { key = nextKey; stage = nextStage; return; }
      if (!timer.endAt || nextStage <= stage) return;
      stage = nextStage;
      if (document.hidden || current.a.active === "relax" || current.voice.listening || current.voice.speaking || agentSession.current) return;
      const message = guidanceAt(current.companion, fraction, current.support);
      if (message) { setCue(message); if (current.spoken) current.voice.speak(message, current.companion === "luma"); }
    };
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, []);
  const agentListening = agent.status === "connected" && agent.mode === "listening" && !aiText && !agent.muted;
  const micState = voice.blocked && !agentActive ? "blocked"
    : agent.status === "connecting" || busy ? "thinking"
    : voice.listening || agentListening ? "listening"
    : voice.speaking || (agent.status === "connected" && agent.mode === "speaking") ? "speaking"
    : agentActive ? "connected" : "idle";
  const wasListening = useRef(false);
  useEffect(() => {
    const listening = micState === "listening";
    if (listening !== wasListening.current) { try { navigator.vibrate?.(15); } catch { /* Vibration is optional. */ } }
    wasListening.current = listening;
  }, [micState]);

  return <section className={`daywell-host ${hasActivity ? "host-is-active" : ""}`} data-hide-companions={hideCompanions} data-listening={voice.listening || agentListening} data-mic={micState} data-has-response={Boolean(heard || busy || pending || error || agentActive || consent || agent.error)} data-has-changes={changes.length > 0 || showChanges} ref={region} aria-labelledby="host-heading">
    <div className="host-topline"><span className="host-identity"><Sun size={21} />Daywell is here</span><button className="host-settings-toggle" aria-expanded={settingsOpen} aria-controls="host-settings" onClick={() => setSettingsOpen(!settingsOpen)}><Settings2 size={17} />Voice & company</button></div>
    <div className="host-invitation"><div><h2 id="host-heading">{immersive ? `${hasActivity ? "A little time for you" : cozy ? "A little company" : "Take a moment"}${a.settings.name !== "You" ? `, ${a.settings.name}` : ""}.` : `What’s on your mind${a.settings.name !== "You" ? `, ${a.settings.name}` : ""}?`}</h2><p>{cozy ? "Tell Daywell what you need. Your little helpers will come along." : immersive ? "Whatever’s on your mind, start here." : "One place to ask. A little company along the way."}</p></div><span className="host-listening-mark" aria-hidden="true"><AudioLines size={46} /></span></div>
    {company !== "quiet" && !hasActivity && !hideCompanions && <div className="nook-company" aria-hidden="true"><CompanionPortrait id="luma" size={220} decorative eager /><CompanionPortrait id="bounce" size={220} decorative eager /><CompanionPortrait id="pip" size={300} motion={hostCompanionMotion(micState)} decorative eager /></div>}
    {settingsOpen && <div className="host-settings" id="host-settings"><h3>Make yourself comfortable</h3><div className="voice-provider"><strong>{agent.configured ? "Live AI is set up" : "ElevenLabs host is waiting for setup"}</strong><p>{agent.configured ? "Talk naturally or choose AI chat for a quiet conversation. Your microphone stays off until you start talking." : "Everyday tools and typed commands work now. Your private API key and agent ID activate open conversation."}</p>{!agent.configured && <a href="/voice-setup" target="_blank" rel="noreferrer">Connect your ElevenLabs agent</a>}</div><label className="host-check"><input type="checkbox" checked={spoken} disabled={!voice.canSpeak} onChange={event => { setSpoken(event.target.checked); rememberPreferences({ spoken: event.target.checked }); if (!event.target.checked) voice.silence(); }} />Read Daywell’s replies aloud</label><label className="host-check"><input type="checkbox" checked={hideCompanions} onChange={event => { setHideCompanions(event.target.checked); rememberPreferences({ hideCompanions: event.target.checked }); }} />Hide companion pictures</label><CompanionMotionControl /><fieldset><legend>During an activity</legend>{supportOptions.map(option => <label className="host-support-option" key={option.id}><input type="radio" name="host-support" checked={support === option.id} onChange={() => changeSupport(option.id)} /><span><strong>{option.title}</strong><small>{option.description}</small></span></label>)}</fieldset><small>Saved on this browser. Check-ins happen while Daywell is open and visible. Winding down ends silently.</small></div>}
    <div className="host-input-actions"><button className="host-talk" disabled={busy || agent.checking || (!agent.configured && !voice.available)} onClick={() => { if(agentActive) void agent.stop(); else if(agent.configured) setConsent("voice"); else if (voice.listening) voice.stop(); else { setSpoken(true); rememberPreferences({ spoken: true }); voice.start(); } }}><span className="host-talk-symbol"><span className="mic-glow" aria-hidden="true" /><span className="mic-ring" aria-hidden="true" /><span className="mic-ring" aria-hidden="true" /><span className="mic-stack" aria-hidden="true"><span className="mic-layer mic-layer-mic"><Mic size={20} /></span><span className="mic-layer mic-layer-bars"><i /><i /><i /><i /><i /></span><span className="mic-layer mic-layer-dots"><i /><i /><i /></span><span className="mic-layer mic-layer-stop"><Square size={20} /></span><span className="mic-layer mic-layer-off"><MicOff size={20} /></span></span></span><span className="host-talk-label">{agent.status === "connecting" ? "Cancel connection" : agentActive ? "End conversation" : voice.listening ? "Stop listening" : "Talk to Daywell"}</span></button><button className="host-type" aria-label={agent.configured && !agentActive ? "Chat with Daywell" : "Type a request"} disabled={agent.status === "connecting"} onClick={() => { if (agent.configured && !agentActive) openChat(); else typeRequest(); }}><Keyboard size={18} />{agent.configured && !agentActive ? "Chat with Daywell" : "Type instead"}</button>{voice.speaking && <button className="host-type" onClick={voice.silence}><VolumeX size={18} />Stop speaking</button>}</div>
    <p className="host-voice-note">{agent.configured ? "Live AI voice & chat · Start when you’re ready. Your saved journal is not sent. Changes need your confirmation." : voice.available ? "Tap to talk. Your browser may process speech online. Nothing is saved until you confirm." : "Voice input isn’t available in this browser. Type below, or use your device’s keyboard dictation."}</p>
    <div className="host-agent-ui">{consent && <div className="host-consent" role="region" aria-label="Start ElevenLabs conversation"><strong>A moment with Daywell</strong><p>{consent === "voice" ? "Your microphone audio" : "The messages you send"} will go to ElevenLabs and the agent’s AI provider. They may retain conversations under your agent’s settings. Daywell helps with everyday routines and unwinding. It does not provide medical advice, therapy or emergency care. Live conversations use your ElevenLabs allowance. You can end at any time.</p><button className="host-primary" onClick={()=>void startAgent(consent)}>Start {consent === "voice" ? "talking" : "AI chat"}</button><button className="host-text-button" onClick={()=>setConsent(null)}>Not now</button></div>}
    {agent.error && <p className="host-error" role="alert">{agent.error}</p>}
    {agentActive && <p className="agent-caption" role="status">{agent.status === "connecting" ? "Opening your conversation…" : aiText ? "AI chat is on · Microphone off" : agent.muted ? "Microphone muted · Daywell can still reply" : agent.mode === "speaking" ? "Daywell is speaking. You can interrupt." : "Listening. Speak whenever you’re ready."}</p>}
    {agent.status === "connected" && !aiText && <button className="host-text-button" aria-pressed={agent.muted} onClick={agent.toggleMuted}>{agent.muted ? <Mic size={16} /> : <MicOff size={16} />}{agent.muted ? "Unmute microphone" : "Mute microphone"}</button>}
    {typed && agent.configured && !agentActive && !aiChosen && <button className="host-text-button" onClick={openChat}>Start AI chat</button>}
    {typed && (aiChosen || agentActive) && <button className="host-text-button" onClick={useCommands}>Use everyday commands instead</button>}
    {typed && !agentActive && !consent && <p className="agent-caption" role="status">{aiChosen ? "AI chat is off. Send to reconnect; your draft stays here." : "Everyday commands · No AI conversation"}</p>}</div>
    {typed && <form className="host-form" onSubmit={submit}><label htmlFor="host-request">Tell Daywell what you need</label><div><textarea id="host-request" ref={input} value={text} maxLength={600} rows={2} placeholder={aiChosen || agentActive ? "I’ve had a busy day. Can we unwind for a moment?" : "Add milk and focus on my email for 10 minutes"} onChange={event => setText(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendText(); } }} /><button type="submit" disabled={!text.trim() || busy || agent.status === "connecting"} aria-label="Send request"><Send size={19} /></button></div></form>}
    {!hasActivity && !pending && <div className="host-suggestions" aria-label="A place to begin"><button className="rest-entry" onClick={goRest}>Just rest</button><button onClick={()=>a.setActive("explore")}>Explore</button></div>}
    {!hasActivity && !pending && <Link className="host-library-link" href="/audio-library" onClick={() => { voice.stop(); void agent.stop(); }}>Just listen · little words of comfort</Link>}
    <div className="host-conversation" ref={replyRegion} aria-live="polite" aria-atomic="true">{(voice.listening || heard) && <p className="host-heard">{voice.listening ? voice.transcript || "Listening…" : `You: ${heard}`}</p>}<p className="host-reply"><span>Daywell</span>{busy ? "Taking care of that…" : reply}</p></div>
    {(error || voice.error) && <p className="host-error" ref={voiceErrorRegion} role="alert">{error || voice.error}</p>}
    {pending && <div className="host-plan" ref={planRegion} tabIndex={-1} aria-label="Review your request"><h3>Here’s the plan</h3><ul>{pending.map((action, index) => <li key={index}><Check size={16} />{describeAction(action)}</li>)}</ul>{pending.some(action => action.type === "activity") && hasActivity && !finished && <p className="host-replace-note">This replaces your current activity. Your lists stay saved.</p>}<div><button className="host-primary" disabled={busy} onClick={() => void applyPlan()}>{busy ? "Saving…" : "Do this"}</button><button className="host-text-button" disabled={busy} onClick={() => { setPending(null); voice.silence(); setReply("Request cleared. Your saved day stays as it is."); }}>Cancel request</button></div></div>}
    <div className="host-history-actions"><button disabled={busy || !undoable} onClick={() => void undo()}><Undo2 size={15} />Undo last change</button><button onClick={() => setShowChanges(!showChanges)} aria-expanded={showChanges}>What changed?<ChevronDown size={14} /></button>{spoken && <span><Volume2 size={14} />Replies aloud</span>}</div>
    {showChanges && <div className="host-change-summary">{lastChange ? `${lastChange.undone ? "Undone: " : "Last change: "}${lastChange.summary}` : "Nothing changed in this visit yet."}</div>}
    {ack && <div className="host-ack" role="status">{!hideCompanions && <CompanionPortrait id={ack.id} size={49} decorative />}<span><Check size={15} />{ack.text}</span></div>}
    {hasActivity && <section className={`host-activity host-activity-${companion}`} aria-label="Current activity"><div className="host-activity-main">{!hideCompanions && <CompanionPortrait id={companion} size={144} motion={activityCompanionMotion(companion, Boolean(a.timer.endAt), finished)} decorative eager />}<div><span className="host-activity-label">{finished ? "Your time is complete" : a.timer.endAt ? activityLabels[companion] : "Paused, whenever you’re ready"}</span><h3>{a.timer.title}</h3><p>{finished ? companion === "luma" ? "You can leave the day here. Rest whenever you’re ready." : "Take a moment. There’s no rush to start something else." : activityMessages[companion]}</p>{!hideCompanions && <small>{companions[companion].name} is keeping you company</small>}</div><div className="host-time" role="timer" aria-label={`${Math.floor(a.remaining / 60)} minutes ${a.remaining % 60} seconds remaining`}>{String(Math.floor(a.remaining / 60)).padStart(2, "0")}<span>:</span>{String(a.remaining % 60).padStart(2, "0")}</div></div>{!finished && <div className="host-activity-controls"><button className="host-primary" disabled={busy} onClick={() => void controlActivity(a.timer.endAt ? "pause" : "resume")}>{a.timer.endAt ? <Pause size={16} /> : <Play size={16} />}{a.timer.endAt ? "Pause activity" : "Resume activity"}</button><button className="host-text-button" disabled={busy} onClick={() => void controlActivity("end")}><X size={15} />End activity</button>{companion !== "tock" && <label>Company<select aria-label="Activity encouragement" value={support} onChange={event => changeSupport(event.target.value as SupportLevel)}>{supportOptions.map(option => <option key={option.id} value={option.id}>{option.title}</option>)}</select></label>}</div>}{finished && <button className="host-text-button" disabled={busy} onClick={() => void controlActivity("end")}>Clear finished activity</button>}{finished && companion === "bounce" && <button className="host-primary" onClick={() => { a.openEditor("move"); a.setDraft({ title: a.timer.title, date: today(), minutes: Math.round(a.timer.duration / 60) }); }}>Log this movement</button>}{cue && !finished && <p className="host-cue" role="status">{cue}</p>}</section>}
    <details className="host-help"><summary>Things you can say</summary><p>Use these everyday phrases by voice or text. Names are optional; Daywell brings the right helper.</p><div className="host-phrase-list">{["Add milk and eggs to my list", "Add a task to finish my email", "Focus on my email for ten minutes", "Add milk and focus on my email for 10 minutes", "Help me wind down for five minutes", "Start a walk for fifteen minutes", "Set a timer for five minutes", "Set an alarm for 7 am", "Log a meal", "Log my sleep", "Show my calendar", "Show my progress", "Plan an event", "Add a reflection", "Show my shopping list", "Stay quiet", "Undo that"].map(phrase => <button key={phrase} onClick={() => typeRequest(phrase)}>{phrase}</button>)}</div><p>Choose Talk to Daywell or Chat with Daywell for live AI. Everyday commands work without AI. Photo understanding needs a separate connection.</p></details>
  </section>;
}
