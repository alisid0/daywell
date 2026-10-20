"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Apple, ArrowRight, CalendarDays, Camera, Check, ChefHat, ChevronLeft, Clock, Minus, Package, Pencil, Plus, Refrigerator, Search, ShoppingCart, Snowflake, Utensils, X, type LucideIcon } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { today } from "@/lib/daywell";
import { ingredientName, type Stock } from "@/lib/food";
import type { FoodAction } from "@/lib/food-client";
import { placeIds, placeNames, placeOf, suggestedPlace, usualUnit, type PlaceId } from "@/lib/food-places";
import { newFromShop } from "@/lib/food-trolley";
import { aisleOf, aisleRank, foodLook, quantityText, reminder, unitText } from "./food-look";
import { useRecipesConnected } from "./recipe-ideas";
import type { AppState } from "./use-daywell";

// The Kitchen (owner-approved design, 19 October 2026): food on the shelves where it lives, a card for each food with
// a few big actions, and adding food in three steps. Each of these saves straight away; the notice offers Undo.
type Food = AppState["food"];
type InputUnit = Extract<FoodAction, { type: "stock.set" }>["item"]["unit"];
export const placeIcons: Record<PlaceId, LucideIcon> = { fridge: Refrigerator, freezer: Snowflake, cupboard: Package, fruit: Apple };
const units: [InputUnit, string][] = [["g", "g"], ["kg", "kg"], ["ml", "ml"], ["l", "l"], ["each", "items"], ["portion", "portions"]];
const commonFoods = ["Milk", "Eggs", "Bread", "Rice", "Pasta", "Spinach", "Tomatoes", "Apples", "Yoghurt"];
const portions: [string, number][] = [["A little", 0.25], ["Half", 0.5], ["All of it", 1]];
export const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const round = (value: number) => Math.round(value * 1000) / 1000;
const amountText = (quantity: number | null, unit: string) => quantity === null ? "" : `${quantityText(quantity)} ${unitText(unit, quantity)}`;
const daysUntil = (date: string) => Math.round((Date.parse(`${date}T12:00:00Z`) - Date.parse(`${today()}T12:00:00Z`)) / 864e5);
// Use soon: a reminder date within three days, or one that has passed. A pack date is a reminder, never a safety
// check, so the words stay plain.
const soonState = (lot: Stock) => { const state = lot.bestBefore ? reminder(lot.bestBefore, today()).state : "later"; return state === "later" ? null : state; };
function whenText(date: string, inSentence = false) {
  const days = daysUntil(date), word = days < 0 ? "Check it" : days === 0 ? "Today" : days === 1 ? "Tomorrow" : "";
  if (word) return inSentence ? word.toLowerCase() : word;
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" });
}
const list = (words: string[]) => words.length < 2 ? words.join("") : `${words.slice(0, -1).join(", ")} and ${words.at(-1)}`;
const ringClass = (lot: Stock) => { const state = soonState(lot); return state === "past" ? " is-past" : state ? " is-soon" : ""; };
function describe(lot: Stock) {
  const soon = soonState(lot);
  return [capital(lot.ingredient), amountText(lot.quantity, lot.unit), soon === "past" ? "reminder date passed, check it" : soon ? `use soon: ${whenText(lot.bestBefore!, true)}` : ""].filter(Boolean).join(", ");
}

// "Cook ideas" and "Cook with it" open the recipe ideas card (app/recipe-ideas.tsx) with a wish filled in. Nothing is
// sent until the person asks.
export function askForIdeas(wish: string) { window.dispatchEvent(new CustomEvent("daywell-recipe-ideas", { detail: { wish } })); }
// "Add by hand" from anywhere opens the three steps, now or as soon as Eat opens.
let addWaiting = false;
export function addFoodByHand() { addWaiting = true; window.dispatchEvent(new Event("daywell-add-food")); }
export function useAddFoodByHand(open: () => void) {
  const latest = useRef(open);
  useEffect(() => { latest.current = open; });
  useEffect(() => {
    const take = () => { if (!addWaiting) return; addWaiting = false; latest.current(); };
    take();
    window.addEventListener("daywell-add-food", take);
    return () => window.removeEventListener("daywell-add-food", take);
  }, []);
}

// The four places of Eat, in place of the old tabs. Your meal story belongs to the Plate.
export function PlaceBar({ f }: { f: Food }) {
  const state = f.snapshot?.state, overview = f.snapshot?.overview;
  const toGet = !state || !overview ? 0 : overview.toBuy.length + state.shopping.filter(note => !note.done).length;
  const places: [string, string, LucideIcon][] = [["plate", "Plate", Utensils], ["basket", "Kitchen", Refrigerator], ["meals", "Week", CalendarDays], ["shopping", "Trolley", ShoppingCart]];
  return <nav className="kitchen-places" aria-label="Eat">{places.map(([id, label, Icon]) => {
    const current = f.view === id || (id === "plate" && f.view === "history");
    return <button key={id} type="button" aria-current={current ? "page" : undefined} aria-label={id === "shopping" && toGet ? `${label}, ${toGet} to get` : undefined} onClick={() => f.setView(id)}>
      <Icon size={22} aria-hidden/>{label}{id === "shopping" && toGet > 0 && <span className="kitchen-badge" aria-hidden>{toGet}</span>}
    </button>;
  })}</nav>;
}

// The notice after a save: a toast above the bottom bar (as designed), with Undo when the change can be undone. It
// stays for 12 seconds, longer while it's being used, and comes back with the next save. A notice from before Eat
// opened again isn't shown.
export function KitchenNotice({ f }: { f: Food }) {
  const [last, setLast] = useState(f.notice), [open, setOpen] = useState(false), [held, setHeld] = useState(false);
  if (f.notice !== last) { setLast(f.notice); setOpen(!!f.notice); }
  useEffect(() => {
    if (!open || held) return;
    const timer = window.setTimeout(() => setOpen(false), 12_000);
    return () => window.clearTimeout(timer);
  }, [open, held, last]);
  return <div className="kitchen-toast-region" aria-live="polite">{open && f.notice && <div className="kitchen-toast" onFocus={() => setHeld(true)} onBlur={() => setHeld(false)} onPointerEnter={() => setHeld(true)} onPointerLeave={() => setHeld(false)}>
    <Check size={18} aria-hidden/><span>{f.notice}</span>
    {f.undoable && <button type="button" disabled={f.busy || !!f.pending || !!f.draft} onClick={() => void f.submit({ type: "undo", operationId: f.undoable! })}>Undo</button>}
    <button type="button" className="kitchen-toast-close" aria-label="Close this message" onClick={() => setOpen(false)}><X size={16} aria-hidden/></button>
  </div>}</div>;
}

export function FoodFace({ lot, size, className = "" }: { lot: { ingredient: string; unit?: string }; size: number; className?: string }) {
  const { Icon, tone } = foodLook(lot.ingredient, lot.unit);
  return <span className={`kitchen-face food-tone-${tone} ${className}`} aria-hidden><Icon size={size}/></span>;
}

// Your food on its shelves, by where it lives. Food with nothing left leaves the shelf.
export function KitchenShelves({ f, onOpen, onAdd }: { f: Food; onOpen: (lot: Stock) => void; onAdd: (place?: PlaceId) => void }) {
  const [finding, setFinding] = useState(false), [query, setQuery] = useState(""), findId = useId();
  const ideas = useRecipesConnected();
  const lots = f.snapshot!.state.stock.filter(lot => lot.quantity !== 0), fresh = newFromShop(f.snapshot!.state, f.snapshot!.recentActions);
  const shown = lots.filter(lot => !query.trim() || ingredientName(lot.ingredient).includes(ingredientName(query)));
  const soon = lots.filter(lot => soonState(lot)).sort((a, b) => a.bestBefore!.localeCompare(b.bestBefore!));
  const order = (a: Stock, b: Stock) => Number(!!soonState(b)) - Number(!!soonState(a)) || (a.bestBefore ?? "9999").localeCompare(b.bestBefore ?? "9999")
    || aisleRank(aisleOf(a.ingredient, a.unit)) - aisleRank(aisleOf(b.ingredient, b.unit)) || a.ingredient.localeCompare(b.ingredient);
  return <>
    <div className="kitchen-head">
      <div className="kitchen-head-title"><h1>Your kitchen</h1>{lots.length > 0 && <span className="kitchen-count">{lots.length} {lots.length === 1 ? "thing" : "things"}</span>}</div>
      {lots.length > 0 && <button type="button" className="kitchen-round" aria-label="Find food" aria-expanded={finding} onClick={() => { setFinding(!finding); setQuery(""); }}><Search size={20} aria-hidden/></button>}
      <button type="button" className="kitchen-round is-accent" aria-label="Add food" onClick={() => onAdd()}><Plus size={22} aria-hidden/></button>
    </div>
    {finding && <div className="kitchen-find"><Search size={18} aria-hidden/><label className="sr-only" htmlFor={findId}>Find food</label><input id={findId} type="search" autoFocus maxLength={120} value={query} placeholder="Find food" onChange={event => setQuery(event.target.value)}/></div>}
    {soon.length > 0 && !query && <div className="kitchen-soon"><Clock size={18} aria-hidden/><span>{soon.length} {soon.length === 1 ? "thing" : "things"} to use soon</span>
      {ideas && <button type="button" onClick={() => askForIdeas(`Use up ${list(soon.slice(0, 3).map(lot => lot.ingredient))}`)}><ChefHat size={16} aria-hidden/>Cook ideas</button>}</div>}
    {!lots.length ? <div className="kitchen-empty"><span className="kitchen-empty-icon" aria-hidden><Refrigerator size={34}/></span><h2>Your kitchen is empty</h2><p>Add what’s in your fridge and cupboards, one thing at a time. A quantity is optional.</p><button type="button" className="well-button" onClick={() => onAdd()}><Plus size={18} aria-hidden/>Add food</button></div>
      : placeIds.map(place => {
        const Icon = placeIcons[place], here = shown.filter(lot => placeOf(lot) === place).sort(order);
        if (!here.length) return null;
        return <section className="kitchen-shelf-group" key={place} aria-labelledby={`shelf-${place}`}>
          <h2 id={`shelf-${place}`}><Icon size={18} aria-hidden/>{placeNames[place]}<span className="kitchen-count">{here.length}</span></h2>
          <div className="kitchen-shelf"><ul>
            {here.map(lot => { const soonNow = soonState(lot); return <li key={lot.id}>
              <button type="button" className="kitchen-token" aria-label={`${describe(lot)}${fresh.has(lot.id) ? ", new" : ""}`} onClick={() => onOpen(lot)}>{fresh.has(lot.id) && <span className="kitchen-new" aria-hidden>New</span>}<FoodFace lot={lot} size={28} className={ringClass(lot).trim()}/>
                <span className="kitchen-name">{capital(lot.ingredient)}</span>
                {soonNow ? <span className={`kitchen-when${soonNow === "past" ? " is-past" : ""}`}>{whenText(lot.bestBefore!)}</span> : lot.quantity !== null && <span className="kitchen-qty">{amountText(lot.quantity, lot.unit)}</span>}</button>
            </li>; })}
            {!query && <li><button type="button" className="kitchen-token" aria-label={`Add to the ${placeNames[place].toLowerCase()}`} onClick={() => onAdd(place)}><span className="kitchen-face is-add" aria-hidden><Plus size={26}/></span><span className="kitchen-name is-add">Add</span></button></li>}
          </ul><div className="kitchen-plank" aria-hidden/></div>
        </section>;
      })}
    {query && !shown.length && <p className="well-empty">Nothing called “{query}” in your kitchen.</p>}
  </>;
}

export function Sheet({ onClose, children, steps = false }: { onClose: () => void; children: ReactNode; steps?: boolean }) {
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className={steps ? "kitchen-steps" : "kitchen-sheet"} showCloseButton={false} aria-describedby={undefined}>{children}</DialogContent>
  </Dialog>;
}
// A save that didn't go through leaves the change open on the page (the editor), where it can be reviewed.
export function SheetError({ f, failed }: { f: Food; failed: boolean }) {
  return failed && f.error ? <p className="kitchen-error" role="alert">{f.error}{f.draft && " Your change is kept on the page, so you can review it there."}</p> : null;
}

// One food's card: what it is, where it lives, and the big things you can do with it.
export function FoodCard({ lot, f, onClose, onAte, onChange }: { lot: Stock; f: Food; onClose: () => void; onAte: () => void; onChange: () => void }) {
  const [moving, setMoving] = useState(false), [failed, setFailed] = useState(false);
  const ideas = useRecipesConnected();
  const place = placeOf(lot), PlaceIcon = placeIcons[place], soon = soonState(lot);
  const busy = f.busy || !!f.pending || !!f.draft;
  async function run(action: FoodAction) { setFailed(false); if (await f.submit(action)) onClose(); else setFailed(true); }
  return <Sheet onClose={onClose}>
    <div className="kitchen-grip" aria-hidden/>
    <button type="button" className="kitchen-round kitchen-close" aria-label="Close" onClick={onClose}><X size={20} aria-hidden/></button>
    <div className="kitchen-card-head">
      <FoodFace lot={lot} size={40} className={`is-big${ringClass(lot)}`}/>
      <div><DialogTitle asChild><h2>{capital(lot.ingredient)}</h2></DialogTitle>{lot.quantity !== null && <p className="kitchen-card-qty">{amountText(lot.quantity, lot.unit)}</p>}
        {lot.bestBefore && <span className={`kitchen-chip${soon === "past" ? " is-past" : soon ? " is-soon" : ""}`}><Clock size={13} aria-hidden/>{soon === "past" ? "Reminder date passed · check it" : soon ? `Use soon · ${whenText(lot.bestBefore, true)}` : reminder(lot.bestBefore, today()).text}</span>}</div>
    </div>
    <div className="kitchen-lives"><PlaceIcon size={18} aria-hidden/><span>Lives in the {placeNames[place].toLowerCase()}</span><button type="button" aria-expanded={moving} onClick={() => setMoving(!moving)}>Move</button></div>
    {moving && <div className="kitchen-move" role="group" aria-label={`Move ${lot.ingredient} to`}>{placeIds.filter(id => id !== place).map(id => { const MoveIcon = placeIcons[id]; return <button key={id} type="button" disabled={busy} onClick={() => void run({ type: "stock.set", item: { id: lot.id, ingredient: lot.ingredient, quantity: lot.quantity, unit: lot.unit, bestBefore: lot.bestBefore, place: id } })}><MoveIcon size={18} aria-hidden/>{placeNames[id]}</button>; })}</div>}
    <SheetError f={f} failed={failed}/>
    <div className="kitchen-actions">
      <button type="button" disabled={busy} onClick={onAte}><span aria-hidden><Utensils size={22}/></span>I ate some</button>
      <button type="button" disabled={busy} onClick={() => void run({ type: "stock.remove", id: lot.id })}><span aria-hidden><Check size={22}/></span>Used it up</button>
      {ideas ? <button type="button" className="is-accent" onClick={() => { onClose(); askForIdeas(`Something with ${lot.ingredient}`); }}><span aria-hidden><ChefHat size={22}/></span>Cook with it</button>
        : <button type="button" className="is-accent" onClick={() => { onClose(); f.setView("meals"); }}><span aria-hidden><CalendarDays size={22}/></span>Plan a meal</button>}
      <button type="button" disabled={busy} onClick={onChange}><span aria-hidden><Pencil size={22}/></span>Change</button>
    </div>
    <button type="button" className="kitchen-quiet" disabled={busy} onClick={() => void run({ type: "stock.remove", id: lot.id })}>Take it out of my kitchen</button>
  </Sheet>;
}

// "I ate some": how much, in big steps. Food without a quantity can still go on today's plate.
export function AteSome({ lot, a, onClose, onBack }: { lot: Stock; a: AppState; onClose: () => void; onBack: () => void }) {
  const f = a.food, known = lot.quantity;
  const step = lot.unit === "g" || lot.unit === "ml" ? (known !== null && known <= 100 ? 5 : known !== null && known <= 1000 ? 25 : 50) : lot.unit === "portion" ? 0.5 : 1;
  const nice = (value: number) => known === null ? 0 : Math.min(known, Math.max(step, round(Math.round(value / step) * step)));
  const [amount, setAmount] = useState(() => nice((known ?? 0) / 2)), [plate, setPlate] = useState(true);
  const [saving, setSaving] = useState(false), [failed, setFailed] = useState(false);
  const row = f.snapshot?.overview.inventory.find(item => item.ingredient === lot.ingredient && item.unit === lot.unit);
  const intoReserved = !!row && row.reserved > 0 && amount > row.available;
  const busy = saving || f.busy || !!f.pending || !!f.draft;
  // The same amount twice keeps the larger label: half of 1 egg is "All of it".
  const choices = known === null ? [] : [...new Map(portions.map(([label, part]): [number, string] => [nice(known * part), label])).entries()];
  async function noteOnPlate() {
    setSaving(true);
    const done = await a.save([{ id: crypto.randomUUID(), kind: "food", data: { title: capital(lot.ingredient), date: today(), meal: "Snack", calories: 0, protein: 0, carbs: 0, fat: 0, nutritionKnown: false, macrosKnown: false, foodStatus: "eaten", portions: 1 } }], "On today’s plate");
    setSaving(false); if (done) onClose();
  }
  async function eat() {
    setSaving(true); setFailed(false);
    const done = await f.submit({ type: "use", title: capital(lot.ingredient), date: today(), meal: "Snack", consumed: [{ stockId: lot.id, quantity: amount, unit: lot.unit }], useReservedStock: intoReserved, ...(plate ? { intake: { portions: 1 } } : {}) });
    setSaving(false); if (done) onClose(); else setFailed(true);
  }
  async function usedUp() {
    setSaving(true); setFailed(false);
    const done = await f.submit({ type: "stock.remove", id: lot.id });
    setSaving(false); if (done) onClose(); else setFailed(true);
  }
  return <Sheet onClose={onClose}>
    <div className="kitchen-grip" aria-hidden/>
    <div className="kitchen-ate-head">
      <button type="button" className="kitchen-round" aria-label="Back" onClick={onBack}><ChevronLeft size={20} aria-hidden/></button>
      <FoodFace lot={lot} size={24} className="is-mid"/>
      <div><DialogTitle asChild><h2>{known === null ? `Ate some ${lot.ingredient}?` : `How much ${lot.ingredient}?`}</h2></DialogTitle><p>{known === null ? "It has no quantity, so your kitchen stays as it is." : `You have ${amountText(known, lot.unit)}.`}</p></div>
    </div>
    {known !== null && <>
      <div className="kitchen-quick" role="group" aria-label="Quick amounts">{choices.map(([value, label]) => <button key={label} type="button" aria-pressed={amount === value} onClick={() => setAmount(value)}>{label}<span>{amountText(value, lot.unit)}</span></button>)}</div>
      <div className="kitchen-stepper">
        <button type="button" aria-label="Less" disabled={amount <= Math.min(step, known)} onClick={() => setAmount(nice(amount - step))}><Minus size={24} aria-hidden/></button>
        <output aria-live="polite">{amountText(amount, lot.unit)}</output>
        <button type="button" aria-label="More" disabled={amount >= known} onClick={() => setAmount(nice(amount + step))}><Plus size={24} aria-hidden/></button>
      </div>
      {intoReserved && <p className="kitchen-note">Some of this is set aside for your planned meals. Using it puts what’s missing on your trolley list.</p>}
      <label className="kitchen-check"><input type="checkbox" checked={plate} onChange={event => setPlate(event.target.checked)}/>Put it on today’s plate as a snack</label>
    </>}
    <SheetError f={f} failed={failed}/>
    {known !== null ? <>
      <button type="button" className="kitchen-primary" disabled={busy || amount <= 0} onClick={() => void eat()}>{saving ? "Saving…" : "Done"}</button>
      {plate && <button type="button" className="kitchen-quiet" disabled={busy} onClick={() => void noteOnPlate()}>Don’t count it, just note it</button>}
    </> : <>
      <button type="button" className="kitchen-primary" disabled={busy} onClick={() => void noteOnPlate()}>{saving ? "Saving…" : "Put it on today’s plate"}</button>
      <button type="button" className="kitchen-quiet" disabled={busy} onClick={() => void usedUp()}>It’s all gone: take it out of my kitchen</button>
    </>}
  </Sheet>;
}

// Adding (or changing) food in three big steps: what it is, how much (optional), and where it lives.
export function AddFood({ edit, place: startPlace, f, onClose }: { edit?: Stock; place?: PlaceId; f: Food; onClose: () => void }) {
  const stock = f.snapshot?.state.stock ?? [];
  const [stepNo, setStep] = useState(1), [name, setName] = useState(edit ? capital(edit.ingredient) : "");
  const [quantity, setQuantity] = useState<number | null>(edit?.quantity ?? null), [typed, setTyped] = useState(edit?.quantity == null ? "" : String(edit.quantity));
  const [unit, setUnit] = useState<InputUnit>(edit?.unit ?? "g"), [place, setPlace] = useState<PlaceId>(edit ? placeOf(edit) : startPlace ?? "cupboard");
  const [placeChosen, setPlaceChosen] = useState(!!edit || !!startPlace), [remind, setRemind] = useState(edit?.bestBefore ?? "");
  const [saving, setSaving] = useState(false), [failed, setFailed] = useState(false), nameId = useId(), amountId = useId();
  const recent = [...new Set([...stock].reverse().map(lot => capital(lot.ingredient)))];
  // The person's own foods first, under their own names, then everyday ones.
  const tiles = [...[...recent, ...commonFoods].reduce((named, food) => named.has(ingredientName(food)) ? named : named.set(ingredientName(food), food), new Map<string, string>()).values()].slice(0, 9);
  const step = unit === "g" || unit === "ml" ? 50 : unit === "kg" || unit === "l" ? 0.5 : 1, start = unit === "g" || unit === "ml" ? 100 : 1;
  const clean = name.trim(), valid = quantity === null || (quantity > 0 && quantity <= 1_000_000);
  const places = f.snapshot?.state.places, usual = suggestedPlace(clean || "food", unit, stock, places);
  function setAmount(value: number | null) { setQuantity(value); setTyped(value === null ? "" : String(value)); }
  function choose(food: string) {
    const chosen = food.trim();
    if (!chosen) return;
    setName(chosen);
    if (!edit) { setUnit(usualUnit(chosen, stock)); setAmount(null); }
    if (!placeChosen) setPlace(suggestedPlace(chosen, usualUnit(chosen, stock), stock, places));
    setStep(2);
  }
  async function save() {
    setSaving(true); setFailed(false);
    const done = await f.submit({ type: "stock.set", item: { id: edit?.id ?? crypto.randomUUID(), ingredient: clean, quantity, unit, bestBefore: remind || null, place } });
    setSaving(false); if (done) onClose(); else setFailed(true);
  }
  const look = { ingredient: clean || "food", unit };
  return <Sheet onClose={onClose} steps>
    <div className="kitchen-steps-top">
      <button type="button" className="kitchen-round" aria-label={stepNo === 1 ? "Close" : "Back"} onClick={() => stepNo === 1 ? onClose() : setStep(stepNo - 1)}>{stepNo === 1 ? <X size={20} aria-hidden/> : <ChevronLeft size={20} aria-hidden/>}</button>
      <span>Step {stepNo} of 3</span><span className="kitchen-spacer"/>
    </div>
    <div className="kitchen-progress" aria-hidden>{[1, 2, 3].map(n => <span key={n} className={n <= stepNo ? "is-done" : undefined}/>)}</div>
    <div className="kitchen-steps-body">
      {stepNo === 1 && <>
        <DialogTitle asChild><h2 className="kitchen-step-title">{edit ? `Change ${edit.ingredient}` : "What did you get?"}</h2></DialogTitle>
        <form className="kitchen-what" onSubmit={event => { event.preventDefault(); choose(name); }}>
          <label htmlFor={nameId} className="sr-only">Food name</label>
          <input id={nameId} autoFocus={!edit} maxLength={120} list="food-ingredient-names" autoComplete="off" value={name} placeholder="Type a food" onChange={event => setName(event.target.value)}/>
          {!edit && <button type="button" className="kitchen-camera" aria-label="Show me with a photo" onClick={() => { onClose(); window.dispatchEvent(new CustomEvent("daywell-capture", { detail: { mode: "basket", intent: "photo" } })); }}><Camera size={26} aria-hidden/></button>}
        </form>
        {!edit && <><h3 className="kitchen-step-label">Or tap one you often get</h3>
          <div className="kitchen-tiles">{tiles.map(food => <button key={food} type="button" aria-pressed={ingredientName(food) === ingredientName(name)} onClick={() => choose(food)}><FoodFace lot={{ ingredient: food, unit: usualUnit(food, stock) }} size={26} className="is-tile"/>{food}</button>)}</div></>}
      </>}
      {stepNo === 2 && <div className="kitchen-much">
        <FoodFace lot={look} size={48} className="is-hero"/>
        <DialogTitle asChild><h2 className="kitchen-step-title">How much {clean.toLowerCase()}?</h2></DialogTitle>
        <p>Optional. It helps with planning.</p>
        <div className="kitchen-stepper">
          <button type="button" aria-label="Less" disabled={quantity === null || !valid || quantity <= step} onClick={() => setAmount(quantity === null ? null : round(quantity - step))}><Minus size={26} aria-hidden/></button>
          <span className="kitchen-amount"><label htmlFor={amountId} className="sr-only">Quantity, in {units.find(([id]) => id === unit)?.[1]}</label>
            <input id={amountId} inputMode="decimal" autoComplete="off" value={typed} placeholder="–" aria-invalid={!valid || undefined} onChange={event => { const text = event.target.value.replace(",", "."); setTyped(text); const value = Number(text); setQuantity(text.trim() === "" ? null : Number.isFinite(value) ? round(value) : NaN); }}/>
            <span aria-hidden>{units.find(([id]) => id === unit)?.[1]}</span></span>
          <button type="button" aria-label="More" disabled={quantity !== null && !valid} onClick={() => setAmount(quantity === null ? start : round(quantity + step))}><Plus size={26} aria-hidden/></button>
        </div>
        {!valid && <p className="kitchen-error" role="alert">Enter a quantity greater than zero, or skip it.</p>}
        <div className="kitchen-units" role="group" aria-label="Unit">{units.map(([id, label]) => <button key={id} type="button" aria-pressed={unit === id} onClick={() => setUnit(id)}>{label}</button>)}</div>
      </div>}
      {stepNo === 3 && <>
        <DialogTitle asChild><h2 className="kitchen-step-title">Where does it live?</h2></DialogTitle>
        <p className="kitchen-step-note">{capital(clean)} usually goes in the {placeNames[usual].toLowerCase()}.</p>
        <div className="kitchen-pick" role="group" aria-label={`Where ${clean} lives`}>{placeIds.map(id => { const PlaceIcon = placeIcons[id]; return <button key={id} type="button" aria-pressed={place === id} onClick={() => { setPlace(id); setPlaceChosen(true); }}>
          {place === id && <span className="kitchen-tick" aria-hidden><Check size={16}/></span>}<span className="kitchen-place-icon" aria-hidden><PlaceIcon size={30}/></span>{placeNames[id]}</button>; })}</div>
        <details className="kitchen-remind" open={!!remind || undefined}><summary><Clock size={18} aria-hidden/>{remind ? "Reminder date" : "Add a reminder date (optional)"}</summary>
          <label>Remind me to use it by<input type="date" value={remind} onChange={event => setRemind(event.target.value)}/></label><small>A reminder only, not a food-safety check.</small></details>
        <div className="kitchen-summary"><FoodFace lot={look} size={22} className="is-mid"/><span><strong>{capital(clean)}</strong>{quantity !== null && valid && ` · ${amountText(quantity, unit)}`} · {placeNames[place].toLowerCase()}</span></div>
        <SheetError f={f} failed={failed}/>
      </>}
    </div>
    <div className="kitchen-steps-foot">
      {stepNo === 1 && <button type="button" className="kitchen-primary" disabled={!clean} onClick={() => choose(name)}>Next: how much<ArrowRight size={20} aria-hidden/></button>}
      {stepNo === 2 && <div className="kitchen-two"><button type="button" className="kitchen-secondary" onClick={() => { setAmount(null); setStep(3); }}>Skip</button><button type="button" className="kitchen-primary" disabled={!valid} onClick={() => setStep(3)}>Next: where<ArrowRight size={20} aria-hidden/></button></div>}
      {stepNo === 3 && <button type="button" className="kitchen-primary" disabled={saving || !clean || !valid || f.busy || !!f.pending || !!f.draft} onClick={() => void save()}><Check size={20} aria-hidden/>{saving ? "Saving…" : edit ? "Save changes" : "Add to my kitchen"}</button>}
    </div>
  </Sheet>;
}
