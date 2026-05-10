-- Sprint 6A: Dynamic Settings System
-- Create shop_settings table
CREATE TABLE IF NOT EXISTS coffeepos.shop_settings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id      UUID UNIQUE NOT NULL 
               REFERENCES coffeepos.shops(id) ON DELETE CASCADE,

  -- Identitas Toko
  phone        TEXT,
  address      TEXT,
  logo_url     TEXT,
  open_time    TEXT DEFAULT '08:00',
  close_time   TEXT DEFAULT '22:00',

  -- Pajak
  tax_enabled        BOOLEAN DEFAULT true,
  tax_rate           NUMERIC(5,2) DEFAULT 11.00,
  tax_label          TEXT DEFAULT 'PPN',
  tax_inclusive      BOOLEAN DEFAULT false,

  -- Service Charge
  service_charge_enabled  BOOLEAN DEFAULT false,
  service_charge_rate     NUMERIC(5,2) DEFAULT 0.00,
  service_charge_label    TEXT DEFAULT 'Service',

  -- Struk
  receipt_footer      TEXT DEFAULT 'Terima kasih telah berkunjung!',
  receipt_show_logo   BOOLEAN DEFAULT true,
  receipt_paper_size  TEXT DEFAULT '80mm'
                    CHECK (receipt_paper_size IN ('58mm','80mm')),
  receipt_auto_print  BOOLEAN DEFAULT false,
  receipt_show_tax    BOOLEAN DEFAULT true,

  -- POS Behavior
  default_order_type      TEXT DEFAULT 'dine_in'
                        CHECK (default_order_type IN ('dine_in','takeaway')),
  require_customer_name   BOOLEAN DEFAULT false,
  require_table_number    BOOLEAN DEFAULT true,

  -- Pembayaran aktif
  payment_cash      BOOLEAN DEFAULT true,
  payment_qris      BOOLEAN DEFAULT true,
  payment_transfer  BOOLEAN DEFAULT true,

  -- Stok
  low_stock_threshold       INTEGER DEFAULT 5,
  auto_disable_zero_stock   BOOLEAN DEFAULT false,

  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- Auto-create settings when shop is created
-- Run for existing shops:
INSERT INTO coffeepos.shop_settings (shop_id)
SELECT id FROM coffeepos.shops
WHERE id NOT IN (SELECT shop_id FROM coffeepos.shop_settings);

-- Index
CREATE INDEX IF NOT EXISTS idx_shop_settings_shop_id
  ON coffeepos.shop_settings(shop_id);

-- Add service_charge and discount_amount columns to transactions
ALTER TABLE coffeepos.transactions
  ADD COLUMN IF NOT EXISTS service_charge INTEGER DEFAULT 0;
ALTER TABLE coffeepos.transactions
  ADD COLUMN IF NOT EXISTS discount_amount INTEGER DEFAULT 0;
