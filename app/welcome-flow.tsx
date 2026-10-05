"use client";

import { useRef, useState, type ComponentType } from "react";
import { AlarmClock, ArrowLeft, ArrowRight, Check, ChevronRight, Clock3, Footprints, ListChecks, LoaderCircle, Moon, ShoppingBasket, Sparkles, Sun, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { starterModules, stepsFor } from "@/lib/onboarding";
import type { Settings } from "@/lib/daywell";
import type { AppState } from "./use-daywell";
import { CompanionPortrait, CompanionWelcome } from "@/components/daywell-companions";
import { companionForModule } from "@/lib/companions";

const choices: { id: Settings["modules"][number]; name: string; text: string; icon: ComponentType<{ size?: number }> }[] = [
  { id: "focus", name: "Priorities & focus", text: "Plan tasks and focus on one at a time.", icon: ListChecks },
  { id: "clock", name: "Timers & clocks", text: "Time a break, a task or anything else.", icon: Clock3 },
  { id: "grocery", name: "Groceries", text: "Keep a list and tick off what you buy.", icon: ShoppingBasket },
  { id: "sleep", name: "Sleep", text: "Log your rest and plan your evening.", icon: Moon },
  { id: "move", name: "Movement", text: "Record a walk, stretch or workout.", icon: Footprints },
  { id: "food", name: "Food & nutrition", text: "Log meals and their nutrition details.", icon: Utensils },
  { id: "alarm", name: "Alarms", text: "Set reminders while Daywell is open.", icon: AlarmClock },
];

export function WelcomeFlow({ a }: { a: AppState }) {
  const [step, setStep] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const chosen = choices.filter(c => a.prefs.modules.includes(c.id));
  const steps = stepsFor(a.prefs.modules);
  function go(next: number) {
    setStep(next);
    requestAnimationFrame(() => { root.current?.scrollIntoView({ block: "start" }); heading.current?.focus({ preventScroll: true }); });
  }
  function toggle(id: Settings["modules"][number]) {
    a.setPrefs(p => ({ ...p, modules: p.modules.includes(id) ? p.modules.filter(x => x !== id) : [...p.modules, id] }));
  }
  return <div className="first-visit" ref={root}>
    <header className="welcome-header"><div className="welcome-brand"><span><Sun size={24} /></span>daywell<span className="welcome-dot">.</span></div>{a.settings.onboarded ? <button onClick={() => a.setWelcome(false)}><ArrowLeft size={15} />Back to my day</button> : <span className="welcome-header-note">A little space for you.</span>}</header>
    <main className="welcome-shell">
      <nav className="welcome-progress" aria-label="Getting started progress"><ol>{["Welcome", "Your tools", "Ready to begin"].map((label, i) => <li key={label} aria-current={i === step ? "step" : undefined} className={i <= step ? "reached" : ""}><span>{i < step ? <Check size={13} /> : i + 1}</span>{label}</li>)}</ol><small>Step {step + 1} of 3</small></nav>
      {step === 0 && <section className="welcome-intro">
        <div className="welcome-copy"><span className="welcome-eyebrow">WELCOME TO DAYWELL</span><h1 ref={heading} tabIndex={-1}>Your day.<br /><em>A little lighter.</em></h1><p>Tell Daywell what you need. One host keeps things simple and brings a little company for the task.</p>
          <div className="welcome-how"><div><span>01</span><p><strong>Talk to Daywell.</strong> Say what you need, or type it. You don’t need to remember any helper names.</p></div><div><span>02</span><p><strong>Check the plan.</strong> See what Daywell understood. Confirm to save or start; undo is always close by.</p></div><div><span>03</span><p><strong>Settle into one thing.</strong> A companion joins your activity. Choose quiet company or gentle encouragement.</p></div></div>
          <Button className="welcome-primary" onClick={() => go(1)}>Let&apos;s make your day<ArrowRight size={17} /></Button><small className="welcome-reassurance">No need to fill everything in. One tool is enough.</small>
        </div>
        <div className="welcome-illustration has-companions"><CompanionWelcome /></div>
      </section>}
      {step === 1 && <section className="welcome-choose"><div className="welcome-step-heading"><span className="welcome-eyebrow">MAKE YOURSELF AT HOME</span><h1 ref={heading} tabIndex={-1}>What would help today?</h1><p>Choose at least one. You can change your tools any time.</p></div><label className="welcome-name"><span>What should we call you? <small>Optional</small></span><input maxLength={40} placeholder="Your first name" value={a.prefs.name === "You" ? "" : a.prefs.name} onChange={e => a.setPrefs(p => ({ ...p, name: e.target.value || "You" }))} /></label>
        <div className="welcome-presets"><button onClick={() => a.setPrefs(p => ({ ...p, modules: [...starterModules] }))}>Start simple <span>3 essentials</span></button><button onClick={() => a.setPrefs(p => ({ ...p, modules: choices.map(c => c.id) }))}>Try all seven</button></div>
        <div className="welcome-tool-grid">{choices.map(c => <label key={c.id} className={`welcome-tool ${a.prefs.modules.includes(c.id) ? "chosen" : ""}`}><CompanionPortrait id={companionForModule[c.id]} size={48} decorative /><span><strong>{c.name}</strong><small>{c.text}</small></span><Checkbox aria-label={c.name} checked={a.prefs.modules.includes(c.id)} onCheckedChange={() => toggle(c.id)} /></label>)}</div>
        {!chosen.length && <p className="welcome-selection-hint" role="status">Choose one tool to continue. You can always add more later.</p>}<div className="welcome-step-footer"><button className="welcome-back" onClick={() => go(0)}><ArrowLeft size={16} />Back</button><span>{chosen.length} of 7 selected</span><Button className="welcome-primary" disabled={!chosen.length} onClick={() => go(2)}>Continue<ArrowRight size={17} /></Button></div>
      </section>}
      {step === 2 && <section className="welcome-ready"><div className="welcome-step-heading"><span className="ready-mark"><Check size={25} /></span><span className="welcome-eyebrow">A GOOD PLACE TO BEGIN</span><h1 ref={heading} tabIndex={-1}>Start with one small thing.</h1><p>Your tools are ready{a.prefs.name.trim() && a.prefs.name !== "You" ? `, ${a.prefs.name.trim()}` : ""}. Start by telling Daywell what you need.</p></div><div className="welcome-instructions">{steps.map((s, i) => <div key={s.module}><span>{i + 1}</span><div><h2>{s.title}</h2><p>{s.instruction}</p></div></div>)}</div><div className="welcome-good-to-know"><Sparkles size={18} /><div><strong>A couple of good things to know</strong><p>Talk or type to Daywell, check the plan, then press Do this. Voice input depends on your browser; typing always works. Helpers appear when they’re useful. Calendar & history keeps future plans and your recorded progress together. Your other tools and saved entries are below the host.</p></div></div>{a.formError && <p className="form-error" role="alert">{a.formError}</p>}<div className="welcome-step-footer"><button className="welcome-back" disabled={a.submitting} onClick={() => go(1)}><ArrowLeft size={16} />Your tools</button><Button className="welcome-primary" disabled={a.submitting} onClick={() => void a.saveSettings()}>{a.submitting ? <><LoaderCircle className="spin" size={17} />Preparing your space…</> : <>Open my day<ChevronRight size={18} /></>}</Button></div></section>}
    </main><footer className="welcome-footer"><Sun size={14} />Small steps. Better days.</footer>
  </div>;
}
