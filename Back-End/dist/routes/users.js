import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { pool } from '../db/pool.js';
import { HttpError } from '../http/errors.js';
import { validateBody } from '../http/validate.js';
import { env } from '../env.js';
import { requireOwner, requireRole } from '../middleware/requireRole.js';
import { resolveBranchId } from './branches.js';
export const usersRouter = Router();
const ADJECTIVES = [
    'Kopi',
    'Susu',
    'Manis',
    'Dingin',
    'Panas',
    'Segar',
    'Nikmat',
    'Harmoni',
    'Hangat',
    'Premium',
    'Arabika',
    'Robusta'
];
function generateTemporaryPassword() {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const cap = adj.charAt(0).toUpperCase() + adj.slice(1);
    const num = Math.floor(1000 + Math.random() * 9000);
    return `${cap}${num}`;
}
// ── Schemas ──────────────────────────────────────────────────
const CreateUserSchema = z.object({
    name: z.string().trim().min(3),
    email: z.string().trim().email(),
    password: z.string().min(8),
    role: z.enum(['cashier']),
    branch_id: z.string().uuid().optional(),
});
const UpdateUserSchema = z.object({
    name: z.string().trim().min(3).optional(),
    email: z.string().trim().email().optional(),
    is_active: z.boolean().optional(),
    branch_id: z.string().uuid().optional(),
});
const SetPinSchema = z.object({
    pin: z.string().regex(/^\d{4,6}$/, 'PIN harus 4–6 digit angka')
});
// ── Cashier self-service PIN (register before /:id routes) ───
usersRouter.put('/me/pin', requireRole('cashier'), validateBody(SetPinSchema), async (req, res, next) => {
    try {
        const body = req.body;
        const pinHash = await bcrypt.hash(body.pin, env.BCRYPT_ROUNDS);
        await pool.query(`UPDATE coffeepos.users SET pin = $1, updated_at = now() WHERE id = $2::uuid`, [pinHash, req.user.id]);
        res.json({ success: true });
    }
    catch (err) {
        next(err);
    }
});
usersRouter.delete('/me/pin', requireRole('cashier'), async (req, res, next) => {
    try {
        await pool.query(`UPDATE coffeepos.users SET pin = NULL, updated_at = now() WHERE id = $1::uuid`, [req.user.id]);
        res.json({ success: true });
    }
    catch (err) {
        next(err);
    }
});
// ── POST /users/:id/reset-password ─────────────────────────────
usersRouter.post('/:id/reset-password', requireOwner, async (req, res, next) => {
    try {
        const { id } = req.params;
        const check = await pool.query(`SELECT id::text FROM coffeepos.users
       WHERE id = $1::uuid AND shop_id = $2::uuid AND role = 'cashier'`, [id, req.user.shop_id]);
        if (check.rowCount === 0) {
            throw new HttpError(404, 'NOT_FOUND', 'Kasir tidak ditemukan di toko Anda');
        }
        const temporaryPassword = generateTemporaryPassword();
        const hash = await bcrypt.hash(temporaryPassword, env.BCRYPT_ROUNDS);
        await pool.query(`UPDATE coffeepos.users SET password_hash = $1, updated_at = now() WHERE id = $2::uuid`, [hash, id]);
        res.json({ temporary_password: temporaryPassword });
    }
    catch (err) {
        next(err);
    }
});
// ── GET /users ────────────────────────────────────────────────
usersRouter.get('/', requireOwner, async (req, res, next) => {
    try {
        const result = await pool.query(`SELECT
         u.id::text,
         u.name,
         u.email,
         u.role,
         u.branch_id::text,
         b.name AS branch_name,
         (u.pin IS NOT NULL AND btrim(u.pin) <> '') AS pin,
         u.is_active,
         u.created_at
       FROM coffeepos.users u
       LEFT JOIN coffeepos.branches b ON b.id = u.branch_id
       WHERE u.shop_id = $1::uuid AND u.role = 'cashier'
       ORDER BY u.created_at DESC`, [req.user.shop_id]);
        res.json(result.rows);
    }
    catch (err) {
        next(err);
    }
});
// ── POST /users ───────────────────────────────────────────────
usersRouter.post('/', requireOwner, validateBody(CreateUserSchema), async (req, res, next) => {
    try {
        const body = req.body;
        const shopId = req.user.shop_id;
        const emailCheck = await pool.query(`SELECT id FROM coffeepos.users WHERE email = $1`, [
            body.email
        ]);
        if (emailCheck.rowCount > 0) {
            throw new HttpError(409, 'EMAIL_TAKEN', 'Email sudah terdaftar');
        }
        const branchId = await resolveBranchId(shopId, body.branch_id);
        // Validate branch belongs to shop
        const branchCheck = await pool.query(`SELECT id FROM coffeepos.branches WHERE id = $1::uuid AND shop_id = $2::uuid`, [branchId, shopId]);
        if (branchCheck.rowCount === 0) {
            throw new HttpError(400, 'INVALID_BRANCH', 'Cabang tidak valid untuk toko Anda');
        }
        const passwordHash = await bcrypt.hash(body.password, env.BCRYPT_ROUNDS);
        const result = await pool.query(`INSERT INTO coffeepos.users (shop_id, email, password_hash, name, role, is_active, branch_id)
       VALUES ($1::uuid, $2, $3, $4, $5, true, $6::uuid)
       RETURNING id::text, name, email, role, branch_id::text,
         (pin IS NOT NULL AND btrim(pin) <> '') AS pin,
         is_active, created_at`, [shopId, body.email, passwordHash, body.name, body.role, branchId]);
        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        next(err);
    }
});
// ── PUT /users/:id ────────────────────────────────────────────
usersRouter.put('/:id', requireOwner, validateBody(UpdateUserSchema), async (req, res, next) => {
    try {
        const { id } = req.params;
        const body = req.body;
        const shopId = req.user.shop_id;
        const check = await pool.query(`SELECT id FROM coffeepos.users
       WHERE id = $1::uuid AND shop_id = $2::uuid AND role = 'cashier'`, [id, shopId]);
        if (check.rowCount === 0) {
            throw new HttpError(404, 'NOT_FOUND', 'Kasir tidak ditemukan di toko Anda');
        }
        const sets = [];
        const values = [];
        let p = 1;
        if (body.name !== undefined) {
            sets.push(`name = $${p++}`);
            values.push(body.name);
        }
        if (body.email !== undefined) {
            const emailCheck = await pool.query(`SELECT id FROM coffeepos.users WHERE email = $1 AND id != $2::uuid`, [body.email, id]);
            if (emailCheck.rowCount > 0) {
                throw new HttpError(409, 'EMAIL_TAKEN', 'Email sudah terdaftar');
            }
            sets.push(`email = $${p++}`);
            values.push(body.email);
        }
        if (body.is_active !== undefined) {
            sets.push(`is_active = $${p++}`);
            values.push(body.is_active);
        }
        if (body.branch_id !== undefined) {
            const branchCheck = await pool.query(`SELECT id FROM coffeepos.branches WHERE id = $1::uuid AND shop_id = $2::uuid`, [body.branch_id, shopId]);
            if (branchCheck.rowCount === 0) {
                throw new HttpError(400, 'INVALID_BRANCH', 'Cabang tidak valid untuk toko Anda');
            }
            sets.push(`branch_id = $${p++}::uuid`);
            values.push(body.branch_id);
        }
        if (sets.length === 0) {
            throw new HttpError(400, 'VALIDATION_ERROR', 'Tidak ada field yang diubah');
        }
        sets.push(`updated_at = now()`);
        values.push(id);
        values.push(shopId);
        const idIdx = p;
        const shopIdx = p + 1;
        const result = await pool.query(`UPDATE coffeepos.users
       SET ${sets.join(', ')}
       WHERE id = $${idIdx}::uuid AND shop_id = $${shopIdx}::uuid AND role = 'cashier'
       RETURNING id::text, name, email, role, branch_id::text,
         (pin IS NOT NULL AND btrim(pin) <> '') AS pin,
         is_active, created_at`, values);
        if (result.rowCount === 0) {
            throw new HttpError(404, 'NOT_FOUND', 'Kasir tidak ditemukan');
        }
        res.json(result.rows[0]);
    }
    catch (err) {
        next(err);
    }
});
// ── DELETE /users/:id (soft delete) ───────────────────────────
usersRouter.delete('/:id', requireOwner, async (req, res, next) => {
    try {
        const { id } = req.params;
        if (id === req.user.id) {
            throw new HttpError(400, 'VALIDATION_ERROR', 'Tidak dapat menonaktifkan akun sendiri');
        }
        const check = await pool.query(`SELECT id FROM coffeepos.users
       WHERE id = $1::uuid AND shop_id = $2::uuid AND role = 'cashier'`, [id, req.user.shop_id]);
        if (check.rowCount === 0) {
            throw new HttpError(404, 'NOT_FOUND', 'Kasir tidak ditemukan di toko Anda');
        }
        await pool.query(`UPDATE coffeepos.users SET is_active = false, updated_at = now()
       WHERE id = $1::uuid AND shop_id = $2::uuid`, [id, req.user.shop_id]);
        res.json({ success: true });
    }
    catch (err) {
        next(err);
    }
});
