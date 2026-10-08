"use client";
import { useSyncExternalStore } from 'react';
import { defaultGuidedVoice, guidedVoices } from '@/lib/guided-sessions';
const key = 'daywell-unwind-voice', event = 'daywell-unwind-voice-change';
let temporary: string | undefined;
function snapshot() {
  let value = temporary;
  try { value ??= localStorage.getItem(key) ?? undefined; } catch { /* Use the visit default. */ }
  return guidedVoices.some(voice => voice.id === value) ? value! : defaultGuidedVoice;
}
function subscribe(callback: () => void) {
  window.addEventListener(event, callback); window.addEventListener('storage', callback);
  return () => { window.removeEventListener(event, callback); window.removeEventListener('storage', callback); };
}
export function useGuidedVoice() {
  const voice = useSyncExternalStore(subscribe, snapshot, () => defaultGuidedVoice);
  return [voice, (value: string) => {
    if (!guidedVoices.some(voice => voice.id === value)) return;
    try { localStorage.setItem(key, value); temporary = undefined; } catch { temporary = value; }
    window.dispatchEvent(new Event(event));
  }] as const;
}
