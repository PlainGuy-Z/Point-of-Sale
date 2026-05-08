import { Router } from 'express';
import { pool } from '../db/pool.js';
import { withTransaction } from '../db/with-transaction.js';
import { HttpError } from '../http/errors.js';
import { validateBody } from '../http/validate.js';
import { CreateTransactionRequestSchema, QuoteRequestSchema } from './pos.schemas.js';
import { buildAppState } from './app.js';
import crypto from 'node:crypto';
const TAX_RATE_BPS = 1100; // 11.00% in basis points
function calcTax(subtotal) {
    // integer math: round half up
    return Math.round((subtotal * TAX_RATE_BPS) / 10_000);
}
export const posRouter = Router();
// POST /pos/quote
// Note: This endpoint fetches latest price for real products from DB.
posRouter.post('/quote', validateBody(QuoteRequestSchema), async (req, res, next) => {
    try {
        const body = req.body;
        console.log('[DB] POST /pos/quote - Menghitung total harga...');
        const realProductIds = body.cart
            .map((i) => i.productId)
            .filter((id) => !id.startsWith('manual-'));
        const priceById = new Map();
        if (realProductIds.length > 0) {
            const result = await pool.query(`SELECT id::text, price
         FROM coffeepos.products
         WHERE id = ANY($1::uuid[])`, [realProductIds]);
            for (const row of result.rows)
                priceById.set(row.id, Number(row.price));
        }
        let subtotal = 0;
        for (const line of body.cart) {
            const isManual = line.productId.startsWith('manual-');
            if (isManual) {
                const price = line.price ?? 0;
                if (price <= 0)
                    throw new HttpError(400, 'VALIDATION_ERROR', 'Manual item requires price');
                const lineTotal = price * line.quantity;
                subtotal += lineTotal;
                continue;
            }
            const price = priceById.get(line.productId);
            if (price === undefined)
                throw new HttpError(400, 'UNKNOWN_PRODUCT', `Unknown productId ${line.productId}`);
            subtotal += price * line.quantity;
        }
        const tax = calcTax(subtotal);
        const grandTotal = subtotal + tax;
        res.json({ subtotal, tax, grandTotal, taxRate: 0.11 });
    }
    catch (err) {
        console.error('[POS] Quote failed:', err);
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
        console.log('[DB] POST /pos/transactions - Memulai SQL Transaction (BEGIN) untuk proses checkout dan pengecekan stok (FOR UPDATE)...');
        const result = await withTransaction(async (client) => {
            const manualLines = body.cart.filter((l) => l.productId.startsWith('manual-'));
            const realLines = body.cart.filter((l) => !l.productId.startsWith('manual-'));
            const productIds = realLines.map((l) => l.productId);
            // Lock product rows and read latest price+stock
            const productById = new Map();
            if (productIds.length > 0) {
                const products = await client.query(`SELECT id::text AS id, name, price, cost, stock
           FROM coffeepos.products
           WHERE id = ANY($1::uuid[])
           FOR UPDATE`, [productIds]);
                for (const row of products.rows) {
                    productById.set(row.id, {
                        id: row.id,
                        name: String(row.name),
                        price: Number(row.price),
                        cost: Number(row.cost ?? 0),
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
            for (const line of realLines) {
                qtyByProductId.set(line.productId, (qtyByProductId.get(line.productId) ?? 0) + line.quantity);
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
            let costTotal = 0;
            const normalizedItems = [];
            for (const line of realLines) {
                const p = productById.get(line.productId);
                subtotal += p.price * line.quantity;
                costTotal += p.cost * line.quantity;
                normalizedItems.push({
                    kind: 'real',
                    productId: p.id,
                    name: p.name,
                    price: p.price,
                    cost: p.cost,
                    quantity: line.quantity
                });
            }
            for (const line of manualLines) {
                const price = line.price ?? 0;
                if (price <= 0)
                    throw new HttpError(400, 'VALIDATION_ERROR', 'Manual item requires price');
                const name = line.note?.trim() || 'Custom Item';
                subtotal += price * line.quantity;
                normalizedItems.push({
                    kind: 'manual',
                    manualId: line.productId,
                    name,
                    price,
                    quantity: line.quantity
                });
            }
            const tax = calcTax(subtotal);
            const grandTotal = subtotal + tax;
            const profit = subtotal - costTotal;
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
                if (item.kind === 'real') {
                    values.push(itemId, transaction.id, item.productId, item.name, item.price, item.quantity, false);
                }
                else {
                    values.push(itemId, transaction.id, null, item.name, item.price, item.quantity, true);
                }
            }
            const items = await client.query(`INSERT INTO coffeepos.transaction_items
           (id, transaction_id, product_id, name, price, quantity, is_custom)
         VALUES
           ${rowsSql.join(',')}
         RETURNING id::text, transaction_id::text, product_id::text, name, price, quantity, is_custom`, values);
            // Shape response to match frontend Transaction contract
            return {
                id: transaction.id,
                date: new Date(transaction.created_at).toISOString(),
                items: items.rows.map((r) => ({
                    productId: r.product_id ?? 'manual', // placeholder for manual items
                    quantity: Number(r.quantity),
                    price: Number(r.price),
                    note: r.name
                })),
                total: grandTotal,
                cost: costTotal,
                profit,
                paymentMethod: transaction.payment_method,
                customerName: transaction.customer_name ?? undefined,
                tableNumber: transaction.table_number ?? undefined,
                taxRate: 11,
                orderType: body.orderType,
                orderNote: body.orderNote ?? undefined
            };
        });
        // Return refreshed appState AND the transaction details
        const appState = await buildAppState();
        res.status(201).json({
            transaction: result,
            appState
        });
    }
    catch (err) {
        // Print detailed error to backend terminal
        console.error('[POS] Transaction failed:', err);
        next(err);
    }
});
