ALTER TABLE coffeepos.users
  ADD COLUMN IF NOT EXISTS reset_token       TEXT,
  ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_reset_token
  ON coffeepos.users(reset_token)
  WHERE reset_token IS NOT NULL;
