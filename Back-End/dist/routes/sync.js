/**
 * Sync Routes — Backend endpoints for offline-first sync
 *
 * Endpoints:
 *   GET  /pos/sync/catalog   — Download catalog (products, categories, settings) for offline cache
 *   POST /pos/sync           — Batch upload offline transactions (Phase 2)
 */
import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { withTransaction } from '../db/with-transaction.js';
import { validateBody } from '../http/validate.js';
import { validateAndInsertTransaction } from '../services/syncValidator.js';
export const syncRouter = Router();
// ─── GET /pos/sync/catalog ──────────────────────────────────────────────────
// Downloads products, categories, and shop settings for local offline cache.
// Supports delta sync via `?since=<ISO_TIMESTAMP>`.
syncRouter.get('/catalog', async (req, res, next) => {
    try {
        const shopId = req.user.shop_id;
        const since = typeof req.query.since === 'string' ? req.query.since.trim() : null;
        const isFullSync = !since;
        console.log(`[Sync] GET /pos/sync/catalog — shop=${shopId}, since=${since ?? 'FULL'}`);
        // ── Products ─────────────────────────────────────────────────────────────
        let productsQuery;
        const productsParams = [shopId];
        if (isFullSync) {
            productsQuery = `
        SELECT
          id::text, name, description, price, category,
          category_id::text AS "categoryId",
          stock, cost, min_stock AS "minStock",
          image, discount,
          is_promo AS "isPromo",
          promo_price AS "promoPrice",
          promo_label AS "promoLabel",
          promo_start::text AS "promoStart",
          promo_end::text AS "promoEnd",
          is_available AS "isAvailable",
          shop_id::text AS "shopId",
          updated_at AS "updatedAt"
        FROM coffeepos.products
        WHERE shop_id = $1::uuid AND is_deleted = false
        ORDER BY name ASC
      `;
        }
        else {
            productsQuery = `
        SELECT
          id::text, name, description, price, category,
          category_id::text AS "categoryId",
          stock, cost, min_stock AS "minStock",
          image, discount,
          is_promo AS "isPromo",
          promo_price AS "promoPrice",
          promo_label AS "promoLabel",
          promo_start::text AS "promoStart",
          promo_end::text AS "promoEnd",
          is_available AS "isAvailable",
          shop_id::text AS "shopId",
          updated_at AS "updatedAt",
          is_deleted AS "isDeleted"
        FROM coffeepos.products
        WHERE shop_id = $1::uuid AND updated_at > $2::timestamptz
        ORDER BY name ASC
      `;
            productsParams.push(since);
        }
        const { rows: productRows } = await pool.query(productsQuery, productsParams);
        // Normalize boolean fields from PostgreSQL
        const productsData = productRows.map((r) => ({
            ...r,
            price: Number(r.price),
            stock: Number(r.stock),
            cost: Number(r.cost ?? 0),
            minStock: Number(r.minStock ?? 0),
            discount: Number(r.discount ?? 0),
            isPromo: Boolean(r.isPromo),
            promoPrice: Number(r.promoPrice ?? 0),
            isAvailable: r.isAvailable !== false,
            isDeleted: Boolean(r.isDeleted),
        }));
        // ── Categories ───────────────────────────────────────────────────────────
        const { rows: categoryRows } = await pool.query(`SELECT id::text, name, shop_id::text AS "shopId"
       FROM coffeepos.categories
       WHERE shop_id = $1::uuid
       ORDER BY name ASC`, [shopId]);
        // ── Shop Settings ────────────────────────────────────────────────────────
        const { rows: settingsRows } = await pool.query(`SELECT
         shop_id::text AS "shopId",
         tax_enabled AS "taxEnabled",
         tax_rate AS "taxRate",
         tax_label AS "taxLabel",
         tax_inclusive AS "taxInclusive",
         service_charge_enabled AS "serviceChargeEnabled",
         service_charge_rate AS "serviceChargeRate",
         service_charge_label AS "serviceChargeLabel"
       FROM coffeepos.shop_settings
       WHERE shop_id = $1::uuid`, [shopId]);
        const settingsData = settingsRows[0]
            ? {
                ...settingsRows[0],
                taxEnabled: settingsRows[0].taxEnabled !== false,
                taxRate: Number(settingsRows[0].taxRate ?? 11),
                taxInclusive: Boolean(settingsRows[0].taxInclusive),
                serviceChargeEnabled: Boolean(settingsRows[0].serviceChargeEnabled),
                serviceChargeRate: Number(settingsRows[0].serviceChargeRate ?? 0),
            }
            : null;
        const timestamp = new Date().toISOString();
        res.json({
            products: productsData,
            categories: categoryRows,
            settings: settingsData,
            timestamp,
            is_full_sync: isFullSync,
        });
    }
    catch (err) {
        console.error('[Sync] Catalog sync failed:', err);
        next(err);
    }
});
// ─── POST /pos/sync ─────────────────────────────────────────────────────────
// Batch upload offline transactions. Each transaction goes through the full
// validation pipeline (price recalc, stock conflict detection, etc.).
const NullableUuid = z.preprocess((val) => (typeof val === 'string' && val.trim().length > 0 ? val.trim() : null), z.string().uuid().nullable().optional());
const SyncCartLineSchema = z.object({
    productId: z.preprocess((val) => (typeof val === 'string' && val.trim().length > 0 ? val.trim() : 'manual-item'), z.string().min(1)),
    quantity: z.coerce.number().int().positive(),
    note: z.string().trim().optional(),
    description: z.string().trim().max(200).optional(),
    variantName: z.string().trim().max(100).optional(),
    variantPrice: z.coerce.number().int().nonnegative().optional(),
    price: z.coerce.number().int().nonnegative().optional(),
});
const SyncTransactionSchema = z.object({
    id: z.string().uuid(),
    idempotency_key: z.string().trim().max(200),
    cart: z.array(SyncCartLineSchema).min(1),
    payment_method: z.preprocess((val) => {
        if (typeof val !== 'string')
            return 'cash';
        const s = val.toLowerCase().trim();
        if (['cash', 'card', 'qris'].includes(s))
            return s;
        return 'card';
    }, z.enum(['cash', 'card', 'qris'])),
    customer_name: z.string().trim().optional(),
    customer_id: NullableUuid,
    table_number: z.string().trim().optional(),
    order_type: z.preprocess((val) => {
        if (typeof val !== 'string')
            return undefined;
        const s = val.toLowerCase().trim();
        if (s === 'takeaway' || s === 'take_away' || s === 'take-away')
            return 'take-away';
        if (s === 'dinein' || s === 'dine_in' || s === 'dine-in')
            return 'dine-in';
        return val;
    }, z.enum(['dine-in', 'take-away']).optional()),
    notes: z.string().trim().optional(),
    order_note: z.string().trim().optional(),
    cash_received: z.coerce.number().int().nonnegative().optional(),
    apply_tax: z.boolean().optional(),
    branch_id: NullableUuid,
    shift_id: NullableUuid,
    created_at: z.string(),
});
const SyncRequestSchema = z.object({
    device_id: z.string().trim().min(1).max(200),
    transactions: z.array(SyncTransactionSchema).min(1).max(50),
});
syncRouter.post('/', validateBody(SyncRequestSchema), async (req, res, next) => {
    try {
        const body = req.body;
        const shopId = req.user.shop_id;
        const cashierId = req.user.id;
        const cashierName = req.user.name;
        const userBranchId = req.user?.branch_id ?? null;
        const deviceId = body.device_id;
        console.log(`[Sync] POST /pos/sync — shop=${shopId}, device=${deviceId}, txCount=${body.transactions.length}`);
        const results = [];
        // Process each transaction in its own DB transaction for isolation.
        // If one fails, others can still succeed.
        for (const offlineTx of body.transactions) {
            try {
                const result = await withTransaction(async (client) => {
                    return validateAndInsertTransaction(client, offlineTx, shopId, cashierId, cashierName, deviceId, userBranchId);
                });
                results.push(result);
            }
            catch (err) {
                console.error(`[Sync] Failed to process tx ${offlineTx.id}:`, err);
                console.error(`[Sync] Full Error Detail: code=${err?.code}, detail=${err?.detail}, constraint=${err?.constraint}`);
                results.push({
                    client_transaction_id: offlineTx.id,
                    status: 'rejected',
                    rejection_reason: err?.message || 'Internal server error during sync',
                    rejection_code: err?.code || 'SYNC_ERROR',
                });
            }
        }
        // Fetch updated products for the client to refresh local cache
        const { rows: updatedProducts } = await pool.query(`SELECT id::text, name, price, stock, is_promo, promo_price, discount, is_available
       FROM coffeepos.products WHERE shop_id = $1::uuid ORDER BY name`, [shopId]);
        res.json({
            results,
            server_timestamp: new Date().toISOString(),
            updated_products: updatedProducts,
        });
    }
    catch (err) {
        console.error('[Sync] Batch sync failed:', err);
        next(err);
    }
});
