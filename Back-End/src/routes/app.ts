import { Router } from 'express';
import { pool } from '../db/pool.js';
import { withTransaction } from '../db/with-transaction.js';
import { HttpError } from '../http/errors.js';
import { validateBody } from '../http/validate.js';
import { z } from 'zod';

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
  stock: z.coerce.number().int().nonnegative(),
  minStock: z.coerce.number().int().nonnegative().nullish(),
  cost: z.coerce.number().int().nonnegative().nullish(),
  discount: z.coerce.number().min(0).max(100).default(0),
  image: z.string().trim().nullish()
});

const CategorySchema = z.object({
  name: z.string().trim().min(1)
});

export async function buildAppState() {
  const [products, txs, wastes, cats] = await Promise.all([
    pool.query(
      `SELECT p.id::text, p.name, p.description, p.price, p.discount, c.name as category, p.stock, p.min_stock, p.cost, p.image
       FROM coffeepos.products p
       LEFT JOIN coffeepos.categories c ON p.category_id = c.id
       ORDER BY p.name ASC`
    ),
    pool.query(
      `SELECT
         t.id::text AS id,
         t.created_at AS date,
         t.grand_total AS total,
         (SELECT COALESCE(SUM(p.cost * i.quantity), 0)
            FROM coffeepos.transaction_items i
            LEFT JOIN coffeepos.products p ON p.id = i.product_id
           WHERE i.transaction_id = t.id) AS cost,
         (t.subtotal - (SELECT COALESCE(SUM(p.cost * i.quantity), 0)
            FROM coffeepos.transaction_items i
            LEFT JOIN coffeepos.products p ON p.id = i.product_id
           WHERE i.transaction_id = t.id)) AS profit,
         t.payment_method,
         t.customer_name,
         t.table_number,
         11 AS tax_rate,
         'dine-in'::text AS order_type,
         NULL::text AS order_note,
         (
           SELECT COALESCE(
             json_agg(
               json_build_object(
                 'productId', COALESCE(i.product_id::text, 'manual'),
                 'quantity', i.quantity,
                 'price', i.price,
                 'note', i.name,
                 'modifiers', '[]'::json
               )
             ),
             '[]'::json
           )
           FROM coffeepos.transaction_items i
           WHERE i.transaction_id = t.id
         ) AS items
       FROM coffeepos.transactions t
       ORDER BY t.created_at DESC
       LIMIT 200`
    ),
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
       ORDER BY w.created_at DESC
       LIMIT 500`
    ),
    pool.query(`SELECT id::text, name FROM coffeepos.categories ORDER BY name ASC`)
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
      unit: 'pcs',
      image: p.image || null
    })),
    transactions: txs.rows.map((t) => ({
      id: t.id,
      date: new Date(t.date).toISOString(),
      items: t.items,
      total: Number(t.total),
      cost: Number(t.cost),
      profit: Number(t.profit),
      paymentMethod: t.payment_method,
      customerName: t.customer_name ?? undefined,
      tableNumber: t.table_number ?? undefined,
      taxRate: Number(t.tax_rate),
      orderType: t.order_type,
      orderNote: t.order_note ?? undefined
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

// GET /app/state
appRouter.get('/state', async (_req, res, next) => {
  try {
    console.log('[DB] GET /app/state - Mengambil snapshot data dengan tabel categories...');
    res.json(await buildAppState());
  } catch (err) {
    next(err);
  }
});

// POST /app/waste-logs
appRouter.post('/waste-logs', validateBody(CreateWasteLogSchema), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof CreateWasteLogSchema>;
    await withTransaction(async (client) => {
      const product = await client.query(
        `SELECT id::text, name, stock, cost FROM coffeepos.products WHERE id = $1::uuid FOR UPDATE`,
        [body.productId]
      );
      if (product.rowCount === 0) throw new HttpError(400, 'UNKNOWN_PRODUCT', 'productId not found');
      const p = product.rows[0];
      const stock = Number(p.stock);
      const cost = Number(p.cost ?? 0);
      if (stock < body.quantity) throw new HttpError(409, 'INSUFFICIENT_STOCK', 'Insufficient stock');
      await client.query(`UPDATE coffeepos.products SET stock = stock - $2::int, updated_at = now() WHERE id = $1::uuid`, [body.productId, body.quantity]);
      await client.query(`INSERT INTO coffeepos.waste_logs (product_id, quantity, reason, loss_amount) VALUES ($1::uuid, $2::int, $3::text, $4::int)`, [body.productId, body.quantity, body.reason, cost * body.quantity]);
    });
    res.status(201).json(await buildAppState());
  } catch (err) {
    next(err);
  }
});
// POST /app/products
appRouter.post('/products', validateBody(ProductSchema), async (req, res, next) => {
  try {
    const body = req.body as any;
    await pool.query(
      `INSERT INTO coffeepos.products (name, description, price, discount, category, category_id, stock, min_stock, cost, image)
       VALUES ($1, $2, $3, $4, $5, (SELECT id FROM coffeepos.categories WHERE name = $5 LIMIT 1), $6, $7, $8, $9)`,
      [body.name, body.description || '', body.price, body.discount || 0, body.category, body.stock, body.minStock || 5, body.cost || 0, body.image || null]
    );
    res.status(201).json(await buildAppState());
  } catch (err: any) {
    console.error('[DB] Error inserting product:', err);
    if (err.code === '23502') { // NOT NULL violation
      return next(new HttpError(400, 'INVALID_CATEGORY', 'Kategori tidak ditemukan di database'));
    }
    next(err);
  }
});

// PUT /app/products/:id
appRouter.put('/products/:id', validateBody(ProductSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body as any;
    const result = await pool.query(
      `UPDATE coffeepos.products
       SET name = $1, description = $2, price = $3, discount = $4, category = $5, 
           category_id = (SELECT id FROM coffeepos.categories WHERE name = $5 LIMIT 1), 
           stock = $6, min_stock = $7, cost = $8, image = $9, updated_at = now()
       WHERE id = $10::uuid`,
      [body.name, body.description || '', body.price, body.discount || 0, body.category, body.stock, body.minStock || 5, body.cost || 0, body.image || null, id]
    );
    if (result.rowCount === 0) throw new HttpError(404, 'NOT_FOUND', 'Product not found');
    res.json(await buildAppState());
  } catch (err: any) {
    console.error('[DB] Error updating product:', err);
    if (err.code === '23502') { // NOT NULL violation
      return next(new HttpError(400, 'INVALID_CATEGORY', 'Kategori tidak ditemukan di database'));
    }
    next(err);
  }
});

// DELETE /app/products/:id
appRouter.delete('/products/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`DELETE FROM coffeepos.products WHERE id = $1::uuid`, [id]);
    if (result.rowCount === 0) throw new HttpError(404, 'NOT_FOUND', 'Product not found');
    res.json(await buildAppState());
  } catch (err) {
    next(err);
  }
});

// POST /app/categories
appRouter.post('/categories', validateBody(CategorySchema), async (req, res, next) => {
  try {
    await pool.query(`INSERT INTO coffeepos.categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, [req.body.name]);
    res.json(await buildAppState());
  } catch (err) {
    next(err);
  }
});

// DELETE /app/categories/:name
appRouter.delete('/categories/:name', async (req, res, next) => {
  try {
    // Note: User should handle product reassignment before deleting category in UI
    await pool.query(`DELETE FROM coffeepos.categories WHERE name = $1`, [req.params.name]);
    res.json(await buildAppState());
  } catch (err) {
    next(err);
  }
});
