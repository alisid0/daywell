import type { HostAction } from './host.ts';
import { timerSnapshot, type TimerState } from './timer-context.ts';

export type TimerOffer = {
  id: string;
  action: Extract<HostAction, { type: 'activity' }>;
  version: string | null;
  replaces: boolean;
  createdAt: number;
};

export function timerConsent(text: string) {
  const value = text.trim().toLowerCase().replace(/[.!]+$/, '').trim();
  if (/^(?:yes|yeah|yep|ok|okay)(?:[, ]+(?:please|go ahead|start (?:it|the timer)))?$|^(?:start (?:it|the timer)|go ahead|do it)(?: please)?$/.test(value)) return 'start';
  if (/^(?:(?:yes|ok|okay)[, ]+)?replace (?:it|my timer|the (?:current )?timer)(?: please)?$/.test(value)) return 'replace';
  if (/^(?:no|no thanks|no thank you|cancel(?: (?:it|the timer))?|never ?mind|not now)$/.test(value)) return 'cancel';
  return 'other';
}

// Only actual user input can consume this offer. Tool arguments and agent speech cannot.
// Offers last for one short exchange in this visit; no transcript is persisted.
export class TimerConfirmation {
  offer: TimerOffer | null = null;
  prepare(actions: HostAction[], version: string | null, timer: TimerState | null, id: string, now = Date.now()) {
    this.offer = actions.length === 1 && actions[0].type === 'activity'
      ? { id, action: { ...actions[0] }, version, replaces: !!timer && ['running', 'paused'].includes(timerSnapshot(timer, now).state), createdAt: now }
      : null;
    return this.offer;
  }
  clear() { this.offer = null; }
  claim(input: string, now = Date.now(), button = false): { kind: 'confirmed'; offer: TimerOffer } | { kind: 'replace' | 'expired' | 'cancelled' | 'none' } {
    const offer = this.offer;
    if (!offer) return { kind: 'none' };
    if (now < offer.createdAt || now - offer.createdAt > 120_000) { this.clear(); return { kind: 'expired' }; }
    const consent = timerConsent(input);
    if (!button && consent === 'other') { this.clear(); return { kind: 'none' }; }
    if (!button && consent === 'cancel') { this.clear(); return { kind: 'cancelled' }; }
    if (!button && offer.replaces && consent !== 'replace') return { kind: 'replace' };
    // Consume before any asynchronous save, preventing echoed transcripts/double clicks.
    this.clear();
    return { kind: 'confirmed', offer };
  }
}
