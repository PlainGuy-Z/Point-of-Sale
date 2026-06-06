import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, ScrollView,
  ActivityIndicator, RefreshControl, Alert, StyleSheet, Platform, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search, Download, AlertTriangle, ChevronDown, ChevronUp,
  Inbox, AlertCircle,
} from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { formatRupiah } from '../../utils/currency';
import { formatDateTime } from '../../utils/dateFormatter';
import { historyApi } from '../../services/historyApi';
import { ApiError } from '../../services/api';
import type {
  HistoryTransaction, HistoryTransactionStatus,
  TxSummaryToday, TxSummaryMonth,
} from '../../types/historyTransaction';
import { useApp } from '../../contexts/AppContext';
import { Zap } from 'lucide-react-native';
import TransactionCard from './TransactionCard';
import TransactionDetailSheet from './TransactionDetailSheet';
import VoidReviewModal from './VoidReviewModal';

const LIMIT = 20;

const STATUS_FILTERS: Array<{ key: 'all' | HistoryTransactionStatus; label: string }> = [
  { key: 'all', label: 'Semua' },
  { key: 'completed', label: 'Selesai' },
  { key: 'pending_void', label: 'Menunggu Void' },
  { key: 'voided', label: 'Dibatalkan' },
];

const PAYMENT_FILTERS = [
  { key: '', label: 'Semua pembayaran' },
  { key: 'cash', label: 'Cash' },
  { key: 'qris', label: 'QRIS' },
  { key: 'card', label: 'Card' },
  { key: 'transfer', label: 'Transfer' },
];

function itemSummary(t: HistoryTransaction): string {
  return (
    (t.items || [])
      .slice(0, 2)
      .map((it) => `${it.product_name} ×${it.quantity}`)
      .join(', ') || '—'
  );
}

function statusLabel(s: HistoryTransactionStatus): string {
  if (s === 'completed') return 'Selesai';
  if (s === 'pending_void') return 'Menunggu Void';
  return 'Dibatalkan';
}

export default function OwnerHistoryScreen() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscape = windowWidth > windowHeight;
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);
  const { transactions, transactionsCacheFrom, transactionsCacheTo } = useApp();

  // Summary data
  const [todaySumm, setTodaySumm] = useState<TxSummaryToday | null>(null);
  const [monthSumm, setMonthSumm] = useState<TxSummaryMonth | null>(null);
  const [pendingList, setPendingList] = useState<HistoryTransaction[]>([]);
  const [cashiers, setCashiers] = useState<Array<{ id: string; name: string }>>([]);
  const [summLoading, setSummLoading] = useState(true);

  // Transaction list data
  const [rows, setRows] = useState<HistoryTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const today = useMemo(() => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' }), []);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [cashierId, setCashierId] = useState('');
  const [status, setStatus] = useState<'all' | HistoryTransactionStatus>('all');
  const [payMethod, setPayMethod] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Detail / void review
  const [detail, setDetail] = useState<HistoryTransaction | null>(null);
  const [review, setReview] = useState<{ t: HistoryTransaction; action: 'approve' | 'reject' | 'direct-void' } | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // ── Load Summaries ──
  const loadSummaries = useCallback(async () => {
    setSummLoading(true);
    try {
      const [tRes, mRes, vRes, cRes] = await Promise.all([
        historyApi.getSummaryToday(cashierId || undefined),
        historyApi.getSummaryMonth(cashierId || undefined),
        historyApi.getVoidRequests(),
        historyApi.getCashiers(),
      ]);
      setTodaySumm(tRes);
      setMonthSumm(mRes);
      setPendingList(vRes.data || []);
      setCashiers(Array.isArray(cRes) ? cRes : []);
    } catch {
      // Silent fail for summary, data still loads below
    } finally {
      setSummLoading(false);
    }
  }, [cashierId]);

  // ── Compute isCovered ──
  const isCovered = useMemo(() => {
    if (search.trim() !== '') return false;
    if (status !== 'all') return false;
    if (cashierId !== '') return false;
    if (payMethod !== '') return false;
    if (page * LIMIT > transactions.length + LIMIT) return false;
    
    if (!transactionsCacheFrom || !transactionsCacheTo) return transactions.length === 0;
    
    if (!dateFrom && !dateTo) return true;
    
    const cFrom = new Date(transactionsCacheFrom);
    const cTo = new Date(transactionsCacheTo);
    cFrom.setHours(cFrom.getHours() - 1);
    cTo.setHours(cTo.getHours() + 1);
    
    const dFrom = dateFrom ? new Date(dateFrom) : new Date('2000-01-01');
    const dTo = dateTo ? new Date(dateTo) : new Date();
    dTo.setHours(23, 59, 59, 999);
    
    return dFrom >= cFrom && dTo <= cTo;
  }, [search, status, cashierId, payMethod, page, transactions.length, transactionsCacheFrom, transactionsCacheTo, dateFrom, dateTo]);

  // ── Load Rows ──
  const loadRows = useCallback(async (isRefresh = false) => {
    if (isCovered && !isRefresh) {
      const cached = transactions.slice((page - 1) * LIMIT, page * LIMIT).map((t: any) => ({
        id: t.id,
        created_at: t.date,
        status: 'completed' as HistoryTransactionStatus,
        cashier_id: null,
        cashier_name: t.cashierName || null,
        customer_name: t.customerName || null,
        table_number: t.tableNumber || null,
        order_type: (t.orderType === 'take-away' || t.orderType === 'takeaway') ? 'takeaway' : 'dine_in',
        subtotal: t.subtotal ?? t.total,
        tax_amount: t.tax ?? 0,
        tax_rate: t.taxRate ?? 0,
        service_charge: t.service_charge ?? 0,
        service_amount: t.service_charge ?? 0,
        total_amount: t.total,
        payment_method: t.paymentMethod,
        raw_payment_method: t.paymentMethod,
        items: (t.items || []).map((i: any) => ({
          product_id: i.productId || null,
          product_name: i.note || i.name || i.productId || 'Item',
          quantity: i.quantity,
          unit_price: i.price,
          subtotal: i.price * i.quantity,
          variant_name: i.variantName || null,
          variant_price: i.variantPrice || null,
          notes: i.description || null,
        }))
      } as HistoryTransaction));
      setRows(cached);
      setTotal(transactions.length);
      setLoading(false);
      setError(null);
      return;
    }

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await historyApi.getTransactions({
        page,
        limit: LIMIT,
        sort: 'desc',
        status: status !== 'all' ? status : undefined,
        q: search.trim() || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        cashier_id: cashierId || undefined,
        payment_method: payMethod || undefined,
      });
      setRows(res.data);
      setTotal(res.pagination.total);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Gagal memuat transaksi.';
      setError(msg);
      setRows([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, status, search, dateFrom, dateTo, cashierId, payMethod, isCovered, transactions]);

  useEffect(() => { void loadSummaries(); }, [loadSummaries]);
  useEffect(() => { void loadRows(); }, [loadRows]);
  useEffect(() => { setPage(1); }, [status, search, dateFrom, dateTo, cashierId, payMethod]);

  const handleRefresh = useCallback(() => {
    void loadSummaries();
    void loadRows(true);
  }, [loadSummaries, loadRows]);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleReviewSuccess = () => {
    setReview(null);
    setDetail(null);
    if (review?.action === 'direct-void') {
      showFeedback('Transaksi berhasil dibatalkan');
    } else {
      showFeedback(review?.action === 'approve' ? 'Void disetujui' : 'Permintaan void ditolak');
    }
    void loadRows();
    void loadSummaries();
  };

  // ── Export CSV ──
  const doExport = async () => {
    setExporting(true);
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Tidak Tersedia', 'Fitur sharing tidak tersedia di perangkat ini.');
        return;
      }

      const res = await historyApi.getTransactions({
        page: 1,
        limit: 5000,
        sort: 'desc',
        status: status !== 'all' ? status : undefined,
        q: search.trim() || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        cashier_id: cashierId || undefined,
        payment_method: payMethod || undefined,
      });

      const esc = (cell: string) => `"${cell.replace(/"/g, '""')}"`;
      const head = ['ID', 'Waktu', 'Kasir', 'Pelanggan', 'Items', 'Subtotal', 'Diskon', 'Total', 'Metode', 'Status'];
      const csvRows = [head.map(esc).join(',')];

      for (const t of res.data) {
        csvRows.push([
          esc(t.id),
          esc(formatDateTime(t.created_at)),
          esc(String(t.cashier_name ?? '')),
          esc(String(t.customer_name ?? 'Umum')),
          esc(itemSummary(t)),
          esc(String(t.subtotal ?? 0)),
          esc(String(t.discount_amount ?? 0)),
          esc(String(t.total_amount)),
          esc(String(t.raw_payment_method || t.payment_method)),
          esc(statusLabel(t.status)),
        ].join(','));
      }

      const csvContent = csvRows.join('\r\n');
      const filename = `transaksi_${dateFrom || 'terbaru'}_${dateTo || 'terbaru'}.csv`;
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Export Transaksi' });

      showFeedback('CSV berhasil diekspor');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Export gagal.';
      Alert.alert('Export Gagal', msg);
    } finally {
      setExporting(false);
    }
  };

  const exportCsv = useCallback(async () => {
    if (isCovered) {
      Alert.alert(
        'Mode Cache Aktif',
        'Anda sedang dalam mode 200 transaksi terbaru.\n\nGunakan filter backend (seperti rentang tanggal spesifik) jika Anda ingin mengekspor seluruh histori yang akurat.',
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Tetap Export 200 Terbaru', onPress: () => void doExport() }
        ]
      );
      return;
    }
    void doExport();
  }, [isCovered, status, search, dateFrom, dateTo, cashierId, payMethod]);

  const hasMore = total > LIMIT;

  // ── Summary Cards Data ──
  const summaryCards = useMemo(() => [
    {
      label: 'Total Transaksi Hari Ini',
      value: String(todaySumm?.today_count ?? 0),
    },
    {
      label: 'Penjualan Hari Ini',
      value: formatRupiah(todaySumm?.today_sales ?? 0),
    },
    {
      label: 'Pending Void',
      value: String(pendingList.length),
      highlight: pendingList.length > 0,
    },
    {
      label: 'Total Transaksi Bulan Ini',
      value: String(monthSumm?.month_count ?? 0),
    },
  ], [todaySumm, monthSumm, pendingList]);

  // ── Cashier Picker Data ──
  const cashierOptions = useMemo(() => [
    { id: '', name: 'Semua kasir' },
    ...cashiers,
  ], [cashiers]);

  // ── Render ──
  const renderCard = useCallback(({ item }: { item: HistoryTransaction }) => (
    <TransactionCard
      transaction={item}
      isDark={isDark}
      showCashier
      onDetail={setDetail}
      buttonLabel="Detail"
    />
  ), [isDark]);

  const keyExtractor = useCallback((item: HistoryTransaction) => item.id, []);

  const ListHeaderComponent = useMemo(() => (
    <>
      {/* Summary Cards */}
      {summLoading ? (
        <View style={styles.summaryLoading}>
          <ActivityIndicator size="small" color={c.accent} />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.summaryScroll}
          style={styles.summaryScrollOuter}
        >
          {summaryCards.map((card) => (
            <View
              key={card.label}
              style={[
                styles.summaryCard,
                { backgroundColor: c.bgCard, borderColor: card.highlight ? c.warning : c.border },
                card.highlight && { borderWidth: 2 },
              ]}
            >
              <Text style={[styles.summaryLabel, { color: c.textMuted }]}>{card.label}</Text>
              <Text style={[styles.summaryValue, { color: c.accent }]}>{card.value}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Pending Void Banner */}
      {pendingList.length > 0 && (
        <View style={[styles.pendingBanner, {
          backgroundColor: isDark ? 'rgba(245,158,11,0.08)' : 'rgba(217,119,6,0.06)',
          borderColor: isDark ? 'rgba(245,158,11,0.3)' : 'rgba(217,119,6,0.25)',
        }]}>
          <View style={styles.pendingHeader}>
            <AlertTriangle size={18} color={isDark ? '#fcd34d' : '#92400e'} />
            <Text style={[styles.pendingTitle, { color: isDark ? '#fcd34d' : '#92400e' }]}>
              {pendingList.length} transaksi menunggu persetujuan void
            </Text>
          </View>
          {pendingList.slice(0, 5).map((p) => (
            <View key={p.id} style={[styles.pendingItem, { backgroundColor: c.bgCard, borderColor: c.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.pendingId, { color: c.textMuted }]}>
                  #{p.id.slice(0, 8).toUpperCase()}
                </Text>
                <Text style={[styles.pendingInfo, { color: c.text }]}>
                  {p.cashier_name} • {formatRupiah(p.total_amount)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setDetail(p)}
                style={[styles.reviewBtn, { borderColor: c.accent }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.reviewBtnText, { color: c.accent }]}>Tinjau</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Filters */}
      <View style={[styles.filterBox, { backgroundColor: c.bgCard, borderColor: c.border }]}>
        {/* Collapsible toggle */}
        <TouchableOpacity
          style={styles.filterToggle}
          onPress={() => setFiltersOpen((o) => !o)}
          activeOpacity={0.7}
        >
          <View style={styles.filterToggleLeft}>
            <Search size={14} color={c.accent} />
            <Text style={[styles.filterToggleText, { color: c.text }]}>Filter & Pencarian</Text>
          </View>
          {filtersOpen
            ? <ChevronUp size={16} color={c.textMuted} />
            : <ChevronDown size={16} color={c.textMuted} />
          }
        </TouchableOpacity>

        {filtersOpen && (
          <View style={styles.filterContent}>
            {/* Date range */}
            <View style={{ marginBottom: 12 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                {['Hari Ini', 'Kemarin', 'Minggu Ini', 'Bulan Ini', 'Semua Waktu'].map((label, i) => {
                  const presets = ['today', 'yesterday', 'this_week', 'this_month', 'clear'] as const;
                  const key = presets[i];
                  return (
                    <TouchableOpacity
                      key={key}
                      onPress={() => {
                        if (key === 'clear') {
                          setDateFrom('');
                          setDateTo('');
                          return;
                        }
                        const now = new Date();
                        const pad = (n: number) => String(n).padStart(2, '0');
                        const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
                        let dFrom = new Date();
                        let dTo = new Date();
                        if (key === 'yesterday') { dFrom.setDate(now.getDate() - 1); dTo.setDate(now.getDate() - 1); }
                        else if (key === 'this_week') {
                          const day = now.getDay();
                          const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                          dFrom.setDate(diff);
                        }
                        else if (key === 'this_month') {
                          dFrom.setDate(1);
                        }
                        setDateFrom(toDateStr(dFrom));
                        setDateTo(toDateStr(dTo));
                      }}
                      style={[
                        styles.chip,
                        { borderWidth: 1, borderColor: c.border, marginRight: 6, backgroundColor: isDark ? '#292524' : '#f1f5f9' }
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, { color: key === 'clear' ? c.error : c.text }]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <View style={styles.dateRow}>
                <View style={styles.dateField}>
                  <Text style={[styles.dateLabel, { color: c.textMuted }]}>Dari (YYYY-MM-DD)</Text>
                  <TextInput
                    style={[styles.dateInput, { backgroundColor: c.bgInput, borderColor: c.border, color: c.text }]}
                    value={dateFrom}
                    onChangeText={setDateFrom}
                    placeholder="Contoh: 2026-06-01"
                    placeholderTextColor={c.textMuted}
                  />
                </View>
                <View style={styles.dateField}>
                  <Text style={[styles.dateLabel, { color: c.textMuted }]}>Sampai (YYYY-MM-DD)</Text>
                  <TextInput
                    style={[styles.dateInput, { backgroundColor: c.bgInput, borderColor: c.border, color: c.text }]}
                    value={dateTo}
                    onChangeText={setDateTo}
                    placeholder="Contoh: 2026-06-30"
                    placeholderTextColor={c.textMuted}
                  />
                </View>
              </View>
            </View>

            {/* Cashier picker */}
            <View style={styles.pickerRow}>
              <Text style={[styles.dateLabel, { color: c.textMuted }]}>Kasir</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                {cashierOptions.map((opt) => {
                  const active = cashierId === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id || '__all'}
                      onPress={() => setCashierId(opt.id)}
                      style={[
                        styles.chip,
                        active
                          ? { backgroundColor: c.accent }
                          : { borderWidth: 1, borderColor: c.border },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, { color: active ? '#fff' : c.textSecondary }]}>
                        {opt.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Search */}
            <View style={[styles.searchRow, { backgroundColor: c.bgInput, borderColor: c.border }]}>
              <Search size={16} color={c.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: c.text }]}
                placeholder="Pelanggan atau ID transaksi"
                placeholderTextColor={c.textMuted}
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
                returnKeyType="search"
              />
            </View>

            {/* Status chips */}
            <View style={styles.chipRow}>
              {STATUS_FILTERS.map((f) => {
                const active = status === f.key;
                return (
                  <TouchableOpacity
                    key={f.key}
                    onPress={() => setStatus(f.key)}
                    style={[
                      styles.chip,
                      active
                        ? { backgroundColor: c.accent }
                        : { borderWidth: 1, borderColor: c.border },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, { color: active ? '#fff' : c.textSecondary }]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Payment method + Export */}
            <View style={styles.payExportRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                {PAYMENT_FILTERS.map((p) => {
                  const active = payMethod === p.key;
                  return (
                    <TouchableOpacity
                      key={p.key || '__all'}
                      onPress={() => setPayMethod(p.key)}
                      style={[
                        styles.chip,
                        active
                          ? { backgroundColor: c.accent }
                          : { borderWidth: 1, borderColor: c.border },
                        { marginRight: 6 },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, { color: active ? '#fff' : c.textSecondary }]}>
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        )}
      </View>

      {/* Export button */}
      <TouchableOpacity
        style={[styles.exportBtn, { borderColor: c.accent }]}
        onPress={() => void exportCsv()}
        disabled={exporting}
        activeOpacity={0.7}
      >
        {exporting ? (
          <ActivityIndicator size="small" color={c.accent} />
        ) : (
          <>
            <Download size={16} color={c.accent} />
            <Text style={[styles.exportBtnText, { color: c.accent }]}>Export CSV</Text>
          </>
        )}
      </TouchableOpacity>
    </>
  ), [
    summLoading, summaryCards, pendingList, filtersOpen, dateFrom, dateTo,
    cashierId, cashierOptions, search, status, payMethod, exporting,
    c, isDark, exportCsv,
  ]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.headerSection, { paddingLeft: isLandscape ? 16 : 60 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.titleText, { color: c.text }]}>
              Riwayat <Text style={{ color: c.accent }}>Transaksi</Text>
            </Text>
            <Text style={[styles.subtitleText, { color: c.textSecondary }]}>
              Filter lengkap untuk semua transaksi di toko Anda
            </Text>
          </View>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 4,
            paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
            backgroundColor: isCovered ? (isDark ? '#292524' : '#fef3c7') : (isDark ? '#1e3a8a' : '#dbeafe'),
          }}>
            <Zap size={10} color={isCovered ? "#f59e0b" : "#3b82f6"} />
            <Text style={{ fontSize: 9, fontWeight: '700', color: isCovered ? "#f59e0b" : "#3b82f6" }}>
              {isCovered ? 'Live Cache — 200 transaksi terbaru' : 'Data Server'}
            </Text>
          </View>
        </View>
        {isCovered && (
          <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 8, fontStyle: 'italic' }}>
            💡 Gunakan filter tanggal, pencarian, status, metode pembayaran, atau kasir untuk menarik transaksi lama dari server.
          </Text>
        )}
      </View>

      {/* Feedback */}
      {feedbackMsg && (
        <View style={[styles.feedbackBar, { backgroundColor: c.successBg }]}>
          <Text style={[styles.feedbackText, { color: c.success }]}>{feedbackMsg}</Text>
        </View>
      )}

      {/* Content */}
      {loading && !refreshing ? (
        <>
          {ListHeaderComponent}
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={c.accent} />
            <Text style={[styles.stateText, { color: c.textMuted }]}>Memuat transaksi...</Text>
          </View>
        </>
      ) : error ? (
        <>
          {ListHeaderComponent}
          <View style={styles.centerState}>
            <AlertCircle size={40} color={c.error} strokeWidth={1.5} />
            <Text style={[styles.stateText, { color: c.error }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryBtn, { borderColor: c.accent }]}
              onPress={() => void loadRows()}
            >
              <Text style={[styles.retryText, { color: c.accent }]}>Coba Lagi</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <FlatList
          data={rows}
          renderItem={renderCard}
          keyExtractor={keyExtractor}
          ListHeaderComponent={ListHeaderComponent}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={c.accent}
              colors={[c.accent]}
            />
          }
          ListEmptyComponent={
            <View style={styles.centerState}>
              <Inbox size={48} color={c.textMuted} strokeWidth={1.5} />
              <Text style={[styles.stateTitle, { color: c.text }]}>Belum ada data transaksi</Text>
              <Text style={[styles.stateText, { color: c.textSecondary }]}>
                Tidak ada transaksi untuk filter ini
              </Text>
            </View>
          }
          ListFooterComponent={
            hasMore && !loading ? (
              <View style={styles.paginationRow}>
                <TouchableOpacity
                  disabled={page <= 1}
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                  style={[styles.pageBtn, { borderColor: c.border, opacity: page <= 1 ? 0.4 : 1 }]}
                >
                  <Text style={[styles.pageBtnText, { color: c.text }]}>Sebelumnya</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={page * LIMIT >= total}
                  onPress={() => setPage((p) => p + 1)}
                  style={[styles.pageBtn, { borderColor: c.border, opacity: page * LIMIT >= total ? 0.4 : 1 }]}
                >
                  <Text style={[styles.pageBtnText, { color: c.text }]}>Berikutnya</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}

      {/* Detail Sheet */}
      {detail && (
        <TransactionDetailSheet
          transaction={detail}
          userRole="owner"
          visible={!!detail}
          onClose={() => setDetail(null)}
          onVoidApprove={() => setReview({ t: detail, action: 'approve' })}
          onVoidReject={() => setReview({ t: detail, action: 'reject' })}
          onVoidDirect={() => setReview({ t: detail, action: 'direct-void' })}
        />
      )}

      {/* Void Review Modal */}
      {review && (
        <VoidReviewModal
          transaction={review.t}
          action={review.action}
          visible={!!review}
          onClose={() => setReview(null)}
          onSuccess={handleReviewSuccess}
          isDark={isDark}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '900',
  },
  subtitleText: {
    fontSize: 12,
    marginTop: 2,
  },
  feedbackBar: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  feedbackText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Summary
  summaryLoading: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  summaryScrollOuter: {
    marginBottom: 10,
  },
  summaryScroll: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 4,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 160,
  },
  summaryLabel: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '900',
  },

  // Pending Void Banner
  pendingBanner: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  pendingTitle: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  pendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 6,
  },
  pendingId: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '600',
  },
  pendingInfo: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  reviewBtn: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginLeft: 8,
  },
  reviewBtnText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },

  // Filters
  filterBox: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 8,
    overflow: 'hidden',
  },
  filterToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  filterToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterToggleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  filterContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 10,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateField: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  dateInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  pickerRow: {
    // cashier picker
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  payExportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Export
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 10,
  },
  exportBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // States
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    paddingHorizontal: 32,
    gap: 8,
  },
  stateTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  stateText: {
    fontSize: 13,
    textAlign: 'center',
  },
  retryBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 8,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
    paddingBottom: 10,
  },
  pageBtn: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  pageBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
