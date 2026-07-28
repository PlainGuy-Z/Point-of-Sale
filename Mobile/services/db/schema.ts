/**
 * SQLite Schema Definitions (Drizzle ORM)
 * 
 * Local database schema for offline-first SmartPOS.
 * Tables are divided into:
 *   - Read-only cache (products, categories, shopSettings) — synced from server
 *   - Write-ahead queue (pendingTransactions, pendingTransactionItems) — created offline
 *   - Metadata (syncMetadata) — tracking sync state
 */

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// ─── Read-only Cache Tables ──────────────────────────────────────────────────

export const products = sqliteTable('products', {
  id:             text('id').primaryKey(),
  name:           text('name').notNull(),
  description:    text('description'),
  price:          integer('price').notNull(),
  category:       text('category'),
  categoryId:     text('category_id'),
  stock:          integer('stock').notNull().default(0),
  cost:           integer('cost').notNull().default(0),
  minStock:       integer('min_stock').notNull().default(0),
  image:          text('image'),
  discount:       integer('discount').default(0),
  isPromo:        integer('is_promo', { mode: 'boolean' }).default(false),
  promoPrice:     integer('promo_price').default(0),
  promoLabel:     text('promo_label'),
  promoStart:     text('promo_start'),
  promoEnd:       text('promo_end'),
  isAvailable:    integer('is_available', { mode: 'boolean' }).notNull().default(true),
  shopId:         text('shop_id'),
  updatedAt:      text('updated_at').notNull(),
  // Stok berkurang karena transaksi offline yang belum di-sync.
  // Display stock = stock - localStockAdj
  localStockAdj:  integer('local_stock_adj').notNull().default(0),
});

export const categories = sqliteTable('categories', {
  id:     text('id').primaryKey(),
  name:   text('name').notNull(),
  shopId: text('shop_id'),
});

export const shopSettings = sqliteTable('shop_settings', {
  shopId:               text('shop_id').primaryKey(),
  taxEnabled:           integer('tax_enabled', { mode: 'boolean' }).default(true),
  taxRate:              real('tax_rate').default(11.0),
  taxLabel:             text('tax_label').default('PPN'),
  taxInclusive:         integer('tax_inclusive', { mode: 'boolean' }).default(false),
  serviceChargeEnabled: integer('service_charge_enabled', { mode: 'boolean' }).default(false),
  serviceChargeRate:    real('service_charge_rate').default(0.0),
  serviceChargeLabel:   text('service_charge_label').default('Service'),
  updatedAt:            text('updated_at').notNull(),
});

// ─── Pending Sync Queue Tables ───────────────────────────────────────────────

export const pendingTransactions = sqliteTable('pending_transactions', {
  id:              text('id').primaryKey(),                 // UUID from expo-crypto
  idempotencyKey:  text('idempotency_key').notNull().unique(),
  
  // Cart snapshot — JSON array of cart items
  cartJson:        text('cart_json').notNull(),
  paymentMethod:   text('payment_method').notNull(),
  customerName:    text('customer_name'),
  customerId:      text('customer_id'),
  tableNumber:     text('table_number'),
  orderType:       text('order_type'),
  notes:           text('notes'),
  orderNote:       text('order_note'),
  cashReceived:    integer('cash_received'),
  applyTax:        integer('apply_tax', { mode: 'boolean' }).default(false),
  branchId:        text('branch_id'),

  // Local calculations (estimates — server recalculates)
  localSubtotal:   integer('local_subtotal').notNull(),
  localTax:        integer('local_tax').notNull().default(0),
  localService:    integer('local_service').notNull().default(0),
  localGrandTotal: integer('local_grand_total').notNull(),

  // Context
  shiftId:     text('shift_id'),
  cashierId:   text('cashier_id').notNull(),
  cashierName: text('cashier_name').notNull(),
  shopId:      text('shop_id').notNull(),

  // Sync state
  status:      text('status').notNull().default('pending'),
  //  'pending' | 'syncing' | 'synced' | 'failed' | 'needs_review' | 'rejected'
  syncError:   text('sync_error'),
  retryCount:  integer('retry_count').notNull().default(0),

  createdAt:   text('created_at').notNull(),
  syncedAt:    text('synced_at'),
  updatedAt:   text('updated_at').notNull(),
});

export const pendingTransactionItems = sqliteTable('pending_transaction_items', {
  id:            text('id').primaryKey(),
  transactionId: text('transaction_id').notNull(),
  productId:     text('product_id'),               // NULL for manual/custom items
  name:          text('name').notNull(),
  price:         integer('price').notNull(),
  quantity:      integer('quantity').notNull(),
  isCustom:      integer('is_custom', { mode: 'boolean' }).notNull().default(false),
  description:   text('description'),
  variantName:   text('variant_name'),
  variantPrice:  integer('variant_price').default(0),
  note:          text('note'),
});

// ─── Metadata Table ──────────────────────────────────────────────────────────

export const syncMetadata = sqliteTable('sync_metadata', {
  key:       text('key').primaryKey(),
  value:     text('value').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ─── Synced Transactions Cache (for offline history view) ────────────────────

export const syncedTransactions = sqliteTable('synced_transactions', {
  id:             text('id').primaryKey(),
  serverDataJson: text('server_data_json').notNull(),
  createdAt:      text('created_at').notNull(),
  syncedAt:       text('synced_at').notNull(),
});
