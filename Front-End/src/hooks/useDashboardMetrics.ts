// src/hooks/useDashboardMetrics.ts - PERBAIKAN
import { useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { 
  calculateDashboardMetrics, 
  getLast7DaysRevenue,
  getTopProductsToday,
  formatDateKey
} from '../utils/dashboardMetrics';
import { transactionLocalDateKey, localDateKey } from '../utils/analytics/helpers';

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
    const todayStr = localDateKey(new Date());
    const todayTransactions = transactions.filter(
      (t) => transactionLocalDateKey(t.date) === todayStr
    );
    return getTopProductsToday(todayTransactions, products, 5);
  }, [transactions, products]);
  
  return {
    metrics,
    last7DaysRevenue,
    topProductsToday,
    rawData: { products, transactions, customers }
  };
};