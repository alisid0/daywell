// What the sign-in screens send, and what the server's answers mean for the person (docs/sign-in.md).
// The server writes its own messages; these cover only what it can't say, such as being offline.

export type SignInReply = { ok: boolean; status: number; error: string; triesLeft?: number; created?: boolean };

export const offline = "You seem to be offline. Check your connection, then try again.";
export const cantSend = "We couldn't send a code just now. Try again in a few minutes.";
export const cantCheck = "We couldn't check the code just now. Try again in a minute.";

// A quick check before asking for a code; the server checks properly.
export const looksLikeEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
// Keeps only digits, so a pasted "246 810" or "Your code is 246810" still works.
export const codeDigits = (value: string) => value.replace(/\D/g, '').slice(0, 6);

export async function signInRequest(path: string, body: unknown, fallback: string, send: typeof fetch = fetch): Promise<SignInReply> {
  let response: Response;
  try {
    response = await send(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  } catch {
    return { ok: false, status: 0, error: offline };
  }
  const parsed: unknown = await response.json().catch(() => null);
  const data = parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {};
  return {
    ok: response.ok && data.ok === true,
    status: response.status,
    error: typeof data.error === 'string' && data.error ? data.error : fallback,
    triesLeft: typeof data.triesLeft === 'number' ? data.triesLeft : undefined,
    created: data.created === true,
  };
}

export function codeProblem(reply: SignInReply) {
  if (reply.triesLeft === 0) return "That code isn't right, and it has now expired. Ask for a new one.";
  if (reply.triesLeft !== undefined) return `${reply.error} ${reply.triesLeft} ${reply.triesLeft === 1 ? 'try' : 'tries'} left.`;
  return reply.error;
}
