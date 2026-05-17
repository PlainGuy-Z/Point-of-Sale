//src/utils/analytics/salesAnalytics.ts
import type { Transaction, Product, WasteLog } from '../../types';
import { getTopProducts, getBestSellersByPeriod } from './productAnalytics';
import { getHourlySalesPattern } from './customerAnalytics';
import { getBusinessHealth, analyzeWasteTrends } from './inventoryAnalytics';
import { analyzeCustomerBehavior } from './customerAnalytics';
import { filterValidTransactions } from './helpers';

// ==================== EXPORT METRICS ====================
export function exportAnalyticsMetrics(
  transactions: Transaction[],
  products: Product[],
  wasteLogs: WasteLog[],
  periodDays: number = 30
) {
  const validTransactions = filterValidTransactions(transactions);
  
  const metrics = {
    metadata: {
      version: '1.0',
      generatedAt: new Date().toISOString(),
      periodDays,
      dataPoints: {
        transactions: validTransactions.length,
        products: products.length,
        wasteLogs: wasteLogs.length
      }
    },
    summary: {
      totalRevenue: validTransactions.reduce((sum, t) => sum + t.total, 0),
      totalTransactions: validTransactions.length,
      totalProducts: products.length,
      totalWasteLoss: wasteLogs.reduce((sum, w) => sum + w.costLoss, 0)
    },
    products: {
      topProducts: getTopProducts(validTransactions, products, 5),
      bestSellers: getBestSellersByPeriod(validTransactions, products, periodDays, 5)
    },
    sales: {
      hourlyPattern: getHourlySalesPattern(validTransactions)
    },
    financial: {
      businessHealth: getBusinessHealth(
        validTransactions, 
        wasteLogs.reduce((sum, w) => sum + w.costLoss, 0)
      )
    },
    inventory: {
      wasteAnalysis: analyzeWasteTrends(wasteLogs, periodDays)
    },
    customers: {
      behavior: analyzeCustomerBehavior(validTransactions)
    }
  };
  
  return metrics;
}