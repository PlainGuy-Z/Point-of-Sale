process.env.DATABASE_URL = 'postgresql://postgres.xojdeqcptcuenmagrcnp:mazlanevp140205@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?search_path=coffeepos';

const { Pool } = require('pg');

async function testShopBranch() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  const shopId = '4f0c118e-dbc3-405b-be1f-e8c56b33fd82';

  try {
    const branches = await pool.query('SELECT * FROM coffeepos.branches WHERE shop_id = $1::uuid', [shopId]);
    console.log(`Branches for shop ${shopId}:`, branches.rows);

    const defaultBranch = await pool.query('SELECT * FROM coffeepos.branches WHERE shop_id = $1::uuid AND is_default = true', [shopId]);
    console.log(`Default branch for shop ${shopId}:`, defaultBranch.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

testShopBranch();
