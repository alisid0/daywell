"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Recognition = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((event: { results: { isFinal: boolean; 0: { transcript: string } }[] }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void; stop: () => void; abort: () => void;
};
type SpeechWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };

export function useHostVoice(onTranscript: (value: string) => void) {
  const [available, setAvailable] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const recognition = useRef<Recognition | null>(null);
  const latest = useRef(onTranscript);
  useEffect(() => { latest.current = onTranscript; }, [onTranscript]);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceUri = useRef<string | null>(null);
  const epoch = useRef(0);

  const silence = useCallback(() => { epoch.current++; if ("speechSynthesis" in window) window.speechSynthesis.cancel(); setSpeaking(false); }, []);
  const stopListening = useCallback(() => { recognition.current?.abort(); recognition.current = null; if (timeout.current) clearTimeout(timeout.current); setListening(false); }, []);
  const stop = useCallback(() => { stopListening(); silence(); }, [stopListening, silence]);
  function speak(text: string, calm = false) {
    if (!("speechSynthesis" in window) || recognition.current) return;
    silence(); const token = epoch.current;
    const line = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.voiceURI === voiceUri.current) || voices.find(v => v.lang === "en-GB") || voices.find(v => v.lang.startsWith("en"));
    if (voice) { line.voice = voice; voiceUri.current = voice.voiceURI; }
    line.lang = "en-GB"; line.rate = calm ? .86 : .97;
    line.onstart = () => { if (epoch.current === token) setSpeaking(true); };
    line.onend = () => { if (epoch.current === token) setSpeaking(false); };
    line.onerror = event => { if (epoch.current === token) { setSpeaking(false); if (event.error !== "interrupted" && event.error !== "canceled") setError("Spoken replies aren’t available right now. Your reply is written below."); } };
    window.speechSynthesis.speak(line);
  }
  function start() {
    if (recognition.current) return;
    const browser = window as SpeechWindow; const Constructor = browser.SpeechRecognition || browser.webkitSpeechRecognition;
    if (!Constructor) { setError("This browser doesn’t support voice input. Type your request below."); return; }
    silence(); setError(""); setTranscript("");
    const rec = new Constructor(); recognition.current = rec;
    rec.lang = "en-GB"; rec.continuous = false; rec.interimResults = true;
    let delivered = false;
    rec.onresult = event => {
      if (recognition.current !== rec || delivered) return;
      const result = Array.from(event.results).map(item => item[0].transcript).join(" ");
      setTranscript(result);
      if (Array.from(event.results).every(item => item.isFinal)) {
        delivered = true; rec.abort(); recognition.current = null;
        if (timeout.current) clearTimeout(timeout.current);
        setListening(false); latest.current(result);
      }
    };
    rec.onerror = event => {
      if (recognition.current !== rec) return;
      const messages: Record<string, string> = {
        "not-allowed": "Microphone access wasn’t allowed. You can enable it in your browser or type below.",
        "service-not-allowed": "Voice input isn’t available in this browser. Type below instead.",
        "audio-capture": "No microphone was found. Type your request below.",
        "network": "The browser’s speech service couldn’t connect. Type your request below.",
        "no-speech": "I didn’t catch any speech. Tap Talk to try again, or type below.",
      };
      if (event.error !== "aborted") setError(messages[event.error] || "Voice input stopped. Please try again or type below.");
    };
    rec.onend = () => {
      if (recognition.current !== rec) return;
      recognition.current = null; setListening(false);
      if (timeout.current) clearTimeout(timeout.current);
    };
    try { rec.start(); setListening(true); timeout.current = setTimeout(() => rec.stop(), 30000); }
    catch { recognition.current = null; setListening(false); setError("The microphone couldn’t start. Type below or try again."); }
  }
  useEffect(() => {
    const browser = window as SpeechWindow;
    let active = true;
    queueMicrotask(() => { if (active) { setAvailable(Boolean(browser.SpeechRecognition || browser.webkitSpeechRecognition)); setCanSpeak("speechSynthesis" in window); } });
    const onHide = () => { if (document.hidden) stop(); };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      active = false; document.removeEventListener("visibilitychange", onHide); silence();
      if (recognition.current) { recognition.current.onend = null; recognition.current.onresult = null; recognition.current.onerror = null; recognition.current.abort(); recognition.current = null; }
      if (timeout.current) clearTimeout(timeout.current);
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, [stop, silence]);
  return { available, canSpeak, listening, speaking, transcript, error, start, stop, silence, speak };
}
