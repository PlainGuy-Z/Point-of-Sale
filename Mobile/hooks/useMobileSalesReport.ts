import { useMemo, useState, useEffect } from 'react';
import { Alert, InteractionManager } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { Transaction, Product } from '../types';
import { appApi } from '../services/appApi';

export type PresetKey = 'today' | 'yesterday' | '7days' | '30days' | 'month' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface SummaryData {
  totalRevenue: number;
  totalTransactions: number;
  avgTicket: number;
  netProfit: number;
  hasCostData: boolean;
  prevRevenue: number;
  prevTransactions: number;
  prevAvgTicket: number;
  prevNetProfit: number;
  revenueChange: number;
  transactionsChange: number;
  avgTicketChange: number;
  profitChange: number;
}

export interface HourlyData {
  hour: number;
  label: string;
  revenue: number;
  count: number;
}

export interface DailyData {
  date: string;
  label: string;
  revenue: number;
  count: number;
}

export interface ProductRank {
  name: string;
  qty: number;
  revenue: number;
  marginPct: number | null;
}

export interface PaymentBreakdown {
  method: string;
  count: number;
  revenue: number;
  pct: number;
}

export interface CashierPerformance {
  name: string;
  transactions: number;
  revenue: number;
  avgTicket: number;
}

export interface CostBreakdown {
  grossRevenue: number;
  cogs: number;
  netProfit: number;
  marginPct: number;
}

const emptySummary: SummaryData = {
  totalRevenue: 0, totalTransactions: 0, avgTicket: 0, netProfit: 0, hasCostData: false,
  prevRevenue: 0, prevTransactions: 0, prevAvgTicket: 0, prevNetProfit: 0,
  revenueChange: 0, transactionsChange: 0, avgTicketChange: 0, profitChange: 0
};

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function endOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}

export function getDateRange(preset: PresetKey, customStart?: Date, customEnd?: Date): DateRange {
  const now = new Date();
  switch (preset) {
    case 'today':
      return { start: startOfDay(now), end: now };
    case 'yesterday': {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { start: startOfDay(y), end: endOfDay(y) };
    }
    case '7days': {
      const s = new Date(now);
      s.setDate(s.getDate() - 6);
      return { start: startOfDay(s), end: now };
    }
    case '30days': {
      const s = new Date(now);
      s.setDate(s.getDate() - 29);
      return { start: startOfDay(s), end: now };
    }
    case 'month': {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: startOfDay(s), end: now };
    }
    case 'custom':
      return {
        start: customStart ? startOfDay(customStart) : startOfDay(now),
        end: customEnd ? endOfDay(customEnd) : now,
      };
  }
}

function getPrevRange(range: DateRange): DateRange {
  const durationMs = range.end.getTime() - range.start.getTime();
  const pEnd = new Date(range.start.getTime() - 1);
  const pStart = new Date(pEnd.getTime() - durationMs);
  return {
    start: startOfDay(pStart),
    end: endOfDay(pEnd),
  };
}

function filterTx(txs: Transaction[], range: DateRange): Transaction[] {
  return txs.filter((t) => {
    const txStatus = (t as any).status;
    if (txStatus === 'voided' || txStatus === 'pending_void') return false;
    const d = t.date instanceof Date ? t.date : new Date(t.date);
    return d >= range.start && d <= range.end;
  });
}

function pctChange(curr: number, prev: number): number {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}

export function useMobileSalesReport(
  transactions: Transaction[],
  products: Product[],
  cacheFrom?: string | null,
  cacheTo?: string | null
) {
  const [preset, setPreset] = useState<PresetKey>('today');
  const [customStart, setCustomStart] = useState<Date | undefined>(undefined);
  const [customEnd, setCustomEnd] = useState<Date | undefined>(undefined);

  const [remoteData, setRemoteData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isComputing, setIsComputing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const range = useMemo(() => getDateRange(preset, customStart, customEnd), [preset, customStart, customEnd]);
  const prevRange = useMemo(() => getPrevRange(range), [range]);

  const isCovered = useMemo(() => {
    if (!cacheFrom || !cacheTo) return transactions.length === 0;
    const cFrom = new Date(cacheFrom);
    const cTo = new Date(cacheTo);
    cFrom.setHours(cFrom.getHours() - 1);
    cTo.setHours(cTo.getHours() + 1);

    return range.start >= cFrom && range.end <= cTo;
  }, [range, cacheFrom, cacheTo, transactions.length]);

  const [localComputed, setLocalComputed] = useState<{
    filtered: Transaction[];
    localSummary: SummaryData;
    localHourlyData: HourlyData[];
    localDailyData: DailyData[];
    localTopProducts: ProductRank[];
    localPaymentBreakdown: PaymentBreakdown[];
    localCashierPerformance: CashierPerformance[];
    localCostBreakdown: CostBreakdown | null;
  }>({
    filtered: [],
    localSummary: emptySummary,
    localHourlyData: [],
    localDailyData: [],
    localTopProducts: [],
    localPaymentBreakdown: [],
    localCashierPerformance: [],
    localCostBreakdown: null,
  });

  const isSingleDay = preset === 'today' || preset === 'yesterday';

  // Defer heavy computations until transition interactions are complete!
  useEffect(() => {
    setIsComputing(true);
    const task = InteractionManager.runAfterInteractions(() => {
      const filtered = filterTx(transactions, range);
      const prevFiltered = filterTx(transactions, prevRange);

      const productMap = new Map<string, Product>();
      products.forEach((p) => productMap.set(p.id, p));

      const calcProfit = (txs: Transaction[]): { profit: number; hasCost: boolean } => {
        let profit = 0;
        let hasCost = false;
        txs.forEach((t) => {
          if (t.profit != null) {
            profit += t.profit;
            if (t.cost > 0) hasCost = true;
          } else {
            t.items.forEach((item) => {
              const p = productMap.get(item.productId);
              const cost = item.cost ?? p?.cost;
              if (cost != null) {
                hasCost = true;
                profit += item.quantity * (item.price - cost);
              }
            });
          }
        });
        return { profit, hasCost };
      };

      const totalRevenue = filtered.reduce((s, t) => s + (Number(t.total) || Number((t as any).total_amount) || 0), 0);
      const totalTransactions = filtered.length;
      const avgTicket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
      const { profit: netProfit, hasCost: hasCostData } = calcProfit(filtered);

      const prevRevenue = prevFiltered.reduce((s, t) => s + (Number(t.total) || Number((t as any).total_amount) || 0), 0);
      const prevTransactions = prevFiltered.length;
      const prevAvgTicket = prevTransactions > 0 ? prevRevenue / prevTransactions : 0;
      const { profit: prevNetProfit } = calcProfit(prevFiltered);

      const localSummary: SummaryData = {
        totalRevenue, totalTransactions, avgTicket, netProfit, hasCostData,
        prevRevenue, prevTransactions, prevAvgTicket, prevNetProfit,
        revenueChange: pctChange(totalRevenue, prevRevenue),
        transactionsChange: pctChange(totalTransactions, prevTransactions),
        avgTicketChange: pctChange(avgTicket, prevAvgTicket),
        profitChange: pctChange(netProfit, prevNetProfit),
      };

      let localHourlyData: HourlyData[] = [];
      if (isSingleDay) {
        const map = new Map<number, { revenue: number; count: number }>();
        for (let h = 8; h <= 22; h++) map.set(h, { revenue: 0, count: 0 });

        filtered.forEach((t) => {
          const d = t.date instanceof Date ? t.date : new Date(t.date);
          const h = d.getHours();
          const e = map.get(h) || { revenue: 0, count: 0 };
          e.revenue += (t.total || (t as any).total_amount || 0);
          e.count += 1;
          map.set(h, e);
        });

        localHourlyData = Array.from(map.entries())
          .sort(([a], [b]) => a - b)
          .map(([h, d]) => ({ hour: h, label: `${String(h).padStart(2, '0')}:00`, ...d }));
      }

      let localDailyData: DailyData[] = [];
      if (!isSingleDay) {
        const map = new Map<string, { revenue: number; count: number }>();
        filtered.forEach((t) => {
          const d = t.date instanceof Date ? t.date : new Date(t.date);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const key = `${year}-${month}-${day}`;
          const e = map.get(key) || { revenue: 0, count: 0 };
          e.revenue += (t.total || (t as any).total_amount || 0);
          e.count += 1;
          map.set(key, e);
        });

        localDailyData = Array.from(map.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, d]) => {
            const [year, month, day] = date.split('-').map(Number);
            const localDate = new Date(year, month - 1, day);
            let labelStr = preset === '7days'
              ? localDate.toLocaleDateString('id-ID', { weekday: 'short' })
              : localDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

            return { date, label: labelStr, ...d };
          });
      }

      const topMap = new Map<string, { name: string; qty: number; revenue: number; totalCost: number; hasCost: boolean }>();
      filtered.forEach((t) => {
        t.items.forEach((item) => {
          const id = item.productId;
          const p = productMap.get(id);
          const name = item.name || p?.name || id;

          if (id.startsWith('manual') || name.toLowerCase().includes('manual') || name.toLowerCase().includes('custom')) {
            return;
          }

          const e = topMap.get(id) || { name, qty: 0, revenue: 0, totalCost: 0, hasCost: false };
          e.qty += item.quantity;
          e.revenue += Number(item.quantity) * Number(item.price);
          const cost = item.cost ?? p?.cost;
          if (cost != null) {
            e.hasCost = true;
            e.totalCost += Number(item.quantity) * Number(cost);
          }
          topMap.set(id, e);
        });
      });

      const localTopProducts: ProductRank[] = Array.from(topMap.values())
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 10)
        .map((p) => ({
          name: p.name,
          qty: p.qty,
          revenue: p.revenue,
          marginPct: p.hasCost ? ((p.revenue - p.totalCost) / p.revenue) * 100 : null,
        }));

      const payMap = new Map<string, { count: number; revenue: number }>();
      filtered.forEach((t) => {
        const m = t.paymentMethod || 'cash';
        const e = payMap.get(m) || { count: 0, revenue: 0 };
        e.count += 1;
        e.revenue += (t.total || (t as any).total_amount || 0);
        payMap.set(m, e);
      });
      const totalPay = filtered.reduce((s, t) => s + (Number(t.total) || Number((t as any).total_amount) || 0), 0);
      const localPaymentBreakdown: PaymentBreakdown[] = Array.from(payMap.entries())
        .sort(([, a], [, b]) => b.revenue - a.revenue)
        .map(([method, d]) => ({
          method, ...d, pct: totalPay > 0 ? (d.revenue / totalPay) * 100 : 0,
        }));

      const cashMap = new Map<string, { transactions: number; revenue: number }>();
      filtered.forEach((t) => {
        const name = t.cashierName || 'Kasir';
        const e = cashMap.get(name) || { transactions: 0, revenue: 0 };
        e.transactions += 1;
        e.revenue += (t.total || (t as any).total_amount || 0);
        cashMap.set(name, e);
      });
      const localCashierPerformance: CashierPerformance[] = Array.from(cashMap.entries())
        .sort(([, a], [, b]) => b.revenue - a.revenue)
        .map(([name, d]) => ({
          name, ...d, avgTicket: d.transactions > 0 ? d.revenue / d.transactions : 0,
        }));

      let localCostBreakdown: CostBreakdown | null = null;
      if (localSummary.hasCostData) {
        const grossRevenue = localSummary.totalRevenue;
        let cogs = 0;
        filtered.forEach((t) => {
          if (t.cost != null) {
            cogs += t.cost;
          } else {
            t.items.forEach((item) => {
              const p = productMap.get(item.productId);
              const cost = item.cost ?? p?.cost;
              if (cost != null) cogs += item.quantity * cost;
            });
          }
        });
        const netProfit = grossRevenue - cogs;
        localCostBreakdown = {
          grossRevenue, cogs, netProfit,
          marginPct: grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0,
        };
      }

      setLocalComputed({
        filtered,
        localSummary,
        localHourlyData,
        localDailyData,
        localTopProducts,
        localPaymentBreakdown,
        localCashierPerformance,
        localCostBreakdown,
      });

      setIsComputing(false);
    });

    return () => task.cancel();
  }, [transactions, products, range, prevRange, isSingleDay, preset]);

  // Fetch from backend if NOT covered by local cache
  const fetchRemote = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fromStr = range.start.toISOString().slice(0, 10);
      const toStr = range.end.toISOString().slice(0, 10);
      const prev = getPrevRange(range);
      const pFromStr = prev.start.toISOString().slice(0, 10);
      const pToStr = prev.end.toISOString().slice(0, 10);
      const granularity = isSingleDay ? 'hour' : 'day';

      const qs = `?from=${fromStr}&to=${toStr}&prev_from=${pFromStr}&prev_to=${pToStr}&granularity=${granularity}`;
      const res = await appApi.get(`/reports/sales${qs}`);
      setRemoteData(res);
    } catch (err: any) {
      // setError(err.message || 'Gagal memuat laporan dari server');
      console.warn('[useMobileSalesReport] Failed to fetch remote report, falling back to local:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isCovered) {
      setRemoteData(null);
      setError(null);
      setIsLoading(false);
      return;
    }
    fetchRemote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCovered, range, preset]);

  // Combine Final Results
  const summary: SummaryData = isCovered ? localComputed.localSummary : (remoteData?.summary || localComputed.localSummary);
  const hourlyData: HourlyData[] = isCovered ? localComputed.localHourlyData : (remoteData?.granularity === 'hour' ? (remoteData?.chartData || []) : localComputed.localHourlyData);
  const dailyData: DailyData[] = isCovered ? localComputed.localDailyData : (remoteData?.granularity !== 'hour' ? (remoteData?.chartData || []) : localComputed.localDailyData);
  const topProducts: ProductRank[] = isCovered ? localComputed.localTopProducts : (remoteData?.topProducts || localComputed.localTopProducts);
  const paymentBreakdown: PaymentBreakdown[] = isCovered ? localComputed.localPaymentBreakdown : (remoteData?.paymentMethods || localComputed.localPaymentBreakdown);
  const cashierPerformance: CashierPerformance[] = isCovered ? localComputed.localCashierPerformance : (remoteData?.cashierPerformance || localComputed.localCashierPerformance);
  const costBreakdown: CostBreakdown | null = isCovered ? localComputed.localCostBreakdown : (remoteData?.costBreakdown || localComputed.localCostBreakdown);

  const peakHour = useMemo(() => {
    if (hourlyData.length === 0) return null;
    const sorted = [...hourlyData].sort((a, b) => b.revenue - a.revenue);
    if (sorted[0].revenue === 0) return null;
    return sorted[0];
  }, [hourlyData]);

  const exportCsvFile = async () => {
    if (!isCovered) {
      Alert.alert('Belum Didukung', 'Export CSV untuk laporan dari server belum tersedia.');
      return;
    }
    if (localComputed.filtered.length === 0) {
      Alert.alert('Data Kosong', 'Tidak ada data transaksi untuk diekspor.');
      return;
    }
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Tidak Tersedia', 'Fitur sharing tidak tersedia di perangkat ini.');
        return;
      }
      const esc = (cell: string | number) => `"${String(cell ?? '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;
      const head = ['Waktu', 'ID Transaksi', 'Kasir', 'Items', 'Subtotal', 'Pajak', 'Total', 'Metode Bayar'];
      const csvRows = [head.map(esc).join(',')];

      localComputed.filtered.forEach((t) => {
        const d = t.date instanceof Date ? t.date : new Date(t.date);
        const waktu = d.toLocaleString('id-ID');
        const items = t.items.map((i) => `${i.name || i.productId}x${i.quantity}`).join('; ');
        const subtotal = t.items.reduce((s, i) => s + (i.price * i.quantity), 0);
        const row = [waktu, t.id, t.cashierName || '-', items, subtotal, t.tax ?? 0, t.total, t.paymentMethod];
        csvRows.push(row.map(esc).join(','));
      });

      const csvContent = csvRows.join('\n');
      const filename = `Laporan_Penjualan_${preset}_${Date.now()}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Ekspor Laporan Penjualan (CSV)' });
    } catch (e: any) {
      Alert.alert('Gagal Ekspor', e.message || 'Terjadi kesalahan saat membagikan file CSV.');
    }
  };

  return {
    preset,
    setPreset,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    range,
    filtered: localComputed.filtered,
    summary,
    isSingleDay,
    hourlyData,
    dailyData,
    peakHour,
    topProducts,
    paymentBreakdown,
    cashierPerformance,
    costBreakdown,
    exportCsvFile,
    isLoading,
    isComputing,
    error,
    isCovered,
    refetch: fetchRemote,
  };
}
