import { Router } from 'express';
import { pool } from '../db/pool.js';
import { withTransaction } from '../db/with-transaction.js';
import { HttpError } from '../http/errors.js';
import { validateBody } from '../http/validate.js';
import { CreateTransactionRequestSchema, QuoteRequestSchema } from './pos.schemas.js';
import crypto from 'node:crypto';
const TAX_RATE_BPS = 1100; // 11.00% in basis points
function calcTax(subtotal) {
    // integer math: round half up
    return Math.round((subtotal * TAX_RATE_BPS) / 10_000);
}
export const posRouter = Router();
// POST /pos/quote
// Note: This endpoint fetches latest price for non-custom items from DB.
posRouter.post('/quote', validateBody(QuoteRequestSchema), async (req, res, next) => {
    try {
        const body = req.body;
        const productIds = body.items
            .map((i) => i.productId)
            .filter((v) => typeof v === 'string');
        const priceById = new Map();
        if (productIds.length > 0) {
            const result = await pool.query(`SELECT id::text, price
         FROM coffeepos.products
         WHERE id = ANY($1::uuid[])`, [productIds]);
            for (const row of result.rows)
                priceById.set(row.id, Number(row.price));
        }
        let subtotal = 0;
        const normalizedItems = body.items.map((item) => {
            const isCustom = item.isCustom === true || !item.productId;
            if (isCustom) {
                if (!item.name || item.price === undefined) {
                    throw new HttpError(400, 'VALIDATION_ERROR', 'Custom item requires name and price');
                }
                const lineTotal = item.price * item.quantity;
                subtotal += lineTotal;
                return {
                    productId: null,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    isCustom: true,
                    lineTotal
                };
            }
            const price = priceById.get(item.productId);
            if (price === undefined)
                throw new HttpError(400, 'UNKNOWN_PRODUCT', `Unknown productId ${item.productId}`);
            const lineTotal = price * item.quantity;
            subtotal += lineTotal;
            return {
                productId: item.productId,
                name: item.name ?? null,
                price,
                quantity: item.quantity,
                isCustom: false,
                lineTotal
            };
        });
        const tax = calcTax(subtotal);
        const grandTotal = subtotal + tax;
        res.json({
            totals: { subtotal, tax, grandTotal, taxRate: 0.11 },
            items: normalizedItems
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /pos/transactions
// Checkout:
// - Recalculate prices for non-custom items from DB
// - Validate stock and decrement atomically
// - Insert into transactions + transaction_items in one SQL transaction
posRouter.post('/transactions', validateBody(CreateTransactionRequestSchema), async (req, res, next) => {
    try {
        const body = req.body;
        const result = await withTransaction(async (client) => {
            const nonCustom = body.items.filter((i) => !i.isCustom);
            const custom = body.items.filter((i) => i.isCustom);
            const productIds = nonCustom.map((i) => i.productId);
            // Lock product rows and read latest price+stock
            const productById = new Map();
            if (productIds.length > 0) {
                const products = await client.query(`SELECT id::text AS id, name, price, stock
           FROM coffeepos.products
           WHERE id = ANY($1::uuid[])
           FOR UPDATE`, [productIds]);
                for (const row of products.rows) {
                    productById.set(row.id, {
                        id: row.id,
                        name: String(row.name),
                        price: Number(row.price),
                        stock: Number(row.stock)
                    });
                }
                // Ensure all non-custom products exist
                const missing = productIds.filter((id) => !productById.has(id));
                if (missing.length > 0) {
                    throw new HttpError(400, 'UNKNOWN_PRODUCT', 'One or more productId not found', { missing });
                }
            }
            // Aggregate required quantities per product to validate stock and decrement atomically
            const qtyByProductId = new Map();
            for (const item of nonCustom) {
                qtyByProductId.set(item.productId, (qtyByProductId.get(item.productId) ?? 0) + item.quantity);
            }
            // Validate stock in-memory (we hold FOR UPDATE locks, so this is safe within txn)
            const insufficient = [];
            for (const [productId, requested] of qtyByProductId.entries()) {
                const p = productById.get(productId);
                if (p.stock < requested)
                    insufficient.push({ productId, available: p.stock, requested });
            }
            if (insufficient.length > 0) {
                throw new HttpError(409, 'INSUFFICIENT_STOCK', 'Insufficient stock for one or more products', { insufficient });
            }
            // Decrement stock (single statement)
            if (qtyByProductId.size > 0) {
                const ids = Array.from(qtyByProductId.keys());
                const qtys = Array.from(qtyByProductId.values());
                await client.query(`WITH req AS (
             SELECT unnest($1::uuid[]) AS id, unnest($2::int[]) AS qty
           )
           UPDATE coffeepos.products p
           SET stock = p.stock - req.qty,
               updated_at = now()
           FROM req
           WHERE p.id = req.id`, [ids, qtys]);
            }
            // Recalculate totals from authoritative prices
            let subtotal = 0;
            const normalizedItems = [];
            for (const item of nonCustom) {
                const p = productById.get(item.productId);
                const price = p.price;
                const lineTotal = price * item.quantity;
                subtotal += lineTotal;
                normalizedItems.push({
                    productId: p.id,
                    name: p.name,
                    price,
                    quantity: item.quantity,
                    isCustom: false,
                    lineTotal
                });
            }
            for (const item of custom) {
                // price/name already validated by zod
                const lineTotal = item.price * item.quantity;
                subtotal += lineTotal;
                normalizedItems.push({
                    productId: null,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    isCustom: true,
                    lineTotal
                });
            }
            const tax = calcTax(subtotal);
            const grandTotal = subtotal + tax;
            const tx = await client.query(`INSERT INTO coffeepos.transactions
           (id, subtotal, tax, grand_total, customer_name, table_number, payment_method, status)
         VALUES
           ($1::uuid, $2, $3, $4, $5, $6, $7, 'paid')
         RETURNING
           id::text, subtotal, tax, grand_total, customer_name, table_number, payment_method, status, created_at`, [
                crypto.randomUUID(),
                subtotal,
                tax,
                grandTotal,
                body.customerName ?? null,
                body.tableNumber ?? null,
                body.paymentMethod
            ]);
            const transaction = tx.rows[0];
            // Insert items
            const values = [];
            const rowsSql = [];
            let idx = 1;
            for (const item of normalizedItems) {
                const itemId = crypto.randomUUID();
                rowsSql.push(`($${idx++}::uuid,$${idx++}::uuid,$${idx++}::uuid,$${idx++},$${idx++},$${idx++}::int,$${idx++}::boolean)`);
                values.push(itemId, transaction.id, item.productId, // nullable
                item.name, item.price, item.quantity, item.isCustom);
            }
            const items = await client.query(`INSERT INTO coffeepos.transaction_items
           (id, transaction_id, product_id, name, price, quantity, is_custom)
         VALUES
           ${rowsSql.join(',')}
         RETURNING id::text, transaction_id::text, product_id::text, name, price, quantity, is_custom`, values);
            return {
                ...transaction,
                items: items.rows,
                totals: { subtotal, tax, grandTotal, taxRate: 0.11 }
            };
        });
        res.status(201).json({ transaction: result });
    }
    catch (err) {
        next(err);
    }
});
