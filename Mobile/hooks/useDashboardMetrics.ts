import { useMemo, useState, useEffect } from 'react';
import { appApi } from '../services/appApi';
import type { Product, Transaction, WasteLog, Customer } from '../types';
import { PresetKey, DateRange, getDateRange } from './useMobileSalesReport';
import { calculateDashboardMetrics, getTopProductsToday } from '../utils/dashboardMetrics';

function getPrevRange(range: DateRange): DateRange {
  const durationMs = range.end.getTime() - range.start.getTime();
  return {
    start: new Date(range.start.getTime() - durationMs),
    end: new Date(range.start.getTime() - 1),
  };
}

export function useDashboardMetrics(
  products: Product[],
  transactions: Transaction[],
  customers: Customer[],
  wasteLogs: WasteLog[],
  cacheFrom?: string | null,
  cacheTo?: string | null
) {
  const [preset, setPreset] = useState<PresetKey>('today');
  const [customStart, setCustomStart] = useState<Date | undefined>(undefined);
  const [customEnd, setCustomEnd] = useState<Date | undefined>(undefined);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remoteData, setRemoteData] = useState<any>(null);

  const currentRange = useMemo(
    () => getDateRange(preset, customStart, customEnd),
    [preset, customStart, customEnd]
  );

  const isCovered = useMemo(() => {
    if (!cacheFrom || !cacheTo) return transactions.length === 0;
    const cFrom = new Date(cacheFrom);
    const cTo = new Date(cacheTo);
    
    // Add 1 hour buffer to avoid timezone edge cases
    cFrom.setHours(cFrom.getHours() - 1);
    cTo.setHours(cTo.getHours() + 1);

    return currentRange.start >= cFrom && currentRange.end <= cTo;
  }, [currentRange, cacheFrom, cacheTo, transactions.length]);

  // LOCAL COMPUTATION
  const localMetrics = useMemo(() => {
    if (!isCovered) return null;
    // We still use calculateDashboardMetrics but it's hardcoded to "Today".
    // For now, if the preset is not 'today', this local calculation will be incorrect if we rely solely on it,
    // BUT the cache logic will likely force 'isCovered' to be false for 30 days anyway if cache is only 200 items.
    // If it is covered, we still return it to avoid breaking changes, but Dashboard should prefer remote if preset !== today.
    return calculateDashboardMetrics(transactions, products, customers, wasteLogs);
  }, [isCovered, transactions, products, customers, wasteLogs]);

  const localTopProducts = useMemo(() => {
    if (!isCovered) return [];
    return getTopProductsToday(transactions, products, 5);
  }, [isCovered, transactions, products]);

  // FETCH FROM SERVER
  const fetchRemote = async () => {
    if (isCovered && preset === 'today') return; // Safe to use local for today
    
    setIsLoading(true);
    setError(null);
    try {
      const prevRange = getPrevRange(currentRange);
      const startStr = currentRange.start.toISOString().slice(0, 10);
      const endStr = currentRange.end.toISOString().slice(0, 10);
      const prevStartStr = prevRange.start.toISOString().slice(0, 10);
      const prevEndStr = prevRange.end.toISOString().slice(0, 10);
      
      const isSingleDay = preset === 'today' || preset === 'yesterday';
      const granularity = isSingleDay ? 'hour' : 'day';

      const qs = `?from=${startStr}&to=${endStr}&prev_from=${prevStartStr}&prev_to=${prevEndStr}&granularity=${granularity}`;
      const res = await appApi.get(`/reports/dashboard${qs}`);
      setRemoteData(res);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat dashboard dari server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // If we're not covered, OR if it's a multi-day range (because local calculateDashboardMetrics is hardcoded to today)
    // we MUST fetch from remote to ensure correctness.
    if (!isCovered || preset !== 'today') {
      fetchRemote();
    } else {
      setRemoteData(null);
      setError(null);
    }
  }, [isCovered, currentRange, preset]);

  // MERGE RESULTS
  const isUsingRemote = (!isCovered || preset !== 'today') && remoteData;

  const finalMetrics = useMemo(() => {
    if (isUsingRemote && remoteData?.metrics) {
      // remoteData.metrics matches DashboardMetrics structure
      return {
        ...remoteData.metrics,
        // we still need lowStockProducts and outOfStockProducts from LOCAL products array,
        // because backend doesn't send the full product array objects for these lists.
        lowStockProducts: localMetrics?.lowStockProducts || [],
        outOfStockProducts: localMetrics?.outOfStockProducts || []
      };
    }
    return localMetrics;
  }, [isUsingRemote, remoteData, localMetrics]);

  const finalTopProducts = isUsingRemote ? (remoteData?.topProducts || []) : localTopProducts;
  const finalChartData = isUsingRemote ? (remoteData?.chartData || []) : null;

  return {
    metrics: finalMetrics,
    topProductsToday: finalTopProducts, // Keep old name for backward compatibility in UI
    chartData: finalChartData,
    rawData: { transactions },
    isLoading,
    error,
    isCovered: !isUsingRemote, // Expose to UI
    preset,
    setPreset,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    refetch: fetchRemote,
  };
}
