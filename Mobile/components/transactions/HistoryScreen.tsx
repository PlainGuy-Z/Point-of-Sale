import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, RefreshControl, Alert, StyleSheet, useWindowDimensions, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Inbox, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { formatFullDate } from '../../utils/dateFormatter';
import { historyApi } from '../../services/historyApi';
import { ApiError } from '../../services/api';
import type { HistoryTransaction, HistoryTransactionStatus } from '../../types/historyTransaction';
import { useApp } from '../../contexts/AppContext';
import { Zap } from 'lucide-react-native';
import TransactionCard from './TransactionCard';
import TransactionDetailSheet from './TransactionDetailSheet';
import VoidRequestModal from './VoidRequestModal';

const LIMIT = 20;

const STATUS_FILTERS: Array<{ key: 'all' | HistoryTransactionStatus; label: string }> = [
  { key: 'all', label: 'Semua' },
  { key: 'completed', label: 'Selesai' },
  { key: 'pending_void', label: 'Pending Void' },
  { key: 'voided', label: 'Dibatalkan' },
];

const SORT_OPTIONS: Array<{ key: 'desc' | 'asc'; label: string }> = [
  { key: 'desc', label: 'Terbaru' },
  { key: 'asc', label: 'Terlama' },
];

export default function HistoryScreen() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscape = windowWidth > windowHeight;
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);
  const { transactions } = useApp();

  // Data state
  const [rows, setRows] = useState<HistoryTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | HistoryTransactionStatus>('all');
  const [sort, setSort] = useState<'desc' | 'asc'>('desc');

  // Detail/void state
  const [detail, setDetail] = useState<HistoryTransaction | null>(null);
  const [voidTarget, setVoidTarget] = useState<HistoryTransaction | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const todayLabel = useMemo(() => formatFullDate(new Date()), []);

  const isCovered = useMemo(() => {
    // For cashier, default date is always today.
    // Cache covers today. We only fallback if there's a search, non-default status, asc sort,
    // or if the requested page is beyond the cached items length.
    if (search.trim() !== '') return false;
    if (status !== 'all') return false;
    if (sort !== 'desc') return false;
    if (page * LIMIT > transactions.length + LIMIT) return false;
    return true;
  }, [search, status, sort, page, transactions.length]);

  const load = useCallback(async (isRefresh = false) => {
    if (isCovered && !isRefresh) {
      // Local cache logic
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
        sort,
        status: status !== 'all' ? status : undefined,
        q: search.trim() || undefined,
      });
      setRows(res.data);
      setTotal(res.pagination.total);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Gagal memuat transaksi.';
      setError(msg);
      setRows([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, sort, status, search, isCovered, transactions]);

  useEffect(() => { void load(); }, [load]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [status, sort, search]);

  const handleRefresh = useCallback(() => { void load(true); }, [load]);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleVoidSuccess = () => {
    setVoidTarget(null);
    setDetail(null);
    showFeedback('Permintaan void dikirim ke Owner');
    void load();
  };

  const hasMore = total > LIMIT;

  // ── Render ──
  const renderCard = useCallback(({ item }: { item: HistoryTransaction }) => (
    <TransactionCard
      transaction={item}
      isDark={isDark}
      onDetail={setDetail}
    />
  ), [isDark]);

  const keyExtractor = useCallback((item: HistoryTransaction) => item.id, []);

  const renderFilters = () => (
    <View style={[styles.filterBox, { backgroundColor: c.bgCard, borderColor: c.border, marginTop: isLandscape ? 8 : 10, marginHorizontal: isLandscape ? 12 : 16 }]}>
      {/* Search */}
      <View style={[styles.searchRow, { backgroundColor: c.bgInput, borderColor: c.border }]}>
        <Search size={16} color={c.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: c.text }]}
          placeholder="Cari nama atau ID..."
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
              <Text style={[
                styles.chipText,
                { color: active ? '#fff' : c.textSecondary },
              ]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Sort */}
      <View style={styles.chipRow}>
        {SORT_OPTIONS.map((s) => {
          const active = sort === s.key;
          return (
            <TouchableOpacity
              key={s.key}
              onPress={() => setSort(s.key)}
              style={[
                styles.chip,
                active
                  ? { backgroundColor: c.accent }
                  : { borderWidth: 1, borderColor: c.border },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.chipText,
                { color: active ? '#fff' : c.textSecondary },
              ]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={c.accent} />
          <Text style={[styles.stateText, { color: c.textMuted }]}>Memuat transaksi...</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.centerState}>
          <AlertCircle size={40} color={c.error} strokeWidth={1.5} />
          <Text style={[styles.stateText, { color: c.error }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryBtn, { borderColor: c.accent }]}
            onPress={() => void load()}
          >
            <Text style={[styles.retryText, { color: c.accent }]}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <FlatList
        data={rows}
        renderItem={renderCard}
        keyExtractor={keyExtractor}
        contentContainerStyle={[styles.listContent, { paddingTop: isLandscape ? 12 : 6 }]}
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
            <Text style={[styles.stateTitle, { color: c.text }]}>Belum ada transaksi</Text>
            <Text style={[styles.stateText, { color: c.textSecondary }]}>
              Mulai shift dan proses transaksi di POS
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
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
      {isLandscape ? (
        <View style={{ flex: 1, flexDirection: 'row' }}>
          {/* Left Panel: Header + Filters */}
          <View style={{ width: 280, borderRightWidth: 1, borderRightColor: c.border }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
              {/* Compressed Header */}
              <View style={[styles.headerSection, { paddingBottom: 0 }]}>
                <Text style={[styles.titleText, { color: c.text, fontSize: 18 }]}>
                  Riwayat <Text style={{ color: c.accent }}>Transaksi</Text>
                </Text>
                <Text style={[styles.subtitleText, { color: c.textSecondary, fontSize: 10, marginTop: 2 }]}>
                  {todayLabel}
                </Text>
              </View>

              {/* Feedback Msg */}
              {feedbackMsg && (
                <View style={[styles.feedbackBar, { backgroundColor: c.successBg, marginVertical: 6, marginHorizontal: 12 }]}>
                  <Text style={[styles.feedbackText, { color: c.success, fontSize: 11 }]}>{feedbackMsg}</Text>
                </View>
              )}

              {/* Filters */}
              {renderFilters()}
            </ScrollView>
          </View>

          {/* Right Panel: Content */}
          <View style={{ flex: 1 }}>
            {renderContent()}
          </View>
        </View>
      ) : (
        // Portrait Layout
        <>
          {/* Header */}
          <View style={styles.headerSection}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.titleText, { color: c.text }]}>
                  Riwayat <Text style={{ color: c.accent }}>Transaksi</Text>
                </Text>
                <Text style={[styles.subtitleText, { color: c.textSecondary }]}>
                  {todayLabel}
                </Text>
              </View>
              {isCovered && (
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 4,
                  paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
                  backgroundColor: isDark ? '#292524' : '#fef3c7',
                }}>
                  <Zap size={10} color="#f59e0b" />
                  <Text style={{ fontSize: 10, fontWeight: '700', color: "#f59e0b" }}>
                    Offline
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Feedback */}
          {feedbackMsg && (
            <View style={[styles.feedbackBar, { backgroundColor: c.successBg }]}>
              <Text style={[styles.feedbackText, { color: c.success }]}>{feedbackMsg}</Text>
            </View>
          )}

          {renderFilters()}
          {renderContent()}
        </>
      )}

      {/* Detail Sheet */}
      {detail && (
        <TransactionDetailSheet
          transaction={detail}
          userRole="cashier"
          visible={!!detail}
          onClose={() => setDetail(null)}
          onVoidRequest={() => setVoidTarget(detail)}
        />
      )}

      {/* Void Request Modal */}
      {voidTarget && (
        <VoidRequestModal
          transaction={voidTarget}
          visible={!!voidTarget}
          onClose={() => setVoidTarget(null)}
          onSuccess={handleVoidSuccess}
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
  filterBox: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 8,
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
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
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
    paddingTop: 6,
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
