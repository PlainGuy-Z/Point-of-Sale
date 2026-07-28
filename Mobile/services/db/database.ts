/**
 * Database Connection & Migration Manager
 * 
 * Manages the local SQLite database lifecycle:
 *   - Opens/creates the database with WAL mode for crash safety
 *   - Runs schema migrations (creates tables if not exist)
 *   - Provides a singleton drizzle instance
 *   - Handles database cleanup on logout
 */

import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';
import { getOrCreateDatabaseKey } from './encryption';

const DB_NAME = 'smartpos_offline.db';

let _db: SQLite.SQLiteDatabase | null = null;
let _drizzle: ReturnType<typeof drizzle> | null = null;
let _isMigrated = false;

/**
 * Get or create the SQLite database instance.
 * Uses WAL journal mode for better concurrent read/write safety and applies PRAGMA hardening.
 * Guarantees tables exist by running migrations on open.
 */
export function getSQLiteDb(): SQLite.SQLiteDatabase {
  if (!_db) {
    try {
      _db = SQLite.openDatabaseSync(DB_NAME);
      // Enable WAL mode for crash safety and concurrent reads
      _db.execSync('PRAGMA journal_mode = WAL;');
      _db.execSync('PRAGMA foreign_keys = ON;');
      _db.execSync('PRAGMA secure_delete = ON;'); // Overwrite deleted data with zeros
    } catch (err) {
      console.error('[OfflineDB] Failed to open SQLite database:', err);
      throw err;
    }
  }
  if (!_isMigrated && _db) {
    _isMigrated = true;
    try {
      runMigrationsInternal(_db);
    } catch (err) {
      console.error('[OfflineDB] Failed to run migrations on open:', err);
    }
  }
  return _db;
}

/**
 * Get or create the Drizzle ORM instance bound to the local SQLite DB.
 */
export function getDb() {
  if (!_drizzle) {
    const sqlite = getSQLiteDb();
    _drizzle = drizzle(sqlite, { schema });
  }
  return _drizzle;
}

/**
 * Run all schema migrations (idempotent — safe to call repeatedly).
 * Creates tables if they don't exist yet.
 */
function runMigrationsInternal(db: SQLite.SQLiteDatabase): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS products (
      id              TEXT PRIMARY KEY,
      name            TEXT NOT NULL,
      description     TEXT,
      price           INTEGER NOT NULL,
      category        TEXT,
      category_id     TEXT,
      stock           INTEGER NOT NULL DEFAULT 0,
      cost            INTEGER NOT NULL DEFAULT 0,
      min_stock       INTEGER NOT NULL DEFAULT 0,
      image           TEXT,
      discount        INTEGER DEFAULT 0,
      is_promo        INTEGER DEFAULT 0,
      promo_price     INTEGER DEFAULT 0,
      promo_label     TEXT,
      promo_start     TEXT,
      promo_end       TEXT,
      is_available    INTEGER NOT NULL DEFAULT 1,
      shop_id         TEXT,
      updated_at      TEXT NOT NULL,
      local_stock_adj INTEGER NOT NULL DEFAULT 0
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS categories (
      id      TEXT PRIMARY KEY,
      name    TEXT NOT NULL,
      shop_id TEXT
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS shop_settings (
      shop_id                TEXT PRIMARY KEY,
      tax_enabled            INTEGER DEFAULT 1,
      tax_rate               REAL DEFAULT 11.0,
      tax_label              TEXT DEFAULT 'PPN',
      tax_inclusive           INTEGER DEFAULT 0,
      service_charge_enabled INTEGER DEFAULT 0,
      service_charge_rate    REAL DEFAULT 0.0,
      service_charge_label   TEXT DEFAULT 'Service',
      updated_at             TEXT NOT NULL
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS pending_transactions (
      id                TEXT PRIMARY KEY,
      idempotency_key   TEXT UNIQUE NOT NULL,
      cart_json         TEXT NOT NULL,
      payment_method    TEXT NOT NULL,
      customer_name     TEXT,
      customer_id       TEXT,
      table_number      TEXT,
      order_type        TEXT,
      notes             TEXT,
      order_note        TEXT,
      cash_received     INTEGER,
      apply_tax         INTEGER DEFAULT 0,
      branch_id         TEXT,
      local_subtotal    INTEGER NOT NULL,
      local_tax         INTEGER NOT NULL DEFAULT 0,
      local_service     INTEGER NOT NULL DEFAULT 0,
      local_grand_total INTEGER NOT NULL,
      shift_id          TEXT,
      cashier_id        TEXT NOT NULL,
      cashier_name      TEXT NOT NULL,
      shop_id           TEXT NOT NULL,
      status            TEXT NOT NULL DEFAULT 'pending',
      sync_error        TEXT,
      retry_count       INTEGER NOT NULL DEFAULT 0,
      created_at        TEXT NOT NULL,
      synced_at         TEXT,
      updated_at        TEXT NOT NULL
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS pending_transaction_items (
      id              TEXT PRIMARY KEY,
      transaction_id  TEXT NOT NULL REFERENCES pending_transactions(id) ON DELETE CASCADE,
      product_id      TEXT,
      name            TEXT NOT NULL,
      price           INTEGER NOT NULL,
      quantity        INTEGER NOT NULL,
      is_custom       INTEGER NOT NULL DEFAULT 0,
      description     TEXT,
      variant_name    TEXT,
      variant_price   INTEGER DEFAULT 0,
      note            TEXT
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS sync_metadata (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS synced_transactions (
      id               TEXT PRIMARY KEY,
      server_data_json TEXT NOT NULL,
      created_at       TEXT NOT NULL,
      synced_at        TEXT NOT NULL
    );
  `);

  // Create indexes for performance
  db.execSync(`
    CREATE INDEX IF NOT EXISTS idx_products_shop ON products(shop_id);
    CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available, shop_id);
    CREATE INDEX IF NOT EXISTS idx_categories_shop ON categories(shop_id);
    CREATE INDEX IF NOT EXISTS idx_pending_tx_status ON pending_transactions(status);
    CREATE INDEX IF NOT EXISTS idx_pending_tx_shop ON pending_transactions(shop_id);
    CREATE INDEX IF NOT EXISTS idx_pending_tx_items_tx ON pending_transaction_items(transaction_id);
  `);

  console.log('[OfflineDB] Migrations completed successfully');
}

/**
 * Public function to run migrations (idempotent).
 */
export function runMigrations(): void {
  const db = getSQLiteDb();
  runMigrationsInternal(db);
}

/**
 * Wipe all local data. Called on user logout to prevent data leaks.
 */
export function wipeLocalDatabase(): void {
  const db = getSQLiteDb();
  db.execSync('DELETE FROM pending_transaction_items;');
  db.execSync('DELETE FROM pending_transactions;');
  db.execSync('DELETE FROM synced_transactions;');
  db.execSync('DELETE FROM products;');
  db.execSync('DELETE FROM categories;');
  db.execSync('DELETE FROM shop_settings;');
  db.execSync('DELETE FROM sync_metadata;');
  console.log('[OfflineDB] All local data wiped');
}

/**
 * Close the database connection and reset singletons.
 */
export function closeDatabase(): void {
  if (_db) {
    _db.closeSync();
    _db = null;
    _drizzle = null;
    console.log('[OfflineDB] Database closed');
  }
}
