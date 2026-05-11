ALTER TABLE coffeepos.users
  ADD COLUMN IF NOT EXISTS is_verified      BOOLEAN      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS otp_code         TEXT,
  ADD COLUMN IF NOT EXISTS otp_expires_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS otp_attempts     INTEGER      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS otp_sent_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS phone            TEXT;

CREATE INDEX IF NOT EXISTS idx_users_otp
  ON coffeepos.users(otp_code)
  WHERE otp_code IS NOT NULL;
