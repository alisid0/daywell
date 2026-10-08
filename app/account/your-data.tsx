"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { Download, LifeBuoy, LogOut, ShieldCheck, Trash2 } from "lucide-react";
import { useDaywellStyle } from "../design-switcher";

// Daywell's saved choices on this device (reading comfort, appearance, voice, drafts) all start with this.
const devicePrefix = "daywell";
function clearDevice() {
  try { for (const key of Object.keys(localStorage)) if (key.startsWith(devicePrefix)) localStorage.removeItem(key); }
  catch { /* Storage is blocked, so nothing was saved there. */ }
}
async function problemFrom(response: Response, fallback: string) {
  try { const data = await response.json() as { error?: unknown }; return typeof data.error === "string" ? data.error : fallback; }
  catch { return fallback; }
}
const downloadFailed = "Your download couldn’t be prepared. Please try again.";
const deleteFailed = "Your account couldn’t be deleted just now. Nothing was removed. Please try again.";

export default function YourData({ signOutHref }: { signOutHref: string }) {
  useDaywellStyle();
  const [busy, setBusy] = useState<"download" | "delete" | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [downloaded, setDownloaded] = useState("");
  const [problem, setProblem] = useState("");
  const confirmTitle = useRef<HTMLHeadingElement>(null);

  async function download() {
    setBusy("download"); setDownloaded("");
    try {
      const response = await fetch("/api/account", { cache: "no-store" });
      if (!response.ok) throw new Error(await problemFrom(response, downloadFailed));
      const name = /filename="([^"]+)"/.exec(response.headers.get("content-disposition") ?? "")?.[1] ?? "daywell-data.json";
      const url = URL.createObjectURL(await response.blob());
      const link = Object.assign(document.createElement("a"), { href: url, download: name });
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setDownloaded(`Your download has started: ${name}`);
    } catch (error) {
      setDownloaded(error instanceof Error && error.message ? error.message : downloadFailed);
    } finally { setBusy(null); }
  }
  function askToDelete() { setProblem(""); setConfirming(true); requestAnimationFrame(() => confirmTitle.current?.focus()); }
  async function remove() {
    setBusy("delete"); setProblem("");
    try {
      const response = await fetch("/api/account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete-account" }) });
      if (!response.ok) throw new Error(await problemFrom(response, deleteFailed));
      clearDevice();
      location.replace("/account-deleted");
    } catch (error) {
      setProblem(error instanceof Error && error.message ? error.message : deleteFailed);
      setBusy(null);
    }
  }

  return <main className="daywell-page"><div className="well-space daywell-page-inner">
    <Link className="well-text-button" href="/">← Back to Daywell</Link>
    <div className="well-heading"><span>Your account</span><h1>Your data</h1><p>Everything you save in Daywell belongs to you. You can take a copy or delete it all, whenever you like.</p></div>
    <section className="well-card" aria-labelledby="download-title">
      <h2 id="download-title">Download a copy</h2>
      <p>One file with your plans, history, notes, food basket and settings. You can open it in any text editor.</p>
      <button className="well-button" disabled={busy !== null} onClick={() => void download()}><Download size={18} aria-hidden="true" />{busy === "download" ? "Preparing your file…" : "Download my data"}</button>
      <p role="status">{downloaded}</p>
    </section>
    <section className="well-card" aria-labelledby="help-title">
      <h2 id="help-title">Privacy and help</h2>
      <ul className="daywell-page-links">
        <li><Link href="/privacy"><ShieldCheck size={19} aria-hidden="true" />How Daywell uses your data</Link></li>
        <li><Link href="/support"><LifeBuoy size={19} aria-hidden="true" />Help and support</Link></li>
        <li><a href={signOutHref}><LogOut size={19} aria-hidden="true" />Sign out</a></li>
      </ul>
    </section>
    <section className="well-card" aria-labelledby="delete-title">
      <h2 id="delete-title">Delete your account</h2>
      <p>This deletes everything Daywell has saved for you. It can’t be undone.</p>
      {!confirming ? <button className="well-button well-secondary" onClick={askToDelete}><Trash2 size={18} aria-hidden="true" />Delete my account…</button> :
        <div className="your-data-confirm" role="group" aria-labelledby="confirm-title">
          <h3 id="confirm-title" ref={confirmTitle} tabIndex={-1}>Delete everything?</h3>
          <p>These will be deleted for good:</p>
          <ul>
            <li>your plans, tasks and history, including meals, movement and sleep</li>
            <li>your notes and reflections</li>
            <li>your food basket, meal plans and shopping list</li>
            <li>your name and settings</li>
            <li>Daywell’s saved choices on this device</li>
          </ul>
          <p>Want to keep a copy? Download it first.</p>
          <p>Transcripts of live conversations are kept separately by our voice provider, ElevenLabs. To have those deleted too, ask us through Help and support.</p>
          <div className="well-actions">
            <button className="well-button your-data-danger" disabled={busy !== null} onClick={() => void remove()}>{busy === "delete" ? "Deleting…" : "Yes, delete everything"}</button>
            <button className="well-button well-secondary" disabled={busy === "delete"} onClick={() => setConfirming(false)}>Keep my account</button>
          </div>
        </div>}
      {problem && <p role="alert">{problem}</p>}
    </section>
  </div></main>;
}
