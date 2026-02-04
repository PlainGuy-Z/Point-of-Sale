// src/hooks/useDashboardMetrics.ts - PERBAIKAN
import { useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { 
  calculateDashboardMetrics, 
  getLast7DaysRevenue,
  getTopProductsToday 
} from '../utils/dashboardMetrics';
import { safeParseDate } from '../utils/analytics/helpers';

// Helper untuk mendapatkan tanggal mulai hari ini (00:00:00 local time)
const getStartOfToday = (): Date => {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
};

// Helper untuk membandingkan tanggal (hanya date, tanpa time)
const isSameDate = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

export const useDashboardMetrics = () => {
  const { products, transactions, customers } = useApp();
  
  const metrics = useMemo(() => 
    calculateDashboardMetrics(transactions, products, customers),
    [transactions, products, customers]
  );
  
  const last7DaysRevenue = useMemo(() => 
    getLast7DaysRevenue(transactions),
    [transactions]
  );
  
  const topProductsToday = useMemo(() => {
    const startOfToday = getStartOfToday();
    
    // Filter transactions untuk hari ini
    const todayTransactions = transactions.filter(t => {
      try {
        const transactionDate = safeParseDate(t.date);
        return isSameDate(transactionDate, startOfToday);
      } catch {
        return false;
      }
    });
    
    console.log('Dashboard Today Transactions:', {
      totalTransactions: transactions.length,
      todayTransactions: todayTransactions.length,
      startOfToday: startOfToday.toLocaleString(),
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