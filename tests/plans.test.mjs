import test from 'node:test';
import assert from 'node:assert/strict';
import { allows, manageUrls, paidPlans, parsePlan, planBlocked, planMessages, plans, productFor, products } from '../lib/plans.ts';
import { currentSubscription, isPlanTester, setTestPlan } from '../lib/plan-store.ts';
import { readSession, sendSignInCode, verifySignInCode } from '../lib/email-sign-in.ts';
import { signInStore, testSecret } from './fixtures/sign-in-db.mjs';

const now = Date.parse('2026-10-14T09:00:00Z'), day = 86_400_000;

test('Daywell saves by hand; Plus adds the AI and recordings; no plan saves nothing new', () => {
  const table = Object.fromEntries(['none', 'daywell', 'plus'].map(plan => [plan, ['save', 'ai', 'recordings'].filter(feature => allows(plan, feature))]));
  assert.deepEqual(table, { none: [], daywell: ['save'], plus: ['save', 'ai', 'recordings'] });
  for (const value of ['daywell', 'plus', 'none']) assert.equal(parsePlan(value), value);
  for (const value of [null, undefined, '', 'Plus', 'free', 'premium']) assert.equal(parsePlan(value), null);
});

test('the plans match the owner’s prices, and each has a monthly and a yearly product', () => {
  assert.deepEqual(paidPlans, ['daywell', 'plus']);
  assert.deepEqual(plans.daywell.prices, { month: '£4.99', year: '£39.99', yearPerMonth: '£3.33' });
  assert.deepEqual(plans.plus.prices, { month: '£9.99', year: '£79.99', yearPerMonth: '£6.67' });
  assert.equal(plans.daywell.name, 'Daywell');
  assert.equal(plans.plus.name, 'Daywell Plus');
  for (const plan of paidPlans) for (const period of ['month', 'year']) {
    const id = productFor(plan, period);
    assert.deepEqual(products[id], { plan, period });
  }
  assert.equal(Object.keys(products).length, 4);
  assert.match(manageUrls.app_store, /^https:\/\/apps\.apple\.com\//);
  assert.match(manageUrls.play_store, /^https:\/\/play\.google\.com\//);
});

test('a route refuses a feature outside the plan with a plain message', async () => {
  const response = planBlocked('ai');
  assert.equal(response.status, 402);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { error: planMessages.ai, code: 'plan-required', needs: 'plus' });
  assert.equal((await planBlocked('save').json()).needs, 'daywell');
});

async function account(store, email = 'sam@example.com') {
  const sent = [];
  const settings = { secret: testSecret, review: null, send: async message => { sent.push(message); } };
  await sendSignInCode(store.db, settings, { email }, now);
  return verifySignInCode(store.db, settings, { email, code: sent.at(-1).subject.slice(0, 6) }, now);
}
const row = (id, userId, values) => ({ id, user_id: userId, store: 'app_store', product_id: 'daywell_monthly', plan: 'daywell', status: 'active', expires_at: now + day, will_renew: 1, updated_at: now, ...values });
function insert(sqlite, values) {
  const keys = Object.keys(values);
  sqlite.prepare(`INSERT INTO subscriptions(${keys.join(',')}) VALUES(${keys.map(() => '?').join(',')})`).run(...Object.values(values));
}

test('the best live subscription sets the plan: Plus first, cancelled until it ends, never expired or refunded', async () => {
  const store = signInStore();
  const { userId, token } = await account(store);
  const plan = async at => (await readSession(store.db, token, at ?? now)).plan;
  assert.equal(await plan(), 'none');
  insert(store.sqlite, row('a', userId, { status: 'expired' }));
  insert(store.sqlite, row('b', userId, { plan: 'plus', product_id: 'daywell_plus_monthly', status: 'refunded' }));
  assert.equal(await plan(), 'none');
  insert(store.sqlite, row('c', userId, { status: 'cancelled', will_renew: 0, expires_at: now + 5 * day }));
  assert.equal(await plan(), 'daywell', 'a cancelled plan lasts until it ends');
  insert(store.sqlite, row('d', userId, { plan: 'plus', product_id: 'daywell_plus_yearly', status: 'grace', expires_at: now + 2 * day }));
  assert.equal(await plan(), 'plus', 'Plus beats Daywell, and a payment grace period still counts');
  assert.deepEqual(await currentSubscription(store.db, userId, now), { store: 'app_store', productId: 'daywell_plus_yearly', plan: 'plus', status: 'grace', expiresAt: now + 2 * day, willRenew: true });
  assert.equal(await plan(now + 3 * day), 'daywell', 'when Plus ends, the Daywell subscription still counts');
  assert.equal(await plan(now + 6 * day), 'none');
  assert.equal(await currentSubscription(store.db, userId, now + 6 * day), null);
});

test('testers can switch plans for 30 days, and closing the account removes its subscriptions', async () => {
  const store = signInStore();
  const { userId, token } = await account(store);
  await setTestPlan(store.db, userId, 'plus', now);
  assert.deepEqual(await currentSubscription(store.db, userId, now), { store: 'test', productId: 'daywell_plus_monthly', plan: 'plus', status: 'active', expiresAt: now + 30 * day, willRenew: false });
  await setTestPlan(store.db, userId, 'daywell', now + day);
  assert.equal((await readSession(store.db, token, now + day)).plan, 'daywell');
  assert.equal(store.rows('subscriptions').length, 1, 'switching replaces the test plan');
  await setTestPlan(store.db, userId, 'none', now + day);
  assert.equal((await readSession(store.db, token, now + day)).plan, 'none');
  await setTestPlan(store.db, userId, 'plus', now);
  store.sqlite.prepare('DELETE FROM accounts WHERE user_id=?').run(userId);
  assert.deepEqual(store.rows('subscriptions'), []);
  await assert.rejects(setTestPlan(store.db, 'cf-access:someone', 'plus', now), 'only accounts from email sign-in hold subscriptions');
});

test('plan testers are named in a comma-separated list, ignoring case and spaces', () => {
  const list = ' Owner@Example.com, tester@example.com ,';
  assert.equal(isPlanTester('owner@example.com', list), true);
  assert.equal(isPlanTester('TESTER@example.com', list), true);
  assert.equal(isPlanTester('someone@example.com', list), false);
  assert.equal(isPlanTester('owner@example.com', undefined), false);
  assert.equal(isPlanTester(undefined, list), false);
  assert.equal(isPlanTester('', ','), false);
});
