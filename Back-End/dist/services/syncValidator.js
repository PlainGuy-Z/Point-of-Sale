/**
 * Sync Validator — Server-side validation pipeline for offline transactions
 *
 * Implements the 10-step validation pipeline:
 *   1. Idempotency check
 *   2. Auth & tenant check
 *   3. Shift validation
 *   4. Product existence & availability
 *   5. Price recalculation
 *   6. Tax & service charge recalculation
 *   7. Cash validation
 *   8. Stock update & conflict detection
 *   9. Insert transaction
 *  10. Shift stats update
 */
import { pool } from '../db/pool.js';
import { resolveBranchId } from '../routes/branches.js';
// ─── Helpers ─────────────────────────────────────────────────────────────────
async function getShopSettings(shopId) {
    const { rows } = await pool.query(`SELECT tax_enabled, tax_rate, tax_inclusive,
            service_charge_enabled, service_charge_rate
     FROM coffeepos.shop_settings WHERE shop_id = $1`, [shopId]);
    return rows[0] ?? {
        tax_enabled: true,
        tax_rate: 11,
        tax_inclusive: false,
        service_charge_enabled: false,
        service_charge_rate: 0,
    };
}
function computeEffectivePrice(row) {
    const basePrice = Number(row.price);
    const isPromo = Boolean(row.is_promo);
    const promoPrice = Number(row.promo_price ?? 0);
    const discount = Number(row.discount ?? 0);
    if (isPromo && promoPrice > 0 && promoPrice < basePrice && discount > 0) {
        return promoPrice;
    }
    if (discount > 0) {
        return Math.round(basePrice - (basePrice * discount / 100));
    }
    return basePrice;
}
// ─── Main Validator ──────────────────────────────────────────────────────────
/**
 * Validate and process a single offline transaction within a DB transaction.
 * Returns a SyncResult describing the outcome.
 */
export async function validateAndInsertTransaction(client, tx, shopId, cashierId, cashierName, deviceId, userBranchId) {
    const txId = tx.id;
    // ── Step 1: Idempotency check ──────────────────────────────────────────
    const { rows: existing } = await client.query(`SELECT id FROM coffeepos.transactions WHERE id = $1::uuid`, [txId]);
    if (existing.length > 0) {
        return { client_transaction_id: txId, status: 'duplicate' };
    }
    // ── Step 2: Auth & tenant — already validated by middleware ─────────────
    // ── Step 3: Shift validation ───────────────────────────────────────────
    let shiftId = tx.shift_id ?? null;
    if (shiftId) {
        const { rows: shiftRows } = await client.query(`SELECT id FROM coffeepos.shifts WHERE id = $1::uuid AND shop_id = $2::uuid`, [shiftId, shopId]);
        if (shiftRows.length === 0) {
            console.warn(`[SyncValidator] Shift ${shiftId} not found, proceeding without shift`);
            shiftId = null;
        }
    }
    // ── Step 4: Product existence & availability ───────────────────────────
    const manualLines = tx.cart.filter((l) => !l.productId || l.productId.startsWith('manual-'));
    const realLines = tx.cart.filter((l) => Boolean(l.productId) && !l.productId.startsWith('manual-'));
    const productIds = realLines.map((l) => l.productId);
    const productById = new Map();
    const priceDifferences = [];
    if (productIds.length > 0) {
        const { rows: productRows } = await client.query(`SELECT id::text AS id, name, price, cost, stock, is_promo, promo_price, discount, is_available
       FROM coffeepos.products
       WHERE id = ANY($1::uuid[]) AND shop_id = $2::uuid
       FOR UPDATE`, [productIds, shopId]);
        // Check for missing products
        const foundIds = new Set(productRows.map((r) => r.id));
        const missing = productIds.filter((id) => !foundIds.has(id));
        if (missing.length > 0) {
            return {
                client_transaction_id: txId,
                status: 'rejected',
                rejection_reason: `Products not found: ${missing.join(', ')}`,
                rejection_code: 'UNKNOWN_PRODUCT',
            };
        }
        // ── Step 5: Price recalculation ────────────────────────────────────────
        for (const row of productRows) {
            const effectivePrice = computeEffectivePrice(row);
            productById.set(row.id, {
                id: row.id,
                name: String(row.name),
                price: effectivePrice,
                cost: Number(row.cost ?? 0),
                stock: Number(row.stock),
            });
        }
    }
    // Calculate subtotal with server prices
    let subtotal = 0;
    let costTotal = 0;
    for (const line of realLines) {
        const p = productById.get(line.productId);
        const variantPrice = line.variantPrice ?? 0;
        const serverPrice = p.price + variantPrice;
        subtotal += serverPrice * line.quantity;
        costTotal += p.cost * line.quantity;
        // Track price differences
        const clientPrice = line.price ?? p.price; // client may not send price for real products
        if (clientPrice !== p.price) {
            priceDifferences.push({
                product_id: p.id,
                product_name: p.name,
                client_price: clientPrice,
                server_price: p.price,
            });
        }
    }
    for (const line of manualLines) {
        const price = line.price ?? 0;
        const variantPrice = line.variantPrice ?? 0;
        subtotal += (price + variantPrice) * line.quantity;
    }
    // ── Step 6: Tax & service charge recalculation ─────────────────────────
    const settings = await getShopSettings(shopId);
    const taxRateConfig = settings.tax_enabled ? Number(settings.tax_rate) / 100 : 0;
    const serviceRateConfig = settings.service_charge_enabled
        ? Number(settings.service_charge_rate) / 100
        : 0;
    const tax = tx.apply_tax !== false ? Math.round(subtotal * taxRateConfig) : 0;
    const serviceCharge = Math.round(subtotal * serviceRateConfig);
    const grandTotal = subtotal + tax + serviceCharge;
    // ── Step 7: Cash validation ────────────────────────────────────────────
    const cashReceived = tx.payment_method === 'cash' && tx.cash_received != null
        ? Math.round(tx.cash_received)
        : null;
    const changeAmount = cashReceived != null ? Math.max(0, cashReceived - grandTotal) : null;
    // Log warning if cash is insufficient (but don't reject — money already received physically)
    if (tx.payment_method === 'cash' && cashReceived != null && cashReceived < grandTotal) {
        console.warn(`[SyncValidator] Cash insufficient for tx ${txId}: received=${cashReceived}, total=${grandTotal}`);
    }
    // ── Step 8: Stock update & conflict detection ──────────────────────────
    let needsReview = false;
    const reviewReasons = [];
    const qtyByProductId = new Map();
    for (const line of realLines) {
        qtyByProductId.set(line.productId, (qtyByProductId.get(line.productId) ?? 0) + line.quantity);
    }
    if (qtyByProductId.size > 0) {
        const ids = Array.from(qtyByProductId.keys());
        const qtys = Array.from(qtyByProductId.values());
        // Update stock
        await client.query(`WITH req AS (
         SELECT unnest($1::uuid[]) AS id, unnest($2::int[]) AS qty
       )
       UPDATE coffeepos.products p
       SET stock = CASE WHEN p.stock = -1 THEN -1 ELSE p.stock - req.qty END,
           updated_at = now()
       FROM req
       WHERE p.id = req.id AND p.shop_id = $3::uuid`, [ids, qtys, shopId]);
        // Check for negative stock
        const { rows: stockCheck } = await client.query(`SELECT id::text, name, stock FROM coffeepos.products
       WHERE id = ANY($1::uuid[]) AND stock < 0 AND stock != -1`, [ids]);
        for (const row of stockCheck) {
            needsReview = true;
            const requested = qtyByProductId.get(row.id) ?? 0;
            reviewReasons.push(`Stok '${row.name}' menjadi ${row.stock} (diminta: ${requested})`);
        }
    }
    // ── Step 9: Insert transaction ─────────────────────────────────────────
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const customerId = typeof tx.customer_id === 'string' && uuidRe.test(tx.customer_id.trim())
        ? tx.customer_id.trim()
        : null;
    // Use the client-provided created_at as the transaction timestamp
    const clientCreatedAt = tx.created_at ? new Date(tx.created_at).toISOString() : new Date().toISOString();
    const targetBranchId = await resolveBranchId(shopId, tx.branch_id, userBranchId, client);
    await client.query(`INSERT INTO coffeepos.transactions
       (id, subtotal, tax, service_charge, grand_total, discount_amount,
        customer_name, customer_id, table_number, notes, payment_method,
        cash_received, change_amount, order_type, status,
        shop_id, cashier_id, cashier_name, shift_id, branch_id,
        created_offline, synced_at, sync_device_id,
        needs_review, review_reason,
        created_at, updated_at)
     VALUES
       ($1::uuid, $2, $3, $4::int, $5, 0,
        $6, $7::uuid, $8, $9, $10,
        $11, $12, $13::text, 'completed',
        $14::uuid, $15::uuid, $16, $17::uuid, $18::uuid,
        true, now(), $19,
        $20, $21,
        $22::timestamptz, now())`, [
        txId, subtotal, tax, serviceCharge, grandTotal,
        tx.customer_name ?? null, customerId, tx.table_number ?? null,
        tx.notes ?? null, tx.payment_method,
        cashReceived, changeAmount, tx.order_type,
        shopId, cashierId, cashierName, shiftId, targetBranchId,
        deviceId,
        needsReview, needsReview ? reviewReasons.join('; ') : null,
        clientCreatedAt,
    ]);
    // Insert transaction items
    const normalizedItems = [];
    for (const line of realLines) {
        const p = productById.get(line.productId);
        const variantPrice = line.variantPrice ?? 0;
        const finalPrice = p.price + variantPrice;
        const variantStr = line.variantName
            ? (variantPrice > 0 ? `[${line.variantName}@${variantPrice}]` : `[${line.variantName}]`)
            : '';
        const finalDesc = [line.description, variantStr].filter(Boolean).join(' - ');
        normalizedItems.push({
            kind: 'real',
            productId: p.id,
            name: p.name,
            price: finalPrice,
            quantity: line.quantity,
            description: finalDesc || undefined,
            isCustom: false,
        });
    }
    for (const line of manualLines) {
        const price = line.price ?? 0;
        const variantPrice = line.variantPrice ?? 0;
        const finalPrice = price + variantPrice;
        const name = line.note?.trim() || 'Custom Item';
        const variantStr = line.variantName
            ? (variantPrice > 0 ? `[${line.variantName}@${variantPrice}]` : `[${line.variantName}]`)
            : '';
        const finalDesc = [line.description, variantStr].filter(Boolean).join(' - ');
        normalizedItems.push({
            kind: 'manual',
            productId: null,
            name,
            price: finalPrice,
            quantity: line.quantity,
            description: finalDesc || undefined,
            isCustom: true,
        });
    }
    if (normalizedItems.length > 0) {
        const values = [];
        const rowsSql = [];
        let idx = 1;
        for (const item of normalizedItems) {
            rowsSql.push(`(gen_random_uuid(),$${idx++}::uuid,$${idx++}::uuid,$${idx++},$${idx++},$${idx++}::int,$${idx++}::text,$${idx++}::boolean)`);
            values.push(txId, item.productId, item.name, item.price, item.quantity, item.description ?? null, item.isCustom);
        }
        await client.query(`INSERT INTO coffeepos.transaction_items
         (id, transaction_id, product_id, name, price, quantity, description, is_custom)
       VALUES ${rowsSql.join(',')}`, values);
    }
    // ── Step 10: Shift stats update ────────────────────────────────────────
    if (shiftId) {
        await client.query(`UPDATE coffeepos.shifts
       SET total_sales = COALESCE(total_sales, 0) + $1,
           total_transactions = COALESCE(total_transactions, 0) + 1
       WHERE id = $2::uuid`, [grandTotal, shiftId]);
    }
    // ── Build result ───────────────────────────────────────────────────────
    const result = {
        client_transaction_id: txId,
        status: needsReview ? 'needs_review' : 'synced',
        server_transaction_id: txId,
        server_calculated: {
            subtotal,
            tax,
            service_charge: serviceCharge,
            grand_total: grandTotal,
            price_differences: priceDifferences,
        },
    };
    if (needsReview) {
        result.review_reason = reviewReasons.join('; ');
    }
    return result;
}
