-- Keep only an opaque account key and a receipt after erasing active records.
-- The tombstone must survive restores: see docs/account-lifecycle.md.
CREATE TABLE account_closures (
  user_id TEXT PRIMARY KEY NOT NULL,
  request_id TEXT NOT NULL UNIQUE,
  closed_at TEXT NOT NULL,
  provider_status TEXT NOT NULL DEFAULT 'not_automated' CHECK(provider_status='not_automated')
);
--> statement-breakpoint
CREATE TRIGGER settings_closed_insert BEFORE INSERT ON settings
WHEN EXISTS(SELECT 1 FROM account_closures WHERE user_id=NEW.user_id)
BEGIN SELECT RAISE(ABORT, 'DAYWELL_ACCOUNT_CLOSED'); END;
--> statement-breakpoint
CREATE TRIGGER settings_closed_update BEFORE UPDATE ON settings
WHEN EXISTS(SELECT 1 FROM account_closures WHERE user_id=NEW.user_id OR user_id=OLD.user_id)
BEGIN SELECT RAISE(ABORT, 'DAYWELL_ACCOUNT_CLOSED'); END;
--> statement-breakpoint
CREATE TRIGGER entries_closed_insert BEFORE INSERT ON entries
WHEN EXISTS(SELECT 1 FROM account_closures WHERE user_id=NEW.user_id)
BEGIN SELECT RAISE(ABORT, 'DAYWELL_ACCOUNT_CLOSED'); END;
--> statement-breakpoint
CREATE TRIGGER entries_closed_update BEFORE UPDATE ON entries
WHEN EXISTS(SELECT 1 FROM account_closures WHERE user_id=NEW.user_id OR user_id=OLD.user_id)
BEGIN SELECT RAISE(ABORT, 'DAYWELL_ACCOUNT_CLOSED'); END;
--> statement-breakpoint
CREATE TRIGGER food_spaces_closed_insert BEFORE INSERT ON food_spaces
WHEN EXISTS(SELECT 1 FROM account_closures WHERE user_id=NEW.user_id)
BEGIN SELECT RAISE(ABORT, 'DAYWELL_ACCOUNT_CLOSED'); END;
--> statement-breakpoint
CREATE TRIGGER food_spaces_closed_update BEFORE UPDATE ON food_spaces
WHEN EXISTS(SELECT 1 FROM account_closures WHERE user_id=NEW.user_id OR user_id=OLD.user_id)
BEGIN SELECT RAISE(ABORT, 'DAYWELL_ACCOUNT_CLOSED'); END;
--> statement-breakpoint
CREATE TRIGGER food_operations_closed_insert BEFORE INSERT ON food_operations
WHEN EXISTS(SELECT 1 FROM account_closures WHERE user_id=NEW.user_id)
BEGIN SELECT RAISE(ABORT, 'DAYWELL_ACCOUNT_CLOSED'); END;
--> statement-breakpoint
CREATE TRIGGER food_operations_closed_update BEFORE UPDATE ON food_operations
WHEN EXISTS(SELECT 1 FROM account_closures WHERE user_id=NEW.user_id OR user_id=OLD.user_id)
BEGIN SELECT RAISE(ABORT, 'DAYWELL_ACCOUNT_CLOSED'); END;
--> statement-breakpoint
CREATE TRIGGER usage_limits_closed_insert BEFORE INSERT ON usage_limits
WHEN EXISTS(SELECT 1 FROM account_closures WHERE user_id=NEW.user_id)
BEGIN SELECT RAISE(ABORT, 'DAYWELL_ACCOUNT_CLOSED'); END;
--> statement-breakpoint
CREATE TRIGGER usage_limits_closed_update BEFORE UPDATE ON usage_limits
WHEN EXISTS(SELECT 1 FROM account_closures WHERE user_id=NEW.user_id OR user_id=OLD.user_id)
BEGIN SELECT RAISE(ABORT, 'DAYWELL_ACCOUNT_CLOSED'); END;
