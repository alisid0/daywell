"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Plus, Undo2 } from "lucide-react";
import { mealLooks } from "./food-look";
import { today } from "@/lib/daywell";
import { ingredientName, type Plan, type Stock } from "@/lib/food";
import type { FoodAction } from "@/lib/food-client";
import { scaleIngredients, starterAmounts, suggestedConsumption, windowEnd } from "@/lib/food-planning";
import { PlanCoverage, PlanGuide } from "./food-plan-journey";
import { clearPlanCalories, plannedIntake, matchesPlannedIngredients } from "@/lib/food-journey";
import { recipeIdeas } from "@/lib/wellbeing";
import type { AppState } from "./use-daywell";
import { EntryActions } from "./parts";
import { foodDetail } from "@/lib/food-tracking";
import { DailyNutrition, IntakeFields } from "./food-tracking";
import { RecipeHelper } from "./recipe-ideas";
import { CookCard, CookSheet } from "./cook";
import { PlatePlace } from "./plate";
import { TrolleyPlace } from "./trolley";
import { WeekPlace, WhenSheet } from "./week";
import type { RecipeIdea } from "@/lib/recipe-ideas";
import { AddFood, AteSome, FoodCard, KitchenNotice, KitchenShelves, PlaceBar, useAddFoodByHand } from "./kitchen";
import type { PlaceId } from "@/lib/food-places";


type Food = AppState["food"];
type InputUnit = Extract<FoodAction, { type: "stock.set" }>["item"]["unit"];
const units: InputUnit[] = ["g", "kg", "ml", "l", "each", "portion"];
const meals = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;
const amount = (quantity: number, unit: string) => `${quantity.toLocaleString("en-GB", { maximumFractionDigits: 3 })} ${unit}`;
// Quantities are optional: without one, just the name.
const named = (name: string, quantity: number | null, unit: string) => quantity === null ? name : `${name} ${amount(quantity, unit)}`;
const stockTitle = (lot: Stock) => `${lot.ingredient}${lot.quantity === null ? "" : ` · ${amount(lot.quantity, lot.unit)}`}${lot.bestBefore ? ` · date ${lot.bestBefore}` : ""}`;
function Field({ title, children }: { title: string; children: ReactNode }) { return <label>{title}{children}</label>; }
function UnitSelect({ value, onChange }: { value: InputUnit; onChange: (unit: InputUnit) => void }) {
  return <select value={value} onChange={event => onChange(event.target.value as InputUnit)}>{units.map(unit => <option key={unit} value={unit}>{unit === "each" ? "individual items" : unit === "portion" ? "portions" : unit}</option>)}</select>;
}
function DateMeal({ date, meal, onChange, latest }: { date: string; meal: Plan["meal"]; latest?: string; onChange: (date: string, meal: Plan["meal"]) => void }) {
  return <><Field title="Date"><input required type="date" max={latest} value={date} onChange={event => onChange(event.target.value, meal)}/></Field><Field title="Meal"><select value={meal} onChange={event => onChange(date, event.target.value as Plan["meal"])}>{meals.map(value => <option key={value}>{value}</option>)}</select></Field></>;
}

export function FoodSpace({ a }: { a: AppState }) {
  const f = a.food, state = f.snapshot?.state;
  const disabled = !f.fresh || f.busy || !!f.pending || !!f.draft;
  const editorHeading = useRef<HTMLHeadingElement>(null), editing = !!f.draft;
  useEffect(() => { if (editing) editorHeading.current?.focus(); }, [editing]);
  // The Kitchen's sheets (app/kitchen.tsx) follow the saved food, so a sheet closes by itself when its food has gone.
  const [sheet, setSheet] = useState<{ kind: "card" | "ate" | "add"; id?: string; place?: PlaceId } | { kind: "when"; idea: RecipeIdea } | { kind: "cook"; wish?: string; planId?: string } | null>(null);
  useAddFoodByHand(() => { f.setView("basket"); setSheet({ kind: "add" }); });
  // "Cook ideas", "Cook with it" and a planned meal's "Cook it now" open the recipe cards (app/cook.tsx).
  useEffect(() => {
    const cook = (event: Event) => {
      const detail = (event as CustomEvent<{ wish?: unknown; planId?: unknown }>).detail ?? {};
      setSheet({ kind: "cook", wish: typeof detail.wish === "string" ? detail.wish : undefined, planId: typeof detail.planId === "string" ? detail.planId : undefined });
    };
    window.addEventListener("daywell-cook", cook);
    return () => window.removeEventListener("daywell-cook", cook);
  }, []);
  const lotId = sheet && (sheet.kind === "card" || sheet.kind === "ate" || sheet.kind === "add") ? sheet.id : undefined, lot = lotId ? state?.stock.find(item => item.id === lotId) : undefined;
  const place = f.view === "history" ? "plate" : f.view;
  const foodHistory = [...a.by("food")].sort((x, y) => y.data.date.localeCompare(x.data.date));
  const recent = f.snapshot?.recentActions.filter(item => ["purchase", "cook", "use", "stock.add", "stock.remove"].includes(item.type)) ?? [];
  return <section className="well-space food-space kitchen-space">
    <div className="kitchen-top"><PlaceBar f={f}/></div>
    <KitchenNotice f={f}/>
    {f.storageWarning && <p className="food-feedback" role="status">{f.storageWarning}</p>}
    {f.recovered && <section className="well-card"><h2>You left a little something here.</h2><p>{f.pending ? "A save was interrupted. Check it safely using the same reference, even if it already reached your basket." : "Your unfinished food details are kept on this device. Continue when you’re ready."}</p><div className="well-actions"><button className="well-button" onClick={f.resume}>{f.pending ? "Review interrupted save" : "Continue my draft"}</button>{!f.pending && <button className="well-text-button" onClick={f.cancel}>Discard draft</button>}</div></section>}
    {f.error && <div className="food-feedback food-error" role="alert"><p>{f.error}</p>{!f.fresh && !f.busy && !f.pending && <button className="well-button well-secondary" onClick={() => void f.refresh()}>Try loading again</button>}</div>}
    {f.pending && !f.busy && !f.recovered && <div className="food-feedback"><p>Your change is held here. Retrying won’t add it twice.</p><button className="well-button" onClick={() => void f.retry()}>Retry save safely</button></div>}
    {f.draft && state && !f.recovered && <section className="well-card food-editor" aria-labelledby="food-editor-title"><h2 id="food-editor-title" ref={editorHeading} tabIndex={-1}>{editorTitle(f.draft.action)}</h2><FoodEditor f={f}/></section>}
    {!state && !f.error && <p role="status">Opening your kitchen…</p>}
    {state && <fieldset className="food-content" disabled={disabled}>
      {place === "plate" && <>
        <PlatePlace a={a}/>
        <DailyNutrition a={a} area="eat"/>
        <div className="well-section-title"><h2>Your meal story</h2><button className="well-button" onClick={() => a.openEditor("food")}>Log a meal</button></div>
        <p>Prepared and used food stays in your story. Only entries marked eaten count towards your intake. Meal notes don’t change your kitchen.</p>
        {foodHistory.length ? foodHistory.slice(0, 20).map(entry => { const look = mealLooks[entry.data.meal as keyof typeof mealLooks] ?? mealLooks.Snack; return <article className={`well-record food-story-row food-tone-${look.tone}`} key={entry.id}><span className="food-item-icon is-small" aria-hidden><look.Icon size={18}/></span><div><strong>{entry.data.title}</strong><small>{entry.data.date} · {entry.data.meal}{` · ${foodDetail(entry.data)}`}</small></div><EntryActions a={a} e={entry}/></article>; }) : <p className="well-empty">Your next meal can be the beginning. No targets to catch up with.</p>}
        <button className="well-text-button" onClick={() => { a.setActive("calendar"); a.setCalendarView("history"); a.setCalendarArea("eat"); }}>See your saved days<ArrowRight size={17}/></button>
      </>}
      {place === "basket" && <>
        <KitchenShelves f={f} onOpen={item => setSheet({ kind: "card", id: item.id })} onAdd={where => setSheet({ kind: "add", place: where })}/>
        <CookCard/>
        {f.snapshot!.overview.inventory.some(row => row.required > 0) && <section className="well-card"><h2>A little set aside</h2><p>Across all your planned meals. These totals combine matching ingredients and units; nothing has been used yet.</p>{f.snapshot!.overview.inventory.filter(row => row.required > 0).map(row => <div className="well-record" key={`${row.ingredient}-${row.unit}`}><div><strong>{row.ingredient}</strong><small>{amount(row.knownOnHand, row.unit)} in your kitchen · {amount(row.reserved, row.unit)} set aside · {amount(row.available, row.unit)} free{row.unknownQuantity ? " · plus some without a quantity" : ""}</small></div></div>)}</section>}
        {recent.length > 0 && <details className="food-recent"><summary>Recent kitchen changes & undo</summary><p>Undo restores the food involved. If it has changed again, we’ll ask you to adjust it instead. Editing or removing a meal note does not reverse kitchen changes.</p>{recent.slice(0, 10).map(item => <div className="well-record" key={item.operationId}><div><strong>{item.type === "cook" ? "Meal cooked" : item.type === "use" ? "Food eaten / used" : item.type === "stock.add" ? "Food added" : item.type === "stock.remove" ? "Taken out of your kitchen" : "Shopping put away"}{item.undone ? " · undone" : ""}</strong><small>{new Date(item.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</small></div>{!item.undone && <button className="well-text-button" onClick={() => f.open({ type: "undo", operationId: item.operationId })}><Undo2 size={16}/>Undo</button>}</div>)}</details>}
      </>}
      {place === "meals" && <WeekPlace a={a}/>}
      {place === "shopping" && <TrolleyPlace f={f} onPutAway={shelved => { if (shelved) f.setView("basket"); }}/>}
    </fieldset>}
    {state && <button className="well-text-button kitchen-refresh" disabled={f.busy || !!f.pending} onClick={() => void f.refresh()}>Refresh saved details</button>}
    {sheet?.kind === "card" && lot && <FoodCard lot={lot} f={f} onClose={() => setSheet(null)} onAte={() => setSheet({ kind: "ate", id: lot.id })} onChange={() => setSheet({ kind: "add", id: lot.id })}/>}
    {sheet?.kind === "ate" && lot && <AteSome lot={lot} a={a} onClose={() => setSheet(null)} onBack={() => setSheet({ kind: "card", id: lot.id })}/>}
    {sheet?.kind === "add" && state && (!sheet.id || lot) && <AddFood edit={lot} place={sheet.place} f={f} onClose={() => setSheet(null)}/>}
    {sheet?.kind === "when" && state && <WhenSheet f={f} idea={sheet.idea} onClose={() => setSheet(null)}/>}
    {sheet?.kind === "cook" && state && <CookSheet a={a} wish={sheet.wish} planId={sheet.planId} onClose={() => setSheet(null)} onPlan={idea => setSheet({ kind: "when", idea })}/>}
  </section>;
}

function editorTitle(action: FoodAction) {
  switch (action.type) {
    case "stock.add": return "Check your food basket items.";
    case "stock.set": return "What’s in your basket?";
    case "plan.add": return "Your meals, ready to review.";
    case "plan.set": return "Make this meal yours.";
    case "plan.window": return `Your next ${action.days} days, at your pace.`;
    case "purchase": return "What did you bring home?";
    case "cook": return "A meal made. A moment remembered.";
    case "use": return "A little from your basket.";
    case "shopping.set": return "One little shopping note.";
    case "shopping.add": return "Add these to your list?";
    case "undo": return "Undo this basket change?";
    default: return "Remove this item?";
  }
}
function LatestDetails({ f }: { f: Food }) {
  const state = f.snapshot!.state;
  return <details className="food-latest" open><summary>Latest saved details — your draft is kept above</summary><h3>Food basket</h3>{state.stock.length ? <ul>{state.stock.map(lot => <li key={lot.id}>{stockTitle(lot)}</li>)}</ul> : <p>Your saved basket is empty.</p>}<h3>Next meals</h3>{state.plans.length ? <ul>{state.plans.map(plan => <li key={plan.id}>{plan.date} · {plan.title} · {plan.servings} servings · {plan.ingredients.map(item => named(item.ingredient, item.quantity, item.unit)).join(", ")}</li>)}</ul> : <p>No saved meal plans.</p>}<h3>Other shopping notes</h3>{state.shopping.length ? <ul>{state.shopping.map(item => <li key={item.id}>{[item.title, item.quantity, item.done ? "picked up" : "to pick up"].filter(Boolean).join(" · ")}</li>)}</ul> : <p>No saved notes.</p>}</details>;
}
function FoodEditor({ f }: { f: Food }) {
  const action = f.draft!.action, locked = f.busy || !!f.pending;
  const state = f.snapshot!.state;
  return <form onSubmit={event => { event.preventDefault(); void f.save(); }}>
    <fieldset className="food-form-fields" disabled={locked}>
      {action.type === "stock.set" && <><p>A quantity is optional. With one, Daywell keeps count for your meals. Save separate packs if their dates differ.</p><StockFields item={action.item} onChange={item => f.change({ ...action, item })}/><p className="food-caption">A pack date is your reminder, not a food-safety check. Check the label and condition before use.</p></>}
      {action.type === "stock.add" && <><p>These will be added as new items. Remove anything already in your basket. Quantities are optional.</p>{action.items.map(item => <section className="well-card" key={item.id}><h3>{item.ingredient}</h3><p>{item.quantity === null ? "No quantity" : amount(item.quantity,item.unit)}</p><details><summary>Adjust details</summary><StockFields item={item} onChange={next=>f.change({...action,items:action.items.map(old=>old.id===item.id?next:old)})}/></details><button type="button" className="well-text-button" disabled={action.items.length===1} onClick={()=>f.change({...action,items:action.items.filter(old=>old.id!==item.id)})}>Leave this item out</button></section>)}</>}
      {action.type === "purchase" && <><p>Add what you bought to your basket. A quantity is optional; the full pack size works best.</p><StockFields item={action.items[0]} bought onChange={item => f.change({ ...action, items: [{ ...action.items[0], ...item }] })}/></>}
      {action.type === "plan.set" && <PlanFields plan={action.plan} onChange={plan => f.change({ ...action, plan })}/>}
      {action.type === "plan.add" && <><p>One serving per meal to start. These are added alongside your existing plans. Review portions and exclusions; nothing is consumed yet.</p><PlanCoverage state={state} plans={action.plans}/>{action.plans.map((plan,index)=><article className="well-card" key={plan.id}><span className="food-eyebrow">{plan.date} · {plan.meal} · {plan.servings} {plan.servings===1?"serving":"servings"}</span><h3>{plan.title}</h3><p>{plan.ingredients.map(item=>named(item.ingredient,item.quantity,item.unit)).join(" · ")}</p><PlanGuide plan={plan}/><details><summary>Adjust this meal</summary><PlanFields plan={plan} onChange={next=>f.change({...action,plans:action.plans.map((old,i)=>i===index?next:old)})}/></details><button type="button" className="well-text-button" disabled={action.plans.length===1} onClick={()=>f.change({...action,plans:action.plans.filter((_,i)=>i!==index)})}>Leave this meal out</button></article>)}</>}
      {action.type === "plan.window" && <><p>Choose meals for {action.startDate} through {windowEnd(action.startDate,action.days-1)}. Existing meals are included. Remove days you want to leave open. Saving replaces only the reviewed meals inside these dates; other dates stay as they are.</p>
        {action.plans.map((plan,index) => <details className="well-card" key={plan.id} aria-label={`Planned meal ${index+1}`} open={index===0}><summary>{plan.date} · {plan.title || "Choose a meal"} · {plan.servings} {plan.servings===1?"serving":"servings"}</summary><PlanFields plan={plan} onChange={plan => f.change({ ...action, plans: action.plans.map((old,i)=>i===index?plan:old) })}/><button className="well-text-button" type="button" onClick={()=>f.change({ ...action, plans: action.plans.filter((_,i)=>i!==index) })}>Leave this meal unplanned</button></details>)}
        <button className="well-text-button" type="button" disabled={action.plans.length>=28} onClick={()=>f.change({ ...action, plans:[...action.plans,{id:crypto.randomUUID(),title:"",date:action.startDate,meal:"Dinner",servings:1,ingredients:[{ingredient:"",quantity:null,unit:"g"}]}] })}>Add another meal</button>
        {!action.plans.length && <p>No meals selected. Saving will clear the existing plans for these dates.</p>}
      </>}
      {action.type === "cook" && <CookFields action={action} f={f}/>}
      {action.type === "use" && <UseFields action={action} f={f}/>}
      {action.type === "shopping.set" && <div className="food-form-grid"><Field title="What to pick up"><input required maxLength={160} value={action.item.title} onChange={event => f.change({ ...action, item: { ...action.item, title: event.target.value } })}/></Field><Field title="Quantity or note (optional)"><input maxLength={80} placeholder="e.g. 2 packs" value={action.item.quantity} onChange={event => f.change({ ...action, item: { ...action.item, quantity: event.target.value } })}/></Field><label className="food-checkbox"><input type="checkbox" checked={action.item.done} onChange={event => f.change({ ...action, item: { ...action.item, done: event.target.checked } })}/>Picked up</label></div>}
      {action.type === "shopping.add" && <><p>These go on your shopping list as notes. Leave out anything you already have.</p>{action.items.map(item => <div className="food-form-grid food-note-row" key={item.id}><Field title="What to pick up"><input required maxLength={160} value={item.title} onChange={event => f.change({ ...action, items: action.items.map(old => old.id === item.id ? { ...old, title: event.target.value } : old) })}/></Field><Field title="Quantity or note (optional)"><input maxLength={80} value={item.quantity} onChange={event => f.change({ ...action, items: action.items.map(old => old.id === item.id ? { ...old, quantity: event.target.value } : old) })}/></Field><button type="button" className="well-text-button" disabled={action.items.length === 1} onClick={() => f.change({ ...action, items: action.items.filter(old => old.id !== item.id) })}>Leave this out</button></div>)}</>}
      {action.type === "stock.remove" && <p>Take {state.stock.find(item => item.id === action.id)?.ingredient ?? "this ingredient"} out of your basket? Do this when it’s used up or gone. Your meal plans stay; your shopping list will update.</p>}
      {action.type === "plan.remove" && <p>Remove the plan for {state.plans.find(item => item.id === action.id)?.title ?? "this meal"}? Its ingredients will no longer be reserved. This doesn’t remove any food or meal history.</p>}
      {action.type === "shopping.remove" && <p>Remove the note “{state.shopping.find(item => item.id === action.id)?.title ?? "this item"}”? This doesn’t change your food basket.</p>}
      {action.type === "undo" && <p>We’ll reverse that capture, purchase, cooking or food-use record, including its stock changes and any meal note it created. Later changes to the same items may prevent undo.</p>}
      <datalist id="food-ingredient-names">{[...new Set([...state.stock.map(item => item.ingredient), ...state.plans.flatMap(plan => plan.ingredients.map(item => item.ingredient))])].map(name => <option key={name} value={name}/>)}</datalist>
    </fieldset>
    {(f.review || f.draft!.revision !== f.snapshot!.revision) && <div className="food-conflict"><p>Your draft has been kept. Compare it with the latest saved details below, make any corrections, then confirm you’ve reviewed it.</p><LatestDetails f={f}/><button type="button" className="well-button well-secondary" disabled={locked || !f.fresh} onClick={f.acceptReview}>I’ve reviewed the latest details</button></div>}
    <div className="well-actions food-form-actions"><button className="well-button" type="submit" disabled={locked || !f.fresh || f.review || f.draft!.revision !== f.snapshot!.revision}>{f.busy ? "Saving…" : action.type === "stock.add" ? "Add reviewed food to basket" : action.type === "plan.add" ? "Save these meals" : action.type === "plan.window" ? "Save reviewed days" : action.type === "shopping.add" ? "Add to my list" : action.type === "cook" ? "Save cooked meal" : action.type === "use" ? "Save food used" : action.type === "purchase" ? "Add bought food to basket" : action.type === "undo" ? "Confirm undo" : action.type.endsWith(".remove") ? "Confirm removal" : "Save changes"}</button><button className="well-text-button" type="button" disabled={locked} onClick={f.cancel}>Cancel</button></div>
    <p className="food-caption">Unfinished details are kept on this device for your account. Reopen Daywell to continue. Saving updates your food details.</p>
  </form>;
}


type PlanInput = Extract<FoodAction, { type: "plan.set" }>["plan"];
function PlanFields({ plan, onChange: update }: { plan: PlanInput; onChange: (plan: PlanInput) => void }) {
  function onChange(next: PlanInput) { update(next.servings===plan.servings && JSON.stringify(next.ingredients)!==JSON.stringify(plan.ingredients)?clearPlanCalories(next):next); }
  function chooseRecipe(id: string) {
    const recipe = recipeIdeas.find(item=>item.id===id);
    if(recipe) onChange({ ...plan, guide: undefined, title: recipe.title, ingredients: scaleIngredients(starterAmounts[id],1,plan.servings) });
  }
  return <><Field title="Start with an idea (optional)"><select value={recipeIdeas.find(recipe=>recipe.title===plan.title)?.id??""} onChange={event=>chooseRecipe(event.target.value)}><option value="">Choose an idea or enter your own</option>{recipeIdeas.map(recipe=><option key={recipe.id} value={recipe.id}>{recipe.title}</option>)}</select></Field><p>Review ingredients for your dietary needs. Quantities are optional and cover all servings together. Planning uses nothing from your basket.</p>
    <div className="food-form-grid"><Field title="Meal name"><input required maxLength={120} value={plan.title} onChange={event=>onChange({...plan,title:event.target.value})}/></Field><DateMeal date={plan.date} meal={plan.meal} onChange={(date,meal)=>onChange({...plan,date,meal})}/><Field title="Servings"><select value={plan.servings} onChange={event=>{const servings=Number(event.target.value);onChange({...plan,servings,ingredients:scaleIngredients(plan.ingredients,plan.servings,servings)})}}>{Array.from({length:24},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select></Field></div>
    <label>Estimated calories per serving (optional)<input type="number" min="0" max="10000" value={plan.guide?.caloriesPerServing ?? ""} onChange={e=>update({...plan,guide:{steps:plan.guide?.steps??[],nutritionNote:"Your reviewed estimate for one serving, including any oil and sauces.",caloriesPerServing:e.target.value===""?undefined:Number(e.target.value)}})}/></label><p className="food-caption">Changing ingredients clears the old calorie estimate. Planned meals do not count as food consumed.</p>
    <h3>Ingredients for this whole meal</h3>{plan.ingredients.map((item,index)=><div className="food-ingredient-fields" key={index}><Field title={`Ingredient ${index+1}`}><input required list="food-ingredient-names" maxLength={120} value={item.ingredient} onChange={event=>onChange({...plan,ingredients:plan.ingredients.map((old,i)=>i===index?{...old,ingredient:event.target.value}:old)})}/></Field><Field title="Quantity (optional)"><input type="number" inputMode="decimal" min={0.001} step="0.001" max={1000000} value={item.quantity ?? ""} onChange={event=>onChange({...plan,ingredients:plan.ingredients.map((old,i)=>i===index?{...old,quantity:event.target.value===""?null:Number(event.target.value)}:old)})}/></Field><Field title="Unit"><UnitSelect value={item.unit} onChange={unit=>onChange({...plan,ingredients:plan.ingredients.map((old,i)=>i===index?{...old,unit}:old)})}/></Field><button className="well-text-button" type="button" disabled={plan.ingredients.length===1} aria-label={`Remove ingredient ${index+1}`} onClick={()=>onChange({...plan,ingredients:plan.ingredients.filter((_,i)=>i!==index)})}>Remove</button></div>)}
    <button className="well-text-button" type="button" disabled={plan.ingredients.length>=40} onClick={()=>onChange({...plan,ingredients:[...plan.ingredients,{ingredient:"",quantity:null,unit:"g"}]})}><Plus size={16}/>Another ingredient</button>
    <RecipeHelper plan={plan} onSteps={update} onAdd={names=>onChange({...plan,ingredients:[...plan.ingredients.filter(item=>item.ingredient.trim()),...names.map(ingredient=>({ingredient,quantity:null,unit:"g" as const}))].slice(0,40)})}/>
  </>;
}

type StockInput = Extract<FoodAction, { type: "stock.set" }>["item"];
// A quantity is optional: leave it blank and the item is simply in your basket. Food just bought can't be zero.
function StockFields({ item, onChange, bought = false }: { item: StockInput; onChange: (item: StockInput) => void; bought?: boolean }) {
  return <div className="food-form-grid"><Field title="Ingredient name"><input required maxLength={120} list="food-ingredient-names" placeholder="e.g. dry rice" value={item.ingredient} onChange={event => onChange({ ...item, ingredient: event.target.value })}/></Field><Field title="Quantity (optional)"><input type="number" inputMode="decimal" min={bought ? 0.001 : 0} max={1000000} step="0.001" placeholder="e.g. 500" value={item.quantity ?? ""} onChange={event => onChange({ ...item, quantity: event.target.value === "" ? null : Number(event.target.value) })}/></Field><Field title="Unit"><UnitSelect value={item.unit} onChange={unit => onChange({ ...item, unit })}/></Field><Field title="Pack date / reminder (optional)"><input type="date" value={item.bestBefore ?? ""} onChange={event => onChange({ ...item, bestBefore: event.target.value || null })}/></Field></div>;
}

function CookFields({ action, f }: { action: Extract<FoodAction, { type: "cook" }>; f: Food }) {
  const state = f.snapshot!.state, plan = state.plans.find(item => item.id === action.planId);
  const known = state.stock.filter(lot => lot.quantity !== null && lot.quantity > 0);
  const recipe = recipeIdeas.find(item => item.title === action.title);
  const required = plan ? scaleIngredients(plan.ingredients, plan.servings, action.servings) : [];
  // Without a quantity, any of it in the basket covers the meal.
  const shortages = required.filter(item => item.quantity === null ? !state.stock.some(lot => ingredientName(lot.ingredient) === ingredientName(item.ingredient) && lot.quantity !== 0)
    : state.stock.filter(lot => ingredientName(lot.ingredient) === ingredientName(item.ingredient) && lot.unit === item.unit).reduce((sum, lot) => sum + (lot.quantity ?? 0), 0) < item.quantity);
  return <><p>Only save after you’ve made this meal. Confirm what you actually used, including substitutions. We’ll take these quantities off your basket and remember your meal.</p>
    {plan?.guide ? <PlanGuide plan={plan}/> : recipe && <details><summary>Cooking steps</summary><ol>{recipe.steps.map(step => <li key={step}>{step}</li>)}</ol><small>{recipe.note}</small></details>}
    <div className="food-form-grid"><Field title="Meal name"><input required maxLength={120} value={action.title} onChange={event => f.change({ ...action, title: event.target.value })}/></Field><DateMeal latest={today()} date={action.date} meal={action.meal} onChange={(date, meal) => f.change({ ...action, date, meal })}/><Field title="Servings made (including leftovers)"><select value={action.servings} onChange={event => { const servings = Number(event.target.value); f.change({ ...action, servings, consumed: plan ? suggestedConsumption({ ...plan, ingredients: scaleIngredients(plan.ingredients, plan.servings, servings) }, state.stock) : scaleIngredients(action.consumed, action.servings, servings) }); }}>{Array.from({ length: plan?.servings ?? 24 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}</select></Field></div>
    {plan && <p>{action.servings >= plan.servings ? "This will finish this planned meal." : `${Math.max(0, plan.servings - action.servings)} servings will stay planned for another time.`} Quantities are starting suggestions, not a record until you confirm them.</p>}
    {shortages.length > 0 && <p className="food-feedback">Your basket doesn’t yet cover: {shortages.map(item => item.ingredient).join(", ")}. Cancel to add or check stock first, or record the substitutions you actually used below.</p>}
    <h3>Quantities actually used</h3><p>Changing these clears the previous nutrition estimate so you can check it again. Leave a quantity blank for food you didn’t use. Food without a quantity stays in your basket as it is.</p>
    {!known.length && <p className="food-caption">Nothing in your basket has a quantity to take off, and that’s fine. Saving still remembers your meal.</p>}
    {known.map(lot => <div className="food-used-row" key={lot.id}><Field title={stockTitle(lot)}><input aria-label={`Used ${lot.ingredient}${lot.bestBefore ? ` dated ${lot.bestBefore}` : ""}`} type="number" min={0} step="0.001" max={lot.quantity!} value={action.consumed.find(item => item.stockId === lot.id)?.quantity ?? ""} onChange={event => { const quantity = Number(event.target.value); f.change({ ...action, intake: action.intake ? {portions:action.intake.portions,source:action.intake.source} : undefined, consumed: [...action.consumed.filter(item => item.stockId !== lot.id), ...(quantity > 0 ? [{ stockId: lot.id, quantity, unit: lot.unit }] : [])] }); }}/></Field><span>{lot.unit}</span></div>)}
    <label className="food-checkbox"><input type="checkbox" checked={action.useReservedStock} onChange={event => f.change({ ...action, useReservedStock: event.target.checked })}/>I’m choosing to use food reserved for other meals. Update their shopping needs.</label>
    <label className="food-checkbox"><input type="checkbox" checked={!!action.leftovers} onChange={event => f.change({ ...action, leftovers: event.target.checked ? { id: crypto.randomUUID(), title: `${action.title} leftovers`.slice(0, 120), portions: 1, bestBefore: null } : undefined })}/>Keep track of leftovers</label>
    {action.leftovers && <div className="food-form-grid"><Field title="Leftover name"><input required maxLength={120} value={action.leftovers.title} onChange={event => f.change({ ...action, leftovers: { ...action.leftovers!, title: event.target.value } })}/></Field><Field title="Portions saved"><input required type="number" min={0.125} step="0.001" max={action.servings || 24} value={action.leftovers.portions || ""} onChange={event => f.change({ ...action, leftovers: { ...action.leftovers!, portions: Number(event.target.value) } })}/></Field><Field title="Reminder date (optional)"><input type="date" value={action.leftovers.bestBefore ?? ""} onChange={event => f.change({ ...action, leftovers: { ...action.leftovers!, bestBefore: event.target.value || null } })}/></Field></div>}
    <PersonalIntake action={action} plan={plan && matchesPlannedIngredients(state,plan,action) ? plan : undefined} onChange={action => f.change(action)}/>
    <label className="food-checkbox"><input type="checkbox" required/>I’ve cooked this meal and checked the quantities used.</label>
  </>;
}

function PersonalIntake<T extends Extract<FoodAction, { type: "cook" | "use" }>>({ action, onChange, plan }: { action: T; onChange: (action: T) => void; plan?: Plan }) {
  return <section className="personal-intake"><h3>What did you eat?</h3><label className="food-checkbox"><input type="checkbox" checked={!!action.intake} onChange={event => onChange({ ...action, intake: event.target.checked ? plan ? plannedIntake(plan,1) : { portions: 1, source: "estimate" } : undefined })}/>I ate a portion — add it to my food record</label>{action.intake ? <IntakeFields value={action.intake} onChange={intake => onChange({ ...action, intake })} maximum={action.type === "cook" ? action.servings - (action.leftovers?.portions ?? 0) : 24}/> : <p className="food-caption">Your basket will update, without adding calories consumed. You can edit the meal note later.</p>}</section>;
}
function UseFields({ action, f }: { action: Extract<FoodAction, { type: "use" }>; f: Food }) {
  const lot = f.snapshot!.state.stock.find(item => item.id === action.consumed[0]?.stockId);
  return <><p>Record food eaten or used without a meal plan, including saved leftovers. We’ll take off only the quantity you confirm.</p><div className="food-form-grid"><Field title="Food name"><input required maxLength={120} value={action.title} onChange={e => f.change({ ...action, title: e.target.value })}/></Field><DateMeal latest={today()} date={action.date} meal={action.meal} onChange={(date,meal) => f.change({ ...action, date, meal })}/>{lot && <Field title={`Quantity used (${lot.unit})`}><input required type="number" min={0.001} max={lot.quantity ?? 0} step="0.001" value={action.consumed[0]?.quantity || ""} onChange={e => f.change({ ...action, consumed: [{ stockId: lot.id, quantity: Number(e.target.value), unit: lot.unit }] })}/></Field>}</div>{lot ? <p>{stockTitle(lot)}. Use this basket unit for the quantity used; your personal portions are recorded below.</p> : <p role="alert">This basket item has changed. Cancel and choose it again.</p>}<label className="food-checkbox"><input type="checkbox" checked={action.useReservedStock} onChange={e => f.change({ ...action, useReservedStock: e.target.checked })}/>I’m choosing to use food reserved for other meals. Update their shopping needs.</label><PersonalIntake action={action} onChange={action => f.change(action)}/><label className="food-checkbox"><input required type="checkbox"/>I’ve checked the quantity used.</label></>;
}
