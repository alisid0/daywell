"use client";

import { CompanionAssistant, CompanionFamily } from "@/components/daywell-companions";
import { companionForModule, companions, type CompanionId } from "@/lib/companions";
import type { AppState } from "./use-daywell";
import type { Kind } from "@/lib/daywell";

const entryKinds: Partial<Record<CompanionId, Kind>> = { pip: "task", momo: "grocery", luma: "sleep", nori: "food", bounce: "move", sunny: "alarm" };

export function WorkspaceCompanions({ a }: { a: AppState }) {
  const ids = a.settings.modules.map(module => companionForModule[module]).filter(Boolean);
  const id = companionForModule[a.active];
  function openTool(chosen: CompanionId) {
    a.setActive(companions[chosen].module);
    const kind = entryKinds[chosen];
    if (kind) a.openEditor(kind);
  }
  if (!id) return <CompanionFamily compact ids={ids} onChoose={openTool} />;
  const records = id === "momo" ? a.by("grocery") : id === "sunny" ? a.by("alarm") : id === "pip" ? a.dayEntries("task") : id === "tock" ? a.dayEntries("session") : a.dayEntries(entryKinds[id] || "session");
  const completed = id === "momo" || id === "pip" ? records.filter(entry => entry.data.done).length : records.length;
  const message = id === "momo" && records.length > 0 && records.every(entry => entry.data.done) ? "Everything’s in the bag. One less thing on your mind." : id === "pip" && completed > 0 ? `${completed} ${completed === 1 ? "small thing" : "small things"} done. Take a moment to enjoy that.` : id === "tock" && a.timer.endAt ? "I’m keeping time. You can settle into your next small thing." : completed > 0 && id === "luma" ? "Your rest is recorded. There’s room for a gentle start." : completed > 0 && id === "bounce" ? "That little bit of movement counts. Nicely done." : completed > 0 && id === "nori" ? "Your meal is saved. One less detail to remember." : undefined;
  return <div className="workspace-companion"><CompanionAssistant key={id} id={id} message={message} celebration={completed} action={id === "tock" ? a.timer.endAt ? "Pause the timer" : "Start the timer" : undefined} onAction={id === "tock" ? () => void (a.timer.endAt ? a.pauseTimer() : a.runTimer()) : () => openTool(id)} /></div>;
}
