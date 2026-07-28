/**
 * Catalog Sync Service
 * 
 * Handles syncing read-only reference data from the server to local SQLite:
 *   - Products (with pricing, stock, promo info)
 *   - Categories
 *   - Shop settings (tax, service charge)
 * 
 * Supports both full sync (first launch / stale) and delta sync (incremental).
 */

import { eq } from 'drizzle-orm';
import { getDb, getSQLiteDb } from './database';
import { products, categories, shopSettings, syncMetadata } from './schema';
import { http } from '../api';
import type { Product } from '../../types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CatalogSyncResponse {
  products: ServerProduct[];
  categories: ServerCategory[];
  settings: ServerShopSettings;
  timestamp: string;
  is_full_sync: boolean;
}

interface ServerProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  categoryId?: string;
  stock: number;
  cost?: number;
  minStock?: number;
  image?: string;
  discount?: number;
  isPromo?: boolean;
  promoPrice?: number;
  promoLabel?: string;
  promoStart?: string;
  promoEnd?: string;
  isAvailable?: boolean;
  shopId?: string;
  updatedAt?: string;
}

interface ServerCategory {
  id: string;
  name: string;
  shopId?: string;
}

interface ServerShopSettings {
  shopId: string;
  taxEnabled?: boolean;
  taxRate?: number;
  taxLabel?: string;
  taxInclusive?: boolean;
  serviceChargeEnabled?: boolean;
  serviceChargeRate?: number;
  serviceChargeLabel?: string;
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

function getSyncTimestamp(key: string): string | null {
  const db = getDb();
  const row = db.select().from(syncMetadata).where(eq(syncMetadata.key, key)).get();
  return row?.value ?? null;
}

function setSyncTimestamp(key: string, value: string): void {
  const sqlite = getSQLiteDb();
  const now = new Date().toISOString();
  sqlite.runSync(
    `INSERT OR REPLACE INTO sync_metadata (key, value, updated_at) VALUES (?, ?, ?)`,
    [key, value, now]
  );
}

// ─── Product Sync ────────────────────────────────────────────────────────────

function upsertProducts(serverProducts: ServerProduct[]): void {
  if (serverProducts.length === 0) return;
  const sqlite = getSQLiteDb();
  const now = new Date().toISOString();

  // Use a transaction for atomicity
  sqlite.execSync('BEGIN TRANSACTION;');
  try {
    for (const p of serverProducts) {
      sqlite.runSync(
        `INSERT OR REPLACE INTO products 
          (id, name, description, price, category, category_id, stock, cost, min_stock,
           image, discount, is_promo, promo_price, promo_label, promo_start, promo_end,
           is_available, shop_id, updated_at, local_stock_adj)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
           COALESCE((SELECT local_stock_adj FROM products WHERE id = ?), 0))`,
        [
          p.id,
          p.name,
          p.description ?? null,
          p.price,
          p.category ?? null,
          p.categoryId ?? null,
          p.stock,
          p.cost ?? 0,
          p.minStock ?? 0,
          p.image ?? null,
          p.discount ?? 0,
          p.isPromo ? 1 : 0,
          p.promoPrice ?? 0,
          p.promoLabel ?? null,
          p.promoStart ?? null,
          p.promoEnd ?? null,
          p.isAvailable !== false ? 1 : 0,
          p.shopId ?? null,
          p.updatedAt ?? now,
          // Preserve existing local_stock_adj if product exists
          p.id,
        ]
      );
    }
    sqlite.execSync('COMMIT;');
  } catch (err) {
    sqlite.execSync('ROLLBACK;');
    throw err;
  }
}

function upsertCategories(serverCategories: ServerCategory[]): void {
  const sqlite = getSQLiteDb();
  sqlite.execSync('BEGIN TRANSACTION;');
  try {
    // For full sync: clear and re-insert
    sqlite.execSync('DELETE FROM categories;');
    for (const c of serverCategories) {
      sqlite.runSync(
        `INSERT INTO categories (id, name, shop_id) VALUES (?, ?, ?)`,
        [c.id, c.name, c.shopId ?? null]
      );
    }
    sqlite.execSync('COMMIT;');
  } catch (err) {
    sqlite.execSync('ROLLBACK;');
    throw err;
  }
}

function upsertShopSettings(s: ServerShopSettings): void {
  const sqlite = getSQLiteDb();
  const now = new Date().toISOString();
  sqlite.runSync(
    `INSERT OR REPLACE INTO shop_settings
       (shop_id, tax_enabled, tax_rate, tax_label, tax_inclusive,
        service_charge_enabled, service_charge_rate, service_charge_label, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      s.shopId,
      s.taxEnabled !== false ? 1 : 0,
      s.taxRate ?? 11.0,
      s.taxLabel ?? 'PPN',
      s.taxInclusive ? 1 : 0,
      s.serviceChargeEnabled ? 1 : 0,
      s.serviceChargeRate ?? 0.0,
      s.serviceChargeLabel ?? 'Service',
      now,
    ]
  );
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Sync catalog data from server to local SQLite.
 * Uses delta sync if we have a previous sync timestamp, otherwise full sync.
 */
export async function syncCatalog(): Promise<{ synced: boolean; productsCount: number }> {
  try {
    const lastSync = getSyncTimestamp('last_catalog_sync');
    const queryParam = lastSync ? `?since=${encodeURIComponent(lastSync)}` : '';

    console.log(`[CatalogSync] Fetching catalog${lastSync ? ` (delta since ${lastSync})` : ' (full)'}...`);

    const response = await http<CatalogSyncResponse>(
      `/pos/sync/catalog${queryParam}`,
      {},
      30_000
    );

    // Upsert all data
    upsertProducts(response.products);
    upsertCategories(response.categories);
    if (response.settings) {
      upsertShopSettings(response.settings);
    }

    // Update sync timestamp
    setSyncTimestamp('last_catalog_sync', response.timestamp);

    console.log(`[CatalogSync] Synced ${response.products.length} products, ${response.categories.length} categories`);
    return { synced: true, productsCount: response.products.length };
  } catch (err) {
    console.error('[CatalogSync] Failed to sync catalog:', err);
    return { synced: false, productsCount: 0 };
  }
}

/**
 * Load all cached products from local SQLite.
 * Adjusts stock by local_stock_adj for accurate offline display.
 */
export function getLocalProducts(): Product[] {
  const db = getDb();
  const rows = db.select().from(products).all();

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description ?? undefined,
    price: r.price,
    category: r.category ?? 'Other',
    categoryId: r.categoryId ?? undefined,
    // Adjust stock for pending offline transactions
    stock: r.stock === -1 ? -1 : Math.max(0, r.stock - (r.localStockAdj ?? 0)),
    cost: r.cost ?? 0,
    minStock: r.minStock ?? 0,
    unit: 'pcs',
    image: r.image ?? undefined,
    discount: r.discount ?? 0,
    isPromo: r.isPromo ?? false,
    promoPrice: r.promoPrice ?? 0,
    promoLabel: r.promoLabel ?? undefined,
    promoStart: r.promoStart ?? undefined,
    promoEnd: r.promoEnd ?? undefined,
    isAvailable: r.isAvailable ?? true,
  }));
}

/**
 * Load all cached categories from local SQLite.
 */
export function getLocalCategories(): { names: string[]; withId: { id: string; name: string }[] } {
  const db = getDb();
  const rows = db.select().from(categories).all();
  return {
    names: rows.map((r) => r.name),
    withId: rows.map((r) => ({ id: r.id, name: r.name })),
  };
}

/**
 * Load cached shop settings from local SQLite.
 */
export function getLocalShopSettings(): ServerShopSettings | null {
  const db = getDb();
  const row = db.select().from(shopSettings).limit(1).get();
  if (!row) return null;
  return {
    shopId: row.shopId,
    taxEnabled: row.taxEnabled ?? true,
    taxRate: row.taxRate ?? 11.0,
    taxLabel: row.taxLabel ?? 'PPN',
    taxInclusive: row.taxInclusive ?? false,
    serviceChargeEnabled: row.serviceChargeEnabled ?? false,
    serviceChargeRate: row.serviceChargeRate ?? 0.0,
    serviceChargeLabel: row.serviceChargeLabel ?? 'Service',
  };
}

/**
 * Check if we have any locally cached catalog data.
 */
export function hasLocalCatalog(): boolean {
  const db = getDb();
  const row = db.select().from(products).limit(1).get();
  return !!row;
}

/**
 * Reset local_stock_adj for all products after successful sync.
 * Called when all pending transactions have been synced and server stock is refreshed.
 */
export function resetLocalStockAdj(): void {
  const sqlite = getSQLiteDb();
  sqlite.runSync('UPDATE products SET local_stock_adj = 0');
  console.log('[CatalogSync] Reset local_stock_adj for all products');
}

/**
 * Increment local_stock_adj for a specific product (when an offline transaction is created).
 */
export function incrementLocalStockAdj(productId: string, qty: number): void {
  const sqlite = getSQLiteDb();
  sqlite.runSync(
    'UPDATE products SET local_stock_adj = local_stock_adj + ? WHERE id = ?',
    [qty, productId]
  );
}
