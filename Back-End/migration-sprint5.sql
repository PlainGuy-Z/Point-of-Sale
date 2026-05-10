-- ============================================================
-- Sprint 5: Transaction status, void workflow, enrich columns
-- Run against PostgreSQL after prior migrations.
-- ============================================================

-- 1. Drop legacy status constraint (paid/draft/refunded/etc.)
ALTER TABLE coffeepos.transactions DROP CONSTRAINT IF EXISTS transactions_status_chk;
ALTER TABLE coffeepos.transactions DROP CONSTRAINT IF EXISTS transactions_status_sprint5_chk;

-- 2. Add void + enriched columns (idempotent)
ALTER TABLE coffeepos.transactions ADD COLUMN IF NOT EXISTS discount_amount INTEGER NOT NULL DEFAULT 0;
ALTER TABLE coffeepos.transactions ADD COLUMN IF NOT EXISTS cash_received INTEGER;
ALTER TABLE coffeepos.transactions ADD COLUMN IF NOT EXISTS change_amount INTEGER;
ALTER TABLE coffeepos.transactions ADD COLUMN IF NOT EXISTS order_type TEXT;
ALTER TABLE coffeepos.transactions ADD COLUMN IF NOT EXISTS customer_id UUID;

ALTER TABLE coffeepos.transactions ADD COLUMN IF NOT EXISTS void_reason TEXT;
ALTER TABLE coffeepos.transactions ADD COLUMN IF NOT EXISTS void_requested_by UUID REFERENCES coffeepos.users(id);
ALTER TABLE coffeepos.transactions ADD COLUMN IF NOT EXISTS void_requested_at TIMESTAMPTZ;
ALTER TABLE coffeepos.transactions ADD COLUMN IF NOT EXISTS void_reviewed_by UUID REFERENCES coffeepos.users(id);
ALTER TABLE coffeepos.transactions ADD COLUMN IF NOT EXISTS void_reviewed_at TIMESTAMPTZ;
ALTER TABLE coffeepos.transactions ADD COLUMN IF NOT EXISTS void_review_note TEXT;

-- 3. Normalize legacy status → completed | voided
UPDATE coffeepos.transactions SET status =
  CASE
    WHEN lower(coalesce(trim(status), '')) IN ('void', 'refunded') THEN 'voided'
    WHEN lower(coalesce(trim(status), '')) IN ('pending_void') THEN 'pending_void'
    WHEN lower(coalesce(trim(status), '')) IN ('paid', 'draft', 'completed') THEN 'completed'
    ELSE 'completed'
  END;

ALTER TABLE coffeepos.transactions
  ADD CONSTRAINT transactions_status_sprint5_chk CHECK (status IN ('completed', 'pending_void', 'voided'));

CREATE INDEX IF NOT EXISTS idx_transactions_status
  ON coffeepos.transactions(shop_id, status);
