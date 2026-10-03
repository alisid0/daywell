"use client";

import { Check, ChevronRight, Sparkles } from "lucide-react";
import { hasTriedStep, stepsFor } from "@/lib/onboarding";
import type { AppState } from "./use-daywell";

export function FirstSteps({ a }: { a: AppState }) {
  if (a.settings.guideDismissed) return null;
  const steps = stepsFor(a.settings.modules).slice(0, 3);
  const complete = steps.filter(s => hasTriedStep(a.entries, s.kind)).length;
  return <section className="first-steps" aria-label="Getting started checklist"><div className="first-steps-heading"><div><span><Sparkles size={15} />YOUR FIRST SMALL STEPS</span><h2>{complete === steps.length ? "You’re finding your rhythm." : "A little guidance to get you going."}</h2><p>{complete === steps.length ? "Your entries are saved. Come back to Today whenever you need." : "Pick one to try. You don’t have to do them all."}</p></div><button disabled={a.saving > 0} onClick={() => void a.dismissGuide()}>Got it, hide this</button></div><div className="first-steps-grid">{steps.map((s, i) => { const done = hasTriedStep(a.entries, s.kind); return <button key={s.module} className={done ? "tried" : ""} onClick={() => { if (done || s.kind === "timer") a.setActive(s.module); else a.openEditor(s.kind); }}><span className="first-step-number">{done ? <Check size={15} /> : i + 1}</span><div><strong>{s.title}</strong><p>{s.instruction}</p><span>{done ? "View your entries" : s.action}<ChevronRight size={14} /></span></div></button>; })}</div><small>{complete} of {steps.length} tried · Reopen the guide from Getting started.</small></section>;
}
