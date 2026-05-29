import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, RefreshControl, Alert, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Inbox, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { formatFullDate } from '../../utils/dateFormatter';
import { historyApi } from '../../services/historyApi';
import { ApiError } from '../../services/api';
import type { HistoryTransaction, HistoryTransactionStatus } from '../../types/historyTransaction';
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
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

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

  const load = useCallback(async (isRefresh = false) => {
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
  }, [page, sort, status, search]);

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={[styles.titleText, { color: c.text }]}>
          Riwayat <Text style={{ color: c.accent }}>Transaksi</Text>
        </Text>
        <Text style={[styles.subtitleText, { color: c.textSecondary }]}>
          Transaksi Hari Ini — {todayLabel}
        </Text>
      </View>

      {/* Feedback */}
      {feedbackMsg && (
        <View style={[styles.feedbackBar, { backgroundColor: c.successBg }]}>
          <Text style={[styles.feedbackText, { color: c.success }]}>{feedbackMsg}</Text>
        </View>
      )}

      {/* Filters */}
      <View style={[styles.filterBox, { backgroundColor: c.bgCard, borderColor: c.border }]}>
        {/* Search */}
        <View style={[styles.searchRow, { backgroundColor: c.bgInput, borderColor: c.border }]}>
          <Search size={16} color={c.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: c.text }]}
            placeholder="Cari nama pelanggan atau ID transaksi"
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

      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={c.accent} />
          <Text style={[styles.stateText, { color: c.textMuted }]}>Memuat transaksi...</Text>
        </View>
      ) : error ? (
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
      ) : (
        <FlatList
          data={rows}
          renderItem={renderCard}
          keyExtractor={keyExtractor}
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
