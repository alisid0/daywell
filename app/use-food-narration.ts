"use client";
import { useCallback, useEffect, useRef, useState } from 'react';

export function useFoodNarration() {
  const [status,setStatus] = useState<'idle'|'loading'|'playing'|'ready'>('idle');
  const [error,setError] = useState('');
  const player = useRef<HTMLAudioElement | null>(null), cache = useRef<{text:string;url:string} | null>(null);
  const request = useRef<AbortController | null>(null), epoch = useRef(0);
  const stop = useCallback(() => { epoch.current++; request.current?.abort(); request.current=null; if(player.current){player.current.pause();player.current.currentTime=0;} setStatus('idle'); },[]);
  const clear = useCallback(() => { stop(); if(cache.current) URL.revokeObjectURL(cache.current.url); cache.current=null; player.current=null; setError(''); },[stop]);
  useEffect(() => {
    const hidden = () => { if(document.hidden) stop(); };
    const events = ['daywell-stop-narration','daywell-stop-voice','daywell-stop-library-audio','daywell-stop-guided-audio','pagehide'];
    events.forEach(event=>window.addEventListener(event,stop)); document.addEventListener('visibilitychange',hidden);
    return () => { events.forEach(event=>window.removeEventListener(event,stop)); document.removeEventListener('visibilitychange',hidden); clear(); };
  },[stop,clear]);
  async function speak(text: string) {
    if (status==='loading'||status==='playing') {stop();return;}
    window.dispatchEvent(new Event('daywell-stop-voice')); window.dispatchEvent(new Event('daywell-stop-library-audio')); window.dispatchEvent(new Event('daywell-stop-guided-audio'));
    if(cache.current?.text!==text) clear();
    const token=++epoch.current; setError('');
    try {
      if(cache.current?.text!==text) {
        setStatus('loading'); request.current=new AbortController();
        const response=await fetch('/api/food-narration',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text}),signal:request.current.signal});
        if(!response.ok){const data=await response.json() as {error?:string};throw Error(data.error||'Could not read this review.');}
        const blob=await response.blob(); if(epoch.current!==token)return;
        cache.current={text,url:URL.createObjectURL(blob)};
      } else if (epoch.current!==token) return;
      const playToken=epoch.current;
      const audio=new Audio(cache.current!.url);
      audio.onended=()=>{if(epoch.current===playToken)setStatus('ready');};
      audio.onerror=()=>{if(epoch.current===playToken){setStatus('ready');setError('Audio could not play. Tap to try again.');}};
      player.current=audio;
      try {await audio.play();if(epoch.current===playToken)setStatus('playing');}
      catch {if(epoch.current===playToken){setStatus('ready');setError('Your audio is ready. Tap Hear this again to play.');}}
    } catch(problem) {if(epoch.current===token&&!(problem instanceof Error&&problem.name==='AbortError')){setStatus('idle');setError(problem instanceof Error?problem.message:'The readout is unavailable.');}}
  }
  return {status,error,speak,stop,clear};
}
