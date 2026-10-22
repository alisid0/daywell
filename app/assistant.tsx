"use client";
import { Fragment, useState } from "react";
import { ArrowUp, AudioLines, CalendarDays, Check, Eye, Footprints, Lock, Mic, Moon, Play, Smartphone, Square, Utensils, Volume2, type LucideIcon } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CompanionPortrait } from "@/components/daywell-companions";
import { companions } from "@/lib/companions";
import { today } from "@/lib/daywell";
import type { FoodState } from "@/lib/food";
import { assistantAreaNames, assistantAreas, describeStep, lookedWords, type AssistantArea, type AssistantStep } from "@/lib/assistant";
import { AiReport } from "./ai-report";
import { PrivacyDetails } from "./privacy-details";
import type { AssistantAnswer } from "./use-assistant";
import { sentences, type PhoneVoice, type VoiceChoice } from "./use-host-voice";

// The Plus assistant's screens (owner-approved design, 22 October 2026): asking about your day, "Here's the plan",
// the first-time choice of what it can see, listening, speaking and Daywell's voice. The host (app/daywell-host.tsx)
// holds the state; these only show it.
const areaIcons: Record<AssistantArea, LucideIcon> = { food: Utensils, move: Footprints, sleep: Moon, plans: CalendarDays };
const list = (words: string[]) => words.length < 2 ? words.join("") : `${words.slice(0, -1).join(", ")} and ${words.at(-1)}`;
function Trio({ size }: { size: number }) {
  return <span className="assistant-trio" aria-hidden>{(["luma", "nori", "bounce"] as const).map(id => <CompanionPortrait key={id} id={id} size={size} decorative/>)}</span>;
}
function Switch({ on }: { on: boolean }) { return <span className={`assistant-switch${on ? " is-on" : ""}`} aria-hidden><span/></span>; }

// What the assistant may look at. Nothing is switched on for the person: they choose, then agree (UK GDPR asks for a
// clear yes for health records, never a pre-ticked one).
export function AreaSwitches({ chosen, onChange }: { chosen: AssistantArea[]; onChange: (next: AssistantArea[]) => void }) {
  return <div role="group" aria-label="What they can look at" className="assistant-areas">{assistantAreas.map(area => {
    const Icon = areaIcons[area], on = chosen.includes(area);
    return <button key={area} type="button" role="switch" aria-checked={on} onClick={() => onChange(on ? chosen.filter(item => item !== area) : [...chosen, area])}>
      <span className={`assistant-area-icon is-${area}`} aria-hidden><Icon size={20}/></span><span className="assistant-area-name">{assistantAreaNames[area]}</span><Switch on={on}/>
    </button>;
  })}</div>;
}

export function AssistantConsent({ onAllow, onClose }: { onAllow: (areas: AssistantArea[]) => Promise<string>; onClose: () => void }) {
  const [chosen, setChosen] = useState<AssistantArea[]>([]), [saving, setSaving] = useState(false), [error, setError] = useState("");
  async function allow() { setSaving(true); setError(""); const problem = await onAllow(chosen); setSaving(false); if (problem) setError(problem); }
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="assistant-sheet" showCloseButton={false} aria-describedby={undefined}>
      <span className="assistant-grip" aria-hidden/>
      <div className="assistant-sheet-head"><Trio size={44}/><DialogTitle asChild><h2>Let Daywell look at your day?</h2></DialogTitle></div>
      <p>To answer questions like “what can I cook?” or “how was my week?”, Bounce, Nori and Luma look at what you’ve saved. Choose what they can see.</p>
      <AreaSwitches chosen={chosen} onChange={setChosen}/>
      {chosen.length < assistantAreas.length && <button type="button" className="assistant-all" onClick={() => setChosen([...assistantAreas])}>Turn them all on</button>}
      <p className="assistant-never"><Lock size={18} aria-hidden/>Never shared: your age, sex, height and weight.</p>
      <p className="assistant-fine">Asking sends your message and the records it needs to OpenAI to write the reply. Daywell doesn’t keep the chat after your visit.</p>
      <PrivacyDetails><p>Only the areas you turn on are read, and only what a reply needs: the food in your kitchen with its amounts, the names of recent and planned meals, your trolley list, recent moves, sleep times and how you slept, to-dos, calendar plans and alarms. Nutrition numbers, notes and your About you details are never sent. OpenAI doesn’t use these requests to train its models, and Daywell asks it not to store them. With everything off, the assistant reads nothing of yours.</p></PrivacyDetails>
      {error && <p className="host-error" role="alert">{error}</p>}
      <div className="assistant-sheet-actions"><button type="button" className="host-primary" disabled={saving} onClick={() => void allow()}>{saving ? "Saving…" : "Allow and ask"}</button><button type="button" className="host-text-button" onClick={onClose}>Not now</button></div>
      <p className="assistant-fine is-center">Change this any time in Voice &amp; company.</p>
    </DialogContent>
  </Dialog>;
}

// One exchange: what the person asked, and the companion's reply. While the reply is read aloud, the sentence being
// read is marked, so the words on screen follow the voice.
export function AssistantTurn({ answer, sentence, speaking, busy, onChip, onStopSpeaking }: { answer: AssistantAnswer; sentence: number; speaking: boolean; busy: boolean; onChip: (text: string) => void; onStopSpeaking: () => void }) {
  const parts = sentences(answer.reply), reading = speaking && sentence >= 0;
  return <div className="assistant-turn">
    <p className="assistant-you"><span className="sr-only">You: </span>{answer.asked}</p>
    <div className="assistant-says">
      <span className="assistant-face"><CompanionPortrait id={answer.companion} size={48} decorative/>{speaking && <span className="assistant-badge" aria-hidden><Volume2 size={14}/></span>}</span>
      <p className="assistant-bubble"><span className="sr-only">{companions[answer.companion].name}: </span>{reading ? parts.map((part, index) => <Fragment key={index}>{index ? " " : ""}{index === sentence ? <mark>{part}</mark> : <span className={index > sentence ? "is-later" : undefined}>{part}</span>}</Fragment>) : answer.reply}</p>
    </div>
    {speaking && <div className="assistant-row"><span role="status"><AudioLines size={18} aria-hidden/>Speaking with your phone’s voice</span><button type="button" className="assistant-chip is-small" onClick={onStopSpeaking}><Square size={14} aria-hidden/>Stop</button></div>}
    {answer.chips.length > 0 && <div className="assistant-chips" role="group" aria-label="Next steps">{answer.chips.map((chip, index) => <button key={chip} type="button" className={`assistant-chip${index === 0 ? " is-first" : ""}`} disabled={busy} onClick={() => onChip(chip)}>{chip}</button>)}</div>}
    <div className="assistant-meta">{answer.looked.length > 0 && <span><Eye size={16} aria-hidden/>Looked at {list(answer.looked.map(area => lookedWords[area]))}</span>}<AiReport key={answer.reply} source="conversation" text={answer.reply}/></div>
  </div>;
}

// "Here's the plan": every line starts ticked; tapping one leaves it out. Nothing changes until Do this.
export function AssistantPlan({ steps, chosen, kitchen, busy, onToggle, onDo, onChange }: { steps: AssistantStep[]; chosen: number[]; kitchen: FoodState | null; busy: boolean; onToggle: (index: number) => void; onDo: () => void; onChange: () => void }) {
  return <div className="assistant-plan" role="region" aria-labelledby="assistant-plan-title">
    <h3 id="assistant-plan-title">Here’s the plan</h3>
    <ul>{steps.map((step, index) => { const { line, detail } = describeStep(step, today(), kitchen), on = chosen.includes(index); return <li key={index}>
      <button type="button" role="checkbox" aria-checked={on} disabled={busy} onClick={() => onToggle(index)}><span className="assistant-tick" aria-hidden>{on && <Check size={16}/>}</span><span><strong>{line}</strong>{detail && <small>{detail}</small>}</span></button>
    </li>; })}</ul>
    <div className="assistant-plan-actions"><button type="button" className="host-primary" disabled={busy || !chosen.length} onClick={onDo}><Check size={18} aria-hidden/>{busy ? "Saving…" : "Do this"}</button><button type="button" className="host-text-button" disabled={busy} onClick={onChange}>Change</button></div>
    <p className="assistant-fine is-center">Tap a line to leave it out. You can undo straight after.</p>
  </div>;
}

// Listening: the words appear as they're heard, and send by themselves at a pause.
export function Listening({ heard, onSend, onStop, onType }: { heard: string; onSend: () => void; onStop: () => void; onType: () => void }) {
  return <section className="assistant-listening" aria-label="Talking with Daywell">
    <Trio size={48}/>
    <span className="assistant-mic-rings"><button type="button" className="assistant-mic" aria-label="Stop listening" onClick={onStop}><Mic size={40} aria-hidden/></button></span>
    <div role="status" className="assistant-listening-text"><h3>Listening…</h3><p>I’ll send it when you pause.</p></div>
    {heard && <p className="assistant-you is-live"><span className="sr-only">You, so far: </span>{heard}</p>}
    <div className="assistant-listening-actions"><button type="button" className="host-primary" disabled={!heard} onClick={onSend}><ArrowUp size={18} aria-hidden/>Send now</button><button type="button" className="assistant-ghost" onClick={onStop}><Square size={16} aria-hidden/>Stop</button></div>
    <button type="button" className="host-text-button" onClick={onType}>Type instead</button>
    <p className="assistant-fine"><Smartphone size={16} aria-hidden/>Your phone or browser turns your words into text. Some do this online, with Apple or Google.</p>
  </section>;
}

// Daywell's voice: the phone's own voices, how fast they speak, and whether replies are read and the microphone
// opens again after each one.
export function VoiceSheet({ voices, choice, spoken, listenAgain, onChoice, onSpoken, onListenAgain, onPreview, onClose }: { voices: PhoneVoice[]; choice: VoiceChoice; spoken: boolean; listenAgain: boolean; onChoice: (next: VoiceChoice) => void; onSpoken: (on: boolean) => void; onListenAgain: (on: boolean) => void; onPreview: (uri: string) => void; onClose: () => void }) {
  const current = choice.voiceURI && voices.some(voice => voice.uri === choice.voiceURI) ? choice.voiceURI : voices[0]?.uri;
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="assistant-sheet" showCloseButton={false} aria-describedby={undefined}>
      <span className="assistant-grip" aria-hidden/>
      <div className="assistant-sheet-head"><Trio size={40}/><DialogTitle asChild><h2>Daywell’s voice</h2></DialogTitle></div>
      <p>Pick how Bounce, Nori and Luma sound when they talk to you.</p>
      {voices.length ? <div role="radiogroup" aria-label="Voice" className="assistant-voices">{voices.map(voice => <div key={voice.uri} className="assistant-voice">
        <button type="button" role="radio" aria-checked={voice.uri === current} onClick={() => onChoice({ ...choice, voiceURI: voice.uri })}><span className="assistant-radio" aria-hidden><span/></span><span><strong>{voice.name}</strong><small>{voice.lang}</small></span></button>
        <button type="button" className="assistant-play" aria-label={`Hear ${voice.name}`} onClick={() => onPreview(voice.uri)}><Play size={18} aria-hidden/></button>
      </div>)}</div> : <p className="assistant-fine">This browser has no voices to choose from. Replies are still written down.</p>}
      <p className="assistant-fine">These voices come from your phone. You can add more in your phone’s settings.</p>
      <div className="assistant-speed"><h3 id="assistant-speed">Speed</h3><div role="radiogroup" aria-labelledby="assistant-speed">{(["slower", "normal", "faster"] as const).map(rate => <button key={rate} type="button" role="radio" aria-checked={choice.rate === rate} onClick={() => onChoice({ ...choice, rate })}>{rate === "slower" ? "Slower" : rate === "normal" ? "Normal" : "Faster"}</button>)}</div></div>
      <div className="assistant-areas">
        <button type="button" role="switch" aria-checked={spoken} onClick={() => onSpoken(!spoken)}><span className="assistant-area-icon" aria-hidden><Volume2 size={20}/></span><span className="assistant-area-name">Read replies aloud<small>Turn off to read them instead</small></span><Switch on={spoken}/></button>
        <button type="button" role="switch" aria-checked={listenAgain} onClick={() => onListenAgain(!listenAgain)}><span className="assistant-area-icon" aria-hidden><Mic size={20}/></span><span className="assistant-area-name">Keep listening<small>After each reply, so you can answer</small></span><Switch on={listenAgain}/></button>
      </div>
      <button type="button" className="host-primary assistant-done" onClick={onClose}>Done</button>
    </DialogContent>
  </Dialog>;
}
