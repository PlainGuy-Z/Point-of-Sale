//src/utils/analytics/inventoryAnalytics.ts
import type { WasteLog, Transaction } from '../../types';
import { safeParseDate } from './helpers';

// ==================== WASTE ANALYSIS ====================
export function analyzeWasteTrends(wasteLogs: WasteLog[], daysInPeriod: number = 30) {
  if (wasteLogs.length === 0) {
    return {
      byReason: [],
      byProduct: [],
      byDay: [],
      totalLoss: 0,
      avgDailyLoss: 0,
      wasteLogsCount: 0,
      periodDays: daysInPeriod
    };
  }
  
  const byReason = new Map<string, number>();
  const byProduct = new Map<string, number>();
  const byDay = new Map<string, number>();
  let totalLoss = 0;
  
  wasteLogs.forEach(waste => {
    const date = safeParseDate(waste.date).toISOString().split('T')[0];
    
    totalLoss += waste.costLoss;
    
    byReason.set(waste.reason, (byReason.get(waste.reason) || 0) + waste.costLoss);
    byProduct.set(waste.productName, (byProduct.get(waste.productName) || 0) + waste.costLoss);
    byDay.set(date, (byDay.get(date) || 0) + waste.costLoss);
  });
  
  const sortMapEntries = (map: Map<string, number>) => 
    Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  
  return {
    byReason: sortMapEntries(byReason),
    byProduct: sortMapEntries(byProduct),
    byDay: sortMapEntries(byDay),
    totalLoss,
    avgDailyLoss: totalLoss / daysInPeriod,
    wasteLogsCount: wasteLogs.length,
    periodDays: daysInPeriod,
    mostCommonReason: sortMapEntries(byReason)[0]?.[0] || 'N/A',
    mostWastedProduct: sortMapEntries(byProduct)[0]?.[0] || 'N/A'
  };
}

// ==================== BUSINESS HEALTH ====================
export function getBusinessHealth(
  transactions: Transaction[], 
  wasteLoss: number,
  config: {
    targetProfitMargin?: number;
    wastePenaltyFactor?: number;
    marginPenaltyFactor?: number;
    minTransactionsForAnalysis?: number;
  } = {}
) {
  const {
    targetProfitMargin = 50,
    wastePenaltyFactor = 5,
    marginPenaltyFactor = 2,
    minTransactionsForAnalysis = 5
  } = config;
  
  const validTransactions = transactions.filter(t => {
    try {
      safeParseDate(t.date);
      return true;
    } catch {
      return false;
    }
  });
  
  const last7Days = validTransactions.filter(t => {
    const transactionDate = safeParseDate(t.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return transactionDate >= weekAgo;
  });
  
  if (last7Days.length < minTransactionsForAnalysis) {
    return {
      weeklyRevenue: 0,
      weeklyProfit: 0,
      profitMargin: 0,
      wastePercentage: 0,
      healthScore: 0,
      healthStatus: 'insufficient-data' as const,
      transactionsCount: last7Days.length,
      avgTicketSize: 0,
      hasEnoughData: false
    };
  }
  
  const weeklyRevenue = last7Days.reduce((sum, t) => sum + t.total, 0);
  const weeklyProfit = last7Days.reduce((sum, t) => sum + t.profit, 0);
  const profitMargin = weeklyRevenue > 0 ? (weeklyProfit / weeklyRevenue) * 100 : 0;
  const wastePercentage = weeklyRevenue > 0 ? (wasteLoss / weeklyRevenue) * 100 : 0;
  
  let healthScore = 100;
  
  if (profitMargin < targetProfitMargin) {
    healthScore -= (targetProfitMargin - profitMargin) * marginPenaltyFactor;
  }
  
  healthScore -= wastePercentage * wastePenaltyFactor;
  
  if (profitMargin > targetProfitMargin) {
    healthScore += (profitMargin - targetProfitMargin) * 0.5;
  }
  
  healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));
  
  let healthStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'critical' | 'insufficient-data';
  if (healthScore >= 85) healthStatus = 'excellent';
  else if (healthScore >= 70) healthStatus = 'good';
  else if (healthScore >= 50) healthStatus = 'fair';
  else if (healthScore >= 30) healthStatus = 'poor';
  else healthStatus = 'critical';
  
  return {
    weeklyRevenue,
    weeklyProfit,
    profitMargin: Number(profitMargin.toFixed(1)),
    wastePercentage: Number(wastePercentage.toFixed(1)),
    healthScore,
    healthStatus,
    transactionsCount: last7Days.length,
    avgTicketSize: last7Days.length > 0 ? Number((weeklyRevenue / last7Days.length).toFixed(0)) : 0,
    hasEnoughData: true,
    analysisDate: new Date().toISOString()
  };
}