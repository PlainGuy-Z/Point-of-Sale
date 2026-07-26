process.env.DATABASE_URL = 'postgresql://postgres.xojdeqcptcuenmagrcnp:mazlanevp140205@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?search_path=coffeepos';
process.env.JWT_SECRET = 'your-super-secret-key-min-32-chars-change-me';
process.env.RESEND_API_KEY = 're_123456789';

const { Pool } = require('pg');
const { getDefaultBranchId } = require('./dist/routes/branches.js');

async function testGetDefault() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  const client = await pool.connect();

  try {
    const shopId = '4f0c118e-dbc3-405b-be1f-e8c56b33fd82';
    console.log('Testing getDefaultBranchId for shop:', shopId);

    const branchId = await getDefaultBranchId(shopId, client);
    console.log('Returned branchId:', branchId);

    const userRes = await client.query('SELECT id, name, email, role, shop_id, branch_id FROM coffeepos.users WHERE shop_id = $1::uuid', [shopId]);
    console.log('Users for shop:', userRes.rows);
  } catch (err) {
    console.error('Error in testGetDefault:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

testGetDefault();
