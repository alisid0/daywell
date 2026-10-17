"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { Download, LifeBuoy, LogOut, ShieldCheck, Trash2 } from "lucide-react";
import { useDaywellStyle } from "../design-switcher";
import { closeAccountInBrowser } from "../account-boundary";
type AccountReply = { status?: string; recoveryScope: string; ok?: boolean; receipt?: unknown };

async function problemFrom(response: Response, fallback: string) {
  try { const data = await response.json() as { error?: unknown }; return typeof data.error === "string" ? data.error : fallback; }
  catch { return fallback; }
}
export default function YourData({ signOutHref, email }: { signOutHref: string; email: string }) {
  useDaywellStyle();
  const [busy, setBusy] = useState<"download" | "delete" | "status" | null>(null);
  const [confirming, setConfirming] = useState(false), [uncertain, setUncertain] = useState(false);
  const [downloaded, setDownloaded] = useState(""), [problem, setProblem] = useState("");
  const confirmTitle = useRef<HTMLHeadingElement>(null), requestId = useRef<string | null>(null);

  async function download(format: "html" | "json") {
    setBusy("download"); setDownloaded("");
    try {
      const response = await fetch("/api/account?format=" + format, { cache: "no-store" });
      if (!response.ok) throw new Error(await problemFrom(response, "Your download couldn’t be prepared. Please try again."));
      const name = /filename="([^"]+)"/.exec(response.headers.get("content-disposition") ?? "")?.[1] ?? "daywell-data." + format;
      const url = URL.createObjectURL(await response.blob());
      const link = Object.assign(document.createElement("a"), { href: url, download: name });
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setDownloaded("Your download has started: " + name);
    } catch (error) { setDownloaded(error instanceof Error ? error.message : "Please try your download again."); }
    finally { setBusy(null); }
  }
  function askToDelete() { setProblem(""); setConfirming(true); requestAnimationFrame(() => confirmTitle.current?.focus()); }
  async function checkStatus() {
    setBusy("status");
    try {
      const response = await fetch("/api/account?view=status", { cache: "no-store" });
      if (!response.ok) throw Error("Your account status is unavailable. Please check again when connected.");
      const data = await response.json() as AccountReply;
      if (data.status === "closed" && /^[a-f0-9]{64}$/.test(data.recoveryScope)) { closeAccountInBrowser(data.recoveryScope); return; }
      setProblem("No completed closure was found yet. You can check again or retry the same request.");
    } catch (error) { setProblem(error instanceof Error ? error.message : "Please check again when connected."); }
    finally { setBusy(null); }
  }
  async function remove() {
    setBusy("delete"); setProblem(""); requestId.current ??= crypto.randomUUID();
    window.dispatchEvent(new Event("daywell-stop-voice"));
    try {
      const response = await fetch("/api/account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete-account", requestId: requestId.current }) });
      if (!response.ok) throw new Error(await problemFrom(response, "The result is uncertain. Check account status."));
      const data = await response.json() as AccountReply;
      if (!data.ok || !data.receipt || !/^[a-f0-9]{64}$/.test(data.recoveryScope)) throw Error("The result is uncertain. Check account status.");
      closeAccountInBrowser(data.recoveryScope);
    } catch (error) {
      setUncertain(true); setProblem(error instanceof Error ? error.message : "The connection was lost. Check account status before trying again."); setBusy(null);
    }
  }
  return <main className="daywell-page"><div className="well-space daywell-page-inner">
    <Link className="well-text-button" href="/">← Back to Daywell</Link>
    <div className="well-heading"><span>Your account</span><h1>Your data</h1><p>See what Daywell remembers, download a copy or close your account.</p><p>Signed in as <strong className="account-email">{email}</strong></p></div>
    <section className="well-card" aria-labelledby="download-title">
      <h2 id="download-title">Download your saved data</h2>
      <p>Your plans, history, notes, food basket, settings and usage counts. The readable report also contains a structured copy.</p>
      <div className="well-actions">
        <button className="well-button" disabled={busy !== null} onClick={() => void download("html")}><Download size={18} aria-hidden="true" />Download readable report</button>
        <button className="well-button well-secondary" disabled={busy !== null} onClick={() => void download("json")}>Download JSON</button>
      </div><p role="status">{busy === "download" ? "Preparing your file…" : downloaded}</p>
      <p>This download covers Daywell’s saved database records. It does not include unsaved device drafts, provider-held conversations, support records or backups.</p>
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
      <h2 id="delete-title">Close your account and delete saved data</h2>
      <p>This removes your saved Daywell records and blocks this sign-in from saving again. It cannot be undone.</p>
      {!confirming ? <button className="well-button well-secondary" disabled={busy !== null} onClick={askToDelete}><Trash2 size={18} aria-hidden="true" />Review account closure</button> :
        <div className="your-data-confirm" role="group" aria-labelledby="confirm-title">
          <h3 id="confirm-title" ref={confirmTitle} tabIndex={-1}>Close the account for {email}?</h3>
          <p>Your plans, meals, movement, sleep, notes, food basket, food history, settings and personal usage counts will be removed from Daywell’s active database.</p>
          <p>This browser will remove this account’s food drafts. Shared reading, appearance and voice preferences stay on this device. Other devices are cleared when they reconnect; old saves will be rejected.</p>
          <p>A minimal account key and closure receipt remain to prevent old devices from restoring deleted records.</p>
          <p>Provider-held information and backup copies are separate. Their removal is not automated or confirmed here. This does not delete your sign-in provider account or cancel any subscription. See <Link href="/privacy">privacy details</Link>.</p>
          <p>You can download a copy first, but you do not have to.</p>
          <div className="well-actions">
            <button className="well-button your-data-danger" disabled={busy !== null} onClick={() => void remove()}>{busy === "delete" ? "Closing account…" : uncertain ? "Retry account closure" : "Close account and delete saved data"}</button>
            <button className="well-button well-secondary" disabled={busy !== null} onClick={() => setConfirming(false)}>Keep my account</button>
          </div>
        </div>}
      {problem && <p role="alert">{problem}</p>}
      {uncertain && <button className="well-button well-secondary" disabled={busy !== null} onClick={() => void checkStatus()}>{busy === "status" ? "Checking…" : "Check account status"}</button>}
    </section>
  </div></main>;
}
