process.env.DATABASE_URL = 'postgresql://postgres.xojdeqcptcuenmagrcnp:mazlanevp140205@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?search_path=coffeepos';
process.env.JWT_SECRET = 'your-super-secret-key-min-32-chars-change-me';
process.env.RESEND_API_KEY = 're_123456789';

const { Pool } = require('pg');
const { getDefaultBranchId } = require('./dist/routes/branches.js');

async function testTransaction() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  const client = await pool.connect();

  try {
    console.log('--- 1. Testing DB Transaction & Branch ID resolution ---');
    const prodRes = await client.query('SELECT id, shop_id, name, price, stock FROM coffeepos.products LIMIT 1');
    if (prodRes.rows.length === 0) {
      console.log('No products in DB');
      return;
    }
    const product = prodRes.rows[0];
    const shopId = product.shop_id;
    console.log('Shop ID:', shopId);
    console.log('Product:', product.name, product.id);

    const branchId = await getDefaultBranchId(shopId, client);
    console.log('Default Branch ID:', branchId);

    console.log('--- 2. Simulating INSERT INTO transactions inside SQL Transaction ---');
    await client.query('BEGIN');

    const txId = require('crypto').randomUUID();
    const tx = await client.query(
      `INSERT INTO coffeepos.transactions
         (id, subtotal, tax, service_charge, grand_total, discount_amount, customer_name, customer_id,
          table_number, notes, payment_method, cash_received, change_amount, order_type,
          status, shop_id, cashier_id, cashier_name, shift_id, branch_id)
       VALUES
         ($1::uuid, $2, $3, $4::int, $5, $6::int, $7, $8::uuid, $9, $10, $11, $12, $13, $14::text,
          'completed', $15::uuid, NULL, 'Test Cashier', NULL, $16::uuid)
       RETURNING id::text, grand_total, branch_id::text`,
      [
        txId, 10000, 0, 0, 10000, 0,
        'Test Customer', null, null, 'Test note', 'cash', 10000, 0, 'dine-in',
        shopId, branchId
      ]
    );

    console.log('Transaction inserted successfully! ID:', tx.rows[0].id, 'Branch:', tx.rows[0].branch_id);

    // Rollback so we don't pollute database with test transaction
    await client.query('ROLLBACK');
    console.log('ROLLBACK completed successfully! DB test PASSED!');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Error during transaction test:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

testTransaction();
