process.env.DATABASE_URL = 'postgresql://postgres.xojdeqcptcuenmagrcnp:mazlanevp140205@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?search_path=coffeepos';

const { Pool } = require('pg');

async function checkSchema() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

  try {
    const res = await pool.query(`
      SELECT column_name, ordinal_position, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_schema = 'coffeepos' AND table_name = 'transactions'
      ORDER BY ordinal_position;
    `);
    console.log('Columns of coffeepos.transactions:');
    res.rows.forEach((r) => {
      console.log(`${r.ordinal_position}. ${r.column_name} (${r.data_type}, nullable: ${r.is_nullable})`);
    });
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

checkSchema();
