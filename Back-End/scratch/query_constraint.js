import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  const res = await pool.query(`
    SELECT pg_get_constraintdef(oid) AS def
    FROM pg_constraint
    WHERE conname = 'transactions_totals_consistent'
  `);
  console.log(res.rows[0]);
  process.exit(0);
}

run();
