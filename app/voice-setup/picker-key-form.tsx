"use client";

import { useEffect, useRef, useState } from "react";

export default function PickerKeyForm() {
  const input = useRef<HTMLInputElement>(null);
  const [available, setAvailable] = useState(false), [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/__daywell/local-voice-setup", { cache: "no-store", signal: controller.signal })
      .then(async response => { if (!response.ok) return; const data = await response.json() as { available?: boolean; pickerKeySaved?: boolean }; setAvailable(data.available === true); setSaved(data.pickerKeySaved === true); })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    const typesafeKey = input.current?.value.trim();
    if (!typesafeKey || !available || busy) return;
    setBusy(true); setMessage(""); if (input.current) input.current.value = "";
    try {
      const response = await fetch("/__daywell/local-voice-setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ typesafeKey }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw Error(data.error || "Could not save. Try again.");
      setSaved(true); setMessage("Saved privately on this computer. The picker still needs its accuracy test before activation. This does not update the hosted app.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save. Try again."); }
    finally { setBusy(false); }
  }
  return <section id="reply-picker" className="well-card voice-key-card">
    <h2>Connect the recorded-reply picker</h2>
    <p>Jev from TypeSafe chooses a suitable existing recording. It does not write replies or change your records.</p>
    <form onSubmit={save} autoComplete="off">
      <label htmlFor="picker-key">TypeSafe API key<input ref={input} id="picker-key" type="password" autoComplete="new-password" spellCheck={false} minLength={16} maxLength={512} pattern="[a-zA-Z0-9_.\-]{16,512}" required disabled={!available || busy} placeholder={saved ? "A key is saved. Paste to replace it." : "Paste your TypeSafe API key"}/></label>
      <small>Saved outside chat and GitHub. TypeSafe requests use your paid API allowance.</small>
      <button className="well-button" disabled={!available || busy}>{busy ? "Saving…" : "Save picker key"}</button>
      <p role="status">{message || (saved ? "A picker key is saved locally." : "")}</p>
    </form>
  </section>;
}
