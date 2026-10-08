"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { ArrowRight, Check, History, Plus, ShoppingBasket, Undo2 } from "lucide-react";
import { CompanionPortrait } from "@/components/daywell-companions";
import { today } from "@/lib/daywell";
import { ingredientName, type Plan, type Stock } from "@/lib/food";
import type { FoodAction } from "@/lib/food-client";
import { scaleIngredients, starterAmounts, suggestedConsumption, windowEnd } from "@/lib/food-planning";
import { recipeIdeas } from "@/lib/wellbeing";
import type { AppState } from "./use-daywell";
import { CalendarStrip } from "./calendar-strip";
import { EntryActions } from "./parts";


type Food = AppState["food"];
type InputUnit = Extract<FoodAction, { type: "stock.set" }>["item"]["unit"];
const units: InputUnit[] = ["g", "kg", "ml", "l", "each", "portion"];
const meals = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;
const amount = (quantity: number | null, unit: string) => quantity === null ? "Amount to check" : `${quantity.toLocaleString("en-GB", { maximumFractionDigits: 3 })} ${unit}`;
const withoutChange = <T extends { changedBy: string }>({ changedBy: _changedBy, ...item }: T) => item;
const stockTitle = (lot: Stock) => `${lot.ingredient} · ${amount(lot.quantity, lot.unit)}${lot.bestBefore ? ` · date ${lot.bestBefore}` : ""}`;
function Field({ title, children }: { title: string; children: ReactNode }) { return <label>{title}{children}</label>; }
function UnitSelect({ value, onChange }: { value: InputUnit; onChange: (unit: InputUnit) => void }) {
  return <select value={value} onChange={event => onChange(event.target.value as InputUnit)}>{units.map(unit => <option key={unit} value={unit}>{unit === "each" ? "individual items" : unit === "portion" ? "portions" : unit}</option>)}</select>;
}
function DateMeal({ date, meal, onChange, latest }: { date: string; meal: Plan["meal"]; latest?: string; onChange: (date: string, meal: Plan["meal"]) => void }) {
  return <><Field title="Date"><input required type="date" max={latest} value={date} onChange={event => onChange(event.target.value, meal)}/></Field><Field title="Meal"><select value={meal} onChange={event => onChange(date, event.target.value as Plan["meal"])}>{meals.map(value => <option key={value}>{value}</option>)}</select></Field></>;
}
function stockAction(ingredient = "", quantity: number | null = null, unit: InputUnit = "g"): FoodAction {
  return { type: "stock.set", item: { id: crypto.randomUUID(), ingredient, quantity, unit, bestBefore: null } };
}
function purchaseAction(ingredient = "", quantity = 0, unit: InputUnit = "g"): FoodAction {
  return { type: "purchase", items: [{ id: crypto.randomUUID(), ingredient, quantity, unit, bestBefore: null }] };
}

export function FoodSpace({ a }: { a: AppState }) {
  const f = a.food, state = f.snapshot?.state;
  const disabled = !f.fresh || f.busy || !!f.pending || !!f.draft;
  const editorHeading = useRef<HTMLHeadingElement>(null), editing = !!f.draft;
  useEffect(() => { if (editing) editorHeading.current?.focus(); }, [editing]);
  const foodHistory = [...a.by("food")].sort((x, y) => y.data.date.localeCompare(x.data.date));
  return <section className="well-space food-space">
    <header className="well-pillar-heading"><div><span>Eat · a little help from Nori</span><h1>Something good,<br/>made simple.</h1><p>Your food basket, your next meals, one little list.</p></div><CompanionPortrait id="nori" size={130} decorative/></header>
    <CalendarStrip a={a} area="eat"/>
    <nav className="well-tabs" aria-label="Food views">{[["basket", "Food basket"], ["meals", "Next meals"], ["shopping", "Shopping"]].map(([id, label]) => <button key={id} aria-pressed={f.view === id} onClick={() => f.setView(id)}>{label}</button>)}</nav>
    <div className="food-toolbar"><button className="well-text-button" onClick={() => f.setView(f.view === "history" ? "basket" : "history")}><History size={16}/>{f.view === "history" ? "Back to food basket" : "Your meal story"}</button><button className="well-text-button" disabled={f.busy || !!f.pending} onClick={() => void f.refresh()}>Refresh saved details</button></div>
    {f.storageWarning && <p className="food-feedback" role="status">{f.storageWarning}</p>}
    {f.recovered && <section className="well-card"><h2>You left a little something here.</h2><p>{f.pending ? "A save was interrupted. Check it safely using the same reference, even if it already reached your basket." : "Your unfinished food details are kept on this device. Continue when you’re ready."}</p><div className="well-actions"><button className="well-button" onClick={f.resume}>{f.pending ? "Review interrupted save" : "Continue my draft"}</button>{!f.pending && <button className="well-text-button" onClick={f.cancel}>Discard draft</button>}</div></section>}
    <div aria-live="polite">{f.notice && <p className="food-feedback"><Check size={17}/>{f.notice}</p>}</div>
    {f.error && <div className="food-feedback food-error" role="alert"><p>{f.error}</p>{!f.fresh && !f.busy && !f.pending && <button className="well-button well-secondary" onClick={() => void f.refresh()}>Try loading again</button>}</div>}
    {f.pending && !f.busy && !f.recovered && <div className="food-feedback"><p>Your change is held here. Retrying won’t add it twice.</p><button className="well-button" onClick={() => void f.retry()}>Retry save safely</button></div>}
    {f.draft && state && !f.recovered && <section className="well-card food-editor" aria-labelledby="food-editor-title"><h2 id="food-editor-title" ref={editorHeading} tabIndex={-1}>{editorTitle(f.draft.action)}</h2><FoodEditor f={f}/></section>}
    {!state && !f.error && <p role="status">Opening your food basket…</p>}
    {state && <fieldset className="food-content" disabled={disabled}>
      {f.view === "basket" && <>
        <div className="food-invitation"><ShoppingBasket size={27}/><div><h2>Start with what you have.</h2><p>Add an ingredient and its amount. Unsure? Save it to check later. Planning won’t use it up; cooking will.</p></div><button className="well-button" onClick={() => f.open(stockAction())}><Plus size={17}/>Add ingredient</button></div>
        {state.stock.length ? <div className="food-stock-grid">{state.stock.map(lot => <article className="well-card food-stock" key={lot.id}><span className="food-eyebrow">In your basket</span><h3>{lot.ingredient}</h3><strong className="food-quantity">{amount(lot.quantity, lot.unit)}</strong>{lot.bestBefore && <small>Pack date / reminder: {lot.bestBefore}</small>}<div className="well-actions"><button className="well-text-button" aria-label={`Edit ${lot.ingredient}`} onClick={() => f.open({ type: "stock.set", item: withoutChange(lot) })}>{lot.quantity === null ? "Check amount" : "Adjust"}</button><button className="well-text-button" aria-label={`Remove ${lot.ingredient}`} onClick={() => f.open({ type: "stock.remove", id: lot.id })}>Remove</button></div></article>)}</div> : <p className="well-empty">An empty basket is a fresh start. Add what’s in your cupboard or fridge, one thing at a time.</p>}
        {f.snapshot!.overview.inventory.some(row => row.required > 0) && <section className="well-card"><h2>A little set aside</h2><p>Across all your planned meals. These totals combine matching ingredients and units; nothing has been used yet.</p>{f.snapshot!.overview.inventory.filter(row => row.required > 0).map(row => <div className="well-record" key={`${row.ingredient}-${row.unit}`}><div><strong>{row.ingredient}</strong><small>{amount(row.knownOnHand, row.unit)} confirmed · {amount(row.reserved, row.unit)} reserved · {amount(row.available, row.unit)} free{row.unknownQuantity ? " · another amount needs checking" : ""}</small></div></div>)}</section>}
        <button className="well-text-button" onClick={() => f.setView("meals")}>Make room for your next meals<ArrowRight size={17}/></button>
      </>}
      {f.view === "meals" && <MealPlans f={f}/>}
      {f.view === "shopping" && <Shopping f={f}/>}
      {f.view === "history" && <><div className="well-section-title"><h2>Meals to remember</h2><button className="well-button" onClick={() => a.openEditor("food")}>Log a meal</button></div><p>Cooking from a plan records your meal here. A separate meal note doesn’t change your basket.</p>{foodHistory.length ? foodHistory.slice(0, 50).map(entry => <article className="well-record" key={entry.id}><div><strong>{entry.data.title}</strong><small>{entry.data.date} · {entry.data.meal}{entry.data.nutritionKnown !== false ? ` · ${entry.data.calories} kcal (estimate)` : ""}</small></div><EntryActions a={a} e={entry}/></article>) : <p className="well-empty">Your next meal can be the beginning. No targets to catch up with.</p>}<button className="well-text-button" onClick={() => { a.setActive("calendar"); a.setCalendarView("history"); a.setCalendarArea("eat"); }}>See your saved days<ArrowRight size={17}/></button></>}
      {f.snapshot!.recentActions.some(item => ["purchase", "cook"].includes(item.type)) && <details className="food-recent"><summary>Recent basket changes & undo</summary><p>Undo restores the food involved. If it has changed again, we’ll ask you to adjust it instead. Editing a meal note does not reverse cooking.</p>{f.snapshot!.recentActions.filter(item => ["purchase", "cook"].includes(item.type)).slice(0, 10).map(item => <div className="well-record" key={item.operationId}><div><strong>{item.type === "cook" ? "Meal cooked" : "Shopping put away"}{item.undone ? " · undone" : ""}</strong><small>{new Date(item.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</small></div>{!item.undone && <button className="well-text-button" onClick={() => f.open({ type: "undo", operationId: item.operationId })}><Undo2 size={16}/>Undo</button>}</div>)}</details>}
    </fieldset>}
  </section>;
}

function MealPlans({ f }: { f: Food }) {
  const state = f.snapshot!.state, end = windowEnd(f.start, f.days);
  const plans = state.plans.filter(plan => plan.date >= f.start && plan.date < end).sort((a, b) => a.date.localeCompare(b.date) || meals.indexOf(a.meal) - meals.indexOf(b.meal));
  const outside = state.plans.length - plans.length;
  function planDays() {
    const existing = plans.map(withoutChange);
    const additions = Array.from({ length: f.days }, (_, i) => windowEnd(f.start, i)).filter(date => !existing.some(plan => plan.date === date)).map(date => ({ id: crypto.randomUUID(), title: "", date, meal: "Dinner" as const, servings: 1, ingredients: [{ ingredient: "", quantity: 0, unit: "g" as const }] }));
    f.open({ type: "plan.window", startDate: f.start, days: f.days, plans: [...existing, ...additions].slice(0,28) });
  }
  function newPlan(recipeId?: string) {
    const recipe = recipeIdeas.find(item => item.id === recipeId);
    f.open({ type: "plan.set", plan: { id: crypto.randomUUID(), title: recipe?.title ?? "", date: f.start, meal: recipeId === "oats" ? "Breakfast" : "Dinner", servings: 1,
      ingredients: recipeId ? structuredClone(starterAmounts[recipeId]) : [{ ingredient: "", quantity: 0, unit: "g" }] } });
  }
  return <><div className="food-invitation"><div><h2>A few days, gently planned.</h2><p>Pick meals that fit your week. We’ll work out what’s missing from your basket.</p></div><div className="well-actions"><button className="well-button" disabled={plans.length>28} onClick={planDays}>Plan these {f.days} days</button><button className="well-text-button" onClick={() => newPlan()}><Plus size={17}/>One meal</button></div></div>
    <div className="food-window"><Field title="Starting from"><input type="date" required value={f.start} onChange={event => { if (event.target.value) f.setStart(event.target.value); }}/></Field><div role="group" aria-label="Planning days">{([2, 3, 7] as const).map(days => <button className="well-button well-secondary" key={days} aria-pressed={f.days === days} onClick={() => f.setDays(days)}>{days} days</button>)}</div></div>
    {outside > 0 && <p className="food-caption">{outside} other planned {outside === 1 ? "meal is" : "meals are"} outside these dates. Shopping still includes them. <button className="well-text-button" onClick={() => f.setStart([...state.plans].filter(plan => plan.date < f.start || plan.date >= end).sort((a, b) => a.date.localeCompare(b.date))[0].date)}>Show the next one</button></p>}
    {plans.map(plan => <article className="well-card" key={plan.id}><span className="food-eyebrow">{plan.date} · {plan.meal} · {plan.servings} {plan.servings === 1 ? "serving" : "servings"}</span><h2>{plan.title}</h2><p>{plan.ingredients.map(item => `${item.ingredient} ${amount(item.quantity, item.unit)}`).join(" · ")}</p><div className="well-actions"><button className="well-button" onClick={() => f.open({ type: "cook", planId: plan.id, title: plan.title, date: today(), meal: plan.meal, servings: plan.servings, consumed: suggestedConsumption(plan, state.stock), useReservedStock: false })}>I made this</button><button className="well-text-button" onClick={() => f.open({ type: "plan.set", plan: withoutChange(plan) })}>Edit meal</button><button className="well-text-button" aria-label={`Remove plan ${plan.title}`} onClick={() => f.open({ type: "plan.remove", id: plan.id })}>Remove</button></div></article>)}
    {!plans.length && <p className="well-empty">Nothing planned for these dates yet. One meal is plenty to begin with.</p>}
    <div className="well-section-title"><h2>A little inspiration</h2></div><p>Three simple starting ideas. Review ingredients, portions and your own dietary needs before adding a meal.</p>
    <div className="food-recipe-grid">{recipeIdeas.map(recipe => <article className="well-card" key={recipe.id}><span className="food-eyebrow">{recipe.time}</span><h3>{recipe.title}</h3><p>{recipe.ingredients.join(" · ")}</p><details><summary>How to make it</summary><ol>{recipe.steps.map(step => <li key={step}>{step}</li>)}</ol><small>{recipe.note}</small></details><button className="well-text-button" onClick={() => newPlan(recipe.id)}>Review & plan<ArrowRight size={16}/></button></article>)}</div>
    <button className="well-text-button" onClick={() => f.setView("shopping")}>See what you need to buy<ArrowRight size={17}/></button>
  </>;
}

function Shopping({ f }: { f: Food }) {
  const overview = f.snapshot!.overview;
  return <><div className="food-invitation"><div><h2>Just what’s missing.</h2><p>Based on all saved meal plans and confirmed amounts in your basket. Put away the actual pack size you bought.</p></div><button className="well-button" onClick={() => f.open(purchaseAction())}>Put shopping away</button></div>
    {overview.toBuy.length ? overview.toBuy.map(row => <article className="well-record" key={`${row.ingredient}-${row.unit}`}><div><strong>{row.ingredient}</strong><small>{row.needsCheck ? `Check your basket amount in ${row.unit} first; we won’t guess a shortage.` : `${amount(row.toBuy, row.unit)} needed`}</small></div>{row.needsCheck ? <button className="well-text-button" onClick={() => f.setView("basket")}>Check basket</button> : <button className="well-text-button" onClick={() => f.open(purchaseAction(row.ingredient, row.toBuy ?? 0, row.unit))}>I bought this</button>}</article>) : <p className="well-empty">{f.snapshot!.state.plans.length ? "Your confirmed amounts cover the planned ingredients. Check your packs before you cook." : "Plan a meal and your missing ingredients will appear here."}</p>}
    <section className="well-card"><div className="food-toolbar"><h2>Your shopping notes</h2><button className="well-text-button" onClick={() => f.open({ type: "shopping.set", item: { id: crypto.randomUUID(), title: "", quantity: "1", done: false } })}><Plus size={16}/>Add a note</button></div><p>Everything you tell Daywell or add here, including earlier notes. For food, record the pack you actually bought. For household items, just tick the note.</p>{f.snapshot!.state.shopping.map(item => <div className="well-record" key={item.id}><div><strong>{item.done ? "✓ " : ""}{item.title}</strong><small>{item.quantity}{item.done ? " · picked up" : ""}</small></div><div className="well-actions">{!item.done && <button className="well-text-button" onClick={() => f.open({ type: "purchase", items: [{ id: crypto.randomUUID(), ingredient: item.title.slice(0,120), quantity: 0, unit: "g", bestBefore: null, shoppingId: item.id }] })}>Put bought food away</button>}<button className="well-text-button" aria-label={`Edit note ${item.title}`} onClick={() => f.open({ type: "shopping.set", item: withoutChange(item) })}>Edit</button><button className="well-text-button" aria-label={`Remove note ${item.title}`} onClick={() => f.open({ type: "shopping.remove", id: item.id })}>Remove</button></div></div>)}</section>
  </>;
}

function editorTitle(action: FoodAction) {
  switch (action.type) {
    case "stock.set": return "What’s in your basket?";
    case "plan.set": return "Make this meal yours.";
    case "plan.window": return `Your next ${action.days} days, at your pace.`;
    case "purchase": return "What did you bring home?";
    case "cook": return "A meal made. A moment remembered.";
    case "shopping.set": return "One little shopping note.";
    case "undo": return "Undo this basket change?";
    default: return "Remove this item?";
  }
}
function LatestDetails({ f }: { f: Food }) {
  const state = f.snapshot!.state;
  return <details className="food-latest" open><summary>Latest saved details — your draft is kept above</summary><h3>Food basket</h3>{state.stock.length ? <ul>{state.stock.map(lot => <li key={lot.id}>{stockTitle(lot)}</li>)}</ul> : <p>Your saved basket is empty.</p>}<h3>Next meals</h3>{state.plans.length ? <ul>{state.plans.map(plan => <li key={plan.id}>{plan.date} · {plan.title} · {plan.servings} servings · {plan.ingredients.map(item => `${item.ingredient} ${amount(item.quantity, item.unit)}`).join(", ")}</li>)}</ul> : <p>No saved meal plans.</p>}<h3>Other shopping notes</h3>{state.shopping.length ? <ul>{state.shopping.map(item => <li key={item.id}>{item.title} · {item.quantity} · {item.done ? "picked up" : "to pick up"}</li>)}</ul> : <p>No saved notes.</p>}</details>;
}
function FoodEditor({ f }: { f: Food }) {
  const action = f.draft!.action, locked = f.busy || !!f.pending;
  const state = f.snapshot!.state;
  return <form onSubmit={event => { event.preventDefault(); void f.save(); }}>
    <fieldset className="food-form-fields" disabled={locked}>
      {action.type === "stock.set" && <><p>Record the amount you have now. Save separate packs if their dates differ. Use the same ingredient names and units as your meal plans.</p><StockFields item={action.item} onChange={item => f.change({ ...action, item })} allowUnknown/><p className="food-caption">A pack date is your reminder, not a food-safety check. Check the label and condition before use.</p></>}
      {action.type === "purchase" && <><p>Enter what you actually bought, including the full pack size. We’ll add a new pack to your existing basket.</p><StockFields item={action.items[0]} onChange={item => f.change({ ...action, items: [{ ...item, quantity: item.quantity ?? 0 }] })}/></>}
      {action.type === "plan.set" && <PlanFields plan={action.plan} onChange={plan => f.change({ ...action, plan })}/>}
      {action.type === "plan.window" && <><p>Choose meals for {action.startDate} through {windowEnd(action.startDate,action.days-1)}. Existing meals are included. Remove days you want to leave open. Saving replaces only the reviewed meals inside these dates; other dates stay as they are.</p>
        {action.plans.map((plan,index) => <details className="well-card" key={plan.id} aria-label={`Planned meal ${index+1}`} open={index===0}><summary>{plan.date} · {plan.title || "Choose a meal"} · {plan.servings} {plan.servings===1?"serving":"servings"}</summary><PlanFields plan={plan} onChange={plan => f.change({ ...action, plans: action.plans.map((old,i)=>i===index?plan:old) })}/><button className="well-text-button" type="button" onClick={()=>f.change({ ...action, plans: action.plans.filter((_,i)=>i!==index) })}>Leave this meal unplanned</button></details>)}
        <button className="well-text-button" type="button" disabled={action.plans.length>=28} onClick={()=>f.change({ ...action, plans:[...action.plans,{id:crypto.randomUUID(),title:"",date:action.startDate,meal:"Dinner",servings:1,ingredients:[{ingredient:"",quantity:0,unit:"g"}]}] })}>Add another meal</button>
        {!action.plans.length && <p>No meals selected. Saving will clear the existing plans for these dates.</p>}
      </>}
      {action.type === "cook" && <CookFields action={action} f={f}/>}
      {action.type === "shopping.set" && <div className="food-form-grid"><Field title="What to pick up"><input required maxLength={160} value={action.item.title} onChange={event => f.change({ ...action, item: { ...action.item, title: event.target.value } })}/></Field><Field title="Amount or note"><input required maxLength={80} value={action.item.quantity} onChange={event => f.change({ ...action, item: { ...action.item, quantity: event.target.value } })}/></Field><label className="food-checkbox"><input type="checkbox" checked={action.item.done} onChange={event => f.change({ ...action, item: { ...action.item, done: event.target.checked } })}/>Picked up</label></div>}
      {action.type === "stock.remove" && <p>Remove {state.stock.find(item => item.id === action.id)?.ingredient ?? "this ingredient"} from your basket? Your meal plans stay; your shopping needs will update.</p>}
      {action.type === "plan.remove" && <p>Remove the plan for {state.plans.find(item => item.id === action.id)?.title ?? "this meal"}? Its ingredients will no longer be reserved. This doesn’t remove any food or meal history.</p>}
      {action.type === "shopping.remove" && <p>Remove the note “{state.shopping.find(item => item.id === action.id)?.title ?? "this item"}”? This doesn’t change your food amounts.</p>}
      {action.type === "undo" && <p>We’ll reverse that purchase or cooking record, including its stock changes and any meal note it created. Later changes to the same items may prevent undo.</p>}
      <datalist id="food-ingredient-names">{[...new Set([...state.stock.map(item => item.ingredient), ...state.plans.flatMap(plan => plan.ingredients.map(item => item.ingredient))])].map(name => <option key={name} value={name}/>)}</datalist>
    </fieldset>
    {(f.review || f.draft!.revision !== f.snapshot!.revision) && <div className="food-conflict"><p>Your draft has been kept. Compare it with the latest saved details below, make any corrections, then confirm you’ve reviewed it.</p><LatestDetails f={f}/><button type="button" className="well-button well-secondary" disabled={locked || !f.fresh} onClick={f.acceptReview}>I’ve reviewed the latest details</button></div>}
    <div className="well-actions food-form-actions"><button className="well-button" type="submit" disabled={locked || !f.fresh || f.review || f.draft!.revision !== f.snapshot!.revision}>{f.busy ? "Saving…" : action.type === "plan.window" ? "Save reviewed days" : action.type === "cook" ? "Save cooked meal" : action.type === "purchase" ? "Add bought food to basket" : action.type === "undo" ? "Confirm undo" : action.type.endsWith(".remove") ? "Confirm removal" : "Save changes"}</button><button className="well-text-button" type="button" disabled={locked} onClick={f.cancel}>Cancel</button></div>
    <p className="food-caption">Unfinished details are kept on this device for your account. Reopen Daywell to continue. Saving adds them to your food basket.</p>
  </form>;
}


type PlanInput = Extract<FoodAction, { type: "plan.set" }>["plan"];
function PlanFields({ plan, onChange }: { plan: PlanInput; onChange: (plan: PlanInput) => void }) {
  function chooseRecipe(id: string) {
    const recipe = recipeIdeas.find(item=>item.id===id);
    if(recipe) onChange({ ...plan, title: recipe.title, ingredients: scaleIngredients(starterAmounts[id],1,plan.servings) });
  }
  return <><Field title="Start with an idea (optional)"><select value={recipeIdeas.find(recipe=>recipe.title===plan.title)?.id??""} onChange={event=>chooseRecipe(event.target.value)}><option value="">Choose an idea or enter your own</option>{recipeIdeas.map(recipe=><option key={recipe.id} value={recipe.id}>{recipe.title}</option>)}</select></Field><p>Review ingredients for your dietary needs. Amounts cover all servings together; planning uses nothing from your basket.</p>
    <div className="food-form-grid"><Field title="Meal name"><input required maxLength={120} value={plan.title} onChange={event=>onChange({...plan,title:event.target.value})}/></Field><DateMeal date={plan.date} meal={plan.meal} onChange={(date,meal)=>onChange({...plan,date,meal})}/><Field title="Servings"><select value={plan.servings} onChange={event=>{const servings=Number(event.target.value);onChange({...plan,servings,ingredients:scaleIngredients(plan.ingredients,plan.servings,servings)})}}>{Array.from({length:24},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select></Field></div>
    <h3>Ingredients for this whole meal</h3>{plan.ingredients.map((item,index)=><div className="food-ingredient-fields" key={index}><Field title={`Ingredient ${index+1}`}><input required list="food-ingredient-names" maxLength={120} value={item.ingredient} onChange={event=>onChange({...plan,ingredients:plan.ingredients.map((old,i)=>i===index?{...old,ingredient:event.target.value}:old)})}/></Field><Field title="Amount"><input required type="number" min={0.001} step="0.001" max={1000000} value={item.quantity||""} onChange={event=>onChange({...plan,ingredients:plan.ingredients.map((old,i)=>i===index?{...old,quantity:Number(event.target.value)}:old)})}/></Field><Field title="Unit"><UnitSelect value={item.unit} onChange={unit=>onChange({...plan,ingredients:plan.ingredients.map((old,i)=>i===index?{...old,unit}:old)})}/></Field><button className="well-text-button" type="button" disabled={plan.ingredients.length===1} aria-label={`Remove ingredient ${index+1}`} onClick={()=>onChange({...plan,ingredients:plan.ingredients.filter((_,i)=>i!==index)})}>Remove</button></div>)}
    <button className="well-text-button" type="button" disabled={plan.ingredients.length>=40} onClick={()=>onChange({...plan,ingredients:[...plan.ingredients,{ingredient:"",quantity:0,unit:"g"}]})}><Plus size={16}/>Another ingredient</button>
  </>;
}

type StockInput = Extract<FoodAction, { type: "stock.set" }>["item"];
function StockFields({ item, onChange, allowUnknown = false }: { item: StockInput; onChange: (item: StockInput) => void; allowUnknown?: boolean }) {
  return <><div className="food-form-grid"><Field title="Ingredient name"><input required maxLength={120} list="food-ingredient-names" placeholder="e.g. dry rice" value={item.ingredient} onChange={event => onChange({ ...item, ingredient: event.target.value })}/></Field><Field title="Amount"><input required disabled={item.quantity === null} type="number" min={allowUnknown ? 0 : 0.001} max={1000000} step="0.001" value={item.quantity ?? ""} onChange={event => onChange({ ...item, quantity: event.target.value === "" ? 0 : Number(event.target.value) })}/></Field><Field title="Unit"><UnitSelect value={item.unit} onChange={unit => onChange({ ...item, unit })}/></Field><Field title="Pack date / reminder (optional)"><input type="date" value={item.bestBefore ?? ""} onChange={event => onChange({ ...item, bestBefore: event.target.value || null })}/></Field></div>{allowUnknown && <label className="food-checkbox"><input type="checkbox" checked={item.quantity === null} onChange={event => onChange({ ...item, quantity: event.target.checked ? null : 0 })}/>I need to check the amount</label>}</>;
}

function CookFields({ action, f }: { action: Extract<FoodAction, { type: "cook" }>; f: Food }) {
  const state = f.snapshot!.state, plan = state.plans.find(item => item.id === action.planId);
  const known = state.stock.filter(lot => lot.quantity !== null && lot.quantity > 0);
  const recipe = recipeIdeas.find(item => item.title === action.title);
  const required = plan ? scaleIngredients(plan.ingredients, plan.servings, action.servings) : [];
  const shortages = required.filter(item => state.stock.filter(lot => ingredientName(lot.ingredient) === ingredientName(item.ingredient) && lot.unit === item.unit).reduce((sum, lot) => sum + (lot.quantity ?? 0), 0) < item.quantity);
  return <><p>Only save after you’ve made this meal. Confirm what you actually used, including substitutions. We’ll subtract these amounts and remember your meal.</p>
    {recipe && <details><summary>Cooking steps</summary><ol>{recipe.steps.map(step => <li key={step}>{step}</li>)}</ol><small>{recipe.note}</small></details>}
    <div className="food-form-grid"><Field title="Meal name"><input required maxLength={120} value={action.title} onChange={event => f.change({ ...action, title: event.target.value })}/></Field><DateMeal latest={today()} date={action.date} meal={action.meal} onChange={(date, meal) => f.change({ ...action, date, meal })}/><Field title="Servings made (including leftovers)"><select value={action.servings} onChange={event => { const servings = Number(event.target.value); f.change({ ...action, servings, consumed: plan ? suggestedConsumption({ ...plan, ingredients: scaleIngredients(plan.ingredients, plan.servings, servings) }, state.stock) : scaleIngredients(action.consumed, action.servings, servings) }); }}>{Array.from({ length: plan?.servings ?? 24 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}</select></Field></div>
    {plan && <p>{action.servings >= plan.servings ? "This will finish this planned meal." : `${Math.max(0, plan.servings - action.servings)} servings will stay planned for another time.`} Quantities are starting suggestions, not a record until you confirm them.</p>}
    {shortages.length > 0 && <p className="food-feedback">Your basket doesn’t yet cover: {shortages.map(item => item.ingredient).join(", ")}. Cancel to add or check stock first, or record the substitutions you actually used below.</p>}
    <h3>Amounts actually used</h3><p>Leave an amount blank for food you didn’t use. Unknown amounts must be checked in your basket first.</p>
    {!known.length && <p className="food-feedback">There’s no confirmed food amount to use yet. Cancel and add or check an ingredient first.</p>}
    {known.map(lot => <div className="food-used-row" key={lot.id}><Field title={stockTitle(lot)}><input aria-label={`Used ${lot.ingredient}${lot.bestBefore ? ` dated ${lot.bestBefore}` : ""}`} type="number" min={0} step="0.001" max={lot.quantity!} value={action.consumed.find(item => item.stockId === lot.id)?.quantity ?? ""} onChange={event => { const quantity = Number(event.target.value); f.change({ ...action, consumed: [...action.consumed.filter(item => item.stockId !== lot.id), ...(quantity > 0 ? [{ stockId: lot.id, quantity, unit: lot.unit }] : [])] }); }}/></Field><span>{lot.unit}</span></div>)}
    <label className="food-checkbox"><input type="checkbox" checked={action.useReservedStock} onChange={event => f.change({ ...action, useReservedStock: event.target.checked })}/>I’m choosing to use food reserved for other meals. Update their shopping needs.</label>
    <label className="food-checkbox"><input type="checkbox" checked={!!action.leftovers} onChange={event => f.change({ ...action, leftovers: event.target.checked ? { id: crypto.randomUUID(), title: `${action.title} leftovers`.slice(0, 120), portions: 1, bestBefore: null } : undefined })}/>Keep track of leftovers</label>
    {action.leftovers && <div className="food-form-grid"><Field title="Leftover name"><input required maxLength={120} value={action.leftovers.title} onChange={event => f.change({ ...action, leftovers: { ...action.leftovers!, title: event.target.value } })}/></Field><Field title="Portions saved"><input required type="number" min={1} max={action.servings || 24} value={action.leftovers.portions || ""} onChange={event => f.change({ ...action, leftovers: { ...action.leftovers!, portions: Number(event.target.value) } })}/></Field><Field title="Reminder date (optional)"><input type="date" value={action.leftovers.bestBefore ?? ""} onChange={event => f.change({ ...action, leftovers: { ...action.leftovers!, bestBefore: event.target.value || null } })}/></Field></div>}
    <label className="food-checkbox"><input type="checkbox" required/>I’ve cooked this meal and checked the amounts actually used.</label>
  </>;
}
