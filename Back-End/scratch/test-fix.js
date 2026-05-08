import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function test() {
  try {
    console.log('Testing create product with name category...');
    const catName = 'Test Category ' + Date.now();
    
    // Simulate what ensureCategory does
    const insertCat = await pool.query(`INSERT INTO coffeepos.categories (name) VALUES ($1) RETURNING id::text, name`, [catName]);
    const { id: categoryId, name: categoryName } = insertCat.rows[0];
    console.log('Created category:', { categoryId, categoryName });

    const productName = 'Test Product ' + Date.now();
    const res = await pool.query(
      `INSERT INTO coffeepos.products (name, description, price, category, category_id, stock, min_stock, cost, image)
       VALUES ($1, $2, $3, $4, $5::uuid, $6, $7, $8, $9) RETURNING id::text`,
      [productName, 'Desc', 1000, categoryName, categoryId, 10, 5, 500, null]
    );
    console.log('Created product successfully:', res.rows[0].id);

    // Cleanup
    await pool.query(`DELETE FROM coffeepos.products WHERE id = $1::uuid`, [res.rows[0].id]);
    await pool.query(`DELETE FROM coffeepos.categories WHERE id = $1::uuid`, [categoryId]);
    console.log('Cleanup done.');

  } catch (err) {
    console.error('Test Failed:', err);
  } finally {
    await pool.end();
  }
}

test();
