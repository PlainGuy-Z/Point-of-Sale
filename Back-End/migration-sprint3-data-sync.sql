-- ============================================================
-- Sprint 3 follow-up: data visibility + shift linkage performance
-- Run after migration-sprint1.sql and migration-sprint3.sql
-- ============================================================

-- Speed up shift reconciliation queries
CREATE INDEX IF NOT EXISTS idx_transactions_shift_id
  ON coffeepos.transactions(shift_id)
  WHERE shift_id IS NOT NULL;

-- When exactly one shop exists, attach legacy rows missing shop_id
-- so GET /app/state (filtered by shop) returns data again.
DO $$
DECLARE
  nshops int;
  only_shop uuid;
BEGIN
  SELECT COUNT(*) INTO nshops FROM coffeepos.shops;
  IF nshops = 1 THEN
    SELECT id INTO only_shop FROM coffeepos.shops ORDER BY created_at LIMIT 1;
    UPDATE coffeepos.products SET shop_id = only_shop WHERE shop_id IS NULL;
    UPDATE coffeepos.transactions SET shop_id = only_shop WHERE shop_id IS NULL;
    UPDATE coffeepos.categories SET shop_id = only_shop WHERE shop_id IS NULL;
    UPDATE coffeepos.waste_logs SET shop_id = only_shop WHERE shop_id IS NULL;
  END IF;
END
$$;
