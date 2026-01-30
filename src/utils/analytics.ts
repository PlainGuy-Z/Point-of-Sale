import type { Transaction, WasteLog, Product } from '../types';

export function getTopProducts(transactions: Transaction[], limit: number = 5) {
  const productSales: Record<string, { quantity: number; revenue: number; profit: number }> = {};
  
  transactions.forEach(t => {
    t.items.forEach(item => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = { quantity: 0, revenue: 0, profit: 0 };
      }
      productSales[item.productId].quantity += item.quantity;
      productSales[item.productId].revenue += item.price * item.quantity;
      productSales[item.productId].profit += (item.price - item.cost) * item.quantity;
    });
  });
  
  return Object.entries(productSales)
    .sort((a, b) => b[1].quantity - a[1].quantity)
    .slice(0, limit);
}

export function analyzeWasteTrends(wasteLogs: WasteLog[]) {
  const byReason: Record<string, number> = {};
  const byProduct: Record<string, number> = {};
  const byDay: Record<string, number> = {};
  
  wasteLogs.forEach(waste => {
    const date = new Date(waste.date).toDateString();
    byReason[waste.reason] = (byReason[waste.reason] || 0) + waste.costLoss;
    byProduct[waste.productName] = (byProduct[waste.productName] || 0) + waste.costLoss;
    byDay[date] = (byDay[date] || 0) + waste.costLoss;
  });
  
  return {
    byReason: Object.entries(byReason).sort((a, b) => b[1] - a[1]),
    byProduct: Object.entries(byProduct).sort((a, b) => b[1] - a[1]),
    byDay: Object.entries(byDay).sort((a, b) => b[1] - a[1]),
    totalLoss: wasteLogs.reduce((sum, w) => sum + w.costLoss, 0),
    avgDailyLoss: wasteLogs.length > 0 
      ? wasteLogs.reduce((sum, w) => sum + w.costLoss, 0) / 30 // assume 30 days
      : 0,
  };
}

export function getBusinessHealth(transactions: Transaction[], wasteLoss: number) {
  const last7Days = transactions.filter(t => {
    const date = new Date(t.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return date >= weekAgo;
  });
  
  const weeklyRevenue = last7Days.reduce((sum, t) => sum + t.total, 0);
  const weeklyProfit = last7Days.reduce((sum, t) => sum + t.profit, 0);
  const profitMargin = weeklyRevenue > 0 ? (weeklyProfit / weeklyRevenue) * 100 : 0;
  const wastePercentage = weeklyRevenue > 0 ? (wasteLoss / weeklyRevenue) * 100 : 0;
  
  let healthScore = 100;
  healthScore -= Math.max(0, (50 - profitMargin) * 2); // Penalty for low margin
  healthScore -= wastePercentage * 5; // Penalty for waste
  healthScore = Math.max(0, Math.min(100, healthScore));
  
  let healthStatus: 'excellent' | 'good' | 'fair' | 'poor';
  if (healthScore >= 80) healthStatus = 'excellent';
  else if (healthScore >= 60) healthStatus = 'good';
  else if (healthScore >= 40) healthStatus = 'fair';
  else healthStatus = 'poor';
  
  return {
    weeklyRevenue,
    weeklyProfit,
    profitMargin,
    wastePercentage,
    healthScore,
    healthStatus,
    transactionsCount: last7Days.length,
    avgTicketSize: last7Days.length > 0 ? weeklyRevenue / last7Days.length : 0,
  };
}

export function analyzeCustomerBehavior(transactions: Transaction[]) {
  const customerSpending: Record<string, number> = {};
  const customerFrequency: Record<string, number> = {};
  const customerLastVisit: Record<string, Date> = {};
  
  transactions.forEach(t => {
    if (t.customerId) {
      customerSpending[t.customerId] = (customerSpending[t.customerId] || 0) + t.total;
      customerFrequency[t.customerId] = (customerFrequency[t.customerId] || 0) + 1;
      if (!customerLastVisit[t.customerId] || new Date(t.date) > customerLastVisit[t.customerId]) {
        customerLastVisit[t.customerId] = new Date(t.date);
      }
    }
  });
  
  const customers = Object.keys(customerSpending);
  const avgSpending = customers.length > 0 
    ? Object.values(customerSpending).reduce((a, b) => a + b, 0) / customers.length 
    : 0;
  
  const topSpenders = Object.entries(customerSpending)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  const frequentVisitors = Object.entries(customerFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  return {
    totalCustomers: customers.length,
    avgSpending,
    topSpenders,
    frequentVisitors,
    customerSpending,
    customerFrequency,
    customerLastVisit,
  };
}

export function getHourlySalesPattern(transactions: Transaction[]) {
  const hourlySales: Record<number, { revenue: number; transactions: number }> = {};
  
  // Initialize all hours
  for (let i = 8; i <= 21; i++) {
    hourlySales[i] = { revenue: 0, transactions: 0 };
  }
  
  transactions.forEach(t => {
    const hour = new Date(t.date).getHours();
    if (hourlySales[hour]) {
      hourlySales[hour].revenue += t.total;
      hourlySales[hour].transactions += 1;
    }
  });
  
  const peakHour = Object.entries(hourlySales)
    .sort((a, b) => b[1].revenue - a[1].revenue)[0];
  
  const slowHours = Object.entries(hourlySales)
    .filter(([, data]) => data.revenue < 100000)
    .map(([hour]) => Number(hour));
  
  return {
    hourlySales,
    peakHour: peakHour ? { hour: Number(peakHour[0]), ...peakHour[1] } : null,
    slowHours,
    totalRevenue: Object.values(hourlySales).reduce((sum, data) => sum + data.revenue, 0),
    totalTransactions: Object.values(hourlySales).reduce((sum, data) => sum + data.transactions, 0),
  };
}