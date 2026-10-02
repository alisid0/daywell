"use client";

import { useState, type FormEvent } from "react";
import { ArrowUpRight, Check, Footprints, ListChecks, Moon, Plus, ShoppingBasket, Timer, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { today, type Kind } from "@/lib/daywell";
import { filterTasks, type TaskFilter } from "@/lib/routines";
import type { AppState } from "./use-daywell";
import { Empty, EntryActions, TaskRows } from "./parts";

export function QuickEntry({ a, kind }: { a: AppState; kind: "task" | "grocery" }) {
  const [title, setTitle] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || busy) return;
    setBusy(true);
    const data = kind === "task"
      ? { title: title.trim(), date: today(), minutes: 25, done: false }
      : { title: title.trim(), quantity: quantity.trim() || "1", done: false };
    const saved = await a.save([{ id: crypto.randomUUID(), kind, data }], kind === "task" ? "Priority added" : "Added to your list");
    if (saved) { setTitle(""); setQuantity("1"); }
    setBusy(false);
  }
  return <form className="quick-entry" onSubmit={submit} aria-label={kind === "task" ? "Quick add task" : "Quick add grocery"}>
    <Plus size={18} aria-hidden="true" />
    <input aria-label={kind === "task" ? "New priority" : "Grocery item"} placeholder={kind === "task" ? "One thing you want to get done…" : "What do you need?"} value={title} maxLength={160} disabled={busy} onChange={e => setTitle(e.target.value)} required />
    {kind === "grocery" && <input className="quick-quantity" aria-label="Quantity" value={quantity} maxLength={40} placeholder="Qty" disabled={busy} onChange={e => setQuantity(e.target.value)} />}
    <Button type="submit" disabled={busy || !title.trim()}>{busy ? "Adding…" : "Add"}</Button>
  </form>;
}

export function TaskWorkspace({ a }: { a: AppState }) {
  const [filter, setFilter] = useState<TaskFilter>("today");
  const date = today();
  const tasks = filterTasks(a.entries, filter, date);
  const filters: [TaskFilter, string][] = [["today", "Today"], ["upcoming", "Upcoming"], ["completed", "Completed"], ["all", "All tasks"]];
  return <section className="card section-gap">
    <div className="section-title"><div><h2>Make room for what matters.</h2><p className="section-description">One priority, then the next.</p></div><Button variant="ghost" onClick={() => a.openEditor("task")}><Plus />Plan a task</Button></div>
    <QuickEntry a={a} kind="task" />
    <div className="filter-row" role="group" aria-label="Filter tasks">{filters.map(([id, label]) => <button key={id} aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}<span>{filterTasks(a.entries, id, date).length}</span></button>)}</div>
    {tasks.length ? <TaskRows a={a} items={tasks} /> : <Empty title={filter === "completed" ? "Progress will live here." : filter === "upcoming" ? "A little space ahead." : "A clear space to begin."} description={filter === "today" ? "Add a priority above. Unfinished tasks from earlier days appear here too." : "Choose another view or add a task to get started."} />}
  </section>;
}

export function GroceryWorkspace({ a }: { a: AppState }) {
  const [filter, setFilter] = useState<"needed" | "bought" | "all">("needed");
  const groceries = a.by("grocery");
  const bought = groceries.filter(e => e.data.done).length;
  const visible = groceries.filter(e => filter === "all" || (filter === "bought" ? e.data.done : !e.data.done));
  return <section className="card shopping-workspace">
    <div className="section-title"><div><h2>A lighter shopping trip.</h2><p className="section-description">{groceries.length ? `${groceries.length - bought} to get · ${bought} in your basket` : "A home for everything you need."}</p></div><span className="icon-box mint"><ShoppingBasket size={22} /></span></div>
    <QuickEntry a={a} kind="grocery" />
    {!!groceries.length && <div className="shopping-progress" role="progressbar" aria-label="Shopping complete" aria-valuenow={bought} aria-valuemin={0} aria-valuemax={groceries.length}><span style={{ width: `${bought / groceries.length * 100}%` }} /></div>}
    <div className="filter-row" role="group" aria-label="Filter groceries">{([['needed', 'To get'], ['bought', 'Bought'], ['all', 'Everything']] as const).map(([id, label]) => <button key={id} aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>)}</div>
    {visible.length ? <div className="entry-list">{visible.map(e => <div className="task-row" key={e.id}>
      <Checkbox disabled={a.saving > 0} aria-label={`Bought ${e.data.title}`} checked={e.data.done} onCheckedChange={done => void a.save([{ ...e, data: { ...e.data, done: !!done } }])} />
      <div className={`entry-main ${e.data.done ? "complete" : ""}`}><strong>{e.data.title}</strong><small>{e.data.quantity}</small></div><EntryActions a={a} e={e} />
    </div>)}</div> : <Empty icon={filter === "needed" && bought ? Check : ShoppingBasket} title={filter === "needed" && bought ? "Everything's in the basket." : filter === "bought" ? "Ready when you are." : "A little less to remember."} description={filter === "needed" && bought ? "You're all set. Bought items stay in the Bought tab." : "Add an item above, then check it off as you shop."} />}
  </section>;
}

export function DaySnapshot({ a }: { a: AppState }) {
  const tasks = filterTasks(a.entries, "today", today());
  const focused = a.dayEntries("session").reduce((n, e) => n + e.data.minutes, 0);
  const movement = a.dayEntries("move").reduce((n, e) => n + e.data.minutes, 0);
  const sleep = a.dayEntries("sleep").at(-1)?.data.minutes as number | undefined;
  const metrics = [
    { module: "focus", label: "Priorities", value: String(tasks.length), detail: "ready for your attention", icon: ListChecks, tone: "lavender" },
    { module: "focus", label: "Focus time", value: `${focused} min`, detail: "a little space to think", icon: Timer, tone: "blue" },
    { module: "move", label: "Movement", value: `${movement} min`, detail: "at your own pace", icon: Footprints, tone: "green" },
    { module: "sleep", label: "Last night's rest", value: sleep ? `${Math.floor(sleep / 60)}h ${sleep % 60}m` : "Not logged", detail: "make time to recharge", icon: Moon, tone: "rose" },
    { module: "grocery", label: "Shopping", value: `${a.by("grocery").filter(e => !e.data.done).length} items`, detail: "one less thing to remember", icon: ShoppingBasket, tone: "green" },
  ].filter(m => a.enabled(m.module)).slice(0, 4);
  const actions: { module: string; kind: Kind; label: string; icon: typeof Plus }[] = [
    { module: "focus", kind: "task", label: "Add a priority", icon: Plus },
    { module: "food", kind: "food", label: "Log a meal", icon: Utensils },
    { module: "move", kind: "move", label: "Log movement", icon: Footprints },
    { module: "sleep", kind: "sleep", label: "Log sleep", icon: Moon },
    { module: "grocery", kind: "grocery", label: "Add groceries", icon: ShoppingBasket },
  ];
  return <section className="day-snapshot" aria-label="Your day at a glance">
    {metrics.length > 0 && <div className="snapshot-grid">{metrics.map(m => <button key={m.label} className={`snapshot-card ${m.tone}`} onClick={() => a.setActive(m.module)}><div><m.icon size={18} /><span>{m.label}</span><ArrowUpRight size={15} /></div><strong>{m.value}</strong><small>{m.detail}</small></button>)}</div>}
    {actions.some(m => a.enabled(m.module)) && <div className="quick-actions"><span>A SMALL STEP</span>{actions.filter(m => a.enabled(m.module)).map(m => <button key={m.kind} onClick={() => a.openEditor(m.kind)}><m.icon size={15} />{m.label}</button>)}</div>}
  </section>;
}
