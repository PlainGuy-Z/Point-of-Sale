/*
 * SQL Migration (run once):
 *
 * -- Allow stock = -1 for unlimited/untracked products
 * ALTER TABLE products DROP CONSTRAINT IF EXISTS products_stock_check;
 * ALTER TABLE products ADD CONSTRAINT products_stock_check CHECK (stock >= -1);
 *
 * ALTER TABLE products
 *   ADD COLUMN IF NOT EXISTS discount INTEGER NOT NULL DEFAULT 0
 *   CHECK (discount >= 0 AND discount <= 100);
 *
 * ALTER TABLE products
 *   ADD COLUMN IF NOT EXISTS is_promo BOOLEAN NOT NULL DEFAULT false;
 *
 * ALTER TABLE products
 *   ADD COLUMN IF NOT EXISTS promo_price INTEGER;
 *
 * ALTER TABLE products
 *   ADD COLUMN IF NOT EXISTS promo_label TEXT;
 *
 * ALTER TABLE products
 *   ADD COLUMN IF NOT EXISTS promo_start DATE;
 *
 * ALTER TABLE products
 *   ADD COLUMN IF NOT EXISTS promo_end DATE;
 *
 * ALTER TABLE products
 *   ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT true;
 */

import { Router } from 'express';
import { pool } from '../db/pool.js';
import { withTransaction } from '../db/with-transaction.js';
import { HttpError } from '../http/errors.js';
import { validateBody } from '../http/validate.js';
import { z } from 'zod';
import { requireRole } from '../middleware/requireRole.js';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';

export const appRouter = Router();

const CreateWasteLogSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().positive(),
  reason: z.enum(['expired', 'damaged', 'spilled', 'other']),
  notes: z.string().trim().max(500).optional()
});

const ProductSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().nullish(),
  price: z.coerce.number().int().nonnegative(),
  category: z.string().trim().min(1),
  stock: z.coerce.number().int().min(-1),
  minStock: z.coerce.number().int().nonnegative().nullish(),
  cost: z.coerce.number().int().nonnegative().nullish(),
  image: z.string().trim().nullish(),
  discount: z.coerce.number().int().min(0).max(100).default(0),
  isPromo: z.boolean().default(false),
  promoPrice: z.coerce.number().int().nonnegative().nullish(),
  promoLabel: z.string().trim().nullish(),
  promoStart: z.string().trim().nullish(),
  promoEnd: z.string().trim().nullish(),
  isAvailable: z.boolean().default(true),
});

const CategorySchema = z.object({
  name: z.string().trim().min(1)
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = 'public/uploads';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only images (jpeg, jpg, png, webp) are allowed!'));
  }
});



/* ─── Helper: ensure category exists, filtered by shop ──────── */

async function ensureCategory(
  categoryName: string,
  shopId: string,
  client?: import('pg').PoolClient
): Promise<string> {
  const queryRunner = client ?? pool;
  const existing = await queryRunner.query(
    `SELECT id::text FROM coffeepos.categories WHERE name = $1 AND shop_id = $2::uuid LIMIT 1`,
    [categoryName, shopId]
  );
  if (existing.rowCount! > 0) return existing.rows[0].id;

  const inserted = await queryRunner.query(
    `INSERT INTO coffeepos.categories (name, shop_id) VALUES ($1, $2::uuid)
     ON CONFLICT (name, shop_id) DO UPDATE SET name = EXCLUDED.name
     RETURNING id::text`,
    [categoryName, shopId]
  );
  return inserted.rows[0].id;
}

/* ─── buildAppState ─────────────────────────────────────────── */

export async function buildAppState(shopId: string) {
  const products = await pool.query(
    `SELECT p.id::text, p.name, p.description, p.price,
            c.name as category, p.stock, p.min_stock, p.cost,
            p.image, p.discount, p.is_promo, p.promo_price,
            p.promo_label, p.promo_start, p.promo_end, p.is_available
     FROM coffeepos.products p
     LEFT JOIN coffeepos.categories c ON p.category_id = c.id
     WHERE p.shop_id = $1::uuid
     ORDER BY p.name ASC`,
    [shopId]
  );

  // STEP 1 — Fetch transactions WITHOUT items subquery
  const txQuery = await pool.query(`
    SELECT
      t.id::text AS id,
      t.created_at AS date,
      t.grand_total AS total,
      t.subtotal,
      t.tax,
      t.payment_method,
      t.customer_name,
      t.table_number,
      t.notes,
      t.cashier_name,
      t.status,
      ss.tax_rate AS tax_rate,
      'dine-in'::text AS order_type,
      NULL::text AS order_note,
      (SELECT COALESCE(SUM(p.cost * i.quantity), 0)
         FROM coffeepos.transaction_items i
         LEFT JOIN coffeepos.products p ON p.id = i.product_id
        WHERE i.transaction_id = t.id) AS cost,
      (t.subtotal - (SELECT COALESCE(SUM(p.cost * i.quantity), 0)
         FROM coffeepos.transaction_items i
         LEFT JOIN coffeepos.products p ON p.id = i.product_id
        WHERE i.transaction_id = t.id)) AS profit
    FROM coffeepos.transactions t
    LEFT JOIN coffeepos.shop_settings ss ON ss.shop_id = t.shop_id
    WHERE t.shop_id = $1::uuid
      AND COALESCE(t.status::text, 'completed') <> 'voided'
    ORDER BY t.created_at DESC
    LIMIT 200
  `, [shopId]);

  // STEP 2 — Fetch ALL items for those transactions in ONE query
  const txIds = txQuery.rows.map(r => r.id);
  let itemsMap = new Map<string, any[]>();
  
  if (txIds.length > 0) {
    const itemsQuery = await pool.query(`
      SELECT
        i.transaction_id::text,
        COALESCE(i.product_id::text, 'manual') AS "productId",
        i.quantity,
        i.price,
        i.name AS note,
        '[]'::json AS modifiers
      FROM coffeepos.transaction_items i
      WHERE i.transaction_id = ANY($1::uuid[])
    `, [txIds]);
    
    for (const row of itemsQuery.rows) {
      const txId = row.transaction_id;
      if (!itemsMap.has(txId)) itemsMap.set(txId, []);
      itemsMap.get(txId)!.push({
        productId: row.productId,
        quantity: Number(row.quantity),
        price: Number(row.price),
        note: row.note,
        modifiers: [],
      });
    }
  }

  // Fetch wastes and cats
  const [wastes, cats] = await Promise.all([
    pool.query(
      `SELECT
         w.id::text AS id,
         w.product_id::text AS product_id,
         p.name AS product_name,
         w.quantity,
         w.reason,
         w.loss_amount AS cost_loss,
         w.created_at AS date
       FROM coffeepos.waste_logs w
       JOIN coffeepos.products p ON p.id = w.product_id
       WHERE w.shop_id = $1::uuid
       ORDER BY w.created_at DESC
       LIMIT 500`,
      [shopId]
    ),
    pool.query(
      `SELECT id::text, name FROM coffeepos.categories WHERE shop_id = $1::uuid ORDER BY name ASC`,
      [shopId]
    )
  ]);

  const categories = cats.rows.map(r => r.name);

  return {
    products: products.rows.map((p) => ({
      ...p,
      category: p.category || 'Uncategorized',
      stock: Number(p.stock),
      minStock: Number(p.min_stock ?? 5),
      price: Number(p.price),
      cost: p.cost === null ? undefined : Number(p.cost),
      discount: Number(p.discount ?? 0),
      isPromo: Boolean(p.is_promo),
      promoPrice: p.promo_price ? Number(p.promo_price) : undefined,
      promoLabel: p.promo_label ?? undefined,
      promoStart: p.promo_start ?? undefined,
      promoEnd: p.promo_end ?? undefined,
      isAvailable: p.is_available !== false,
      unit: 'pcs',
      image: p.image || null
    })),
    transactions: txQuery.rows.map((t) => ({
      id: t.id,
      date: new Date(t.date).toISOString(),
      items: itemsMap.get(t.id) || [],
      total: Number(t.total),
      cost: Number(t.cost),
      profit: Number(t.profit),
      paymentMethod: t.payment_method,
      customerName: t.customer_name ?? undefined,
      tableNumber: t.table_number ?? undefined,
      cashierName: t.cashier_name,
      taxRate: Number(t.tax_rate ?? 11),
      orderType: t.order_type,
      orderNote: t.order_note ?? undefined,
    })),
    wasteLogs: wastes.rows.map((w) => ({
      id: w.id,
      productId: w.product_id,
      productName: w.product_name,
      quantity: Number(w.quantity),
      reason: w.reason,
      date: new Date(w.date).toISOString(),
      costLoss: Number(w.cost_loss),
      notes: undefined
    })),
    customers: [],
    settings: {
      storeName: 'Coffee Shop',
      address: 'Jl. Utama No. 123',
      taxRate: 11,
      currency: 'IDR',
      currencyPosition: 'before',
      decimalPlaces: 0,
      thousandsSeparator: 'comma',
      receiptFooter: 'Terima kasih telah berbelanja!'
    },
    categories,
    categoriesWithId: cats.rows.map(r => ({ id: r.id, name: r.name }))
  };
}

// GET /app/export/products
appRouter.get('/export/products', async (req, res, next) => {
  try {
    const shopId = req.user!.shop_id;
    const { rows } = await pool.query(
      `SELECT p.name, p.description, p.price, c.name as category, p.stock, p.cost, p.is_available
       FROM coffeepos.products p
       LEFT JOIN coffeepos.categories c ON p.category_id = c.id
       WHERE p.shop_id = $1::uuid
       ORDER BY p.name ASC`,
      [shopId]
    );

    const headers = ['Name', 'Description', 'Price', 'Category', 'Stock', 'Cost', 'Available'];
    const csv = [
      headers.join(','),
      ...rows.map(r => [
        `"${r.name}"`,
        `"${r.description || ''}"`,
        r.price,
        `"${r.category || 'Uncategorized'}"`,
        r.stock,
        r.cost || 0,
        r.is_available
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

// GET /app/export/transactions
appRouter.get('/export/transactions', async (req, res, next) => {
  try {
    const shopId = req.user!.shop_id;
    const { from, to } = req.query;
    
    let query = `
      SELECT t.created_at, t.grand_total, t.payment_method, t.cashier_name, t.customer_name, t.status
      FROM coffeepos.transactions t
      WHERE t.shop_id = $1::uuid
    `;
    const params: any[] = [shopId];

    if (from) {
      params.push(from);
      query += ` AND t.created_at >= $${params.length}`;
    }
    if (to) {
      params.push(to);
      query += ` AND t.created_at <= $${params.length}`;
    }
    query += ` ORDER BY t.created_at DESC`;

    const { rows } = await pool.query(query, params);

    const headers = ['Date', 'Total', 'Payment Method', 'Cashier', 'Customer', 'Status'];
    const csv = [
      headers.join(','),
      ...rows.map(r => [
        new Date(r.created_at).toISOString(),
        r.grand_total,
        r.payment_method,
        `"${r.cashier_name}"`,
        `"${r.customer_name || ''}"`,
        r.status
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

// DELETE /app/data/transactions (Reset Data)
appRouter.delete('/data/transactions', async (req, res, next) => {
  try {
    const shopId = req.user!.shop_id;
    if (req.user!.role !== 'owner') throw new HttpError(403, 'FORBIDDEN', 'Only owner can reset data');

    await withTransaction(async (client) => {
      // Delete waste logs first due to FK or just dependency
      await client.query(`DELETE FROM coffeepos.waste_logs WHERE shop_id = $1::uuid`, [shopId]);
      // Delete transaction items then transactions
      await client.query(`DELETE FROM coffeepos.transaction_items WHERE transaction_id IN (SELECT id FROM coffeepos.transactions WHERE shop_id = $1::uuid)`, [shopId]);
      await client.query(`DELETE FROM coffeepos.transactions WHERE shop_id = $1::uuid`, [shopId]);
    });

    res.json(await buildAppState(shopId));
  } catch (err) {
    next(err);
  }
});

// GET /app/state
appRouter.get('/state', async (req, res, next) => {
  try {
    console.log('[DB] GET /app/state - Mengambil snapshot data dengan tabel categories...');
    res.json(await buildAppState(req.user!.shop_id));
  } catch (err) {
    next(err);
  }
});

// POST /app/waste-logs
appRouter.post('/waste-logs', validateBody(CreateWasteLogSchema), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof CreateWasteLogSchema>;
    const shopId = req.user!.shop_id;
    await withTransaction(async (client) => {
      const product = await client.query(
        `SELECT id::text, name, stock, cost FROM coffeepos.products WHERE id = $1::uuid AND shop_id = $2::uuid FOR UPDATE`,
        [body.productId, shopId]
      );
      if (product.rowCount === 0) throw new HttpError(400, 'UNKNOWN_PRODUCT', 'productId not found');
      const p = product.rows[0];
      const stock = Number(p.stock);
      const cost = Number(p.cost ?? 0);
      if (stock < body.quantity) throw new HttpError(409, 'INSUFFICIENT_STOCK', 'Insufficient stock');
      await client.query(`UPDATE coffeepos.products SET stock = stock - $2::int, updated_at = now() WHERE id = $1::uuid AND shop_id = $3::uuid`, [body.productId, body.quantity, shopId]);
      await client.query(`INSERT INTO coffeepos.waste_logs (product_id, quantity, reason, loss_amount, shop_id) VALUES ($1::uuid, $2::int, $3::text, $4::int, $5::uuid)`, [body.productId, body.quantity, body.reason, cost * body.quantity, shopId]);
    });
    res.status(201).json(await buildAppState(shopId));
  } catch (err) {
    next(err);
  }
});

// POST /app/products
appRouter.post('/products', requireRole('owner'), validateBody(ProductSchema), async (req, res, next) => {
  try {
    const body = req.body as any;
    const shopId = req.user!.shop_id;
    const categoryId = await ensureCategory(body.category, shopId);
    await pool.query(
      `INSERT INTO coffeepos.products
        (name, description, price, category, category_id, stock, min_stock, cost, image,
         discount, is_promo, promo_price, promo_label, promo_start, promo_end, is_available, shop_id)
       VALUES ($1, $2, $3, $4, $5::uuid,
               $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17::uuid)`,
      [body.name, body.description || '', body.price, body.category, categoryId,
       body.stock, body.minStock || 5, body.cost || 0, body.image || null,
       body.discount || 0, body.isPromo || false, body.promoPrice || null,
       body.promoLabel || null, body.promoStart || null, body.promoEnd || null,
       body.isAvailable !== false, shopId]
    );
    res.status(201).json(await buildAppState(shopId));
  } catch (err: any) {
    console.error('[DB] Error inserting product:', err);
    if (err.code === '23502') { // NOT NULL violation
      return next(new HttpError(400, 'INVALID_CATEGORY', 'Kategori tidak ditemukan di database'));
    }
    next(err);
  }
});

// PUT /app/products/:id
appRouter.put('/products/:id', requireRole('owner'), validateBody(ProductSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body as any;
    const shopId = req.user!.shop_id;
    const categoryId = await ensureCategory(body.category, shopId);
    const result = await pool.query(
      `UPDATE coffeepos.products
       SET name = $1, description = $2, price = $3, category = $4,
           category_id = $5::uuid,
           stock = $6, min_stock = $7, cost = $8, image = $9,
           discount = $10, is_promo = $11, promo_price = $12,
           promo_label = $13, promo_start = $14, promo_end = $15,
           is_available = $16,
           updated_at = now()
       WHERE id = $17::uuid AND shop_id = $18::uuid`,
      [body.name, body.description || '', body.price, body.category, categoryId,
       body.stock, body.minStock || 5, body.cost || 0, body.image || null,
       body.discount || 0, body.isPromo || false, body.promoPrice || null,
       body.promoLabel || null, body.promoStart || null, body.promoEnd || null,
       body.isAvailable !== false, id, shopId]
    );
    if (result.rowCount === 0) throw new HttpError(404, 'NOT_FOUND', 'Product not found');
    res.json(await buildAppState(shopId));
  } catch (err: any) {
    console.error('[DB] Error updating product:', err);
    if (err.code === '23502') { // NOT NULL violation
      return next(new HttpError(400, 'INVALID_CATEGORY', 'Kategori tidak ditemukan di database'));
    }
    next(err);
  }
});

// DELETE /app/products/:id
appRouter.delete('/products/:id', requireRole('owner'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const shopId = req.user!.shop_id;
    const result = await pool.query(`DELETE FROM coffeepos.products WHERE id = $1::uuid AND shop_id = $2::uuid`, [id, shopId]);
    if (result.rowCount === 0) throw new HttpError(404, 'NOT_FOUND', 'Product not found');
    res.json(await buildAppState(shopId));
  } catch (err) {
    next(err);
  }
});

// POST /app/categories
appRouter.post('/categories', requireRole('owner'), validateBody(CategorySchema), async (req, res, next) => {
  try {
    const shopId = req.user!.shop_id;
    await pool.query(
      `INSERT INTO coffeepos.categories (name, shop_id) VALUES ($1, $2::uuid) ON CONFLICT (name, shop_id) DO NOTHING`,
      [req.body.name, shopId]
    );
    res.json(await buildAppState(shopId));
  } catch (err) {
    next(err);
  }
});

// DELETE /app/categories/:name
appRouter.delete('/categories/:name', requireRole('owner'), async (req, res, next) => {
  try {
    const shopId = req.user!.shop_id;
    // Note: User should handle product reassignment before deleting category in UI
    await pool.query(`DELETE FROM coffeepos.categories WHERE name = $1 AND shop_id = $2::uuid`, [req.params.name, shopId]);
    res.json(await buildAppState(shopId));
  } catch (err) {
    next(err);
  }
});
// POST /app/upload
appRouter.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  } catch (err) {
    console.error('[Upload] Error:', err);
    res.status(500).json({ message: 'Internal server error during upload' });
  }
});
