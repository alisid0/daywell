"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Volume2, VolumeX } from "lucide-react";
import { CompanionPortrait } from "@/components/daywell-companions";
import type { AppState } from "./use-daywell";

const moments = [
  "Let your shoulders find a comfortable place. There’s nothing to catch up with here.",
  "Notice where your body meets the chair, bed or floor. Let it support you.",
  "Look around gently. Find one colour or shape you like. Stay with it for a moment.",
  "Let your breathing find its own easy rhythm. You don’t need to change it.",
  "You can stay a little longer, or return to your day. This space is here whenever you need it.",
];
export function RestSpace({ a, bedtime = false, onLeave }: { a: AppState; bedtime?: boolean; onLeave?: () => void }) {
  const [sound, setSound] = useState(false), [soundError, setSoundError] = useState("");
  const [guided, setGuided] = useState(false), [step, setStep] = useState(0), [volume, setVolume] = useState(.15);
  const audio = useRef<{ context: AudioContext; gain: GainNode } | null>(null);
  const soundRequest = useRef(0);
  const silence = useCallback(() => { soundRequest.current++; void audio.current?.context.close(); audio.current = null; setSound(false); }, []);
  useEffect(() => {
    window.scrollTo({top:0,behavior:"instant"});
    window.dispatchEvent(new Event("daywell-stop-voice"));
    const stop = () => { if (document.hidden) silence(); };
    document.addEventListener("visibilitychange", stop);
    return () => { silence(); document.removeEventListener("visibilitychange", stop); };
  }, [silence]);
  async function toggleSound() {
    if (audio.current) { silence(); return; }
    const request = ++soundRequest.current;
    setSoundError("");
    try {
      const context = new AudioContext();
      const gain = context.createGain(); audio.current = { context, gain };
      await context.resume();
      if (request !== soundRequest.current) { await context.close(); return; }
      const buffer = context.createBuffer(1, context.sampleRate * 4, context.sampleRate), samples = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < samples.length; i++) { last = (last + (Math.random() * 2 - 1) * .02) / 1.02; samples[i] = last * 3.5; }
      const source = context.createBufferSource(), filter = context.createBiquadFilter();
      source.buffer = buffer; source.loop = true; filter.type = "lowpass"; filter.frequency.value = 700;
      gain.gain.value = volume; source.connect(filter); filter.connect(gain); gain.connect(context.destination); source.start(); setSound(true);
    } catch { silence(); setSoundError("Sound couldn’t start. You can still stay here quietly."); }
  }
  return <section className={`rest-space ${bedtime ? "rest-bedtime" : ""}`} aria-labelledby="rest-heading">
    <button className="well-text-button rest-leave" onClick={() => { silence(); if (onLeave) onLeave(); else a.setActive("today"); }}><ArrowLeft size={17} />{bedtime ? "Back to sleep" : "Back to my day"}</button>
    <div className="rest-intro"><span>{bedtime ? "A softer end to the day" : "Your quiet corner"}</span><h1 id="rest-heading">{bedtime ? "You can leave the day here." : "Nothing to do. Just be."}</h1><p>{bedtime ? "Settle somewhere comfortable. Let the next thing wait." : "A little distance from the feed. No timer. No catching up."}</p></div>
    <div className="rest-nest"><CompanionPortrait id="luma" size={270} decorative eager /></div>
    <p className="rest-words" aria-live="polite">{guided ? moments[step] : "Luma is here with you. Stay as long as you like."}</p>
    <div className="well-actions rest-controls"><button className="well-button" aria-pressed={guided} onClick={() => { setGuided(!guided); setStep(0); }}>{guided ? "Return to quiet" : "A little guidance"}</button><button className="well-button well-secondary" aria-pressed={sound} onClick={() => void toggleSound()}>{sound ? <VolumeX size={17} /> : <Volume2 size={17} />}{sound ? "Turn sound off" : "Soft rustling sound"}</button></div>
    {guided && <button className="well-text-button" onClick={() => { if (step === moments.length - 1) { setGuided(false); setStep(0); } else setStep(step + 1); }}>{step === moments.length - 1 ? "Stay quietly" : "Next, when I’m ready"}</button>}
    {sound && <label className="rest-volume">Volume<input aria-label="Rest sound volume" type="range" min="0" max="0.5" step=".01" value={volume} onChange={event => { const value = Number(event.target.value); setVolume(value); if (audio.current) audio.current.gain.gain.setTargetAtTime(value, audio.current.context.currentTime, .1); }} /></label>}
    {soundError && <p role="alert">{soundError}</p>}
    <details className="rest-reflection"><summary>Something you’d like to remember?</summary><p>Only if you want to. Your pause doesn’t need a record.</p><button className="well-text-button" onClick={() => a.openEditor("reflection")}>Write a private reflection</button></details>
  </section>;
}
