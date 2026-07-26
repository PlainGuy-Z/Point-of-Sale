-- ============================================================
-- SPRINT: FITUR MULTI-CABANG (BRANCH MANAGEMENT) MIGRATION
-- ============================================================

BEGIN;

-- 1.1 Buat tabel branches
CREATE TABLE IF NOT EXISTS coffeepos.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES coffeepos.shops(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  city VARCHAR(100),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_branches_shop_id ON coffeepos.branches(shop_id);

-- 1.2 Tambah kolom branch_id ke tabel terkait
ALTER TABLE coffeepos.products ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES coffeepos.branches(id) ON DELETE SET NULL;
ALTER TABLE coffeepos.transactions ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES coffeepos.branches(id) ON DELETE RESTRICT;
ALTER TABLE coffeepos.shifts ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES coffeepos.branches(id) ON DELETE RESTRICT;
ALTER TABLE coffeepos.users ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES coffeepos.branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_branch_id ON coffeepos.products(branch_id);
CREATE INDEX IF NOT EXISTS idx_transactions_branch_id ON coffeepos.transactions(branch_id);
CREATE INDEX IF NOT EXISTS idx_shifts_branch_id ON coffeepos.shifts(branch_id);
CREATE INDEX IF NOT EXISTS idx_users_branch_id ON coffeepos.users(branch_id);

-- 1.3 Migrasi data: buat cabang default per shop
INSERT INTO coffeepos.branches (shop_id, name, is_default)
SELECT id, 'Cabang Utama', true FROM coffeepos.shops
WHERE NOT EXISTS (
  SELECT 1 FROM coffeepos.branches WHERE branches.shop_id = shops.id
);

-- 1.4 Backfill branch_id ke data existing
UPDATE coffeepos.transactions t
SET branch_id = b.id
FROM coffeepos.branches b
WHERE b.shop_id = t.shop_id AND b.is_default = true AND t.branch_id IS NULL;

UPDATE coffeepos.shifts s
SET branch_id = b.id
FROM coffeepos.branches b
WHERE b.shop_id = s.shop_id AND b.is_default = true AND s.branch_id IS NULL;

UPDATE coffeepos.users u
SET branch_id = b.id
FROM coffeepos.branches b
WHERE b.shop_id = u.shop_id AND b.is_default = true 
  AND u.role = 'cashier' AND u.branch_id IS NULL;

-- 1.5 Set NOT NULL constraint setelah backfill
ALTER TABLE coffeepos.transactions ALTER COLUMN branch_id SET NOT NULL;
ALTER TABLE coffeepos.shifts ALTER COLUMN branch_id SET NOT NULL;

COMMIT;
