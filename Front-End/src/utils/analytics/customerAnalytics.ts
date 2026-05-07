//src/utils/analytics/customerAnalytics.ts
import type { Transaction } from '../../types';
import { safeParseDate, formatCurrency } from './helpers';

// ==================== CUSTOMER BEHAVIOR ====================
export function analyzeCustomerBehavior(transactions: Transaction[]) {
  const customerData = new Map<string, {
    totalSpent: number;
    visitCount: number;
    lastVisit: Date;
    firstVisit?: Date;
    avgSpentPerVisit: number;
  }>();
  
  const validTransactions = transactions.filter(t => {
    try {
      safeParseDate(t.date);
      return true;
    } catch {
      return false;
    }
  });
  
  validTransactions.forEach(transaction => {
    if (!transaction.customerId) return;
    
    const customerId = transaction.customerId;
    const existing = customerData.get(customerId);
    const transactionDate = safeParseDate(transaction.date);
    
    if (existing) {
      existing.totalSpent += transaction.total;
      existing.visitCount += 1;
      existing.avgSpentPerVisit = existing.totalSpent / existing.visitCount;
      
      if (transactionDate > existing.lastVisit) {
        existing.lastVisit = transactionDate;
      }
    } else {
      customerData.set(customerId, {
        totalSpent: transaction.total,
        visitCount: 1,
        lastVisit: transactionDate,
        firstVisit: transactionDate,
        avgSpentPerVisit: transaction.total
      });
    }
  });
  
  const customers = Array.from(customerData.entries());
  const totalCustomers = customers.length;
  
  if (totalCustomers === 0) {
    return {
      totalCustomers: 0,
      avgSpending: 0,
      avgVisits: 0,
      topSpenders: [],
      frequentVisitors: [],
      newCustomersThisMonth: 0,
      customerRetentionRate: 0
    };
  }
  
  const totalSpent = customers.reduce((sum, [, data]) => sum + data.totalSpent, 0);
  const totalVisits = customers.reduce((sum, [, data]) => sum + data.visitCount, 0);
  
  const avgSpending = totalSpent / totalCustomers;
  const avgVisits = totalVisits / totalCustomers;
  
  const topSpenders = customers
    .sort((a, b) => b[1].totalSpent - a[1].totalSpent)
    .slice(0, 5)
    .map(([id, data]) => ({ customerId: id, ...data }));
  
  const frequentVisitors = customers
    .sort((a, b) => b[1].visitCount - a[1].visitCount)
    .slice(0, 5)
    .map(([id, data]) => ({ customerId: id, ...data }));
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const newCustomersThisMonth = customers.filter(([, data]) => {
    return data.firstVisit && data.firstVisit >= thirtyDaysAgo;
  }).length;
  
  const returningCustomers = customers.filter(([, data]) => data.visitCount > 1).length;
  const customerRetentionRate = totalCustomers > 0 
    ? (returningCustomers / totalCustomers) * 100 
    : 0;
  
  return {
    totalCustomers,
    avgSpending: Number(avgSpending.toFixed(0)),
    avgVisits: Number(avgVisits.toFixed(1)),
    topSpenders,
    frequentVisitors,
    newCustomersThisMonth,
    customerRetentionRate: Number(customerRetentionRate.toFixed(1)),
    totalRevenue: totalSpent,
    analysisDate: new Date().toISOString()
  };
}

// ==================== HOURLY SALES PATTERN ====================
export function getHourlySalesPattern(
  transactions: Transaction[], 
  operatingHours: { open: number; close: number } = { open: 8, close: 21 }
) {
  const { open, close } = operatingHours;
  const hourlySales = new Map<number, { 
    revenue: number; 
    transactions: number;
    avgTicketSize: number;
  }>();
  
  for (let hour = open; hour <= close; hour++) {
    hourlySales.set(hour, { revenue: 0, transactions: 0, avgTicketSize: 0 });
  }
  
  let totalRevenue = 0;
  let totalTransactions = 0;
  
  const validTransactions = transactions.filter(t => {
    try {
      safeParseDate(t.date);
      return true;
    } catch {
      return false;
    }
  });
  
  validTransactions.forEach(transaction => {
    const hour = safeParseDate(transaction.date).getHours();
    const existing = hourlySales.get(hour);
    
    if (existing) {
      existing.revenue += transaction.total;
      existing.transactions += 1;
      existing.avgTicketSize = existing.revenue / existing.transactions;
      
      totalRevenue += transaction.total;
      totalTransactions += 1;
    }
  });
  
  const hourlyArray = Array.from(hourlySales.entries())
    .map(([hour, data]) => ({ hour, ...data }));
  
  const peakHour = hourlyArray
    .sort((a, b) => b.revenue - a.revenue)[0];
  
  const sortedByRevenue = hourlyArray.sort((a, b) => a.revenue - b.revenue);
  const slowHourCount = Math.max(1, Math.floor(hourlyArray.length * 0.25));
  const slowHours = sortedByRevenue.slice(0, slowHourCount);
  
  const avgHourlyRevenue = totalRevenue / (close - open + 1);
  const avgTransactionsPerHour = totalTransactions / (close - open + 1);
  
  const busyPeriods: Array<{ start: number; end: number; totalRevenue: number }> = [];
  let currentPeriod: { start: number; end: number; totalRevenue: number } | null = null;
  
  hourlyArray.sort((a, b) => a.hour - b.hour).forEach(({ hour, revenue }) => {
    if (revenue > avgHourlyRevenue * 1.5) {
      if (!currentPeriod) {
        currentPeriod = { start: hour, end: hour, totalRevenue: revenue };
      } else if (hour === currentPeriod.end + 1) {
        currentPeriod.end = hour;
        currentPeriod.totalRevenue += revenue;
      } else {
        busyPeriods.push(currentPeriod);
        currentPeriod = { start: hour, end: hour, totalRevenue: revenue };
      }
    } else if (currentPeriod) {
      busyPeriods.push(currentPeriod);
      currentPeriod = null;
    }
  });
  
  if (currentPeriod) {
    busyPeriods.push(currentPeriod);
  }
  
  return {
    hourlySales: hourlyArray,
    peakHour,
    slowHours,
    busyPeriods,
    totalRevenue,
    totalTransactions,
    avgHourlyRevenue: Number(avgHourlyRevenue.toFixed(0)),
    avgTransactionsPerHour: Number(avgTransactionsPerHour.toFixed(1)),
    operatingHours: { open, close },
    recommendations: generateHourlyRecommendations(hourlyArray, peakHour, slowHours)
  };
}

function generateHourlyRecommendations(
  hourlySales: Array<{ hour: number; revenue: number; transactions: number }>,
  peakHour: { hour: number; revenue: number } | null,
  slowHours: Array<{ hour: number; revenue: number }>
): string[] {
  const recommendations: string[] = [];
  
  if (peakHour && peakHour.revenue > 0) {
    recommendations.push(
      `🏆 Peak hour: ${peakHour.hour}:00 with ${formatCurrency(peakHour.revenue)} revenue`
    );
  }
  
  if (slowHours.length > 0 && slowHours[0].revenue === 0) {
    recommendations.push(
      `⏰ Consider closing or reducing staff during slow hours: ${slowHours.map(h => `${h.hour}:00`).join(', ')}`
    );
  }
  
  const lunchHours = hourlySales.filter(h => h.hour >= 11 && h.hour <= 14 && h.revenue > 0);
  const dinnerHours = hourlySales.filter(h => h.hour >= 17 && h.hour <= 20 && h.revenue > 0);
  
  if (lunchHours.length >= 2) {
    recommendations.push(
      `🍽️ Strong lunch rush detected (${lunchHours[0].hour}:00-${lunchHours[lunchHours.length-1].hour}:00)`
    );
  }
  
  if (dinnerHours.length >= 2) {
    recommendations.push(
      `🌙 Strong dinner rush detected (${dinnerHours[0].hour}:00-${dinnerHours[dinnerHours.length-1].hour}:00)`
    );
  }
  
  return recommendations;
}