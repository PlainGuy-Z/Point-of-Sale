const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/coffeepos' });

(async () => {
  try {
    const shopId = '00000000-0000-0000-0000-000000000000'; // dummy
    const TZ = 'Asia/Jakarta';
    const NON_VOID = "(COALESCE(status, '') <> 'voided')";
    
    // test todayRevenueSql
    await pool.query(`
      SELECT COALESCE(SUM(grand_total), 0)::bigint as today_revenue
      FROM coffeepos.transactions
      WHERE shop_id = $1::uuid
        AND (created_at AT TIME ZONE '${TZ}')::date = (NOW() AT TIME ZONE '${TZ}')::date
        AND ${NON_VOID}
    `, [shopId]);

    // test todayTopProductsSql
    await pool.query(`
      WITH today_tx AS (
        SELECT id FROM coffeepos.transactions
        WHERE shop_id = $1::uuid
          AND (created_at AT TIME ZONE '${TZ}')::date = (NOW() AT TIME ZONE '${TZ}')::date
          AND ${NON_VOID}
      )
      SELECT 
        COALESCE(p.id::text, 'manual') as id,
        COALESCE(p.name, i.name) as name,
        COALESCE(c.name, 'Uncategorized') as category,
        SUM(i.quantity)::int as quantity,
        SUM(i.quantity * i.price)::bigint as revenue,
        COALESCE(p.stock, 0)::int as stock,
        COALESCE(p.min_stock, 5)::int as min_stock,
        p.image,
        COALESCE(p.price, i.price)::bigint as price,
        COALESCE(p.cost, 0)::bigint as cost
      FROM coffeepos.transaction_items i
      JOIN today_tx ON today_tx.id = i.transaction_id
      LEFT JOIN coffeepos.products p ON p.id = i.product_id
      LEFT JOIN coffeepos.categories c ON p.category_id = c.id
      GROUP BY COALESCE(p.id::text, 'manual'), COALESCE(p.name, i.name), c.name, p.stock, p.min_stock, p.image, COALESCE(p.price, i.price), p.cost
      ORDER BY quantity DESC
      LIMIT 5;
    `, [shopId]);
    console.log('SUCCESS');
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await pool.end();
  }
})();
