"use client";

import Link from "@/components/daywell-link";
import { CompanionAssistant, CompanionPortrait, CompanionWelcome, CompanionFamily } from "@/components/daywell-companions";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Check, ChevronLeft, Sun, Waves, ShoppingBag, Timer, ListChecks, Moon, Plus, Play, Pause, RotateCcw, X, SlidersHorizontal, BookOpen } from "lucide-react";
import { directions, directionKeys, type Direction } from "./directions";

type View = "welcome" | "today";
type Tool = "focus" | "grocery" | "sleep";
type Item = { id: number; text: string; done: boolean };
const toolOptions: { id: Tool; title: string; text: string; helper: "pip" | "momo" | "luma" }[] = [
  { id: "focus", title: "Make space to focus", text: "A short list and a focus timer", helper: "pip" },
  { id: "grocery", title: "Remember the essentials", text: "A shopping list you can tick off", helper: "momo" },
  { id: "sleep", title: "End the day gently", text: "A plan for winding down", helper: "luma" },
];

function Brand({ direction }: { direction: Direction }) {
  const Icon = direction === "daybreak" ? Sun : direction === "pocket" ? ShoppingBag : Waves;
  return <span className="concept-brand"><Icon aria-hidden="true" /><span>daywell.</span></span>;
}

export default function DesignPreview({ direction, initialView }: { direction: Direction; initialView: View }) {
  const [view, setView] = useState<View>(initialView);
  const [name, setName] = useState("Ali");
  const [tools, setTools] = useState<Tool[]>(["focus", "grocery", "sleep"]);
  const [tasks, setTasks] = useState<Item[]>([{ id: 1, text: "Make a plan for the weekend", done: false }, { id: 2, text: "Clear a little space on my desk", done: false }, { id: 3, text: "Step outside for some fresh air", done: true }]);
  const [groceries, setGroceries] = useState<Item[]>([{ id: 4, text: "Oat milk", done: false }, { id: 5, text: "Bananas", done: false }, { id: 6, text: "Sourdough", done: true }]);
  const [windDown, setWindDown] = useState("22:30");
  const [unwound, setUnwound] = useState(false);
  const [notice, setNotice] = useState("");
  const [help, setHelp] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const helpDialog = useRef<HTMLDialogElement>(null);
  const [duration, setDuration] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const deadline = useRef(0);
  const displayName = name.trim() || "you";
  const design = directions[direction];
  const shoppingCount = groceries.filter(item => !item.done).length;

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setRemaining(left);
      if (!left) { setRunning(false); setNotice("Focus session finished. Take a moment to stretch."); }
    };
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [running]);

  useEffect(() => { if (help) helpDialog.current?.showModal(); else helpDialog.current?.close(); }, [help]);

  function changeView(next: View) {
    setView(next);
    window.history.replaceState(null, "", `/designs/${direction}${next === "today" ? "?view=today" : ""}`);
    window.requestAnimationFrame(() => { heading.current?.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: "instant" }); });
  }
  function toggleTool(id: Tool) { setTools(current => current.includes(id) ? current.filter(t => t !== id) : [...current, id]); }
  function openDay(event: FormEvent) { event.preventDefault(); if (tools.length) changeView("today"); }
  function resetTimer(minutes = duration) { setRunning(false); setDuration(minutes); setRemaining(minutes * 60); }
  function toggleTimer() { if (running) { setRemaining(Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000))); setRunning(false); } else { const next = remaining || duration * 60; deadline.current = Date.now() + next * 1000; setRemaining(next); setRunning(true); } }
  function toggleItem(id: number, type: "task" | "grocery") {
    const setter = type === "task" ? setTasks : setGroceries;
    setter(items => items.map(item => item.id === id ? { ...item, done: !item.done } : item));
  }
  function addItem(text: string, type: "task" | "grocery") {
    const setter = type === "task" ? setTasks : setGroceries;
    setter(items => [...items, { id: Date.now(), text, done: false }]);
    setNotice(type === "task" ? "Added to your sample priorities." : "Added to your sample shopping list.");
  }

  const timer = <section className="sample-timer" aria-labelledby="sample-timer-heading">
    <div className="sample-section-top"><h2 id="sample-timer-heading">{direction === "pocket" ? "A pocket of focus" : "One thing at a time"}</h2><Timer size={21} aria-hidden="true" /></div>
    <CompanionAssistant id="tock" message={running ? "I’m keeping time. You can settle into your small thing." : remaining === 0 ? "Look at that. A little focus, all done. Time for a stretch?" : "Just you and one small thing. I’ll keep the time."} celebration={remaining === 0 ? 1 : 0} action={running ? "Pause focus" : "Start focus"} onAction={toggleTimer} />
    <div className="timer-visual"><div className="timer-orbit" aria-hidden="true" /><div className="timer-sun" aria-hidden="true" /><div className="sample-time" role="timer" aria-label={`${Math.floor(remaining / 60)} minutes ${remaining % 60} seconds remaining`}>{String(Math.floor(remaining / 60)).padStart(2, "0")}<span>:</span>{String(remaining % 60).padStart(2, "0")}</div><span className="timer-state">{running ? "Your focus time" : remaining === 0 ? "A little progress made" : "Minutes for what matters"}</span></div>
    <div className="timer-controls"><button className="concept-primary" onClick={toggleTimer}>{running ? <Pause size={17} /> : <Play size={17} />}{running ? "Pause focus" : remaining === 0 ? "Start again" : remaining < duration * 60 ? "Resume focus" : "Start focus"}</button><button className="concept-icon-button" onClick={() => resetTimer()} aria-label="Reset focus timer"><RotateCcw size={18} /></button><select aria-label="Focus duration" value={duration} onChange={event => resetTimer(Number(event.target.value))}><option value={25}>25 minutes</option><option value={15}>15 minutes</option><option value={5}>5 minutes</option></select></div>
  </section>;

  const priorities = <section className="sample-priorities" aria-labelledby="priorities-heading"><div className="sample-section-top"><h2 id="priorities-heading">{direction === "pocket" ? "On your mind" : "A little progress"}</h2><span>{tasks.filter(t => t.done).length} of {tasks.length} done</span></div><CompanionAssistant id="pip" message={tasks.filter(t => t.done).length > 1 ? "Look at you go. One small thing lighter." : "What’s one little thing we could do today?"} celebration={tasks.filter(t => t.done).length} onAction={() => document.querySelector<HTMLInputElement>('[aria-label="Add a priority"]')?.focus()} /><ItemList items={tasks} toggle={id => toggleItem(id, "task")} noun="priority" /><AddItem noun="priority" onAdd={text => addItem(text, "task")} /></section>;
  const shopping = <section className="sample-shopping" aria-labelledby="shopping-heading"><div className="sample-section-top"><h2 id="shopping-heading">Pick up the essentials</h2><ShoppingBag size={21} aria-hidden="true" /></div><CompanionAssistant id="momo" message={shoppingCount ? `${shoppingCount} ${shoppingCount === 1 ? "thing" : "things"} left. Tick them off as they go in the bag.` : "Everything’s in the bag. That’s a lovely little feeling."} celebration={groceries.filter(g => g.done).length} onAction={() => document.querySelector<HTMLInputElement>('[aria-label="Add an item"]')?.focus()} /><ItemList items={groceries} toggle={id => toggleItem(id, "grocery")} noun="item" /><AddItem noun="item" onAdd={text => addItem(text, "grocery")} /></section>;
  const evening = <section className="sample-evening" aria-labelledby="evening-heading"><div className="evening-moon"><CompanionPortrait id="luma" size={74} /></div><div><h2 id="evening-heading">Leave room to unwind</h2><p>{unwound ? "Luma says: a little room to rest. That’s enough." : "Luma’s here. A book, a warm drink, a little quiet."}</p></div><label>Start winding down<input aria-label="Wind-down time" type="time" value={windDown} onChange={event => setWindDown(event.target.value)} /></label><button className="concept-secondary" aria-pressed={unwound} onClick={() => setUnwound(!unwound)}>{unwound ? <><Check size={17} />On my list</> : "Make time for this"}</button></section>;

  return <div className={`concept-root concept-${direction}`}>
    <div className="concept-review-bar"><Link href="/designs"><ChevronLeft size={15} /> All designs</Link><nav aria-label="Design variations">{directionKeys.map(key => <Link key={key} href={`/designs/${key}${view === "today" ? "?view=today" : ""}`} aria-current={direction === key ? "page" : undefined}>{directions[key].name}</Link>)}</nav><div className="review-view-switch" role="group" aria-label="Preview screen"><button aria-pressed={view === "welcome"} onClick={() => changeView("welcome")}>First visit</button><button aria-pressed={view === "today"} disabled={!tools.length} onClick={() => changeView("today")}>Your day</button></div></div>
    <div className="concept-shell"><header className="concept-header"><button className="concept-brand-button" onClick={() => changeView("welcome")} aria-label="Daywell welcome"><Brand direction={direction} /></button><span className="concept-header-note">{view === "welcome" ? "A little space for your everyday" : `${displayName === "you" ? "Your" : `${displayName}’s`} everyday space`}</span><div className="concept-header-actions">{view === "today" && <button className="concept-plain" onClick={() => changeView("welcome")}><SlidersHorizontal size={17} />Your tools</button>}<button className="concept-avatar" aria-label="Open getting started instructions" onClick={() => setHelp(true)}>{displayName === "you" ? "D" : displayName.charAt(0).toUpperCase()}</button></div></header>
      {view === "welcome" ? <main className="concept-welcome">
        <div className="welcome-message"><h1 ref={heading} tabIndex={-1}>{design.welcomeTitle}</h1><p>{design.welcomeText}</p>
          <div className="welcome-guidance"><span><ListChecks size={19} />Pick what’s useful to you.</span><span><Timer size={19} />Try one small thing today.</span><span><Check size={19} />Come back whenever you need.</span></div>
          <div className="concept-welcome-art"><CompanionWelcome /></div>
        </div>
        <form className="welcome-setup" onSubmit={openDay}><h2>Make yourself at home.</h2><p>A name and a few useful tools. That’s all you need to begin.</p><label className="concept-name-label" htmlFor="sample-name">What should we call you?<span>Optional</span></label><input id="sample-name" className="concept-name-input" value={name} placeholder="Your name" maxLength={40} autoComplete="given-name" onChange={event => setName(event.target.value)} />
          <fieldset className="welcome-tool-options"><legend>What would help your day?</legend>{toolOptions.map(({ id, title, text, helper }) => <label className={`welcome-tool-option ${tools.includes(id) ? "tool-selected" : ""}`} key={id}><CompanionPortrait id={helper} size={47} decorative /><span><strong>{title}</strong><small>{text}</small></span><input type="checkbox" checked={tools.includes(id)} onChange={() => toggleTool(id)} /></label>)}</fieldset>
          {!tools.length && <p className="concept-form-message" role="status">Choose at least one tool to open your day.</p>}
          <button className="concept-primary welcome-submit" disabled={!tools.length}>Open my sample day</button><p className="concept-welcome-reassurance">You can change your tools whenever you like.</p>
        </form>
      </main> : <main className="concept-day">
        {direction === "current" && <aside className="current-aside"><span>In your day</span><Link href="#day-now"><span className="nav-dot" />Now</Link><Link href="#day-later"><ShoppingBag size={17} />Later</Link><Link href="#day-tonight"><Moon size={17} />Tonight</Link><button onClick={() => setHelp(true)}><BookOpen size={17} />Getting started</button></aside>}
        <div className="day-content"><div className="day-greeting"><div><span className="day-date">Saturday, 3 October <span>Sample day</span></span><h1 ref={heading} tabIndex={-1}>{direction === "daybreak" ? `Hello, ${displayName}.` : direction === "pocket" ? `What’s on your mind, ${displayName}?` : `A day at your pace, ${displayName}.`}</h1><p>{direction === "daybreak" ? "There’s room for a good day. Start with one small thing." : direction === "pocket" ? "Put it down here. Leave a little room for yourself." : "You don’t have to do it all. Just the next small thing."}</p></div>{direction === "daybreak" && <div className="greeting-sun greeting-companion"><CompanionPortrait id="sunny" size={96} /><span>Sunny says hello.</span></div>}{direction === "pocket" && <div className="pocket-day-tag greeting-companion"><CompanionPortrait id="pip" size={110} /><span>Little things.<br />Big softie.</span></div>}</div>
        <div className="sample-getting-started"><BookOpen size={19} /><p><strong>Your first small step</strong> {tools.includes("focus") ? "Add a priority below, then give it 25 minutes of focus." : tools.includes("grocery") ? "Add something you need, then tick it off when it’s in the bag." : "Choose a time to wind down, then make a little room for it."}</p><button onClick={() => setHelp(true)}>Show me how</button></div>
        {direction === "current" ? <div className="current-timeline"><div className="current-moment" id="day-now"><div className="moment-label"><span />Now</div>{tools.includes("focus") ? <div className="current-focus-pair">{timer}{priorities}</div> : <p className="empty-moment">A little space in your day. Add focus from Your tools whenever you need it.</p>}</div><div className="current-moment" id="day-later"><div className="moment-label"><span />Later</div>{tools.includes("grocery") ? shopping : <p className="empty-moment">Nothing to pick up. Keep a little time for yourself.</p>}</div><div className="current-moment" id="day-tonight"><div className="moment-label"><span />Tonight</div>{tools.includes("sleep") ? evening : <p className="empty-moment">Your evening is open. Add wind-down from Your tools if it helps.</p>}</div></div> : <div className={`daily-board ${tools.length < 3 ? "custom-tools" : ""}`}>{tools.includes("focus") && <>{direction === "pocket" ? priorities : timer}{direction === "pocket" ? timer : priorities}</>}{tools.includes("grocery") && shopping}{tools.includes("sleep") && evening}</div>}
        <p className="daily-closing">{direction === "daybreak" ? "Small things add up. You’re doing enough." : direction === "pocket" ? "A little less to remember. A little more room to live." : "Leave some space in the day for yourself."}</p></div>
      </main>}
      <div className="concept-family-footer"><CompanionFamily compact /></div><footer className="concept-footer"><span>{design.name} design preview</span><p>Sample content. Changes reset when you reload and don’t affect your saved day.</p><Link href="/">Open current MVP</Link></footer>
    </div>
    <span className="concept-live-status" aria-live="polite" role="status">{notice}</span>
    <dialog ref={helpDialog} className="concept-help" aria-labelledby="preview-help-heading" onCancel={() => setHelp(false)} onClose={() => setHelp(false)}><div className="sample-section-top"><h2 id="preview-help-heading">A few ways to begin.</h2><button className="concept-icon-button" onClick={() => setHelp(false)} aria-label="Close instructions"><X /></button></div><p>Try the tools with sample content. There’s no setup to get wrong.</p><ol><li><strong>Add one priority.</strong><span>Type something small into “Add a priority” and press Add. Tick it off when you’re done.</span></li><li><strong>Give yourself some focus time.</strong><span>Press Start focus. You can pause, reset or choose a shorter session.</span></li><li><strong>Keep the essentials together.</strong><span>Add items to the shopping list. Tick each item when it’s in your bag.</span></li><li><strong>Make room for your evening.</strong><span>Choose a wind-down time and press Make time for this. This preview doesn’t send reminders.</span></li></ol><button className="concept-primary" onClick={() => setHelp(false)}>Got it</button></dialog>
  </div>;
}

function ItemList({ items, toggle, noun }: { items: Item[]; toggle: (id: number) => void; noun: string }) {
  return <ul className="sample-item-list">{items.map(item => <li key={item.id}><label className={item.done ? "item-done" : ""}><input type="checkbox" checked={item.done} onChange={() => toggle(item.id)} aria-label={`${item.text}, ${noun}`} /><span className="sample-checkbox" aria-hidden="true">{item.done && <Check size={14} />}</span><span>{item.text}</span></label></li>)}</ul>;
}

function AddItem({ noun, onAdd }: { noun: string; onAdd: (text: string) => void }) {
  const [text, setText] = useState("");
  function submit(event: FormEvent) { event.preventDefault(); if (!text.trim()) return; onAdd(text.trim()); setText(""); }
  return <form className="sample-add-item" onSubmit={submit}><Plus size={17} aria-hidden="true" /><input aria-label={`Add ${noun === "item" ? "an" : "a"} ${noun}`} placeholder={`Add ${noun === "item" ? "an" : "a"} ${noun}`} maxLength={140} value={text} onChange={event => setText(event.target.value)} /><button disabled={!text.trim()} aria-label={`Add ${noun}`}>Add</button></form>;
}
