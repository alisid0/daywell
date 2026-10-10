"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { FADE_OUT_SECONDS, linearGain, loopPoints, sleepSoundGroups, sleepSoundUrl, sleepSounds, stopAfterMinutes, stopPlan, type SleepSound } from "@/lib/sleep-sounds";

type Engine = { context: AudioContext; master: GainNode; buffers: Map<string, Promise<AudioBuffer>> };
type Playing = { sound: SleepSound; sources: AudioBufferSourceNode[]; gain: GainNode };
const soundById = new Map(sleepSounds.map(sound => [sound.id, sound]));
const stopLabel = (minutes: number) => minutes === 0 ? "Off" : minutes === 60 ? "1 hour" : `${minutes} min`;
const clockTimeAfter = (seconds: number) => Date.now() + seconds * 1000;

// Sounds for the quiet corner: one looping sound at a time, with gentle fades between them. It keeps playing while the
// screen is off; "Stop after" fades out on the audio clock, so a sleeping page still stops on time. Leaving stops it.
export function SleepSounds() {
  const [selected, setSelected] = useState(sleepSounds[0].id), [playing, setPlaying] = useState(false), [loading, setLoading] = useState(false);
  const [volume, setVolume] = useState(0.7), [stopAfter, setStopAfter] = useState(0), [endsAt, setEndsAt] = useState<number | null>(null), [error, setError] = useState("");
  const engine = useRef<Engine | null>(null), current = useRef<Playing | null>(null), request = useRef(0), endTimer = useRef(0), stopAt = useRef<number | null>(null);

  function ensureEngine() {
    if (!engine.current) {
      const context = new AudioContext(), master = context.createGain();
      master.gain.value = volume; master.connect(context.destination);
      engine.current = { context, master, buffers: new Map() };
    }
    return engine.current;
  }
  function bufferFor(e: Engine, sound: SleepSound) {
    let pending = e.buffers.get(sound.id);
    if (!pending) {
      pending = fetch(sleepSoundUrl(sound)).then(response => { if (!response.ok) throw Error("unavailable"); return response.arrayBuffer(); }).then(data => e.context.decodeAudioData(data));
      pending.catch(() => e.buffers.delete(sound.id));
      e.buffers.set(sound.id, pending);
    }
    return pending;
  }
  function fadeAway(item: Playing | null, seconds = 0.8) {
    if (!item || !engine.current) return;
    const now = engine.current.context.currentTime;
    item.gain.gain.cancelScheduledValues(now); item.gain.gain.setValueAtTime(item.gain.gain.value, now); item.gain.gain.linearRampToValueAtTime(0, now + seconds);
    for (const source of item.sources) source.stop(now + seconds + 0.05);
  }
  // Holds the sound's level, then fades it to silence by the "Stop after" time, on the audio thread.
  function applyStop(item: Playing) {
    if (!engine.current || stopAt.current === null) return;
    const now = engine.current.context.currentTime, end = stopAt.current, fadeFrom = Math.max(now + 1.2, end - FADE_OUT_SECONDS);
    item.gain.gain.setValueAtTime(linearGain(item.sound.gainDb), fadeFrom); item.gain.gain.linearRampToValueAtTime(0, Math.max(fadeFrom + 0.1, end));
  }
  const finish = useCallback(() => {
    window.clearTimeout(endTimer.current); stopAt.current = null; setEndsAt(null);
    const item = current.current; current.current = null; setPlaying(false);
    if (item) for (const source of item.sources) source.stop();
  }, []);
  function startTimer(minutes: number) {
    window.clearTimeout(endTimer.current); stopAt.current = null; setEndsAt(null);
    const plan = stopPlan(minutes);
    if (!plan || !engine.current || !current.current) return;
    stopAt.current = engine.current.context.currentTime + plan.end;
    setEndsAt(clockTimeAfter(plan.end));
    applyStop(current.current);
    endTimer.current = window.setTimeout(finish, plan.end * 1000 + 500);
  }
  async function play(id: string) {
    const sound = soundById.get(id);
    if (!sound) return;
    const e = ensureEngine(), ticket = ++request.current;
    setError(""); setLoading(true); setSelected(id);
    try {
      await e.context.resume();
      const buffer = await bufferFor(e, sound);
      if (ticket !== request.current) return;
      fadeAway(current.current);
      const gain = e.context.createGain(), now = e.context.currentTime, { start, end } = loopPoints(buffer.getChannelData(0), buffer.sampleRate);
      gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(linearGain(sound.gainDb), now + 1.2); gain.connect(e.master);
      // Layers replay the same loop offset in time (the temple drum plays twice, half a loop apart).
      const sources = (sound.layers ?? [0]).map(offset => {
        const source = e.context.createBufferSource();
        source.buffer = buffer; source.loop = true; source.loopStart = start; source.loopEnd = end;
        source.connect(gain); source.start(now, start + offset % (end - start));
        return source;
      });
      current.current = { sound, sources, gain };
      setPlaying(true);
      if (stopAt.current !== null) applyStop(current.current); else if (stopAfter) startTimer(stopAfter);
    } catch {
      if (ticket === request.current) setError("That sound couldn’t load. Check your connection and try again.");
    } finally {
      if (ticket === request.current) setLoading(false);
    }
  }
  function pause() {
    request.current++; fadeAway(current.current); current.current = null;
    window.clearTimeout(endTimer.current); stopAt.current = null; setEndsAt(null); setPlaying(false); setLoading(false);
  }
  function choose(id: string) { if (playing || loading) void play(id); else setSelected(id); }
  function changeStopAfter(minutes: number) {
    setStopAfter(minutes);
    const item = current.current, e = engine.current;
    if (!item || !e) return;
    const now = e.context.currentTime;
    item.gain.gain.cancelScheduledValues(now); item.gain.gain.setValueAtTime(item.gain.gain.value, now); item.gain.gain.linearRampToValueAtTime(linearGain(item.sound.gainDb), now + 0.5);
    startTimer(minutes);
  }
  function changeVolume(value: number) {
    setVolume(value);
    const e = engine.current;
    if (e) e.master.gain.setTargetAtTime(value, e.context.currentTime, 0.05);
  }
  useEffect(() => {
    // Back on screen: catch up with a "Stop after" that ended while the page slept.
    const wake = () => { if (!document.hidden && stopAt.current !== null && engine.current && engine.current.context.currentTime >= stopAt.current) finish(); };
    const requests = request, timer = endTimer, audio = engine, playingNow = current;
    document.addEventListener("visibilitychange", wake);
    return () => {
      document.removeEventListener("visibilitychange", wake);
      window.clearTimeout(timer.current); requests.current++;
      void audio.current?.context.close(); audio.current = null; playingNow.current = null;
    };
  }, [finish]);

  const active = playing || loading, chosen = soundById.get(selected)!;
  const timerNote = !stopAfter ? "" : endsAt
    ? `Stops at ${new Date(endsAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}, fading out over the last minute.`
    : `Stops ${stopAfter === 60 ? "an hour" : `${stopAfter} minutes`} after you press Play.`;
  return <section className="sleep-sounds" aria-labelledby="sleep-sounds-title">
    <h2 id="sleep-sounds-title">Sounds for rest and sleep</h2>
    {sleepSoundGroups.map(group => <div className="sleep-sounds-group" key={group.id}>
      <p id={`sleep-sounds-${group.id}`}>{group.label}</p>
      <div className="sleep-sounds-chips" role="group" aria-labelledby={`sleep-sounds-${group.id}`}>
        {sleepSounds.filter(sound => sound.group === group.id).map(sound => <button key={sound.id} type="button" aria-pressed={selected === sound.id} onClick={() => choose(sound.id)}>{sound.label}</button>)}
      </div>
    </div>)}
    <div className="sleep-sounds-row">
      <button type="button" className="well-button" aria-label={`${active ? "Pause" : "Play"} ${chosen.label}`} onClick={() => active ? pause() : void play(selected)}>{active ? <Pause size={17} aria-hidden="true" /> : <Play size={17} aria-hidden="true" />}{loading ? "Loading…" : playing ? "Pause" : "Play"}</button>
      <label className="sleep-sounds-volume">Volume<input type="range" min="0" max="1" step="0.01" value={volume} onChange={event => changeVolume(Number(event.target.value))} /></label>
    </div>
    <div className="sleep-sounds-group">
      <p id="sleep-sounds-stop">Stop after</p>
      <div className="sleep-sounds-chips" role="group" aria-labelledby="sleep-sounds-stop">
        {stopAfterMinutes.map(minutes => <button key={minutes} type="button" aria-pressed={stopAfter === minutes} onClick={() => changeStopAfter(minutes)}>{stopLabel(minutes)}</button>)}
      </div>
    </div>
    <p className="sleep-sounds-note" aria-live="polite">{timerNote}</p>
    <small>It fades out gently over the last minute. Some phones pause web sounds when the screen locks; the phone app will keep them going.</small>
    {error && <p role="alert" className="form-error">{error}</p>}
  </section>;
}
