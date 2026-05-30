import { useMemo, useState } from 'react';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { Transaction, Product } from '../types';

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
    case 'month':
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
    case 'custom':
      return {
        start: customStart ? startOfDay(customStart) : startOfDay(now),
        end: customEnd ? endOfDay(customEnd) : now,
      };
  }
}

function getPrevRange(range: DateRange): DateRange {
  const durationMs = range.end.getTime() - range.start.getTime();
  return {
    start: new Date(range.start.getTime() - durationMs),
    end: new Date(range.start.getTime() - 1),
  };
}

function filterTx(txs: Transaction[], range: DateRange): Transaction[] {
  return txs.filter((t) => {
    // Only include successful/completed transactions
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
  products: Product[]
) {
  const [preset, setPreset] = useState<PresetKey>('today');
  const [customStart, setCustomStart] = useState<Date | undefined>(undefined);
  const [customEnd, setCustomEnd] = useState<Date | undefined>(undefined);

  const range = useMemo(() => getDateRange(preset, customStart, customEnd), [preset, customStart, customEnd]);
  const prevRange = useMemo(() => getPrevRange(range), [range]);
  const filtered = useMemo(() => filterTx(transactions, range), [transactions, range]);
  const prevFiltered = useMemo(() => filterTx(transactions, prevRange), [transactions, prevRange]);

  const productMap = useMemo(() => {
    const m = new Map<string, Product>();
    products.forEach((p) => m.set(p.id, p));
    return m;
  }, [products]);

  const calcProfit = (txs: Transaction[]): { profit: number; hasCost: boolean } => {
    let profit = 0;
    let hasCost = false;
    txs.forEach((t) => {
      // Use transaction profit if precalculated, otherwise fallback to item costs
      if (t.profit != null) {
        profit += t.profit;
        // Check if there's any cost data
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

  const summary: SummaryData = useMemo(() => {
    const totalRevenue = filtered.reduce((s, t) => s + (t.total || (t as any).total_amount || 0), 0);
    const totalTransactions = filtered.length;
    const avgTicket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const { profit: netProfit, hasCost: hasCostData } = calcProfit(filtered);

    const prevRevenue = prevFiltered.reduce((s, t) => s + (t.total || (t as any).total_amount || 0), 0);
    const prevTransactions = prevFiltered.length;
    const prevAvgTicket = prevTransactions > 0 ? prevRevenue / prevTransactions : 0;
    const { profit: prevNetProfit } = calcProfit(prevFiltered);

    return {
      totalRevenue,
      totalTransactions,
      avgTicket,
      netProfit,
      hasCostData,
      prevRevenue,
      prevTransactions,
      prevAvgTicket,
      prevNetProfit,
      revenueChange: pctChange(totalRevenue, prevRevenue),
      transactionsChange: pctChange(totalTransactions, prevTransactions),
      avgTicketChange: pctChange(avgTicket, prevAvgTicket),
      profitChange: pctChange(netProfit, prevNetProfit),
    };
  }, [filtered, prevFiltered, productMap]);

  const isSingleDay = preset === 'today' || preset === 'yesterday';

  const hourlyData: HourlyData[] = useMemo(() => {
    if (!isSingleDay) return [];
    const map = new Map<number, { revenue: number; count: number }>();
    
    // Initialize standard hours to keep the chart looking uniform
    for (let h = 8; h <= 22; h++) {
      map.set(h, { revenue: 0, count: 0 });
    }

    filtered.forEach((t) => {
      const d = t.date instanceof Date ? t.date : new Date(t.date);
      const h = d.getHours();
      const e = map.get(h) || { revenue: 0, count: 0 };
      e.revenue += (t.total || (t as any).total_amount || 0);
      e.count += 1;
      map.set(h, e);
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([h, d]) => ({ hour: h, label: `${String(h).padStart(2, '0')}:00`, ...d }));
  }, [filtered, isSingleDay]);

  const dailyData: DailyData[] = useMemo(() => {
    if (isSingleDay) return [];
    const map = new Map<string, { revenue: number; count: number }>();
    
    // 1. Pre-populate all dates in the range
    const current = new Date(range.start);
    const end = new Date(range.end);
    current.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    // Limit to max 60 days to prevent excessive rendering on mobile
    let daysCount = 0;
    while (current <= end && daysCount < 60) {
      const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
      map.set(key, { revenue: 0, count: 0 });
      current.setDate(current.getDate() + 1);
      daysCount++;
    }

    filtered.forEach((t) => {
      const d = t.date instanceof Date ? t.date : new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const e = map.get(key) || { revenue: 0, count: 0 };
      e.revenue += (t.total || (t as any).total_amount || 0);
      e.count += 1;
      map.set(key, e);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => {
        const [year, month, day] = date.split('-').map(Number);
        const localDate = new Date(year, month - 1, day);
        return {
          date,
          label: localDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
          ...d,
        };
      });
  }, [filtered, isSingleDay, range]);

  const peakHour = useMemo(() => {
    if (hourlyData.length === 0) return null;
    const sorted = [...hourlyData].sort((a, b) => b.revenue - a.revenue);
    if (sorted[0].revenue === 0) return null;
    return sorted[0];
  }, [hourlyData]);

  const topProducts: ProductRank[] = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number; totalCost: number; hasCost: boolean }>();
    filtered.forEach((t) => {
      t.items.forEach((item) => {
        const id = item.productId;
        const p = productMap.get(id);
        const name = item.name || p?.name || id;
        const e = map.get(id) || { name, qty: 0, revenue: 0, totalCost: 0, hasCost: false };
        e.qty += item.quantity;
        e.revenue += item.quantity * item.price;
        const cost = item.cost ?? p?.cost;
        if (cost != null) {
          e.hasCost = true;
          e.totalCost += item.quantity * cost;
        }
        map.set(id, e);
      });
    });
    return Array.from(map.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10)
      .map((p) => ({
        name: p.name,
        qty: p.qty,
        revenue: p.revenue,
        marginPct: p.hasCost ? ((p.revenue - p.totalCost) / p.revenue) * 100 : null,
      }));
  }, [filtered, productMap]);

  const paymentBreakdown: PaymentBreakdown[] = useMemo(() => {
    const map = new Map<string, { count: number; revenue: number }>();
    filtered.forEach((t) => {
      const m = t.paymentMethod || 'cash';
      const e = map.get(m) || { count: 0, revenue: 0 };
      e.count += 1;
      e.revenue += (t.total || (t as any).total_amount || 0);
      map.set(m, e);
    });
    const total = filtered.reduce((s, t) => s + (t.total || (t as any).total_amount || 0), 0);
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .map(([method, d]) => ({
        method,
        ...d,
        pct: total > 0 ? (d.revenue / total) * 100 : 0,
      }));
  }, [filtered]);

  const cashierPerformance: CashierPerformance[] = useMemo(() => {
    const map = new Map<string, { transactions: number; revenue: number }>();
    filtered.forEach((t) => {
      const name = t.cashierName || 'Kasir';
      const e = map.get(name) || { transactions: 0, revenue: 0 };
      e.transactions += 1;
      e.revenue += (t.total || (t as any).total_amount || 0);
      map.set(name, e);
    });
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .map(([name, d]) => ({
        name,
        ...d,
        avgTicket: d.transactions > 0 ? d.revenue / d.transactions : 0,
      }));
  }, [filtered]);

  const costBreakdown: CostBreakdown | null = useMemo(() => {
    if (!summary.hasCostData) return null;
    const grossRevenue = summary.totalRevenue;
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
    return {
      grossRevenue,
      cogs,
      netProfit,
      marginPct: grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0,
    };
  }, [filtered, summary, productMap]);

  const exportCsvFile = async () => {
    if (filtered.length === 0) {
      Alert.alert('Data Kosong', 'Tidak ada data transaksi untuk diekspor.');
      return;
    }
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Tidak Tersedia', 'Fitur sharing tidak tersedia di perangkat ini.');
        return;
      }

      const esc = (cell: string) => `"${String(cell ?? '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;
      const head = ['Waktu', 'ID Transaksi', 'Kasir', 'Items', 'Subtotal', 'Pajak', 'Total', 'Metode Bayar'];
      const csvRows = [head.map(esc).join(',')];

      filtered.forEach((t) => {
        const d = t.date instanceof Date ? t.date : new Date(t.date);
        const waktu = d.toLocaleString('id-ID');
        const items = t.items.map((i) => `${i.name || i.productId}x${i.quantity}`).join('; ');
        const subtotal = t.items.reduce((s, i) => s + (i.price * i.quantity), 0);
        const tax = (t.total || (t as any).total_amount || 0) - subtotal;
        csvRows.push([
          esc(waktu),
          esc(t.id),
          esc(t.cashierName || '-'),
          esc(items),
          esc(String(subtotal)),
          esc(String(Math.max(0, tax))),
          esc(String(t.total || (t as any).total_amount || 0)),
          esc(t.paymentMethod),
        ].join(','));
      });

      const csvContent = csvRows.join('\r\n');
      const nowStr = new Date().toISOString().slice(0, 10);
      const filename = `laporan-${preset}-${nowStr}.csv`;
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Export Laporan Penjualan' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal mengekspor laporan.';
      Alert.alert('Ekspor Gagal', msg);
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
    filtered,
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
  };
}
