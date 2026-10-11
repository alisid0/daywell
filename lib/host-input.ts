// Ending or losing an AI session must not turn an unsent message (including
// "yes" or "undo") into a local command that changes the user's records.
export function hostInputRoute(text: string, status: string, aiChosen: boolean, busy = false) {
  if (!text.trim() || busy || status === "connecting" || status === "disconnecting") return "ignore";
  if (status === "connected") return "agent";
  return aiChosen ? "reconnect" : "command";
}
