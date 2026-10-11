// Deliberately small command vocabulary: unknown or negated speech changes nothing.
export function workoutCommand(value: string) {
  const text = value.toLowerCase().replace(/[.,!?]/g, "").replace(/\s+/g, " ").trim().replace(/^please /, "").replace(/ please$/, "");
  if (/^(done|done next|done finish|i have finished this step|i finished this step)$/.test(text)) return "done";
  if (/^(next|skip|skip this|next step)$/.test(text)) return "skip";
  if (/^(pause|pause timer|stop timer|take a break)$/.test(text)) return "pause";
  if (/^(start|start timer|continue|resume)$/.test(text)) return "start";
  if (/^(repeat|repeat that|say that again|what do i do)$/.test(text)) return "repeat";
  if (/^(easier|make it easier|easier please)$/.test(text)) return "easier";
  if (/^(stop|end|end routine|end workout|finish workout)$/.test(text)) return "end";
  return null;
}
