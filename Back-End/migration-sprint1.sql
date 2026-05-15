-- ============================================================
-- Sprint 1: Multi-Tenant Auth Foundation
-- Run this migration against your Supabase/PostgreSQL database
-- ============================================================

-- 1. New tables
CREATE TABLE IF NOT EXISTS coffeepos.shops (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  address     TEXT,
  phone       TEXT,
  logo_url    TEXT,
  plan        TEXT DEFAULT 'free' CHECK (plan IN ('free','pro')),
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coffeepos.users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id       UUID NOT NULL REFERENCES coffeepos.shops(id) ON DELETE CASCADE,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('owner','cashier')),
  pin           TEXT,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- 2. Add shop_id to existing tables
ALTER TABLE coffeepos.products
  ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES coffeepos.shops(id);
ALTER TABLE coffeepos.transactions
  ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES coffeepos.shops(id);
ALTER TABLE coffeepos.categories
  ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES coffeepos.shops(id);
ALTER TABLE coffeepos.waste_logs
  ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES coffeepos.shops(id);


ALTER TABLE coffeepos.shop_settings
  ADD COLUMN IF NOT EXISTS print_method TEXT DEFAULT 'browser'
    CHECK (print_method IN ('browser','rawbt','network','rawbt_intent')),
  ADD COLUMN IF NOT EXISTS rawbt_ip TEXT,
  ADD COLUMN IF NOT EXISTS receipt_show_tax BOOLEAN DEFAULT true;


-- 3. Add cashier tracking to transactions
ALTER TABLE coffeepos.transactions
  ADD COLUMN IF NOT EXISTS cashier_id UUID REFERENCES coffeepos.users(id);
ALTER TABLE coffeepos.transactions
  ADD COLUMN IF NOT EXISTS cashier_name TEXT;

-- 4. Performance indexes
CREATE INDEX IF NOT EXISTS idx_products_shop
  ON coffeepos.products(shop_id);
CREATE INDEX IF NOT EXISTS idx_transactions_shop
  ON coffeepos.transactions(shop_id);
CREATE INDEX IF NOT EXISTS idx_categories_shop
  ON coffeepos.categories(shop_id);
CREATE INDEX IF NOT EXISTS idx_waste_logs_shop
  ON coffeepos.waste_logs(shop_id);
CREATE INDEX IF NOT EXISTS idx_users_shop
  ON coffeepos.users(shop_id);
CREATE INDEX IF NOT EXISTS idx_users_email
  ON coffeepos.users(email);

-- 5. Update categories unique constraint for multi-tenancy
ALTER TABLE coffeepos.categories
  DROP CONSTRAINT IF EXISTS categories_name_key;
ALTER TABLE coffeepos.categories
  ADD CONSTRAINT categories_name_shop_unique UNIQUE (name, shop_id);
