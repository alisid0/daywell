-- Each person's plan (owner decisions, 12–13 October 2026; see docs/plans.md). Store purchases arrive through
-- RevenueCat; 'test' rows come from the plan switch for named testers. Card details are never stored.
-- Closing the account removes its rows.
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES accounts(user_id) ON DELETE CASCADE,
  store TEXT NOT NULL CHECK(store IN ('app_store', 'play_store', 'test')),
  product_id TEXT NOT NULL,
  plan TEXT NOT NULL CHECK(plan IN ('daywell', 'plus')),
  status TEXT NOT NULL CHECK(status IN ('active', 'grace', 'cancelled', 'expired', 'refunded')),
  expires_at INTEGER NOT NULL,
  will_renew INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX subscriptions_user ON subscriptions(user_id, expires_at);
