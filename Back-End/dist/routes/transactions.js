import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { withTransaction } from '../db/with-transaction.js';
import { HttpError } from '../http/errors.js';
import { validateBody } from '../http/validate.js';
import { requireOwner } from '../middleware/requireRole.js';
export const transactionsRouter = Router();
const TZ = 'Asia/Jakarta';
const VoidRequestSchema = z.object({
    reason: z.string().trim().min(5)
});
const VoidApproveSchema = z.object({
    note: z.string().trim().optional()
});
const VoidRejectSchema = z.object({
    note: z.string().trim().min(1)
});
const VoidDirectSchema = z.object({
    reason: z.string().trim().optional()
});
const NON_VOID = `(COALESCE(t.status, '') <> 'voided')`;
function mapOrderType(raw) {
    const v = (raw || '').toLowerCase().trim();
    if (v === 'take-away' || v === 'takeaway')
        return 'takeaway';
    return 'dine_in';
}
function mapPaymentDisplay(method) {
    const m = (method || '').toLowerCase();
    if (m === 'cash' || m.includes('tunai'))
        return 'Cash';
    if (m === 'qris')
        return 'QRIS';
    return 'Transfer';
}
function mapRowToTransactionPayload(r) {
    const items = Array.isArray(r.items) ? r.items : [];
    const subtotalNum = Number(r.subtotal ?? 0);
    const discountNum = Number(r.discount_amount ?? 0);
    const taxNum = Number(r.tax ?? 0);
    const totalNum = Number(r.grand_total ?? 0);
    return {
        id: r.id,
        created_at: r.created_at,
        status: r.status,
        cashier_id: r.cashier_id,
        cashier_name: r.cashier_name,
        customer_id: r.customer_id ?? null,
        customer_name: r.customer_display_name ?? null,
        table_number: r.table_number ?? null,
        order_type: mapOrderType(r.order_type ?? null),
        subtotal: subtotalNum,
        discount_amount: discountNum,
        tax_amount: taxNum,
        total_amount: totalNum,
        payment_method: mapPaymentDisplay(String(r.payment_method ?? '')),
        amount_paid: r.amount_paid != null ? Number(r.amount_paid) : null,
        change_amount: r.change_amount != null ? Number(r.change_amount) : null,
        raw_payment_method: r.payment_method ?? null,
        items,
        notes: r.notes ?? null,
        void_reason: r.void_reason ?? null,
        void_requested_at: r.void_requested_at ?? null,
        void_reviewed_at: r.void_reviewed_at ?? null,
        void_review_note: r.void_review_note ?? null,
        shift_id: r.shift_id ?? null,
        branch_id: r.branch_id ?? null,
        branch_name: r.branch_name ?? null,
        created_offline: r.created_offline ?? false,
        synced_at: r.synced_at ?? null,
        needs_review: r.needs_review ?? false,
        review_reason: r.review_reason ?? null,
    };
}
function itemsAggJson() {
    return `
    COALESCE(
      json_agg(
        json_build_object(
          'product_id', CASE WHEN i.product_id IS NULL THEN NULL ELSE i.product_id::text END,
          'product_name', i.name,
          'quantity', i.quantity,
          'unit_price', i.price,
          'subtotal', i.price::bigint * i.quantity::bigint,
          'notes', i.description
        )
        ORDER BY i.created_at NULLS LAST, i.id
      ) FILTER (WHERE i.id IS NOT NULL),
      '[]'::json
    )
  `.trim();
}
const TX_AGG_SELECT = `
  SELECT
    t.id::text,
    t.created_at,
    t.status::text AS status,
    t.cashier_id::text,
    t.cashier_name,
    t.customer_id::text,
    CASE
      WHEN t.customer_name IS NOT NULL AND trim(t.customer_name) <> ''
      THEN trim(t.customer_name)
      ELSE NULL
    END AS customer_display_name,
    t.table_number,
    t.order_type,
    t.subtotal,
    t.discount_amount,
    t.tax,
    t.grand_total,
    t.payment_method::text AS payment_method,
    t.cash_received AS amount_paid,
    t.change_amount,
    t.notes,
    t.void_reason,
    t.void_requested_at,
    t.void_reviewed_at,
    t.void_review_note,
    t.shift_id::text,
    t.branch_id::text,
    MAX(b.name) AS branch_name,
    t.created_offline,
    t.synced_at,
    t.needs_review,
    t.review_reason,
    ${itemsAggJson()} AS items_json
  FROM coffeepos.transactions t
  LEFT JOIN coffeepos.branches b ON b.id = t.branch_id
  LEFT JOIN coffeepos.transaction_items i ON i.transaction_id = t.id
`;
function parseItemsJson(raw) {
    if (Array.isArray(raw))
        return raw;
    if (typeof raw === 'string') {
        try {
            const p = JSON.parse(raw);
            return Array.isArray(p) ? p : [];
        }
        catch {
            return [];
        }
    }
    return [];
}
function shapeAggregatedRow(r) {
    const items = parseItemsJson(r.items_json);
    delete r.items_json;
    return mapRowToTransactionPayload({ ...r, items });
}
async function loadTransactionMapped(id, shopId) {
    const { rows } = await pool.query(`${TX_AGG_SELECT} WHERE t.id = $1::uuid AND t.shop_id = $2::uuid GROUP BY t.id`, [
        id,
        shopId
    ]);
    if (!rows.length)
        throw new HttpError(404, 'NOT_FOUND', 'Transaction not found');
    return shapeAggregatedRow(rows[0]);
}
transactionsRouter.get('/summary', async (req, res, next) => {
    try {
        const scope = String(req.query.scope || '');
        if (!['today', 'month'].includes(scope)) {
            throw new HttpError(400, 'VALIDATION_ERROR', 'Use scope=today or scope=month');
        }
        const shopId = req.user.shop_id;
        let cashierExpr = '';
        const params = [shopId];
        let p = 2;
        if (req.user.role === 'cashier') {
            cashierExpr = ` AND t.cashier_id = $${p++}::uuid`;
            params.push(req.user.id);
            if (req.user.branch_id) {
                cashierExpr += ` AND t.branch_id = $${p++}::uuid`;
                params.push(req.user.branch_id);
            }
        }
        else {
            if (typeof req.query.cashier_id === 'string' && req.query.cashier_id.trim().length > 0) {
                cashierExpr += ` AND t.cashier_id = $${p++}::uuid`;
                params.push(req.query.cashier_id.trim());
            }
            if (typeof req.query.branch_id === 'string' && req.query.branch_id.trim() !== '' && req.query.branch_id.trim() !== 'all') {
                cashierExpr += ` AND t.branch_id = $${p++}::uuid`;
                params.push(req.query.branch_id.trim());
            }
        }
        const scopeExpr = scope === 'today'
            ? `(DATE(t.created_at AT TIME ZONE '${TZ}') = DATE((now() AT TIME ZONE '${TZ}')))`
            : `(
            DATE_TRUNC('month', t.created_at AT TIME ZONE '${TZ}')
            = DATE_TRUNC('month', (now() AT TIME ZONE '${TZ}'))
          )`;
        const sql = `
      SELECT COUNT(*)::int AS c, COALESCE(SUM(t.grand_total), 0)::bigint AS s
      FROM coffeepos.transactions t
      WHERE t.shop_id = $1::uuid
      ${cashierExpr}
      AND ${NON_VOID}
      AND ${scopeExpr}
    `;
        const { rows } = await pool.query(sql, params);
        const cnt = Number(rows[0]?.c ?? 0);
        const sales = Number(rows[0]?.s ?? 0);
        if (scope === 'today') {
            res.json({
                total_count: cnt,
                total_sales: sales,
                today_count: cnt,
                today_sales: sales
            });
        }
        else {
            res.json({
                total_count: cnt,
                total_sales: sales,
                month_count: cnt,
                month_sales: sales
            });
        }
    }
    catch (e) {
        next(e);
    }
});
transactionsRouter.get('/void-requests', requireOwner, async (_req, res, next) => {
    try {
        const shopId = _req.user.shop_id;
        const sql = `
      ${TX_AGG_SELECT}
      WHERE t.shop_id = $1::uuid AND t.status = 'pending_void'
      GROUP BY t.id
      ORDER BY t.void_requested_at ASC NULLS LAST, t.created_at ASC
    `;
        const { rows } = await pool.query(sql, [shopId]);
        const data = rows.map((r) => shapeAggregatedRow(r));
        res.json({ data, total: data.length });
    }
    catch (e) {
        next(e);
    }
});
transactionsRouter.get('/', async (req, res, next) => {
    try {
        const shopId = req.user.shop_id;
        const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'), 10) || 20));
        const offset = (page - 1) * limit;
        const statusFilter = typeof req.query.status === 'string' ? req.query.status.trim() : 'all';
        const searchRaw = typeof req.query.q === 'string' ? req.query.q.trim() : '';
        const sortRaw = String(req.query.sort || 'desc');
        const asc = sortRaw === 'asc';
        const paymentMethod = typeof req.query.payment_method === 'string' && req.user.role === 'owner'
            ? req.query.payment_method.trim().toLowerCase()
            : '';
        const clauses = [`t.shop_id = $1::uuid`];
        const qp = [shopId];
        let pidx = 2;
        if (req.user.role === 'cashier') {
            clauses.push(`t.cashier_id = $${pidx++}::uuid`);
            qp.push(req.user.id);
            if (req.user.branch_id) {
                clauses.push(`t.branch_id = $${pidx++}::uuid`);
                qp.push(req.user.branch_id);
            }
        }
        else {
            if (typeof req.query.date_from === 'string' && req.query.date_from) {
                clauses.push(`(t.created_at AT TIME ZONE '${TZ}')::date >= $${pidx++}::date`);
                qp.push(req.query.date_from);
            }
            if (typeof req.query.date_to === 'string' && req.query.date_to) {
                clauses.push(`(t.created_at AT TIME ZONE '${TZ}')::date <= $${pidx++}::date`);
                qp.push(req.query.date_to);
            }
            if (typeof req.query.scope === 'string' && req.query.scope === 'today') {
                clauses.push(`(DATE(t.created_at AT TIME ZONE '${TZ}') = DATE((now() AT TIME ZONE '${TZ}')))`);
            }
            if (typeof req.query.cashier_id === 'string' && req.query.cashier_id.trim()) {
                clauses.push(`t.cashier_id = $${pidx++}::uuid`);
                qp.push(req.query.cashier_id.trim());
            }
            if (typeof req.query.branch_id === 'string' && req.query.branch_id.trim() !== '' && req.query.branch_id.trim() !== 'all') {
                clauses.push(`t.branch_id = $${pidx++}::uuid`);
                qp.push(req.query.branch_id.trim());
            }
        }
        if (statusFilter !== 'all' && ['completed', 'pending_void', 'voided'].includes(statusFilter)) {
            clauses.push(`t.status = $${pidx++}`);
            qp.push(statusFilter);
        }
        if (paymentMethod) {
            clauses.push(`LOWER(trim(t.payment_method)) = $${pidx++}`);
            qp.push(paymentMethod);
        }
        if (searchRaw) {
            const pat = `%${searchRaw}%`;
            clauses.push(`(t.id::text ILIKE $${pidx} OR (t.customer_name IS NOT NULL AND t.customer_name ILIKE $${pidx}))`);
            qp.push(pat);
            pidx += 1;
        }
        const whereSql = clauses.join(' AND ');
        const { rows: cntRows } = await pool.query(`SELECT COUNT(*)::int AS c FROM coffeepos.transactions t WHERE ${whereSql}`, qp);
        const total = Number(cntRows[0]?.c ?? 0);
        qp.push(limit, offset);
        const lim = qp.length;
        const dataSql = `
      ${TX_AGG_SELECT}
      WHERE ${whereSql}
      GROUP BY t.id
      ORDER BY t.created_at ${asc ? 'ASC' : 'DESC'}
      LIMIT $${lim - 1} OFFSET $${lim}
    `;
        const { rows } = await pool.query(dataSql, qp);
        const data = rows.map((r) => shapeAggregatedRow(r));
        res.json({ data, pagination: { total, page, limit } });
    }
    catch (e) {
        next(e);
    }
});
transactionsRouter.post('/:id/void-request', validateBody(VoidRequestSchema), async (req, res, next) => {
    try {
        if (req.user.role !== 'cashier') {
            throw new HttpError(403, 'FORBIDDEN', 'Only cashiers may request voids');
        }
        const txId = req.params.id;
        const body = req.body;
        const shopId = req.user.shop_id;
        const userId = req.user.id;
        await withTransaction(async (client) => {
            const { rows: found } = await client.query(`SELECT *, 
                (DATE(created_at AT TIME ZONE '${TZ}') = DATE((now() AT TIME ZONE '${TZ}'))) AS is_today
         FROM coffeepos.transactions
         WHERE id = $1::uuid AND shop_id = $2::uuid
         FOR UPDATE`, [txId, shopId]);
            if (found.length === 0)
                throw new HttpError(404, 'NOT_FOUND', 'Transaction not found');
            const trx = found[0];
            if (String(trx.cashier_id) !== userId) {
                throw new HttpError(403, 'FORBIDDEN', 'This transaction belongs to another cashier');
            }
            if (String(trx.status) !== 'completed') {
                throw new HttpError(400, 'INVALID_STATE', 'Only completed transactions may be cancelled');
            }
            if (!trx.is_today) {
                throw new HttpError(400, 'INVALID_STATE', 'Only today’s transactions may be cancelled');
            }
            await client.query(`UPDATE coffeepos.transactions SET
           status = 'pending_void',
           void_reason = $1,
           void_requested_by = $2::uuid,
           void_requested_at = now(),
           updated_at = now()
         WHERE id = $3::uuid`, [body.reason, userId, txId]);
        });
        const mapped = await loadTransactionMapped(txId, shopId);
        res.json(mapped);
    }
    catch (e) {
        next(e);
    }
});
async function reverseStockForTransaction(client, txUuid) {
    const { rows: lines } = await client.query(`SELECT product_id, quantity FROM coffeepos.transaction_items WHERE transaction_id = $1::uuid AND product_id IS NOT NULL`, [txUuid]);
    for (const line of lines) {
        const pid = line.product_id;
        const qty = Number(line.quantity);
        await client.query(`UPDATE coffeepos.products
       SET stock = CASE WHEN stock = -1 THEN -1 ELSE stock + $2::int END,
           updated_at = now()
       WHERE id = $1::uuid`, [pid, qty]);
    }
}
transactionsRouter.post('/:id/void-approve', requireOwner, validateBody(VoidApproveSchema), async (req, res, next) => {
    try {
        const txId = req.params.id;
        const shopId = req.user.shop_id;
        const body = req.body;
        const ownerId = req.user.id;
        await withTransaction(async (client) => {
            const { rows } = await client.query(`SELECT *, grand_total FROM coffeepos.transactions WHERE id = $1::uuid AND shop_id = $2::uuid FOR UPDATE`, [txId, shopId]);
            if (rows.length === 0)
                throw new HttpError(404, 'NOT_FOUND', 'Transaction not found');
            const trx = rows[0];
            if (String(trx.status) !== 'pending_void') {
                throw new HttpError(400, 'INVALID_STATE', 'Transaction is not pending void');
            }
            await reverseStockForTransaction(client, txId);
            await client.query(`UPDATE coffeepos.transactions SET
           status = 'voided',
           void_reviewed_by = $1::uuid,
           void_reviewed_at = now(),
           void_review_note = COALESCE($2, void_review_note),
           updated_at = now()
         WHERE id = $3::uuid`, [ownerId, body.note ?? null, txId]);
            // [FIX-4] Also update expected_cash and cash_difference for cash payments on closed shifts
            const shiftId = trx.shift_id;
            const grandTotal = Number(trx.grand_total ?? 0);
            const paymentMethod = String(trx.payment_method ?? '').toLowerCase();
            const isCashPayment = paymentMethod === 'cash' || paymentMethod.includes('tunai');
            if (shiftId) {
                await client.query(`UPDATE coffeepos.shifts
           SET total_transactions = GREATEST(0, COALESCE(total_transactions, 0) - 1),
               total_sales = GREATEST(0, COALESCE(total_sales, 0) - $1::bigint),
               expected_cash = CASE
                 WHEN $3::boolean
                 THEN GREATEST(0, COALESCE(expected_cash, 0) - $1::bigint)
                 ELSE expected_cash
               END,
               cash_difference = CASE
                 WHEN $3::boolean AND status = 'closed'
                 THEN COALESCE(cash_difference, 0) + $1::bigint
                 ELSE cash_difference
               END
           WHERE id = $2::uuid`, [grandTotal, shiftId, isCashPayment]);
            }
        });
        const mapped = await loadTransactionMapped(txId, shopId);
        res.json(mapped);
    }
    catch (e) {
        next(e);
    }
});
transactionsRouter.post('/:id/void-reject', requireOwner, validateBody(VoidRejectSchema), async (req, res, next) => {
    try {
        const txId = req.params.id;
        const shopId = req.user.shop_id;
        const body = req.body;
        const ownerId = req.user.id;
        await withTransaction(async (client) => {
            const { rows } = await client.query(`SELECT * FROM coffeepos.transactions WHERE id = $1::uuid AND shop_id = $2::uuid FOR UPDATE`, [txId, shopId]);
            if (rows.length === 0)
                throw new HttpError(404, 'NOT_FOUND', 'Transaction not found');
            const trx = rows[0];
            if (String(trx.status) !== 'pending_void') {
                throw new HttpError(400, 'INVALID_STATE', 'Transaction is not pending void');
            }
            await client.query(`UPDATE coffeepos.transactions SET
           status = 'completed',
           void_reviewed_by = $1::uuid,
           void_reviewed_at = now(),
           void_review_note = $2,
           updated_at = now()
         WHERE id = $3::uuid`, [ownerId, body.note, txId]);
        });
        const mapped = await loadTransactionMapped(txId, shopId);
        res.json(mapped);
    }
    catch (e) {
        next(e);
    }
});
transactionsRouter.post('/:id/void-direct', requireOwner, validateBody(VoidDirectSchema), async (req, res, next) => {
    try {
        const txId = req.params.id;
        const shopId = req.user.shop_id;
        const body = req.body;
        const ownerId = req.user.id;
        await withTransaction(async (client) => {
            const { rows } = await client.query(`SELECT *, grand_total FROM coffeepos.transactions WHERE id = $1::uuid AND shop_id = $2::uuid FOR UPDATE`, [txId, shopId]);
            if (rows.length === 0)
                throw new HttpError(404, 'NOT_FOUND', 'Transaction not found');
            const trx = rows[0];
            if (String(trx.status) !== 'completed') {
                throw new HttpError(400, 'INVALID_STATE', 'Only completed transactions may be voided directly');
            }
            await reverseStockForTransaction(client, txId);
            await client.query(`UPDATE coffeepos.transactions SET
           status = 'voided',
           void_reason = $1,
           void_requested_by = $2::uuid,
           void_requested_at = now(),
           void_reviewed_by = $2::uuid,
           void_reviewed_at = now(),
           void_review_note = 'Direct void by owner',
           updated_at = now()
         WHERE id = $3::uuid`, [body.reason, ownerId, txId]);
            // Also update expected_cash and cash_difference for cash payments on closed shifts
            const shiftId = trx.shift_id;
            const grandTotal = Number(trx.grand_total ?? 0);
            const paymentMethod = String(trx.payment_method ?? '').toLowerCase();
            const isCashPayment = paymentMethod === 'cash' || paymentMethod.includes('tunai');
            if (shiftId) {
                await client.query(`UPDATE coffeepos.shifts
           SET total_transactions = GREATEST(0, COALESCE(total_transactions, 0) - 1),
               total_sales = GREATEST(0, COALESCE(total_sales, 0) - $1::bigint),
               expected_cash = CASE
                 WHEN $3::boolean
                 THEN GREATEST(0, COALESCE(expected_cash, 0) - $1::bigint)
                 ELSE expected_cash
               END,
               cash_difference = CASE
                 WHEN $3::boolean AND status = 'closed'
                 THEN COALESCE(cash_difference, 0) + $1::bigint
                 ELSE cash_difference
               END
           WHERE id = $2::uuid`, [grandTotal, shiftId, isCashPayment]);
            }
        });
        const mapped = await loadTransactionMapped(txId, shopId);
        res.json(mapped);
    }
    catch (e) {
        next(e);
    }
});
// ─── Offline Sync: Needs Review ──────────────────────────────────────────────
const ResolveReviewSchema = z.object({
    action: z.enum(['accept', 'void']),
    note: z.string().trim().optional(),
});
// GET /transactions/needs-review — List transactions flagged for owner review
transactionsRouter.get('/needs-review', requireOwner, async (req, res, next) => {
    try {
        const shopId = req.user.shop_id;
        // We need to include review_reason which is not in the standard TX_AGG_SELECT,
        // so we query it separately and merge
        const sql = `
      ${TX_AGG_SELECT}
      WHERE t.shop_id = $1::uuid AND t.needs_review = true
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `;
        const { rows } = await pool.query(sql, [shopId]);
        // Also fetch the extra offline columns
        const { rows: extraRows } = await pool.query(`SELECT id::text, review_reason, sync_device_id, created_offline, synced_at
       FROM coffeepos.transactions
       WHERE shop_id = $1::uuid AND needs_review = true`, [shopId]);
        const extraMap = new Map(extraRows.map(r => [r.id, r]));
        const data = rows.map((r) => {
            const shaped = shapeAggregatedRow(r);
            const extra = extraMap.get(shaped.id);
            return {
                ...shaped,
                review_reason: extra?.review_reason ?? null,
                sync_device_id: extra?.sync_device_id ?? null,
                created_offline: extra?.created_offline ?? false,
                synced_at: extra?.synced_at ?? null,
            };
        });
        res.json({ data, total: data.length });
    }
    catch (e) {
        next(e);
    }
});
// POST /transactions/:id/resolve-review — Owner accepts or voids a flagged transaction
transactionsRouter.post('/:id/resolve-review', requireOwner, validateBody(ResolveReviewSchema), async (req, res, next) => {
    try {
        const txId = req.params.id;
        const shopId = req.user.shop_id;
        const ownerId = req.user.id;
        const body = req.body;
        await withTransaction(async (client) => {
            const { rows } = await client.query(`SELECT *, grand_total FROM coffeepos.transactions
         WHERE id = $1::uuid AND shop_id = $2::uuid
         FOR UPDATE`, [txId, shopId]);
            if (rows.length === 0)
                throw new HttpError(404, 'NOT_FOUND', 'Transaction not found');
            const trx = rows[0];
            if (!trx.needs_review) {
                throw new HttpError(400, 'INVALID_STATE', 'Transaction does not need review');
            }
            if (body.action === 'accept') {
                // Owner accepts the transaction despite stock conflict
                await client.query(`UPDATE coffeepos.transactions SET
             needs_review = false,
             reviewed_at = now(),
             reviewed_by = $1::uuid,
             void_review_note = COALESCE($2, void_review_note),
             updated_at = now()
           WHERE id = $3::uuid`, [ownerId, body.note ?? 'Accepted by owner', txId]);
            }
            else {
                // Owner voids the transaction — reverse stock
                await reverseStockForTransaction(client, txId);
                await client.query(`UPDATE coffeepos.transactions SET
             status = 'voided',
             needs_review = false,
             reviewed_at = now(),
             reviewed_by = $1::uuid,
             void_reason = COALESCE(void_reason, 'Stock conflict'),
             void_requested_by = $1::uuid,
             void_requested_at = now(),
             void_reviewed_by = $1::uuid,
             void_reviewed_at = now(),
             void_review_note = COALESCE($2, 'Voided due to stock conflict'),
             updated_at = now()
           WHERE id = $3::uuid`, [ownerId, body.note ?? 'Voided due to stock conflict', txId]);
                // Update shift stats
                const shiftId = trx.shift_id;
                const grandTotal = Number(trx.grand_total ?? 0);
                if (shiftId) {
                    await client.query(`UPDATE coffeepos.shifts
             SET total_transactions = GREATEST(0, COALESCE(total_transactions, 0) - 1),
                 total_sales = GREATEST(0, COALESCE(total_sales, 0) - $1::bigint)
             WHERE id = $2::uuid`, [grandTotal, shiftId]);
                }
            }
        });
        const mapped = await loadTransactionMapped(txId, shopId);
        res.json({
            ...mapped,
            review_resolved: true,
            review_action: body.action,
        });
    }
    catch (e) {
        next(e);
    }
});
