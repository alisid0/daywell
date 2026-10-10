"use client";
import { useEffect, useRef, useState, type FormEvent, type RefObject } from "react";
import { ArrowRight, Check, LoaderCircle, Lock, Sun, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import type { Settings } from "@/lib/daywell";
import { latestWeight } from "@/lib/profile";
import { checkDraft, detailsSummary, draftFrom, formatKcal, formatWeight, guidePreview, hasBodyText, withHeightUnit, withWeightUnit, type DetailsDraft, type DetailsProblems, type GuidePreview, type HeightUnit, type Units, type WeightUnit } from "@/lib/profile-form";
import type { AppState } from "./use-daywell";

// "About you": age (required, 18 and over) and optional sex, height and weight. The same fields appear at sign-up,
// once for accounts made before Daywell asked, and in Your details in settings.
const SEXES = [["female", "Female"], ["male", "Male"], ["unspecified", "Prefer not to say"]] as const;
const SETTINGS_PLACE = "Name, tools & daily preferences";
const UNITS_KEY = "daywell-units";
function savedUnits(): Partial<Units> {
  try { const units = JSON.parse(localStorage.getItem(UNITS_KEY) || "{}"); return { height: units.height === "ftin" ? "ftin" : "cm", weight: units.weight === "stlb" ? "stlb" : "kg" }; }
  catch { return {}; }
}
function rememberUnits(d: DetailsDraft) {
  try { localStorage.setItem(UNITS_KEY, JSON.stringify({ height: d.heightUnit, weight: d.weightUnit })); } catch { /* units are only a convenience */ }
}
const firstProblem = (id: string, p: DetailsProblems) => p.age ? `${id}-age` : p.badHeight ? `${id}-height` : p.badWeight ? `${id}-weight` : p.consent ? `${id}-consent` : p.ownNumber ? `${id}-own` : "";
const focusSoon = (id: string) => requestAnimationFrame(() => document.getElementById(id)?.focus());
const longDate = (value: string) => new Date(value.length === 10 ? `${value}T12:00:00` : value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function UnitInput({ id, label, unit, value, onChange, invalid, describedBy, numeric = false }: { id: string; label: string; unit: string; value: string; onChange: (value: string) => void; invalid?: boolean; describedBy?: string; numeric?: boolean }) {
  return <span className="about-unit-input"><input id={id} inputMode={numeric ? "numeric" : "decimal"} autoComplete="off" maxLength={6} aria-label={label} value={value} aria-invalid={invalid || undefined} aria-describedby={describedBy} onChange={e => onChange(e.target.value)}/><em aria-hidden="true">{unit}</em></span>;
}

function UnitToggle<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly (readonly [T, string])[]; onChange: (unit: T) => void }) {
  return <span className="about-units" role="group" aria-label={label}>{options.map(([unit, text]) => <button key={unit} type="button" aria-pressed={value === unit} onClick={() => onChange(unit)}>{text}</button>)}</span>;
}

function GuideNote({ guide, inSettings }: { guide: GuidePreview; inSettings: boolean }) {
  if (guide.kind === "off") return null;
  return <div className="about-guide" aria-live="polite">
    {guide.kind === "estimate" ? <><strong>About {formatKcal(guide.kcal)} kcal a day</strong><span>Your everyday guide from your age, height and weight, for a lightly active day{guide.averaged ? ", using the average of the female and male formulas" : ""}. It isn’t medical advice.</span></>
      : guide.kind === "own" ? <><strong>{formatKcal(guide.kcal)} kcal a day</strong><span>Your own number. Clear it to use your estimate instead.</span></>
      : guide.kind === "needs-age" ? <span>Add your age above to see your daily guide.</span>
      : <span>Add your height and weight for a personal daily guide, or {inSettings ? "use" : "set"} your own number{inSettings ? "" : " later"}. Until then, Daywell shows calories without a guide.</span>}
  </div>;
}

function DetailsFields({ id, draft, setDraft, settings, problems, inSettings = false }: { id: string; draft: DetailsDraft; setDraft: (update: (d: DetailsDraft) => DetailsDraft) => void; settings: Settings; problems: DetailsProblems; inSettings?: boolean }) {
  const set = (patch: Partial<DetailsDraft>) => setDraft(d => ({ ...d, ...patch }));
  const bodyError = problems.body ? `${id}-body-error` : undefined;
  return <div className="about-fields">
    <div className="about-field">
      <label htmlFor={`${id}-age`}>How old are you?</label>
      <span className="about-unit-input about-age"><input id={`${id}-age`} inputMode="numeric" autoComplete="off" maxLength={3} value={draft.age} aria-invalid={!!problems.age || undefined} aria-describedby={`${id}-age-hint${problems.age ? ` ${id}-age-error` : ""}`} onChange={e => set({ age: e.target.value })}/><em aria-hidden="true">years</em></span>
      <small id={`${id}-age-hint`}>Daywell is for adults, 18 and over.</small>
      {problems.age && <p id={`${id}-age-error`} className="form-error">{problems.age}</p>}
    </div>
    <fieldset className="about-field">
      <legend>Sex, for estimates <small>Optional</small></legend>
      <span className="about-chips">{SEXES.map(([value, label]) => <button key={value} type="button" aria-pressed={draft.sex === value} onClick={() => set({ sex: draft.sex === value ? null : value })}>{label}</button>)}</span>
      <small>Only used for the calorie formula, which differs slightly by sex.</small>
    </fieldset>
    <fieldset className="about-field">
      <legend>Height and weight <small>Optional</small></legend>
      <div className="about-measure">
        <span className="about-measure-head"><span aria-hidden="true">Height</span><UnitToggle label="Height units" value={draft.heightUnit} options={[["cm", "cm"], ["ftin", "ft, in"]] as const} onChange={(unit: HeightUnit) => setDraft(d => withHeightUnit(d, unit, settings.heightCm))}/></span>
        {draft.heightUnit === "cm"
          ? <UnitInput id={`${id}-height`} label="Height in centimetres" unit="cm" value={draft.cm} onChange={cm => set({ cm })} invalid={problems.badHeight} describedBy={bodyError}/>
          : <span className="about-pair"><UnitInput id={`${id}-height`} label="Height, feet" unit="ft" numeric value={draft.feet} onChange={feet => set({ feet })} invalid={problems.badHeight} describedBy={bodyError}/><UnitInput id={`${id}-inches`} label="Height, inches" unit="in" value={draft.inches} onChange={inches => set({ inches })} invalid={problems.badHeight} describedBy={bodyError}/></span>}
      </div>
      <div className="about-measure">
        <span className="about-measure-head"><span aria-hidden="true">Weight</span><UnitToggle label="Weight units" value={draft.weightUnit} options={[["kg", "kg"], ["stlb", "st, lb"]] as const} onChange={(unit: WeightUnit) => setDraft(d => withWeightUnit(d, unit, latestWeight(settings.weights)?.kg ?? null))}/></span>
        {draft.weightUnit === "kg"
          ? <UnitInput id={`${id}-weight`} label="Weight in kilograms" unit="kg" value={draft.kg} onChange={kg => set({ kg })} invalid={problems.badWeight} describedBy={bodyError}/>
          : <span className="about-pair"><UnitInput id={`${id}-weight`} label="Weight, stone" unit="st" numeric value={draft.stone} onChange={stone => set({ stone })} invalid={problems.badWeight} describedBy={bodyError}/><UnitInput id={`${id}-pounds`} label="Weight, pounds" unit="lb" value={draft.pounds} onChange={pounds => set({ pounds })} invalid={problems.badWeight} describedBy={bodyError}/></span>}
      </div>
      <small>{inSettings ? "A new weight is added to your record for today." : "Leave these blank to skip. You can add them later."}</small>
      {problems.body && <p id={bodyError} className="form-error">{problems.body}</p>}
      {settings.bodyConsentAt
        ? <small>You agreed to keep these on {longDate(settings.bodyConsentAt)}.</small>
        : hasBodyText(draft) && <label className="about-consent"><input id={`${id}-consent`} type="checkbox" checked={draft.consent} aria-describedby={problems.consent ? `${id}-consent-error` : undefined} onChange={e => set({ consent: e.target.checked })}/><span>Keep my height and weight in Daywell for my own record and calorie estimates. I can delete them any time.</span></label>}
      {problems.consent && <p id={`${id}-consent-error`} className="form-error">{problems.consent}</p>}
    </fieldset>
    <label className="about-switch" htmlFor={`${id}-tracking-switch`}>
      <span><strong id={`${id}-tracking`}>Calorie tracking</strong><small id={`${id}-tracking-hint`}>A daily calorie guide from your details, and calories for your moves. Off unless you turn it on.</small></span>
      <Switch id={`${id}-tracking-switch`} checked={draft.calorieTracking} onCheckedChange={checked => set({ calorieTracking: checked })} aria-labelledby={`${id}-tracking`} aria-describedby={`${id}-tracking-hint`}/>
    </label>
    {inSettings && draft.calorieTracking && <div className="about-field">
      <label htmlFor={`${id}-own`}>Your own daily number <small>Optional</small></label>
      <span className="about-unit-input"><input id={`${id}-own`} inputMode="numeric" autoComplete="off" maxLength={5} value={draft.ownNumber} aria-invalid={!!problems.ownNumber || undefined} aria-describedby={`${id}-own-hint${problems.ownNumber ? ` ${id}-own-error` : ""}`} onChange={e => set({ ownNumber: e.target.value })}/><em aria-hidden="true">kcal</em></span>
      <small id={`${id}-own-hint`}>Leave it blank to use your estimate.</small>
      {problems.ownNumber && <p id={`${id}-own-error`} className="form-error">{problems.ownNumber}</p>}
    </div>}
    <GuideNote guide={guidePreview(draft, settings)} inSettings={inSettings}/>
    <p className="about-private"><Lock size={16} aria-hidden="true"/><span>Only you can see these.{inSettings ? " Nothing here is shared or sent to AI services." : ` Change or delete them any time in ${SETTINGS_PLACE}.`}</span></p>
  </div>;
}

function SummaryList({ settings, units, dated = false }: { settings: Settings; units: Partial<Units>; dated?: boolean }) {
  return <dl className="about-summary-list">{detailsSummary(settings, { units, dated }).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}

// Step 3 of sign-up. The details go into the settings that "Come on in" saves.
export function AboutYouStep({ a, heading, onBack, onDone }: { a: AppState; heading: RefObject<HTMLHeadingElement | null>; onBack: () => void; onDone: () => void }) {
  const [draft, setDraft] = useState(() => draftFrom(a.prefs, savedUnits())), [tried, setTried] = useState(false);
  const problems = tried ? checkDraft(draft, a.prefs).problems : {};
  function next(event: FormEvent) {
    event.preventDefault();
    const result = checkDraft(draft, a.prefs);
    setTried(true);
    if (!result.patch) { focusSoon(firstProblem("welcome-about", result.problems)); return; }
    const patch = result.patch;
    rememberUnits(draft);
    a.setPrefs(p => ({ ...p, ...patch }));
    onDone();
  }
  return <form className="welcome-about" onSubmit={next} noValidate>
    <div className="welcome-step-heading"><h1 ref={heading} tabIndex={-1}>A little about you.</h1><p>A few details for your own record, and for calorie estimates if you’d like them. Only you can see them.</p></div>
    <DetailsFields id="welcome-about" draft={draft} setDraft={setDraft} settings={a.prefs} problems={problems}/>
    <div className="welcome-step-footer"><button type="button" className="welcome-back" onClick={onBack}>Back</button><button type="submit" className="well-button">Continue<ArrowRight size={17}/></button></div>
  </form>;
}

// Shown on the Ready step, so people see what they're about to keep.
export function AboutYouSummary({ settings }: { settings: Settings }) {
  const [units] = useState(savedUnits);
  return <section className="about-summary" aria-labelledby="about-summary-title">
    <h2 id="about-summary-title">About you</h2>
    <SummaryList settings={settings} units={units}/>
    <p>Change or delete these any time in {SETTINGS_PLACE}.</p>
  </section>;
}

// Accounts made before Daywell asked see this once. Age is needed to carry on; the rest can be skipped.
export function AboutYouPrompt({ a }: { a: AppState }) {
  const [draft, setDraft] = useState(() => draftFrom(a.settings, savedUnits())), [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false), [error, setError] = useState(""), heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  const problems = tried ? checkDraft(draft, a.settings).problems : {};
  async function save(event: FormEvent) {
    event.preventDefault(); if (saving) return;
    const result = checkDraft(draft, a.settings);
    setTried(true);
    if (!result.patch) { focusSoon(firstProblem("about-prompt", result.problems)); return; }
    setSaving(true); setError("");
    rememberUnits(draft);
    const problem = await a.saveDetails(result.patch);
    setSaving(false);
    if (problem) setError(problem);
  }
  return <div className="first-visit about-prompt">
    <header className="welcome-header"><div className="welcome-brand"><span><Sun size={24}/></span>daywell.</div></header>
    <main className="welcome-shell"><form className="welcome-about" onSubmit={save} noValidate>
      <div className="welcome-step-heading"><h1 ref={heading} tabIndex={-1}>A little about you.</h1><p>Daywell now asks for your age. You can also add a few details for your own record and calorie estimates. Only you can see them.</p></div>
      <DetailsFields id="about-prompt" draft={draft} setDraft={setDraft} settings={a.settings} problems={problems}/>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="welcome-step-footer about-prompt-footer"><button type="submit" className="well-button" disabled={saving}>{saving ? "Saving…" : "Save and continue"}<ArrowRight size={17}/></button></div>
    </form></main>
    <footer className="welcome-footer"><Sun size={14}/>Small steps. Better days.</footer>
  </div>;
}

// Your details in settings: a summary, and a sheet to change them, add today's weight or delete height and weight.
export function YourDetails({ a }: { a: AppState }) {
  // Settings content mounts only while the panel is open, in the browser, so the saved units can be read straight away.
  const [open, setOpen] = useState(false), [draft, setDraft] = useState(() => draftFrom(a.settings)), [units, setUnits] = useState<Partial<Units>>(savedUnits);
  const [tried, setTried] = useState(false), [saving, setSaving] = useState(false), [error, setError] = useState(""), [confirmDelete, setConfirmDelete] = useState(false);
  const problems = tried ? checkDraft(draft, a.settings).problems : {};
  const record = [...a.settings.weights].reverse(), hasBody = a.settings.heightCm !== null || record.length > 0;
  function start() { setDraft(draftFrom(a.settings, savedUnits())); setTried(false); setError(""); setConfirmDelete(false); setOpen(true); }
  async function save(event: FormEvent) {
    event.preventDefault(); if (saving) return;
    const result = checkDraft(draft, a.settings);
    setTried(true);
    if (!result.patch) { focusSoon(firstProblem("settings-about", result.problems)); return; }
    setSaving(true); setError("");
    rememberUnits(draft); setUnits({ height: draft.heightUnit, weight: draft.weightUnit });
    const problem = await a.saveDetails(result.patch);
    setSaving(false);
    if (problem) setError(problem); else setOpen(false);
  }
  async function deleteBody() {
    if (saving) return;
    setSaving(true); setError("");
    const problem = await a.saveDetails({ heightCm: null, weights: [], bodyConsentAt: null });
    setSaving(false);
    if (problem) { setError(problem); return; }
    setConfirmDelete(false);
    setDraft(d => ({ ...d, cm: "", feet: "", inches: "", kg: "", stone: "", pounds: "", consent: false }));
  }
  return <div className="about-details">
    <div className="about-details-head"><strong>Your details</strong><Button type="button" variant="outline" onClick={start}>Change details</Button></div>
    <SummaryList settings={a.settings} units={units} dated/>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="entry-dialog about-dialog">
      <DialogHeader><DialogTitle>Your details</DialogTitle><DialogDescription>For your own record and, if you like, a daily calorie guide.</DialogDescription></DialogHeader>
      <form onSubmit={save} noValidate>
        <DetailsFields id="settings-about" draft={draft} setDraft={setDraft} settings={a.settings} problems={problems} inSettings/>
        {record.length > 0 && <details className="about-weights"><summary>Your weight record · {record.length} {record.length === 1 ? "entry" : "entries"}</summary><dl>{record.map(w => <div key={w.date}><dt>{longDate(w.date)}</dt><dd>{formatWeight(w.kg, draft.weightUnit)}</dd></div>)}</dl></details>}
        {hasBody && (confirmDelete
          ? <div className="about-delete" role="group" aria-labelledby="about-delete-question"><p id="about-delete-question">Delete your height and every weight in your record? This can’t be undone.</p><span><Button type="button" variant="destructive" disabled={saving} onClick={() => void deleteBody()}>Delete them</Button><Button type="button" variant="outline" onClick={() => setConfirmDelete(false)}>Keep them</Button></span></div>
          : <button type="button" className="well-text-button" onClick={() => setConfirmDelete(true)}><Trash2 size={16}/>Delete height and weight</button>)}
        {error && <p role="alert" className="form-error">{error}</p>}
        <Button className="full-button" type="submit" disabled={saving}>{saving ? <LoaderCircle className="spin"/> : <Check/>}Save details</Button>
      </form>
    </DialogContent></Dialog>
  </div>;
}
