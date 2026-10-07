"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FoodCommand } from "@/lib/food";
import { prepareFoodCommand, readFoodSnapshot, sendFoodCommand, type FoodAction, type FoodDraft, type FoodSnapshot } from "@/lib/food-client";
import { today } from "@/lib/daywell";

// Lives with useDaywell rather than the Eat tab: moving between areas keeps an
// unfinished form and an uncertain save intact for the lifetime of this page.
export function useFood(enabled: boolean, refreshJournal: () => Promise<void>) {
  const [snapshot, setSnapshot] = useState<FoodSnapshot | null>(null);
  const [draft, setDraft] = useState<FoodDraft | null>(null);
  const [pending, setPending] = useState<FoodCommand | null>(null);
  const [busy, setBusy] = useState(false), [fresh, setFresh] = useState(false);
  const [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [review, setReview] = useState(false);
  const [view, setView] = useState("basket"), [start, setStart] = useState(today()), [days, setDays] = useState<2 | 3 | 7>(3);
  const guard = useRef(false), journal = useRef(refreshJournal), readSequence = useRef(0);
  useEffect(() => { journal.current = refreshJournal; }, [refreshJournal]);
  const reload = useCallback(async () => {
    const sequence = ++readSequence.current;
    setFresh(false);
    try {
      const data = await readFoodSnapshot();
      if (sequence !== readSequence.current) return false;
      setSnapshot(data); setFresh(true); return true;
    } catch (failure) { if (sequence === readSequence.current) setError(failure instanceof Error ? failure.message : "Your food basket couldn’t load."); return false; }
  }, []);
  useEffect(() => { if (enabled && !guard.current) void reload(); }, [enabled, reload]);
  useEffect(() => {
    if (!draft && !pending) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [draft, pending]);
  function open(action: FoodAction) {
    if (!snapshot || !fresh || guard.current || pending) return;
    if (draft) { setError("Finish or cancel your open change first. Your details are still here."); return; }
    setDraft({ revision: snapshot.revision, action }); setError(""); setNotice(""); setReview(false);
  }
  function change(action: FoodAction) { if (!guard.current && !pending) setDraft(current => current ? { ...current, action } : current); }
  function cancel() { if (!guard.current && !pending) { setDraft(null); setError(""); setReview(false); } }
  async function send(command: FoodCommand) {
    if (guard.current) return;
    guard.current = true; ++readSequence.current; setBusy(true); setError(""); setNotice(""); setPending(command);
    try {
      const result = await sendFoodCommand(command);
      if (result.kind === "uncertain") { setError(result.message); return; }
      setPending(null);
      if (result.kind === "saved") {
        setDraft(null); setReview(false);
        setNotice(command.action.type === "cook" ? "Meal remembered. Your food basket is updated." : command.action.type === "undo" ? "That change has been undone." : "Saved to your food basket.");
        await reload();
        if (command.action.type === "cook" || command.action.type === "undo") await journal.current();
      } else {
        setError(result.message);
        if (result.kind === "conflict") { setReview(true); await reload(); }
      }
    } finally { guard.current = false; setBusy(false); }
  }
  async function save() {
    if (!draft || pending || guard.current || !fresh || review) return;
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
    if (!snapshot || !fresh || pending || guard.current) return;
    setDraft(current => current ? { ...current, revision: snapshot.revision } : current);
    setReview(false); setError("");
  }
  return { snapshot, draft, pending, busy, fresh, error, notice, review, view, setView, start, setStart, days, setDays,
    open, change, cancel, save, refresh, acceptReview, retry: () => pending ? send(pending) : Promise.resolve() };
}
