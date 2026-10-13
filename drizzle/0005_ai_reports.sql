-- Reports of AI-written replies and food estimates (owner approval, 12 October 2026; Google Play's AI-generated
-- content policy). Each keeps the AI text, a reason and an optional note for 90 days. See docs/ai-reports.md.
-- Migration 0004 is reserved for account closures in PR #47.
CREATE TABLE ai_reports (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  source TEXT NOT NULL CHECK(source IN ('conversation', 'food-estimate', 'meal-plan')),
  reason TEXT NOT NULL CHECK(reason IN ('offensive', 'unsafe', 'wrong', 'other')),
  reply TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT ''
);
--> statement-breakpoint
CREATE INDEX ai_reports_user_created ON ai_reports(user_id, created_at);
--> statement-breakpoint
CREATE INDEX ai_reports_created ON ai_reports(created_at);
