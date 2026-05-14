import { Pool } from 'pg';

export type ForecastResult = {
  date: string;
  day_name: string;
  predicted_revenue: number;
  predicted_transactions: number;
  confidence: 'high' | 'medium' | 'low';
};

export type InventoryAlert = {
  product_id: string;
  name: string;
  current_stock: number;
  adu: number;
  days_to_stockout: number;
  urgency: 'critical' | 'warning' | 'watch';
};

export type WasteAnalysis = {
  period_days: number;
  total_waste_cost: number;
  previous_period_waste_cost: number;
  trend_percentage: number;
  top_waste_products: Array<{
    product_id: string;
    name: string;
    waste_qty: number;
    sold_qty: number;
    waste_ratio: number;
    waste_cost: number;
  }>;
};

export type BusinessSummary = {
  today_revenue: number;
  yesterday_revenue: number;
  this_week_revenue: number;
  last_week_revenue: number;
  this_month_revenue: number;
  day_over_day_change_percent: number;
  week_over_week_change_percent: number;
  top_products_today: string;
  low_stock_count: number;
  active_shifts_count: number;
  today_transactions: number;
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Calculates a 7-day sales forecast based on historical data.
 * Uses a priority chain:
 * 1. DOW (day-of-week) average if data_points >= 2
 * 2. 7-day moving average with DOW weighting as fallback
 * 3. Zero if no historical data exists
 */
export async function getSalesForecast(pool: Pool, shopId: string): Promise<ForecastResult[]> {
  // Query daily revenue and apply a 7-day moving average, then average by day of week.
  const dowQuery = `
    WITH daily_stats AS (
      SELECT
        DATE(created_at) as date,
        EXTRACT(DOW FROM created_at) as dow,
        SUM(grand_total) as daily_revenue,
        COUNT(id) as daily_transactions
      FROM coffeepos.transactions
      WHERE shop_id = $1 AND created_at >= NOW() - INTERVAL '60 days' AND status = 'completed'
      GROUP BY DATE(created_at), EXTRACT(DOW FROM created_at)
    ),
    smoothed_stats AS (
      SELECT
        date,
        dow,
        daily_revenue,
        daily_transactions,
        AVG(daily_revenue) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as smoothed_revenue,
        AVG(daily_transactions) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as smoothed_transactions
      FROM daily_stats
    ),
    dow_averages AS (
      SELECT
        dow,
        AVG(smoothed_revenue) as avg_revenue,
        AVG(smoothed_transactions) as avg_transactions,
        COUNT(*) as data_points
      FROM smoothed_stats
      GROUP BY dow
    )
    SELECT * FROM dow_averages;
  `;

  const globalAvgQuery = `
    SELECT 
      COALESCE(SUM(grand_total), 0) / NULLIF(COUNT(DISTINCT DATE(created_at)), 0) as avg_daily_revenue,
      COALESCE(SUM(COUNT(id)) OVER (), 0) / NULLIF(COUNT(DISTINCT DATE(created_at)), 0) as avg_daily_transactions,
      COUNT(DISTINCT DATE(created_at)) as days_with_data
    FROM coffeepos.transactions
    WHERE shop_id = $1 
      AND created_at >= NOW() - INTERVAL '7 days'
      AND status = 'completed'
  `;

  const [dowRes, globalAvgRes] = await Promise.all([
    pool.query(dowQuery, [shopId]),
    pool.query(globalAvgQuery, [shopId])
  ]);

  const dowMap = new Map();
  for (const row of dowRes.rows) {
    dowMap.set(Number(row.dow), {
      avg_revenue: Number(row.avg_revenue),
      avg_transactions: Number(row.avg_transactions),
      data_points: Number(row.data_points),
    });
  }

  const globalAvgRow = globalAvgRes.rows[0];
  const globalDailyAvg = Number(globalAvgRow?.avg_daily_revenue || 0);
  const globalDailyTrx = Number(globalAvgRow?.avg_daily_transactions || 0);
  const daysWithData = Number(globalAvgRow?.days_with_data || 0);

  const forecast: ForecastResult[] = [];
  const today = new Date();

  for (let i = 1; i <= 7; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + i);
    const dow = targetDate.getDay();

    const stats = dowMap.get(dow);
    const hasReliableDowData = stats && stats.data_points >= 2;

    let predicted_revenue: number;
    let predicted_transactions: number;
    let confidence: 'high' | 'medium' | 'low';

    if (hasReliableDowData) {
      // Priority 1: use DOW average
      predicted_revenue = Math.round(stats.avg_revenue);
      predicted_transactions = Math.round(stats.avg_transactions);
      confidence = stats.data_points >= 8 ? 'high' : 'medium';
    } else if (globalDailyAvg > 0) {
      // Priority 2: fallback to 7-day moving average
      // Apply slight day-of-week weight if DOW data exists but < 2 points
      const dowWeight = stats ? (stats.avg_revenue / globalDailyAvg) : 1;
      const weightClamped = Math.min(Math.max(dowWeight, 0.5), 1.5); // clamp 50%-150%
      predicted_revenue = Math.round(globalDailyAvg * weightClamped);
      predicted_transactions = Math.round(globalDailyTrx * weightClamped);
      confidence = daysWithData >= 3 ? 'medium' : 'low';
    } else {
      // Priority 3: no data at all
      predicted_revenue = 0;
      predicted_transactions = 0;
      confidence = 'low';
    }

    forecast.push({
      date: targetDate.toISOString().split('T')[0],
      day_name: DAY_NAMES[dow],
      predicted_revenue,
      predicted_transactions,
      confidence,
    });
  }

  return forecast;
}

/**
 * Generates alerts for inventory expected to stock out soon based on Average Daily Usage (ADU).
 */
export async function getInventoryAlerts(pool: Pool, shopId: string): Promise<InventoryAlert[]> {
  const query = `
    WITH sold_last_14 AS (
      SELECT product_id, SUM(quantity) as total_qty_sold
      FROM coffeepos.transaction_items ti
      JOIN coffeepos.transactions t ON ti.transaction_id = t.id
      WHERE t.shop_id = $1 AND t.created_at >= NOW() - INTERVAL '14 days' AND t.status = 'completed'
      GROUP BY product_id
    )
    SELECT
      p.id as product_id,
      p.name,
      p.stock as current_stock,
      COALESCE(s.total_qty_sold, 0) / 14.0 as adu
    FROM coffeepos.products p
    LEFT JOIN sold_last_14 s ON p.id = s.product_id
    WHERE p.shop_id = $1
  `;

  const { rows } = await pool.query(query, [shopId]);
  const alerts: InventoryAlert[] = [];

  for (const row of rows) {
    const currentStock = Number(row.current_stock);
    const adu = Number(row.adu);

    if (adu > 0 && currentStock !== null) {
      const daysToStockout = currentStock / adu;

      if (daysToStockout < 7) {
        let urgency: 'critical' | 'warning' | 'watch' = 'watch';
        if (daysToStockout < 2) urgency = 'critical';
        else if (daysToStockout < 4) urgency = 'warning';

        alerts.push({
          product_id: row.product_id,
          name: row.name,
          current_stock: currentStock,
          adu: Number(adu.toFixed(2)),
          days_to_stockout: Number(daysToStockout.toFixed(1)),
          urgency
        });
      }
    }
  }

  return alerts.sort((a, b) => a.days_to_stockout - b.days_to_stockout);
}

/**
 * Analyzes waste logs over a given period, computing waste ratio and cost, and comparing with previous period.
 */
export async function getWasteAnalysis(pool: Pool, shopId: string, days: number = 30): Promise<WasteAnalysis> {
  const queryCurrent = `
    WITH waste_period AS (
      SELECT product_id, SUM(quantity) as total_waste_qty
      FROM coffeepos.waste_logs
      WHERE shop_id = $1 AND created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY product_id
    ),
    sold_period AS (
      SELECT ti.product_id, SUM(ti.quantity) as total_sold
      FROM coffeepos.transaction_items ti
      JOIN coffeepos.transactions t ON ti.transaction_id = t.id
      WHERE t.shop_id = $1 AND t.created_at >= NOW() - INTERVAL '${days} days' AND t.status = 'completed'
      GROUP BY ti.product_id
    )
    SELECT
      p.id as product_id,
      p.name,
      p.cost,
      COALESCE(w.total_waste_qty, 0) as waste_qty,
      COALESCE(s.total_sold, 0) as sold_qty
    FROM coffeepos.products p
    JOIN waste_period w ON p.id = w.product_id
    LEFT JOIN sold_period s ON p.id = s.product_id
    WHERE p.shop_id = $1
  `;

  const queryPrevious = `
    SELECT SUM(w.quantity * p.cost) as prev_waste_cost
    FROM coffeepos.waste_logs w
    JOIN coffeepos.products p ON w.product_id = p.id
    WHERE w.shop_id = $1 
      AND w.created_at >= NOW() - INTERVAL '${days * 2} days'
      AND w.created_at < NOW() - INTERVAL '${days} days'
  `;

  const [currentRes, prevRes] = await Promise.all([
    pool.query(queryCurrent, [shopId]),
    pool.query(queryPrevious, [shopId]),
  ]);

  let totalWasteCost = 0;
  const productsAnalysis = [];

  for (const row of currentRes.rows) {
    const wasteQty = Number(row.waste_qty);
    const soldQty = Number(row.sold_qty);
    const cost = Number(row.cost);

    const wasteCost = wasteQty * cost;
    totalWasteCost += wasteCost;

    const totalVolume = wasteQty + soldQty;
    const wasteRatio = totalVolume > 0 ? wasteQty / totalVolume : 0;

    productsAnalysis.push({
      product_id: row.product_id,
      name: row.name,
      waste_qty: wasteQty,
      sold_qty: soldQty,
      waste_ratio: Number(wasteRatio.toFixed(4)),
      waste_cost: wasteCost
    });
  }

  // Sort by waste_ratio descending
  productsAnalysis.sort((a, b) => b.waste_ratio - a.waste_ratio);
  const topWasteProducts = productsAnalysis.slice(0, 5);

  const prevWasteCost = Number(prevRes.rows[0]?.prev_waste_cost || 0);
  let trendPercentage = 0;

  if (prevWasteCost > 0) {
    trendPercentage = ((totalWasteCost - prevWasteCost) / prevWasteCost) * 100;
  } else if (totalWasteCost > 0) {
    trendPercentage = 100; // 100% increase if previous was 0 and current > 0
  }

  return {
    period_days: days,
    total_waste_cost: totalWasteCost,
    previous_period_waste_cost: prevWasteCost,
    trend_percentage: Number(trendPercentage.toFixed(1)),
    top_waste_products: topWasteProducts
  };
}

/**
 * Gathers an overarching business summary snapshot suitable for providing AI context.
 */
export async function getBusinessSummary(pool: Pool, shopId: string): Promise<BusinessSummary> {
  // Di getBusinessSummary, ganti query revenuesQuery:
  const revenuesQuery = `
  SELECT
    SUM(CASE WHEN 
      (created_at AT TIME ZONE 'Asia/Jakarta')::date = 
      (NOW() AT TIME ZONE 'Asia/Jakarta')::date
      THEN grand_total ELSE 0 END) as today_revenue,

    COUNT(CASE WHEN 
      (created_at AT TIME ZONE 'Asia/Jakarta')::date = 
      (NOW() AT TIME ZONE 'Asia/Jakarta')::date
      THEN id END) as today_transactions,

    SUM(CASE WHEN 
      (created_at AT TIME ZONE 'Asia/Jakarta')::date = 
      (NOW() AT TIME ZONE 'Asia/Jakarta')::date - 1
      THEN grand_total ELSE 0 END) as yesterday_revenue,

    SUM(CASE WHEN 
      (created_at AT TIME ZONE 'Asia/Jakarta') >= 
      date_trunc('week', NOW() AT TIME ZONE 'Asia/Jakarta')
      THEN grand_total ELSE 0 END) as this_week_revenue,

    SUM(CASE WHEN 
      (created_at AT TIME ZONE 'Asia/Jakarta') >= 
      date_trunc('week', NOW() AT TIME ZONE 'Asia/Jakarta') - INTERVAL '7 days'
      AND (created_at AT TIME ZONE 'Asia/Jakarta') < 
      date_trunc('week', NOW() AT TIME ZONE 'Asia/Jakarta')
      THEN grand_total ELSE 0 END) as last_week_revenue_full,

    SUM(CASE WHEN 
      (created_at AT TIME ZONE 'Asia/Jakarta') >= 
      date_trunc('week', NOW() AT TIME ZONE 'Asia/Jakarta') - INTERVAL '7 days'
      AND (created_at AT TIME ZONE 'Asia/Jakarta') < 
      (NOW() AT TIME ZONE 'Asia/Jakarta') - INTERVAL '7 days'
      THEN grand_total ELSE 0 END) as last_week_revenue_apple,
      
    SUM(CASE WHEN 
      (created_at AT TIME ZONE 'Asia/Jakarta') >= 
      date_trunc('month', NOW() AT TIME ZONE 'Asia/Jakarta')
      THEN grand_total ELSE 0 END) as this_month_revenue

  FROM coffeepos.transactions
  WHERE shop_id = $1 AND status = 'completed'
`;

  const topProductsQuery = `
    SELECT p.name, SUM(ti.quantity) as qty
    FROM coffeepos.transaction_items ti
    JOIN coffeepos.transactions t ON ti.transaction_id = t.id
    JOIN coffeepos.products p ON ti.product_id = p.id
    WHERE t.shop_id = $1 
    AND (t.created_at AT TIME ZONE 'Asia/Jakarta')::date = 
        (NOW() AT TIME ZONE 'Asia/Jakarta')::date
    AND t.status = 'completed'
    GROUP BY p.id, p.name
    ORDER BY qty DESC
    LIMIT 3
  `;

  const lowStockQuery = `
    SELECT COUNT(*) as count
    FROM coffeepos.products
    WHERE shop_id = $1 
      AND stock <= COALESCE(min_stock, 5)
      AND stock >= 0
      AND is_available = true
  `;

  const shiftsQuery = `
    SELECT COUNT(*) as count
    FROM coffeepos.shifts
    WHERE shop_id = $1 AND status = 'open'
  `;

  const [revRes, prodRes, stockRes, shiftsRes] = await Promise.all([
    pool.query(revenuesQuery, [shopId]),
    pool.query(topProductsQuery, [shopId]),
    pool.query(lowStockQuery, [shopId]),
    pool.query(shiftsQuery, [shopId])
  ]);

  const rev = revRes.rows[0];
  const today = Number(rev.today_revenue || 0);
  const yesterday = Number(rev.yesterday_revenue || 0);
  const thisWeek = Number(rev.this_week_revenue || 0);
  const lastWeekFull = Number(rev.last_week_revenue_full || 0);
  const lastWeekApple = Number(rev.last_week_revenue_apple || 0);

  let dodChange = 0;
  if (yesterday > 0) dodChange = ((today - yesterday) / yesterday) * 100;
  else if (today > 0) dodChange = 100;

  let wowChange = 0;
  if (lastWeekApple > 0) wowChange = ((thisWeek - lastWeekApple) / lastWeekApple) * 100;
  else if (thisWeek > 0) wowChange = 100;

  const topProductsStr = prodRes.rows.map(r => `${r.name} (${r.qty})`).join(', ');

  return {
    today_revenue: today,
    yesterday_revenue: yesterday,
    this_week_revenue: thisWeek,
    last_week_revenue: lastWeekFull,
    this_month_revenue: Number(rev.this_month_revenue || 0),
    day_over_day_change_percent: Number(dodChange.toFixed(1)),
    week_over_week_change_percent: Number(wowChange.toFixed(1)),
    top_products_today: topProductsStr || 'None yet',
    low_stock_count: Number(stockRes.rows[0]?.count || 0),
    active_shifts_count: Number(shiftsRes.rows[0]?.count || 0),
    today_transactions: Number(rev.today_transactions || 0),
  };
}
