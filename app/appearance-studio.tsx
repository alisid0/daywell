"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { Check, Heart, Mic, RotateCcw, Shuffle, Sun, Trash2, Undo2, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CompanionPortrait } from "@/components/daywell-companions";
import { appearanceTokens, backdrops, buttonLooks, companyLooks, daywellStyles, designIterations, iterationLook, referenceLook, lettering, letteringTokens, originalLook, palettes, sameLook, starterLooks, type Appearance, type FavouriteLook } from "@/lib/appearance";
import { ReadingComfortSettings } from "./reading-comfort";
import type { AppearanceController } from "./design-switcher";

const backdropNames = { plain: "Plain", gingham: "Gingham", speckle: "Paper flecks", lake: "Stillwater lake" };
const buttonNames = { pillowy: "Pillowy", pebble: "Pebbles", simple: "Simple" };
const companyNames = { huddle: "A little huddle", perch: "Side by side", quiet: "Just the space" };

function LookPreview({ look, name, small = false }: { look: Appearance; name: string; small?: boolean }) {
  return <div className={`appearance-preview ${small ? "appearance-preview-small" : ""}`} data-composition={look.composition} data-backdrop={look.backdrop} data-lettering={look.lettering} data-buttons={look.buttons} data-company={look.company} data-layout={look.style} style={{ ...appearanceTokens(look), ...letteringTokens(look.lettering) } as CSSProperties} aria-hidden="true">
    <span className="appearance-preview-brand"><Sun size={18} />daywell.</span>
    <div className="appearance-preview-greeting">{look.style === "stillwater" ? "Take a moment" : "A little company"}{small ? "." : `, ${name === "You" ? "friend" : name}.`}</div>
    <span className="appearance-preview-copy">Your day, with a little company.</span>
    {look.company !== "quiet" && <div className="appearance-preview-friends"><CompanionPortrait id="luma" size={120} decorative /><CompanionPortrait id="bounce" size={120} decorative /><CompanionPortrait id="pip" size={155} decorative /></div>}
    <span className="appearance-preview-talk"><Mic size={18} />Talk to Daywell</span>
    <div className="appearance-preview-actions"><span>Focus</span><span>Unwind</span><span>Move</span></div>
    {!small && <span className="appearance-preview-dock">Home <span>Calendar</span> Tools</span>}
  </div>;
}

export function AppearanceStudio({ look, name, onDone, onTry }: { look: AppearanceController; name: string; onDone: () => void; onTry: () => void }) {
  const [section, setSection] = useState<"iterations" | "looks" | "mix" | "saved" | "reading">("iterations");
  const [startingLook] = useState(look.current);
  const [history, setHistory] = useState<Appearance[]>([]);
  const [message, setMessage] = useState("Changes apply live and stay in this browser.");
  const [favouriteName, setFavouriteName] = useState("");
  const [formError, setFormError] = useState("");
  const [removed, setRemoved] = useState<FavouriteLook | null>(null);
  const current = look.current;
  function apply(next: Appearance, label = "Look updated") {
    if (sameLook(next, current)) return;
    setHistory(previous => [...previous.slice(-29), current]);
    const saved = look.apply(next);
    setMessage(saved ? `${label}. Saved in this browser.` : `${label} for this visit. This browser couldn’t save it.`);
  }
  function change<K extends keyof Appearance>(key: K, value: Appearance[K]) { apply({ ...current, [key]: value, ...(key === "style" && value !== "stillwater" ? { composition: "original" as const } : {}) }); }
  function undo() {
    const previous = history.at(-1); if (!previous) return;
    setHistory(history.slice(0, -1));
    setMessage(look.apply(previous) ? "Previous combination restored." : "Restored for this visit. This browser couldn’t save it.");
  }
  function surprise() {
    const pick = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)];
    const next = { ...current, palette: pick(Object.keys(palettes) as Appearance["palette"][]), backdrop: pick(backdrops), lettering: pick(lettering), buttons: pick(buttonLooks), company: pick(companyLooks.filter(value => value !== "quiet")) };
    if (sameLook(next, current)) next.backdrop = current.backdrop === "gingham" ? "plain" : "gingham";
    apply(next, "A new combination to try"); setSection("mix");
  }
  function save(event: FormEvent) {
    event.preventDefault();
    if (!favouriteName.trim()) { setFormError("Give this look a name first."); return; }
    const result = look.saveFavourite(favouriteName);
    if (result.full) { setFormError("You have 12 saved looks. Remove one to make room."); return; }
    setFormError(""); setFavouriteName(""); setSection("saved");
    setMessage(result.saved ? "Your favourite is saved. You can come back to it any time in this browser." : "Kept for this visit. This browser couldn’t save the favourite.");
  }
  function remove(favourite: FavouriteLook) {
    const saved = look.removeFavourite(favourite.id); setRemoved(favourite);
    setMessage(saved ? `${favourite.name} removed. You can undo below.` : "Removed for this visit. This browser couldn’t save the change.");
  }
  return <Dialog open onOpenChange={open => { if (!open) onDone(); }}><DialogContent className="appearance-studio" data-section={section} showCloseButton={false} onCloseAutoFocus={event => { event.preventDefault(); (document.getElementById("stillwater-style-toggle") || document.getElementById("daywell-style-toggle"))?.focus({ preventScroll: true }); }}>
    <header className="appearance-studio-header"><div><DialogTitle>Make it feel like you.</DialogTitle><DialogDescription>Your appearance studio. Mix a little, find your favourite.</DialogDescription></div><button className="studio-done" onClick={onDone}><Check size={17} />Done</button></header>
    <div className="appearance-studio-body">
      <section className="studio-preview-column" aria-label="Live appearance preview"><div className="studio-preview-label"><span>Live preview</span><span>{palettes[current.palette].name} / {buttonNames[current.buttons]}</span></div><LookPreview look={current} name={name} /><div className="studio-preview-tools"><button onClick={surprise}><Shuffle size={16} />Surprise me</button><button disabled={!history.length} onClick={undo}><Undo2 size={16} />Undo</button><button disabled={sameLook(current, startingLook)} onClick={() => apply(startingLook, "Your starting look restored")}><RotateCcw size={15} />Start over</button></div><p className="studio-status" role="status">{message}</p></section>
      <div className="studio-controls">
        <div className="studio-tabs" role="group" aria-label="Appearance studio sections">{(["iterations", "looks", "mix", "saved", "reading"] as const).map(tab => <button key={tab} aria-pressed={section === tab} onClick={() => setSection(tab)}>{tab === "iterations" ? "Iterations" : tab === "looks" ? "Starting looks" : tab === "mix" ? "Mix your own" : tab === "reading" ? "Reading comfort" : `Saved (${look.favourites.length})`}</button>)}</div>
        <div className="studio-controls-scroll">
          {section === "iterations" && <>
            <div className="studio-iteration-intro"><div><h3>Same feeling. A little more room.</h3><p>Three working designs grown from your selection. Try them at full size, then mix the details you like.</p></div><button className="studio-reference" onClick={() => { apply(referenceLook, "Your reference restored"); onTry(); }}><RotateCcw size={16} /><span>View your reference<small>Berry, paper flecks, soft buttons</small></span></button></div>
            <div className="studio-iterations">{designIterations.map(iteration => <article className="studio-iteration" key={iteration.id} data-selected={sameLook(current, iterationLook(iteration.id))}>
              <LookPreview look={iterationLook(iteration.id)} name={name} />
              <div className="studio-iteration-copy"><span>{iteration.detail}</span><h4>{iteration.name}</h4><p>{iteration.description}</p><button aria-label={`Try ${iteration.name}`} onClick={() => { apply(iterationLook(iteration.id), iteration.name); onTry(); }}>{sameLook(current, iterationLook(iteration.id)) ? <Check size={16} /> : null}Try this design</button></div>
            </article>)}</div>
            <p className="studio-iteration-note">Your reference stays here. Trying a design doesn’t make it final.</p>
          </>}
          {section === "looks" && <><p className="studio-hint">Start with a mood. Every part can be mixed.</p><div className="studio-starters">{starterLooks.map(starter => <button key={starter.name} className="studio-starter" aria-pressed={sameLook(current, starter.look)} onClick={() => apply(starter.look, starter.name)}><LookPreview look={starter.look} name={name} small /><span>{starter.name}{sameLook(current, starter.look) && <Check size={15} />}</span></button>)}</div><button className="studio-mix-link" onClick={() => setSection("mix")}>Mix the colours, textures & details</button><details className="studio-originals"><summary>Earlier designs</summary><div>{daywellStyles.filter(style => !["nook", "stillwater"].includes(style.id)).map(style => <button key={style.id} onClick={() => apply(originalLook(style.id), style.name)}>{style.name}<small>{style.description}</small></button>)}</div></details></>}
          {section === "mix" && <>
            <fieldset className="studio-field"><legend>Composition</legend><div className="studio-options"><button aria-pressed={current.composition === "original"} onClick={() => change("composition", "original")}>Original layout</button>{designIterations.map(iteration => <button key={iteration.id} aria-pressed={current.composition === iteration.id} onClick={() => apply({ ...current, style: "stillwater", composition: iteration.id }, iteration.name)}>{iteration.name}</button>)}</div><p>Keep these colours and materials, and try a different arrangement.</p></fieldset>
            <fieldset className="studio-field"><legend>Colours</legend><div className="studio-colours">{Object.entries(palettes).map(([id, palette]) => <button key={id} aria-label={`${palette.name} colours`} aria-pressed={current.palette === id} onClick={() => change("palette", id as Appearance["palette"])}><span>{palette.swatches.map(colour => <i key={colour} style={{ background: colour }} />)}</span>{palette.name}</button>)}</div></fieldset>
            <fieldset className="studio-field"><legend>Backdrop</legend><div className="studio-backdrops">{backdrops.map(backdrop => <button key={backdrop} aria-pressed={current.backdrop === backdrop} onClick={() => change("backdrop", backdrop)}><span className="studio-backdrop-sample" data-backdrop={backdrop} />{backdropNames[backdrop]}</button>)}</div></fieldset>
            <fieldset className="studio-field"><legend>Buttons</legend><div className="studio-three">{buttonLooks.map(button => <button key={button} aria-pressed={current.buttons === button} onClick={() => change("buttons", button)}><span className={`studio-button-sample studio-button-${button}`}>Hello</span>{buttonNames[button]}</button>)}</div></fieldset>
            <fieldset className="studio-field"><legend>Companions at home</legend><div className="studio-options">{companyLooks.map(company => <button key={company} aria-pressed={current.company === company} onClick={() => change("company", company)}>{companyNames[company]}</button>)}</div><p>Your active helper still joins a task. “Hide companion pictures” in Voice & company takes priority.</p></fieldset>
            <fieldset className="studio-field"><legend>Layout</legend><div className="studio-options">{(["nook", "stillwater"] as const).map(style => <button key={style} aria-pressed={current.style === style} onClick={() => change("style", style)}>{style === "nook" ? "Nook’s cosy layout" : "Stillwater’s calm centre"}</button>)}</div><p>Swap the layout while keeping your colour and detail choices.</p></fieldset>
          </>}
          {section === "saved" && <div className="studio-saved">{look.favourites.length ? look.favourites.map(favourite => <div key={favourite.id}><button className="studio-saved-apply" aria-pressed={sameLook(current, favourite.look)} onClick={() => apply(favourite.look, favourite.name)}><span style={{ background: palettes[favourite.look.palette].swatches[0], color: palettes[favourite.look.palette].tokens["--dw-ink"] }}><Heart size={19} /></span><strong>{favourite.name}</strong>{sameLook(current, favourite.look) && <Check size={16} />}</button><button className="studio-remove" aria-label={`Remove ${favourite.name}`} onClick={() => remove(favourite)}><Trash2 size={16} /></button></div>) : <p>Found a combination you like? Give it a name below. Your saved looks will live here.</p>}{removed && <button className="studio-mix-link" onClick={() => { const saved = look.restoreFavourite(removed); setRemoved(null); setMessage(saved ? "Favourite restored." : "Couldn’t save the restoration. The list shows what’s available for this visit."); }}><Undo2 size={15} />Restore {removed.name}</button>}</div>}
          {section === "reading" && <ReadingComfortSettings />}
          {section !== "iterations" && section !== "reading" && <form className="studio-save" onSubmit={save}><label htmlFor="favourite-look-name">Keep a favourite</label><div><input id="favourite-look-name" maxLength={40} value={favouriteName} placeholder="My cosy corner" onChange={event => { setFavouriteName(event.target.value); setFormError(""); }} /><button type="submit"><Heart size={16} />Save look</button></div>{formError && <p role="alert">{formError}</p>}<small>Looks save on this browser. Your tasks and records stay as they are.</small></form>}
        </div>
      </div>
    </div>
  </DialogContent></Dialog>;
}

export function IterationReview({ look, onCompare, onClose }: { look: AppearanceController; onCompare: () => void; onClose: () => void }) {
  const [message, setMessage] = useState("");
  function tryLook(next: Appearance) { setMessage(look.apply(next) ? "" : "Previewing for this visit. This browser couldn’t save the look."); }
  return <aside className="iteration-review" aria-label="Compare design iterations"><div className="iteration-review-choices"><button aria-pressed={sameLook(look.current, referenceLook)} onClick={() => tryLook(referenceLook)}>Your reference</button>{designIterations.map(iteration => <button key={iteration.id} aria-pressed={look.current.composition === iteration.id} onClick={() => tryLook({ ...look.current, style: "stillwater", composition: iteration.id })}>{iteration.name}</button>)}</div><button className="iteration-review-compare" onClick={onCompare}>Compare & mix</button><button className="iteration-review-close" aria-label="Close design comparison" onClick={onClose}><X size={16} /></button>{message && <p role="status">{message}</p>}</aside>;
}
