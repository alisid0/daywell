"use client";
import { useCallback, useEffect, useState } from "react";
import { Footprints, Link2, RefreshCw } from "lucide-react";
import { displayTime } from "@/lib/daywell";
import { syncedLabel, type WearableSummary } from "@/lib/wearables";

// Connected wearables on screen (lib/wearables.ts). Each screen reads the summary once, and again after Update now or
// Disconnect. Until the server knows about wearables, the summary is missing and these show nothing.
export function useWearables() {
  const [summary, setSummary] = useState<WearableSummary | null>(null);
  const load = useCallback(async () => {
    try { const res = await fetch("/api/wearables", { cache: "no-store" }); setSummary(res.ok ? await res.json() as WearableSummary : null); }
    catch { setSummary(null); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  return { summary, reload: load, whoop: summary?.connections.find(c => c.source === "whoop") ?? null };
}

const steps = new Intl.NumberFormat("en-GB");

// Move: today's steps, as a plain count with no target. Without a connection, one quiet line that opens Settings.
export function StepsToday({ onConnect }: { onConnect: () => void }) {
  const { whoop } = useWearables();
  if (!whoop) return null;
  if (!whoop.connected) return <button className="well-text-button steps-connect" onClick={onConnect}><Footprints size={17} aria-hidden />Count your steps with WHOOP</button>;
  const today = whoop.steps;
  return <section className="well-card steps-today" aria-labelledby="steps-today-title">
    <span className="area-icon area-tone-green" aria-hidden><Footprints size={22} /></span>
    <div>
      <h2 id="steps-today-title">Steps today</h2>
      <strong>{today ? steps.format(today.count) : "—"}</strong>
      <small>{today ? `From WHOOP${today.dayStartedAt ? ` · your WHOOP day began at ${displayTime(today.dayStartedAt)}` : ""}` : "WHOOP hasn't sent today's steps yet."}</small>
    </div>
  </section>;
}

// Settings: connect, update and disconnect. Connecting asks first, in plain words, what Daywell will and won't read
// (health data needs explicit consent), then hands over to WHOOP's own sign-in.
export function ConnectedApps() {
  const { whoop, reload } = useWearables();
  const [asking, setAsking] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  if (!whoop) return null;
  async function post(path: string) {
    setBusy(true); setError("");
    try { const res = await fetch(path, { method: "POST" }); if (!res.ok) throw new Error(String(res.status)); await reload(); }
    catch { setError("That didn't work just now. Please try again in a moment."); }
    finally { setBusy(false); }
  }
  const updated = syncedLabel(whoop.lastSyncedAt);
  return <section className="connected-apps" aria-labelledby="connected-apps-title">
    <h3 id="connected-apps-title">Connected apps</h3>
    <div className="connected-app">
      <div className="connected-app-text">
        <strong>WHOOP</strong>
        <small>{whoop.connected ? `Connected${updated ? ` · updated ${updated}` : ""}` : "Steps, workouts and sleep times from your WHOOP, so you don't have to log them."}</small>
      </div>
      {!whoop.connected && !asking && <button type="button" className="connected-app-button" onClick={() => setAsking(true)}><Link2 size={16} aria-hidden />Connect WHOOP</button>}
    </div>
    {asking && !whoop.connected && <div className="connected-app-consent" role="group" aria-label="Before you connect WHOOP">
      <p><strong>Daywell will read from your WHOOP:</strong></p>
      <ul>
        <li>your daily steps</li>
        <li>workouts: the activity, when it started and how long it took</li>
        <li>sleep: when you fell asleep and when you woke up</li>
      </ul>
      <p>WHOOP's next screen may list more, such as strain and heart rate, because they come with steps and workouts. Daywell doesn't keep or show those. What it keeps stays with your Daywell account, and disconnecting deletes it.</p>
      <div className="connected-app-actions">
        <a className="connected-app-button primary" href="/api/wearables/whoop/connect">Continue to WHOOP</a>
        <button type="button" className="connected-app-button" onClick={() => setAsking(false)}>Not now</button>
      </div>
    </div>}
    {whoop.connected && <>
      <div className="connected-app-actions">
        <button type="button" className="connected-app-button" disabled={busy} onClick={() => void post("/api/wearables/whoop/sync")}><RefreshCw size={16} aria-hidden />Update now</button>
        <button type="button" className="connected-app-button" disabled={busy} onClick={() => void post("/api/wearables/whoop/disconnect")}>Disconnect</button>
      </div>
      <small>Disconnecting stops updates and deletes the steps, workouts and nights Daywell copied from WHOOP.</small>
    </>}
    {error && <p role="alert" className="connected-app-error">{error}</p>}
  </section>;
}
