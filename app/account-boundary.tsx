"use client";
import { useEffect } from "react";
import { accountClosedOnDevice, clearAccountDeviceData, closedAccountPrefix } from "@/lib/food-recovery";

export function closeAccountInBrowser(scope: string) {
  try { clearAccountDeviceData(localStorage, scope); } catch { /* Server barrier remains authoritative. */ }
  for (const event of ["daywell-stop-voice", "daywell-stop-library-audio", "daywell-stop-guided-audio", "daywell-stop-narration", "daywell-stop-sleep-sounds"])
    window.dispatchEvent(new Event(event));
  if (!["/account-deleted", "/privacy", "/support", "/delete-account"].includes(location.pathname)) location.replace("/account-deleted");
}

export function AccountBoundary() {
  useEffect(() => {
    let scope: string | null = null, busy = false, stopped = false;
    const controller = new AbortController();
    const check = async () => {
      if (busy || stopped || document.hidden) return;
      busy = true;
      try {
        const response = await fetch("/api/account?view=status", { cache: "no-store", signal: controller.signal });
        if (!response.ok) return;
        const data = await response.json() as { recoveryScope?: string; status?: string };
        if (!data.recoveryScope || !/^[a-f0-9]{64}$/.test(data.recoveryScope)) return;
        scope = data.recoveryScope;
        if (data.status === "closed") closeAccountInBrowser(scope);
        else {
          // A scope is never automatically reopened by a successful old request.
          try { if (accountClosedOnDevice(localStorage, scope)) closeAccountInBrowser(scope); } catch { /* Storage unavailable. */ }
        }
      } catch { /* Offline: no deletion result is inferred. Retry on reconnect. */ }
      finally { busy = false; }
    };
    const changed = (event: StorageEvent) => {
      if (scope && event.key === closedAccountPrefix + scope && event.newValue === "closed") closeAccountInBrowser(scope);
    };
    void check();
    const timer = window.setInterval(() => void check(), 30_000);
    window.addEventListener("storage", changed);
    window.addEventListener("online", check);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => { stopped = true; controller.abort(); clearInterval(timer); window.removeEventListener("storage", changed); window.removeEventListener("online", check); window.removeEventListener("focus", check); document.removeEventListener("visibilitychange", check); };
  }, []);
  return null;
}
