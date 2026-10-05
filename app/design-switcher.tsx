"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { appearanceKey, legacyStyleKey, readAppearanceProfile, originalLook, appearanceTokens, letteringTokens, palettes, maxFavourites, type Appearance, type AppearanceProfile, type DaywellStyle, type FavouriteLook } from "@/lib/appearance";
export { daywellStyles } from "@/lib/appearance";

const preferenceEvent = "daywell-style-change";
let temporarySnapshot = "";
function snapshot() {
  if (temporarySnapshot) return temporarySnapshot;
  try { return localStorage.getItem(appearanceKey) || JSON.stringify(readAppearanceProfile(null, localStorage.getItem(legacyStyleKey))); }
  catch { return ""; }
}
function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === appearanceKey || event.key === legacyStyleKey || event.key === null) { temporarySnapshot = ""; onChange(); }
  };
  window.addEventListener(preferenceEvent, onChange);
  window.addEventListener("storage", onStorage);
  return () => { window.removeEventListener(preferenceEvent, onChange); window.removeEventListener("storage", onStorage); };
}
function persist(profile: AppearanceProfile) {
  temporarySnapshot = JSON.stringify(profile);
  let saved = true;
  try { localStorage.setItem(appearanceKey, temporarySnapshot); } catch { saved = false; }
  window.dispatchEvent(new Event(preferenceEvent));
  return saved;
}
function latest() { return readAppearanceProfile(snapshot()); }

export function useDaywellStyle() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "");
  const profile = useMemo(() => readAppearanceProfile(raw), [raw]);
  const current = profile.current;
  useEffect(() => {
    const root = document.documentElement, base = originalLook(current.style);
    root.dataset.daywellStyle = current.style;
    root.dataset.appearanceCompany = current.company;
    if (current.composition !== "original") root.dataset.appearanceComposition = current.composition;
    const variables: Record<string, string> = {};
    if (current.palette !== base.palette) {
      root.dataset.appearancePalette = current.palette;
      Object.assign(variables, appearanceTokens(current));
      root.style.colorScheme = palettes[current.palette].scheme;
    }
    if (current.lettering !== base.lettering) {
      root.dataset.appearanceLettering = current.lettering;
      Object.assign(variables, letteringTokens(current.lettering));
    }
    if (current.buttons !== base.buttons) root.dataset.appearanceButtons = current.buttons;
    if (current.backdrop !== base.backdrop || current.palette !== base.palette) root.dataset.appearanceBackdrop = current.backdrop;
    for (const [key, value] of Object.entries(variables)) root.style.setProperty(key, value);
    return () => {
      for (const key of ["daywellStyle", "appearancePalette", "appearanceLettering", "appearanceButtons", "appearanceBackdrop", "appearanceCompany", "appearanceComposition"]) delete root.dataset[key];
      for (const key of Object.keys(variables)) root.style.removeProperty(key);
      root.style.removeProperty("color-scheme");
    };
  }, [current]);
  function apply(look: Appearance) { return persist({ ...latest(), current: look }); }
  function choose(style: DaywellStyle) { return apply(originalLook(style)); }
  function saveFavourite(name: string) {
    const previous = latest();
    if (previous.favourites.length >= maxFavourites) return { saved: false, full: true };
    const favourite = { id: crypto.randomUUID(), name: name.trim().slice(0, 40), look: previous.current };
    return { saved: persist({ ...previous, favourites: [...previous.favourites, favourite] }), full: false };
  }
  function removeFavourite(id: string) {
    const previous = latest();
    return persist({ ...previous, favourites: previous.favourites.filter(f => f.id !== id) });
  }
  function restoreFavourite(favourite: FavouriteLook) {
    const previous = latest();
    if (previous.favourites.length >= maxFavourites || previous.favourites.some(f => f.id === favourite.id)) return false;
    return persist({ ...previous, favourites: [...previous.favourites, favourite] });
  }
  return { style: current.style, hasChoice: Boolean(raw), current, favourites: profile.favourites, apply, choose, saveFavourite, removeFavourite, restoreFavourite };
}
export type AppearanceController = ReturnType<typeof useDaywellStyle>;
