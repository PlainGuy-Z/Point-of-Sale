import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Trash2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useColors } from '../../utils/theme';
import { usePOSCart } from '../../contexts/POSCartContext';
import { formatRupiah } from '../../utils/currency';
import { useApp } from '../../contexts/AppContext';
import CartItem from './CartItem';
import CartItemEditModal from './CartItemEditModal';
import AddManualItemModal from './AddManualItemModal';
import CheckoutSheet from './CheckoutSheet';
import type { CartItemWithInput } from '../../types';

/**
 * CartScreen — standalone page version (used when navigated via router).
 * In portrait mode, POSScreen shows the cart as a modal overlay instead,
 * but this page exists for backward-compatibility and deep-link support.
 */
export default function CartScreen() {
  const router = useRouter();
  const { colors: c, isDark } = useColors();

  const {
    cart, clearCart, updateQuantity, removeAtIndex, updateCartItem, addCustomItem,
    subtotal, taxAmount, total, cartIsEmpty, totalQuantity,
    checkout: checkoutData,
    editingItemIndex, setEditingItemIndex,
  } = usePOSCart();
  const { settings } = useApp();

  const [showManualModal, setShowManualModal] = useState(false);
  const [showCheckoutSheet, setShowCheckoutSheet] = useState(false);

  const editingItem = editingItemIndex !== null ? cart[editingItemIndex] : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12,
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <ArrowLeft size={20} color={c.text} />
          <Text style={{ color: c.text, fontSize: 18, fontWeight: '800' }}>Keranjang</Text>
        </TouchableOpacity>
        {!cartIsEmpty && (
          <TouchableOpacity onPress={clearCart}>
            <Trash2 size={16} color={c.error} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {cartIsEmpty ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ color: c.textMuted, fontSize: 16, fontWeight: '700' }}>Keranjang kosong</Text>
            <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 4 }}>Pilih menu untuk memulai</Text>
          </View>
        ) : (
          <>
            {cart.map((item, idx) => (
              <CartItem
                key={`${item.productId}-${idx}`}
                item={item}
                index={idx}
                onEdit={(i) => setEditingItemIndex(i)}
                onUpdateQuantity={updateQuantity}
                onRemove={removeAtIndex}
                colors={c}
                isDark={isDark}
              />
            ))}
          </>
        )}

        {/* Add manual item */}
        <TouchableOpacity
          onPress={() => setShowManualModal(true)}
          style={{
            borderWidth: 1, borderColor: c.border, borderStyle: 'dashed',
            borderRadius: 16, padding: 14, alignItems: 'center',
            flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8,
          }}
        >
          <Text style={{ color: c.textMuted, fontSize: 13, fontWeight: '600' }}>+ Tambah Item Manual</Text>
        </TouchableOpacity>

        {/* Summary */}
        {!cartIsEmpty && (
          <View style={{
            backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
            borderRadius: 16, padding: 16, marginTop: 16,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ color: c.textSecondary, fontSize: 13 }}>Subtotal</Text>
              <Text style={{ color: c.text, fontSize: 13, fontWeight: '600' }}>{formatRupiah(subtotal)}</Text>
            </View>
            {checkoutData.applyTax && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: c.textSecondary, fontSize: 13 }}>
                  {settings?.tax_label || settings?.taxLabel || 'PPN'} {settings?.tax_rate ?? settings?.taxRate ?? 11}%
                </Text>
                <Text style={{ color: c.text, fontSize: 13, fontWeight: '600' }}>{formatRupiah(taxAmount)}</Text>
              </View>
            )}
            <View style={{ height: 1, backgroundColor: c.border, marginVertical: 8 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: c.text, fontSize: 18, fontWeight: '900' }}>Total</Text>
              <Text style={{ color: c.accent, fontSize: 18, fontWeight: '900' }}>{formatRupiah(total)}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Checkout button */}
      {!cartIsEmpty && (
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: 16, backgroundColor: c.bg,
          borderTopWidth: 1, borderTopColor: c.border,
        }}>
          <TouchableOpacity
            onPress={() => setShowCheckoutSheet(true)}
            style={{
              backgroundColor: c.accent, borderRadius: 14,
              paddingVertical: 16, alignItems: 'center',
            }}
          >
            <Text style={{ color: c.textInverse, fontWeight: '900', fontSize: 15 }}>
              Checkout →
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modals */}
      <AddManualItemModal
        visible={showManualModal}
        onClose={() => setShowManualModal(false)}
        onAdd={(item: CartItemWithInput) => { addCustomItem(item); setShowManualModal(false); }}
      />

      {editingItem && (
        <CartItemEditModal
          visible={editingItemIndex !== null}
          item={editingItem}
          onSave={(updatedItem) => {
            if (editingItemIndex !== null) {
              updateCartItem(editingItemIndex, updatedItem);
              setEditingItemIndex(null);
            }
          }}
          onRemove={() => {
            if (editingItemIndex !== null) {
              removeAtIndex(editingItemIndex);
              setEditingItemIndex(null);
            }
          }}
          onClose={() => setEditingItemIndex(null)}
        />
      )}

      <CheckoutSheet
        visible={showCheckoutSheet}
        onClose={() => setShowCheckoutSheet(false)}
        onProceedPayment={() => {
          setShowCheckoutSheet(false);
          router.push('/(cashier)/pos/payment' as any);
        }}
      />
    </SafeAreaView>
  );
}
