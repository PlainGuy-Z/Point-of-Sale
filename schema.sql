-- ============================================================
-- COFFEEPOS SMART ANALYTICS - COMPLETE SCHEMA
-- PostgreSQL + Supabase Ready
-- Idempotent: dapat dijalankan berulang kali dengan aman
-- ============================================================

BEGIN;

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. SCHEMA
-- ============================================================
CREATE SCHEMA IF NOT EXISTS coffeepos;
SET search_path TO coffeepos, public;

-- ============================================================
-- 3. DOMAIN (Money Integer)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'money_int') THEN
    CREATE DOMAIN money_int AS INTEGER CHECK (VALUE >= 0);
  END IF;
END
$$;

-- ============================================================
-- 4. TABLES (Alphabetical Order untuk referensi)
-- ============================================================

-- 4.1 categories
CREATE TABLE IF NOT EXISTS coffeepos.categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  shop_id    UUID
);

-- 4.2 products
CREATE TABLE IF NOT EXISTS coffeepos.products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  description   TEXT,
  price         INTEGER NOT NULL,
  category      TEXT,
  stock         INTEGER NOT NULL DEFAULT 0 CHECK (stock >= -1),
  cost          INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  min_stock     INTEGER NOT NULL DEFAULT 0,
  image         TEXT,
  category_id   UUID,
  discount      INTEGER DEFAULT 0,
  is_promo      BOOLEAN DEFAULT false,
  promo_price   INTEGER DEFAULT 0,
  promo_label   TEXT,
  promo_start   DATE,
  promo_end     DATE,
  is_available  BOOLEAN NOT NULL DEFAULT true,
  shop_id       UUID
);

-- 4.3 registration_tokens
CREATE TABLE IF NOT EXISTS coffeepos.registration_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token      TEXT UNIQUE NOT NULL,
  is_used    BOOLEAN NOT NULL DEFAULT false,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.4 shifts
CREATE TABLE IF NOT EXISTS coffeepos.shifts (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id            UUID NOT NULL,
  cashier_id         UUID NOT NULL,
  cashier_name       TEXT NOT NULL,
  opened_at          TIMESTAMPTZ DEFAULT now(),
  closed_at          TIMESTAMPTZ,
  opening_cash       INTEGER NOT NULL DEFAULT 0,
  closing_cash       INTEGER,
  expected_cash      INTEGER,
  cash_difference    INTEGER,
  total_sales        INTEGER DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  notes              TEXT,
  status             TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed'))
);

-- 4.5 shop_settings
CREATE TABLE IF NOT EXISTS coffeepos.shop_settings (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id                   UUID UNIQUE NOT NULL,
  phone                     TEXT,
  address                   TEXT,
  logo_url                  TEXT,
  open_time                 TEXT DEFAULT '08:00',
  close_time                TEXT DEFAULT '22:00',
  tax_enabled               BOOLEAN DEFAULT true,
  tax_rate                  NUMERIC(5,2) DEFAULT 11.00,
  tax_label                 TEXT DEFAULT 'PPN',
  tax_inclusive             BOOLEAN DEFAULT false,
  service_charge_enabled    BOOLEAN DEFAULT false,
  service_charge_rate       NUMERIC(5,2) DEFAULT 0.00,
  service_charge_label      TEXT DEFAULT 'Service',
  receipt_footer            TEXT DEFAULT 'Terima kasih telah berkunjung!',
  receipt_show_logo         BOOLEAN DEFAULT true,
  receipt_paper_size        TEXT DEFAULT '80mm' CHECK (receipt_paper_size IN ('58mm', '80mm')),
  receipt_auto_print        BOOLEAN DEFAULT false,
  receipt_show_tax          BOOLEAN DEFAULT true,
  default_order_type        TEXT DEFAULT 'dine_in' CHECK (default_order_type IN ('dine_in', 'takeaway')),
  require_customer_name     BOOLEAN DEFAULT false,
  require_table_number      BOOLEAN DEFAULT true,
  payment_cash              BOOLEAN DEFAULT true,
  payment_qris              BOOLEAN DEFAULT true,
  payment_transfer          BOOLEAN DEFAULT true,
  low_stock_threshold       INTEGER DEFAULT 5,
  auto_disable_zero_stock   BOOLEAN DEFAULT false,
  created_at                TIMESTAMPTZ DEFAULT now(),
  updated_at                TIMESTAMPTZ DEFAULT now(),
  print_method              TEXT DEFAULT 'browser' CHECK (print_method IN ('browser', 'rawbt', 'network', 'rawbt_intent')),
  rawbt_ip                  TEXT,
  currency_format           TEXT DEFAULT 'Rp' CHECK (currency_format IN ('Rp', 'IDR')),
  date_format               TEXT DEFAULT 'DD/MM/YYYY' CHECK (date_format IN ('DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD')),
  language                  TEXT DEFAULT 'id' CHECK (language IN ('id', 'en'))
);

-- 4.6 shops
CREATE TABLE IF NOT EXISTS coffeepos.shops (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  slug       TEXT UNIQUE NOT NULL,
  address    TEXT,
  phone      TEXT,
  logo_url   TEXT,
  plan       TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.7 transaction_items
CREATE TABLE IF NOT EXISTS coffeepos.transaction_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL,
  product_id     UUID,
  name           TEXT NOT NULL,
  price          INTEGER NOT NULL,
  quantity       INTEGER NOT NULL CHECK (quantity > 0),
  is_custom      BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  description    TEXT,
  CONSTRAINT transaction_items_custom_consistency CHECK (
    (is_custom = true AND product_id IS NULL) OR
    (is_custom = false AND product_id IS NOT NULL)
  )
);

-- 4.8 transactions
CREATE TABLE IF NOT EXISTS coffeepos.transactions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subtotal            INTEGER NOT NULL,
  tax                 INTEGER NOT NULL,
  grand_total         INTEGER NOT NULL,
  customer_name       TEXT,
  table_number        TEXT,
  payment_method      TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'qris', 'transfer', 'other')),
  status              TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending_void', 'voided')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  shop_id             UUID,
  cashier_name        TEXT,
  shift_id            UUID,
  cashier_id          UUID,
  discount_amount     INTEGER NOT NULL DEFAULT 0,
  cash_received       INTEGER,
  change_amount       INTEGER,
  order_type          TEXT,
  customer_id         UUID,
  void_reason         TEXT,
  void_requested_by   UUID,
  void_requested_at   TIMESTAMPTZ,
  void_reviewed_by    UUID,
  void_reviewed_at    TIMESTAMPTZ,
  void_review_note    TEXT,
  notes               TEXT,
  service_charge      INTEGER DEFAULT 0,
  CONSTRAINT transactions_totals_consistent CHECK (grand_total = subtotal + tax + COALESCE(service_charge, 0) - COALESCE(discount_amount, 0))
);

-- 4.9 users
CREATE TABLE IF NOT EXISTS coffeepos.users (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id                 UUID NOT NULL,
  email                   TEXT UNIQUE NOT NULL,
  password_hash           TEXT NOT NULL,
  name                    TEXT NOT NULL,
  role                    TEXT NOT NULL CHECK (role IN ('owner', 'cashier')),
  pin                     TEXT,
  is_active               BOOLEAN DEFAULT true,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now(),
  is_verified             BOOLEAN NOT NULL DEFAULT false,
  otp_code                TEXT,
  otp_expires_at          TIMESTAMPTZ,
  otp_attempts            INTEGER NOT NULL DEFAULT 0,
  otp_sent_at             TIMESTAMPTZ,
  phone                   TEXT,
  reset_token             TEXT,
  reset_token_expires_at  TIMESTAMPTZ
);

-- 4.10 waste_logs
CREATE TABLE IF NOT EXISTS coffeepos.waste_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL,
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  reason      TEXT NOT NULL,
  loss_amount INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  shop_id     UUID
);

-- ============================================================
-- 5. FOREIGN KEY CONSTRAINTS (Setelah semua tabel ada)
-- ============================================================
ALTER TABLE coffeepos.categories ADD CONSTRAINT IF NOT EXISTS categories_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES coffeepos.shops(id) ON DELETE CASCADE;

ALTER TABLE coffeepos.products ADD CONSTRAINT IF NOT EXISTS products_category_id_fkey 
  FOREIGN KEY (category_id) REFERENCES coffeepos.categories(id) ON DELETE SET NULL;
ALTER TABLE coffeepos.products ADD CONSTRAINT IF NOT EXISTS products_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES coffeepos.shops(id) ON DELETE CASCADE;

ALTER TABLE coffeepos.shifts ADD CONSTRAINT IF NOT EXISTS shifts_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES coffeepos.shops(id) ON DELETE CASCADE;
ALTER TABLE coffeepos.shifts ADD CONSTRAINT IF NOT EXISTS shifts_cashier_id_fkey 
  FOREIGN KEY (cashier_id) REFERENCES coffeepos.users(id) ON DELETE RESTRICT;

ALTER TABLE coffeepos.shop_settings ADD CONSTRAINT IF NOT EXISTS shop_settings_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES coffeepos.shops(id) ON DELETE CASCADE;

ALTER TABLE coffeepos.transaction_items ADD CONSTRAINT IF NOT EXISTS transaction_items_transaction_id_fkey 
  FOREIGN KEY (transaction_id) REFERENCES coffeepos.transactions(id) ON DELETE CASCADE;
ALTER TABLE coffeepos.transaction_items ADD CONSTRAINT IF NOT EXISTS transaction_items_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES coffeepos.products(id) ON DELETE SET NULL;

ALTER TABLE coffeepos.transactions ADD CONSTRAINT IF NOT EXISTS transactions_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES coffeepos.shops(id) ON DELETE CASCADE;
ALTER TABLE coffeepos.transactions ADD CONSTRAINT IF NOT EXISTS transactions_shift_id_fkey 
  FOREIGN KEY (shift_id) REFERENCES coffeepos.shifts(id) ON DELETE SET NULL;
ALTER TABLE coffeepos.transactions ADD CONSTRAINT IF NOT EXISTS transactions_cashier_id_fkey 
  FOREIGN KEY (cashier_id) REFERENCES coffeepos.users(id) ON DELETE SET NULL;
ALTER TABLE coffeepos.transactions ADD CONSTRAINT IF NOT EXISTS transactions_void_requested_by_fkey 
  FOREIGN KEY (void_requested_by) REFERENCES coffeepos.users(id) ON DELETE SET NULL;
ALTER TABLE coffeepos.transactions ADD CONSTRAINT IF NOT EXISTS transactions_void_reviewed_by_fkey 
  FOREIGN KEY (void_reviewed_by) REFERENCES coffeepos.users(id) ON DELETE SET NULL;

ALTER TABLE coffeepos.users ADD CONSTRAINT IF NOT EXISTS users_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES coffeepos.shops(id) ON DELETE CASCADE;

ALTER TABLE coffeepos.waste_logs ADD CONSTRAINT IF NOT EXISTS waste_logs_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES coffeepos.products(id) ON DELETE CASCADE;
ALTER TABLE coffeepos.waste_logs ADD CONSTRAINT IF NOT EXISTS waste_logs_shop_id_fkey 
  FOREIGN KEY (shop_id) REFERENCES coffeepos.shops(id) ON DELETE CASCADE;

-- ============================================================
-- 6. INDEXES (Performance)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_categories_shop ON coffeepos.categories(shop_id);
CREATE INDEX IF NOT EXISTS idx_categories_name_shop ON coffeepos.categories(name, shop_id);

CREATE INDEX IF NOT EXISTS idx_products_shop ON coffeepos.products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON coffeepos.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON coffeepos.products(is_available, shop_id);

CREATE INDEX IF NOT EXISTS idx_registration_tokens_token ON coffeepos.registration_tokens(token);
CREATE INDEX IF NOT EXISTS idx_registration_tokens_is_used ON coffeepos.registration_tokens(is_used);

CREATE INDEX IF NOT EXISTS idx_shifts_shop_id ON coffeepos.shifts(shop_id);
CREATE INDEX IF NOT EXISTS idx_shifts_cashier ON coffeepos.shifts(cashier_id);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON coffeepos.shifts(shop_id, status);
CREATE INDEX IF NOT EXISTS idx_shifts_opened_at ON coffeepos.shifts(opened_at DESC);

CREATE INDEX IF NOT EXISTS idx_shop_settings_shop_id ON coffeepos.shop_settings(shop_id);

CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON coffeepos.transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_product_id ON coffeepos.transaction_items(product_id);

CREATE INDEX IF NOT EXISTS idx_transactions_shop ON coffeepos.transactions(shop_id);
CREATE INDEX IF NOT EXISTS idx_transactions_shop_date ON coffeepos.transactions(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON coffeepos.transactions(shop_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_shift_id ON coffeepos.transactions(shift_id) WHERE shift_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_cashier_id ON coffeepos.transactions(cashier_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method ON coffeepos.transactions(payment_method, shop_id);

CREATE INDEX IF NOT EXISTS idx_users_shop ON coffeepos.users(shop_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON coffeepos.users(email);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON coffeepos.users(reset_token) WHERE reset_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_otp_code ON coffeepos.users(otp_code) WHERE otp_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_waste_logs_product_id ON coffeepos.waste_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_waste_logs_created_at ON coffeepos.waste_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_waste_logs_shop_date ON coffeepos.waste_logs(shop_id, created_at DESC);

-- ============================================================
-- 7. UNIQUE CONSTRAINTS (Multi-tenant)
-- ============================================================
ALTER TABLE coffeepos.categories DROP CONSTRAINT IF EXISTS categories_name_key;
ALTER TABLE coffeepos.categories ADD CONSTRAINT categories_name_shop_unique UNIQUE (name, shop_id);

-- ============================================================
-- 8. AUTO-CREATE SHOP_SETTINGS FOR EXISTING SHOPS
-- ============================================================
INSERT INTO coffeepos.shop_settings (shop_id)
SELECT id FROM coffeepos.shops s
WHERE NOT EXISTS (SELECT 1 FROM coffeepos.shop_settings ss WHERE ss.shop_id = s.id);

-- ============================================================
-- 9. MIGRATE LEGACY DATA STATUS (If any)
-- ============================================================
UPDATE coffeepos.transactions 
SET status = 
  CASE 
    WHEN lower(coalesce(trim(status), '')) IN ('void', 'refunded') THEN 'voided'
    WHEN lower(coalesce(trim(status), '')) IN ('pending_void') THEN 'pending_void'
    WHEN lower(coalesce(trim(status), '')) IN ('paid', 'draft', 'completed') THEN 'completed'
    ELSE 'completed'
  END
WHERE status NOT IN ('completed', 'pending_void', 'voided');

-- ============================================================
-- 10. BACKFILL shop_id FOR LEGACY ROWS (Single shop scenario)
-- ============================================================
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

COMMIT;

-- ============================================================
-- VERIFICATION QUERY (Optional - uncomment to run)
-- ============================================================
-- SELECT 
--   (SELECT COUNT(*) FROM coffeepos.shops) as shops,
--   (SELECT COUNT(*) FROM coffeepos.users) as users,
--   (SELECT COUNT(*) FROM coffeepos.products) as products,
--   (SELECT COUNT(*) FROM coffeepos.transactions) as transactions;
-- ============================================================