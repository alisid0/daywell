"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "@/components/daywell-link";
import { AudioLines, Check, ChevronDown, Keyboard, Mic, MicOff, Pause, Play, Send, Settings2, Square, Sun, Undo2, Volume2, VolumeX, X } from "lucide-react";
import { CompanionPortrait } from "@/components/daywell-companions";
import { CompanionMotionControl } from "@/components/companion-motion-preference";
import { hostCompanionMotion, activityCompanionMotion } from "@/lib/companion-motion";
import { companions, type CompanionId } from "@/lib/companions";
import { today, type Entry } from "@/lib/daywell";
import { actionModule, canUndoHostChange, describeAction, entriesForActions, guidanceAt, parseHostRequest, type ActivityCompanion, type HostAction, type SupportLevel } from "@/lib/host";
import { initialTimer, type AppState } from "./use-daywell";
import { PrivacyDetails } from "./privacy-details";
import { useHostVoice, type VoiceChoice } from "./use-host-voice";
import { timerStatusReply } from "@/lib/timer-context";
import { TimerConfirmation, timerConsent, type TimerOffer } from "@/lib/conversation-timer";
import { wellnessBoundary } from "@/lib/wellness-scope";
import { describeStep, stepChanges, stepModule, type AssistantArea, type AssistantStep } from "@/lib/assistant";
import { useAssistant } from "./use-assistant";
import { AreaSwitches, AssistantConsent, AssistantPlan, AssistantTurn, Listening, VoiceSheet } from "./assistant";
import { useLibraryAudio } from "./use-library-audio";
import { audioResponseById, type AudioResponse } from "@/lib/audio-library";
import { eligibleReplies, foodCaptureMode, localReplyDecision, type ReplyDecision, type ReplyArea } from "@/lib/response-router";
import { soundSuggestion, type SoundRequest } from "@/lib/sound-request";

const supportOptions: { id: SupportLevel; title: string; description: string }[] = [
  { id: "quiet", title: "Stay quiet", description: "Company without check-ins" },
  { id: "occasional", title: "A little encouragement", description: "One check-in halfway" },
  { id: "guided", title: "Guide me through", description: "Check-ins at a quarter, halfway and three-quarters" },
];
const moduleNames: Record<string, string> = { focus: "Focus", sleep: "Sleep", move: "Move", grocery: "Trolley", food: "Eat", alarm: "Alarms", clock: "Timers", calendar: "Calendar & history" };
// A plain timer's own title is "Your timer", so its label says what's happening instead.
const activityLabels = { pip: "Your focus time", luma: "Your wind-down", bounce: "Your movement time", tock: "Counting down" };
// A food change left open in Eat (a save that didn't go through) has to be finished first; Eat keeps it for review.
const foodOpen = "There’s an unfinished change in Eat. Finish or cancel it there, then try again.";
const activityMessages = { pip: "One thing in front of you. Everything else can wait here.", luma: "Nothing to finish. A little space to settle.", bounce: "At your pace. A pause is always welcome.", tock: "Time is taken care of." };
// food: a food-space change saved alongside (the assistant's planned meal), undone with the rest.
type LastChange = { before: Entry[]; applied: Entry[]; summary: string; undone?: boolean; food?: string };

export function DaywellHost({ a, immersive = false, cozy = false, company = "quiet" }: { a: AppState; immersive?: boolean; cozy?: boolean; company?: "huddle" | "perch" | "quiet" }) {
  const [text, setText] = useState("");
  const [typed, setTyped] = useState(false);
  const [heard, setHeard] = useState("");
  // The Plus assistant (lib/assistant.ts, owner-approved design of 22 October 2026): its latest answer shows while
  // showAnswer is on, its "Here's the plan" keeps the lines still ticked, and a first question waits in askAfterConsent
  // while the person chooses what it may look at.
  const assistant = useAssistant(a);
  const [showAnswer, setShowAnswer] = useState(false);
  const [assistantPlan, setAssistantPlan] = useState<{ steps: AssistantStep[]; chosen: number[] } | null>(null);
  const [askAfterConsent, setAskAfterConsent] = useState<string | null>(null);
  // Talking: the sentence being read aloud, the chosen voice and speed, and whether the microphone opens again after
  // each reply while the person is talking rather than typing.
  const [sentence, setSentence] = useState(-1);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [voiceChoice, setVoiceChoice] = useState<VoiceChoice>({ voiceURI: null, rate: "normal" });
  const [listenAgain, setListenAgain] = useState(true);
  const [talking, setTalking] = useState(false);
  const listenAgainRef = useRef(false);
  useEffect(() => { listenAgainRef.current = listenAgain && talking; }, [listenAgain, talking]);
  // A planned meal shows what it keeps from the kitchen, so the kitchen loads once for that plan.
  const kitchenAsked = useRef<object | null>(null);
  useEffect(() => {
    if (!assistantPlan?.steps.some(step => step.kind === "meal") || a.food.snapshot || kitchenAsked.current === assistantPlan) return;
    kitchenAsked.current = assistantPlan; void a.food.refresh();
  });
  const [reply, setReply] = useState("Tell me what you need. I’ll bring the right little helper along.");
  const [pending, setPendingState] = useState<HostAction[] | null>(null);
  const pendingRef = useRef<HostAction[] | null>(null);
  const timerConfirmation = useRef(new TimerConfirmation());
  const conversationTurn = useRef(0);
  function setPending(actions: HostAction[] | null) { pendingRef.current = actions; timerConfirmation.current.clear(); setPendingState(actions); }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [routing, setRouting] = useState(false);
  const [pickerConsent, setPickerConsent] = useState<string | null>(null);
  const [recordedReply, setRecordedReply] = useState<AudioResponse | null>(null);
  const [suggestedSounds, setSuggestedSounds] = useState<SoundRequest | null>(null);
  const pickerAllowed = useRef(false), responseEpoch = useRef(0);
  const responseAbort = useRef<AbortController | null>(null), fallbackRequest = useRef("");
  const library = useLibraryAudio();
  const availableReplies = useMemo(() => library.manifest ? eligibleReplies(library.manifest) : [], [library.manifest]);
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
  const stopVoice = voice.stop, chooseVoice = voice.choose;
  useEffect(() => {
    window.addEventListener("daywell-stop-voice", stopVoice);
    return () => window.removeEventListener("daywell-stop-voice", stopVoice);
  }, [stopVoice]);
  useEffect(() => {
    if (!immersive || pending || (!heard && !voice.error)) return;
    const frame = requestAnimationFrame(() => {
      const target = voice.error ? voiceErrorRegion.current : replyRegion.current;
      target?.scrollIntoView({ block: "nearest", behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, [immersive, pending, heard, reply, voice.error]);
  const stopRecording = library.stop;
  const previousView = useRef(a.active);
  useEffect(() => {
    if(previousView.current !== a.active) { previousView.current = a.active; stopVoice(); stopRecording(); }
  }, [a.active, stopVoice, stopRecording]);
  function goRest() { voice.stop(); a.openRest(); }
  function openSounds(request: SoundRequest) {
    voice.stop(); library.stop(); setSuggestedSounds(null);
    a.openSounds(request.area || (a.active === "sleep" ? "sleep" : "relax"), request.music);
  }
  const companion: ActivityCompanion = a.timer.companion || (a.timer.mode === "Focus" ? "pip" : "tock");
  const hasActivity = Boolean(a.timer.startedAt || a.timer.endAt || a.remaining < a.timer.duration);
  const finished = hasActivity && a.remaining === 0;
  const live = useRef({ a, support, spoken, companion, voice, hasActivity });
  live.current = { a, support, spoken, companion, voice, hasActivity };

  function say(message: string) {
    setRecordedReply(null); setShowAnswer(false);
    setReply(message);
    if (spoken) voice.speak(message, companion === "luma" && hasActivity);
  }
  // Reads the assistant's reply in the phone's own voice, the words following along. While the person is talking,
  // the microphone opens again when it ends, unless they turned that off.
  function readAloud(message: string) {
    voice.speak(message, false, setSentence, () => { if (listenAgainRef.current && mounted.current) voice.start(); });
  }
  // Anything that isn't an everyday command goes to the assistant. The first time, the person chooses what it may
  // look at before anything is sent.
  async function askAssistant(value: string, agreed = false) {
    if (!assistant.consented && !agreed) { setAskAfterConsent(value); return; }
    setAssistantPlan(null); setShowAnswer(false); setSentence(-1);
    const result = await assistant.ask(value);
    if (!mounted.current || !result) return;
    if (result === "consent") { setAskAfterConsent(value); return; }
    setShowAnswer(true);
    if (result.steps.length) setAssistantPlan({ steps: result.steps, chosen: result.steps.map((_, index) => index) });
    if (spoken) readAloud(result.reply);
  }
  // End the chat: the conversation is forgotten, and listening and speaking stop.
  function endChat() {
    voice.stop(); assistant.end(); setShowAnswer(false); setAssistantPlan(null); setTalking(false); setSentence(-1); setHeard("");
    setReply("Tell me what you need. I’ll bring the right little helper along.");
  }
  // The assistant's switches in Voice & company. Turning one on is agreeing, so it's recorded the same way.
  async function changeAreas(next: AssistantArea[]) { const problem = await assistant.allow(next); if (problem) setError(problem); }
  async function withdrawAssistant() {
    endChat(); const problem = await assistant.withdraw();
    if (problem) setError(problem); else setReply("The assistant won’t look at your records or answer questions until you ask again.");
  }
  useEffect(() => {
    const cancel = () => { responseEpoch.current++; responseAbort.current?.abort(); fallbackRequest.current = ""; setRouting(false); setPickerConsent(null); setRecordedReply(null); setSuggestedSounds(null); };
    // Navigation invalidates replies and permission cards belonging to the old area.
    const currentEpoch = ++responseEpoch.current;
    queueMicrotask(() => { if (mounted.current && responseEpoch.current === currentEpoch) cancel(); });
    const hidden = () => { if (document.hidden) cancel(); };
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("pagehide", cancel);
    return () => { responseEpoch.current++; responseAbort.current?.abort(); document.removeEventListener("visibilitychange", hidden); window.removeEventListener("pagehide", cancel); };
  }, [a.active]);
  async function replyToUnknown(value: string, allowAi = pickerAllowed.current) {
    responseAbort.current?.abort(); const epoch = ++responseEpoch.current;
    const controller = new AbortController(); responseAbort.current = controller;
    setRouting(true); setPickerConsent(null); setRecordedReply(null);
    try {
      let decision = library.manifest ? localReplyDecision(value, availableReplies) : null;
      if (!decision) {
        const area: ReplyArea = (["today", "eat", "move", "sleep", "relax", "calendar"] as string[]).includes(a.active) ? a.active as ReplyArea : "today";
        const response = await fetch("/api/respond", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: value, area, allowAi }), signal: AbortSignal.any([controller.signal, AbortSignal.timeout(5000)]) });
        if (!response.ok) throw Error("The reply connection is unavailable. Your request is still here.");
        decision = await response.json() as ReplyDecision;
      }
      if (!mounted.current || responseEpoch.current !== epoch || controller.signal.aborted) return;
      if (decision.kind === "permission") { setPickerConsent(value); return; }
      if (decision.kind === "boundary") { say(decision.message); return; }
      if (decision.kind === "recorded") {
        const entry = audioResponseById.get(decision.id);
        if (entry && entry.text === decision.message && availableReplies.some(reply => reply.id === entry.id)) {
          setReply(entry.text); setRecordedReply(entry);
          if (spoken) await library.play(entry);
          return;
        }
      }
      // A request that needs fresh understanding ("plan the tomato rice for tonight") is the assistant's to answer.
      if (decision.kind === "local" && !assistant.connected) { say("Tell me the details of what you’d like to do."); return; }
      fallbackRequest.current = value;
      if (assistant.connected) await askAssistant(value);
      else say("I can’t chat just now. You can still use your everyday tools or choose something to listen to.");
    } catch (problem) {
      if (mounted.current && responseEpoch.current === epoch && !controller.signal.aborted) setError(problem instanceof Error ? problem.message : "Couldn’t find a reply. Please try again.");
    } finally { if (mounted.current && responseEpoch.current === epoch) setRouting(false); }
  }
  function rememberPreferences(next: { support?: SupportLevel; spoken?: boolean; hideCompanions?: boolean; voice?: VoiceChoice; listenAgain?: boolean }) {
    try { localStorage.setItem("daywell-host-preferences", JSON.stringify({ support, spoken, hideCompanions, voice: voiceChoice, listenAgain, ...next })); } catch { /* Preferences still work for this visit. */ }
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
  async function applyPlan(actions = pendingRef.current, confirmed?: TimerOffer) {
    if (!actions || lock.current) return;
    const missing = actions.find(action => !a.enabled(actionModule(action)));
    if (missing) { say(`Enable ${moduleNames[actionModule(missing)]} in Customize tools first. Nothing has changed.`); return; }
    lock.current = true; setBusy(true); setError("");
    let timerOffer = confirmed;
    if (actions.length === 1 && actions[0].type === "activity" && !timerOffer) {
      const approval = timerConfirmation.current.claim("", Date.now(), true);
      if (approval.kind !== "confirmed") { lock.current = false; setBusy(false); setPending(null); say("Please ask for that timer again so we can check the details."); return; }
      timerOffer = approval.offer;
    }
    if (preparedPlan.current?.actions !== actions) preparedPlan.current = { actions, items: entriesForActions(actions, today(), Date.now(), () => crypto.randomUUID()) };
    const items = preparedPlan.current.items;
    const before = a.entries.filter(entry => items.some(item => item.id === entry.id));
    try {
      a.unlockAudio();
      const applied = timerOffer ? await a.startConfirmedTimer(timerOffer) : await a.hostChange(items);
      const savedTimer = applied.find(entry => entry.kind === "timer");
      if (!mounted.current) return;
      const summary = actions.map(describeAction).join(". ") + ".";
      setLastChange({ before, applied, summary }); preparedPlan.current = null; setPending(null); setShowChanges(false); setText(""); setTyped(false);
      const activity = actions.find(action => action.type === "activity");
      setCue("");
      say(activity?.type === "activity" && savedTimer ? `${timerStatusReply(savedTimer.data)} ${actions.length > 1 ? "Your other changes are saved. " : ""}` : "Done. Your changes are saved. You can undo them below.");
    } catch (problem) { if(timerOffer)setPending(null); setError(problem instanceof Error ? problem.message : "Couldn’t save that. Please check your timer before trying again."); }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  // "Do this" for the assistant's plan: the lines still ticked become records in one go, with Undo straight after.
  async function applyAssistantPlan() {
    if (!assistantPlan || lock.current) return;
    const steps = assistantPlan.steps.filter((_, index) => assistantPlan.chosen.includes(index));
    if (!steps.length) return;
    const missing = steps.find(step => { const tool = stepModule(step); return tool && !a.enabled(tool); });
    if (missing) { say(`Enable ${moduleNames[stepModule(missing)!]} in Customize tools first. Nothing has changed.`); return; }
    const { entries, plans } = stepChanges(steps, () => crypto.randomUUID());
    if (plans.length && (a.food.draft || a.food.pending || a.food.recovered)) { setError(foodOpen); return; }
    if (plans.length && (!a.food.snapshot || !a.food.fresh)) { setError("Your kitchen is still loading. Try Do this again in a moment."); void a.food.refresh(); return; }
    lock.current = true; setBusy(true); setError("");
    const summary = steps.map(step => describeStep(step, today(), a.food.snapshot?.state).line).join(". ") + ".";
    let food: string | undefined;
    try {
      if (plans.length) {
        food = crypto.randomUUID();
        if (!await a.food.submit({ type: "plan.add", plans }, { operationId: food, quiet: true })) { food = undefined; throw Error("Couldn’t plan that meal, so nothing has changed. Open Eat to see why."); }
      }
      const applied = entries.length ? await a.hostChange(entries) : [];
      if (!mounted.current) return;
      setLastChange({ before: [], applied, summary, food }); setAssistantPlan(null); setShowChanges(false);
      say(`Done. ${steps.length === 1 ? "It’s" : "They’re"} saved, and you can undo ${steps.length === 1 ? "it" : "them"} below.`);
    } catch (problem) {
      const message = problem instanceof Error ? problem.message : "Couldn’t save that. Please try again.";
      // A meal planned before the rest failed stays undoable.
      if (food && mounted.current) { setLastChange({ before: [], applied: [], summary, food }); setError(`The meal is planned, but the rest couldn’t be saved. ${message}`); }
      else setError(message);
    } finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  async function undo() {
    if (lock.current) return;
    if (!undoable) { say("There’s no host change to undo in this visit."); return; }
    if (!canUndoHostChange(a.entries, undoable.applied)) { say("One of those entries has changed since then. Open your tools to edit it; I’ve kept the newer change."); return; }
    lock.current = true; setBusy(true); setError("");
    let foodUndone = false;
    try {
      if (undoable.food) {
        if (a.food.draft || a.food.pending || a.food.recovered) throw Error(foodOpen);
        if (!await a.food.submit({ type: "undo", operationId: undoable.food }, { quiet: true })) throw Error("Couldn’t undo the planned meal. Open Eat to see why.");
        foodUndone = true;
      }
      const added = undoable.applied.filter(entry => !undoable.before.some(old => old.id === entry.id)).map(entry => entry.id);
      if (undoable.before.length || added.length) await a.hostChange(undoable.before, added);
      if (!mounted.current) return;
      setChanges(previous => previous.map(change => change === undoable ? { ...change, undone: true } : change)); setPending(null); setCue(""); say("Undone. Your previous entries are restored.");
    } catch (problem) {
      if (foodUndone) setChanges(previous => previous.map(change => change === undoable ? { ...change, food: undefined } : change));
      setError(problem instanceof Error ? problem.message : "Couldn’t undo that. Please try again.");
    }
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
    setSuggestedSounds(null);
    const turn = conversationTurn.current;
    responseEpoch.current++; responseAbort.current?.abort(); fallbackRequest.current = ""; setRouting(false); setPickerConsent(null); library.stop(); setRecordedReply(null);
    voice.silence(); setError(""); setHeard(value.trim()); assistant.clearError();
    const boundary = wellnessBoundary(value);
    if (boundary) { setPending(null); preparedPlan.current = null; setCue(""); setSupport("quiet"); voice.stop(); assistant.end(); setAssistantPlan(null); setShowAnswer(false); setTalking(false); setReply(boundary); return; }
    if (timerConfirmation.current.offer) {
      const agreement = timerConfirmation.current.claim(value);
      if (agreement.kind === "confirmed") return applyPlan([agreement.offer.action], agreement.offer);
      if (agreement.kind === "replace") { say('Say “replace the timer” to replace your current timer, or tap Start timer.'); return; }
      setPending(null);
      if (agreement.kind === "cancelled") { say("That suggestion is cleared. Your current timer stays as it is."); return; }
      if (agreement.kind === "expired" && timerConsent(value) !== "other") { say("Please ask for that timer again so we can check the details."); return; }
    }
    if (/^(?:just rest|take a break|stop scrolling|help me stop scrolling|open relax)$/i.test(value.trim())) { goRest(); return; }
    if (/^(?:open |show )?(?:explore|move|eat|sleep)$/i.test(value.trim())) { a.setActive(value.trim().toLowerCase().replace(/^(open |show )/, "")); return; }
    // "What can I cook?" is a question for the assistant when it's there; logging and planning keep their own reviews.
    const captureMode = foodCaptureMode(value);
    if (captureMode && !(captureMode === "plan" && assistant.connected && /\bwhat (?:can|could) i (?:make|cook)\b/i.test(value))) {
      window.dispatchEvent(new CustomEvent("daywell-capture", { detail: { mode: captureMode, text: value } }));
      say("Let’s check what you meant before saving anything."); return;
    }
    const request = parseHostRequest(value);
    if (request.type === "sounds") {
      setPending(null);
      if (request.intent === "open") { openSounds(request); return "The sounds are open. Nothing is playing yet; choose a sound and press Play."; }
      say(soundSuggestion); setSuggestedSounds(request);
      return `${soundSuggestion} The Open music and sounds button is shown. The user chooses whether to open it; nothing is playing.`;
    }
    // Conversation must not approve or clear a plan that is waiting for review.
    if (request.type === "timer-status") { try { const saved = await a.readTimer(); say(timerStatusReply(saved.timer || initialTimer)); } catch { say("I couldn’t check your saved timer. Please try again."); } return; }
    if (request.type === "reply") { say(request.message); return; }
    if (request.type === "control") {
      if (request.command === "confirm") { if (assistantPlan && !pending) return applyAssistantPlan(); if (!pending) { say("Tell me what you’d like to do first."); return; } return applyPlan(); }
      if (request.command === "undo") return undo();
      if (request.command === "changes") { setShowChanges(true); say(lastChange ? `${lastChange.undone ? "Already undone: " : "Last change: "}${lastChange.summary}` : "I haven’t changed anything in this visit."); return; }
      if (request.command === "cancel") { setPending(null); setAssistantPlan(null); say("That request is cleared. Your current activity stays as it is."); return; }
      setPending(null); return controlActivity(request.command);
    }
    // During a conversation with the assistant, a follow-up goes straight back to it.
    if (request.type === "unknown") { if (assistant.connected && assistant.answer) await askAssistant(value); else await replyToUnknown(value); return; }
    setPending(null);
    if (request.type === "support") { changeSupport(request.level); setReply(request.level === "quiet" ? "I’ll keep you company quietly." : "Your encouragement preference is updated."); return; }
    if (request.type === "open") {
      if (request.module !== "calendar" && !a.enabled(request.module)) { say(`Enable ${moduleNames[request.module]} in Customize tools first.`); return; }
      a.setActive(request.module); if (request.view) a.setCalendarView(request.view); if (request.kind) a.openEditor(request.kind);
      say(request.kind ? "Fill in the details, then press Save. I won’t guess them." : request.module === "calendar" ? request.view === "history" ? "Your saved progress and reflections are in Look back." : "Your calendar is open. Choose a day to see or add plans." : "Your list is open. Your current activity stays here."); return;
    }
    const missing = request.actions.find(action => !a.enabled(actionModule(action)));
    if (missing) { say(`Enable ${moduleNames[actionModule(missing)]} in Customize tools first. Nothing has changed.`); return; }
    if (request.actions.length === 1 && request.actions[0].type === "activity") {
      const saved = await a.readTimer();
      if (conversationTurn.current !== turn || !mounted.current) return "That request is no longer current. Nothing was proposed or started. Ask for the current activity and duration again.";
      setPending(request.actions);
      const offer = timerConfirmation.current.prepare(request.actions, saved.version, saved.timer, crypto.randomUUID())!;
      const instruction = offer.replaces ? 'This replaces your current timer. Say “replace the timer” or tap Start timer to agree.' : 'Say “okay” or tap Start timer when you’re ready.';
      const result = `${describeAction(offer.action)}. ${instruction} The proposal has NOT started. After agreement check the saved timer before claiming success.`;
      say(`${describeAction(offer.action)}. ${instruction}`);
      return result;
    }
    setPending(request.actions); setAssistantPlan(null);
    say(`Here’s what I understood. ${request.actions.map(describeAction).join(". ")}. ${request.actions.some(action => action.type === "activity") && hasActivity && !finished ? "This will replace your current activity. " : ""}Say yes or press Do this.`);
  }
  function sendText() {
    voice.clearError(); setTalking(false);
    if (!text.trim() || busy || routing || assistant.thinking) return;
    const sent = text; setText("");
    void receive(sent);
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
        if (typeof saved?.listenAgain === "boolean") setListenAgain(saved.listenAgain);
        if (["slower", "normal", "faster"].includes(saved?.voice?.rate)) {
          const choice: VoiceChoice = { voiceURI: typeof saved.voice.voiceURI === "string" ? saved.voice.voiceURI : null, rate: saved.voice.rate };
          setVoiceChoice(choice); chooseVoice(choice);
        }
      } catch { /* Use quiet defaults when browser storage is unavailable. */ }
    });
    const openHost = (event: Event) => {
      const disclosure = region.current?.closest("details"); if (disclosure) disclosure.open = true;
      region.current?.scrollIntoView({ behavior: "instant", block: "start" });
      const detail = (event as CustomEvent<{ text?: string; mode?: string; show?: boolean }>).detail;
      if (detail?.show) return;
      const request = detail?.text || (detail?.mode === "meal" ? "Log a meal" : undefined);
      typeRequest(request);
    };
    window.addEventListener("daywell-host", openHost);

    return () => { mounted.current = false; window.removeEventListener("daywell-host", openHost); };
  }, [typeRequest, chooseVoice]);

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
      if (document.hidden || current.a.active === "relax" || current.voice.listening || current.voice.speaking) return;
      const message = guidanceAt(current.companion, fraction, current.support);
      if (message) { setCue(message); if (current.spoken) current.voice.speak(message, current.companion === "luma"); }
    };
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, []);
  const micState = voice.blocked ? "blocked"
    : busy || routing || assistant.thinking ? "thinking"
    : voice.listening ? "listening"
    : voice.speaking || library.status === "playing" ? "speaking" : "idle";
  const wasListening = useRef(false);
  useEffect(() => {
    const listening = micState === "listening";
    if (listening !== wasListening.current) { try { navigator.vibrate?.(15); } catch { /* Vibration is optional. */ } }
    wasListening.current = listening;
  }, [micState]);

  return <section className={`daywell-host ${hasActivity ? "host-is-active" : ""}`} data-hide-companions={hideCompanions} data-listening={voice.listening} data-mic={micState} data-has-response={Boolean(heard || busy || pending || error || assistant.answer || assistant.thinking || assistantPlan)} data-has-changes={changes.length > 0 || showChanges} ref={region} aria-labelledby="host-heading">
    <div className="host-topline"><span className="host-identity"><Sun size={21} />Daywell is here</span><button className="host-settings-toggle" aria-expanded={settingsOpen} aria-controls="host-settings" onClick={() => setSettingsOpen(!settingsOpen)}><Settings2 size={17} />Voice & company</button></div>
    <div className="host-invitation"><div><h2 id="host-heading">{immersive ? `${hasActivity ? "A little time for you" : cozy ? "A little company" : "Take a moment"}${a.settings.name !== "You" ? `, ${a.settings.name}` : ""}.` : `What’s on your mind${a.settings.name !== "You" ? `, ${a.settings.name}` : ""}?`}</h2><p>{cozy ? "Tell Daywell what you need. Your little helpers will come along." : immersive ? "Whatever’s on your mind, start here." : "One place to ask. A little company along the way."}</p></div><span className="host-listening-mark" aria-hidden="true"><AudioLines size={46} /></span></div>
    {company !== "quiet" && !hasActivity && !hideCompanions && <div className="nook-company" aria-hidden="true"><CompanionPortrait id="luma" size={220} decorative eager /><CompanionPortrait id="bounce" size={220} decorative eager /><CompanionPortrait id="nori" size={300} motion={hostCompanionMotion(micState)} decorative eager /></div>}
    {settingsOpen && <div className="host-settings" id="host-settings"><h3>Make yourself comfortable</h3><div className="voice-provider"><strong>{assistant.connected ? "Ask Daywell about your day" : "Questions are unavailable right now"}</strong><p>{assistant.connected ? "Talk or type. Your microphone stays off until you tap Talk to Daywell." : "You can still use your everyday tools and listen to a quiet moment."}</p></div>{assistant.connected && <div className="host-assistant-settings"><h4>What the assistant can see</h4><AreaSwitches chosen={assistant.areas} onChange={next => void changeAreas(next)} />{assistant.consented && <button type="button" className="host-text-button" onClick={() => void withdrawAssistant()}>Stop the assistant looking at my records</button>}</div>}<button type="button" className="host-text-button host-voice-button" disabled={!voice.canSpeak} onClick={() => setVoiceOpen(true)}><Volume2 size={16} />Daywell’s voice and speed</button><label className="host-check"><input type="checkbox" checked={spoken} disabled={!voice.canSpeak} onChange={event => { setSpoken(event.target.checked); rememberPreferences({ spoken: event.target.checked }); if (!event.target.checked) voice.silence(); }} />Read replies aloud</label><label className="host-check"><input type="checkbox" checked={hideCompanions} onChange={event => { setHideCompanions(event.target.checked); rememberPreferences({ hideCompanions: event.target.checked }); }} />Hide companion pictures</label><CompanionMotionControl /><fieldset><legend>During an activity</legend>{supportOptions.map(option => <label className="host-support-option" key={option.id}><input type="radio" name="host-support" checked={support === option.id} onChange={() => changeSupport(option.id)} /><span><strong>{option.title}</strong><small>{option.description}</small></span></label>)}</fieldset><small>Saved on this browser. Check-ins happen while Daywell is open and visible. Winding down ends silently.</small></div>}
    <div className="host-input-actions"><button className="host-talk" disabled={busy || routing} onClick={() => { if (voice.listening) voice.stop(); else if (voice.available) { setSpoken(true); setTalking(true); rememberPreferences({ spoken: true }); voice.start(); } else { typeRequest(); setError("This browser can’t listen. Type your request below instead."); } }}><span className="host-talk-symbol"><span className="mic-glow" aria-hidden="true" /><span className="mic-ring" aria-hidden="true" /><span className="mic-ring" aria-hidden="true" /><span className="mic-stack" aria-hidden="true"><span className="mic-layer mic-layer-mic"><Mic size={20} /></span><span className="mic-layer mic-layer-bars"><i /><i /><i /><i /><i /></span><span className="mic-layer mic-layer-dots"><i /><i /><i /></span><span className="mic-layer mic-layer-stop"><Square size={20} /></span><span className="mic-layer mic-layer-off"><MicOff size={20} /></span></span></span><span className="host-talk-label">{voice.listening ? "Stop listening" : "Talk to Daywell"}</span></button><button className="host-type" aria-label="Type a request" onClick={() => { setTalking(false); typeRequest(); }}><Keyboard size={18} />Type instead</button>{voice.speaking && <button className="host-type" onClick={voice.silence}><VolumeX size={18} />Stop speaking</button>}</div>
    <p className="host-voice-note">Daywell is your AI companion for everyday routines.</p><PrivacyDetails><p>{voice.available ? "Tap Talk to Daywell to say something. Your phone or browser turns your words into text, and some do this online, with Apple or Google. Replies can be read in your device’s own voice." : "Type a request or use your keyboard’s dictation."} Everyday commands stay in Daywell. Other questions go to the assistant, which uses OpenAI; before it first looks at your records, you choose what it can see. Listening to a saved recording leaves your microphone off.</p></PrivacyDetails>
    <div className="host-agent-ui">{pickerConsent && <div className="host-consent" aria-label="Find a reply"><strong>A few words for this moment?</strong><p>Allow Daywell to share your request with an AI service to find a helpful reply for this visit.</p><PrivacyDetails><p>Requests without an exact match, together with the area you are using, go to TypeSafe’s Jev to choose an existing reply. Your saved journal and profile are not sent. TypeSafe processes inputs in the US and retains them under its policy; it says inputs are not used for model training. Daily request limits apply.</p><a href="https://typesafe.ai/legal/privacy-policy" target="_blank" rel="noreferrer">TypeSafe privacy policy</a></PrivacyDetails><button className="host-primary" onClick={() => { pickerAllowed.current = true; void replyToUnknown(pickerConsent, true); }}>Find a reply</button><button className="host-text-button" onClick={() => { setPickerConsent(null); setReply("No problem. You can still use your tools or choose something to listen to."); }}>Not now</button></div>}
    {typed && <p className="agent-caption" role="status">{assistant.connected ? "Ask about your day, or try “set a timer for ten minutes”." : "Try “set a timer for ten minutes”."}</p>}</div>
    {typed && <form className="host-form" onSubmit={submit}><label htmlFor="host-request">Tell Daywell what you need</label><div><textarea id="host-request" ref={input} value={text} maxLength={600} rows={2} placeholder={assistant.connected ? "What can I cook tonight?" : "Add milk and focus on my email for 10 minutes"} onChange={event => setText(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendText(); } }} /><button type="submit" disabled={!text.trim() || busy || routing || assistant.thinking} aria-label="Send request"><Send size={19} /></button></div></form>}
    {!hasActivity && !pending && <div className="host-suggestions" aria-label="A place to begin"><button className="rest-entry" onClick={goRest}>Just rest</button><button onClick={()=>a.setActive("explore")}>Explore</button></div>}
    {!hasActivity && !pending && <Link className="host-library-link" href="/audio-library" onClick={() => voice.stop()}>Just listen · little words of comfort</Link>}
    {suggestedSounds && <div className="host-consent" aria-label="Music and sounds"><p>Gentle music and nature sounds, whenever you want them.</p><button className="host-primary" onClick={() => openSounds(suggestedSounds)}>Open music and sounds</button><button className="host-text-button" onClick={() => setSuggestedSounds(null)}>Not now</button></div>}
    {voice.listening && <Listening heard={voice.transcript} onSend={voice.finish} onStop={voice.stop} onType={() => { voice.stop(); setTalking(false); typeRequest(); }} />}
    <div className="host-conversation" ref={replyRegion} aria-live="polite" aria-atomic="true">{showAnswer && assistant.answer ? <p className="sr-only">{assistant.answer.reply}</p> : <>{heard && !voice.listening && <p className="host-heard">{`You: ${heard}`}</p>}<p className="host-reply"><span>Daywell</span>{busy ? "Taking care of that…" : assistant.thinking ? "Thinking…" : routing ? "Finding the right reply…" : reply}</p></>}
      {recordedReply && <div className="host-recorded-reply"><button className="host-text-button" onClick={() => library.status === "idle" ? void library.play(recordedReply) : library.stop()}>{library.status === "idle" ? "Listen" : "Stop playback"}</button></div>}
    </div>{showAnswer && assistant.answer && <AssistantTurn answer={assistant.answer} sentence={sentence} speaking={voice.speaking} busy={busy || assistant.thinking} onChip={chip => void receive(chip)} onStopSpeaking={() => { voice.silence(); setSentence(-1); }} />}
    {assistant.answer && <div className="assistant-row is-end">{talking && listenAgain && voice.speaking ? <span><Mic size={16} aria-hidden />I’ll listen again when I finish.</span> : <span />}<button type="button" className="host-text-button" onClick={endChat}>End the chat</button></div>}
    {assistant.error && <p className="host-error" role="alert">{assistant.error}</p>}{library.error && <p className="host-error" role="status">{library.error}</p>}{(error || voice.error) && <p className="host-error" ref={voiceErrorRegion} role="alert">{error || voice.error}</p>}
    {pending && <div className="host-plan" ref={planRegion} tabIndex={-1} aria-label="Review your request"><h3>Here’s the plan</h3><ul>{pending.map((action, index) => <li key={index}><Check size={16} />{describeAction(action)}</li>)}</ul>{pending.some(action => action.type === "activity") && hasActivity && !finished && <p className="host-replace-note">This replaces your current activity. Your lists stay saved.</p>}<div><button className="host-primary" disabled={busy} onClick={() => void applyPlan()}>{busy ? "Saving…" : pending.length === 1 && pending[0].type === "activity" ? "Start timer" : "Do this"}</button><button className="host-text-button" disabled={busy} onClick={() => { setPending(null); voice.silence(); setReply("Request cleared. Your saved day stays as it is."); }}>Cancel request</button></div></div>}
    {assistantPlan && !pending && <AssistantPlan steps={assistantPlan.steps} chosen={assistantPlan.chosen} kitchen={a.food.snapshot?.state ?? null} busy={busy} onToggle={index => setAssistantPlan({ ...assistantPlan, chosen: assistantPlan.chosen.includes(index) ? assistantPlan.chosen.filter(item => item !== index) : [...assistantPlan.chosen, index] })} onDo={() => void applyAssistantPlan()} onChange={() => { setAssistantPlan(null); typeRequest("Change the plan: "); }} />}
    <div className="host-history-actions"><button disabled={busy || !undoable} onClick={() => void undo()}><Undo2 size={15} />Undo last change</button><button onClick={() => setShowChanges(!showChanges)} aria-expanded={showChanges}>What changed?<ChevronDown size={14} /></button>{spoken && <span><Volume2 size={14} />Replies aloud</span>}</div>
    {showChanges && <div className="host-change-summary">{lastChange ? `${lastChange.undone ? "Undone: " : "Last change: "}${lastChange.summary}` : "Nothing changed in this visit yet."}</div>}
    {ack && <div className="host-ack" role="status">{!hideCompanions && <CompanionPortrait id={ack.id} size={49} decorative />}<span><Check size={15} />{ack.text}</span></div>}
    {hasActivity && <section className={`host-activity host-activity-${companion}`} aria-label="Current activity"><div className="host-activity-main">{!hideCompanions && <CompanionPortrait id={companion} size={144} motion={activityCompanionMotion(companion, Boolean(a.timer.endAt), finished)} decorative eager />}<div><span className="host-activity-label">{finished ? "Your time is complete" : a.timer.endAt ? activityLabels[companion] : "Paused, whenever you’re ready"}</span><h3>{a.timer.title}</h3><p>{finished ? companion === "luma" ? "You can leave the day here. Rest whenever you’re ready." : "Take a moment. There’s no rush to start something else." : activityMessages[companion]}</p>{!hideCompanions && <small>{companions[companion].name} is keeping you company</small>}</div><div className="host-time" role="timer" aria-label={`${Math.floor(a.remaining / 60)} minutes ${a.remaining % 60} seconds remaining`}>{String(Math.floor(a.remaining / 60)).padStart(2, "0")}<span>:</span>{String(a.remaining % 60).padStart(2, "0")}</div></div>{!finished && <div className="host-activity-controls"><button className="host-primary" disabled={busy} onClick={() => void controlActivity(a.timer.endAt ? "pause" : "resume")}>{a.timer.endAt ? <Pause size={16} /> : <Play size={16} />}{a.timer.endAt ? "Pause activity" : "Resume activity"}</button><button className="host-text-button" disabled={busy} onClick={() => void controlActivity("end")}><X size={15} />End activity</button>{companion !== "tock" && <label>Company<select aria-label="Activity encouragement" value={support} onChange={event => changeSupport(event.target.value as SupportLevel)}>{supportOptions.map(option => <option key={option.id} value={option.id}>{option.title}</option>)}</select></label>}</div>}{finished && <button className="host-text-button" disabled={busy} onClick={() => void controlActivity("end")}>Clear finished activity</button>}{finished && companion === "bounce" && <button className="host-primary" onClick={() => { a.openEditor("move"); a.setDraft({ title: a.timer.title, date: today(), minutes: Math.round(a.timer.duration / 60) }); }}>Log this movement</button>}{cue && !finished && <p className="host-cue" role="status">{cue}</p>}</section>}
    <details className="host-help"><summary>Things you can say</summary><p>Use these everyday phrases by voice or text. Names are optional; Daywell brings the right helper.</p><div className="host-phrase-list">{["Add milk and eggs to my list", "Add a task to finish my email", "Focus on my email for ten minutes", "Add milk and focus on my email for 10 minutes", "Help me wind down for five minutes", "Start a walk for fifteen minutes", "Set a timer for five minutes", "Set an alarm for 7 am", "Log a meal", "Log my sleep", "Show my calendar", "Show my progress", "Plan an event", "Add a reflection", "Show my shopping list", "Stay quiet", "Undo that"].map(phrase => <button key={phrase} onClick={() => typeRequest(phrase)}>{phrase}</button>)}</div><p>Ask for a timer, add something to your list, or start a chat. For food, share a picture or a few words, then check the details before saving.</p></details>
    {askAfterConsent !== null && <AssistantConsent onClose={() => { setAskAfterConsent(null); say("No problem. Nothing was sent. Your everyday tools still work."); }} onAllow={async areas => { const problem = await assistant.allow(areas); if (problem) return problem; const question = askAfterConsent; setAskAfterConsent(null); void askAssistant(question, true); return ""; }} />}
    {voiceOpen && <VoiceSheet voices={voice.voices} choice={voiceChoice} spoken={spoken} listenAgain={listenAgain} onChoice={next => { setVoiceChoice(next); voice.choose(next); rememberPreferences({ voice: next }); }} onSpoken={on => { setSpoken(on); rememberPreferences({ spoken: on }); if (!on) voice.silence(); }} onListenAgain={on => { setListenAgain(on); rememberPreferences({ listenAgain: on }); }} onPreview={voice.preview} onClose={() => setVoiceOpen(false)} />}
  </section>;
}
