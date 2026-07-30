import { useMemo, useState, useEffect } from 'react';
import { InteractionManager } from 'react-native';
import { appApi } from '../services/appApi';
import type { Product, Transaction, WasteLog, Customer } from '../types';
import { PresetKey, DateRange, getDateRange } from './useMobileSalesReport';
import { calculateDashboardMetrics, getTopProductsToday, DashboardMetrics } from '../utils/dashboardMetrics';

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
  const [isComputing, setIsComputing] = useState(true);
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
    
    cFrom.setHours(cFrom.getHours() - 1);
    cTo.setHours(cTo.getHours() + 1);

    return currentRange.start >= cFrom && currentRange.end <= cTo;
  }, [currentRange, cacheFrom, cacheTo, transactions.length]);

  const [localComputed, setLocalComputed] = useState<{
    localMetrics: DashboardMetrics | null;
    localTopProducts: any[];
  }>({
    localMetrics: null,
    localTopProducts: [],
  });

  // Defer local metrics computation until transition interactions finish!
  useEffect(() => {
    setIsComputing(true);
    const task = InteractionManager.runAfterInteractions(() => {
      const metrics = calculateDashboardMetrics(transactions, products, customers, wasteLogs);
      const topProducts = getTopProductsToday(transactions, products, 5);
      setLocalComputed({ localMetrics: metrics, localTopProducts: topProducts });
      setIsComputing(false);
    });

    return () => task.cancel();
  }, [isCovered, transactions, products, customers, wasteLogs]);

  // FETCH FROM SERVER
  const fetchRemote = async () => {
    if (isCovered && preset === 'today') return;
    
    setIsLoading(true);
    setError(null);
    try {
      const prevRange = getPrevRange(currentRange);
      const toLocalISODate = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      const startStr = toLocalISODate(currentRange.start);
      const endStr = toLocalISODate(currentRange.end);
      const prevStartStr = toLocalISODate(prevRange.start);
      const prevEndStr = toLocalISODate(prevRange.end);
      
      const isSingleDay = preset === 'today' || preset === 'yesterday';
      const granularity = isSingleDay ? 'hour' : 'day';

      const qs = `?from=${startStr}&to=${endStr}&prev_from=${prevStartStr}&prev_to=${prevEndStr}&granularity=${granularity}`;
      const res = await appApi.get(`/reports/dashboard${qs}`);
      setRemoteData(res);
    } catch (err: any) {
      // setError(err.message || 'Gagal memuat dashboard dari server');
      console.warn('[useDashboardMetrics] Failed to fetch remote dashboard, falling back to local:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isCovered || preset !== 'today') {
      fetchRemote();
    } else {
      setRemoteData(null);
      setError(null);
    }
  }, [isCovered, preset, currentRange]);

  const metrics: DashboardMetrics | null = useMemo(() => {
    if (isCovered && preset === 'today') {
      return localComputed.localMetrics;
    }
    if (remoteData?.metrics) {
      return remoteData.metrics;
    }
    return localComputed.localMetrics;
  }, [isCovered, preset, localComputed.localMetrics, remoteData]);

  const topProducts = useMemo(() => {
    if (isCovered && preset === 'today') {
      return localComputed.localTopProducts;
    }
    if (remoteData?.topProducts) {
      return remoteData.topProducts;
    }
    return localComputed.localTopProducts;
  }, [isCovered, preset, localComputed.localTopProducts, remoteData]);

  return {
    preset,
    setPreset,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    metrics,
    topProducts,
    topProductsToday: topProducts,
    rawData: { transactions, products, customers, wasteLogs },
    chartData: remoteData?.chartData || null,
    remoteChartData: remoteData?.chartData || null,
    isLoading: isLoading || isComputing,
    isComputing,
    error,
    refetch: fetchRemote,
    isCovered,
  };
}
