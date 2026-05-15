import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    await pool.query(`
      ALTER TABLE coffeepos.transactions
      DROP CONSTRAINT transactions_totals_consistent;
    `);
    
    await pool.query(`
      ALTER TABLE coffeepos.transactions
      ADD CONSTRAINT transactions_totals_consistent 
      CHECK (grand_total = subtotal + tax + COALESCE(service_charge, 0) - COALESCE(discount_amount, 0));
    `);
    
    console.log('Constraint updated successfully');
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
