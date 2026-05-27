import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, Switch, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { ArrowLeft, CreditCard } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { usePOSCart } from '../../contexts/POSCartContext';
import { formatRupiah } from '../../utils/currency';

interface CheckoutSheetProps {
  visible: boolean;
  onClose: () => void;
  onProceedPayment: () => void;
}

export default function CheckoutSheet({ visible, onClose, onProceedPayment }: CheckoutSheetProps) {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);
  const {
    cart, checkout: checkoutData,
    setOrderType, setTableNumber, setCustomerName, setOrderNote, setApplyTax,
    subtotal, taxAmount, total, cartIsEmpty,
  } = usePOSCart();

  const dismissKeyboard = () => {
    Keyboard.dismiss();
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const handleOrderTypeSelect = (type: 'dine-in' | 'take-away') => {
    dismissKeyboard();
    setOrderType(type);
  };

  if (cartIsEmpty) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{
            backgroundColor: c.bgCard,
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            maxHeight: '90%',
          }}
        >
          {/* Header */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 12,
            paddingHorizontal: 20, paddingVertical: 16,
            borderBottomWidth: 1, borderBottomColor: c.border,
          }}>
            <TouchableOpacity onPress={onClose}>
              <ArrowLeft size={20} color={c.textSecondary} />
            </TouchableOpacity>
            <Text style={{ color: c.text, fontSize: 16, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Checkout Detail
            </Text>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
            {/* Order Type */}
            <Text style={{ color: c.textMuted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8 }}>
              Tipe Order
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
              {(['dine-in', 'take-away'] as const).map(type => (
                <TouchableOpacity
                  key={type}
                  onPress={() => handleOrderTypeSelect(type)}
                  style={{
                    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
                    backgroundColor: checkoutData.orderType === type ? c.accent : c.bgInput,
                    borderWidth: checkoutData.orderType === type ? 0 : 1, borderColor: c.border,
                  }}
                >
                  <Text style={{
                    color: checkoutData.orderType === type ? c.textInverse : c.textSecondary,
                    fontWeight: '700', fontSize: 13,
                  }}>
                    {type === 'dine-in' ? '🍽 Dine In' : '📦 Take Away'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Table Number (Dine-in only) */}
            {checkoutData.orderType === 'dine-in' && (
              <>
                <Text style={{ color: c.textMuted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8 }}>
                  Nomor Meja
                </Text>
                <TextInput
                  value={checkoutData.tableNumber}
                  onChangeText={v => { if (v === '' || /^\d+$/.test(v)) setTableNumber(v); }}
                  placeholder="Nomor Meja"
                  placeholderTextColor={c.textMuted}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  blurOnSubmit={true}
                  onSubmitEditing={dismissKeyboard}
                  enterKeyHint="done"
                  onKeyPress={(event: any) => {
                    if (event.nativeEvent?.key === 'Enter') {
                      event.preventDefault?.();
                      dismissKeyboard();
                    }
                  }}
                  style={{
                    backgroundColor: c.bgInput, borderWidth: 1, borderColor: c.border,
                    borderRadius: 12, color: c.text, padding: 12, fontSize: 14, marginBottom: 20,
                  }}
                />
              </>
            )}

            {/* Customer Name */}
            <Text style={{ color: c.textMuted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8 }}>
              Nama Customer (opsional)
            </Text>
            <TextInput
              value={checkoutData.customerName}
              onChangeText={setCustomerName}
              placeholder="Nama customer"
              placeholderTextColor={c.textMuted}
              returnKeyType="done"
              blurOnSubmit={true}
              onSubmitEditing={dismissKeyboard}
              enterKeyHint="done"
              onKeyPress={(event: any) => {
                if (event.nativeEvent?.key === 'Enter') {
                  event.preventDefault?.();
                  dismissKeyboard();
                }
              }}
              style={{
                backgroundColor: c.bgInput, borderWidth: 1, borderColor: c.border,
                borderRadius: 12, color: c.text, padding: 12, fontSize: 14, marginBottom: 20,
              }}
            />

            {/* Order Notes */}
            <Text style={{ color: c.textMuted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8 }}>
              Catatan Pesanan (opsional)
            </Text>
            <TextInput
              value={checkoutData.orderNote}
              onChangeText={setOrderNote}
              placeholder="e.g. No sugar, extra hot..."
              placeholderTextColor={c.textMuted}
              multiline
              style={{
                backgroundColor: c.bgInput, borderWidth: 1, borderColor: c.border,
                borderRadius: 12, color: c.text, padding: 12, fontSize: 14,
                marginBottom: 20, minHeight: 60, textAlignVertical: 'top',
              }}
            />

            {/* Order Summary */}
            <View style={{
              backgroundColor: c.bgInput, borderWidth: 1, borderColor: c.border,
              borderRadius: 16, padding: 16,
            }}>
              <Text style={{ color: c.textMuted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginBottom: 10 }}>
                Ringkasan
              </Text>

              {cart.map((item, idx) => (
                <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ color: c.textSecondary, fontSize: 12, flex: 1 }} numberOfLines={1}>
                    {item.quantity}× {item.name || item.note || 'Item'}
                  </Text>
                  <Text style={{ color: c.text, fontSize: 12, fontWeight: '600', marginLeft: 8 }}>
                    {formatRupiah((item.price + (item.variantPrice || 0)) * item.quantity)}
                  </Text>
                </View>
              ))}

              <View style={{ height: 1, backgroundColor: c.border, marginVertical: 10 }} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: c.textSecondary, fontSize: 12 }}>Subtotal</Text>
                <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>{formatRupiah(subtotal)}</Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={{ color: c.textSecondary, fontSize: 12 }}>PPN 11%</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{
                    color: checkoutData.applyTax ? c.text : c.textMuted,
                    fontSize: 12, fontWeight: '600',
                    textDecorationLine: checkoutData.applyTax ? 'none' : 'line-through',
                  }}>
                    {formatRupiah(taxAmount)}
                  </Text>
                  <Switch
                    value={checkoutData.applyTax}
                    onValueChange={setApplyTax}
                    trackColor={{ false: isDark ? '#333' : '#d1d5db', true: isDark ? 'rgba(245,158,11,0.3)' : 'rgba(13,148,136,0.3)' }}
                    thumbColor={checkoutData.applyTax ? c.accent : (isDark ? '#666' : '#9ca3af')}
                  />
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: c.border, marginVertical: 6 }} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: c.text, fontSize: 16, fontWeight: '900' }}>Total</Text>
                <Text style={{ color: c.accent, fontSize: 16, fontWeight: '900' }}>{formatRupiah(total)}</Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            flexDirection: 'row', gap: 10,
            padding: 16, backgroundColor: c.bgCard,
            borderTopWidth: 1, borderTopColor: c.border,
          }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1, borderWidth: 1, borderColor: c.border,
                borderRadius: 14, paddingVertical: 16, alignItems: 'center',
              }}
            >
              <Text style={{ color: c.text, fontWeight: '800', fontSize: 14 }}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onProceedPayment}
              style={{
                flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                backgroundColor: c.accent, borderRadius: 14, paddingVertical: 16,
              }}
            >
              <CreditCard size={16} color={c.textInverse} />
              <Text style={{ color: c.textInverse, fontWeight: '900', fontSize: 14 }}>Proses Pembayaran</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
