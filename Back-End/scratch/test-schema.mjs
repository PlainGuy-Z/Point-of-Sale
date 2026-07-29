import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    const resCols = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema = 'coffeepos' AND table_name = 'transactions'
        AND column_name IN ('created_offline', 'synced_at', 'sync_device_id', 'needs_review', 'review_reason');
    `);
    console.log('Columns found:', resCols.rows.map(r => r.column_name));

    const resConstraints = await pool.query(`
      SELECT constraint_name FROM information_schema.check_constraints
      WHERE constraint_name = 'products_stock_check' AND constraint_schema = 'coffeepos';
    `);
    console.log('Constraints found:', resConstraints.rows.map(r => r.constraint_name));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

run();
