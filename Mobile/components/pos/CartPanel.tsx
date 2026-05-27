import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ShoppingCart, PlusCircle, Trash2, Zap, ReceiptText, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { usePOSCart } from '../../contexts/POSCartContext';
import { formatRupiah } from '../../utils/currency';
import CartItem from './CartItem';

interface CartPanelProps {
  onManualItem: () => void;
  onEditItem: (index: number) => void;
  onCheckout: () => void;
  onQuickPay: () => void;
}

export default function CartPanel({
  onManualItem,
  onEditItem,
  onCheckout,
  onQuickPay,
}: CartPanelProps) {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);
  const {
    cart, clearCart, updateQuantity, removeAtIndex,
    subtotal, taxAmount, total, cartIsEmpty, totalQuantity,
    checkout: checkoutData,
  } = usePOSCart();

  return (
    <View style={{
      flex: 1,
      backgroundColor: c.bgCard,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.borderLight,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: c.border,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{
            width: 32, height: 32, borderRadius: 10,
            backgroundColor: c.accentBg, alignItems: 'center', justifyContent: 'center',
          }}>
            <ShoppingCart size={16} color={c.accent} />
          </View>
          <View>
            <Text style={{ color: c.text, fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Shopping Cart
            </Text>
            {!cartIsEmpty && (
              <Text style={{ color: c.textMuted, fontSize: 10, fontWeight: '600' }}>
                {totalQuantity} item dipilih
              </Text>
            )}
          </View>
        </View>
        {!cartIsEmpty && (
          <TouchableOpacity onPress={clearCart}>
            <Trash2 size={16} color={c.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12 }}>
        {cartIsEmpty ? (
          /* Empty state */
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
            <View style={{
              width: 64, height: 64, borderRadius: 20,
              backgroundColor: c.accentBg, alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}>
              <ShoppingCart size={28} color={c.accent} />
            </View>
            <Text style={{ color: c.text, fontSize: 16, fontWeight: '800', marginBottom: 6 }}>
              Keranjang kosong
            </Text>
            <Text style={{ color: c.textMuted, fontSize: 12, textAlign: 'center', maxWidth: 200, marginBottom: 24 }}>
              Pilih menu untuk memulai transaksi
            </Text>
            <TouchableOpacity
              onPress={onManualItem}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                backgroundColor: c.accent, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14,
              }}
            >
              <PlusCircle size={14} color={c.textInverse} />
              <Text style={{ color: c.textInverse, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' }}>
                Item Custom
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Manual item button */}
            <TouchableOpacity
              onPress={onManualItem}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                borderWidth: 1, borderColor: c.border, borderStyle: 'dashed',
                borderRadius: 14, paddingVertical: 10, marginBottom: 10,
              }}
            >
              <PlusCircle size={13} color={c.textMuted} />
              <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: '600' }}>
                Tambah Item Manual
              </Text>
            </TouchableOpacity>

            {/* Cart items */}
            {cart.map((item, idx) => (
              <CartItem
                key={`${item.productId}-${idx}`}
                item={item}
                index={idx}
                onEdit={onEditItem}
                onUpdateQuantity={updateQuantity}
                onRemove={removeAtIndex}
              />
            ))}
          </>
        )}
      </ScrollView>

      {/* Footer: summary + actions */}
      {!cartIsEmpty && (
        <View style={{
          borderTopWidth: 1, borderTopColor: c.border,
          padding: 14,
        }}>
          {/* Summary */}
          <View style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ color: c.textSecondary, fontSize: 12 }}>Subtotal</Text>
              <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>{formatRupiah(subtotal)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ color: c.textSecondary, fontSize: 12 }}>
                PPN 11% {!checkoutData.applyTax && '(off)'}
              </Text>
              <Text style={{
                color: checkoutData.applyTax ? c.text : c.textMuted,
                fontSize: 12, fontWeight: '600',
                textDecorationLine: checkoutData.applyTax ? 'none' : 'line-through',
              }}>
                {formatRupiah(taxAmount)}
              </Text>
            </View>
            <View style={{
              height: 1, backgroundColor: c.border, marginVertical: 6,
            }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: c.text, fontSize: 16, fontWeight: '900' }}>Total</Text>
              <Text style={{ color: c.accent, fontSize: 16, fontWeight: '900' }}>{formatRupiah(total)}</Text>
            </View>
          </View>

          {/* Action buttons */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={onQuickPay}
              style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                backgroundColor: c.accent, borderRadius: 14, paddingVertical: 14,
              }}
            >
              <Zap size={14} color={c.textInverse} />
              <Text style={{ color: c.textInverse, fontSize: 13, fontWeight: '900' }}>Quick Pay</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onCheckout}
              style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                borderWidth: 1, borderColor: c.border, borderRadius: 14, paddingVertical: 14,
              }}
            >
              <ReceiptText size={14} color={c.text} />
              <Text style={{ color: c.text, fontSize: 13, fontWeight: '900' }}>Checkout</Text>
              <ChevronRight size={12} color={c.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
