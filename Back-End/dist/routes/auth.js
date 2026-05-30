import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from '../db/pool.js';
import { withTransaction } from '../db/with-transaction.js';
import { HttpError } from '../http/errors.js';
import { validateBody } from '../http/validate.js';
import { env } from '../env.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireOwner } from '../middleware/requireRole.js';
import { sendPasswordResetEmail } from '../services/email.js';
// [FIX-9] Rate limiting to prevent brute-force attacks
import rateLimit from 'express-rate-limit';
export const authRouter = Router();
// [FIX-9] Rate limiters for auth endpoints
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // max 10 attempts per 15 min per IP
    message: {
        error: {
            code: 'RATE_LIMITED',
            message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.'
        }
    },
    standardHeaders: true,
    legacyHeaders: false,
});
const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 3, // max 3 requests per minute per IP
    message: {
        error: {
            code: 'RATE_LIMITED',
            message: 'Terlalu banyak permintaan reset password. Tunggu 1 menit.'
        }
    },
    standardHeaders: true,
    legacyHeaders: false,
});
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
    password: z.string().min(8),
    licenseToken: z.string().trim().min(1)
});
const LoginSchema = z.object({
    email: z.string().trim().email(),
    password: z.string().min(1)
});
const ChangePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8)
});
const UpdateMeSchema = z
    .object({
    name: z.string().trim().min(2).optional(),
    shop_name: z.string().trim().min(2).optional()
})
    .refine((d) => d.name !== undefined || d.shop_name !== undefined, {
    message: 'Minimal satu field diperlukan'
});
const ResetCashierPasswordSchema = z.object({
    cashierId: z.string().uuid(),
    newPassword: z.string().min(8)
});
const ForgotPasswordSchema = z.object({
    email: z.string().trim().email()
});
const ResetPasswordSchema = z.object({
    token: z.string().min(1),
    password: z.string().min(8)
});
function signToken(payload) {
    return jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN
    });
}
function setCookie(res, token) {
    const isProd = env.NODE_ENV === 'production';
    res.cookie('token', token, {
        httpOnly: true,
        secure: isProd, // true di production (HTTPS wajib)
        sameSite: 'none', // Cross-origin frontend requires SameSite=None in dev and prod
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
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
        // Check Token Validation
        const tokenCheck = await pool.query(`SELECT id, is_used FROM coffeepos.registration_tokens WHERE token = $1`, [body.licenseToken]);
        if (tokenCheck.rowCount === 0) {
            throw new HttpError(400, 'INVALID_TOKEN', 'License Token tidak valid atau tidak ditemukan');
        }
        if (tokenCheck.rows[0].is_used) {
            throw new HttpError(400, 'TOKEN_USED', 'License Token sudah digunakan');
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
            // Create default shop settings for the new shop with tax disabled
            await client.query(`INSERT INTO coffeepos.shop_settings (shop_id, tax_enabled)
         VALUES ($1::uuid, $2)`, [shop.id, false]);
            // Mark token as used
            await client.query(`UPDATE coffeepos.registration_tokens 
         SET is_used = true, used_at = now() 
         WHERE token = $1`, [body.licenseToken]);
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
                pin: false,
                shop: {
                    id: result.shop.id,
                    name: result.shop.name,
                    slug: result.shop.slug
                }
            },
            token: token
        });
    }
    catch (err) {
        next(err);
    }
});
// ── POST /auth/verify-token ───────────────────────────────
const VerifyTokenSchema = z.object({
    token: z.string().trim().min(1)
});
authRouter.post('/verify-token', validateBody(VerifyTokenSchema), async (req, res, next) => {
    try {
        const { token } = req.body;
        const tokenCheck = await pool.query(`SELECT id, is_used FROM coffeepos.registration_tokens WHERE token = $1`, [token]);
        if (tokenCheck.rowCount === 0) {
            return res.status(400).json({ valid: false, message: 'License Token tidak valid atau tidak ditemukan' });
        }
        if (tokenCheck.rows[0].is_used) {
            return res.status(400).json({ valid: false, message: 'License Token sudah digunakan' });
        }
        res.json({ valid: true, message: 'Token tersedia' });
    }
    catch (err) {
        next(err);
    }
});
// ── POST /auth/login ────────────────────────────────────────
// [FIX-9] Rate limiting applied to login route
authRouter.post('/login', loginLimiter, validateBody(LoginSchema), async (req, res, next) => {
    try {
        const body = req.body;
        // Find user + shop
        const result = await pool.query(`SELECT u.id::text, u.name, u.email, u.role, u.password_hash, u.is_active,
              u.shop_id::text,
              (u.pin IS NOT NULL AND btrim(u.pin) <> '') AS pin,
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
                pin: Boolean(user.pin),
                shop: {
                    id: user.shop_id,
                    name: user.shop_name,
                    slug: user.shop_slug
                }
            },
            token: token
        });
    }
    catch (err) {
        next(err);
    }
});
authRouter.post('/logout', (_req, res) => {
    const isProd = env.NODE_ENV === 'production';
    // Clear the cookie with all possible variations to ensure it's removed
    const clearOptions = {
        httpOnly: true,
        secure: isProd,
        sameSite: 'none',
        path: '/',
    };
    res.clearCookie('token', clearOptions);
    // Explicitly set an expired cookie for backup
    res.cookie('token', '', {
        ...clearOptions,
        expires: new Date(0),
        maxAge: 0
    });
    res.json({ message: 'Logged out successfully' });
});
// ── GET /auth/me ────────────────────────────────────────────
authRouter.get('/me', authenticateToken, async (req, res, next) => {
    try {
        // [FIX] Prevent browser caching of /me endpoint to ensure accurate session state after logout
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        const result = await pool.query(`SELECT u.id::text, u.name, u.email, u.role, u.shop_id::text,
              (u.pin IS NOT NULL AND btrim(u.pin) <> '') AS pin,
              s.id::text AS shop_id_ref, s.name AS shop_name, s.slug AS shop_slug,
              COALESCE(ss.logo_url, s.logo_url) AS logo_url
       FROM coffeepos.users u
       JOIN coffeepos.shops s ON s.id = u.shop_id
       LEFT JOIN coffeepos.shop_settings ss ON ss.shop_id = u.shop_id
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
                pin: Boolean(user.pin),
                shop: {
                    id: user.shop_id,
                    name: user.shop_name,
                    slug: user.shop_slug,
                    logo_url: user.logo_url
                }
            }
        });
    }
    catch (err) {
        next(err);
    }
});
// ── PUT /auth/me ─────────────────────────────────────────────
authRouter.put('/me', authenticateToken, validateBody(UpdateMeSchema), async (req, res, next) => {
    try {
        const body = req.body;
        if (body.shop_name !== undefined && req.user.role !== 'owner') {
            throw new HttpError(403, 'FORBIDDEN', 'Hanya pemilik toko yang dapat mengubah nama toko');
        }
        await withTransaction(async (client) => {
            if (body.name !== undefined) {
                await client.query(`UPDATE coffeepos.users SET name = $1, updated_at = now() WHERE id = $2::uuid`, [body.name, req.user.id]);
            }
            if (body.shop_name !== undefined) {
                let slug = body.shop_name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                let isUnique = false;
                let count = 0;
                while (!isUnique) {
                    const currentSlug = count === 0 ? slug : `${slug}-${count}`;
                    const check = await client.query('SELECT id FROM coffeepos.shops WHERE slug = $1 AND id != $2::uuid', [currentSlug, req.user.shop_id]);
                    if (check.rowCount === 0) {
                        slug = currentSlug;
                        isUnique = true;
                    }
                    else {
                        count++;
                    }
                }
                await client.query(`UPDATE coffeepos.shops SET name = $1, slug = $2 WHERE id = $3::uuid`, [body.shop_name, slug, req.user.shop_id]);
            }
        });
        const result = await pool.query(`SELECT u.id::text, u.name, u.email, u.role, u.shop_id::text,
              (u.pin IS NOT NULL AND btrim(u.pin) <> '') AS pin,
              s.id::text AS shop_id_ref, s.name AS shop_name, s.slug AS shop_slug,
              COALESCE(ss.logo_url, s.logo_url) AS logo_url
       FROM coffeepos.users u
       JOIN coffeepos.shops s ON s.id = u.shop_id
       LEFT JOIN coffeepos.shop_settings ss ON ss.shop_id = u.shop_id
       WHERE u.id = $1::uuid`, [req.user.id]);
        const row = result.rows[0];
        res.json({
            user: {
                id: row.id,
                name: row.name,
                email: row.email,
                role: row.role,
                shop_id: row.shop_id,
                pin: Boolean(row.pin),
                shop: {
                    id: row.shop_id,
                    name: row.shop_name,
                    slug: row.shop_slug,
                    logo_url: row.logo_url
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
// ── POST /auth/forgot-password ──────────────────────────────
// [FIX-9] Rate limiting applied to forgot-password route
authRouter.post('/forgot-password', forgotPasswordLimiter, validateBody(ForgotPasswordSchema), async (req, res, next) => {
    try {
        const { email } = req.body;
        const result = await pool.query(`SELECT id, name, email FROM coffeepos.users WHERE email = $1`, [email]);
        if (result.rowCount === 0) {
            return res.status(200).json({ message: 'Jika email terdaftar, link reset telah dikirim.' });
        }
        const user = result.rows[0];
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await pool.query(`UPDATE coffeepos.users SET reset_token = $1, reset_token_expires_at = $2 WHERE id = $3::uuid`, [tokenHash, expiresAt, user.id]);
        const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;
        try {
            await sendPasswordResetEmail(user.email, user.name, resetUrl);
        }
        catch (err) {
            console.error('[forgot-password]', err);
        }
        res.status(200).json({ message: 'Jika email terdaftar, link reset telah dikirim.' });
    }
    catch (err) {
        next(err);
    }
});
// ── POST /auth/reset-password ───────────────────────────────
authRouter.post('/reset-password', validateBody(ResetPasswordSchema), async (req, res, next) => {
    try {
        const { token, password } = req.body;
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const result = await pool.query(`SELECT id, reset_token_expires_at FROM coffeepos.users WHERE reset_token = $1`, [tokenHash]);
        if (result.rowCount === 0) {
            throw new HttpError(400, 'INVALID_TOKEN', 'Link reset tidak valid atau sudah digunakan.');
        }
        const user = result.rows[0];
        if (new Date() > new Date(user.reset_token_expires_at)) {
            await pool.query(`UPDATE coffeepos.users SET reset_token = NULL, reset_token_expires_at = NULL WHERE id = $1::uuid`, [user.id]);
            throw new HttpError(400, 'TOKEN_EXPIRED', 'Link reset sudah kedaluwarsa. Minta link baru.');
        }
        const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
        await pool.query(`UPDATE coffeepos.users SET password_hash = $1, reset_token = NULL, reset_token_expires_at = NULL WHERE id = $2::uuid`, [passwordHash, user.id]);
        res.status(200).json({ message: 'Password berhasil diubah. Silakan login.' });
    }
    catch (err) {
        next(err);
    }
});
