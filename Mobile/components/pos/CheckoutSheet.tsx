import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, Switch, KeyboardAvoidingView, Platform, Keyboard, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, CreditCard } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { usePOSCart } from '../../contexts/POSCartContext';
import { formatRupiah } from '../../utils/currency';
import { useApp } from '../../contexts/AppContext';

interface CheckoutSheetProps {
  visible: boolean;
  onClose: () => void;
  onProceedPayment: () => void;
  inline?: boolean;
}

export default function CheckoutSheet({ visible, onClose, onProceedPayment, inline = false }: CheckoutSheetProps) {
  const insets = useSafeAreaInsets();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  const {
    cart, checkout: checkoutData, getCheckoutData,
    setOrderType, setTableNumber, setCustomerName, setOrderNote, setApplyTax,
    subtotal, taxAmount, total, cartIsEmpty,
  } = usePOSCart();

  const checkoutRefs = getCheckoutData?.() || checkoutData;
  const [localTable, setLocalTable] = React.useState(checkoutRefs.tableNumber || '');
  const [localCustomer, setLocalCustomer] = React.useState(checkoutRefs.customerName || '');
  const [localNote, setLocalNote] = React.useState(checkoutRefs.orderNote || '');
  const { settings } = useApp();

  // Sync local input state from refs whenever the sheet becomes visible.
  // This ensures resetCheckout() clears the stale values from previous transactions.
  React.useEffect(() => {
    if (visible) {
      const fresh = getCheckoutData?.() || checkoutData;
      setLocalTable(fresh.tableNumber || '');
      setLocalCustomer(fresh.customerName || '');
      setLocalNote(fresh.orderNote || '');
    }
  }, [visible]); // Only re-run when visibility changes

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

  const formContent = (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{
        backgroundColor: c.bgCard,
        flex: 1,
        borderTopLeftRadius: inline ? 0 : 24,
        borderTopRightRadius: inline ? 0 : 24,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: inline ? 12 : 20, paddingVertical: inline ? 10 : 16,
        borderBottomWidth: 1, borderBottomColor: c.border,
      }}>
        <TouchableOpacity onPress={onClose}>
          <ArrowLeft size={inline ? 18 : 20} color={c.textSecondary} />
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: inline ? 14 : 16, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Checkout Detail
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: inline ? 12 : 20, paddingTop: inline ? 4 : 8, paddingBottom: inline ? 60 + insets.bottom : 100 + insets.bottom }} showsVerticalScrollIndicator={false}>
        {/* Order Type */}
        <Text style={{ color: c.textMuted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginBottom: 4 }}>
          Tipe Order
        </Text>
        <View style={{ flexDirection: 'row', gap: inline ? 4 : 8, marginBottom: inline ? 8 : 12 }}>
          {(['dine-in', 'take-away'] as const).map(type => (
            <TouchableOpacity
              key={type}
              onPress={() => handleOrderTypeSelect(type)}
              style={{
                flex: 1, paddingVertical: inline ? 8 : 12, borderRadius: inline ? 8 : 12, alignItems: 'center',
                backgroundColor: checkoutData.orderType === type ? c.accent : c.bgInput,
                borderWidth: checkoutData.orderType === type ? 0 : 1, borderColor: c.border,
              }}
            >
              <Text style={{
                color: checkoutData.orderType === type ? c.textInverse : c.textSecondary,
                fontWeight: '700', fontSize: inline ? 11 : 13,
              }}>
                {type === 'dine-in' ? '🍽 Dine In' : '📦 Take Away'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Table Number (Dine-in only) */}
        {checkoutData.orderType === 'dine-in' && (
          <>
            <Text style={{ color: c.textMuted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginBottom: 4 }}>
              Nomor Meja
            </Text>
            <TextInput
              value={localTable}
              onChangeText={v => { 
                if (v === '' || /^\d+$/.test(v)) {
                  setLocalTable(v);
                  setTableNumber(v); 
                }
              }}
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
                borderRadius: inline ? 8 : 12, color: c.text, padding: inline ? 8 : 12, fontSize: inline ? 12 : 14, marginBottom: inline ? 8 : 12,
              }}
            />
          </>
        )}

        {/* Customer Name */}
        <Text style={{ color: c.textMuted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginBottom: 4 }}>
          Nama Customer (opsional)
        </Text>
        <TextInput
          value={localCustomer}
          onChangeText={v => {
            setLocalCustomer(v);
            setCustomerName(v);
          }}
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
            borderRadius: inline ? 8 : 12, color: c.text, padding: inline ? 8 : 12, fontSize: inline ? 12 : 14, marginBottom: inline ? 8 : 12,
          }}
        />

        {/* Order Notes */}
        <Text style={{ color: c.textMuted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginBottom: 4 }}>
          Catatan Pesanan (opsional)
        </Text>
        <TextInput
          value={localNote}
          onChangeText={v => {
            setLocalNote(v);
            setOrderNote(v);
          }}
          placeholder="e.g. No sugar, extra hot..."
          placeholderTextColor={c.textMuted}
          multiline
          style={{
            backgroundColor: c.bgInput, borderWidth: 1, borderColor: c.border,
            borderRadius: inline ? 8 : 12, color: c.text, padding: inline ? 8 : 12, fontSize: inline ? 12 : 14,
            marginBottom: inline ? 8 : 12, minHeight: inline ? 40 : 60, textAlignVertical: 'top',
          }}
        />

        {/* Order Summary */}
        <View style={{
          backgroundColor: c.bgInput, borderWidth: 1, borderColor: c.border,
          borderRadius: inline ? 10 : 16, padding: inline ? 10 : 16,
        }}>
          <Text style={{ color: c.textMuted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginBottom: inline ? 6 : 10 }}>
            Ringkasan
          </Text>

          {cart.map((item, idx) => (
            <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: inline ? 4 : 6 }}>
              <Text style={{ color: c.textSecondary, fontSize: inline ? 10 : 12, flex: 1 }} numberOfLines={1}>
                {item.quantity}× {item.name || item.note || 'Item'}
              </Text>
              <Text style={{ color: c.text, fontSize: inline ? 10 : 12, fontWeight: '600', marginLeft: 8 }}>
                {formatRupiah((item.price + (item.variantPrice || 0)) * item.quantity)}
              </Text>
            </View>
          ))}

          <View style={{ height: 1, backgroundColor: c.border, marginVertical: inline ? 6 : 10 }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: inline ? 4 : 6 }}>
            <Text style={{ color: c.textSecondary, fontSize: inline ? 10 : 12 }}>Subtotal</Text>
            <Text style={{ color: c.text, fontSize: inline ? 10 : 12, fontWeight: '600' }}>{formatRupiah(subtotal)}</Text>
          </View>

          {checkoutData.applyTax && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: inline ? 4 : 6 }}>
              <Text style={{ color: c.textSecondary, fontSize: inline ? 10 : 12 }}>
                {settings?.tax_label || settings?.taxLabel || 'PPN'} {settings?.tax_rate ?? settings?.taxRate ?? 11}%
              </Text>
              <Text style={{ color: c.text, fontSize: inline ? 10 : 12, fontWeight: '600' }}>
                {formatRupiah(taxAmount)}
              </Text>
            </View>
          )}

          <View style={{ height: 1, backgroundColor: c.border, marginVertical: inline ? 4 : 6 }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: c.text, fontSize: inline ? 13 : 16, fontWeight: '900' }}>Total</Text>
            <Text style={{ color: c.accent, fontSize: inline ? 13 : 16, fontWeight: '900' }}>{formatRupiah(total)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        flexDirection: 'row', gap: inline ? 6 : 10,
        paddingHorizontal: inline ? 10 : 16,
        paddingTop: inline ? 10 : 16,
        paddingBottom: inline ? Math.max(insets.bottom, 10) : (insets.bottom > 0 ? insets.bottom + 12 : 16),
        backgroundColor: c.bgCard,
        borderTopWidth: 1, borderTopColor: c.border,
      }}>
        <TouchableOpacity
          onPress={onClose}
          style={{
            flex: 1, borderWidth: 1, borderColor: c.border,
            borderRadius: inline ? 10 : 14, paddingVertical: inline ? 10 : 16, alignItems: 'center',
          }}
        >
          <Text style={{ color: c.text, fontWeight: '800', fontSize: inline ? 12 : 14 }}>Batal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onProceedPayment}
          style={{
            flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
            backgroundColor: c.accent, borderRadius: inline ? 10 : 14, paddingVertical: inline ? 10 : 16,
          }}
        >
          <CreditCard size={inline ? 14 : 16} color={c.textInverse} />
          <Text style={{ color: c.textInverse, fontWeight: '900', fontSize: inline ? 12 : 14 }}>Proses Pembayaran</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  if (inline) {
    if (!visible) return null;
    return (
      <View style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: c.bgCard,
        zIndex: 1000,
      }}>
        {formContent}
      </View>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={{
          backgroundColor: c.bgCard,
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          borderTopWidth: 1, borderTopColor: c.border,
          maxHeight: '90%',
          width: '100%',
          flex: 1,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 10,
        }}>
          {formContent}
        </View>
      </View>
    </Modal>
  );
}
