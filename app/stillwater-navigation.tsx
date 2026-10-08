"use client";

import { useState, type ComponentType } from "react";
import Link from "next/link";
import { CircleHelp, Footprints, Heart, History, Home, LifeBuoy, Moon, Palette, Settings2, ShieldCheck, SlidersHorizontal, Sun, Utensils } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import type { AppState } from "./use-daywell";
import { ReadingComfortSettings } from "./reading-comfort";

type Tool = { id: string; name: string; desc: string; icon: ComponentType<{ size?: number }> };
// The four areas sit in the bar beside Today. Everything else belongs to the tab it lives under.
const tabs = [
  { id: "today", label: "Today", icon: Home },
  { id: "move", label: "Move", icon: Footprints },
  { id: "eat", label: "Eat", icon: Utensils },
  { id: "sleep", label: "Sleep", icon: Moon },
  { id: "relax", label: "Relax", icon: Heart },
];
const tabFor: Record<string, string> = { move: "move", eat: "eat", food: "eat", grocery: "eat", sleep: "sleep", relax: "relax" };
export function StillwaterNavigation({ a, tools, onStyle }: { a: AppState; tools: Tool[]; onStyle: () => void }) {
  const [drawer, setDrawer] = useState<"tools" | "settings">("tools");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const currentTab = a.active === "calendar" ? (a.calendarArea === "all" ? "today" : a.calendarArea) : tabFor[a.active] ?? "today";
  function openDrawer(view: "tools" | "settings") { setDrawer(view); setDrawerOpen(true); }
  function go(view: string, history = false) {
    a.setActive(view); if (view === "calendar") a.setCalendarView(history ? "history" : "plan");
    setDrawerOpen(false);
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "instant" }));
  }
  function customize() { setDrawerOpen(false); a.setPrefs(a.settings); a.setFormError(""); a.setCustomize(true); }
  return <>
    <header className="stillwater-header"><button className="stillwater-wordmark" aria-label="Daywell home" onClick={() => go("today")}><Sun size={24} />daywell.</button><div><span className="stillwater-save" role="status">{a.syncError ? "Changes not saved" : a.saving ? "Saving…" : ""}</span><button className="stillwater-header-button" id="stillwater-style-toggle" aria-label="Choose your style" onClick={onStyle}><Palette size={18} /><span>Your style</span></button><button className="stillwater-header-button" aria-label="Your space settings" disabled={!a.loaded} onClick={() => openDrawer("settings")}><Settings2 size={20} /></button></div></header>
    <nav className="stillwater-dock" data-tabs={tabs.length} aria-label="Daywell navigation">{tabs.map(tab => <button key={tab.id} aria-current={currentTab === tab.id ? "page" : undefined} disabled={tab.id !== "today" && !a.loaded} onClick={() => go(tab.id)}><tab.icon size={21} /><span>{tab.label}</span></button>)}</nav>
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}><SheetContent side="bottom" className="stillwater-drawer"><SheetHeader><SheetTitle>{drawer === "tools" ? "A little help with your day." : "Make yourself comfortable."}</SheetTitle><SheetDescription>{drawer === "tools" ? "Pick what you need, or just ask Daywell." : "Your space, at your pace."}</SheetDescription></SheetHeader><div className="stillwater-drawer-body">{drawer === "tools" ? <><div className="stillwater-tool-list">{tools.map(tool => <button key={tool.id} onClick={() => go(tool.id)}><tool.icon size={22} /><span><strong>{tool.name}</strong><small>{tool.desc}</small></span></button>)}</div><button className="stillwater-drawer-link" onClick={() => go("calendar", true)}><History size={19} />Look back at your progress</button><button className="stillwater-drawer-link" onClick={customize}><SlidersHorizontal size={19} />Choose your tools</button></> : <><button className="stillwater-drawer-link" onClick={() => { setDrawerOpen(false); onStyle(); }}><Palette size={19} />Change the atmosphere</button><button className="stillwater-drawer-link" onClick={customize}><SlidersHorizontal size={19} />Name, tools & daily preferences</button><button className="stillwater-drawer-link" onClick={() => { setDrawerOpen(false); a.setPrefs(a.settings); a.setFormError(""); a.setWelcome(true); }}><CircleHelp size={19} />Getting started</button><Link className="stillwater-drawer-link" href="/account"><ShieldCheck size={19} />Your data and privacy</Link><Link className="stillwater-drawer-link" href="/support"><LifeBuoy size={19} />Help and support</Link><ReadingComfortSettings /><p>Voice and companion preferences are under “Voice & company” beside your host.</p></>}</div></SheetContent></Sheet>
  </>;
}
