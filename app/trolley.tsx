"use client";
import { useEffect, useId, useState } from "react";
import { CalendarDays, Check, Plus, ShoppingCart, StickyNote, X } from "lucide-react";
import { DialogTitle } from "@/components/ui/dialog";
import type { Shopping as Note } from "@/lib/food";
import type { FoodAction } from "@/lib/food-client";
import { placeIds, placeNames, suggestedPlace, type PlaceId } from "@/lib/food-places";
import { readTrolley, writeTrolley } from "@/lib/food-recovery";
import { amountWords, parseAmount, topUpLot, trolleyItems, type TrolleyItem } from "@/lib/food-trolley";
import { aisleOf, aisleRank } from "./food-look";
import { capital, FoodFace, placeIcons, Sheet, SheetError } from "./kitchen";
import type { AppState } from "./use-daywell";

// The Trolley (owner-approved Kitchen design, part 2, 20 October 2026): what to get, by aisle; a tray for what's been
// picked up while shopping; and putting it all away on the shelves in one save, with Undo.
type Food = AppState["food"];

function useTray(scope: string | null) {
  const [tray, setTray] = useState<string[]>(() => {
    try { return scope && typeof window !== "undefined" ? readTrolley(localStorage, scope) : []; } catch { return []; }
  });
  useEffect(() => { try { if (scope) writeTrolley(localStorage, scope, tray); } catch { /* The tray still works for this visit. */ } }, [scope, tray]);
  return [tray, setTray] as const;
}

function itemLine(item: TrolleyItem) {
  if (item.noteId) return [item.noteQuantity, "Your note"].filter(Boolean).join(" · ");
  if (item.needsCheck) return "You have some. Check it’s enough";
  const meals = item.forMeals.length > 1 ? `For ${item.forMeals.length} meals` : item.forMeals.length ? `For ${item.forMeals[0].toLowerCase()}` : "For your planned meals";
  return [meals, amountWords(item.quantity, item.unit)].filter(Boolean).join(" · ");
}

export function TrolleyPlace({ f, onPutAway }: { f: Food; onPutAway: (shelved: boolean) => void }) {
  const state = f.snapshot!.state, overview = f.snapshot!.overview;
  const [tray, setTray] = useTray(f.scope), [putting, setPutting] = useState(false), [note, setNote] = useState<Note | null>(null);
  const [text, setText] = useState(""), [adding, setAdding] = useState(false), addId = useId();
  const items = trolleyItems(state, overview), picked = tray.flatMap(key => items.filter(item => item.key === key));
  const left = items.filter(item => !tray.includes(item.key)), ticked = state.shopping.filter(row => row.done);
  const groups = [...new Map(left.map(item => [aisleOf(item.name, item.unit).id, aisleOf(item.name, item.unit)])).values()]
    .sort((x, y) => aisleRank(x) - aisleRank(y)).map(aisle => ({ aisle, items: left.filter(item => aisleOf(item.name, item.unit).id === aisle.id) }));
  const busy = f.busy || !!f.pending || !!f.draft;
  async function add(event: React.FormEvent) {
    event.preventDefault();
    const title = text.trim();
    if (!title) return;
    setAdding(true);
    if (await f.submit({ type: "shopping.add", items: [{ id: crypto.randomUUID(), title: title.slice(0, 160), quantity: "", done: false }] })) setText("");
    setAdding(false);
  }
  return <div className={`trolley-place${picked.length ? " has-tray" : ""}`}>
    <div className="trolley-head"><h1 className="kitchen-title">Your trolley</h1><span>{left.length ? `${left.length} left to get` : picked.length ? "All in the trolley" : ""}</span></div>
    <form className="trolley-add" onSubmit={event => void add(event)}>
      <label htmlFor={addId} className="sr-only">Add something to get</label>
      <input id={addId} maxLength={160} autoComplete="off" value={text} placeholder="Add something…" onChange={event => setText(event.target.value)}/>
      <button type="submit" className="kitchen-round is-accent" aria-label="Add to the trolley list" disabled={!text.trim() || adding || busy}><Plus size={22} aria-hidden/></button>
    </form>
    {!items.length && <div className="kitchen-empty"><span className="kitchen-empty-icon" aria-hidden><ShoppingCart size={34}/></span><h2>Nothing to get</h2><p>Plan a meal on your week and anything missing appears here. You can add anything else above.</p></div>}
    {groups.map(({ aisle, items: here }) => <section className="trolley-group" key={aisle.id} aria-label={aisle.name}>
      <h2>{aisle.name}</h2>
      <ul>{here.map(item => <li key={item.key} className="trolley-row">
        <FoodFace lot={{ ingredient: item.name, unit: item.unit }} size={22} className="is-row"/>
        {item.noteId ? <button type="button" className="trolley-text" aria-label={`${capital(item.name)}: change or remove this note`} onClick={() => setNote(state.shopping.find(row => row.id === item.noteId) ?? null)}>
          <strong>{capital(item.name)}</strong><span><StickyNote size={14} aria-hidden/>{itemLine(item)}</span></button>
          : <div className="trolley-text"><strong>{capital(item.name)}</strong><span>{item.needsCheck ? null : <CalendarDays size={14} aria-hidden/>}{itemLine(item)}</span></div>}
        <button type="button" className="trolley-pick" aria-label={`Into the trolley: ${item.name}`} onClick={() => setTray([...tray, item.key])}/>
      </li>)}</ul>
    </section>)}
    {ticked.length > 0 && <details className="trolley-ticked"><summary>Ticked off ({ticked.length})</summary><ul>{ticked.map(row => <li key={row.id}><span>{capital(row.title)}</span>
      <button type="button" className="well-text-button" disabled={busy} onClick={() => void f.submit({ type: "shopping.remove", id: row.id })}>Remove</button></li>)}</ul></details>}
    {picked.length > 0 && <section className="trolley-tray" aria-labelledby="trolley-tray-title">
      <div className="trolley-tray-head"><h2 id="trolley-tray-title"><ShoppingCart size={18} aria-hidden/>In your trolley · {picked.length}</h2>
        <button type="button" disabled={busy} onClick={() => setPutting(true)}>Put it all away</button></div>
      <ul>{picked.map(item => <li key={item.key}><button type="button" aria-label={`Take ${item.name} out of the trolley`} onClick={() => setTray(tray.filter(key => key !== item.key))}>
        <FoodFace lot={{ ingredient: item.name, unit: item.unit }} size={20} className="is-tray"/><span>{capital(item.name)}</span></button></li>)}</ul>
    </section>}
    {putting && <PutAway f={f} items={picked} onClose={() => setPutting(false)} onDone={shelved => { setTray([]); setPutting(false); onPutAway(shelved); }}/>}
    {note && <NoteSheet f={f} note={note} onClose={() => setNote(null)}/>}
  </div>;
}

// Put it away: where each thing goes (remembered, so it's usually already chosen) and, optionally, how much.
function PutAway({ f, items, onClose, onDone }: { f: Food; items: TrolleyItem[]; onClose: () => void; onDone: (shelved: boolean) => void }) {
  const state = f.snapshot!.state, food = items.filter(item => !item.household), household = items.filter(item => item.household);
  const [amounts, setAmounts] = useState(() => Object.fromEntries(food.map(item => [item.key, amountWords(item.quantity, item.unit)])));
  const [places, setPlaces] = useState(() => Object.fromEntries(food.map(item => [item.key, suggestedPlace(item.name, item.unit, state.stock, state.places)])) as Record<string, PlaceId>);
  const [saving, setSaving] = useState(false), [failed, setFailed] = useState(false);
  const parsed = Object.fromEntries(food.map(item => [item.key, parseAmount(amounts[item.key] ?? "", item.unit)]));
  const valid = food.every(item => parsed[item.key] !== null);
  async function save() {
    setSaving(true); setFailed(false);
    const taken = new Set<string>();
    const bought = food.map(item => {
      const { quantity, unit } = parsed[item.key]!, lot = topUpLot(state.stock, item.name, quantity, unit, taken);
      if (lot) taken.add(lot.id);
      return { id: lot?.id ?? crypto.randomUUID(), ingredient: item.name.slice(0, 120), quantity, unit, bestBefore: null, place: places[item.key], ...(item.noteId ? { shoppingId: item.noteId } : {}) };
    });
    const tickOff = household.flatMap(item => item.noteId ? [item.noteId] : []);
    const action: FoodAction = { type: "purchase", items: bought, ...(tickOff.length ? { tickOff } : {}) };
    const done = await f.submit(action);
    setSaving(false); if (done) onDone(bought.length > 0); else setFailed(true);
  }
  return <Sheet onClose={onClose} steps>
    <div className="putaway-top">
      <button type="button" className="kitchen-round" aria-label="Close" onClick={onClose}><X size={20} aria-hidden/></button>
      <div><DialogTitle asChild><h2 className="kitchen-step-title">Put it away</h2></DialogTitle><p>Check where each thing goes. How much is optional.</p></div>
    </div>
    <div className="kitchen-steps-body putaway-list">
      {food.map(item => { const amountId = `amount-${item.key}`; return <section className="putaway-card" key={item.key} aria-label={capital(item.name)}>
        <div className="putaway-card-head"><FoodFace lot={{ ingredient: item.name, unit: item.unit }} size={22} className="is-mid"/><strong>{capital(item.name)}</strong>
          <label htmlFor={amountId} className="sr-only">How much {item.name}</label>
          <input id={amountId} className="putaway-amount" inputMode="text" autoComplete="off" placeholder="How much?" value={amounts[item.key] ?? ""} aria-invalid={parsed[item.key] === null || undefined} aria-describedby={parsed[item.key] === null ? `${amountId}-help` : undefined} onChange={event => setAmounts({ ...amounts, [item.key]: event.target.value })}/></div>
        {parsed[item.key] === null && <p className="kitchen-error" id={`${amountId}-help`}>Use a number, like 2, 500 g or 1 l. Or leave it blank.</p>}
        <div className="putaway-places" role="group" aria-label={`Where ${item.name} goes`}>{placeIds.map(id => { const Icon = placeIcons[id]; return <button key={id} type="button" aria-pressed={places[item.key] === id} onClick={() => setPlaces({ ...places, [item.key]: id })}><Icon size={18} aria-hidden/>{placeNames[id]}</button>; })}</div>
      </section>; })}
      {household.length > 0 && <section className="putaway-card is-household" aria-label="Not for the kitchen"><p><Check size={16} aria-hidden/>{household.map(item => capital(item.name)).join(", ")} {household.length === 1 ? "isn’t" : "aren’t"} food, so {household.length === 1 ? "it’s" : "they’re"} just ticked off.</p></section>}
      <p className="putaway-note">Daywell remembers where you put things, so next time it’s already chosen.</p>
      <SheetError f={f} failed={failed}/>
    </div>
    <div className="kitchen-steps-foot"><button type="button" className="kitchen-primary" disabled={saving || !valid || !items.length || f.busy || !!f.pending || !!f.draft} onClick={() => void save()}><Check size={20} aria-hidden/>{saving ? "Saving…" : `Put ${items.length} ${items.length === 1 ? "thing" : "things"} away`}</button></div>
  </Sheet>;
}

// A note on the list: change its words, or take it off.
function NoteSheet({ f, note, onClose }: { f: Food; note: Note; onClose: () => void }) {
  const [title, setTitle] = useState(note.title), [quantity, setQuantity] = useState(note.quantity), [failed, setFailed] = useState(false);
  const titleId = useId(), quantityId = useId(), busy = f.busy || !!f.pending || !!f.draft;
  async function run(action: FoodAction) { setFailed(false); if (await f.submit(action)) onClose(); else setFailed(true); }
  return <Sheet onClose={onClose}>
    <div className="kitchen-grip" aria-hidden/>
    <button type="button" className="kitchen-round kitchen-close" aria-label="Close" onClick={onClose}><X size={20} aria-hidden/></button>
    <DialogTitle asChild><h2 className="note-title">Your note</h2></DialogTitle>
    <div className="note-fields">
      <label htmlFor={titleId}>What to get</label><input id={titleId} maxLength={160} value={title} onChange={event => setTitle(event.target.value)}/>
      <label htmlFor={quantityId}>How much (optional)</label><input id={quantityId} maxLength={80} value={quantity} placeholder="e.g. 2, or 500 g" onChange={event => setQuantity(event.target.value)}/>
    </div>
    <SheetError f={f} failed={failed}/>
    <button type="button" className="kitchen-primary" disabled={busy || !title.trim()} onClick={() => void run({ type: "shopping.set", item: { id: note.id, title: title.trim(), quantity: quantity.trim(), done: note.done } })}>Save</button>
    <button type="button" className="kitchen-quiet" disabled={busy} onClick={() => void run({ type: "shopping.remove", id: note.id })}>Take it off the list</button>
  </Sheet>;
}
