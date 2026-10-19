"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FoodCommand } from "@/lib/food";
import { prepareFoodCommand, readFoodSnapshot, sendFoodCommand, type FoodAction, type FoodDraft, type FoodSnapshot } from "@/lib/food-client";
import { clearOtherFoodRecovery, foodRecoveryToken, FoodRecoveryConflict, readFoodRecovery, writeFoodRecovery, type FoodRecovery } from "@/lib/food-recovery";
import { today } from "@/lib/daywell";
import { placeNames, placeOf } from "@/lib/food-places";

// What the notice says after a save.
function savedNotice(action: FoodAction, before: FoodSnapshot | null) {
  if (action.type === "cook") return "Meal remembered. Your kitchen is updated.";
  if (action.type === "use") return action.intake ? "On today’s plate. Your kitchen is updated." : "Your kitchen is updated.";
  if (action.type === "undo") return "That change has been undone.";
  if (action.type.startsWith("plan.")) return "Meal plans saved. Your shopping needs are updated; nothing has been consumed.";
  if (action.type === "shopping.add") return "Added to your trolley list.";
  if (action.type === "stock.remove") return "Taken out of your kitchen.";
  if (action.type === "purchase") return "Put away in your kitchen.";
  if (action.type === "stock.add") return "Added to your kitchen.";
  if (action.type === "stock.set") {
    const lot = before?.state.stock.find(item => item.id === action.item.id);
    if (!lot) return "Added to your kitchen.";
    if (action.item.place && action.item.place !== placeOf(lot)) return `Moved to the ${placeNames[action.item.place].toLowerCase()}.`;
  }
  return "Saved to your kitchen.";
}

export function useFood(enabled: boolean, refreshJournal: () => Promise<void>, scope: string | null) {
  const [snapshot, setSnapshot] = useState<FoodSnapshot | null>(null);
  const [draft, setDraft] = useState<FoodDraft | null>(null);
  const [pending, setPending] = useState<FoodCommand | null>(null);
  const [busy, setBusy] = useState(false), [fresh, setFresh] = useState(false);
  const [error, setError] = useState(""), [notice, setNotice] = useState("");
  // The basket change just saved, so the notice can offer Undo straight away.
  const [undoable, setUndoable] = useState<string | null>(null);
  const [review, setReview] = useState(false), [recovered, setRecovered] = useState(false);
  const [storageWarning, setStorageWarning] = useState("");
  const [hydratedScope, setHydratedScope] = useState<string | null>(null);
  const [view, updateView] = useState("plate"), [start, updateStart] = useState(today()), [days, updateDays] = useState<2 | 3 | 7>(3);
  const guard = useRef(false), journal = useRef(refreshJournal), readSequence = useRef(0), hydrated = useRef<string | null>(null);
  const scopeRef = useRef(scope), recoveryToken = useRef<string | null>(null);
  const working = useRef<Omit<FoodRecovery, "version">>({ draft, pending, view: "plate", start, days });
  useEffect(() => { journal.current = refreshJournal; }, [refreshJournal]);
  function persist(next: Partial<Omit<FoodRecovery, "version">>) {
    const previous = working.current;
    const hadDraft = Boolean(previous.draft || previous.pending);
    working.current = { ...working.current, ...next };
    if (!scope || hydrated.current !== scope || scopeRef.current !== scope) return false;
    // Browsing in an idle tab must never erase another tab's recovery copy.
    if (!hadDraft && !working.current.draft && !working.current.pending) return true;
    try { recoveryToken.current = writeFoodRecovery(localStorage, scope, working.current, recoveryToken.current); setStorageWarning(""); return true; }
    catch (failure) {
      if (failure instanceof FoodRecoveryConflict) { working.current = previous; setStorageWarning(failure.message); setError(failure.message); return false; }
      setStorageWarning("This browser couldn’t keep a recovery copy. Keep this page open until your changes are saved.");
      return true;
    }
  }
  useEffect(() => {
    ++readSequence.current; guard.current = false;
    scopeRef.current = scope;
    const previousScope = hydrated.current;
    hydrated.current = scope;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setSnapshot(null); setFresh(false); setBusy(false); setDraft(null); setPending(null); setRecovered(false); setReview(false); setError(""); setNotice(""); setUndoable(null);
      working.current = { draft: null, pending: null, view: "plate", start: today(), days: 3 };
      try {
        if (scope || previousScope) clearOtherFoodRecovery(localStorage, scope);
        const saved = scope ? readFoodRecovery(localStorage, scope) : null;
        recoveryToken.current = scope ? foodRecoveryToken(localStorage, scope) : null;
        if (saved) {
          working.current = saved; setDraft(saved.draft); setPending(saved.pending); setRecovered(true);
          updateView(saved.view); updateStart(saved.start); updateDays(saved.days);
        }
      } catch { setStorageWarning("Draft recovery isn’t available in this browser. Save before closing the app."); }
      setHydratedScope(scope);
    });
    return () => { cancelled = true; };
  }, [scope]);
  const reload = useCallback(async () => {
    if (!scope) return false;
    const sequence = ++readSequence.current;
    setFresh(false);
    try {
      const data = await readFoodSnapshot(fetch, scope);
      if (sequence !== readSequence.current || scope !== scopeRef.current) return false;
      setSnapshot(data); setFresh(true); return true;
    } catch (failure) { if (sequence === readSequence.current) setError(failure instanceof Error ? failure.message : "Your kitchen couldn’t load."); return false; }
  }, [scope]);
  useEffect(() => { if (enabled && scope && !guard.current) void reload(); }, [enabled, scope, reload]);
  useEffect(() => {
    if (!draft && !pending) return;
    const warn = (event: BeforeUnloadEvent) => { if (storageWarning) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [draft, pending, storageWarning]);
  useEffect(() => {
    const signOut = (event: MouseEvent) => {
      const link = (event.target as Element)?.closest?.("a[href]");
      if (!link || !new URL(link.getAttribute("href")!, location.href).pathname.startsWith("/signout")) return;
      try { clearOtherFoodRecovery(localStorage, null); } catch { /* No storage available. */ }
      hydrated.current = null; ++readSequence.current;
      setDraft(null); setPending(null); setSnapshot(null); setFresh(false);
    };
    document.addEventListener("click", signOut, true);
    return () => document.removeEventListener("click", signOut, true);
  }, []);
  function setView(value: string) { updateView(value); persist({ view: value as FoodRecovery["view"] }); }
  function setStart(value: string) { updateStart(value); persist({ start: value }); }
  function setDays(value: 2 | 3 | 7) { updateDays(value); persist({ days: value }); }
  function open(action: FoodAction) {
    if (!snapshot || !fresh || guard.current || pending || recovered) return;
    if (draft) { setError("Finish or cancel your open change first. Your details are still here."); return; }
    const next = { revision: snapshot.revision, action };
    persist({ draft: next }); setDraft(next); setError(""); setNotice(""); setUndoable(null); setReview(false);
  }
  function change(action: FoodAction) {
    if (guard.current || pending || !draft) return;
    const next = { ...draft, action }; persist({ draft: next }); setDraft(next);
  }
  function cancel() {
    if (guard.current || pending) return;
    persist({ draft: null, pending: null }); setDraft(null); setRecovered(false); setError(""); setReview(false);
  }
  async function send(command: FoodCommand): Promise<boolean> {
    if (guard.current || !scope || scope !== hydrated.current) return false;
    // Persist the exact authorised command BEFORE the request can reach the server.
    if (!persist({ pending: command })) return false;
    guard.current = true; ++readSequence.current; setBusy(true); setError(""); setNotice(""); setUndoable(null);
    setPending(command); setRecovered(false);
    try {
      const result = await sendFoodCommand(command, fetch, scope);
      if (scope !== scopeRef.current || scope !== hydrated.current) return false;
      if (result.kind === "uncertain") { setError(result.message); return false; }
      persist({ pending: null }); setPending(null);
      if (result.kind === "saved") {
        persist({ draft: null }); setDraft(null); setReview(false);
        setNotice(savedNotice(command.action, snapshot));
        setUndoable(["purchase", "cook", "use", "stock.add", "stock.remove"].includes(command.action.type) ? command.operationId : null);
        await reload();
        await journal.current();
        return true;
      }
      setError(result.message);
      if (result.kind === "conflict") { setReview(true); await reload(); }
      return false;
    } finally { if (scope === scopeRef.current) { guard.current = false; setBusy(false); } }
  }
  // One tap, one save: the Kitchen's sheets save straight away. A problem leaves the change open in the editor.
  async function submit(action: FoodAction) {
    if (!snapshot || !fresh || guard.current || pending || recovered) return false;
    if (draft) { setError("Finish or cancel your open change first. Your details are still here."); return false; }
    const next = { revision: snapshot.revision, action };
    persist({ draft: next }); setDraft(next); setError(""); setNotice(""); setUndoable(null); setReview(false);
    try { return await send(prepareFoodCommand(next, crypto.randomUUID())); }
    catch { setError("Check names, dates and quantities, then try again."); return false; }
  }
  async function save() {
    if (!draft || pending || guard.current || !fresh || review || recovered) return;
    if (draft.revision !== snapshot?.revision) { setReview(true); setError("Your basket changed while this form was open. Review the latest saved details below before continuing."); return; }
    try { await send(prepareFoodCommand(draft, crypto.randomUUID())); }
    catch { setError("Check names, dates and quantities. Use positive meal amounts, 1–24 servings and at most three decimal places."); }
  }
  async function refresh() {
    if (guard.current || pending) return;
    guard.current = true; setBusy(true); setError("");
    try { await reload(); } finally { guard.current = false; setBusy(false); }
  }
  function acceptReview() {
    if (!snapshot || !fresh || pending || guard.current || !draft) return;
    const next = { ...draft, revision: snapshot.revision }; persist({ draft: next }); setDraft(next);
    setReview(false); setError("");
  }
  function resume() { setRecovered(false); setUndoable(null); setNotice(pending ? "Check this save using its original reference. It won’t be added twice." : "Your unfinished details are back. Review them before saving."); }
  const ready = hydratedScope === scope;
  return { snapshot: ready ? snapshot : null, draft: ready ? draft : null, pending: ready ? pending : null, busy, fresh: ready && fresh, error, notice, undoable, review, recovered: ready && recovered, storageWarning, resume,
    view, setView, start, setStart, days, setDays, open, submit, change, cancel, save, refresh, acceptReview, retry: () => pending ? send(pending) : Promise.resolve(false) };
}
