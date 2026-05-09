import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { HttpError } from '../http/errors.js';
import { validateBody } from '../http/validate.js';
import { requireRole } from '../middleware/requireRole.js';
export const shiftsRouter = Router();
const OpenShiftSchema = z.object({
    opening_cash: z.number().int().min(0)
});
const CloseShiftSchema = z.object({
    closing_cash: z.number().int().min(0),
    notes: z.string().optional()
});
// POST /shifts/open
shiftsRouter.post('/open', requireRole('cashier'), validateBody(OpenShiftSchema), async (req, res, next) => {
    try {
        const { shop_id, id: cashier_id, name: cashier_name } = req.user;
        const { opening_cash } = req.body;
        // Check if there is already an active shift for this cashier
        const { rows: activeShifts } = await pool.query(`SELECT id FROM coffeepos.shifts 
       WHERE cashier_id = $1 AND status = 'open'`, [cashier_id]);
        if (activeShifts.length > 0) {
            throw new HttpError(400, 'SHIFT_ALREADY_ACTIVE', 'Shift sudah aktif');
        }
        // Create new shift
        const { rows: newShift } = await pool.query(`INSERT INTO coffeepos.shifts 
        (shop_id, cashier_id, cashier_name, opening_cash, status)
       VALUES ($1, $2, $3, $4, 'open')
       RETURNING *`, [shop_id, cashier_id, cashier_name, opening_cash]);
        res.status(201).json(newShift[0]);
    }
    catch (err) {
        next(err);
    }
});
// POST /shifts/close
shiftsRouter.post('/close', requireRole('cashier'), validateBody(CloseShiftSchema), async (req, res, next) => {
    try {
        const { id: cashier_id } = req.user;
        const { closing_cash, notes } = req.body;
        // Get active shift
        const { rows: activeShifts } = await pool.query(`SELECT * FROM coffeepos.shifts 
       WHERE cashier_id = $1 AND status = 'open'`, [cashier_id]);
        if (activeShifts.length === 0) {
            throw new HttpError(404, 'NO_ACTIVE_SHIFT', 'Tidak ada shift yang aktif');
        }
        const shift = activeShifts[0];
        // Calculate expected cash from transactions
        // Only cash payment methods count towards expected_cash
        const { rows: totals } = await pool.query(`SELECT 
        COALESCE(SUM(total), 0) as total_sales,
        COUNT(*) as total_transactions,
        COALESCE(SUM(CASE WHEN LOWER(payment_method) LIKE '%cash%' OR LOWER(payment_method) LIKE '%tunai%' THEN total ELSE 0 END), 0) as expected_cash_add
       FROM coffeepos.transactions
       WHERE shift_id = $1`, [shift.id]);
        const totalSales = Number(totals[0].total_sales);
        const totalTransactions = Number(totals[0].total_transactions);
        const expectedCashAdd = Number(totals[0].expected_cash_add);
        const expectedCash = shift.opening_cash + expectedCashAdd;
        const cashDifference = closing_cash - expectedCash;
        // Update shift
        const { rows: updatedShift } = await pool.query(`UPDATE coffeepos.shifts 
       SET 
         status = 'closed',
         closed_at = now(),
         closing_cash = $1,
         expected_cash = $2,
         cash_difference = $3,
         total_sales = $4,
         total_transactions = $5,
         notes = $6
       WHERE id = $7
       RETURNING *`, [closing_cash, expectedCash, cashDifference, totalSales, totalTransactions, notes, shift.id]);
        res.json(updatedShift[0]);
    }
    catch (err) {
        next(err);
    }
});
// GET /shifts/active
shiftsRouter.get('/active', requireRole('cashier'), async (req, res, next) => {
    try {
        const { id: cashier_id } = req.user;
        const { rows } = await pool.query(`SELECT * FROM coffeepos.shifts 
       WHERE cashier_id = $1 AND status = 'open'
       ORDER BY opened_at DESC
       LIMIT 1`, [cashier_id]);
        if (rows.length === 0) {
            return res.json(null);
        }
        // Get current running totals for display
        const shift = rows[0];
        const { rows: totals } = await pool.query(`SELECT 
        COALESCE(SUM(total), 0) as total_sales,
        COUNT(*) as total_transactions,
        COALESCE(SUM(CASE WHEN LOWER(payment_method) LIKE '%cash%' OR LOWER(payment_method) LIKE '%tunai%' THEN total ELSE 0 END), 0) as expected_cash_add
       FROM coffeepos.transactions
       WHERE shift_id = $1`, [shift.id]);
        shift.current_total_sales = Number(totals[0].total_sales);
        shift.current_total_transactions = Number(totals[0].total_transactions);
        shift.current_expected_cash = shift.opening_cash + Number(totals[0].expected_cash_add);
        res.json(shift);
    }
    catch (err) {
        next(err);
    }
});
// GET /shifts
shiftsRouter.get('/', requireRole('owner'), async (req, res, next) => {
    try {
        const { shop_id } = req.user;
        const { page = '1', limit = '20', cashier_id, date_from, date_to } = req.query;
        const limitNum = parseInt(limit, 10) || 20;
        const offset = (parseInt(page, 10) - 1) * limitNum || 0;
        const params = [shop_id];
        let whereClause = `WHERE shop_id = $1`;
        let paramIndex = 2;
        if (cashier_id) {
            whereClause += ` AND cashier_id = $${paramIndex}`;
            params.push(cashier_id);
            paramIndex++;
        }
        if (date_from) {
            whereClause += ` AND opened_at >= $${paramIndex}`;
            params.push(date_from);
            paramIndex++;
        }
        if (date_to) {
            whereClause += ` AND opened_at <= $${paramIndex}`;
            params.push(date_to);
            paramIndex++;
        }
        const { rows: shifts } = await pool.query(`SELECT * FROM coffeepos.shifts 
       ${whereClause} 
       ORDER BY opened_at DESC 
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, [...params, limitNum, offset]);
        const { rows: totalCount } = await pool.query(`SELECT COUNT(*) FROM coffeepos.shifts ${whereClause}`, params);
        res.json({
            data: shifts,
            pagination: {
                total: parseInt(totalCount[0].count, 10),
                page: parseInt(page, 10) || 1,
                limit: limitNum
            }
        });
    }
    catch (err) {
        next(err);
    }
});
// GET /shifts/:id
shiftsRouter.get('/:id', requireRole('owner'), async (req, res, next) => {
    try {
        const { shop_id } = req.user;
        const shiftId = req.params.id;
        const { rows: shifts } = await pool.query(`SELECT * FROM coffeepos.shifts 
       WHERE id = $1 AND shop_id = $2`, [shiftId, shop_id]);
        if (shifts.length === 0) {
            throw new HttpError(404, 'NOT_FOUND', 'Shift tidak ditemukan');
        }
        const { rows: transactions } = await pool.query(`SELECT * FROM coffeepos.transactions 
       WHERE shift_id = $1 
       ORDER BY date DESC`, [shiftId]);
        res.json({
            ...shifts[0],
            transactions
        });
    }
    catch (err) {
        next(err);
    }
});
