import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Modal, ScrollView, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import type { HistoryTransaction } from '../../types/historyTransaction';
import { getColors } from '../../utils/theme';
import { formatRupiah } from '../../utils/currency';
import { formatDateTime } from '../../utils/dateFormatter';
import { historyApi } from '../../services/historyApi';
import { ApiError } from '../../services/api';

interface VoidRequestModalProps {
  transaction: HistoryTransaction;
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isDark: boolean;
}

export default function VoidRequestModal({
  transaction: t,
  visible,
  onClose,
  onSuccess,
  isDark,
}: VoidRequestModalProps) {
  const c = getColors(isDark);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (reason.trim().length < 5) {
      setError('Alasan minimal 5 karakter.');
      return;
    }
    setLoading(true);
    try {
      await historyApi.submitVoidRequest(t.id, reason.trim());
      setReason('');
      onSuccess();
    } catch (ex) {
      const msg =
        ex instanceof ApiError ? ex.message
          : ex instanceof Error ? ex.message
            : 'Gagal mengirim permintaan void.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setReason('');
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
            <Text style={[styles.title, { color: c.text }]}>Ajukan Pembatalan</Text>

            {/* Warning */}
            <View style={[styles.warningBox, {
              backgroundColor: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(217,119,6,0.08)',
              borderColor: isDark ? 'rgba(245,158,11,0.3)' : 'rgba(217,119,6,0.3)',
            }]}>
              <Text style={[styles.warningText, { color: isDark ? '#fcd34d' : '#92400e' }]}>
                ⚠️ Pembatalan transaksi memerlukan persetujuan Owner. Transaksi tidak akan langsung dibatalkan.
              </Text>
            </View>

            {/* Transaction Info */}
            <View style={[styles.infoBox, { backgroundColor: c.bgInput, borderColor: c.border }]}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: c.textMuted }]}>Total Transaksi</Text>
                <Text style={[styles.infoValue, { color: c.accent }]}>
                  {formatRupiah(t.total_amount)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: c.textMuted }]}>Waktu</Text>
                <Text style={[styles.infoValue, { color: c.text }]}>
                  {formatDateTime(t.created_at)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: c.textMuted }]}>Pelanggan</Text>
                <Text style={[styles.infoValue, { color: c.text }]}>
                  {t.customer_name?.trim() || 'Umum'}
                </Text>
              </View>
            </View>

            {/* Error */}
            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            {/* Reason Input */}
            <Text style={[styles.label, { color: c.textSecondary }]}>Alasan Pembatalan</Text>
            <TextInput
              style={[styles.textArea, {
                backgroundColor: c.bgInput,
                borderColor: c.border,
                color: c.text,
              }]}
              placeholder="Contoh: Pelanggan salah pesan, minta ganti menu"
              placeholderTextColor={c.textMuted}
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={4}
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
                style={[styles.btnSubmit, { backgroundColor: c.accent, opacity: loading ? 0.6 : 1 }]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.btnSubmitText}>Kirim Permintaan</Text>
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
    minHeight: 100,
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
