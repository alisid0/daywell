"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ChevronDown, Heart, X } from "lucide-react";
import { companions, companionIds, type CompanionId } from "@/lib/companions";

export function CompanionPortrait({ id, size = 80, decorative = false, eager = false }: { id: CompanionId; size?: number; decorative?: boolean; eager?: boolean }) {
  const helper = companions[id];
  // These transparent originals are served locally; no image service is required.
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={`dw-companion-image companion-image-${id}`} src={`/companions/${id}.png`} width={size} height={size} alt={decorative ? "" : `${helper.name}, your fluffy ${helper.job.toLowerCase()} helper`} loading={eager ? "eager" : "lazy"} decoding="async" draggable={false} />;
}

export function CompanionWelcome() {
  return <div className="dw-companion-welcome"><p>One host. A little company.</p><div className="dw-welcome-huddle"><CompanionPortrait id="momo" size={152} eager /><CompanionPortrait id="pip" size={194} eager /><CompanionPortrait id="luma" size={156} eager /></div><span>Just tell Daywell. The helpers come to you.</span></div>;
}

export function CompanionAssistant({ id, message, celebration = 0, action, onAction, details }: {
  id: CompanionId; message?: string; celebration?: number; action?: string; onAction?: () => void; details?: string;
}) {
  const [open, setOpen] = useState(false);
  const helper = companions[id];
  const detailId = useId();
  const image = useRef<HTMLSpanElement>(null);
  const previous = useRef(celebration);
  useEffect(() => {
    if (celebration > previous.current && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      image.current?.animate([
        { transform: "translateY(0) scale(1)" },
        { transform: "translateY(2px) scale(1.08,.92)", offset: .2 },
        { transform: "translateY(-7px) scale(.97,1.03)", offset: .5 },
        { transform: "translateY(0) scale(1)" },
      ], { duration: 540, easing: "ease-out" });
    }
    previous.current = celebration;
  }, [celebration]);
  return <div className="dw-companion-assistant" style={{ "--companion-colour": helper.colour } as CSSProperties}>
    <button className="dw-companion-invitation" aria-expanded={open} aria-controls={detailId} aria-label={`${open ? "Close" : "Ask"} ${helper.name}${open ? "’s help" : " for help"}`} onClick={() => setOpen(!open)}>
      <span className="dw-companion-avatar" ref={image}><CompanionPortrait id={id} size={76} decorative /></span>
      <span className="dw-companion-words"><strong>{helper.name} is here</strong><span aria-live="polite">{message || helper.hello}</span></span><ChevronDown size={14} className={open ? "companion-chevron-open" : ""} aria-hidden="true" />
    </button>
    {open && <div className="dw-companion-advice" id={detailId}><p>{details || helper.hint}</p>{onAction && <button onClick={onAction}>{action || helper.action}</button>}</div>}
  </div>;
}

export function CompanionFamily({ compact = false, onChoose, ids = companionIds }: { compact?: boolean; onChoose?: (id: CompanionId) => void; ids?: CompanionId[] }) {
  const [selected, setSelected] = useState<CompanionId | null>(null);
  const [petted, setPetted] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const selectedRef = useRef<HTMLButtonElement | null>(null);
  const detailId = useId();
  function select(id: CompanionId, button: HTMLButtonElement) {
    selectedRef.current = button;
    setSelected(id); setPetted(false);
    window.requestAnimationFrame(() => heading.current?.focus());
  }
  function close() { setSelected(null); selectedRef.current?.focus(); }
  return <section className={`dw-companion-family ${compact ? "companion-family-compact" : ""}`} aria-label="Your Daywell companions" style={{ "--companion-count": Math.max(1, ids.length) } as CSSProperties}>
    <div className="dw-companion-family-heading"><div><h2>{compact ? "A little company for your day" : "Meet your little day helpers."}</h2><p>{compact ? "Choose a helper to find your next small step." : "Seven soft little spheres. A different kind of help from each one."}</p></div><span>Tap one to say hello</span></div>
    <div className="dw-companion-roster">{ids.map(id => <button key={id} aria-label={`Meet ${companions[id].name}, ${companions[id].job.toLowerCase()}`} aria-expanded={selected === id} aria-controls={selected === id ? detailId : undefined} onClick={event => select(id, event.currentTarget)}><CompanionPortrait id={id} size={compact ? 83 : 136} decorative /><strong>{companions[id].name}</strong><span>{companions[id].job}</span></button>)}</div>
    {selected && <div className="dw-companion-introduction" id={detailId}>
      <div className={`dw-companion-intro-portrait ${petted ? "companion-loved" : ""}`}><CompanionPortrait id={selected} size={146} decorative /><Heart className="companion-love-heart" aria-hidden="true" /></div>
      <div><h3 ref={heading} tabIndex={-1}>Hello, I’m {companions[selected].name}.</h3><p className="companion-hello">{petted ? "A little warmth, right back at you." : companions[selected].hello}</p><p>{companions[selected].hint}</p><div className="dw-companion-intro-actions"><button className="dw-companion-cuddle" onClick={() => setPetted(!petted)} aria-pressed={petted}><Heart size={15} />{petted ? "A little love received" : "Send a little love"}</button>{onChoose ? <button className="dw-companion-open-tool" onClick={() => onChoose(selected)}>{companions[selected].action}</button> : <Link className="dw-companion-open-tool" href="/">Open my Daywell tools</Link>}</div></div>
      <button className="dw-companion-close" aria-label="Close helper introduction" onClick={close}><X size={17} /></button>
    </div>}
  </section>;
}
