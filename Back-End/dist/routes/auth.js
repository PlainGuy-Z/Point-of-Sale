import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool.js';
import { withTransaction } from '../db/with-transaction.js';
import { HttpError } from '../http/errors.js';
import { validateBody } from '../http/validate.js';
import { env } from '../env.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireOwner } from '../middleware/requireRole.js';
export const authRouter = Router();
// ── Schemas ──────────────────────────────────────────────────
const RegisterSchema = z.object({
    shopName: z.string().trim().min(2),
    shopSlug: z
        .string()
        .trim()
        .min(2)
        .max(50)
        .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with dashes'),
    ownerName: z.string().trim().min(2),
    email: z.string().trim().email(),
    password: z.string().min(8)
});
const LoginSchema = z.object({
    email: z.string().trim().email(),
    password: z.string().min(1)
});
const ChangePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8)
});
const ResetCashierPasswordSchema = z.object({
    cashierId: z.string().uuid(),
    newPassword: z.string().min(8)
});
function signToken(payload) {
    return jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN
    });
}
function setCookie(res, token) {
    res.cookie('token', token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/'
    });
}
// ── POST /auth/register ─────────────────────────────────────
authRouter.post('/register', validateBody(RegisterSchema), async (req, res, next) => {
    try {
        const body = req.body;
        // Check email uniqueness
        const emailCheck = await pool.query(`SELECT id FROM coffeepos.users WHERE email = $1`, [body.email]);
        if (emailCheck.rowCount > 0) {
            throw new HttpError(409, 'EMAIL_TAKEN', 'Email is already registered');
        }
        // Check slug uniqueness
        const slugCheck = await pool.query(`SELECT id FROM coffeepos.shops WHERE slug = $1`, [body.shopSlug]);
        if (slugCheck.rowCount > 0) {
            throw new HttpError(409, 'SLUG_TAKEN', 'Shop slug is already taken');
        }
        // Hash password
        const passwordHash = await bcrypt.hash(body.password, env.BCRYPT_ROUNDS);
        // Create shop + owner in transaction
        const result = await withTransaction(async (client) => {
            const shopResult = await client.query(`INSERT INTO coffeepos.shops (name, slug)
         VALUES ($1, $2)
         RETURNING id::text, name, slug`, [body.shopName, body.shopSlug]);
            const shop = shopResult.rows[0];
            const userResult = await client.query(`INSERT INTO coffeepos.users (shop_id, email, password_hash, name, role)
         VALUES ($1::uuid, $2, $3, $4, 'owner')
         RETURNING id::text, name, email, role, shop_id::text`, [shop.id, body.email, passwordHash, body.ownerName]);
            const user = userResult.rows[0];
            return { user, shop };
        });
        // Generate JWT
        const token = signToken({
            sub: result.user.id,
            shop_id: result.user.shop_id,
            role: result.user.role,
            name: result.user.name,
            email: result.user.email
        });
        setCookie(res, token);
        res.status(201).json({
            user: {
                id: result.user.id,
                name: result.user.name,
                email: result.user.email,
                role: result.user.role,
                shop_id: result.user.shop_id,
                shop: {
                    id: result.shop.id,
                    name: result.shop.name,
                    slug: result.shop.slug
                }
            }
        });
    }
    catch (err) {
        next(err);
    }
});
// ── POST /auth/login ────────────────────────────────────────
authRouter.post('/login', validateBody(LoginSchema), async (req, res, next) => {
    try {
        const body = req.body;
        // Find user + shop
        const result = await pool.query(`SELECT u.id::text, u.name, u.email, u.role, u.password_hash, u.is_active,
              u.shop_id::text,
              s.id::text AS shop_id_ref, s.name AS shop_name, s.slug AS shop_slug
       FROM coffeepos.users u
       JOIN coffeepos.shops s ON s.id = u.shop_id
       WHERE u.email = $1`, [body.email]);
        if (result.rowCount === 0 || !result.rows[0].is_active) {
            throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
        }
        const user = result.rows[0];
        // Verify password
        const valid = await bcrypt.compare(body.password, user.password_hash);
        if (!valid) {
            throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
        }
        // Generate JWT
        const token = signToken({
            sub: user.id,
            shop_id: user.shop_id,
            role: user.role,
            name: user.name,
            email: user.email
        });
        setCookie(res, token);
        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                shop_id: user.shop_id,
                shop: {
                    id: user.shop_id,
                    name: user.shop_name,
                    slug: user.shop_slug
                }
            }
        });
    }
    catch (err) {
        next(err);
    }
});
// ── POST /auth/logout ───────────────────────────────────────
authRouter.post('/logout', (_req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
    });
    res.json({ message: 'Logged out successfully' });
});
// ── GET /auth/me ────────────────────────────────────────────
authRouter.get('/me', authenticateToken, async (req, res, next) => {
    try {
        const result = await pool.query(`SELECT u.id::text, u.name, u.email, u.role, u.shop_id::text,
              s.id::text AS shop_id_ref, s.name AS shop_name, s.slug AS shop_slug
       FROM coffeepos.users u
       JOIN coffeepos.shops s ON s.id = u.shop_id
       WHERE u.id = $1::uuid`, [req.user.id]);
        if (result.rowCount === 0) {
            throw new HttpError(401, 'UNAUTHORIZED', 'User not found');
        }
        const user = result.rows[0];
        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                shop_id: user.shop_id,
                shop: {
                    id: user.shop_id,
                    name: user.shop_name,
                    slug: user.shop_slug
                }
            }
        });
    }
    catch (err) {
        next(err);
    }
});
// ── POST /auth/change-password ──────────────────────────────
authRouter.post('/change-password', authenticateToken, validateBody(ChangePasswordSchema), async (req, res, next) => {
    try {
        const body = req.body;
        // Get current password hash
        const result = await pool.query(`SELECT password_hash FROM coffeepos.users WHERE id = $1::uuid`, [req.user.id]);
        if (result.rowCount === 0) {
            throw new HttpError(401, 'UNAUTHORIZED', 'User not found');
        }
        const valid = await bcrypt.compare(body.currentPassword, result.rows[0].password_hash);
        if (!valid) {
            throw new HttpError(401, 'INVALID_CREDENTIALS', 'Current password is incorrect');
        }
        const newHash = await bcrypt.hash(body.newPassword, env.BCRYPT_ROUNDS);
        await pool.query(`UPDATE coffeepos.users SET password_hash = $1, updated_at = now() WHERE id = $2::uuid`, [newHash, req.user.id]);
        res.json({ message: 'Password changed successfully' });
    }
    catch (err) {
        next(err);
    }
});
// ── POST /auth/reset-cashier-password ───────────────────────
authRouter.post('/reset-cashier-password', authenticateToken, requireOwner, validateBody(ResetCashierPasswordSchema), async (req, res, next) => {
    try {
        const body = req.body;
        // Verify cashier belongs to same shop
        const cashier = await pool.query(`SELECT id, shop_id::text FROM coffeepos.users
         WHERE id = $1::uuid AND shop_id = $2::uuid`, [body.cashierId, req.user.shop_id]);
        if (cashier.rowCount === 0) {
            throw new HttpError(404, 'NOT_FOUND', 'Cashier not found in your shop');
        }
        const newHash = await bcrypt.hash(body.newPassword, env.BCRYPT_ROUNDS);
        await pool.query(`UPDATE coffeepos.users SET password_hash = $1, updated_at = now() WHERE id = $2::uuid`, [newHash, body.cashierId]);
        res.json({ message: 'Password reset successfully' });
    }
    catch (err) {
        next(err);
    }
});
