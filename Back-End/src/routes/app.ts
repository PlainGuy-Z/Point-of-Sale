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

async function buildAppState() {
  const [products, txs, wastes] = await Promise.all([
    pool.query(
      `SELECT id::text, name, description, price, category, stock, cost
       FROM coffeepos.products
       ORDER BY name ASC`
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
    )
  ]);

  const categories = Array.from(new Set(products.rows.map((p) => String(p.category)).filter(Boolean)));

  return {
    products: products.rows.map((p) => ({
      ...p,
      stock: Number(p.stock),
      price: Number(p.price),
      cost: p.cost === null ? undefined : Number(p.cost),
      minStock: 0,
      unit: 'pcs',
      image: null
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
    categories
  };
}

// GET /app/state
// Returns a snapshot for dashboard hydration (shape matches frontend AppDataState).
appRouter.get('/state', async (_req, res, next) => {
  try {
    res.json(await buildAppState());
  } catch (err) {
    next(err);
  }
});

// POST /app/waste-logs
// Insert waste log + decrement product stock atomically.
appRouter.post('/waste-logs', validateBody(CreateWasteLogSchema), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof CreateWasteLogSchema>;

    await withTransaction(async (client) => {
      const product = await client.query(
        `SELECT id::text, name, stock, cost
         FROM coffeepos.products
         WHERE id = $1::uuid
         FOR UPDATE`,
        [body.productId]
      );
      if (product.rowCount === 0) throw new HttpError(400, 'UNKNOWN_PRODUCT', 'productId not found');

      const p = product.rows[0];
      const stock = Number(p.stock);
      const cost = Number(p.cost ?? 0);

      if (stock < body.quantity) {
        throw new HttpError(409, 'INSUFFICIENT_STOCK', 'Insufficient stock for waste logging', {
          productId: body.productId,
          available: stock,
          requested: body.quantity
        });
      }

      await client.query(
        `UPDATE coffeepos.products
         SET stock = stock - $2::int,
             updated_at = now()
         WHERE id = $1::uuid`,
        [body.productId, body.quantity]
      );

      const lossAmount = cost * body.quantity;
      // Notes are not stored in schema.sql; keep reason clean.
      await client.query(
        `INSERT INTO coffeepos.waste_logs (product_id, quantity, reason, loss_amount)
         VALUES ($1::uuid, $2::int, $3::text, $4::int)`,
        [body.productId, body.quantity, body.reason, lossAmount]
      );
    });

    // Return refreshed state so frontend stays in sync
    res.status(201).json(await buildAppState());
  } catch (err) {
    next(err);
  }
});

