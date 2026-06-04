/**
 * Product analytics utilities for the POS mobile app.
 * Ported from Front-End/src/utils/analytics/productAnalytics.ts
 */
import type { Transaction, Product } from '../../types';
import { safeParseDate, filterValidTransactions, createProductMap } from './helpers';

// ─── Recent Sales Map ───────────────────────────────────────────────────────────

/**
 * Build a Map<productId, totalQuantitySold> for a given rolling period.
 */
export function getRecentSalesMapByPeriod(
  transactions: Transaction[],
  periodDays: number = 3
): Map<string, number> {
  const validTransactions = filterValidTransactions(transactions);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const cutoffDate = new Date(startOfToday);
  cutoffDate.setDate(startOfToday.getDate() - (periodDays - 1));

  const salesMap = new Map<string, number>();
  validTransactions.forEach(transaction => {
    const transactionDate = safeParseDate(transaction.date);
    if (transactionDate < cutoffDate) return;

    transaction.items.forEach(item => {
      salesMap.set(item.productId, (salesMap.get(item.productId) || 0) + item.quantity);
    });
  });

  return salesMap;
}

// ─── Best Sellers by Period ─────────────────────────────────────────────────────

export function getBestSellersByPeriod(
  transactions: Transaction[],
  products: Product[],
  periodDays: number = 3,
  topN: number = 5,
  minSales: number = 1
): Array<{
  product: Product;
  quantity: number;
  revenue: number;
  periodDays: number;
  rank: number;
}> {
  const validTransactions = filterValidTransactions(transactions);

  if (validTransactions.length === 0 || products.length === 0) {
    return [];
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const cutoffDate = new Date(startOfToday);
  cutoffDate.setDate(startOfToday.getDate() - (periodDays - 1));

  const recentTransactions = validTransactions.filter(t => {
    const transactionDate = safeParseDate(t.date);
    return transactionDate >= cutoffDate;
  });

  const productSales = new Map<string, {
    quantity: number;
    revenue: number;
    lastSold: Date;
  }>();

  recentTransactions.forEach(transaction => {
    transaction.items.forEach(item => {
      const existing = productSales.get(item.productId);
      const quantity = item.quantity;
      const revenue = item.price * quantity;
      const transactionDate = safeParseDate(transaction.date);

      if (existing) {
        existing.quantity += quantity;
        existing.revenue += revenue;
        if (transactionDate > existing.lastSold) {
          existing.lastSold = transactionDate;
        }
      } else {
        productSales.set(item.productId, {
          quantity,
          revenue,
          lastSold: transactionDate,
        });
      }
    });
  });

  const productMap = createProductMap(products);

  return Array.from(productSales.entries())
    .map(([productId, stats]) => {
      const product = productMap.get(productId);
      if (!product) return null;
      return { productId, product, ...stats };
    })
    .filter((item): item is NonNullable<typeof item> =>
      item !== null && item.quantity >= minSales
    )
    .sort((a, b) => {
      if (b.quantity !== a.quantity) return b.quantity - a.quantity;
      if (b.revenue !== a.revenue) return b.revenue - a.revenue;
      return b.lastSold.getTime() - a.lastSold.getTime();
    })
    .slice(0, topN)
    .map((item, index) => ({
      product: item.product,
      quantity: item.quantity,
      revenue: item.revenue,
      periodDays,
      rank: index + 1,
    }));
}

// ─── Update Products with Best Seller Status ────────────────────────────────────

export function updateProductsWithBestSellerStatus(
  products: Product[],
  transactions: Transaction[],
  periodDays: number = 3,
  topN: number = 5,
  minSales: number = 1
): Product[] {
  const validTransactions = filterValidTransactions(transactions);

  if (validTransactions.length === 0 || products.length === 0) {
    return products.map(product => ({
      ...product,
      isBestSeller: false,
      recentSalesCount: 0,
      bestSellerRank: undefined,
      bestSellerPeriod: periodDays,
    }));
  }

  const bestSellers = getBestSellersByPeriod(validTransactions, products, periodDays, topN, minSales);
  const bestSellerDataMap = new Map(bestSellers.map(bs => [bs.product.id, bs]));

  // Also compute recent sales for ALL products (not just best sellers)
  const salesMap = getRecentSalesMapByPeriod(validTransactions, periodDays);

  return products.map(product => {
    const bsData = bestSellerDataMap.get(product.id);
    const recentSales = salesMap.get(product.id) || 0;

    return {
      ...product,
      isBestSeller: !!bsData,
      recentSalesCount: recentSales,
      bestSellerRank: bsData?.rank,
      bestSellerPeriod: periodDays,
    };
  });
}

// ─── Top Best Sellers for Banner ────────────────────────────────────────────────

export function getTopBestSellersForBanner(
  transactions: Transaction[],
  products: Product[],
  periodDays: number = 3
): Product[] {
  const bestSellers = getBestSellersByPeriod(transactions, products, periodDays, 3, 1);
  return bestSellers.map(bs => bs.product);
}
