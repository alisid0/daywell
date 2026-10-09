"use client";
import { useState, type FormEvent } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "./parts";
import type { AppState } from "./use-daywell";

// Sleep's own times sheet: only wind-down and wake-up, instead of the whole settings panel.
export function EveningTimes({ a }: { a: AppState }) {
  const [open, setOpen] = useState(false), [saving, setSaving] = useState(false), [error, setError] = useState("");
  const [bedtime, setBedtime] = useState(a.settings.bedtime), [wakeTime, setWakeTime] = useState(a.settings.wakeTime);
  function start() { setBedtime(a.settings.bedtime); setWakeTime(a.settings.wakeTime); setError(""); setOpen(true); }
  async function save(event: FormEvent) {
    event.preventDefault(); if (saving) return;
    setSaving(true); setError("");
    const problem = await a.saveSleepTimes(bedtime, wakeTime);
    setSaving(false);
    if (problem) setError(problem); else setOpen(false);
  }
  return <>
    <Button className="light-button" onClick={start}>Change times</Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="entry-dialog">
      <DialogHeader><DialogTitle>Your evening</DialogTitle><DialogDescription>Daywell uses these times for your wind-down and to fill in your sleep log.</DialogDescription></DialogHeader>
      <form onSubmit={save}>
        <div className="two-fields"><Field label="Wind down at"><input type="time" required value={bedtime} onChange={e => setBedtime(e.target.value)}/></Field><Field label="Wake up at"><input type="time" required value={wakeTime} onChange={e => setWakeTime(e.target.value)}/></Field></div>
        {error && <p role="alert" className="form-error">{error}</p>}
        <Button className="full-button" type="submit" disabled={saving}>{saving ? <LoaderCircle className="spin"/> : <Check/>}Save times</Button>
      </form>
    </DialogContent></Dialog>
  </>;
}
