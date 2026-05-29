import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    // Get latest transaction
    const { rows: tx } = await pool.query('SELECT * FROM coffeepos.transactions ORDER BY created_at DESC LIMIT 1');
    if (tx.length === 0) {
      console.log('No transactions found');
      return;
    }
    
    const latest = tx[0];
    console.log('Latest Transaction:', {
      id: latest.id,
      created_at: latest.created_at,
      grand_total: latest.grand_total,
      notes: latest.notes
    });
    
    // Get items for this transaction
    const { rows: items } = await pool.query('SELECT * FROM coffeepos.transaction_items WHERE transaction_id = $1', [latest.id]);
    console.log('Transaction Items:');
    console.table(items);
    
    // Get product catalog details for these products
    const productIds = items.map(i => i.product_id).filter(Boolean);
    if (productIds.length > 0) {
      const { rows: products } = await pool.query('SELECT id::text, name, price FROM coffeepos.products WHERE id = ANY($1::uuid[])', [productIds]);
      console.log('Product Catalog:');
      console.table(products);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
