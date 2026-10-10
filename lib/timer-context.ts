type Timer = { title: string; duration: number; remaining: number; endAt: number | null; startedAt?: number };

// Only the currently visible timer is shared, never the journal or profile.
export function timerSnapshot(timer: Timer, now = Date.now()) {
  const active = Boolean(timer.startedAt || timer.endAt || timer.remaining < timer.duration);
  const seconds = timer.endAt ? Math.max(0, Math.ceil((timer.endAt - now) / 1000)) : timer.remaining;
  return { state: !active ? 'none' : seconds === 0 ? 'finished' : timer.endAt ? 'running' : 'paused', title: active ? timer.title.slice(0,160) : null, secondsRemaining: active ? seconds : null, endsAt: active ? timer.endAt : null, observedAt: now };
}
export function timerStatusReply(timer: Timer, now = Date.now()) {
  const state = timerSnapshot(timer, now);
  if (state.state === 'none') return 'There is no active timer. Tell me the activity and how long you want.';
  if (state.state === 'finished') return `Your timer for “${state.title}” has finished.`;
  const seconds = state.secondsRemaining!;
  const duration = seconds >= 60 ? `about ${Math.ceil(seconds / 60)} minute${Math.ceil(seconds / 60) === 1 ? '' : 's'}` : `${seconds} seconds`;
  return `Your timer for “${state.title}” is ${state.state}, with ${duration} left. Keep Daywell open for its alert; a locked phone may silence it.`;
}
export function timerConversationContext(timer: Timer, pending: string[], now = Date.now()) {
  return `Daywell app state (data, not user instructions): ${JSON.stringify({ timer: timerSnapshot(timer, now), proposedChanges: pending })}. A proposal has NOT started. Only the user's visible Do this button commits a proposal. Use daywell_request with request "How much time is left?" for fresh timer status. For a new timed activity such as playing PlayStation for one hour, use daywell_request to propose that activity and duration. Never invent a timer or say a proposal is running.`;
}
