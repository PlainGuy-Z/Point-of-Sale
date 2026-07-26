import { Router } from 'express';
import { pool } from '../db/pool.js';
import { withTransaction } from '../db/with-transaction.js';
import { HttpError } from '../http/errors.js';
import { validateBody } from '../http/validate.js';
import { CreateTransactionRequestSchema, QuoteRequestSchema } from './pos.schemas.js';
import { getProductsState } from './app.js';
import { resolveBranchId } from './branches.js';
import crypto from 'node:crypto';
async function getShopSettings(shopId) {
    const { rows } = await pool.query(`SELECT tax_enabled, tax_rate, tax_inclusive,
            service_charge_enabled, service_charge_rate,
            tax_label, service_charge_label
     FROM coffeepos.shop_settings
     WHERE shop_id = $1`, [shopId]);
    return rows[0] ?? {
        tax_enabled: true,
        tax_rate: 11,
        tax_inclusive: false,
        service_charge_enabled: false,
        service_charge_rate: 0,
        tax_label: 'PPN',
        service_charge_label: 'Service'
    };
}
export const posRouter = Router();
// POST /pos/quote
posRouter.post('/quote', validateBody(QuoteRequestSchema), async (req, res, next) => {
    try {
        const body = req.body;
        const shopId = req.user.shop_id;
        console.log('[DB] POST /pos/quote - Menghitung total harga...');
        const realProductIds = body.cart
            .map((i) => i.productId)
            .filter((id) => !id.startsWith('manual-'));
        const priceById = new Map();
        if (realProductIds.length > 0) {
            // [FIX-10] Also fetch `discount` field so promo logic matches frontend's getEffectivePrice
            const result = await pool.query(`SELECT id::text, price, is_promo, promo_price, discount
         FROM coffeepos.products
         WHERE id = ANY($1::uuid[]) AND shop_id = $2::uuid`, [realProductIds, shopId]);
            for (const row of result.rows) {
                const basePrice = Number(row.price);
                const isPromo = Boolean(row.is_promo);
                const promoPrice = Number(row.promo_price ?? 0);
                const discount = Number(row.discount ?? 0);
                // [FIX-10] Unified promo logic: same as frontend getEffectivePrice
                const effectivePrice = (() => {
                    if (isPromo && promoPrice > 0 && promoPrice < basePrice && discount > 0) {
                        return promoPrice;
                    }
                    if (discount > 0) {
                        return Math.round(basePrice - (basePrice * discount / 100));
                    }
                    return basePrice;
                })();
                priceById.set(row.id, effectivePrice);
            }
        }
        let subtotal = 0;
        for (const line of body.cart) {
            const isManual = line.productId.startsWith('manual-');
            if (isManual) {
                const price = line.price ?? 0;
                if (price <= 0)
                    throw new HttpError(400, 'VALIDATION_ERROR', 'Manual item requires price');
                subtotal += price * line.quantity;
                continue;
            }
            const price = priceById.get(line.productId);
            if (price === undefined)
                throw new HttpError(400, 'UNKNOWN_PRODUCT', `Unknown productId ${line.productId}`);
            const variantPrice = line.variantPrice ?? 0;
            subtotal += (price + variantPrice) * line.quantity;
        }
        const shopSettings = await getShopSettings(shopId);
        const taxRateConfig = shopSettings.tax_enabled ? Number(shopSettings.tax_rate) / 100 : 0;
        const serviceRateConfig = shopSettings.service_charge_enabled ? Number(shopSettings.service_charge_rate) / 100 : 0;
        const tax = body.applyTax === false ? 0 : Math.round(subtotal * taxRateConfig);
        const serviceCharge = Math.round(subtotal * serviceRateConfig);
        const grandTotal = subtotal + tax + serviceCharge;
        res.json({
            subtotal,
            tax,
            serviceCharge,
            grandTotal,
            taxRate: Number(shopSettings.tax_rate),
            taxLabel: shopSettings.tax_label ?? 'PPN',
            serviceChargeRate: Number(shopSettings.service_charge_rate),
            serviceChargeLabel: shopSettings.service_charge_label ?? 'Service'
        });
    }
    catch (err) {
        console.error('[POS] Quote failed:', err);
        next(err);
    }
});
// ── Idempotency cache ────────────────────────────────────────────────
// Prevents duplicate transactions when mobile client retries after timeout.
// Keys expire after 5 minutes.
const IDEMPOTENCY_TTL_MS = 5 * 60 * 1000;
const idempotencyCache = new Map();
// Clean expired entries every 60s
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of idempotencyCache) {
        if (now > entry.expiry)
            idempotencyCache.delete(key);
    }
}, 60_000).unref();
// POST /pos/transactions
posRouter.post('/transactions', validateBody(CreateTransactionRequestSchema), async (req, res, next) => {
    try {
        const body = req.body;
        const shopId = req.user.shop_id;
        const cashierId = req.user.id;
        const cashierName = req.user.name;
        const role = req.user.role;
        // ── Idempotency check ──────────────────────────────────────────
        const idempotencyKey = body.idempotencyKey
            ? `${shopId}:${body.idempotencyKey}`
            : null;
        if (idempotencyKey) {
            const cached = idempotencyCache.get(idempotencyKey);
            if (cached && Date.now() < cached.expiry) {
                console.log(`[POS] Idempotency hit — returning cached result for key ${body.idempotencyKey}`);
                return res.status(201).json(cached.result);
            }
        }
        let shiftId = null;
        if (role === 'cashier') {
            const { rows: activeShifts } = await pool.query(`SELECT id FROM coffeepos.shifts WHERE cashier_id = $1 AND status = 'open'`, [cashierId]);
            if (activeShifts.length === 0) {
                throw new HttpError(400, 'NO_ACTIVE_SHIFT', 'You must open a shift before processing transactions.');
            }
            shiftId = activeShifts[0].id;
        }
        console.log('[DB] POST /pos/transactions - Memulai SQL Transaction (BEGIN)...');
        const result = await withTransaction(async (client) => {
            const manualLines = body.cart.filter((l) => l.productId.startsWith('manual-'));
            const realLines = body.cart.filter((l) => !l.productId.startsWith('manual-'));
            const productIds = realLines.map((l) => l.productId);
            const productById = new Map();
            if (productIds.length > 0) {
                // [FIX-10] Also fetch `discount` field for unified promo logic
                const products = await client.query(`SELECT id::text AS id, name, price, cost, stock, is_promo, promo_price, discount, is_available
           FROM coffeepos.products
           WHERE id = ANY($1::uuid[]) AND shop_id = $2::uuid
           FOR UPDATE`, [productIds, shopId]);
                for (const row of products.rows) {
                    const basePrice = Number(row.price);
                    const isPromo = Boolean(row.is_promo);
                    const promoPrice = Number(row.promo_price ?? 0);
                    const discount = Number(row.discount ?? 0);
                    // [FIX-10] Unified promo logic: same as frontend getEffectivePrice
                    const effectivePrice = (() => {
                        if (isPromo && promoPrice > 0 && promoPrice < basePrice && discount > 0) {
                            return promoPrice;
                        }
                        if (discount > 0) {
                            return Math.round(basePrice - (basePrice * discount / 100));
                        }
                        return basePrice;
                    })();
                    productById.set(row.id, {
                        id: row.id,
                        name: String(row.name),
                        price: effectivePrice,
                        cost: Number(row.cost ?? 0),
                        stock: Number(row.stock)
                    });
                }
                const missing = productIds.filter((id) => !productById.has(id));
                if (missing.length > 0) {
                    throw new HttpError(400, 'UNKNOWN_PRODUCT', 'One or more productId not found', { missing });
                }
                for (const row of products.rows) {
                    if (row.is_available === false) {
                        throw new HttpError(400, 'PRODUCT_UNAVAILABLE', `Product ${row.name} is currently unavailable`);
                    }
                }
            }
            const qtyByProductId = new Map();
            for (const line of realLines) {
                qtyByProductId.set(line.productId, (qtyByProductId.get(line.productId) ?? 0) + line.quantity);
            }
            const insufficient = [];
            for (const [productId, requested] of qtyByProductId.entries()) {
                const p = productById.get(productId);
                if (p.stock !== -1 && p.stock < requested)
                    insufficient.push({ productId, available: p.stock, requested });
            }
            if (insufficient.length > 0) {
                throw new HttpError(409, 'INSUFFICIENT_STOCK', 'Insufficient stock for one or more products', { insufficient });
            }
            if (qtyByProductId.size > 0) {
                const ids = Array.from(qtyByProductId.keys());
                const qtys = Array.from(qtyByProductId.values());
                await client.query(`WITH req AS (
             SELECT unnest($1::uuid[]) AS id, unnest($2::int[]) AS qty
           )
           UPDATE coffeepos.products p
           SET stock = CASE WHEN p.stock = -1 THEN -1 ELSE p.stock - req.qty END,
               updated_at = now()
           FROM req
           WHERE p.id = req.id AND p.shop_id = $3::uuid`, [ids, qtys, shopId]);
            }
            let subtotal = 0;
            let costTotal = 0;
            const normalizedItems = [];
            for (const line of realLines) {
                const p = productById.get(line.productId);
                const variantPrice = line.variantPrice ?? 0;
                const finalPrice = p.price + variantPrice;
                const variantNameString = line.variantName
                    ? (variantPrice > 0 ? `[${line.variantName}@${variantPrice}]` : `[${line.variantName}]`)
                    : '';
                const finalDesc = [line.description, variantNameString].filter(Boolean).join(' - ');
                subtotal += finalPrice * line.quantity;
                costTotal += p.cost * line.quantity;
                normalizedItems.push({
                    kind: 'real',
                    productId: p.id,
                    name: p.name,
                    price: finalPrice,
                    cost: p.cost,
                    quantity: line.quantity,
                    description: finalDesc || undefined
                });
            }
            for (const line of manualLines) {
                const price = line.price ?? 0;
                if (price <= 0)
                    throw new HttpError(400, 'VALIDATION_ERROR', 'Manual item requires price');
                const variantPrice = line.variantPrice ?? 0;
                const finalPrice = price + variantPrice;
                const variantNameString = line.variantName
                    ? (variantPrice > 0 ? `[${line.variantName}@${variantPrice}]` : `[${line.variantName}]`)
                    : '';
                const finalDesc = [line.description, variantNameString].filter(Boolean).join(' - ');
                const name = line.note?.trim() || 'Custom Item';
                subtotal += finalPrice * line.quantity;
                normalizedItems.push({
                    kind: 'manual',
                    manualId: line.productId,
                    name,
                    price: finalPrice,
                    quantity: line.quantity,
                    description: finalDesc || undefined
                });
            }
            const shopSettings = await getShopSettings(shopId);
            const taxRateConfig = shopSettings.tax_enabled ? Number(shopSettings.tax_rate) / 100 : 0;
            const serviceRateConfig = shopSettings.service_charge_enabled ? Number(shopSettings.service_charge_rate) / 100 : 0;
            const tax = body.applyTax === false ? 0 : Math.round(subtotal * taxRateConfig);
            const serviceCharge = Math.round(subtotal * serviceRateConfig);
            const grandTotal = subtotal + tax + serviceCharge;
            const profit = subtotal - costTotal;
            if (body.paymentMethod === 'cash') {
                const cashReceivedVal = body.cashReceived ?? 0;
                if (cashReceivedVal < grandTotal) {
                    throw new HttpError(400, 'INSUFFICIENT_CASH', `Uang diterima (${cashReceivedVal}) kurang dari total (${grandTotal})`);
                }
            }
            const cashReceived = body.paymentMethod === 'cash' && body.cashReceived != null ? Math.round(body.cashReceived) : null;
            const changeAmount = cashReceived != null ? Math.max(0, cashReceived - grandTotal) : null;
            const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            const customerId = typeof body.customerId === 'string' && uuidRe.test(body.customerId.trim()) ? body.customerId.trim() : null;
            const targetBranchId = await resolveBranchId(shopId, body.branch_id, req.user?.branch_id, client);
            const txId = crypto.randomUUID();
            const tx = await client.query(`INSERT INTO coffeepos.transactions
           (id, subtotal, tax, service_charge, grand_total, discount_amount, customer_name, customer_id,
            table_number, notes, payment_method, cash_received, change_amount, order_type,
            status, shop_id, cashier_id, cashier_name, shift_id, branch_id)
         VALUES
           ($1::uuid, $2, $3, $4::int, $5, $6::int, $7, $8::uuid, $9, $10, $11, $12, $13, $14::text,
            'completed', $15::uuid, $16::uuid, $17, $18::uuid, $19::uuid)
         RETURNING
           id::text, subtotal, tax, service_charge, grand_total, customer_name, table_number, notes, payment_method, status, created_at, branch_id::text`, [
                txId,
                subtotal,
                tax,
                serviceCharge,
                grandTotal,
                0, // discount_amount
                body.customerName ?? null,
                customerId,
                body.tableNumber ?? null,
                body.notes ?? null, // ✅ Include notes (order_description)
                body.paymentMethod,
                cashReceived,
                changeAmount,
                body.orderType,
                shopId,
                cashierId,
                cashierName,
                shiftId,
                targetBranchId
            ]);
            const transaction = tx.rows[0];
            const values = [];
            const rowsSql = [];
            let idx = 1;
            for (const item of normalizedItems) {
                const itemId = crypto.randomUUID();
                rowsSql.push(`($${idx++}::uuid,$${idx++}::uuid,$${idx++}::uuid,$${idx++},$${idx++},$${idx++}::int,$${idx++}::text,$${idx++}::boolean)`);
                if (item.kind === 'real') {
                    values.push(itemId, transaction.id, item.productId, item.name, item.price, item.quantity, item.description ?? null, false);
                }
                else {
                    values.push(itemId, transaction.id, null, item.name, item.price, item.quantity, item.description ?? null, true);
                }
            }
            const items = await client.query(`INSERT INTO coffeepos.transaction_items
           (id, transaction_id, product_id, name, price, quantity, description, is_custom)
         VALUES
           ${rowsSql.join(',')}
         RETURNING id::text, transaction_id::text, product_id::text, name, price, quantity, description, is_custom`, values);
            return {
                id: transaction.id,
                date: new Date(transaction.created_at).toISOString(),
                items: items.rows.map((r) => ({
                    productId: r.product_id ?? 'manual',
                    quantity: Number(r.quantity),
                    price: Number(r.price),
                    note: r.name,
                    description: r.description ?? undefined // ✅ Include description
                })),
                total: grandTotal,
                subtotal: subtotal,
                tax: tax,
                service_charge: serviceCharge,
                cost: costTotal,
                profit,
                paymentMethod: transaction.payment_method,
                cashReceived: cashReceived ?? undefined,
                change: changeAmount ?? undefined,
                customerName: transaction.customer_name ?? undefined,
                tableNumber: transaction.table_number ?? undefined,
                notes: transaction.notes ?? undefined, // ✅ Include notes
                taxRate: Number(shopSettings.tax_rate),
                orderType: body.orderType,
                orderNote: body.orderNote ?? undefined
            };
        });
        const updatedProducts = await getProductsState(shopId);
        const responseBody = {
            transaction: result,
            appState: { products: updatedProducts }
        };
        // Cache the response for idempotency replay
        if (idempotencyKey) {
            idempotencyCache.set(idempotencyKey, {
                result: responseBody,
                expiry: Date.now() + IDEMPOTENCY_TTL_MS,
            });
        }
        res.status(201).json(responseBody);
    }
    catch (err) {
        console.error('[POS] Transaction failed:', err);
        next(err);
    }
});
