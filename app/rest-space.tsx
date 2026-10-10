"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, Play, Square } from "lucide-react";
import Link from "@/components/daywell-link";
import { CompanionPortrait } from "@/components/daywell-companions";
import { CompanionMotionControl } from "@/components/companion-motion-preference";
import { responseInGroup } from "@/lib/audio-library";
import { useLibraryAudio } from "./use-library-audio";
import type { AppState } from "./use-daywell";
import { CalendarStrip } from "./calendar-strip";
import { unwindSessions } from "@/lib/unwind-sessions";
import { SleepSounds } from "./sleep-sounds";

const moments = [
  responseInGroup("relax-unclench")!,
  responseInGroup("relax-ground", 1)!,
  responseInGroup("relax-ground")!,
  responseInGroup("relax-breath", 1)!,
  responseInGroup("relax-return")!,
];
export function RestSpace({ a, bedtime = false, onLeave }: { a: AppState; bedtime?: boolean; onLeave?: () => void }) {
  const recording = useLibraryAudio();
  const [guided, setGuided] = useState(false), [step, setStep] = useState(0);
  useEffect(() => {
    window.scrollTo({top:0,behavior:"instant"});
    window.dispatchEvent(new Event("daywell-stop-voice"));
  }, []);
  return <section className={`rest-space ${bedtime ? "rest-bedtime" : ""}`} aria-labelledby="rest-heading">
    {(bedtime || onLeave || a.restReturn) && <button className="well-text-button rest-leave" onClick={() => { if (onLeave) onLeave(); else a.setActive("today"); }}><ArrowLeft size={17} />{bedtime ? "Back to sleep" : "Back to my day"}</button>}
    <div className="rest-intro"><span>{bedtime ? "A softer end to the day" : "Your quiet corner"}</span><h1 id="rest-heading">{bedtime ? "You can leave the day here." : "Nothing to do. Just be."}</h1><p>{bedtime ? "Settle somewhere comfortable. Let the next thing wait." : "A little distance from the feed. No timer. No catching up."}</p></div>
    <div className="rest-nest"><CompanionPortrait id="luma" size={270} motion={bedtime ? "sleepy" : "idle"} decorative eager /></div>
    <CompanionMotionControl /><p className="rest-words" aria-live="polite">{guided ? moments[step].text : "Luma is here with you. Stay as long as you like."}</p>
    <div className="well-actions rest-controls"><button className="well-button" aria-pressed={guided} onClick={() => { recording.stop(); setGuided(!guided); setStep(0); }}>{guided ? "Return to quiet" : "A little guidance"}</button></div>
    {guided && <div className="well-actions"><button className="well-button well-secondary" disabled={!recording.ready(moments[step])} onClick={() => recording.status !== "idle" ? recording.stop() : void recording.play(moments[step])}>{recording.status !== "idle" ? <Square size={16} /> : <Play size={16} />}{recording.status !== "idle" ? "Stop listening" : "Listen to these words"}</button><button className="well-text-button" onClick={() => { recording.stop(); if (step === moments.length - 1) { setGuided(false); setStep(0); } else setStep(step + 1); }}>{step === moments.length - 1 ? "Stay quietly" : "Next, when I’m ready"}</button></div>}
    {recording.error && <p role="alert">{recording.error}</p>}
    <SleepSounds />
    {!bedtime && <section className="rest-unwind" aria-label="Choose an unwind exercise"><h2>A softer landing</h2><div>{unwindSessions.map(session=><Link key={session.id} href={`/meditate?session=${session.id}`} onClick={()=>recording.stop()}><span>{session.title}</span><small>{session.seconds/60} min · 5 voices</small></Link>)}</div></section>}
    <Link className="rest-library-link" href={`/meditate?session=${bedtime ? "softer-goodnight" : "easy-breath"}`} onClick={() => recording.stop()}>{bedtime ? "A five-minute bedtime meditation" : "More guided breathing & meditation"}</Link>
    <Link className="rest-library-link" href="/audio-library" onClick={() => recording.stop()}>More little words of comfort</Link>
    {!bedtime && <CalendarStrip a={a} area="relax" />}
    <details className="rest-reflection"><summary>Something you’d like to remember?</summary><p>Only if you want to. Your pause doesn’t need a record.</p><button className="well-text-button" onClick={() => a.openEditor("reflection")}>Write a private reflection</button></details>
  </section>;
}
