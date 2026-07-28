-- ============================================================
-- MIGRATION: Offline-First Architecture
-- Adds columns to support offline transaction sync
-- Idempotent: safe to run multiple times
-- ============================================================

BEGIN;

-- ── 1. Add offline-first columns to transactions ──────────────────────────

ALTER TABLE coffeepos.transactions
  ADD COLUMN IF NOT EXISTS created_offline BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE coffeepos.transactions
  ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ;

ALTER TABLE coffeepos.transactions
  ADD COLUMN IF NOT EXISTS sync_device_id TEXT;

ALTER TABLE coffeepos.transactions
  ADD COLUMN IF NOT EXISTS needs_review BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE coffeepos.transactions
  ADD COLUMN IF NOT EXISTS review_reason TEXT;

ALTER TABLE coffeepos.transactions
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

ALTER TABLE coffeepos.transactions
  ADD COLUMN IF NOT EXISTS reviewed_by UUID;

-- ── 2. Index for needs_review queries (owner dashboard) ───────────────────

CREATE INDEX IF NOT EXISTS idx_transactions_needs_review
  ON coffeepos.transactions(shop_id, needs_review)
  WHERE needs_review = true;

CREATE INDEX IF NOT EXISTS idx_transactions_synced_at
  ON coffeepos.transactions(synced_at)
  WHERE synced_at IS NOT NULL;

-- ── 3. FK for reviewed_by ─────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'transactions_reviewed_by_fkey'
      AND table_schema = 'coffeepos'
  ) THEN
    ALTER TABLE coffeepos.transactions
      ADD CONSTRAINT transactions_reviewed_by_fkey
      FOREIGN KEY (reviewed_by) REFERENCES coffeepos.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ── 4. Relax stock CHECK constraint ───────────────────────────────────────
-- The existing CHECK (stock >= -1) prevents sync from recording negative stock
-- when two offline devices sell the last item. We remove the constraint and
-- handle validation in the application layer instead.

DO $$
BEGIN
  -- Drop the existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'products_stock_check'
      AND constraint_schema = 'coffeepos'
  ) THEN
    ALTER TABLE coffeepos.products DROP CONSTRAINT products_stock_check;
    RAISE NOTICE 'Dropped products_stock_check constraint';
  END IF;
END $$;

COMMIT;

-- ============================================================
-- VERIFICATION (optional)
-- ============================================================
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'coffeepos' AND table_name = 'transactions'
--   AND column_name IN ('created_offline', 'synced_at', 'sync_device_id',
--                        'needs_review', 'review_reason', 'reviewed_at', 'reviewed_by');
