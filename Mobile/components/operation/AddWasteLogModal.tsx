import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { useApp } from '../../contexts/AppContext';

interface AddWasteLogModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AddWasteLogModal({ visible, onClose }: AddWasteLogModalProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscape = windowWidth > windowHeight;
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);
  const { products, addWasteLog } = useApp();

  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('damaged'); // 'expired', 'damaged', 'spilled', 'other'
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const availableProducts = products.filter(p => p.stock > 0 || p.stock === -1);
  const selectedProduct = products.find(p => p.id === productId);

  const handleSave = async () => {
    if (!productId) return alert('Pilih produk terlebih dahulu.');
    const q = parseInt(quantity, 10);
    if (!q || isNaN(q) || q <= 0) return alert('Kuantitas tidak valid.');
    
    if (selectedProduct && selectedProduct.stock !== -1 && q > selectedProduct.stock) {
      return alert(`Kuantitas melebihi stok tersedia (${selectedProduct.stock}).`);
    }

    try {
      setLoading(true);
      await addWasteLog({
        productId,
        quantity: q,
        reason,
        notes: notes.trim()
      });
      handleClose();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan waste log.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setProductId('');
    setQuantity('');
    setReason('damaged');
    setNotes('');
    onClose();
  };

  const reasons = [
    { id: 'damaged', label: 'Rusak' },
    { id: 'expired', label: 'Kadaluarsa' },
    { id: 'spilled', label: 'Tumpah' },
    { id: 'other', label: 'Lainnya' }
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.modalContainer, { backgroundColor: c.bgCard, borderColor: c.borderLight }]}
        >
          <View style={[styles.modalHeader, { borderBottomColor: c.borderLight }]}>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: '800' }}>Catat Waste Log</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={24} color={c.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer} contentContainerStyle={{ gap: 16 }}>
            {/* Product Selection */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: c.textSecondary }]}>PILIH PRODUK (STOK TERSEDIA)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16, paddingHorizontal: 16 }} contentContainerStyle={{ gap: 8 }}>
                {availableProducts.map(p => (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => setProductId(p.id)}
                    style={{
                      paddingHorizontal: 12, paddingVertical: 8,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: productId === p.id ? c.accent : c.borderLight,
                      backgroundColor: productId === p.id ? c.accentBg : c.bgInput,
                      alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    <Text style={{ color: productId === p.id ? c.accent : c.text, fontSize: 12, fontWeight: '700' }}>
                      {p.name}
                    </Text>
                    <Text style={{ color: c.textMuted, fontSize: 10 }}>Stok: {p.stock === -1 ? '∞' : p.stock}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Quantity */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: c.textSecondary }]}>JUMLAH / KUANTITAS</Text>
              <TextInput
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                placeholder="Masukkan jumlah yang terbuang..."
                placeholderTextColor={c.textMuted}
                style={[styles.formInput, { backgroundColor: c.bgInput, borderColor: c.borderLight, color: c.text }]}
              />
            </View>

            {/* Reason */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: c.textSecondary }]}>ALASAN WASTE</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {reasons.map(r => (
                  <TouchableOpacity
                    key={r.id}
                    onPress={() => setReason(r.id)}
                    style={{
                      paddingHorizontal: 16, paddingVertical: 10,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: reason === r.id ? c.accent : c.borderLight,
                      backgroundColor: reason === r.id ? c.accentBg : c.bgInput,
                    }}
                  >
                    <Text style={{ color: reason === r.id ? c.accent : c.text, fontSize: 13, fontWeight: '700' }}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Notes */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: c.textSecondary }]}>CATATAN TAMBAHAN (OPSIONAL)</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Tambahkan catatan jika perlu..."
                placeholderTextColor={c.textMuted}
                style={[styles.formInput, { backgroundColor: c.bgInput, borderColor: c.borderLight, color: c.text }]}
              />
            </View>
            <View style={{ height: 20 }} />
          </ScrollView>

          <View style={[styles.modalFooter, { borderTopColor: c.borderLight }]}>
            <TouchableOpacity onPress={handleClose} style={[styles.actionBtn, { backgroundColor: c.bgInput, borderWidth: 1, borderColor: c.borderLight }]}>
              <Text style={{ color: c.textSecondary, fontSize: 14, fontWeight: '700' }}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleSave} 
              disabled={loading}
              style={[styles.actionBtn, { backgroundColor: c.accent, opacity: loading ? 0.7 : 1 }]}
            >
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>
                {loading ? 'Menyimpan...' : 'Simpan Waste'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 4,
  },
  formContainer: {
    padding: 16,
  },
  formGroup: {
    gap: 6,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
