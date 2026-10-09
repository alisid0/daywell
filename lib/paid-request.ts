import { takeAllowances, returnAllowances, UserFacingError, type LimitedFeature } from './request-guards.ts';
export class AllowanceError extends UserFacingError {}

// Reserve immediately before dispatch. Refund explicit provider refusals; a timeout
// after dispatch is ambiguous, so never pretend it could not have incurred a cost.
export async function paidRequest(db: Parameters<typeof takeAllowances>[0], userId: string, feature: LimitedFeature, send: () => Promise<Response>, signal?: AbortSignal) {
  signal?.throwIfAborted();
  const now = Date.now(), uses = [[userId, feature]] as const;
  if (await takeAllowances(db, uses, now)) throw new AllowanceError(feature === 'capture' ? 'You’ve used today’s photo and voice checks. Typing an entry still works, and checks reset tomorrow.' : 'The recorded-reply picker has reached today’s allowance.');
  if (signal?.aborted) { await returnAllowances(db, uses, now); signal.throwIfAborted(); }
  const response = await send();
  if (!response.ok) await returnAllowances(db, uses, now);
  return response;
}
