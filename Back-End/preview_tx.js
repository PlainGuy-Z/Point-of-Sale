import pg from 'pg';
import { config } from 'dotenv';
config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const { rows } = await pool.query(`
      SELECT COUNT(*) as count, SUM(grand_total) as total
      FROM coffeepos.transactions
      WHERE COALESCE(status, '') <> 'voided'
    `);
    console.log(JSON.stringify(rows, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
