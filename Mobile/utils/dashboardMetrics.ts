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
  newCustomersAvailable?: boolean;
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

export const formatDateKey = localDateKey;

export const calculateDashboardMetrics = (
  transactions: Transaction[],
  products: Product[],
  customers: Customer[],
  wasteLogs: WasteLog[]
): DashboardMetrics => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const productCostById = new Map(products.map((p) => [p.id, Number(p.cost ?? 0)] as const));
  
  const computeProfitInt = (t: Transaction): number => {
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

  estimatedLossToday = wasteLogs
    .filter((w) => {
      try {
        return formatDateKey(w.date) === todayKey;
      } catch {
        return false;
      }
    })
    .reduce((sum, w) => sum + Math.trunc(w.costLoss), 0);
  
  const revenueChange = yesterdayRevenue > 0 
    ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 
    : (todayRevenue > 0 ? 100 : 0);
    
  const transactionChange = yesterdayTransactionCount > 0
    ? ((todayTransactionCount - yesterdayTransactionCount) / yesterdayTransactionCount) * 100
    : (todayTransactionCount > 0 ? 100 : 0);
  
  const newCustomers = customers.filter(customer => {
    try {
      const joinDateKey = formatDateKey(customer.joinDate);
      return joinDateKey === todayKey;
    } catch {
      return false;
    }
  }).length;
  
  const lowStockProducts = products.filter(p => isLowStock(p));
  const outOfStockProducts = products.filter(p => isOutOfStock(p));
  const totalProducts = products.length;
  const uniqueCategories = new Set(products.map(p => p.category)).size;
  const stockValue = products.filter(p => isStockTracked(p)).reduce((sum, p) => sum + (p.price * p.stock), 0);
  const profitMargin = todayRevenue > 0 ? (todayProfit / todayRevenue) * 100 : 0;
  const avgTicket = todayTransactionCount > 0 ? todayRevenue / todayTransactionCount : 0;
  
  // Real success rate: completed / (completed + voided) * 100
  // validTransactions only contains non-voided transactions (from AppContext filter)
  // We can't count voided from local data since AppContext filters them out
  // So success rate from local data is always 100% when there are transactions
  // The backend provides the real number including voided when using remote data
  const successRate = todayTransactionCount > 0 ? 100 : 0;
  
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

export const getTopProductsToday = (
  allTransactions: Transaction[], 
  products: Product[],
  limit: number = 5
) => {
  const todayKey = localDateKey(new Date());
  
  // CRITICAL: Only include transactions from TODAY
  const todayTransactions = allTransactions.filter((t) => {
    const dateKey = transactionLocalDateKey(t.date);
    return dateKey === todayKey;
  });
  
  const productSales = new Map<string, { quantity: number; revenue: number }>();
  
  todayTransactions.forEach(transaction => {
    const items = Array.isArray(transaction.items) ? transaction.items : [];
    items.forEach(item => {
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
