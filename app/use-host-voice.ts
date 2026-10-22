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
// Talking with the assistant (owner-approved design, 22 October 2026): the phone's own voice reads replies, one
// sentence at a time so the words on screen can follow along. The person chooses the voice and the speed.
export type VoiceChoice = { voiceURI: string | null; rate: "slower" | "normal" | "faster" };
export const voiceRates: Record<VoiceChoice["rate"], number> = { slower: .86, normal: .97, faster: 1.1 };
export type PhoneVoice = { uri: string; name: string; lang: string };
// A reply's sentences, as read aloud and as shown while it's read. "7.5 hours" stays whole.
export const sentences = (text: string) => text.trim().split(/(?<=[.!?]["”’)]?)\s+/).filter(Boolean);
const languageNames = new Intl.DisplayNames(["en-GB"], { type: "language" });
const languageName = (lang: string) => { try { return languageNames.of(lang.replace("_", "-")) ?? lang; } catch { return lang; } };

export function useHostVoice(onTranscript: (value: string) => void) {
  const [available, setAvailable] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  // True when the browser or device refused the microphone, so the button can show it.
  const [blocked, setBlocked] = useState(false);
  const recognition = useRef<Recognition | null>(null);
  const latest = useRef(onTranscript);
  useEffect(() => { latest.current = onTranscript; }, [onTranscript]);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceUri = useRef<string | null>(null);
  const choice = useRef<VoiceChoice>({ voiceURI: null, rate: "normal" });
  const [voices, setVoices] = useState<PhoneVoice[]>([]);
  const epoch = useRef(0);
  const clearError = useCallback(() => setError(""), []);

  const silence = useCallback(() => { epoch.current++; if ("speechSynthesis" in window) window.speechSynthesis.cancel(); setSpeaking(false); }, []);
  const stopListening = useCallback(() => { recognition.current?.abort(); recognition.current = null; if (timeout.current) clearTimeout(timeout.current); setListening(false); }, []);
  const stop = useCallback(() => { stopListening(); silence(); }, [stopListening, silence]);
  // The chosen voice, else a British English one. Calm lines (winding down) are slower still.
  function phoneVoice(uri = choice.current.voiceURI) {
    const all = window.speechSynthesis.getVoices();
    return all.find(v => v.voiceURI === uri) || all.find(v => v.voiceURI === voiceUri.current) || all.find(v => v.lang === "en-GB") || all.find(v => v.lang.startsWith("en"));
  }
  // Reads a reply aloud a sentence at a time. onSentence says which sentence is being read (-1 when it has finished),
  // and onDone runs only when the whole reply was read, never after Stop.
  function speak(text: string, calm = false, onSentence?: (index: number) => void, onDone?: () => void) {
    if (!("speechSynthesis" in window) || recognition.current) return;
    window.dispatchEvent(new Event("daywell-stop-library-audio"));
    window.dispatchEvent(new Event("daywell-stop-guided-audio"));
    silence(); const token = epoch.current;
    const voice = phoneVoice(), parts = onSentence ? sentences(text) : [text];
    parts.forEach((part, index) => {
      const line = new SpeechSynthesisUtterance(part);
      if (voice) { line.voice = voice; voiceUri.current = voice.voiceURI; }
      line.lang = voice?.lang || "en-GB"; line.rate = calm ? .86 : voiceRates[choice.current.rate];
      line.onstart = () => { if (epoch.current === token) { setSpeaking(true); onSentence?.(index); } };
      line.onend = () => { if (epoch.current === token && index === parts.length - 1) { setSpeaking(false); onSentence?.(-1); onDone?.(); } };
      line.onerror = event => { if (epoch.current === token) { setSpeaking(false); onSentence?.(-1); if (event.error !== "interrupted" && event.error !== "canceled") setError("Spoken replies aren’t available right now. Your reply is written below."); } };
      window.speechSynthesis.speak(line);
    });
  }
  // A short line in one voice, for choosing between them.
  function preview(uri: string) {
    if (!("speechSynthesis" in window)) return;
    silence(); const line = new SpeechSynthesisUtterance("Hello. I’m here whenever you need a hand with your day.");
    const voice = phoneVoice(uri); if (voice) { line.voice = voice; line.lang = voice.lang; }
    line.rate = voiceRates[choice.current.rate];
    window.speechSynthesis.speak(line);
  }
  const choose = useCallback((next: VoiceChoice) => { choice.current = next; }, []);
  // Send now: stop listening and send what was heard so far.
  const finish = useCallback(() => { recognition.current?.stop(); }, []);
  function start() {
    if (recognition.current) return;
    window.dispatchEvent(new Event("daywell-stop-library-audio"));
    window.dispatchEvent(new Event("daywell-stop-guided-audio"));
    const browser = window as SpeechWindow; const Constructor = browser.SpeechRecognition || browser.webkitSpeechRecognition;
    if (!Constructor) { setError("This browser doesn’t support voice input. Type your request below."); return; }
    silence(); setError(""); setTranscript("");
    const rec = new Constructor(); recognition.current = rec;
    rec.lang = "en-GB"; rec.continuous = false; rec.interimResults = true;
    let delivered = false;
    rec.onresult = event => {
      if (recognition.current !== rec || delivered) return;
      const result = Array.from(event.results).map(item => item[0].transcript).join(" ");
      setBlocked(false); setTranscript(result);
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
      if (["not-allowed", "service-not-allowed", "audio-capture"].includes(event.error)) setBlocked(true);
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
    // The phone's voices load late in some browsers, so the list updates when they arrive. English ones only.
    const listVoices = () => { if (active) setVoices(window.speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().startsWith("en"))
      .sort((x, y) => Number(y.lang === "en-GB") - Number(x.lang === "en-GB") || x.name.localeCompare(y.name)).slice(0, 12)
      .map(v => ({ uri: v.voiceURI, name: v.name.replace(/\s*\(.*\)$/, "").replace(/^(Microsoft|Google)\s+/, "").replace(/\s+-\s+.*$/, "") || v.name, lang: languageName(v.lang) }))); };
    if ("speechSynthesis" in window) { listVoices(); window.speechSynthesis.addEventListener("voiceschanged", listVoices); }
    const onHide = () => { if (document.hidden) stop(); };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("daywell-stop-voice", stop);
    return () => {
      window.removeEventListener("daywell-stop-voice", stop);
      if ("speechSynthesis" in window) window.speechSynthesis.removeEventListener("voiceschanged", listVoices);
      active = false; document.removeEventListener("visibilitychange", onHide); silence();
      if (recognition.current) { recognition.current.onend = null; recognition.current.onresult = null; recognition.current.onerror = null; recognition.current.abort(); recognition.current = null; }
      if (timeout.current) clearTimeout(timeout.current);
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, [stop, silence]);
  return { available, canSpeak, listening, speaking, transcript, error, blocked, voices, start, stop, finish, silence, speak, preview, choose, clearError };
}
