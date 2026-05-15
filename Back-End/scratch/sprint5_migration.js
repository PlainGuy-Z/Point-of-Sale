import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    await pool.query(`
      ALTER TABLE coffeepos.shop_settings 
      ADD COLUMN IF NOT EXISTS currency_format TEXT DEFAULT 'Rp' CHECK (currency_format IN ('Rp', 'IDR')),
      ADD COLUMN IF NOT EXISTS date_format TEXT DEFAULT 'DD/MM/YYYY' CHECK (date_format IN ('DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD')),
      ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'id' CHECK (language IN ('id', 'en'));
    `);
    console.log('Migration for Sprint S-5 completed successfully');
  } catch (e) {
    console.error('Migration failed:', e);
  } finally {
    process.exit(0);
  }
}

run();
