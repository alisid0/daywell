"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import { recordingFor, type AudioManifest, type AudioResponse } from '@/lib/audio-library';

export function useLibraryAudio() {
  const [manifest, setManifest] = useState<AudioManifest | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing'>('idle');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const player = useRef<HTMLAudioElement | null>(null), epoch = useRef(0);
  const stop = useCallback(() => {
    epoch.current++;
    if (player.current) { player.current.pause(); player.current.removeAttribute('src'); player.current.load(); player.current = null; }
    setStatus('idle'); setActiveId(null); setError('');
  }, []);
  useEffect(() => {
    const request = new AbortController();
    fetch('/audio-library/manifest.json', { signal: request.signal, cache: 'no-cache' })
      .then(async response => { if (!response.ok) throw Error(); return response.json() as Promise<AudioManifest>; })
      .then(value => { if (!request.signal.aborted && value.version === 1 && value.recordings && typeof value.recordings === 'object') setManifest(value); })
      .catch(() => { /* The transcript remains available if recordings cannot load. */ });
    const hidden = () => { if (document.hidden) stop(); };
    document.addEventListener('visibilitychange', hidden);
    window.addEventListener('daywell-stop-library-audio', stop);
    window.addEventListener('pagehide', stop);
    return () => { request.abort(); stop(); document.removeEventListener('visibilitychange', hidden); window.removeEventListener('daywell-stop-library-audio', stop); window.removeEventListener('pagehide', stop); };
  }, [stop]);
  const play = useCallback(async (entry: AudioResponse) => {
    const recording = recordingFor(entry, manifest);
    if (!recording) { setError('This recording is not ready yet. The written words are still here.'); return; }
    // Stop other local playback and ask every live-agent instance to end its session.
    window.dispatchEvent(new Event('daywell-stop-library-audio'));
    window.dispatchEvent(new Event('daywell-stop-voice'));
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    stop(); const token = epoch.current;
    const audio = new Audio(recording.src); player.current = audio;
    setError(''); setActiveId(entry.id); setStatus('loading');
    audio.onplaying = () => { if (token === epoch.current) setStatus('playing'); };
    audio.onended = () => { if (token === epoch.current) stop(); };
    audio.onerror = () => { if (token === epoch.current) { stop(); setError('The recording could not play. Check your connection and try again; the words are still here.'); } };
    try { await audio.play(); } catch { if (token === epoch.current) { stop(); setError('Playback did not start. Press Listen again, or read the words below.'); } }
  }, [manifest, stop]);
  return { manifest, status, activeId, error, play, stop, ready: (entry: AudioResponse) => Boolean(recordingFor(entry,manifest)) };
}
