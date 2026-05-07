import { Router } from 'express';
import { pool } from '../db/pool.js';
export const appRouter = Router();
// GET /app/state
// Returns a snapshot for dashboard hydration (products, transactions, basic stats).
appRouter.get('/state', async (_req, res, next) => {
    try {
        const [products, transactions] = await Promise.all([
            pool.query(`SELECT id::text, name, description, price, category, stock, cost, created_at, updated_at
         FROM coffeepos.products
         ORDER BY name ASC`),
            pool.query(`SELECT id::text, subtotal, tax, grand_total, customer_name, table_number, payment_method, status, created_at
         FROM coffeepos.transactions
         ORDER BY created_at DESC
         LIMIT 200`)
        ]);
        // Minimal stats placeholder (can expand later)
        const stats = {
            productsCount: products.rowCount,
            recentTransactionsCount: transactions.rowCount
        };
        res.json({
            products: products.rows,
            transactions: transactions.rows,
            stats
        });
    }
    catch (err) {
        next(err);
    }
});
