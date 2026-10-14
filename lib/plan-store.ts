import { liveSubscriptions, productFor, type PaidPlan, type Plan } from './plans.ts';

// Reading and setting plans in the subscriptions table (docs/plans.md). Store purchases will arrive through
// RevenueCat; until then, named testers can switch plans here without paying.

type Store = Pick<D1Database, 'prepare'>;
export type Subscription = {
  store: 'app_store' | 'play_store' | 'test';
  productId: string;
  plan: PaidPlan;
  status: 'active' | 'grace' | 'cancelled';
  expiresAt: number;
  willRenew: boolean;
};

// The subscription behind the person's current plan, if they have one.
export async function currentSubscription(db: Store, userId: string, now = Date.now()): Promise<Subscription | null> {
  const row = await db.prepare(`SELECT store, product_id AS productId, plan, status, expires_at AS expiresAt, will_renew AS willRenew FROM subscriptions WHERE user_id=?1 AND ${liveSubscriptions} LIMIT 1`)
    .bind(userId, now).first<Omit<Subscription, 'willRenew'> & { willRenew: number }>();
  return row ? { ...row, expiresAt: Number(row.expiresAt), willRenew: Boolean(row.willRenew) } : null;
}

// DAYWELL_PLAN_TESTERS is a Worker secret listing tester addresses, separated by commas. Remove it at launch.
export function isPlanTester(email: string | undefined, testers: string | undefined) {
  if (!email || !testers) return false;
  return testers.split(',').map(address => address.trim().toLowerCase()).filter(Boolean).includes(email.trim().toLowerCase());
}

const testDays = 30;
// A tester's plan lasts 30 days and never renews by itself. Choosing 'none' removes it.
export async function setTestPlan(db: Store, userId: string, plan: Plan, now = Date.now()) {
  const id = `test:${userId}`;
  if (plan === 'none') {
    await db.prepare('DELETE FROM subscriptions WHERE id=?').bind(id).run();
    return;
  }
  await db.prepare("INSERT INTO subscriptions(id,user_id,store,product_id,plan,status,expires_at,will_renew,updated_at) VALUES(?,?,'test',?,?,'active',?,0,?) ON CONFLICT(id) DO UPDATE SET product_id=excluded.product_id, plan=excluded.plan, status='active', expires_at=excluded.expires_at, updated_at=excluded.updated_at")
    .bind(id, userId, productFor(plan, 'month'), plan, now + testDays * 24 * 60 * 60 * 1000, now).run();
}
