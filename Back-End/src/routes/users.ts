import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { pool } from '../db/pool.js';
import { HttpError } from '../http/errors.js';
import { validateBody } from '../http/validate.js';
import { env } from '../env.js';
import { requireOwner } from '../middleware/requireRole.js';

export const usersRouter = Router();

// ── Schemas ──────────────────────────────────────────────────

const CreateUserSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().min(8),
  role: z.enum(['cashier'])
});

const UpdateUserSchema = z.object({
  name: z.string().trim().min(2).optional(),
  email: z.string().trim().email().optional(),
  is_active: z.boolean().optional()
});

// ── GET /users ──────────────────────────────────────────────

usersRouter.get('/', requireOwner, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id::text, name, email, role, is_active, created_at
       FROM coffeepos.users
       WHERE shop_id = $1::uuid AND role = 'cashier'
       ORDER BY created_at DESC`,
      [req.user!.shop_id]
    );

    res.json({ users: result.rows });
  } catch (err) {
    next(err);
  }
});

// ── POST /users ─────────────────────────────────────────────

usersRouter.post('/', requireOwner, validateBody(CreateUserSchema), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof CreateUserSchema>;

    // Check email uniqueness
    const emailCheck = await pool.query(
      `SELECT id FROM coffeepos.users WHERE email = $1`,
      [body.email]
    );
    if (emailCheck.rowCount! > 0) {
      throw new HttpError(409, 'EMAIL_TAKEN', 'Email is already registered');
    }

    const passwordHash = await bcrypt.hash(body.password, env.BCRYPT_ROUNDS);

    const result = await pool.query(
      `INSERT INTO coffeepos.users (shop_id, email, password_hash, name, role)
       VALUES ($1::uuid, $2, $3, $4, $5)
       RETURNING id::text, name, email, role, is_active, created_at`,
      [req.user!.shop_id, body.email, passwordHash, body.name, body.role]
    );

    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// ── PUT /users/:id ──────────────────────────────────────────

usersRouter.put('/:id', requireOwner, validateBody(UpdateUserSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body as z.infer<typeof UpdateUserSchema>;

    // Verify user belongs to same shop
    const check = await pool.query(
      `SELECT id FROM coffeepos.users WHERE id = $1::uuid AND shop_id = $2::uuid`,
      [id, req.user!.shop_id]
    );
    if (check.rowCount === 0) {
      throw new HttpError(404, 'NOT_FOUND', 'User not found in your shop');
    }

    // Build dynamic update
    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (body.name !== undefined) {
      sets.push(`name = $${idx++}`);
      params.push(body.name);
    }
    if (body.email !== undefined) {
      // Check email uniqueness if changing
      const emailCheck = await pool.query(
        `SELECT id FROM coffeepos.users WHERE email = $1 AND id != $2::uuid`,
        [body.email, id]
      );
      if (emailCheck.rowCount! > 0) {
        throw new HttpError(409, 'EMAIL_TAKEN', 'Email is already registered');
      }
      sets.push(`email = $${idx++}`);
      params.push(body.email);
    }
    if (body.is_active !== undefined) {
      sets.push(`is_active = $${idx++}`);
      params.push(body.is_active);
    }

    if (sets.length === 0) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'No fields to update');
    }

    sets.push(`updated_at = now()`);
    params.push(id);
    params.push(req.user!.shop_id);

    const result = await pool.query(
      `UPDATE coffeepos.users
       SET ${sets.join(', ')}
       WHERE id = $${idx++}::uuid AND shop_id = $${idx++}::uuid
       RETURNING id::text, name, email, role, is_active, created_at`,
      params
    );

    if (result.rowCount === 0) {
      throw new HttpError(404, 'NOT_FOUND', 'User not found');
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /users/:id (soft delete) ─────────────────────────

usersRouter.delete('/:id', requireOwner, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Cannot delete yourself
    if (id === req.user!.id) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Cannot deactivate your own account');
    }

    // Verify user belongs to same shop
    const check = await pool.query(
      `SELECT id FROM coffeepos.users WHERE id = $1::uuid AND shop_id = $2::uuid`,
      [id, req.user!.shop_id]
    );
    if (check.rowCount === 0) {
      throw new HttpError(404, 'NOT_FOUND', 'User not found in your shop');
    }

    // Soft delete — preserve transaction history
    await pool.query(
      `UPDATE coffeepos.users SET is_active = false, updated_at = now()
       WHERE id = $1::uuid AND shop_id = $2::uuid`,
      [id, req.user!.shop_id]
    );

    res.json({ message: 'User deactivated successfully' });
  } catch (err) {
    next(err);
  }
});
