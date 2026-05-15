-- Performance: shop isolation queries
CREATE INDEX IF NOT EXISTS idx_products_shop 
  ON coffeepos.products(shop_id);

CREATE INDEX IF NOT EXISTS idx_transactions_shop_date 
  ON coffeepos.transactions(shop_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_waste_logs_shop_date 
  ON coffeepos.waste_logs(shop_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_shop 
  ON coffeepos.users(shop_id);

-- Performance: join optimization
CREATE INDEX IF NOT EXISTS idx_transaction_items_tx_id 
  ON coffeepos.transaction_items(transaction_id);

-- Performance: AI analytics queries  
CREATE INDEX IF NOT EXISTS idx_transactions_status_shop
  ON coffeepos.transactions(shop_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_shifts_shop_status
  ON coffeepos.shifts(shop_id, status);
