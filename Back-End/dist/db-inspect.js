import 'dotenv/config';
import { pool } from './db/pool.js';
async function inspect() {
    try {
        console.log('--- Inspecting Database ---');
        // 1. Shops
        const { rows: shops } = await pool.query('SELECT id, name FROM coffeepos.shops');
        console.log('\n--- Shops ---');
        console.table(shops);
        // 2. Users
        const { rows: users } = await pool.query('SELECT id, name, email, shop_id, role FROM coffeepos.users');
        console.log('\n--- Users ---');
        console.table(users);
        // 3. Transactions Count by Shop
        const { rows: txCounts } = await pool.query(`
      SELECT 
        shop_id, 
        status, 
        COUNT(*) as count, 
        MIN(created_at) as first_tx, 
        MAX(created_at) as last_tx 
      FROM coffeepos.transactions 
      GROUP BY shop_id, status
    `);
        console.log('\n--- Transactions Summary ---');
        console.table(txCounts);
        // 4. Products Count by Shop
        const { rows: prodCounts } = await pool.query('SELECT shop_id, COUNT(*), MIN(created_at) as first_prod FROM coffeepos.products GROUP BY shop_id');
        console.log('\n--- Products Summary ---');
        console.table(prodCounts);
        // 5. Recent 10 Transactions
        const { rows: recentTx } = await pool.query(`
      SELECT 
        id, 
        shop_id, 
        cashier_name, 
        grand_total, 
        status, 
        created_at 
      FROM coffeepos.transactions 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
        console.log('\n--- Recent 10 Transactions ---');
        console.table(recentTx);
    }
    catch (err) {
        console.error('Inspection failed:', err);
    }
    finally {
        await pool.end();
    }
}
inspect();
