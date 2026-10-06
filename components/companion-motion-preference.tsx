"use client";

import { useSyncExternalStore } from "react";

const key = "daywell-companion-motion";
const event = "daywell-companion-motion-change";
let visitPreference: boolean | undefined;
function enabled() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  try { return visitPreference ?? localStorage.getItem(key) !== "off"; }
  catch { return visitPreference ?? true; }
}
function subscribe(notify: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", notify);
  window.addEventListener(event, notify);
  window.addEventListener("storage", notify);
  return () => {
    media.removeEventListener("change", notify);
    window.removeEventListener(event, notify);
    window.removeEventListener("storage", notify);
  };
}
export function useCompanionMotion() {
  return useSyncExternalStore(subscribe, enabled, () => false);
}
export function CompanionMotionControl() {
  const active = useCompanionMotion();
  const reduced = useSyncExternalStore(subscribe, () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => false);
  return <label className="companion-motion-control"><input type="checkbox" checked={active} disabled={reduced} onChange={e => {
    try { localStorage.setItem(key, e.target.checked ? "on" : "off"); visitPreference = undefined; }
    catch { visitPreference = e.target.checked; }
    window.dispatchEvent(new Event(event));
  }} />Gentle companion movement<span>Your device’s reduced-motion setting is respected.</span></label>;
}
