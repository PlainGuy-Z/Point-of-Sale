import { useMemo } from 'react';
import {
  calculateDashboardMetrics,
  getTopProductsToday,
} from '../utils/dashboardMetrics';
import { transactionLocalDateKey, localDateKey } from '../utils/analytics/helpers';
import type { Product, Transaction, WasteLog, Customer } from '../types';

export function useDashboardMetrics(
  products: Product[],
  transactions: Transaction[],
  customers: Customer[],
  wasteLogs: WasteLog[]
) {
  const metrics = useMemo(
    () => calculateDashboardMetrics(transactions, products, customers, wasteLogs),
    [transactions, products, customers, wasteLogs]
  );
  
  const topProductsToday = useMemo(() => {
    const todayStr = localDateKey(new Date());
    const todayTx = transactions.filter(
      t => transactionLocalDateKey(t.date) === todayStr
    );
    return getTopProductsToday(todayTx, products, 5);
  }, [transactions, products]);

  return { metrics, topProductsToday, rawData: { transactions } };
}
