// src/hooks/useDashboardMetrics.ts - PERBAIKAN
import { useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { 
  calculateDashboardMetrics, 
  getLast7DaysRevenue,
  getTopProductsToday,
  formatDateKey
} from '../utils/dashboardMetrics';
import { safeParseDate } from '../utils/analytics/helpers';

export const useDashboardMetrics = () => {
  const { products, transactions, customers, wasteLogs } = useApp();
  
  const metrics = useMemo(() => 
    calculateDashboardMetrics(transactions, products, customers, wasteLogs),
    [transactions, products, customers, wasteLogs]
  );
  
  const last7DaysRevenue = useMemo(() => 
    getLast7DaysRevenue(transactions),
    [transactions]
  );
  
  const topProductsToday = useMemo(() => {
    const todayStr = (() => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    })();
    
    // Filter transactions untuk hari ini
    const todayTransactions = transactions.filter(t => {
      try {
        const d = safeParseDate(t.date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}` === todayStr;
      } catch {
        return false;
      }
    });
    
    console.log('Dashboard Today Transactions:', {
      totalTransactions: transactions.length,
      todayTransactions: todayTransactions.length,
      todayStr,
      sampleTransaction: todayTransactions.length > 0 ? {
        date: todayTransactions[0].date,
        parsed: safeParseDate(todayTransactions[0].date).toLocaleString(),
        items: todayTransactions[0].items
      } : null
    });
    
    return getTopProductsToday(todayTransactions, products, 5);
  }, [transactions, products]);
  
  return {
    metrics,
    last7DaysRevenue,
    topProductsToday,
    rawData: { products, transactions, customers }
  };
};