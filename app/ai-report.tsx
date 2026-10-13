"use client";
import { useId, useRef, useState, type FormEvent } from "react";
import { aiReportReasons, type AiReportSource } from "@/lib/ai-report";

const failed = "Your report couldn’t be sent. Please try again.";

// "Report this reply" under text written by the AI (Google Play's AI-generated content policy; owner approval,
// 12 October 2026). Sends only that text, the chosen reason and an optional note. Recorded replies and Daywell's own
// messages never show it. Give it a key per reply so a new reply starts closed.
export function AiReport({ source, text, noun = "reply" }: { source: AiReportSource; text: string; noun?: "reply" | "estimate" | "plan" }) {
  const [open, setOpen] = useState(false), [reason, setReason] = useState(""), [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle"), [error, setError] = useState("");
  const id = useId(), toggle = useRef<HTMLButtonElement>(null), first = useRef<HTMLInputElement>(null);
  function show(next: boolean) {
    setOpen(next); setError("");
    requestAnimationFrame(() => (next ? first.current : toggle.current)?.focus());
  }
  async function send(event: FormEvent) {
    event.preventDefault();
    if (!reason) { setError("Choose what’s wrong first."); return; }
    setStatus("sending"); setError("");
    try {
      const response = await fetch("/api/ai-report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source, reason, reply: text.slice(0, 4000), note }) });
      if (!response.ok) throw new Error(((await response.json().catch(() => null)) as { error?: string } | null)?.error || failed);
      setStatus("sent"); setOpen(false);
    } catch (problem) { setStatus("idle"); setError(problem instanceof Error ? problem.message : failed); }
  }
  if (status === "sent") return <p className="ai-report-thanks" role="status">Thank you. We’ll look at this {noun}.</p>;
  return <div className="ai-report">
    {!open && <button ref={toggle} type="button" className="ai-report-toggle" onClick={() => show(true)}>Report this {noun}</button>}
    {open && <form className="ai-report-form" onSubmit={send} aria-labelledby={`${id}-title`}>
      <h3 id={`${id}-title`}>Report this {noun}</h3>
      <p>This sends the {noun} and anything you add below to the Daywell team. Nothing else {source === "conversation" ? "from your conversation " : ""}is sent.</p>
      <fieldset><legend>What’s wrong with it?</legend>
        {aiReportReasons.map(([value, label], index) => <label key={value} className="ai-report-choice"><input ref={index === 0 ? first : undefined} type="radio" name={`${id}-reason`} value={value} checked={reason === value} onChange={() => { setReason(value); setError(""); }}/>{label}</label>)}
      </fieldset>
      <label className="ai-report-note">Anything else we should know? (optional)<textarea maxLength={300} rows={2} value={note} onChange={event => setNote(event.target.value)}/></label>
      {error && <p className="ai-report-error" role="alert">{error}</p>}
      <div className="ai-report-actions"><button type="submit" className="ai-report-send" disabled={status === "sending"}>{status === "sending" ? "Sending…" : "Send report"}</button><button type="button" className="ai-report-cancel" onClick={() => show(false)}>Cancel</button></div>
    </form>}
  </div>;
}
