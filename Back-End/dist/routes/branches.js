import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { HttpError } from '../http/errors.js';
import { validateBody } from '../http/validate.js';
import { requireOwner } from '../middleware/requireRole.js';
export const branchesRouter = Router();
// Require Owner role for all branch management routes
branchesRouter.use(requireOwner);
const CreateBranchSchema = z.object({
    name: z.string().trim().min(1, 'Nama cabang wajib diisi').max(100),
    address: z.string().trim().nullish(),
    phone: z.string().trim().nullish(),
    city: z.string().trim().nullish(),
    notes: z.string().trim().nullish(),
    is_active: z.boolean().optional().default(true),
});
const UpdateBranchSchema = z.object({
    name: z.string().trim().min(1).max(100).optional(),
    address: z.string().trim().nullish(),
    phone: z.string().trim().nullish(),
    city: z.string().trim().nullish(),
    notes: z.string().trim().nullish(),
    is_active: z.boolean().optional(),
});
// Helper: get default branch ID for a shop
export async function getDefaultBranchId(shopId, client) {
    const runner = client || pool;
    const res = await runner.query(`SELECT id::text FROM coffeepos.branches WHERE shop_id = $1::uuid AND is_default = true LIMIT 1`, [shopId]);
    if (res.rows.length === 0) {
        // Fallback: create default branch if somehow missing
        const created = await runner.query(`INSERT INTO coffeepos.branches (shop_id, name, is_default)
       VALUES ($1::uuid, 'Cabang Utama', true)
       RETURNING id::text`, [shopId]);
        return created.rows[0].id;
    }
    return res.rows[0].id;
}
// ── GET /api/branches ───────────────────────────────────────
branchesRouter.get('/', async (req, res, next) => {
    try {
        const shopId = req.user.shop_id;
        const { rows } = await pool.query(`SELECT
         b.id::text,
         b.shop_id::text,
         b.name,
         b.address,
         b.phone,
         b.city,
         b.notes,
         b.is_active,
         b.is_default,
         b.created_at,
         b.updated_at,
         COUNT(DISTINCT u.id)::int AS active_cashiers_count,
         COUNT(DISTINCT t.id)::int AS total_transactions_count
       FROM coffeepos.branches b
       LEFT JOIN coffeepos.users u ON u.branch_id = b.id AND u.is_active = true AND u.role = 'cashier'
       LEFT JOIN coffeepos.transactions t ON t.branch_id = b.id
       WHERE b.shop_id = $1::uuid
       GROUP BY b.id
       ORDER BY b.is_default DESC, b.created_at ASC`, [shopId]);
        res.json(rows);
    }
    catch (err) {
        next(err);
    }
});
// ── POST /api/branches ──────────────────────────────────────
branchesRouter.post('/', validateBody(CreateBranchSchema), async (req, res, next) => {
    try {
        const shopId = req.user.shop_id;
        const body = req.body;
        const { rows } = await pool.query(`INSERT INTO coffeepos.branches
         (shop_id, name, address, phone, city, notes, is_active, is_default)
       VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, false)
       RETURNING id::text, shop_id::text, name, address, phone, city, notes, is_active, is_default, created_at, updated_at`, [
            shopId,
            body.name,
            body.address ?? null,
            body.phone ?? null,
            body.city ?? null,
            body.notes ?? null,
            body.is_active ?? true,
        ]);
        res.status(201).json(rows[0]);
    }
    catch (err) {
        next(err);
    }
});
// ── PATCH /api/branches/:id ──────────────────────────────────
branchesRouter.patch('/:id', validateBody(UpdateBranchSchema), async (req, res, next) => {
    try {
        const shopId = req.user.shop_id;
        const branchId = req.params.id;
        const body = req.body;
        // Check branch ownership
        const check = await pool.query(`SELECT id, is_default FROM coffeepos.branches WHERE id = $1::uuid AND shop_id = $2::uuid`, [branchId, shopId]);
        if (check.rows.length === 0) {
            throw new HttpError(404, 'NOT_FOUND', 'Cabang tidak ditemukan');
        }
        const branch = check.rows[0];
        const sets = [];
        const params = [];
        let p = 1;
        if (body.name !== undefined) {
            sets.push(`name = $${p++}`);
            params.push(body.name);
        }
        if (body.address !== undefined) {
            sets.push(`address = $${p++}`);
            params.push(body.address);
        }
        if (body.phone !== undefined) {
            sets.push(`phone = $${p++}`);
            params.push(body.phone);
        }
        if (body.city !== undefined) {
            sets.push(`city = $${p++}`);
            params.push(body.city);
        }
        if (body.notes !== undefined) {
            sets.push(`notes = $${p++}`);
            params.push(body.notes);
        }
        if (body.is_active !== undefined) {
            // Cannot deactivate default branch
            if (branch.is_default && body.is_active === false) {
                throw new HttpError(400, 'CANNOT_DEACTIVATE_DEFAULT', 'Cabang utama (default) tidak boleh dinonaktifkan.');
            }
            sets.push(`is_active = $${p++}`);
            params.push(body.is_active);
        }
        if (sets.length === 0) {
            throw new HttpError(400, 'VALIDATION_ERROR', 'Tidak ada data yang diubah');
        }
        sets.push(`updated_at = now()`);
        params.push(branchId, shopId);
        const { rows } = await pool.query(`UPDATE coffeepos.branches
       SET ${sets.join(', ')}
       WHERE id = $${p++}::uuid AND shop_id = $${p++}::uuid
       RETURNING id::text, shop_id::text, name, address, phone, city, notes, is_active, is_default, created_at, updated_at`, params);
        res.json(rows[0]);
    }
    catch (err) {
        next(err);
    }
});
// ── DELETE /api/branches/:id ─────────────────────────────────
branchesRouter.delete('/:id', async (req, res, next) => {
    try {
        const shopId = req.user.shop_id;
        const branchId = req.params.id;
        // Check branch existence & default status
        const check = await pool.query(`SELECT id, is_default FROM coffeepos.branches WHERE id = $1::uuid AND shop_id = $2::uuid`, [branchId, shopId]);
        if (check.rows.length === 0) {
            throw new HttpError(404, 'NOT_FOUND', 'Cabang tidak ditemukan');
        }
        if (check.rows[0].is_default) {
            throw new HttpError(400, 'CANNOT_DELETE_DEFAULT', 'Cabang utama (default) tidak dapat dihapus.');
        }
        // Check for active transactions or cashiers attached to this branch
        const txCheck = await pool.query(`SELECT COUNT(*)::int AS count FROM coffeepos.transactions WHERE branch_id = $1::uuid`, [branchId]);
        const cashierCheck = await pool.query(`SELECT COUNT(*)::int AS count FROM coffeepos.users WHERE branch_id = $1::uuid AND is_active = true`, [branchId]);
        const shiftCheck = await pool.query(`SELECT COUNT(*)::int AS count FROM coffeepos.shifts WHERE branch_id = $1::uuid`, [branchId]);
        const totalTxs = Number(txCheck.rows[0]?.count || 0);
        const totalCashiers = Number(cashierCheck.rows[0]?.count || 0);
        const totalShifts = Number(shiftCheck.rows[0]?.count || 0);
        if (totalTxs > 0 || totalCashiers > 0 || totalShifts > 0) {
            throw new HttpError(400, 'BRANCH_HAS_DEPENDENCIES', 'Cabang tidak dapat dihapus karena masih memiliki data transaksi/kasir aktif. Nonaktifkan kasir dan pindahkan data terlebih dahulu.');
        }
        await pool.query(`DELETE FROM coffeepos.branches WHERE id = $1::uuid AND shop_id = $2::uuid`, [branchId, shopId]);
        res.json({ success: true, message: 'Cabang berhasil dihapus' });
    }
    catch (err) {
        next(err);
    }
});
