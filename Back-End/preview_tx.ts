import { pool } from './src/db/pool.js';

async function run() {
  try {
    console.log('Fetching sample transactions...');
    const { rows } = await pool.query('SELECT id, grand_total, subtotal, tax, service_charge FROM coffeepos.transactions LIMIT 5');
    console.log(JSON.stringify(rows, null, 2));
    
    // Calculate total transactions
    const countRes = await pool.query('SELECT COUNT(*) as cnt FROM coffeepos.transactions');
    console.log(`Total transactions: ${countRes.rows[0].cnt}`);
    
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
