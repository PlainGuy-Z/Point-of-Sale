-- ============================================================
-- Sprint 3: Shift Management
-- Run this migration against your Supabase/PostgreSQL database
-- ============================================================

CREATE TABLE IF NOT EXISTS coffeepos.shifts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id             UUID NOT NULL REFERENCES coffeepos.shops(id),
  cashier_id          UUID NOT NULL REFERENCES coffeepos.users(id),
  cashier_name        TEXT NOT NULL,
  opened_at           TIMESTAMPTZ DEFAULT now(),
  closed_at           TIMESTAMPTZ,
  opening_cash        INTEGER NOT NULL DEFAULT 0,
  closing_cash        INTEGER,
  expected_cash       INTEGER,
  cash_difference     INTEGER,
  total_sales         INTEGER DEFAULT 0,
  total_transactions  INTEGER DEFAULT 0,
  notes               TEXT,
  status              TEXT DEFAULT 'open' 
                      CHECK (status IN ('open','closed'))
);

ALTER TABLE coffeepos.transactions 
  ADD COLUMN IF NOT EXISTS shift_id UUID REFERENCES coffeepos.shifts(id);
ALTER TABLE coffeepos.transactions
  ADD COLUMN IF NOT EXISTS cashier_id UUID REFERENCES coffeepos.users(id);

CREATE INDEX IF NOT EXISTS idx_shifts_shop_id ON coffeepos.shifts(shop_id);
CREATE INDEX IF NOT EXISTS idx_shifts_cashier ON coffeepos.shifts(cashier_id);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON coffeepos.shifts(shop_id, status);
