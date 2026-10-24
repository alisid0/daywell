"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Camera, Check, ChevronDown, CircleSlash, Image as ImageIcon, ScanText, Undo2, X } from "lucide-react";
import { DialogTitle } from "@/components/ui/dialog";
import { CompanionPortrait } from "@/components/daywell-companions";
import { today } from "@/lib/daywell";
import type { FoodAction } from "@/lib/food-client";
import { placeIds, placeNames, suggestedPlace, type PlaceId } from "@/lib/food-places";
import { amountWords, parseAmount, topUpLot, type TrolleyItem } from "@/lib/food-trolley";
import { matchList, type Receipt, type ReceiptItem } from "@/lib/receipt";
import { addFoodByHand, capital, FoodFace, Sheet, SheetError } from "./kitchen";
import { photoProblem, shrinkPhoto } from "./photo";
import { useRecipesConnected } from "./recipe-ideas";
import type { AppState } from "./use-daywell";

// Receipt photos (owner-approved design, 22 October 2026): "Back from the shops?" on the Trolley. OpenAI reads the
// photo (lib/receipt.ts); Daywell matches it to the trolley list and suggests where each food goes. Nothing is saved
// until the person checks it and taps Put away, and Undo is there straight after.
type Food = AppState["food"];
type Done = { operationId: string; count: number; all: boolean; places: Partial<Record<PlaceId, number>>; ticked: string[] };
const list = (words: string[]) => words.length < 2 ? words.join("") : `${words.slice(0, -1).join(", ")} and ${words.at(-1)}`;

export function ReceiptCard({ f, items }: { f: Food; items: TrolleyItem[] }) {
  // Receipts use the same OpenAI connection as recipe ideas.
  const connected = useRecipesConnected();
  const camera = useRef<HTMLInputElement>(null), library = useRef<HTMLInputElement>(null), abort = useRef<AbortController | null>(null);
  const [reading, setReading] = useState(false), [error, setError] = useState(""), [status, setStatus] = useState(""), [undoFailed, setUndoFailed] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null), [done, setDone] = useState<Done | null>(null);
  useEffect(() => () => abort.current?.abort(), []);
  const busy = f.busy || !!f.pending || !!f.draft;
  async function read(file: File) {
    if (reading) return;
    const problem = photoProblem(file);
    setError(""); setStatus(""); setDone(null); setUndoFailed(false);
    if (problem) { setError(problem); return; }
    const controller = new AbortController(); abort.current = controller; setReading(true);
    try {
      const photo = await shrinkPhoto(file, "receipt.jpg");
      const form = new FormData(); form.set("date", today()); form.set("time", new Date().toLocaleTimeString()); form.set("mode", "receipt"); form.set("image", photo);
      const response = await fetch("/api/capture", { method: "POST", body: form, signal: AbortSignal.any([controller.signal, AbortSignal.timeout(75_000)]) });
      const value = await response.json().catch(() => null) as { receipt?: Receipt; error?: string } | null;
      if (!response.ok || !value?.receipt) throw Error(value?.error || "Couldn’t read that receipt. Try again, or put things away by hand.");
      if (!controller.signal.aborted) setReceipt(value.receipt);
    } catch (problem) {
      if (controller.signal.aborted) return;
      setError(problem instanceof Error && problem.name !== "TimeoutError" ? problem.message : "That took too long. Try again with the whole receipt in the photo.");
    } finally { if (abort.current === controller) { abort.current = null; setReading(false); } }
  }
  async function undo() {
    if (!done) return;
    setUndoFailed(false);
    if (await f.submit({ type: "undo", operationId: done.operationId }, { quiet: true })) { setDone(null); setStatus("That’s undone. Your kitchen and list are as they were."); }
    else setUndoFailed(true);
  }
  if (connected !== true && !done) return null;
  const pick = (input: HTMLInputElement | null) => { setStatus(""); input?.click(); };
  return <>
    <input ref={camera} hidden type="file" accept="image/jpeg,image/png,image/webp" capture="environment" aria-label="Take a photo of your receipt" onChange={event => { const file = event.target.files?.[0]; if (file) void read(file); event.target.value = ""; }}/>
    <input ref={library} hidden type="file" accept="image/jpeg,image/png,image/webp" aria-label="Choose a photo of your receipt" onChange={event => { const file = event.target.files?.[0]; if (file) void read(file); event.target.value = ""; }}/>
    {done ? <section className="receipt-card is-done" aria-labelledby="receipt-done-title">
      <div className="receipt-intro"><CompanionPortrait id="nori" size={60} decorative/>
        <div role="status"><h2 id="receipt-done-title">{done.count === 1 ? "1 thing put away" : `${done.all ? "All " : ""}${done.count} put away`}</h2><p>{done.ticked.length ? `${capital(list(done.ticked.map(name => name.toLowerCase())))} ${done.ticked.length === 1 ? "is" : "are"} off your list.` : "They’re on your shelves now."}</p></div>
        <button type="button" className="kitchen-round receipt-close" aria-label="Close this message" onClick={() => setDone(null)}><X size={18} aria-hidden/></button></div>
      <ul className="receipt-spots" aria-label="Where they went">{placeIds.filter(id => done.places[id]).map(id => <li key={id}><span>{placeNames[id]}</span><b>{done.places[id]}</b></li>)}</ul>
      <div className="receipt-actions"><button type="button" className="kitchen-primary" onClick={() => f.setView("basket")}>See your kitchen</button>
        <button type="button" className="receipt-secondary" disabled={busy} onClick={() => void undo()}><Undo2 size={18} aria-hidden/>Undo</button></div>
      <SheetError f={f} failed={undoFailed}/>
    </section> : <section className="receipt-card" aria-labelledby="receipt-title">
      <div className="receipt-intro"><CompanionPortrait id="nori" size={60} decorative/><div><h2 id="receipt-title">Back from the shops?</h2><p>Snap the receipt, or the shopping on the counter. Nori puts it all away with you.</p></div></div>
      <button type="button" className="kitchen-primary receipt-snap" disabled={reading || busy} onClick={() => pick(camera.current)}><Camera size={20} aria-hidden/>{reading ? "Reading your receipt…" : "Snap the receipt"}</button>
      {!reading && <button type="button" className="kitchen-quiet receipt-choose" disabled={busy} onClick={() => pick(library.current)}><ImageIcon size={16} aria-hidden/>Choose a photo instead</button>}
      <p className="receipt-note">The photo goes to OpenAI to read it. Daywell doesn’t keep it.</p>
      {reading && <p className="sr-only" role="status">Reading your receipt…</p>}
      {status && <p className="receipt-status" role="status">{status}</p>}
      {error && <p className="kitchen-error" role="alert">{error}</p>}
    </section>}
    {receipt && f.snapshot && <ReceiptReview f={f} receipt={receipt} trolley={items} onClose={() => setReceipt(null)}
      onRetake={() => { setReceipt(null); pick(camera.current); }} onDone={summary => { setReceipt(null); setDone(summary); }}/>}
  </>;
}

// "Here's what I found": each food with where it goes (remembered, so it's usually already right) and, optionally,
// how much. Things that aren't food are left off; a list note for one is still ticked off.
function ReceiptReview({ f, receipt, trolley, onClose, onRetake, onDone }: { f: Food; receipt: Receipt; trolley: TrolleyItem[]; onClose: () => void; onRetake: () => void; onDone: (done: Done) => void }) {
  const state = f.snapshot!.state, foods = receipt.items.filter(item => item.food), others = receipt.items.filter(item => !item.food);
  const matched = useMemo(() => {
    const found = matchList(receipt.items.map(item => item.name), trolley.map(item => item.name));
    return Object.fromEntries(receipt.items.map((item, index) => [item.key, found[index] === null ? null : trolley[found[index]!]])) as Record<string, TrolleyItem | null>;
  }, [receipt, trolley]);
  // A planned meal's need is met only by the same food name, so a matched need keeps the list's name.
  const savedName = (item: ReceiptItem) => matched[item.key] && !matched[item.key]!.noteId ? matched[item.key]!.name : item.name;
  const [amounts, setAmounts] = useState(() => Object.fromEntries(foods.map(item => [item.key, amountWords(item.quantity, item.unit)])));
  const [places, setPlaces] = useState(() => Object.fromEntries(foods.map(item => [item.key, suggestedPlace(savedName(item), item.unit, state.stock, state.places)])) as Record<string, PlaceId>);
  const [left, setLeft] = useState<string[]>([]), [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false), [failed, setFailed] = useState(false), id = useId();
  const parsed = Object.fromEntries(foods.map(item => [item.key, parseAmount(amounts[item.key] ?? "", item.unit)]));
  const kept = foods.filter(item => !left.includes(item.key)), valid = kept.every(item => parsed[item.key] !== null);
  const tickOff = others.flatMap(item => matched[item.key]?.noteId ? [matched[item.key]!.noteId!] : []);
  const ticked = [...kept, ...others.filter(item => matched[item.key]?.noteId)].flatMap(item => matched[item.key] ? [matched[item.key]!.name] : []);
  async function save() {
    setSaving(true); setFailed(false);
    const taken = new Set<string>();
    const bought = kept.map(item => {
      const { quantity, unit } = parsed[item.key]!, name = savedName(item), lot = topUpLot(state.stock, name, quantity, unit, taken), note = matched[item.key]?.noteId;
      if (lot) taken.add(lot.id);
      return { id: lot?.id ?? crypto.randomUUID(), ingredient: name.slice(0, 120), quantity, unit, bestBefore: null, place: places[item.key], ...(note ? { shoppingId: note } : {}) };
    });
    const action: FoodAction = { type: "purchase", items: bought, ...(tickOff.length ? { tickOff } : {}) };
    const operationId = crypto.randomUUID(), done = await f.submit(action, { operationId, quiet: true });
    setSaving(false);
    if (!done) { setFailed(true); return; }
    const counts: Partial<Record<PlaceId, number>> = {};
    for (const item of kept) counts[places[item.key]] = (counts[places[item.key]] ?? 0) + 1;
    onDone({ operationId, count: kept.length, all: kept.length === foods.length, places: counts, ticked });
  }
  const nothing = !receipt.items.length;
  return <Sheet onClose={onClose} steps>
    <div className="receipt-top">
      <button type="button" className="kitchen-round" aria-label="Close" onClick={onClose}><X size={20} aria-hidden/></button>
      <DialogTitle asChild><h2 className="kitchen-step-title">From your receipt</h2></DialogTitle>
      <button type="button" className="receipt-retake" onClick={onRetake}><Camera size={18} aria-hidden/>Retake</button>
    </div>
    <div className="kitchen-steps-body receipt-body">
      <div className="receipt-says"><CompanionPortrait id="nori" size={52} decorative/>
        <p>{nothing ? "I couldn’t find any shopping in that photo. Try again with the whole receipt in view." : foods.length ? `I found ${foods.length} ${foods.length === 1 ? "food" : "foods"}. Check where each one goes, or tap a food to change it.` : "I didn’t find any food on this receipt."}</p></div>
      {foods.length > 0 && <ul className="receipt-list" aria-label="Foods to put away">{foods.map(item => {
        const out = left.includes(item.key), open = editing === item.key, amountId = `${id}-${item.key}`, on = matched[item.key];
        return <li key={item.key} className={`receipt-row${out ? " is-out" : ""}`}>
          <div className="receipt-line">
            <FoodFace lot={{ ingredient: item.name, unit: item.unit }} size={20} className="is-receipt"/>
            <button type="button" className="receipt-name" aria-expanded={open} onClick={() => setEditing(open ? null : item.key)}>
              <strong>{item.name}</strong>
              <span>{out ? "Left out" : <span className="receipt-amount">{amounts[item.key]?.trim()}</span>}{!out && on && <>{amounts[item.key]?.trim() ? " · " : ""}<b className="receipt-on"><Check size={13} aria-hidden/>on your list</b></>}</span>
            </button>
            {out ? <button type="button" className="receipt-back" onClick={() => setLeft(left.filter(key => key !== item.key))}>Put it back</button>
              : <label className="receipt-place"><span className="sr-only">Where {item.name} goes</span>
                <select value={places[item.key]} onChange={event => setPlaces({ ...places, [item.key]: event.target.value as PlaceId })}>{placeIds.map(place => <option key={place} value={place}>{placeNames[place]}</option>)}</select>
                <ChevronDown size={16} aria-hidden/></label>}
          </div>
          {open && !out && <div className="receipt-edit">
            <label htmlFor={amountId}>How much (optional)</label>
            <input id={amountId} inputMode="text" autoComplete="off" placeholder="Like 2, 500 g or 1 l" value={amounts[item.key] ?? ""} aria-invalid={parsed[item.key] === null || undefined} aria-describedby={parsed[item.key] === null ? `${amountId}-help` : undefined} onChange={event => setAmounts({ ...amounts, [item.key]: event.target.value })}/>
            {parsed[item.key] === null && <p className="kitchen-error" id={`${amountId}-help`}>Use a number, like 2, 500 g or 1 l. Or leave it blank.</p>}
            <button type="button" className="receipt-leave" onClick={() => { setLeft([...left, item.key]); setEditing(null); }}>Leave it out</button>
          </div>}
        </li>;
      })}</ul>}
      {(others.length > 0 || receipt.unreadable > 0) && <section className="receipt-skipped" aria-label="Not added">
        {others.length > 0 && <p><CircleSlash size={18} aria-hidden/><span>Left off: {list(others.map(item => item.name.toLowerCase()))}. {others.length === 1 ? "It isn’t" : "They aren’t"} food{tickOff.length ? `, but ${tickOff.length === 1 ? "it’s" : "they’re"} ticked off your list` : ""}.</span></p>}
        {receipt.unreadable > 0 && <p><ScanText size={18} aria-hidden/><span>{receipt.unreadable === 1 ? "1 line was" : `${receipt.unreadable} lines were`} too faint to read.</span>
          <button type="button" className="receipt-hand" onClick={() => { onClose(); addFoodByHand(); }}>Add by hand</button></p>}
      </section>}
      <SheetError f={f} failed={failed}/>
    </div>
    <div className="kitchen-steps-foot">
      {nothing ? <button type="button" className="kitchen-primary" onClick={onRetake}><Camera size={20} aria-hidden/>Try another photo</button>
        : <button type="button" className="kitchen-primary" disabled={saving || !valid || (!kept.length && !tickOff.length) || f.busy || !!f.pending || !!f.draft} onClick={() => void save()}><Check size={20} aria-hidden/>{saving ? "Saving…" : kept.length ? `Put ${kept.length} away` : "Tick them off"}</button>}
      {!nothing && ticked.length > 0 && <p className="receipt-foot-note">{kept.length ? "Also ticks" : "Ticks"} {ticked.length} {ticked.length === 1 ? "thing" : "things"} off your trolley list.</p>}
    </div>
  </Sheet>;
}
