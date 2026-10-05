"use client";

import { useEffect, useRef, useState } from "react";

type SetupStatus = { available: boolean; keySaved: boolean; agentSaved: boolean };
export default function VoiceKeyForm() {
  const keyInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [agentId, setAgentId] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    const abort = new AbortController();
    fetch("/__daywell/local-voice-setup", { cache: "no-store", signal: abort.signal })
      .then(async response => {
        if (!response.ok) throw new Error();
        const data = await response.json() as SetupStatus;
        if (data.available !== true) throw new Error();
        setStatus(data);
      })
      .catch(() => { if (!abort.signal.aborted) setStatus({ available: false, keySaved: false, agentSaved: false }); });
    return () => abort.abort();
  }, []);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !status?.available) return;
    const apiKey = keyInput.current?.value.trim() ?? "";
    if (!apiKey && !agentId.trim()) { setError(true); setMessage("Paste your key to save it."); return; }
    setSaving(true);
    setError(false);
    setMessage("");
    // Clear the password field immediately; the key is never put in React
    // state, browser storage, a URL, analytics or a response.
    if (keyInput.current) keyInput.current.value = "";
    try {
      const response = await fetch("/__daywell/local-voice-setup", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, agentId }),
      });
      const data = await response.json() as SetupStatus & { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not save. Paste your key again and retry.");
      setStatus(data);
      setAgentId("");
      setMessage(data.agentSaved
        ? "Saved on this computer. Restart Daywell to load your settings, then try Talk to Daywell. The connection has not been verified yet."
        : "Key saved on this computer. You can add your agent ID here later to finish connecting voice.");
    } catch (cause) {
      setError(true);
      setMessage(cause instanceof Error ? cause.message : "Could not save. Paste your key again and retry.");
    } finally { setSaving(false); }
  }

  return <section className="well-card voice-key-card" aria-labelledby="key-heading">
    <h2 id="key-heading">Paste your key here</h2>
    <p>This connects your ElevenLabs account to Daywell on this computer.</p>
    {status?.available === false ? <p role="status">Key entry is available in the local Daywell preview. Start it on this computer and open this page again.</p> :
      <form onSubmit={save} autoComplete="off">
        <label htmlFor="elevenlabs-key">ElevenLabs API key
          <input ref={keyInput} id="elevenlabs-key" name="elevenlabs-key" type="password" autoComplete="new-password" spellCheck={false} autoCapitalize="none" maxLength={256} minLength={16} pattern="[a-zA-Z0-9_\-]{16,256}" placeholder={status?.keySaved ? "A key is saved. Paste here to replace it." : "Paste your ElevenLabs API key"} required={!status?.keySaved} disabled={!status?.available || saving} aria-describedby="key-privacy" />
        </label>
        <small id="key-privacy">Hidden as you type. Saved locally, outside chat and GitHub.</small>
        <details className="voice-agent-details"><summary>Add an agent ID (optional for now)</summary>
          <label htmlFor="elevenlabs-agent">ElevenLabs agent ID<input id="elevenlabs-agent" value={agentId} onChange={event => setAgentId(event.target.value)} autoComplete="off" spellCheck={false} autoCapitalize="none" maxLength={100} pattern="[a-zA-Z0-9_\-]{5,100}" placeholder={status?.agentSaved ? "An agent is saved. Enter an ID to replace it." : "agent_…"} disabled={saving} /></label>
          <small>You can save the key first. Voice also needs an agent before it can start.</small>
        </details>
        <button className="well-button" type="submit" disabled={!status?.available || saving}>{saving ? "Saving…" : status === null ? "Opening key entry…" : "Save key"}</button>
        {status?.keySaved && !message && <p className="voice-key-status">A key is already saved on this computer.</p>}
        <p className="voice-key-status" role={error ? "alert" : "status"} aria-live="polite">{message}</p>
      </form>}
  </section>;
}
