/**
 * NeedsReviewModal — Owner interface for resolving offline transaction stock conflicts
 * 
 * Allows owners to review transactions that resulted in negative stock during sync
 * and decide whether to accept the transaction or void it.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Modal, FlatList,
  ActivityIndicator, Alert, StyleSheet, TextInput, ScrollView,
} from 'react-native';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, X, ShieldAlert } from 'lucide-react-native';
import { historyApi } from '../../services/historyApi';
import type { HistoryTransaction } from '../../types/historyTransaction';
import { formatRupiah } from '../../utils/currency';
import { formatDateTime } from '../../utils/dateFormatter';
import { useColors } from '../../utils/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onResolved?: () => void;
  isDark?: boolean;
}

export default function NeedsReviewModal({ visible, onClose, onResolved, isDark = false }: Props) {
  const { colors: c } = useColors();

  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [items, setItems] = useState<HistoryTransaction[]>([]);
  const [selectedTx, setSelectedTx] = useState<HistoryTransaction | null>(null);
  const [note, setNote] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await historyApi.getNeedsReview();
      setItems(res.data || []);
    } catch (err: any) {
      console.error('[NeedsReviewModal] Failed to load:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadData();
      setSelectedTx(null);
      setNote('');
    }
  }, [visible, loadData]);

  const handleResolve = async (action: 'accept' | 'void') => {
    if (!selectedTx) return;

    const actionText = action === 'accept' ? 'menerima' : 'membatalkan (void)';
    Alert.alert(
      `Konfirmasi ${action === 'accept' ? 'Terima' : 'Void'}`,
      `Apakah Anda yakin ingin ${actionText} transaksi #${selectedTx.id.slice(0, 8).toUpperCase()}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: action === 'accept' ? 'Terima Transaksi' : 'Void Transaksi',
          style: action === 'accept' ? 'default' : 'destructive',
          onPress: async () => {
            setResolvingId(selectedTx.id);
            try {
              await historyApi.resolveReview(selectedTx.id, action, note.trim() || undefined);
              Alert.alert(
                'Berhasil',
                `Transaksi telah di-${action === 'accept' ? 'terima' : 'void'}.`
              );
              setSelectedTx(null);
              setNote('');
              loadData();
              onResolved?.();
            } catch (err: any) {
              Alert.alert('Gagal', err?.message || 'Gagal memproses review');
            } finally {
              setResolvingId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: c.bgCard, borderColor: c.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: c.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.iconBg, { backgroundColor: isDark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.1)' }]}>
                <ShieldAlert size={20} color={isDark ? '#FCD34D' : '#D97706'} />
              </View>
              <View>
                <Text style={[styles.title, { color: c.text }]}>Review Transaksi Offline</Text>
                <Text style={[styles.subtitle, { color: c.textMuted }]}>
                  {items.length} transaksi memerlukan konfirmasi stok
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={c.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={c.accent} />
              <Text style={[styles.loadingText, { color: c.textMuted }]}>Memuat transaksi...</Text>
            </View>
          ) : items.length === 0 ? (
            <View style={styles.centerContainer}>
              <CheckCircle size={44} color="#16A34A" strokeWidth={1.5} />
              <Text style={[styles.emptyTitle, { color: c.text }]}>Semua Transaksi Wajar</Text>
              <Text style={[styles.emptySubtitle, { color: c.textMuted }]}>
                Tidak ada transaksi offline yang mengalami konflik stok.
              </Text>
            </View>
          ) : (
            <View style={{ flex: 1, flexDirection: selectedTx ? 'row' : 'column' }}>
              {/* List */}
              <View style={{ flex: selectedTx ? 1 : undefined, flexGrow: 1 }}>
                <FlatList
                  data={items}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={{ padding: 12 }}
                  renderItem={({ item }) => {
                    const isSelected = selectedTx?.id === item.id;
                    const reviewReason = (item as any).review_reason || 'Konflik stok saat sync';
                    return (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setSelectedTx(item)}
                        style={[
                          styles.card,
                          {
                            backgroundColor: isSelected
                              ? (isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.08)')
                              : c.bg,
                            borderColor: isSelected ? '#D97706' : c.border,
                          },
                        ]}
                      >
                        <View style={styles.cardHeader}>
                          <Text style={[styles.cardId, { color: c.textMuted }]}>
                            #{item.id.slice(0, 8).toUpperCase()}
                          </Text>
                          <Text style={[styles.cardDate, { color: c.textSecondary }]}>
                            {formatDateTime(item.created_at)}
                          </Text>
                        </View>

                        <Text style={[styles.cardCashier, { color: c.text }]}>
                          Kasir: <Text style={{ fontWeight: '700' }}>{item.cashier_name || 'Kasir'}</Text>
                          {item.customer_name ? ` • Pelanggan: ${item.customer_name}` : ''}
                        </Text>

                        {/* Reason Banner */}
                        <View style={[styles.reasonBox, { backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)' }]}>
                          <AlertTriangle size={13} color="#DC2626" />
                          <Text style={[styles.reasonText, { color: isDark ? '#FCA5A5' : '#DC2626' }]}>
                            {reviewReason}
                          </Text>
                        </View>

                        <View style={styles.cardFooter}>
                          <Text style={[styles.cardTotal, { color: c.accent }]}>
                            {formatRupiah(item.total_amount)}
                          </Text>
                          <Text style={[styles.cardItemCount, { color: c.textMuted }]}>
                            {(item.items || []).length} item
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>

              {/* Detail & Action Panel (when selected) */}
              {selectedTx && (
                <View style={[styles.detailPanel, { backgroundColor: c.bg, borderLeftColor: c.border }]}>
                  <ScrollView style={{ flex: 1, padding: 14 }}>
                    <Text style={[styles.detailTitle, { color: c.text }]}>
                      Detail Transaksi #{selectedTx.id.slice(0, 8).toUpperCase()}
                    </Text>

                    {/* Reason */}
                    <View style={[styles.detailReasonBox, { backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)' }]}>
                      <Text style={[styles.detailReasonHeader, { color: isDark ? '#FCA5A5' : '#DC2626' }]}>
                        ⚠️ Penyebab Perlu Review:
                      </Text>
                      <Text style={[styles.detailReasonBody, { color: isDark ? '#FCA5A5' : '#DC2626' }]}>
                        {(selectedTx as any).review_reason || 'Stok menjadi minus saat transaksi offline di-sync.'}
                      </Text>
                    </View>

                    {/* Items List */}
                    <Text style={[styles.sectionLabel, { color: c.textMuted }]}>ITEM TRANSAKSI</Text>
                    {(selectedTx.items || []).map((it, idx) => (
                      <View key={idx} style={[styles.itemRow, { borderBottomColor: c.border }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.itemName, { color: c.text }]}>{it.product_name}</Text>
                          <Text style={[styles.itemPrice, { color: c.textMuted }]}>
                            {formatRupiah(it.unit_price)} × {it.quantity}
                          </Text>
                        </View>
                        <Text style={[styles.itemSubtotal, { color: c.text }]}>
                          {formatRupiah(it.subtotal)}
                        </Text>
                      </View>
                    ))}

                    <View style={[styles.totalRow, { borderTopColor: c.border }]}>
                      <Text style={[styles.totalLabel, { color: c.text }]}>Total Transaksi</Text>
                      <Text style={[styles.totalVal, { color: c.accent }]}>
                        {formatRupiah(selectedTx.total_amount)}
                      </Text>
                    </View>

                    {/* Note Input */}
                    <Text style={[styles.sectionLabel, { color: c.textMuted, marginTop: 14 }]}>CATATAN OWNER (OPSIONAL)</Text>
                    <TextInput
                      placeholder="Contoh: Stok diisi ulang manual / Transaksi sah"
                      placeholderTextColor={c.textMuted}
                      value={note}
                      onChangeText={setNote}
                      style={[styles.noteInput, { backgroundColor: c.bgCard, color: c.text, borderColor: c.border }]}
                    />
                  </ScrollView>

                  {/* Actions */}
                  <View style={[styles.actionRow, { borderTopColor: c.border }]}>
                    <TouchableOpacity
                      onPress={() => handleResolve('void')}
                      disabled={resolvingId === selectedTx.id}
                      style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(239,68,68,0.2)' : '#FEE2E2', borderColor: '#EF4444' }]}
                    >
                      {resolvingId === selectedTx.id ? (
                        <ActivityIndicator size="small" color="#DC2626" />
                      ) : (
                        <>
                          <XCircle size={16} color="#DC2626" />
                          <Text style={{ color: '#DC2626', fontWeight: '700', fontSize: 13 }}>Void Transaksi</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleResolve('accept')}
                      disabled={resolvingId === selectedTx.id}
                      style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(34,197,94,0.2)' : '#DCFCE7', borderColor: '#22C55E' }]}
                    >
                      {resolvingId === selectedTx.id ? (
                        <ActivityIndicator size="small" color="#16A34A" />
                      ) : (
                        <>
                          <CheckCircle size={16} color="#16A34A" />
                          <Text style={{ color: '#16A34A', fontWeight: '700', fontSize: 13 }}>Terima Transaksi</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 720,
    height: '85%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  closeBtn: {
    padding: 6,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardId: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  cardDate: {
    fontSize: 11,
  },
  cardCashier: {
    fontSize: 12,
    marginBottom: 6,
  },
  reasonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
  },
  reasonText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTotal: {
    fontSize: 14,
    fontWeight: '800',
  },
  cardItemCount: {
    fontSize: 11,
  },
  detailPanel: {
    width: 320,
    borderLeftWidth: 1,
  },
  detailTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  detailReasonBox: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  detailReasonHeader: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 2,
  },
  detailReasonBody: {
    fontSize: 11,
    lineHeight: 16,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemPrice: {
    fontSize: 10,
  },
  itemSubtotal: {
    fontSize: 12,
    fontWeight: '700',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    marginTop: 8,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  totalVal: {
    fontSize: 15,
    fontWeight: '900',
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 11,
    minHeight: 40,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
});
