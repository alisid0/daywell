"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { sentences, voiceRates, type VoiceChoice } from "./use-host-voice";

// "Hear this" on a food review (owner-approved, 23 October 2026): the phone's own voice reads it, like the
// assistant's replies, with the voice and speed chosen in Daywell's voice settings. Daywell sends the text nowhere.
function savedChoice(): VoiceChoice {
  try {
    const saved = JSON.parse(localStorage.getItem("daywell-host-preferences") || "null");
    if (saved?.voice) return saved.voice;
  } catch { /* The phone's default voice is fine. */ }
  return { voiceURI: null, rate: "normal" };
}

export function useReadAloud() {
  const [status, setStatus] = useState<"idle" | "playing">("idle");
  const [error, setError] = useState("");
  const epoch = useRef(0);
  // Android's in-app browser has no speech voices, so the button only shows where reading aloud works.
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const stop = useCallback(() => {
    epoch.current++;
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setStatus("idle");
  }, []);
  const clear = useCallback(() => { stop(); setError(""); }, [stop]);
  useEffect(() => {
    const hidden = () => { if (document.hidden) stop(); };
    const events = ["daywell-stop-narration", "daywell-stop-voice", "daywell-stop-library-audio", "daywell-stop-guided-audio", "pagehide"];
    events.forEach(event => window.addEventListener(event, stop));
    document.addEventListener("visibilitychange", hidden);
    return () => { events.forEach(event => window.removeEventListener(event, stop)); document.removeEventListener("visibilitychange", hidden); stop(); };
  }, [stop]);
  function speak(text: string) {
    if (status === "playing") { stop(); return; }
    if (!("speechSynthesis" in window)) { setError("This phone or browser can't read aloud. The review is all on screen."); return; }
    window.dispatchEvent(new Event("daywell-stop-voice")); window.dispatchEvent(new Event("daywell-stop-library-audio")); window.dispatchEvent(new Event("daywell-stop-guided-audio"));
    const token = ++epoch.current;
    setError("");
    const choice = savedChoice();
    const voice = choice.voiceURI ? window.speechSynthesis.getVoices().find(v => v.voiceURI === choice.voiceURI) : undefined;
    const parts = sentences(text);
    parts.forEach((part, index) => {
      const line = new SpeechSynthesisUtterance(part);
      if (voice) line.voice = voice;
      line.lang = voice?.lang || "en-GB";
      line.rate = voiceRates[choice.rate] ?? voiceRates.normal;
      if (index === parts.length - 1) line.onend = () => { if (epoch.current === token) setStatus("idle"); };
      line.onerror = () => { if (epoch.current === token) { setStatus("idle"); setError("Reading aloud stopped. Tap Hear this to try again."); } };
      window.speechSynthesis.speak(line);
    });
    setStatus("playing");
  }
  return { supported, status, error, speak, stop, clear };
}
