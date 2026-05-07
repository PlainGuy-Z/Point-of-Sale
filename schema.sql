-- CoffeePOS Smart Analytics - PostgreSQL Schema
-- Notes:
-- - All money values are stored as INTEGER (e.g. in Rupiah).
-- - UUID primary keys are generated with pgcrypto.
-- - Use SQL transactions in the API for checkout/stock updates.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Optional: keep everything in a dedicated schema
CREATE SCHEMA IF NOT EXISTS coffeepos;
SET search_path TO coffeepos, public;

-- Domain for "money in integer"
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'money_int') THEN
    CREATE DOMAIN money_int AS INTEGER
      CHECK (VALUE >= 0);
  END IF;
END
$$;

-- Products
CREATE TABLE IF NOT EXISTS products (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  description  TEXT,
  price        money_int NOT NULL,         -- selling price per unit
  category     TEXT NOT NULL,
  stock        INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  cost         money_int NOT NULL DEFAULT 0, -- cost per unit
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subtotal       money_int NOT NULL,
  tax            money_int NOT NULL,
  grand_total    money_int NOT NULL,
  customer_name  TEXT,
  table_number   TEXT,
  payment_method TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'paid',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT transactions_totals_consistent CHECK (grand_total = subtotal + tax),
  CONSTRAINT transactions_payment_method_chk CHECK (
    payment_method IN ('cash', 'card', 'qris', 'transfer', 'other')
  ),
  CONSTRAINT transactions_status_chk CHECK (
    status IN ('draft', 'paid', 'void', 'refunded')
  )
);

-- Transaction items (product_id nullable for manual/custom items)
CREATE TABLE IF NOT EXISTS transaction_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  product_id     UUID REFERENCES products(id) ON DELETE SET NULL,
  name           TEXT NOT NULL,
  price          money_int NOT NULL,
  quantity       INTEGER NOT NULL CHECK (quantity > 0),
  is_custom      BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT transaction_items_custom_consistency CHECK (
    (is_custom = true AND product_id IS NULL)
    OR
    (is_custom = false AND product_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id
  ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_product_id
  ON transaction_items(product_id);

-- Waste logs
CREATE TABLE IF NOT EXISTS waste_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  reason      TEXT NOT NULL,
  loss_amount money_int NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_waste_logs_product_id
  ON waste_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_waste_logs_created_at
  ON waste_logs(created_at);

COMMIT;

