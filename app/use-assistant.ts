"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { today } from "@/lib/daywell";
import type { AssistantArea, AssistantReply } from "@/lib/assistant";
import type { AppState } from "./use-daywell";

// The Plus assistant's side of a visit (lib/assistant.ts): whether it's connected, what it may look at, and this
// visit's conversation. The conversation lives only here, in memory. It goes with each question and is forgotten
// when the person ends the chat or leaves Daywell; nothing about it is stored.
type Turn = { role: "user" | "assistant"; text: string };
export type AssistantAnswer = AssistantReply & { asked: string };
const areas = ["today", "eat", "move", "sleep", "relax", "calendar"];
const two = (n: number) => String(n).padStart(2, "0");
let connection: Promise<boolean> | null = null;

export function useAssistant(a: AppState) {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [answer, setAnswer] = useState<AssistantAnswer | null>(null);
  const [thinking, setThinking] = useState(false), [error, setError] = useState("");
  const history = useRef<Turn[]>([]), abort = useRef<AbortController | null>(null), active = useRef(a.active);
  useEffect(() => { active.current = a.active; }, [a.active]);
  useEffect(() => {
    let live = true;
    connection ??= fetch("/api/assistant", { cache: "no-store" }).then(response => response.ok ? response.json() as Promise<{ connected?: boolean }> : null).then(body => body?.connected === true, () => false);
    void connection.then(value => { if (!value) connection = null; if (live) setConnected(value); });
    return () => { live = false; abort.current?.abort(); };
  }, []);
  // Returns the reply, "consent" when the person hasn't chosen what it may see yet, or null when it couldn't answer.
  const ask = useCallback(async (text: string): Promise<AssistantReply | "consent" | null> => {
    abort.current?.abort();
    const controller = new AbortController(); abort.current = controller;
    const messages = [...history.current, { role: "user" as const, text: text.trim().slice(0, 1200) }].slice(-12);
    setThinking(true); setError("");
    try {
      const now = new Date();
      const response = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, date: today(), time: `${two(now.getHours())}:${two(now.getMinutes())}`, where: areas.includes(active.current) ? active.current : "today" }),
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(40_000)]) });
      const body = await response.json().catch(() => null) as (AssistantReply & { error?: string; code?: string }) | null;
      if (controller.signal.aborted) return null;
      if (response.status === 403 && body?.code === "CONSENT_NEEDED") return "consent";
      if (!response.ok || typeof body?.reply !== "string") throw Error(body?.error || "Couldn’t answer that just now. Please try again.");
      const reply: AssistantReply = { reply: body.reply, companion: body.companion, looked: body.looked ?? [], steps: body.steps ?? [], chips: body.chips ?? [] };
      history.current = [...messages, { role: "assistant" as const, text: reply.reply }].slice(-12);
      setAnswer({ ...reply, asked: text.trim() });
      return reply;
    } catch (problem) {
      if (controller.signal.aborted) return null;
      setError(problem instanceof Error && problem.name !== "TimeoutError" ? problem.message : "That took too long. Please ask again.");
      return null;
    } finally { if (abort.current === controller) { abort.current = null; setThinking(false); } }
  }, []);
  // End the chat: the conversation is forgotten.
  const end = useCallback(() => { abort.current?.abort(); abort.current = null; history.current = []; setAnswer(null); setThinking(false); setError(""); }, []);
  // The person's choice of what it may look at. Agreeing records when; turning everything off withdraws it.
  async function allow(chosen: AssistantArea[]) {
    return a.saveDetails({ assistantAreas: chosen, assistantConsentAt: a.settings.assistantConsentAt ?? new Date().toISOString() });
  }
  async function withdraw() { end(); return a.saveDetails({ assistantAreas: [], assistantConsentAt: null }); }
  return { connected, consented: !!a.settings.assistantConsentAt, areas: a.settings.assistantAreas, answer, thinking, error, ask, end, allow, withdraw, clearError: () => setError("") };
}
