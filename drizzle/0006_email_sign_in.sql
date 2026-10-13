-- Email sign-in for the public app (owner, 13 October 2026: "you build sign-up"). See docs/sign-in.md.
-- Migration 0004 is reserved for account closures in PR #47.
-- One row per Daywell account. The address is kept so the person can sign in again and see which account is open.
CREATE TABLE accounts (
  user_id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  signed_in_at TEXT NOT NULL
);
--> statement-breakpoint
-- At most one live code per address. Both columns are keyed hashes, so neither the address nor the code can be
-- read back. A code works for 10 minutes and 5 tries; the daily clean-up removes expired rows.
CREATE TABLE sign_in_codes (
  email_key TEXT PRIMARY KEY NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0
);
--> statement-breakpoint
CREATE INDEX sign_in_codes_expires ON sign_in_codes(expires_at);
--> statement-breakpoint
-- A signed-in device. Only a hash of the cookie's random token is stored. Closing the account removes its sessions.
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES accounts(user_id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  seen_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX sessions_user ON sessions(user_id);
--> statement-breakpoint
CREATE INDEX sessions_expires ON sessions(expires_at);
