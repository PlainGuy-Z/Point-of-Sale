import type { Transaction, Product, Customer, WasteLog } from '../types';
import { localDateKey, transactionLocalDateKey } from './analytics/helpers';
import { isLowStock, isOutOfStock, isStockTracked } from './stockUtils';

export interface DashboardMetrics {
  currentRevenue: number;
  previousRevenue: number;
  revenueChange: number;
  currentTransactionCount: number;
  previousTransactionCount: number;
  transactionChange: number;
  currentProfit: number;

  todayRevenue: number;
  yesterdayRevenue: number;
  todayTransactionCount: number;
  yesterdayTransactionCount: number;
  todayProfit: number;
  avgTicket: number;
  newCustomers: number;
  lowStockProducts: Product[];
  outOfStockProducts: Product[];
  totalProducts: number;
  uniqueCategories: number;
  stockValue: number;
  profitMargin: number;
  totalTransactions: number;
  categoriesCount: number;
  successRate: number;
  estimatedLossToday: number;
}

export interface DailyData {
  date: string;
  revenue: number;
  transactions: number;
}

/**
 * Format date dengan safe parsing
 */
export const formatDateKey = localDateKey; // alias for backward compat

/**
 * Hitung semua metrics dashboard dengan validasi date
 */
export const calculateDashboardMetrics = (
  transactions: Transaction[],
  products: Product[],
  customers: Customer[],
  wasteLogs: WasteLog[]
): DashboardMetrics => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Lookup cost by product (raw integers)
  const productCostById = new Map(products.map((p) => [p.id, Number(p.cost ?? 0)] as const));
  
  const computeProfitInt = (t: Transaction): number => {
    // Prefer backend-computed profit (authoritative), fallback to item-cost estimate.
    if (Number.isFinite(t.profit)) return Math.trunc(t.profit);
    let cost = 0;
    const lineItems = Array.isArray(t.items) ? t.items : [];
    for (const item of lineItems) {
      cost += (productCostById.get(item.productId) ?? 0) * item.quantity;
    }
    return Math.trunc(t.total - cost);
  };
  
  const todayKey = formatDateKey(today);
  const yesterdayKey = formatDateKey(yesterday);
  
  const validTransactions = transactions.filter((t) => transactionLocalDateKey(t.date) !== null);

  // Single pass untuk analisis transaksi
  const dailyData: Record<string, DailyData> = {};
  let todayRevenue = 0;
  let todayProfit = 0;
  let todayTransactionCount = 0;
  let yesterdayRevenue = 0;
  let yesterdayTransactionCount = 0;
  let estimatedLossToday = 0;
  
  validTransactions.forEach(transaction => {
    const dateKey = transactionLocalDateKey(transaction.date)!;
    
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = { date: dateKey, revenue: 0, transactions: 0 };
    }
    
    // Keep all aggregates as raw integers for charting/analytics.
    dailyData[dateKey].revenue += Math.trunc(transaction.total);
    dailyData[dateKey].transactions += 1;
    
    if (dateKey === todayKey) {
      todayRevenue += Math.trunc(transaction.total);
      todayProfit += computeProfitInt(transaction);
      todayTransactionCount += 1;
    } else if (dateKey === yesterdayKey) {
      yesterdayRevenue += Math.trunc(transaction.total);
      yesterdayTransactionCount += 1;
    }
  });

  // Estimated loss from waste logs (today only) - keep raw integer
  estimatedLossToday = wasteLogs
    .filter((w) => {
      try {
        return formatDateKey(w.date) === todayKey;
      } catch {
        return false;
      }
    })
    .reduce((sum, w) => sum + Math.trunc(w.costLoss), 0);
  
  // Hitung changes
  const revenueChange = yesterdayRevenue > 0 
    ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 
    : (todayRevenue > 0 ? 100 : 0);
    
  const transactionChange = yesterdayTransactionCount > 0
    ? ((todayTransactionCount - yesterdayTransactionCount) / yesterdayTransactionCount) * 100
    : (todayTransactionCount > 0 ? 100 : 0);
  
  // Customer metrics
  const newCustomers = customers.filter(customer => {
    try {
      const joinDateKey = formatDateKey(customer.joinDate);
      return joinDateKey === todayKey;
    } catch {
      return false;
    }
  }).length;
  
  // Product metrics
  const lowStockProducts = products.filter(p => isLowStock(p));
  const outOfStockProducts = products.filter(p => isOutOfStock(p));
  const totalProducts = products.length;
  const uniqueCategories = new Set(products.map(p => p.category)).size;
  const stockValue = products.filter(p => isStockTracked(p)).reduce((sum, p) => sum + (p.price * p.stock), 0);
  const profitMargin = todayRevenue > 0 ? (todayProfit / todayRevenue) * 100 : 0;
  const avgTicket = todayTransactionCount > 0 ? todayRevenue / todayTransactionCount : 0;
  
  // Success rate (simulasi, bisa diganti dengan data riil)
  const successRate = todayTransactionCount > 0 
    ? Math.min(95 + (todayTransactionCount % 10), 99.9) 
    : 0;
  
  return {
    currentRevenue: todayRevenue,
    previousRevenue: yesterdayRevenue,
    currentTransactionCount: todayTransactionCount,
    previousTransactionCount: yesterdayTransactionCount,
    currentProfit: todayProfit,

    todayRevenue,
    yesterdayRevenue,
    revenueChange: Number(revenueChange.toFixed(1)),
    todayTransactionCount,
    yesterdayTransactionCount,
    transactionChange: Number(transactionChange.toFixed(1)),
    todayProfit,
    avgTicket: Number(avgTicket.toFixed(0)),
    newCustomers,
    lowStockProducts,
    outOfStockProducts,
    totalProducts,
    uniqueCategories,
    stockValue,
    profitMargin: Number(profitMargin.toFixed(1)),
    totalTransactions: validTransactions.length,
    categoriesCount: uniqueCategories,
    successRate: Number(successRate.toFixed(1)),
    estimatedLossToday
  };
};

/**
 * Data untuk chart 7 hari terakhir dengan validasi date
 */
export const getLast7DaysRevenue = (transactions: Transaction[]) => {
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      date: formatDateKey(date),
      label: date.toLocaleDateString('id-ID', { weekday: 'short' })
    };
  });
  
  const revenueByDay: Record<string, number> = {};
  
  const validTransactions = transactions.filter((t) => transactionLocalDateKey(t.date) !== null);

  // Single pass untuk revenue
  validTransactions.forEach(transaction => {
    const dateKey = transactionLocalDateKey(transaction.date)!;
    revenueByDay[dateKey] = (revenueByDay[dateKey] || 0) + Math.trunc(transaction.total);
  });
  
  return days.map(day => ({
    label: day.label,
    revenue: revenueByDay[day.date] || 0,
    date: day.date
  }));
};

/**
 * Data untuk top products hari ini
 */
export const getTopProductsToday = (
  todayTransactions: Transaction[], 
  products: Product[],
  limit: number = 5
) => {
  const validTransactions = todayTransactions.filter((t) => transactionLocalDateKey(t.date) !== null);
  
  const productSales = new Map<string, { quantity: number; revenue: number }>();
  
  // Hitung penjualan hari ini
  validTransactions.forEach(transaction => {
    const items = Array.isArray(transaction.items) ? transaction.items : [];
    items.forEach(item => {
      // Ignore manual/custom items that don't map to real products
      if (!item.productId || item.productId === 'manual' || item.productId.startsWith('manual-')) return;
      const existing = productSales.get(item.productId);
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += item.price * item.quantity;
      } else {
        productSales.set(item.productId, {
          quantity: item.quantity,
          revenue: item.price * item.quantity
        });
      }
    });
  });
  
  // Map ke produk
  const productMap = new Map(products.map(p => [p.id, p]));
  
  return Array.from(productSales.entries())
    .map(([productId, sales]) => {
      const product = productMap.get(productId);
      return product ? { ...product, ...sales } : null;
    })
    .filter((item): item is Product & { quantity: number; revenue: number } => item !== null)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit);
};