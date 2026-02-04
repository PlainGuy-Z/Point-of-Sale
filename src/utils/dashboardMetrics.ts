import type { Transaction, Product, Customer } from '../types';
import { safeParseDate } from './analytics/helpers'; // ✅ Import dari helpers baru

export interface DashboardMetrics {
  todayRevenue: number;
  yesterdayRevenue: number;
  revenueChange: number;
  todayTransactionCount: number;
  yesterdayTransactionCount: number;
  transactionChange: number;
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
}

export interface DailyData {
  date: string;
  revenue: number;
  transactions: number;
}

/**
 * Format date dengan safe parsing
 */
const formatDateKey = (date: Date | string): string => {
  try {
    const d = safeParseDate(date);
    return d.toISOString().split('T')[0];
  } catch {
    return 'invalid-date';
  }
};

/**
 * Hitung semua metrics dashboard dengan validasi date
 */
export const calculateDashboardMetrics = (
  transactions: Transaction[],
  products: Product[],
  customers: Customer[]
): DashboardMetrics => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const todayKey = formatDateKey(today);
  const yesterdayKey = formatDateKey(yesterday);
  
  // Filter valid transactions dengan date yang valid
  const validTransactions = transactions.filter(t => {
    try {
      const date = safeParseDate(t.date);
      return !isNaN(date.getTime());
    } catch {
      return false;
    }
  });
  
  // Single pass untuk analisis transaksi
  const dailyData: Record<string, DailyData> = {};
  let todayRevenue = 0;
  let todayProfit = 0;
  let todayTransactionCount = 0;
  let yesterdayRevenue = 0;
  let yesterdayTransactionCount = 0;
  
  validTransactions.forEach(transaction => {
    const dateKey = formatDateKey(transaction.date);
    
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = { date: dateKey, revenue: 0, transactions: 0 };
    }
    
    dailyData[dateKey].revenue += transaction.total;
    dailyData[dateKey].transactions += 1;
    
    if (dateKey === todayKey) {
      todayRevenue += transaction.total;
      todayProfit += transaction.profit;
      todayTransactionCount += 1;
    } else if (dateKey === yesterdayKey) {
      yesterdayRevenue += transaction.total;
      yesterdayTransactionCount += 1;
    }
  });
  
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
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);
  const outOfStockProducts = products.filter(p => p.stock === 0);
  const totalProducts = products.length;
  const uniqueCategories = new Set(products.map(p => p.category)).size;
  const stockValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const profitMargin = todayRevenue > 0 ? (todayProfit / todayRevenue) * 100 : 0;
  const avgTicket = todayTransactionCount > 0 ? todayRevenue / todayTransactionCount : 0;
  
  // Success rate (simulasi, bisa diganti dengan data riil)
  const successRate = todayTransactionCount > 0 
    ? Math.min(95 + (todayTransactionCount % 10), 99.9) 
    : 0;
  
  return {
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
    successRate: Number(successRate.toFixed(1))
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
  
  // Filter valid transactions
  const validTransactions = transactions.filter(t => {
    try {
      safeParseDate(t.date);
      return true;
    } catch {
      return false;
    }
  });
  
  // Single pass untuk revenue
  validTransactions.forEach(transaction => {
    const dateKey = formatDateKey(transaction.date);
    revenueByDay[dateKey] = (revenueByDay[dateKey] || 0) + transaction.total;
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
  // Filter valid transactions
  const validTransactions = todayTransactions.filter(t => {
    try {
      safeParseDate(t.date);
      return true;
    } catch {
      return false;
    }
  });
  
  const productSales = new Map<string, { quantity: number; revenue: number }>();
  
  // Hitung penjualan hari ini
  validTransactions.forEach(transaction => {
    transaction.items.forEach(item => {
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