import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  StyleSheet,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BarChart2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Calendar,
  Download,
  Info,
  ChevronLeft,
  ChevronRight,
  Wallet,
  ShoppingCart,
  Receipt,
  Award,
  Clock,
  PieChart,
  X,
} from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { formatRupiah, formatRupiahShort } from '../../utils/currency';
import { formatDate, formatDateTime } from '../../utils/dateFormatter';
import { useApp } from '../../contexts/AppContext';
import { useMobileSalesReport, PresetKey } from '../../hooks/useMobileSalesReport';
import TransactionDetailSheet from '../transactions/TransactionDetailSheet';
import type { Transaction } from '../../types';
import type { HistoryTransaction } from '../../types/historyTransaction';

const medals = ['🥇', '🥈', '🥉'];
const payLabels: Record<string, string> = { cash: 'Cash', card: 'Kartu', qris: 'QRIS', transfer: 'Transfer' };

function mapTransactionToHistory(t: Transaction): HistoryTransaction {
  return {
    id: t.id,
    created_at: typeof t.date === 'string' ? t.date : (t.date instanceof Date ? t.date.toISOString() : new Date(t.date).toISOString()),
    status: 'completed',
    cashier_id: null,
    cashier_name: t.cashierName || '-',
    customer_id: t.customerId || null,
    customer_name: t.customerName || 'Umum',
    table_number: t.tableNumber || null,
    order_type: t.orderType === 'take-away' ? 'takeaway' : 'dine_in',
    subtotal: t.subtotal ?? t.total,
    discount_amount: 0,
    tax_amount: t.tax ?? 0,
    tax_rate: t.taxRate ?? 0,
    service_charge: t.service_charge ?? 0,
    service_amount: t.service_charge ?? 0,
    total_amount: t.total,
    payment_method: (t.paymentMethod === 'cash' ? 'Cash' : t.paymentMethod === 'qris' ? 'QRIS' : 'Transfer') as any,
    amount_paid: t.cashReceived ?? t.total,
    change_amount: t.change ?? 0,
    raw_payment_method: t.paymentMethod,
    items: (t.items || []).map(item => ({
      product_id: item.productId,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      subtotal: (item.price + (item.variantPrice || 0)) * item.quantity,
      variant_name: item.variantName || null,
      variant_price: item.variantPrice || null,
      notes: item.note || null,
    })),
    notes: t.notes || null,
  };
}

export default function SalesReportScreen() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscape = windowWidth > windowHeight;
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);
  const router = useRouter();
  const { transactions, products, isServiceLoading, transactionsCacheFrom, transactionsCacheTo } = useApp();

  const {
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
    isLoading,
    error,
    isCovered,
    refetch,
  } = useMobileSalesReport(transactions, products, transactionsCacheFrom, transactionsCacheTo);

  // UI state
  const [tab, setTab] = useState<'products' | 'payment' | 'cashier'>('products');
  const [showTxList, setShowTxList] = useState(false);
  const [txPage, setTxPage] = useState(1);
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<HistoryTransaction | null>(null);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(null);

  // Calendar states
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [tempStart, setTempStart] = useState<Date | undefined>(customStart);
  const [tempEnd, setTempEnd] = useState<Date | undefined>(customEnd);

  // Pagination for transaction list
  const txPerPage = 20;
  const totalPages = Math.max(1, Math.ceil(filtered.length / txPerPage));
  
  const pagedTx = useMemo(() => {
    return [...filtered]
      .sort((a, b) => {
        const da = a.date instanceof Date ? a.date : new Date(a.date);
        const db = b.date instanceof Date ? b.date : new Date(b.date);
        return db.getTime() - da.getTime();
      })
      .slice((txPage - 1) * txPerPage, txPage * txPerPage);
  }, [filtered, txPage]);

  // Sync temp dates when calendar modal opens
  const openCalendar = () => {
    setTempStart(customStart || new Date());
    setTempEnd(customEnd);
    setCurrentYear((customStart || new Date()).getFullYear());
    setCurrentMonth((customStart || new Date()).getMonth());
    setCalendarVisible(true);
  };

  const saveCustomDates = () => {
    if (tempStart) {
      setCustomStart(tempStart);
      setCustomEnd(tempEnd || tempStart);
      setPreset('custom');
      setTxPage(1);
    }
    setCalendarVisible(false);
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handleSelectDay = (day: number) => {
    const clickedDate = new Date(currentYear, currentMonth, day);
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(clickedDate);
      setTempEnd(undefined);
    } else if (tempStart && !tempEnd) {
      if (clickedDate < tempStart) {
        setTempStart(clickedDate);
      } else {
        setTempEnd(clickedDate);
      }
    }
  };

  const prevCalendarMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextCalendarMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const PRESETS: { key: PresetKey; label: string }[] = [
    { key: 'today', label: 'Hari Ini' },
    { key: 'yesterday', label: 'Kemarin' },
    { key: '7days', label: '7 Hari' },
    { key: '30days', label: '30 Hari' },
    { key: 'month', label: 'Bulan Ini' },
    { key: 'custom', label: 'Custom' },
  ];

  const changeStyle = (val: number) => {
    const isPos = val >= 0;
    const isNeutral = val === 100 || val === 0;
    
    if (isNeutral) {
      return {
        bg: isDark ? 'rgba(245,158,11,0.1)' : '#fef3c7',
        color: isDark ? '#fbbf24' : '#b45309',
        icon: TrendingUp,
      };
    }
    return {
      bg: isPos ? (isDark ? 'rgba(16,185,129,0.1)' : '#d1fae5') : (isDark ? 'rgba(239,68,68,0.1)' : '#fee2e2'),
      color: isPos ? (isDark ? '#34d399' : '#047857') : (isDark ? '#f87171' : '#b91c1c'),
      icon: isPos ? TrendingUp : TrendingDown,
    };
  };

  // ── Render Card ──
  const summaryCards = useMemo(() => {
    const list = [
      {
        label: 'Total Omzet',
        value: formatRupiah(summary.totalRevenue),
        change: summary.revenueChange,
        icon: DollarSign,
        iconBg: isDark ? 'rgba(245,158,11,0.12)' : 'rgba(13,148,136,0.1)',
        iconColor: c.accent,
      },
      {
        label: 'Jumlah Transaksi',
        value: String(summary.totalTransactions),
        change: summary.transactionsChange,
        icon: ShoppingCart,
        iconBg: 'rgba(20,184,166,0.12)',
        iconColor: '#14b8a6',
      },
      {
        label: 'Rata-rata Tiket',
        value: formatRupiah(Math.round(summary.avgTicket)),
        change: summary.avgTicketChange,
        icon: Receipt,
        iconBg: 'rgba(59,130,246,0.12)',
        iconColor: '#3b82f6',
      },
      {
        label: summary.hasCostData ? 'Net Profit' : 'Gross Revenue',
        value: formatRupiah(summary.hasCostData ? summary.netProfit : summary.totalRevenue),
        change: summary.hasCostData ? summary.profitChange : summary.revenueChange,
        icon: Wallet,
        iconBg: 'rgba(16,185,129,0.12)',
        iconColor: '#10b981',
      },
    ];
    return list;
  }, [summary, isDark, c]);

  // Chart data setup
  const chartData = isSingleDay ? hourlyData : dailyData;
  const maxRevenue = useMemo(() => {
    return Math.max(...chartData.map(d => d.revenue), 1000);
  }, [chartData]);

  // Color mappings for margins
  const marginColor = (pct: number | null) => {
    if (pct == null) return c.textMuted;
    if (pct > 70) return '#10b981';
    if (pct >= 40) return '#14b8a6';
    return '#ef4444';
  };

  const payMethodBadge = (method: string) => {
    const m = method?.toLowerCase();
    if (m === 'cash') return { bg: isDark ? 'rgba(16,185,129,0.12)' : '#d1fae5', text: isDark ? '#34d399' : '#065f46' };
    if (m === 'qris') return { bg: isDark ? 'rgba(59,130,246,0.12)' : '#dbeafe', text: isDark ? '#60a5fa' : '#1e40af' };
    if (m === 'card') return { bg: isDark ? 'rgba(139,92,246,0.12)' : '#f3e8ff', text: isDark ? '#a78bfa' : '#6b21a8' };
    return { bg: c.bgInput, text: c.textSecondary };
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      {/* HEADER SECTION */}
      <View style={{
        flexDirection: isLandscape ? 'row' : 'column',
        justifyContent: 'space-between',
        alignItems: isLandscape ? 'center' : 'stretch',
        paddingLeft: isLandscape ? 16 : 60,
        paddingRight: 16,
        paddingVertical: 12,
        gap: 10,
      }}>
        <View>
          <Text style={{ color: c.text, fontSize: 22, fontWeight: '900' }}>
            Laporan <Text style={{ color: c.accent }}>Penjualan</Text>
          </Text>
          <Text style={{ color: c.textSecondary, fontSize: 11, marginTop: 3, flexDirection: 'row', alignItems: 'center' }}>
            <Clock size={11} color={c.textMuted} /> Terakhir diperbarui: {new Date().toLocaleTimeString('id-ID')}
            {!isCovered && !isLoading && !error && (
              <Text style={{ color: c.accent, fontWeight: '800' }}> (Data Server)</Text>
            )}
          </Text>
        </View>
        <TouchableOpacity
          onPress={exportCsvFile}
          activeOpacity={0.7}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: c.bgCard,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 10,
            alignSelf: isLandscape ? 'auto' : 'flex-end',
          }}
        >
          <Download size={15} color={c.textSecondary} />
          <Text style={{ color: c.textSecondary, fontSize: 13, fontWeight: '700' }}>Export CSV</Text>
        </TouchableOpacity>
      </View>

      {/* BODY CONTENT */}
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={c.accent} />
          <Text style={{ color: c.textSecondary, fontSize: 14, marginTop: 12 }}>Memuat data laporan...</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: c.error, fontSize: 14, textAlign: 'center' }}>{error}</Text>
          <TouchableOpacity onPress={refetch} style={{ marginTop: 16, backgroundColor: c.accent, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* DATE FILTER CHIPS */}
          <View style={{
            marginHorizontal: 16,
            backgroundColor: c.bgCard,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 16,
            padding: 6,
            marginBottom: 16,
          }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6 }}>
              {PRESETS.map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => {
                    if (opt.key === 'custom') {
                      openCalendar();
                    } else {
                      setPreset(opt.key);
                      setTxPage(1);
                    }
                  }}
                  style={{
                    backgroundColor: preset === opt.key ? c.accent : 'transparent',
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                  }}
                >
                  <Text style={{
                    color: preset === opt.key ? '#fff' : c.textSecondary,
                    fontSize: 13,
                    fontWeight: preset === opt.key ? '700' : '600',
                  }}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {preset === 'custom' && customStart && (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 8,
                paddingTop: 8,
                borderTopWidth: 1,
                borderTopColor: c.border,
                paddingHorizontal: 8,
              }}>
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                  <Calendar size={14} color={c.accent} />
                  <Text style={{ color: c.text, fontSize: 12, fontWeight: '700' }}>
                    {formatDate(customStart, 'YYYY-MM-DD')} — {customEnd ? formatDate(customEnd, 'YYYY-MM-DD') : formatDate(customStart, 'YYYY-MM-DD')}
                  </Text>
                </View>
                <TouchableOpacity onPress={openCalendar}>
                  <Text style={{ color: c.accent, fontSize: 12, fontWeight: '800' }}>Ubah</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* SUMMARY CARDS */}
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            {isLandscape ? (
              // Tablet / Landscape grid
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {summaryCards.map((card, idx) => {
                  const chg = changeStyle(card.change);
                  return (
                    <View key={idx} style={{
                      flex: 1,
                      backgroundColor: c.bgCard,
                      borderWidth: 1,
                      borderColor: c.border,
                      borderRadius: 16,
                      padding: 14,
                      gap: 8,
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: card.iconBg, alignItems: 'center', justifyContent: 'center' }}>
                          <card.icon size={15} color={card.iconColor} />
                        </View>
                        <Text style={{ color: c.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 }} numberOfLines={1}>
                          {card.label}
                        </Text>
                      </View>
                      <Text style={{ color: c.text, fontSize: 16, fontWeight: '900', fontFamily: 'monospace' }} numberOfLines={1}>
                        {card.value}
                      </Text>
                      <View style={{ alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: chg.bg, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <chg.icon size={9} color={chg.color} />
                        <Text style={{ color: chg.color, fontSize: 10, fontWeight: '800' }}>
                          {Math.abs(card.change).toFixed(1)}%
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              // Mobile 2x2 grid
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {summaryCards.map((card, idx) => {
                  const chg = changeStyle(card.change);
                  return (
                    <View key={idx} style={{
                      width: '48%',
                      flexGrow: 1,
                      backgroundColor: c.bgCard,
                      borderWidth: 1,
                      borderColor: c.border,
                      borderRadius: 16,
                      padding: 12,
                      gap: 6,
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: card.iconBg, alignItems: 'center', justifyContent: 'center' }}>
                          <card.icon size={12} color={card.iconColor} />
                        </View>
                        <Text style={{ color: c.textSecondary, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.2 }} numberOfLines={1}>
                          {card.label}
                        </Text>
                      </View>
                      <Text style={{ color: c.text, fontSize: 15, fontWeight: '900', fontFamily: 'monospace' }} numberOfLines={1}>
                        {card.value}
                      </Text>
                      <View style={{ alignSelf: 'flex-start', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6, backgroundColor: chg.bg, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                        <chg.icon size={8} color={chg.color} />
                        <Text style={{ color: chg.color, fontSize: 9, fontWeight: '800' }}>
                          {Math.abs(card.change).toFixed(1)}%
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* CUSTOM BAR CHART */}
          <View style={{
            marginHorizontal: 16,
            backgroundColor: c.bgCard,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <View>
                <Text style={{ color: c.text, fontSize: 15, fontWeight: '800' }}>
                  {isSingleDay ? 'Distribusi Penjualan per Jam' : 'Penjualan Harian'}
                </Text>
                <Text style={{ color: c.textSecondary, fontSize: 11, marginTop: 2 }}>
                  {isSingleDay ? 'Melihat tren jam padat operasional' : 'Tren omzet harian periode terpilih'}
                </Text>
              </View>
            </View>

            {isSingleDay && peakHour && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: isDark ? 'rgba(245,158,11,0.06)' : '#fffbeb',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(245,158,11,0.2)' : '#fef3c7',
                borderRadius: 10,
                padding: 10,
                marginBottom: 14,
              }}>
                <Clock size={14} color={c.accent} />
                <Text style={{ color: c.text, fontSize: 11, fontWeight: '600' }}>
                  Jam tersibuk di jam <Text style={{ color: c.accent, fontWeight: '800' }}>{peakHour.label}</Text> dengan omzet <Text style={{ color: c.accent, fontWeight: '800' }}>{formatRupiah(peakHour.revenue)}</Text>
                </Text>
              </View>
            )}

            {chartData.length === 0 ? (
              <View style={{ height: 160, justifyContent: 'center', alignItems: 'center' }}>
                <BarChart2 size={36} color={c.textMuted} strokeWidth={1.5} />
                <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 8 }}>Belum ada data penjualan grafik</Text>
              </View>
            ) : (
              <View>
                {chartData.length > 7 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 4, paddingRight: 10 }}>
                    <Text style={{ color: c.textMuted, fontSize: 10, fontStyle: 'italic' }}>← Geser untuk melihat selengkapnya →</Text>
                  </View>
                )}
                <ScrollView horizontal showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 14, paddingRight: 10, alignItems: 'flex-end', height: 160 }}>
                  {chartData.map((d, index) => {
                    const barHeight = maxRevenue > 0 ? (d.revenue / maxRevenue) * 110 : 0;
                    const isSelected = selectedBarIndex === index;
                    return (
                      <TouchableOpacity
                        key={index}
                        onPress={() => setSelectedBarIndex(isSelected ? null : index)}
                        activeOpacity={0.8}
                        style={{ alignItems: 'center', minWidth: chartData.length > 7 ? 56 : (windowWidth - 80) / chartData.length }}
                      >
                        {isSelected && (
                          <Text style={{ color: c.accent, fontSize: 9, fontWeight: '900', marginBottom: 4, fontFamily: 'monospace' }}>
                            {formatRupiahShort(d.revenue)}
                          </Text>
                        )}
                        <View style={{
                          width: 22,
                          height: Math.max(6, barHeight),
                          backgroundColor: isSelected ? c.accent : (isDark ? 'rgba(245,158,11,0.25)' : 'rgba(13,148,136,0.3)'),
                          borderColor: isSelected ? c.accent : (isDark ? 'rgba(245,158,11,0.4)' : 'rgba(13,148,136,0.5)'),
                          borderWidth: 1,
                          borderTopLeftRadius: 6,
                          borderTopRightRadius: 6,
                          borderBottomLeftRadius: 2,
                          borderBottomRightRadius: 2,
                        }} />
                        <Text style={{ color: isSelected ? c.text : c.textSecondary, fontSize: 9, fontWeight: isSelected ? '800' : '500', marginTop: 6 }}>
                          {d.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {selectedBarIndex !== null && chartData[selectedBarIndex] && (
                  <View style={{
                    marginTop: 12,
                    padding: 10,
                    backgroundColor: c.bgInput,
                    borderRadius: 10,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <View>
                      <Text style={{ color: c.textMuted, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' }}>Periode / Jam</Text>
                      <Text style={{ color: c.text, fontSize: 13, fontWeight: '700', marginTop: 2 }}>{chartData[selectedBarIndex].label}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: c.accent, fontSize: 13, fontWeight: '800', fontFamily: 'monospace' }}>
                        {formatRupiah(chartData[selectedBarIndex].revenue)}
                      </Text>
                      <Text style={{ color: c.textSecondary, fontSize: 10, marginTop: 2 }}>
                        {chartData[selectedBarIndex].count} transaksi
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* DETAIL TABS SECTION */}
          <View style={{
            marginHorizontal: 16,
            backgroundColor: c.bgCard,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 20,
            overflow: 'hidden',
            marginBottom: 16,
          }}>
            {/* Tabs Selector */}
            <View style={{
              flexDirection: 'row',
              borderBottomWidth: 1,
              borderBottomColor: c.border,
              backgroundColor: c.bgInput,
            }}>
              {[
                { key: 'products' as const, label: 'Produk Terlaris' },
                { key: 'payment' as const, label: 'Metode Bayar' },
                { key: 'cashier' as const, label: 'Per Kasir' },
              ].map(t => {
                const isActive = tab === t.key;
                return (
                  <TouchableOpacity
                    key={t.key}
                    onPress={() => setTab(t.key)}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      alignItems: 'center',
                      borderBottomWidth: 2,
                      borderBottomColor: isActive ? c.accent : 'transparent',
                    }}
                  >
                    <Text style={{
                      color: isActive ? c.text : c.textSecondary,
                      fontSize: 12,
                      fontWeight: '800',
                    }}>{t.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Tab content */}
            <View style={{ padding: 14 }}>
              {/* Top Products */}
              {tab === 'products' && (
                topProducts.length === 0 ? (
                  <Text style={{ color: c.textSecondary, textAlign: 'center', paddingVertical: 20, fontSize: 13 }}>Belum ada data produk</Text>
                ) : (
                  <View style={{ gap: 8 }}>
                    {topProducts.map((p, i) => (
                      <View key={i} style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 10,
                        backgroundColor: i === 0 ? (isDark ? 'rgba(245,158,11,0.06)' : 'rgba(13,148,136,0.04)') : 'transparent',
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: i === 0 ? c.accent : 'transparent',
                      }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 }}>
                          <Text style={{
                            fontSize: 14,
                            fontWeight: '900',
                            color: i < 3 ? c.accent : c.textMuted,
                            width: 20,
                          }}>
                            {i < 3 ? medals[i] : `#${i + 1}`}
                          </Text>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: c.text, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>{p.name}</Text>
                            <Text style={{ color: c.textSecondary, fontSize: 10, marginTop: 2 }}>{p.qty} terjual</Text>
                          </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ color: c.accent, fontSize: 13, fontWeight: '800', fontFamily: 'monospace' }}>
                            {formatRupiah(p.revenue)}
                          </Text>
                          {p.marginPct !== null && (
                            <Text style={{ color: marginColor(p.marginPct), fontSize: 9, fontWeight: '800', marginTop: 2 }}>
                              Margin {p.marginPct.toFixed(0)}%
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )
              )}

              {/* Payment breakdown */}
              {tab === 'payment' && (
                paymentBreakdown.length === 0 ? (
                  <Text style={{ color: c.textSecondary, textAlign: 'center', paddingVertical: 20, fontSize: 13 }}>Belum ada data pembayaran</Text>
                ) : (
                  <View style={{ gap: 10 }}>
                    {paymentBreakdown.map((p) => {
                      const badge = payMethodBadge(p.method);
                      return (
                        <View key={p.method} style={{
                          backgroundColor: c.bgInput,
                          borderWidth: 1,
                          borderColor: c.border,
                          borderRadius: 12,
                          padding: 12,
                        }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 6,
                              backgroundColor: badge.bg,
                            }}>
                              <Text style={{
                                color: badge.text,
                                fontSize: 10,
                                fontWeight: '800',
                                textTransform: 'uppercase',
                              }}>{payLabels[p.method] || p.method}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={{ color: c.text, fontSize: 13, fontWeight: '800', fontFamily: 'monospace' }}>
                                {formatRupiah(p.revenue)}
                              </Text>
                              <Text style={{ color: c.textSecondary, fontSize: 10, marginTop: 2 }}>
                                {p.count} transaksi ({p.pct.toFixed(1)}%)
                              </Text>
                            </View>
                          </View>
                          {/* Progress bar */}
                          <View style={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: isDark ? '#333' : '#e2e8f0',
                            marginTop: 10,
                            overflow: 'hidden',
                          }}>
                            <View style={{
                              height: '100%',
                              width: `${p.pct}%`,
                              backgroundColor: c.accent,
                              borderRadius: 3,
                            }} />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )
              )}

              {/* Cashier performance */}
              {tab === 'cashier' && (
                cashierPerformance.length === 0 ? (
                  <Text style={{ color: c.textSecondary, textAlign: 'center', paddingVertical: 20, fontSize: 13 }}>Belum ada data kasir</Text>
                ) : (
                  <View style={{ gap: 8 }}>
                    {cashierPerformance.map((item, idx) => (
                      <View key={item.name} style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 10,
                        backgroundColor: idx === 0 ? (isDark ? 'rgba(20,184,166,0.06)' : '#f0fdf4') : 'transparent',
                        borderRadius: 10,
                      }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 }}>
                          <Text style={{
                            fontSize: 14,
                            fontWeight: '900',
                            color: idx === 0 ? c.success : c.textMuted,
                            width: 20,
                          }}>
                            {idx === 0 ? '⭐' : `${idx + 1}`}
                          </Text>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: c.text, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>{item.name}</Text>
                            <Text style={{ color: c.textSecondary, fontSize: 10, marginTop: 2 }}>{item.transactions} transaksi</Text>
                          </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ color: c.accent, fontSize: 13, fontWeight: '800', fontFamily: 'monospace' }}>
                            {formatRupiah(item.revenue)}
                          </Text>
                          <Text style={{ color: c.textSecondary, fontSize: 9, marginTop: 2 }}>
                            Avg {formatRupiah(Math.round(item.avgTicket))}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )
              )}
            </View>
          </View>

          {/* COST BREAKDOWN SECTION */}
          <View style={{
            marginHorizontal: 16,
            backgroundColor: c.bgCard,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 20,
            padding: 16,
            marginBottom: 16,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <PieChart size={16} color={c.accent} />
              <Text style={{ color: c.text, fontSize: 15, fontWeight: '800' }}>Breakdown Biaya & Margin</Text>
            </View>

            {costBreakdown ? (
              <View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                  {[
                    { label: 'Gross Revenue', value: formatRupiah(costBreakdown.grossRevenue), color: c.text },
                    { label: 'COGS (Est)', value: formatRupiah(costBreakdown.cogs), color: c.error },
                    { label: 'Net Profit', value: formatRupiah(costBreakdown.netProfit), color: c.success },
                    { label: 'Margin Profit', value: `${costBreakdown.marginPct.toFixed(1)}%`, color: c.accent },
                  ].map((item, idx) => (
                    <View key={idx} style={{
                      flex: 1,
                      minWidth: '45%',
                      backgroundColor: c.bgInput,
                      borderRadius: 10,
                      padding: 10,
                    }}>
                      <Text style={{ color: c.textSecondary, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' }}>{item.label}</Text>
                      <Text style={{ color: item.color, fontSize: 13, fontWeight: '900', marginTop: 4, fontFamily: 'monospace' }}>
                        {item.value}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Progress bar split */}
                <View style={{
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: isDark ? '#333' : '#e2e8f0',
                  overflow: 'hidden',
                  flexDirection: 'row',
                }}>
                  <View style={{
                    height: '100%',
                    width: `${costBreakdown.grossRevenue > 0 ? (costBreakdown.cogs / costBreakdown.grossRevenue) * 100 : 0}%`,
                    backgroundColor: '#ef4444',
                  }} />
                  <View style={{
                    height: '100%',
                    width: `${costBreakdown.marginPct}%`,
                    backgroundColor: '#10b981',
                  }} />
                </View>

                <View style={{ flexDirection: 'row', gap: 14, marginTop: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' }} />
                    <Text style={{ color: c.textSecondary, fontSize: 10, fontWeight: '700' }}>COGS (HPP)</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' }} />
                    <Text style={{ color: c.textSecondary, fontSize: 10, fontWeight: '700' }}>Keuntungan Bersih</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: c.bgInput,
                padding: 12,
                borderRadius: 12,
              }}>
                <Info size={16} color={c.textMuted} />
                <Text style={{ color: c.textSecondary, fontSize: 11, flex: 1 }}>
                  Data modal/COGS produk belum lengkap. Profit bersih dan persentase margin tidak dapat dikalkulasikan secara akurat.
                </Text>
              </View>
            )}
          </View>

          {/* DETAIL TRANSAKSI COLLAPSIBLE */}
          <View style={{
            marginHorizontal: 16,
            backgroundColor: c.bgCard,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 20,
            overflow: 'hidden',
          }}>
            <TouchableOpacity
              onPress={() => {
                if (!isCovered) {
                  Alert.alert(
                    'Data dari Server',
                    'Daftar transaksi detail hanya tersedia untuk laporan yang dihitung dari perangkat lokal. Silakan buka tab Riwayat Transaksi untuk melihat semua transaksi secara utuh.',
                    [
                      { text: 'Tutup', style: 'cancel' },
                      { text: 'Ke Riwayat Transaksi', onPress: () => router.push('/(owner)/transactions') }
                    ]
                  );
                  return;
                }
                setShowTxList(!showTxList);
              }}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 16,
                opacity: isCovered ? 1 : 0.6
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: c.text, fontSize: 15, fontWeight: '800' }}>Detail Transaksi</Text>
                <View style={{
                  backgroundColor: c.accentBg,
                  borderRadius: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}>
                  <Text style={{ color: c.accent, fontSize: 11, fontWeight: '900' }}>{filtered.length}</Text>
                </View>
              </View>
              {showTxList ? (
                <ChevronUp size={18} color={c.textSecondary} />
              ) : (
                <ChevronDown size={18} color={c.textSecondary} />
              )}
            </TouchableOpacity>

            {showTxList && (
              <View style={{ borderTopWidth: 1, borderTopColor: c.border, padding: 14 }}>
                {filtered.length === 0 ? (
                  <Text style={{ color: c.textSecondary, textAlign: 'center', paddingVertical: 14, fontSize: 13 }}>Tidak ada transaksi dalam periode ini</Text>
                ) : (
                  <View style={{ gap: 10 }}>
                    {pagedTx.map((item) => {
                      const isExpanded = expandedTxId === item.id;
                      const d = item.date instanceof Date ? item.date : new Date(item.date);
                      const badge = payMethodBadge(item.paymentMethod);
                      return (
                        <View
                          key={item.id}
                          style={{
                            borderWidth: 1,
                            borderColor: c.border,
                            borderRadius: 14,
                            backgroundColor: c.bgInput,
                            overflow: 'hidden',
                          }}
                        >
                          <TouchableOpacity
                            onPress={() => setExpandedTxId(isExpanded ? null : item.id)}
                            activeOpacity={0.75}
                            style={{ padding: 12 }}
                          >
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <View style={{ flex: 1, marginRight: 8 }}>
                                <Text style={{ color: c.textMuted, fontSize: 9, fontFamily: 'monospace' }}>
                                  #{item.id.slice(-8).toUpperCase()}
                                </Text>
                                <Text style={{ color: c.text, fontSize: 13, fontWeight: '700', marginTop: 2 }}>
                                  {item.customerName || 'Umum'}
                                </Text>
                                <Text style={{ color: c.textSecondary, fontSize: 11, marginTop: 4 }} numberOfLines={1}>
                                  {item.items.map(it => `${it.name} x${it.quantity}`).join(', ')}
                                </Text>
                                <Text style={{ color: c.textMuted, fontSize: 10, marginTop: 4 }}>
                                  Kasir: {item.cashierName || '-'} • {formatDateTime(d)}
                                </Text>
                              </View>
                              <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{ color: c.accent, fontSize: 13, fontWeight: '900', fontFamily: 'monospace' }}>
                                  {formatRupiah(item.total)}
                                </Text>
                                <View style={{
                                  backgroundColor: badge.bg,
                                  borderRadius: 6,
                                  paddingHorizontal: 6,
                                  paddingVertical: 2,
                                  marginTop: 6,
                                }}>
                                  <Text style={{
                                    color: badge.text,
                                    fontSize: 9,
                                    fontWeight: '800',
                                    textTransform: 'uppercase',
                                  }}>{item.paymentMethod}</Text>
                                </View>
                              </View>
                            </View>
                          </TouchableOpacity>

                          {isExpanded && (
                            <View style={{
                              padding: 12,
                              backgroundColor: c.bgCard,
                              borderTopWidth: 1,
                              borderTopColor: c.border,
                              gap: 10,
                            }}>
                              <Text style={{ color: c.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>Rincian Item</Text>
                              <View style={{ gap: 6 }}>
                                {item.items.map((it, idx) => (
                                  <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <View style={{ flex: 1, marginRight: 8 }}>
                                      <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>
                                        {it.name} x{it.quantity}
                                      </Text>
                                      {it.variantName ? (
                                        <Text style={{ color: c.accent, fontSize: 10, marginTop: 1 }}>+ Varian: {it.variantName}</Text>
                                      ) : null}
                                      {it.note ? (
                                        <Text style={{ color: c.textMuted, fontSize: 10, fontStyle: 'italic', marginTop: 1 }}>Note: {it.note}</Text>
                                      ) : null}
                                    </View>
                                    <Text style={{ color: c.text, fontSize: 12, fontWeight: '700', fontFamily: 'monospace' }}>
                                      {formatRupiah(it.price * it.quantity)}
                                    </Text>
                                  </View>
                                ))}
                              </View>

                              <TouchableOpacity
                                onPress={() => setSelectedTx(mapTransactionToHistory(item))}
                                activeOpacity={0.7}
                                style={{
                                  backgroundColor: c.accentBg,
                                  borderRadius: 8,
                                  paddingVertical: 8,
                                  alignItems: 'center',
                                  marginTop: 6,
                                }}
                              >
                                <Text style={{ color: c.accent, fontSize: 11, fontWeight: '800' }}>Lihat Struk / Detail Lengkap</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      );
                    })}

                    {/* Pagination control */}
                    {totalPages > 1 && (
                      <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 10,
                        paddingTop: 14,
                        borderTopWidth: 1,
                        borderTopColor: c.border,
                      }}>
                        <TouchableOpacity
                          disabled={txPage <= 1}
                          onPress={() => setTxPage(prev => Math.max(1, prev - 1))}
                          style={{
                            borderWidth: 1,
                            borderColor: c.border,
                            borderRadius: 10,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            opacity: txPage <= 1 ? 0.4 : 1,
                          }}
                        >
                          <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '700' }}>Sebelumnya</Text>
                        </TouchableOpacity>
                        <Text style={{ color: c.textSecondary, fontSize: 11, fontWeight: '600' }}>
                          Halaman <Text style={{ color: c.accent, fontWeight: '900' }}>{txPage}</Text> dari {totalPages}
                        </Text>
                        <TouchableOpacity
                          disabled={txPage >= totalPages}
                          onPress={() => setTxPage(prev => Math.min(totalPages, prev + 1))}
                          style={{
                            borderWidth: 1,
                            borderColor: c.border,
                            borderRadius: 10,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            opacity: txPage >= totalPages ? 0.4 : 1,
                          }}
                        >
                          <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '700' }}>Berikutnya</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* CUSTOM CALENDAR MODAL */}
      <Modal visible={calendarVisible} transparent animationType="fade" onRequestClose={() => setCalendarVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setCalendarVisible(false)} />
          <View style={[styles.calendarSheet, { backgroundColor: c.bgCard, borderColor: c.border }]}>
            {/* Header */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottomWidth: 1,
              borderBottomColor: c.border,
              paddingBottom: 12,
              marginBottom: 16,
            }}>
              <Text style={{ color: c.text, fontSize: 16, fontWeight: '800' }}>Pilih Periode Kustom</Text>
              <TouchableOpacity onPress={() => setCalendarVisible(false)}>
                <X size={20} color={c.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Month Navigator */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <TouchableOpacity onPress={prevCalendarMonth} style={{ padding: 6 }}>
                <ChevronLeft size={20} color={c.accent} />
              </TouchableOpacity>
              <Text style={{ color: c.text, fontSize: 14, fontWeight: '800' }}>
                {new Date(currentYear, currentMonth).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={nextCalendarMonth} style={{ padding: 6 }}>
                <ChevronRight size={20} color={c.accent} />
              </TouchableOpacity>
            </View>

            {/* Day Headers */}
            <View style={{ flexDirection: 'row', marginBottom: 6 }}>
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d, i) => (
                <Text key={i} style={{ flex: 1, textAlign: 'center', color: c.textMuted, fontSize: 11, fontWeight: '700' }}>
                  {d}
                </Text>
              ))}
            </View>

            {/* Day grid */}
            <View style={{ gap: 4 }}>
              {(() => {
                const daysInMonth = getDaysInMonth(currentYear, currentMonth);
                const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
                const weeks = [];
                let week = Array(7).fill(null);

                // Add empty cells for padding
                for (let i = 0; i < firstDay; i++) {
                  week[i] = { type: 'empty' };
                }

                let col = firstDay;
                for (let day = 1; day <= daysInMonth; day++) {
                  if (col === 7) {
                    weeks.push(week);
                    week = Array(7).fill(null);
                    col = 0;
                  }
                  week[col] = { type: 'day', val: day };
                  col++;
                }
                // Push last week
                if (week.some(x => x !== null)) {
                  weeks.push(week);
                }

                return weeks.map((w, wIdx) => (
                  <View key={wIdx} style={{ flexDirection: 'row', height: 40 }}>
                    {w.map((cell, cIdx) => {
                      if (!cell || cell.type === 'empty') {
                        return <View key={cIdx} style={{ flex: 1 }} />;
                      }

                      const date = new Date(currentYear, currentMonth, cell.val);
                      const isStart = tempStart && date.toDateString() === tempStart.toDateString();
                      const isEnd = tempEnd && date.toDateString() === tempEnd.toDateString();
                      const inRange = tempStart && tempEnd && date > tempStart && date < tempEnd;
                      const isSelected = isStart || isEnd;

                      return (
                        <TouchableOpacity
                          key={cIdx}
                          onPress={() => handleSelectDay(cell.val)}
                          style={{
                            flex: 1,
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: isSelected ? c.accent : (inRange ? c.accentBg : 'transparent'),
                            borderRadius: isSelected ? 8 : 0,
                          }}
                        >
                          <Text style={{
                            color: isSelected ? '#fff' : (inRange ? c.text : c.text),
                            fontSize: 12,
                            fontWeight: isSelected ? '800' : '500',
                          }}>
                            {cell.val}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ));
              })()}
            </View>

            {/* Selection display */}
            <View style={{
              marginTop: 16,
              padding: 10,
              backgroundColor: c.bgInput,
              borderRadius: 10,
              gap: 4,
            }}>
              <Text style={{ color: c.textSecondary, fontSize: 10 }}>Rentang yang dipilih:</Text>
              <Text style={{ color: c.text, fontSize: 12, fontWeight: '700' }}>
                {tempStart ? formatDate(tempStart, 'YYYY-MM-DD') : 'Pilih tanggal mulai'} — {tempEnd ? formatDate(tempEnd, 'YYYY-MM-DD') : (tempStart ? formatDate(tempStart, 'YYYY-MM-DD') : 'Pilih tanggal akhir')}
              </Text>
            </View>

            {/* Actions */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <TouchableOpacity
                onPress={() => setCalendarVisible(false)}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: c.border,
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: c.textSecondary, fontSize: 13, fontWeight: '700' }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveCustomDates}
                style={{
                  flex: 1,
                  backgroundColor: c.accent,
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Transaction Detail Sheet */}
      {selectedTx && (
        <TransactionDetailSheet
          transaction={selectedTx}
          userRole="owner"
          visible={!!selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  calendarSheet: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5,
  },
});
