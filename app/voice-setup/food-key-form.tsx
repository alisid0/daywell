"use client";

import { useEffect, useRef, useState } from "react";

type Status = { available: boolean; foodKeySaved: boolean };

export default function FoodKeyForm() {
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const abort = new AbortController();
    fetch("/__daywell/local-voice-setup", { cache: "no-store", signal: abort.signal })
      .then(async response => {
        if (!response.ok) throw new Error();
        const data = await response.json() as Status;
        if (data.available !== true) throw new Error();
        setStatus(data);
      })
      .catch(() => { if (!abort.signal.aborted) setStatus({ available: false, foodKeySaved: false }); });
    return () => abort.abort();
  }, []);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !status?.available) return;
    const openaiKey = input.current?.value.trim() ?? "";
    if (!openaiKey) return;
    setSaving(true);
    setFailed(false);
    setMessage("");
    if (input.current) input.current.value = "";
    try {
      const response = await fetch("/__daywell/local-voice-setup", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ openaiKey }),
      });
      const data = await response.json() as Status & { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not save. Paste your key again and retry.");
      setStatus(data);
      setMessage("Saved on this computer. Restart Daywell, then try a food photo. Saving does not verify the connection or update the hosted app.");
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : "Could not save. Please retry.");
    } finally { setSaving(false); }
  }

  return <section id="food-ai" className="well-card voice-key-card" aria-labelledby="food-ai-heading">
    <h2 id="food-ai-heading">Connect food photos and voice</h2>
    <p>Add your OpenAI API key to turn food pictures and spoken descriptions into estimates you can review.</p>
    {status?.available === false ? <p role="status">Open this page in the Daywell preview on the owner’s computer to connect food AI.</p> :
      <form onSubmit={save} autoComplete="off">
        <label htmlFor="food-ai-key">OpenAI API key
          <input ref={input} id="food-ai-key" name="food-ai-key" type="password" autoComplete="new-password" spellCheck={false} autoCapitalize="none" minLength={16} maxLength={512} pattern="[a-zA-Z0-9_\-]{16,512}" required disabled={!status?.available || saving} aria-describedby="food-key-privacy" placeholder={status?.foodKeySaved ? "A key is saved. Paste here to replace it." : "Paste your OpenAI API key"} />
        </label>
        <small id="food-key-privacy">Hidden as you type. Saved on this computer, outside chat and GitHub. OpenAI API usage is billed separately from ChatGPT.</small>
        <button className="well-button" type="submit" disabled={!status?.available || saving}>{saving ? "Saving…" : "Save food AI key"}</button>
        {status?.foodKeySaved && !message && <p className="voice-key-status">A food AI key is saved locally. The connection still needs a live test.</p>}
        <p className="voice-key-status" role={failed ? "alert" : "status"} aria-live="polite">{message}</p>
      </form>}
  </section>;
}
