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
    description: z.string().trim().optional(),
    price: z.coerce.number().int().nonnegative(),
    category: z.string().trim().min(1),
    stock: z.coerce.number().int().nonnegative(),
    minStock: z.coerce.number().int().nonnegative().optional(),
    cost: z.coerce.number().int().nonnegative().optional(),
    image: z.string().trim().optional()
});
const CategorySchema = z.object({
    name: z.string().trim().min(1)
});
export async function buildAppState() {
    const [products, txs, wastes] = await Promise.all([
        pool.query(`SELECT id::text, name, description, price, category, stock, min_stock, cost, image
       FROM coffeepos.products
       ORDER BY name ASC`),
        pool.query(`SELECT
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
       LIMIT 200`),
        pool.query(`SELECT
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
       LIMIT 500`)
    ]);
    const categories = Array.from(new Set(products.rows.map((p) => String(p.category)).filter(Boolean)));
    return {
        products: products.rows.map((p) => ({
            ...p,
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
        customers: [], // TODO: Legacy simulasi - ganti dengan query DB jika tabel customers sudah ada
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
appRouter.get('/state', async (_req, res, next) => {
    try {
        console.log('[DB] GET /app/state - Mengambil snapshot data (products, transactions, waste_logs) dari PostgreSQL...');
        res.json(await buildAppState());
    }
    catch (err) {
        next(err);
    }
});
// POST /app/waste-logs
appRouter.post('/waste-logs', validateBody(CreateWasteLogSchema), async (req, res, next) => {
    try {
        const body = req.body;
        console.log(`[DB] POST /app/waste-logs - Menyimpan waste log dan mengurangi stok produk ID: ${body.productId}...`);
        await withTransaction(async (client) => {
            const product = await client.query(`SELECT id::text, name, stock, cost
         FROM coffeepos.products
         WHERE id = $1::uuid
         FOR UPDATE`, [body.productId]);
            if (product.rowCount === 0)
                throw new HttpError(400, 'UNKNOWN_PRODUCT', 'productId not found');
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
            await client.query(`UPDATE coffeepos.products
         SET stock = stock - $2::int,
             updated_at = now()
         WHERE id = $1::uuid`, [body.productId, body.quantity]);
            const lossAmount = cost * body.quantity;
            await client.query(`INSERT INTO coffeepos.waste_logs (product_id, quantity, reason, loss_amount)
         VALUES ($1::uuid, $2::int, $3::text, $4::int)`, [body.productId, body.quantity, body.reason, lossAmount]);
        });
        res.status(201).json(await buildAppState());
    }
    catch (err) {
        next(err);
    }
});
// POST /app/products
appRouter.post('/products', validateBody(ProductSchema), async (req, res, next) => {
    try {
        const body = req.body;
        await pool.query(`INSERT INTO coffeepos.products (name, description, price, category, stock, min_stock, cost, image)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [
            body.name,
            body.description || '',
            body.price,
            body.category,
            body.stock,
            body.minStock || 5,
            body.cost || 0,
            body.image || null
        ]);
        res.status(201).json(await buildAppState());
    }
    catch (err) {
        next(err);
    }
});
// PUT /app/products/:id
appRouter.put('/products/:id', validateBody(ProductSchema), async (req, res, next) => {
    try {
        const { id } = req.params;
        const body = req.body;
        const result = await pool.query(`UPDATE coffeepos.products
       SET name = $1, description = $2, price = $3, category = $4, stock = $5, min_stock = $6, cost = $7, image = $8, updated_at = now()
       WHERE id = $9::uuid`, [
            body.name,
            body.description || '',
            body.price,
            body.category,
            body.stock,
            body.minStock || 5,
            body.cost || 0,
            body.image || null,
            id
        ]);
        if (result.rowCount === 0)
            throw new HttpError(404, 'NOT_FOUND', 'Product not found');
        res.json(await buildAppState());
    }
    catch (err) {
        next(err);
    }
});
// DELETE /app/products/:id
appRouter.delete('/products/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`DELETE FROM coffeepos.products WHERE id = $1::uuid`, [id]);
        if (result.rowCount === 0)
            throw new HttpError(404, 'NOT_FOUND', 'Product not found');
        res.json(await buildAppState());
    }
    catch (err) {
        next(err);
    }
});
// POST /app/categories
appRouter.post('/categories', validateBody(CategorySchema), async (req, res, next) => {
    try {
        res.json(await buildAppState());
    }
    catch (err) {
        next(err);
    }
});
// DELETE /app/categories/:name
appRouter.delete('/categories/:name', async (req, res, next) => {
    try {
        res.json(await buildAppState());
    }
    catch (err) {
        next(err);
    }
});
