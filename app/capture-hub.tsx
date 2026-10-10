"use client";
import { useEffect, useRef, useState } from "react";
import { Camera, Mic, Square, Volume2, Check, Keyboard, RotateCcw, ShoppingBasket } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { today, type Entry } from "@/lib/daywell";
import { mealOrigins, resizeCapturedMeal } from "@/lib/food-tracking";
import type { FoodAction } from "@/lib/food-client";
import type { AppState } from "./use-daywell";
import type { MealProposal } from "@/lib/food-journey";
import { PrivacyDetails } from "./privacy-details";
import { useFoodNarration } from "./use-food-narration";
import { foodNarration, foodDraftDetail } from "@/lib/food-narration";
import { PlanCoverage, PlanGuide } from "./food-plan-journey";

type Mode = "meal" | "basket" | "grocery" | "plan";
type CaptureStart = { mode?: string; intent?: string; text?: string; planStart?: string; planCount?: number; planMeal?: string };
type StockInput = Extract<FoodAction, { type: "stock.add" }>["items"][number];
type Draft = { summary: string; question: string | null; entries: Entry[]; basket?: StockInput[]; plans?: MealProposal[]; transcript?: string };
const choices: [Mode, string][] = [["meal", "Meal or drink"], ["basket", "Food basket"], ["grocery", "Shopping list"]];
const capture = (mode: Mode, intent: "photo" | "voice") => window.dispatchEvent(new CustomEvent("daywell-capture", { detail: { mode, intent } }));

export function FoodCaptureCard({ a }: { a: AppState }) {
  const [mode, setMode] = useState<Mode>("meal");
  return <section className="food-capture-card" aria-labelledby="food-capture-title">
    <span className="food-eyebrow">A picture. A few words. A little less effort.</span>
    <h2 id="food-capture-title">Show me. Tell me.</h2>
    <p>{mode === "meal" ? "Snap your meal, then check the portion before saving." : mode === "basket" ? "Show what you have. We’ll leave uncertain amounts for you to check." : "Show your list or say what to pick up."}</p>
    <div className="capture-choices" role="group" aria-label="What are you sharing?">{choices.map(([id, label]) => <button type="button" key={id} aria-pressed={mode === id} onClick={() => setMode(id)}>{label}</button>)}</div>
    <div className="capture-primary-actions"><button className="well-button capture-shutter" onClick={() => capture(mode, "photo")}><Camera size={26}/>Take a photo</button><button className="well-button well-secondary" onClick={() => capture(mode, "voice")}><Mic size={24}/>Tell Daywell</button></div>
    <small>Review first. Save when it looks right.</small>
    <button className="well-text-button capture-manual" onClick={() => { if (mode === "meal") a.openEditor("food"); else if (mode === "grocery") a.openEditor("grocery"); else { a.food.setView("basket"); a.food.open({ type: "stock.set", item: { id: crypto.randomUUID(), ingredient: "", quantity: null, unit: "g", bestBefore: null } }); } }}><Keyboard size={15}/>Add by hand instead</button>
  </section>;
}

export function CaptureHub({ a }: { a: AppState }) {
  const narration = useFoodNarration();
  const clearNarration = narration.clear;
  const [open, setOpen] = useState(false), [mode, setMode] = useState<Mode>("meal");
  const [planOptions, setPlanOptions] = useState({start:today(),count:2,meal:"Dinner"});
  const [mealOrigin, setMealOrigin] = useState<keyof typeof mealOrigins>("home");
  const [connected, setConnected] = useState<boolean | null>(null);
  const [photo, setPhoto] = useState<File | null>(null), [preview, setPreview] = useState<string | null>(null);
  const [text, setText] = useState(""), [typed, setTyped] = useState(false), [result, setResult] = useState<Draft | null>(null);
  const [context, setContext] = useState(""), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false), [seconds, setSeconds] = useState(0), [audio, setAudio] = useState<File | null>(null);
  const [saved, setSaved] = useState(false), [consumed, setConsumed] = useState(false), [uncertain, setUncertain] = useState(false);
  const picker = useRef<HTMLInputElement>(null), upload = useRef<HTMLInputElement>(null);
  const recorder = useRef<MediaRecorder | null>(null), stream = useRef<MediaStream | null>(null), timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const abort = useRef<AbortController | null>(null), epoch = useRef(0), lock = useRef(false), micLock = useRef(false), micEpoch = useRef(0);
  const beginRef = useRef<(detail: CaptureStart) => void>(() => {});
  useEffect(() => { clearNarration(); }, [result, clearNarration]);

  function stopRecording() {
    micEpoch.current++;
    if (recorder.current) { recorder.current.onstop = null; recorder.current.onerror = null; if (recorder.current.state === "recording") recorder.current.stop(); recorder.current = null; }
    stream.current?.getTracks().forEach(track => track.stop()); stream.current = null;
    if (timer.current) clearInterval(timer.current); timer.current = null;
  }
  function close() {
    epoch.current++; abort.current?.abort(); stopRecording(); lock.current = false; micLock.current = false;
    setOpen(false); setRecording(false); setBusy(false); setPhoto(null); setPreview(null); setAudio(null); setResult(null); setText(""); setContext(""); setTyped(false); setSaved(false); setConsumed(false); setUncertain(false); setError("");
    narration.clear();
  }
  async function checkConnection() {
    try { const r = await fetch("/api/capture", { cache: "no-store" }); const j = await r.json() as {connected?: boolean}; setConnected(r.ok && j.connected === true); }
    catch { setConnected(false); }
  }
  useEffect(() => {
    queueMicrotask(() => { void checkConnection(); });
    const begin = (event: Event) => beginRef.current((event as CustomEvent).detail || {});
    const stop = () => { stopRecording(); setRecording(false); micLock.current = false; };
    const hide = () => { if (document.hidden) stop(); };
    window.addEventListener("daywell-capture", begin); window.addEventListener("daywell-stop-voice", stop); document.addEventListener("visibilitychange", hide);
    return () => { epoch.current++; abort.current?.abort(); stopRecording(); window.removeEventListener("daywell-capture", begin); window.removeEventListener("daywell-stop-voice", stop); document.removeEventListener("visibilitychange", hide); };
  }, []);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => { beginRef.current = detail => {
    if (lock.current) return;
    close(); setOpen(true); setMode(detail.mode === "basket" || detail.mode === "grocery" || detail.mode === "plan" ? detail.mode : "meal");
    if (detail.text) { setText(detail.text.slice(0,6000)); setTyped(true); }
    setMealOrigin("home"); setPlanOptions({ start: detail.planStart || today(), count: detail.planCount || 2, meal: detail.planMeal || "Dinner" });
    window.dispatchEvent(new Event("daywell-stop-voice"));
    if (detail.intent === "photo") picker.current?.click();
    // Voice begins on the labelled record button, after the sharing notice is visible.
  }; });
  async function choosePhoto(file: File) {
    narration.clear(); const token = epoch.current; setError("");
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 15 * 1024 * 1024) { setError("Choose a JPEG, PNG or WebP photo under 15 MB."); return; }
    setBusy(true); lock.current = true;
    try {
      const bitmap = await createImageBitmap(file); const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas"); canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", .85));
      if (!blob) throw Error("Couldn’t open that photo. Try another one.");
      if (epoch.current !== token) return;
      setPhoto(new File([blob], "food.jpg", { type: "image/jpeg" })); setPreview(URL.createObjectURL(blob)); setResult(null); setContext(""); setConsumed(false); setAudio(null);
    } catch { if (epoch.current === token) setError("Couldn’t open that photo. Try another one."); }
    finally { if (epoch.current === token) { setBusy(false); lock.current = false; } }
  }
  async function understand(recorded?: File) {
    if (lock.current) return;
    if (!connected) { setError("Photo and voice recognition are unavailable right now. You can still add your food by hand."); return; }
    narration.clear(); const token = epoch.current; lock.current = true; setBusy(true); setError(""); setResult(null); setConsumed(false);
    abort.current = new AbortController();
    try {
      const form = new FormData(); form.set("date", today()); form.set("time", new Date().toLocaleTimeString()); form.set("mode", mode); form.set("context", context); form.set("text", mode === "plan" ? text || "Suggest meals from my saved basket for the selected number of meals, one person." : `${text}\nMeal origin: ${mealOrigin}.`);
      form.set("planStart",planOptions.start); form.set("planCount",String(planOptions.count)); form.set("planMeal",planOptions.meal);
      if (photo) form.set("image", photo); if (recorded) form.set("audio", recorded);
      const r = await fetch("/api/capture", { method: "POST", body: form, signal: abort.current.signal }); const value: Draft & { error?: string } = await r.json();
      if (!r.ok) throw Error(value.error || "Couldn’t understand that. Your capture is here to retry.");
      if (epoch.current !== token) return;
      setResult({...value,entries:value.entries.map(entry=>entry.kind==="food"?{...entry,data:{...entry.data,mealOrigin}}:entry)}); setContext(`${context}\nUser: ${value.transcript || text || "Photo"}\nDraft: ${JSON.stringify(value)}`.slice(-8000)); setText(""); setAudio(null); setTyped(false);
    } catch (e) { if (epoch.current === token && !(e instanceof Error && e.name === "AbortError")) setError(e instanceof Error ? e.message : "Please try again."); }
    finally { if (epoch.current === token) { setBusy(false); lock.current = false; } }
  }
  async function startRecording() {
    if (micLock.current || lock.current || recording) return;
    if (!connected) { setError("Voice is unavailable right now. You can add your food by hand."); return; }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { setError("Recording needs a supported browser with microphone access. The buttons and manual entry still work."); return; }
    window.dispatchEvent(new Event("daywell-stop-voice")); window.dispatchEvent(new Event("daywell-stop-library-audio")); window.dispatchEvent(new Event("daywell-stop-guided-audio"));
    micLock.current = true; const micToken = micEpoch.current; const token = epoch.current; setError("");
    try {
      const device = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (epoch.current !== token || micEpoch.current !== micToken || document.hidden) { device.getTracks().forEach(track => track.stop()); return; }
      stream.current = device;
      const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find(type => MediaRecorder.isTypeSupported(type));
      const rec = new MediaRecorder(device, mimeType ? { mimeType } : undefined); recorder.current = rec;
      const chunks: BlobPart[] = []; let size = 0;
      rec.ondataavailable = e => { if (e.data.size) { chunks.push(e.data); size += e.data.size; if (size > 8 * 1024 * 1024 && rec.state === "recording") rec.stop(); } };
      rec.onstop = () => {
        stopRecording(); setRecording(false);
        if (epoch.current !== token) return;
        if (size > 8 * 1024 * 1024) { setError("That recording was too large. Please try a shorter one."); return; }
        const file = new File(chunks, rec.mimeType.includes("mp4") ? "food-voice.mp4" : "food-voice.webm", { type: rec.mimeType }); setAudio(file); void understand(file);
      };
      rec.onerror = () => { stopRecording(); setRecording(false); setError("Recording stopped. Please try again."); };
      rec.start(250); setSeconds(0); setRecording(true); const started = Date.now();
      timer.current = setInterval(() => { const elapsed = Math.floor((Date.now() - started) / 1000); setSeconds(elapsed); if (elapsed >= 30 && rec.state === "recording") rec.stop(); }, 250);
    } catch { if (epoch.current === token) { stopRecording(); setRecording(false); setError("Microphone access wasn’t available. Allow it in your browser, or add by hand."); } }
    finally { if (epoch.current === token) micLock.current = false; }
  }
  async function confirm() {
    if (lock.current || !result || result.question) return;
    if (result.plans?.length) {
      if (!a.food.fresh || a.food.busy || a.food.pending || a.food.draft || a.food.recovered) { setError("Finish your current basket change first. Your proposed meals are still here."); return; }
      const plans=result.plans; close(); a.setActive("eat"); a.food.setView("meals"); a.food.open({type:"plan.add",plans}); return;
    }
    if (result.basket?.length) {
      if (!a.food.fresh || a.food.busy || a.food.pending || a.food.draft || a.food.recovered) { setError("Finish your current basket draft or refresh the basket first. This capture is still here."); return; }
      const items = result.basket; close(); a.setActive("eat"); a.food.setView("basket"); a.food.open({ type: "stock.add", items }); return;
    }
    if (!result.entries.length || (result.entries.some(e => e.kind === "food") && !consumed)) return;
    const token = epoch.current; lock.current = true; setBusy(true); setError("");
    const done = await a.save(result.entries);
    if (epoch.current !== token) return;
    lock.current = false; setBusy(false);
    if (done) { setSaved(true); setUncertain(false); setResult(null); setPhoto(null); setPreview(null); setAudio(null); setContext(""); }
    else { setUncertain(true); setError("The save couldn’t be confirmed. Retry these same entries safely, or check your saved history before starting again."); }
  }
  const hasDraft = !!result && !result.question && (result.entries.length > 0 || !!result.basket?.length || !!result.plans?.length);
  const hasMeal = !!result?.entries.some(entry => entry.kind === "food");
  return <>
    <input ref={picker} hidden aria-label="Take a food photo" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={e => { const file = e.target.files?.[0]; if (file) void choosePhoto(file); e.target.value = ""; }}/>
    <input ref={upload} hidden aria-label="Choose a food photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { const file = e.target.files?.[0]; if (file) void choosePhoto(file); e.target.value = ""; }}/>
    <Dialog open={open} onOpenChange={value => { if (!value) close(); }}><DialogContent className="food-capture-dialog"><DialogHeader><DialogTitle>{saved ? "A little less to remember." : result?.question ? "One quick question." : hasDraft ? "Does this look right?" : mode === "plan" ? "Let’s make a few meals." : choices.find(([id]) => id === mode)?.[1]}</DialogTitle><DialogDescription>{saved ? "Your confirmed entries are saved." : hasDraft ? "Check the details before saving." : "A photo or a few words is all you need."}</DialogDescription></DialogHeader>
      {connected === false && <div className="capture-connection" role="status"><strong>Photo and voice recognition are unavailable right now.</strong><p>Try again shortly, or add your food by hand.</p><button className="well-text-button" onClick={() => void checkConnection()}><RotateCcw size={15}/>Try again</button><button className="well-text-button" onClick={() => { close(); if (mode === "basket") { a.setActive("eat"); a.food.open({ type: "stock.set", item: { id: crypto.randomUUID(), ingredient: "", quantity: null, unit: "g", bestBefore: null } }); } else if(mode === "plan") { a.setActive("eat"); a.food.setView("meals"); } else a.openEditor(mode === "meal" ? "food" : "grocery"); }}>Add by hand</button></div>}
      {saved ? <div className="capture-finished"><Check size={34}/><button className="well-button" onClick={close}>Back to my day</button></div> : <>
        {mode === "meal" && !hasDraft && !result?.question && <div className="capture-choices" role="group" aria-label="Where is your meal from?">{Object.entries(mealOrigins).map(([id,label])=><button type="button" key={id} disabled={busy || recording} aria-pressed={mealOrigin===id} onClick={()=>setMealOrigin(id as keyof typeof mealOrigins)}>{label}</button>)}</div>}
        {mode === "plan" && !hasDraft && !result?.question && <><p>Up to {planOptions.count} {planOptions.meal.toLowerCase()} meals for one person, starting {planOptions.start}. Say any preferences or exclusions.</p><button className="well-button" disabled={busy || !connected} onClick={()=>void understand()}>Suggest from my saved basket</button></>}
        {preview && <figure className="food-photo-preview"><img src={preview} alt="Your food photo for review"/>{!busy && !recording && !uncertain && <button className="well-text-button" onClick={() => upload.current?.click()}>Choose another photo</button>}</figure>}
        {result && <section className="capture-review"><div aria-live="polite"><p>{result.summary}</p>{result.question && <p><strong>{result.question}</strong></p>}</div><button className="well-text-button" disabled={recording || busy} onClick={() => void narration.speak(foodNarration(result))}><Volume2 size={16}/>{narration.status === "loading" ? "Cancel" : narration.status === "playing" ? "Stop reading" : "Hear this"}</button>{narration.status === "loading" && <small role="status">Getting your readout ready…</small>}{narration.error && <p role="alert">{narration.error}</p>}{result.transcript && <small>You said: “{result.transcript}”</small>}
          {result.entries.map(entry => <article className="capture-draft-item" key={entry.id}><strong>{entry.data.title}</strong><small>{entry.kind === "food" ? foodDraftDetail(entry.data) : entry.data.quantity}</small>{entry.kind === "food" && <div className="capture-choices" role="group" aria-label={`Meal for ${entry.data.title}`}>{["Breakfast", "Lunch", "Dinner", "Snack"].map(meal => <button key={meal} disabled={busy || recording || uncertain} aria-pressed={entry.data.meal === meal} onClick={() => setResult({ ...result, entries: result.entries.map(old => old.id === entry.id ? { ...old, data: { ...old.data, meal } } : old) })}>{meal}</button>)}</div>}</article>)}
          {result.plans?.map(plan=><article className="capture-draft-item" key={plan.id}><strong>{plan.title}</strong><small>{plan.date} · {plan.meal} · one person</small><small>{plan.ingredients.map(item=>`${item.quantity} ${item.unit} ${item.ingredient}`).join(" · ")}</small><PlanGuide plan={plan}/></article>)}
          {!!result.plans?.length && a.food.snapshot && <PlanCoverage state={a.food.snapshot.state} plans={result.plans}/>}
          {result.basket?.map(item => <article className="capture-draft-item" key={item.id}><ShoppingBasket size={16}/><strong>{item.ingredient}</strong><small>{item.quantity === null ? "Amount to check" : `${item.quantity} ${item.unit}`}</small></article>)}
          {hasMeal && <><div className="capture-choices" role="group" aria-label="Adjust the portion shown">{[.5,2].map(factor=><button type="button" key={factor} disabled={busy || recording || uncertain} onClick={()=>{try{narration.clear();const entries=result.entries.map(entry=>entry.kind==="food"?resizeCapturedMeal(entry,factor):entry);setResult({...result,entries,summary:"Portion adjusted. "+entries.filter(entry=>entry.kind==="food").map(entry=>`${entry.data.title}: ${foodDraftDetail(entry.data)}`).join(". ")});setConsumed(false);}catch{setError("That portion is too small or large. Say a correction instead.");}}}>{factor===.5?"Half of the shown portion":"Twice the shown portion"}</button>)}</div><p className="food-caption">Nutrition is approximate. Say what changed if the portion looks wrong. Sugar stays unknown without an amount from you or a readable label.</p><label className="food-checkbox"><input type="checkbox" checked={consumed} disabled={busy || recording || uncertain} onChange={e => setConsumed(e.target.checked)}/>I consumed this and checked the portion shown</label></>}
        </section>}
        {busy && <p role="status">{uncertain ? "Checking your save…" : "One moment…"}</p>}
        {recording && <div className="capture-recording" role="status"><Mic/><span>Recording your description · {seconds}s (30s maximum)</span><button className="well-button" onClick={() => recorder.current?.stop()}><Square size={16}/>Finished speaking</button></div>}
        {!busy && !recording && <>
          {hasDraft && <button className="well-button capture-confirm" disabled={hasMeal && !consumed} onClick={() => void confirm()}><Check size={18}/>{uncertain ? "Retry save safely" : result.plans?.length ? "Review meals & save" : result.basket?.length ? "Review basket items" : hasMeal ? "Save food consumed" : "Add to shopping list"}</button>}
          {!uncertain && <>{preview && !result && <><button className="well-button capture-confirm" onClick={() => void understand()}>Review this photo</button><p className="food-caption">No description needed.</p></>}<div className="capture-primary-actions">{!preview && !hasDraft && <button className="well-button well-secondary" onClick={() => picker.current?.click()}><Camera size={22}/>Take a photo</button>}<button className="well-button well-secondary" onClick={() => void startRecording()} disabled={connected === null}><Mic size={22}/>{hasDraft ? "Say a correction" : result?.question ? "Say your answer" : preview ? "Add a detail by voice" : "Start speaking"}</button></div>

          <div className="capture-backups">{!hasDraft && <button className="well-text-button" onClick={() => upload.current?.click()}>Choose from photos</button>}<button className="well-text-button" onClick={() => { setTyped(!typed); if (hasDraft) setResult(null); }}><Keyboard size={15}/>Type instead</button>{audio && <button className="well-text-button" onClick={() => void understand(audio)}>Retry recording</button>}</div>
          {typed && <form className="capture-text" onSubmit={e => { e.preventDefault(); void understand(); }}><label>Tell Daywell<input autoFocus maxLength={6000} value={text} onChange={e => setText(e.target.value)} placeholder={mode === "plan" ? "Two dinners for me, no mushrooms…" : mode === "basket" ? "I have six eggs and a bag of rice…" : "I had half of this for lunch…"}/></label><button className="well-button" disabled={!text.trim()}>Continue</button></form>}</>}
        </>}
      </>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <p className="food-caption">AI estimates. Nothing is saved until you confirm.</p><PrivacyDetails><p>Continuing with a photo or description sends it to OpenAI. Starting a voice description records up to 30 seconds and sends it when you finish. Tap Finished speaking whenever you’re ready.</p>{mode === "plan" && <p>Meal suggestions also use your saved basket and the amounts reserved for other meals.</p>}<p>Hear this shares the review text with ElevenLabs to read it aloud in Daywell’s voice. You can request up to 20 new readouts a day; replaying the same review does not use another.</p><p>Daywell saves the entries you confirm, not the original photo or recording. Provider processing and retention are covered by <a href="https://openai.com/policies/privacy-policy/" target="_blank" rel="noreferrer">OpenAI’s privacy policy</a> and <a href="https://elevenlabs.io/privacy-policy" target="_blank" rel="noreferrer">ElevenLabs’ privacy policy</a>.</p></PrivacyDetails>
    </DialogContent></Dialog>
  </>;
}
