import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  const shopIdRes = await pool.query('SELECT shop_id FROM coffeepos.transactions LIMIT 1');
  if (shopIdRes.rows.length === 0) {
    console.log("No transactions in db");
    return;
  }
  const shopId = shopIdRes.rows[0].shop_id;
  const from = '2020-01-01';
  const to = '2030-01-01';
  const TZ = 'Asia/Jakarta';
  const NON_VOID = `(COALESCE(status, '') <> 'voided')`;

  console.log(`Validating Business Insights from ${from} to ${to}...`);

  try {
    // 1. Summary
    const summarySql = `
      WITH tx AS (
        SELECT id, grand_total, created_at
        FROM coffeepos.transactions
        WHERE shop_id = $1::uuid
          AND (created_at AT TIME ZONE '${TZ}')::date >= $2::date
          AND (created_at AT TIME ZONE '${TZ}')::date <= $3::date
          AND ${NON_VOID}
      ),
      items AS (
        SELECT 
          i.transaction_id, 
          i.quantity, 
          COALESCE(p.cost, 0) as cost
        FROM coffeepos.transaction_items i
        JOIN tx ON tx.id = i.transaction_id
        LEFT JOIN coffeepos.products p ON p.id = i.product_id
      )
      SELECT 
        COUNT(DISTINCT tx.id)::int as transaction_count,
        COALESCE(SUM(tx.grand_total), 0)::bigint as revenue,
        COALESCE(SUM(items.quantity * items.cost), 0)::bigint as cogs
      FROM tx
      LEFT JOIN items ON tx.id = items.transaction_id;
    `;
    const summaryRes = await pool.query(summarySql, [shopId, from, to]);
    console.log("=== SUMMARY ===");
    console.log(summaryRes.rows[0]);

    // 2. Trend Data
    const trendSql = `
      SELECT 
        TO_CHAR((created_at AT TIME ZONE '${TZ}')::date, 'YYYY-MM-DD') as date,
        SUM(grand_total)::bigint as revenue
      FROM coffeepos.transactions
      WHERE shop_id = $1::uuid
        AND (created_at AT TIME ZONE '${TZ}')::date >= $2::date
        AND (created_at AT TIME ZONE '${TZ}')::date <= $3::date
        AND ${NON_VOID}
      GROUP BY date
      ORDER BY date ASC;
    `;
    const trendRes = await pool.query(trendSql, [shopId, from, to]);
    console.log("\n=== TREND DATA (First 3) ===");
    console.log(trendRes.rows.slice(0, 3));

    // 3. Top Products
    const topProductsSql = `
      WITH tx AS (
        SELECT id FROM coffeepos.transactions
        WHERE shop_id = $1::uuid
          AND (created_at AT TIME ZONE '${TZ}')::date >= $2::date
          AND (created_at AT TIME ZONE '${TZ}')::date <= $3::date
          AND ${NON_VOID}
      )
      SELECT 
        COALESCE(p.name, i.name) as name,
        SUM(i.quantity)::int as qty,
        SUM(i.quantity * i.price)::bigint as revenue
      FROM coffeepos.transaction_items i
      JOIN tx ON tx.id = i.transaction_id
      LEFT JOIN coffeepos.products p ON p.id = i.product_id
      GROUP BY COALESCE(p.name, i.name)
      ORDER BY qty DESC
      LIMIT 5;
    `;
    const topProdRes = await pool.query(topProductsSql, [shopId, from, to]);
    console.log("\n=== TOP PRODUCTS ===");
    console.log(topProdRes.rows);

    // 4. Category Performance
    const categorySql = `
      WITH tx AS (
        SELECT id FROM coffeepos.transactions
        WHERE shop_id = $1::uuid
          AND (created_at AT TIME ZONE '${TZ}')::date >= $2::date
          AND (created_at AT TIME ZONE '${TZ}')::date <= $3::date
          AND ${NON_VOID}
      ),
      cat_rev AS (
        SELECT 
          COALESCE(c.name, 'Uncategorized') as category,
          SUM(i.quantity * i.price)::bigint as revenue
        FROM coffeepos.transaction_items i
        JOIN tx ON tx.id = i.transaction_id
        LEFT JOIN coffeepos.products p ON p.id = i.product_id
        LEFT JOIN coffeepos.categories c ON p.category_id = c.id
        GROUP BY COALESCE(c.name, 'Uncategorized')
      ),
      total AS (
        SELECT SUM(revenue) as total_rev FROM cat_rev
      )
      SELECT 
        cat_rev.category,
        cat_rev.revenue,
        ROUND((cat_rev.revenue::numeric / NULLIF(total.total_rev, 0)) * 100, 1)::float as percentage
      FROM cat_rev, total
      ORDER BY cat_rev.revenue DESC;
    `;
    const catRes = await pool.query(categorySql, [shopId, from, to]);
    console.log("\n=== CATEGORY PERFORMANCE ===");
    console.log(catRes.rows);

    // 5. Waste Insights
    const wasteSql = `
      WITH waste AS (
        SELECT 
          product_id, 
          SUM(quantity)::int as waste_qty, 
          SUM(loss_amount)::bigint as waste_cost
        FROM coffeepos.waste_logs
        WHERE shop_id = $1::uuid
          AND (created_at AT TIME ZONE '${TZ}')::date >= $2::date
          AND (created_at AT TIME ZONE '${TZ}')::date <= $3::date
        GROUP BY product_id
      )
      SELECT 
        COALESCE(p.name, 'Unknown') as name,
        w.waste_qty,
        w.waste_cost
      FROM waste w
      LEFT JOIN coffeepos.products p ON p.id = w.product_id
      ORDER BY w.waste_cost DESC
      LIMIT 5;
    `;
    const wasteRes = await pool.query(wasteSql, [shopId, from, to]);
    console.log("\n=== WASTE INSIGHTS ===");
    console.log(wasteRes.rows);

    // 6. Stock Alerts (Current, doesn't depend on date range but good to have)
    const stockSql = `
      SELECT 
        COUNT(CASE WHEN stock <= 0 THEN 1 END)::int as critical,
        COUNT(CASE WHEN stock > 0 AND stock <= COALESCE(min_stock, 5) THEN 1 END)::int as warning
      FROM coffeepos.products
      WHERE shop_id = $1::uuid
        AND is_deleted = false
        AND is_available = true
        AND stock IS NOT NULL;
    `;
    const stockRes = await pool.query(stockSql, [shopId]);
    console.log("\n=== STOCK ALERTS ===");
    console.log(stockRes.rows[0]);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
