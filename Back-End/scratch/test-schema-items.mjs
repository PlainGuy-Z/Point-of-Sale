import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    const resCols = await pool.query(`
      SELECT column_name, data_type, is_nullable FROM information_schema.columns 
      WHERE table_schema = 'coffeepos' AND table_name = 'transaction_items';
    `);
    console.log('Transaction_items columns:', resCols.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

run();
