import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Modal, ScrollView, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import type { HistoryTransaction } from '../../types/historyTransaction';
import { getColors } from '../../utils/theme';
import { formatRupiah } from '../../utils/currency';
import { historyApi } from '../../services/historyApi';
import { ApiError } from '../../services/api';

interface VoidReviewModalProps {
  transaction: HistoryTransaction;
  action: 'approve' | 'reject' | 'direct-void';
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isDark: boolean;
}

export default function VoidReviewModal({
  transaction: t,
  action,
  visible,
  onClose,
  onSuccess,
  isDark,
}: VoidReviewModalProps) {
  const c = getColors(isDark);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isApprove = action === 'approve';
  const isDirect = action === 'direct-void';
  const title = isApprove ? 'Setujui Pembatalan' : isDirect ? 'Batalkan Transaksi' : 'Tolak Pembatalan';

  const handleSubmit = async () => {
    setError(null);
    if (!isApprove && !isDirect && note.trim().length < 1) {
      setError('Catatan penolakan wajib diisi.');
      return;
    }
    setLoading(true);
    try {
      if (isDirect) {
        await historyApi.directVoid(t.id, note.trim());
      } else if (isApprove) {
        await historyApi.approveVoid(t.id, note.trim() || undefined);
      } else {
        await historyApi.rejectVoid(t.id, note.trim());
      }
      setNote('');
      onSuccess();
    } catch (ex) {
      const msg =
        ex instanceof ApiError ? ex.message
          : ex instanceof Error ? ex.message
            : 'Gagal memproses permintaan.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setNote('');
      setError(null);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={[styles.sheet, { backgroundColor: c.bgCard }]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: c.textMuted }]} />

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <Text style={[styles.title, { color: c.text }]}>{title}</Text>

            {/* Transaction Info */}
            <View style={[styles.infoBox, { backgroundColor: c.bgInput, borderColor: c.border }]}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: c.textMuted }]}>Total Transaksi</Text>
                <Text style={[styles.infoValue, { color: c.accent }]}>
                  {formatRupiah(t.total_amount)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: c.textMuted }]}>Kasir</Text>
                <Text style={[styles.infoValue, { color: c.text }]}>
                  {t.cashier_name || '-'}
                </Text>
              </View>
              {!isDirect && (
                <>
                  <View style={[styles.divider, { borderTopColor: c.border }]} />
                  <Text style={[styles.reasonLabel, { color: c.textMuted }]}>Alasan Kasir:</Text>
                  <Text style={[styles.reasonText, { color: c.text }]}>
                    {t.void_reason || '-'}
                  </Text>
                </>
              )}
            </View>

            {/* Warning for approve & direct-void */}
            {(isApprove || isDirect) && (
              <View style={[styles.warningBox, {
                backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(220,38,38,0.08)',
                borderColor: isDark ? 'rgba(239,68,68,0.3)' : 'rgba(220,38,38,0.3)',
              }]}>
                <Text style={[styles.warningText, { color: isDark ? '#fca5a5' : '#991b1b' }]}>
                  ⚠️ Transaksi akan dibatalkan permanen. Data penjualan shift akan disesuaikan secara otomatis.
                </Text>
              </View>
            )}

            {/* Error */}
            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            {/* Note Input */}
            <Text style={[styles.label, { color: c.textSecondary }]}>
              {(isApprove || isDirect) ? 'Catatan (opsional)' : 'Alasan penolakan (wajib)'}
            </Text>
            <TextInput
              style={[styles.textArea, {
                backgroundColor: c.bgInput,
                borderColor: c.border,
                color: c.text,
                minHeight: (isApprove || isDirect) ? 72 : 100,
              }]}
              placeholder={(isApprove || isDirect) ? 'Catatan internal...' : 'Jelaskan alasan penolakan'}
              placeholderTextColor={c.textMuted}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={isApprove ? 3 : 4}
              textAlignVertical="top"
              editable={!loading}
            />

            {/* Buttons */}
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.btnCancel, { borderColor: c.border }]}
                onPress={handleClose}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={[styles.btnCancelText, { color: c.textSecondary }]}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.btnSubmit,
                  {
                    backgroundColor: (isApprove || isDirect) ? '#dc2626' : c.accent,
                    opacity: loading ? 0.6 : 1,
                  },
                ]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.btnSubmitText}>
                    {isApprove ? 'Setujui Void' : isDirect ? 'Batalkan Transaksi' : 'Tolak Permintaan'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
    opacity: 0.4,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 14,
  },
  infoBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    borderTopWidth: 1,
    marginVertical: 4,
  },
  reasonLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reasonText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  warningBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ef4444',
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    marginBottom: 16,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnCancel: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnCancelText: {
    fontSize: 13,
    fontWeight: '700',
  },
  btnSubmit: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnSubmitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
});
