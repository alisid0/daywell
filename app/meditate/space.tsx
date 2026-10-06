"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pause, Play, Square, Volume2 } from 'lucide-react';
import { CompanionPortrait } from '@/components/daywell-companions';
import { CompanionMotionControl } from '@/components/companion-motion-preference';
import { guidedSessions, guidedRecordingFor, guidedMoment, type GuidedManifest } from '@/lib/guided-sessions';
import { useDaywellStyle } from '../design-switcher';

const clock = (seconds: number) => `${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;
export default function MeditationSpace({initialSessionId}: {initialSessionId?: string}) {
  useDaywellStyle();
  const [sessionId,setSessionId] = useState(guidedSessions.find(s=>s.id===initialSessionId)?.id ?? guidedSessions[0].id);
  const [manifest,setManifest] = useState<GuidedManifest | null>(null);
  const [loaded,setLoaded] = useState(false), [playing,setPlaying] = useState(false), [loading,setLoading] = useState(false);
  const [elapsed,setElapsed] = useState(0), [volume,setVolume] = useState(.8), [error,setError] = useState('');
  const player = useRef<HTMLAudioElement | null>(null), attempt = useRef(0);
  const session = guidedSessions.find(s=>s.id===sessionId)!;
  const recording = guidedRecordingFor(session,manifest), moment = guidedMoment(session,elapsed);
  const finished = elapsed >= session.seconds - .1;
  const quiet = Boolean(recording && elapsed >= recording.segments[moment.index].end && !finished);
  const pause = useCallback(() => { attempt.current++; player.current?.pause(); setPlaying(false); setLoading(false); },[]);
  const stop = useCallback(() => { pause(); if(player.current) player.current.currentTime=0; setElapsed(0); setError(''); },[pause]);
  useEffect(()=>{
    const request = new AbortController();
    fetch('/guided-audio/manifest.json',{signal:request.signal,cache:'no-cache'})
      .then(async r=>{if(!r.ok)throw Error();return r.json() as Promise<GuidedManifest>;})
      .then(value=>{if(!request.signal.aborted && value.version===1 && value.recordings)setManifest(value);})
      .catch(()=>{/* Written guidance remains available. */})
      .finally(()=>{if(!request.signal.aborted)setLoaded(true);});
    const hidden=()=>{if(document.hidden)pause();};
    document.addEventListener('visibilitychange',hidden);
    window.addEventListener('pagehide',pause);
    window.addEventListener('daywell-stop-guided-audio',pause);
    return ()=>{request.abort();pause();document.removeEventListener('visibilitychange',hidden);window.removeEventListener('pagehide',pause);window.removeEventListener('daywell-stop-guided-audio',pause);};
  },[pause]);
  useEffect(()=>{
    // Capture this element: React clears the ref before passive unmount cleanup.
    const element=player.current;
    return ()=>{element?.pause();};
  },[sessionId,recording?.src]);
  async function start() {
    const audio=player.current;
    if(!recording||!audio)return;
    window.dispatchEvent(new Event('daywell-stop-library-audio'));
    window.dispatchEvent(new Event('daywell-stop-voice'));
    if('speechSynthesis' in window)window.speechSynthesis.cancel();
    if(finished){audio.currentTime=0;setElapsed(0);}
    const token=++attempt.current;
    audio.volume=volume; setError('');setLoading(true);
    try { await audio.play(); if(token===attempt.current){setPlaying(true);setLoading(false);} }
    catch {if(token===attempt.current){setLoading(false);setError('The recording could not start. Try again, or read the words below.');}}
  }
  return <main className="meditation-space">
    <header className="meditation-top"><Link href="/audio-library" onClick={stop}><ArrowLeft size={17}/>Back to Just listen</Link><span>A little time with Luma</span></header>
    <div className="meditation-intro"><p>Let the next thing wait.</p><h1>Some room to exhale.</h1><span>A gentle voice. Quiet spaces. Nothing to get right.</span></div>
    <nav className="meditation-choices" aria-label="Choose a guided moment">{guidedSessions.map(item=><button key={item.id} aria-pressed={session.id===item.id} onClick={()=>{stop();setSessionId(item.id);}}><strong>{item.title}</strong><span>{item.seconds/60} minutes</span></button>)}</nav>
    <section className="meditation-listening" aria-labelledby="meditation-title">
      <div className="meditation-cove"><CompanionPortrait id="luma" size={240} motion="idle" decorative eager/></div>
      <div className="meditation-copy"><h2 id="meditation-title">{session.title}</h2><p className="meditation-description">{session.description}</p>
        <p className="meditation-caption" aria-live="polite">{finished ? 'You can stay here quietly. There is nothing else to finish.' : moment.segment.text}</p>
        <p className="meditation-quiet" aria-live="polite">{playing ? quiet ? 'A little quiet. Take your time.' : 'Luma is guiding you.' : finished ? 'Your quiet space is still here.' : elapsed>0 ? 'Paused. Come back at your own pace.' : 'Settle somewhere comfortable before you begin.'}</p>
        <div className="meditation-controls"><button className="audio-play" disabled={!recording} onClick={()=>playing||loading ? pause() : void start()}>{playing||loading ? <Pause size={18}/> : <Play size={18}/>} {loading ? 'Cancel' : playing ? 'Pause' : finished ? 'Listen again' : elapsed>0 ? 'Continue' : loaded && !recording ? 'Audio unavailable' : 'Begin'}</button><button className="meditation-stop" disabled={!playing&&!loading&&elapsed===0} onClick={stop}><Square size={16}/>End for now</button></div>
        <div className="meditation-progress"><input aria-label="Session position" type="range" min="0" max={session.seconds} step="1" value={Math.min(elapsed,session.seconds)} disabled={!recording} onChange={event=>{const value=Number(event.target.value);if(player.current){player.current.currentTime=value;setElapsed(value);}}}/><span>{clock(elapsed)} / {clock(session.seconds)}</span></div>
        <label className="meditation-volume"><Volume2 size={16}/><span>Voice volume</span><input aria-label="Voice volume" type="range" min="0" max="1" step=".05" value={volume} onChange={event=>{const value=Number(event.target.value);setVolume(value);if(player.current)player.current.volume=value;}}/></label>
        <CompanionMotionControl /><p className="meditation-note">Recorded guidance · your microphone stays off. Audio pauses when you leave this tab.</p>
        {error&&<p className="audio-error" role="alert">{error}</p>}
      </div>
    </section>
    <audio key={session.id} ref={player} src={recording?.src} preload="none" aria-label={`${session.title} recording`} onTimeUpdate={event=>setElapsed(Math.min(event.currentTarget.currentTime,session.seconds))} onEnded={()=>{setPlaying(false);setLoading(false);setElapsed(session.seconds);}} onError={()=>{pause();setError('The audio could not load. Your written guidance is still available below.');}}/>
    <p className="meditation-comfort">Breathe at a comfortable pace, without forcing or holding your breath. You can stop at any time, or choose the room-based meditation if breath focus does not suit you.</p>
    <details className="meditation-transcript"><summary>Read the full guidance</summary>{session.segments.map(segment=><p key={segment.at}><span>{clock(segment.at)}</span>{segment.text}</p>)}</details>
  </main>;
}
