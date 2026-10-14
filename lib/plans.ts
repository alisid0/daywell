// The two plans (owner decisions, 12–13 October 2026; docs/plans.md). Daywell is everything by hand; Daywell Plus
// adds the AI and Daywell's recordings. There is no free trial. Prices are the UK prices; the stores show each person
// their own currency once purchases are connected.

export const paidPlans = ['daywell', 'plus'] as const;
export type PaidPlan = typeof paidPlans[number];
export type Plan = PaidPlan | 'none';
export type Period = 'month' | 'year';

export const plans = {
  daywell: {
    name: 'Daywell',
    lead: 'Everything by hand',
    prices: { month: '£4.99', year: '£39.99', yearPerMonth: '£3.33' },
    features: [
      'Food basket, meal plans, shopping list and food log',
      'Workouts, walks and routines with timers',
      'Sleep log and a gentle look at your week',
      'Relax notes, calendar, timers and alarms',
    ],
  },
  plus: {
    name: 'Daywell Plus',
    lead: 'Everything in Daywell, plus:',
    prices: { month: '£9.99', year: '£79.99', yearPerMonth: '£6.67' },
    features: [
      'Ask in your own words, and Daywell does it in the app for you',
      'Food from a photo or a few words',
      'Meal plans from what’s in your basket',
      'Sleep sounds, guided sessions and kind words to listen to',
      'Spoken cues during workouts',
    ],
  },
} as const;

// Store product IDs, the same on the App Store and Google Play, all in one subscription group so people can move
// between plans. RevenueCat maps each one to its plan.
export const products = {
  daywell_monthly: { plan: 'daywell', period: 'month' },
  daywell_yearly: { plan: 'daywell', period: 'year' },
  daywell_plus_monthly: { plan: 'plus', period: 'month' },
  daywell_plus_yearly: { plan: 'plus', period: 'year' },
} as const satisfies Record<string, { plan: PaidPlan; period: Period }>;
export type ProductId = keyof typeof products;
export const productFor = (plan: PaidPlan, period: Period) =>
  (Object.keys(products) as ProductId[]).find(id => products[id].plan === plan && products[id].period === period)!;

// What each plan allows. Without a plan, people can still open, export and delete what they've saved.
export type Feature = 'save' | 'ai' | 'recordings';
const allowed: Record<Feature, readonly PaidPlan[]> = { save: ['daywell', 'plus'], ai: ['plus'], recordings: ['plus'] };
export const allows = (plan: Plan, feature: Feature) => plan !== 'none' && allowed[feature].includes(plan);
export const parsePlan = (value: string | null | undefined): Plan | null =>
  value === 'daywell' || value === 'plus' || value === 'none' ? value : null;

export const planMessages: Record<Feature, string> = {
  save: 'Choose a plan to save new things. Everything you’ve already saved is still here.',
  ai: 'This is part of Daywell Plus.',
  recordings: 'Recordings come with Daywell Plus.',
};
// The answer an API route gives when the person's plan doesn't include what they asked for.
export const planBlocked = (feature: Feature) => Response.json(
  { error: planMessages[feature], code: 'plan-required', needs: feature === 'save' ? 'daywell' : 'plus' },
  { status: 402, headers: { 'Cache-Control': 'no-store' } },
);

// Where people manage or cancel a store subscription.
export const manageUrls = {
  app_store: 'https://apps.apple.com/account/subscriptions',
  play_store: 'https://play.google.com/store/account/subscriptions',
} as const;

// The subscriptions that count now, best first: Plus beats Daywell. A cancelled subscription keeps working until it
// ends, and one in a payment grace period still counts. Queries bind the time now, in milliseconds, as ?2.
export const liveSubscriptions = "status IN ('active','grace','cancelled') AND expires_at>?2 ORDER BY CASE plan WHEN 'plus' THEN 0 ELSE 1 END, expires_at DESC";
