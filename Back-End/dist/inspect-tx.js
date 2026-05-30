import 'dotenv/config';
import { pool } from './db/pool.js';
async function inspectTx() {
    try {
        const shopId = '4f0c118e-dbc3-405b-be1f-e8c56b33fd82';
        // Total transactions
        const { rows: totals } = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'voided' THEN 1 END) as voided,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
      FROM coffeepos.transactions 
      WHERE shop_id = $1
    `, [shopId]);
        console.log('--- Total Transactions ---');
        console.table(totals);
        // List transactions created today (in UTC and local time)
        const { rows: todayTx } = await pool.query(`
      SELECT 
        id, 
        created_at AT TIME ZONE 'UTC' as created_at_utc,
        created_at AT TIME ZONE 'Asia/Jakarta' as created_at_wib,
        grand_total,
        status
      FROM coffeepos.transactions
      WHERE shop_id = $1 
        AND created_at >= CURRENT_DATE
      ORDER BY created_at DESC
    `, [shopId]);
        console.log('\n--- Transactions Created Today (from CURRENT_DATE UTC) ---');
        console.table(todayTx);
        // Get the most recent 10 transactions with exact timestamp
        const { rows: recentTx } = await pool.query(`
      SELECT 
        id, 
        created_at,
        grand_total,
        status
      FROM coffeepos.transactions
      WHERE shop_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `, [shopId]);
        console.log('\n--- Recent 10 Transactions (Exact Timestamp) ---');
        console.table(recentTx.map(t => ({
            ...t,
            created_at_iso: new Date(t.created_at).toISOString()
        })));
    }
    catch (err) {
        console.error(err);
    }
    finally {
        await pool.end();
    }
}
inspectTx();
