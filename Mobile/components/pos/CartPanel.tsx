import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShoppingCart, PlusCircle, Trash2, Zap, ReceiptText, ChevronRight } from 'lucide-react-native';
import { useColors } from '../../utils/theme';
import { usePOSCart } from '../../contexts/POSCartContext';
import { formatRupiah } from '../../utils/currency';
import { useApp } from '../../contexts/AppContext';
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
  const { colors: c, isDark } = useColors();
  const { width: ww, height: wh } = useWindowDimensions();
  const isLandscape = ww > wh;
  const insets = useSafeAreaInsets();
  const {
    cart, clearCart, updateQuantity, removeAtIndex,
    subtotal, taxAmount, total, cartIsEmpty, totalQuantity,
    checkout: checkoutData,
  } = usePOSCart();
  const { settings } = useApp();


  return (
    <View style={{
      flex: 1,
      backgroundColor: c.bgCard,
      borderRadius: isLandscape ? 12 : 16,
      borderWidth: 1,
      borderColor: c.borderLight,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: isLandscape ? 8 : 16, paddingVertical: isLandscape ? 6 : 14,
        borderBottomWidth: 1, borderBottomColor: c.border,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: isLandscape ? 4 : 10 }}>
          <View style={{
            width: isLandscape ? 20 : 32, height: isLandscape ? 20 : 32, borderRadius: isLandscape ? 6 : 10,
            backgroundColor: c.accentBg, alignItems: 'center', justifyContent: 'center',
          }}>
            <ShoppingCart size={isLandscape ? 10 : 16} color={c.accent} />
          </View>
          <View>
            <Text style={{ color: c.text, fontSize: isLandscape ? 10 : 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.3 }}>
              Shopping Cart
            </Text>
            {!cartIsEmpty && (
              <Text style={{ color: c.textMuted, fontSize: isLandscape ? 8 : 10, fontWeight: '600' }}>
                {totalQuantity} item dipilih
              </Text>
            )}
          </View>
        </View>
        {!cartIsEmpty && (
          <TouchableOpacity onPress={clearCart}>
            <Trash2 size={isLandscape ? 12 : 16} color={c.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: isLandscape ? 6 : 12,
          flexGrow: 1,
          justifyContent: cartIsEmpty ? 'center' : 'flex-start',
        }}
      >
        {cartIsEmpty ? (
          /* Empty state */
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 16 }}>
            <View style={{
              width: isLandscape ? 36 : 64, height: isLandscape ? 36 : 64, borderRadius: isLandscape ? 10 : 20,
              backgroundColor: c.accentBg, alignItems: 'center', justifyContent: 'center',
              marginBottom: isLandscape ? 6 : 16,
            }}>
              <ShoppingCart size={isLandscape ? 16 : 28} color={c.accent} />
            </View>
            <Text style={{ color: c.text, fontSize: isLandscape ? 11 : 16, fontWeight: '800', marginBottom: 2 }}>
              Keranjang kosong
            </Text>
            <Text style={{ color: c.textMuted, fontSize: isLandscape ? 9 : 12, textAlign: 'center', maxWidth: 180, marginBottom: isLandscape ? 10 : 24 }}>
              Pilih menu untuk memulai transaksi
            </Text>
            <TouchableOpacity
              onPress={onManualItem}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 4,
                backgroundColor: c.accent, paddingHorizontal: isLandscape ? 10 : 20, paddingVertical: isLandscape ? 6 : 12, borderRadius: 10,
              }}
            >
              <PlusCircle size={isLandscape ? 10 : 14} color={c.textInverse} />
              <Text style={{ color: c.textInverse, fontSize: isLandscape ? 9 : 12, fontWeight: '900', textTransform: 'uppercase' }}>
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
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
                borderWidth: 1, borderColor: c.border, borderStyle: 'dashed',
                borderRadius: 10, paddingVertical: isLandscape ? 5 : 10, marginBottom: isLandscape ? 5 : 10,
              }}
            >
              <PlusCircle size={isLandscape ? 10 : 13} color={c.textMuted} />
              <Text style={{ color: c.textMuted, fontSize: isLandscape ? 9 : 12, fontWeight: '600' }}>
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
                colors={c}
                isDark={isDark}
              />
            ))}
          </>
        )}
      </ScrollView>

      {/* Footer: summary + actions */}
      {!cartIsEmpty && (
        <View style={{
          borderTopWidth: 1, borderTopColor: c.border,
          paddingHorizontal: isLandscape ? 6 : 14,
          paddingTop: isLandscape ? 6 : 14,
          paddingBottom: isLandscape ? Math.max(insets.bottom, 6) : (insets.bottom > 0 ? insets.bottom + 8 : 14),
        }}>
          {/* Summary */}
          <View style={{ marginBottom: isLandscape ? 4 : 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
              <Text style={{ color: c.textSecondary, fontSize: isLandscape ? 9 : 12 }}>Subtotal</Text>
              <Text style={{ color: c.text, fontSize: isLandscape ? 9 : 12, fontWeight: '600' }}>{formatRupiah(subtotal)}</Text>
            </View>
            {checkoutData.applyTax && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                <Text style={{ color: c.textSecondary, fontSize: isLandscape ? 9 : 12 }}>
                  {settings?.tax_label || settings?.taxLabel || 'PPN'} {settings?.tax_rate ?? settings?.taxRate ?? 11}%
                </Text>
                <Text style={{
                  color: c.text,
                  fontSize: isLandscape ? 9 : 12, fontWeight: '600',
                }}>
                  {formatRupiah(taxAmount)}
                </Text>
              </View>
            )}
            <View style={{
              height: 1, backgroundColor: c.border, marginVertical: isLandscape ? 3 : 6,
            }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: c.text, fontSize: isLandscape ? 11 : 16, fontWeight: '900' }}>Total</Text>
              <Text style={{ color: c.accent, fontSize: isLandscape ? 11 : 16, fontWeight: '900' }}>{formatRupiah(total)}</Text>
            </View>
          </View>

          {/* Action buttons */}
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <TouchableOpacity
              onPress={onQuickPay}
              style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3,
                backgroundColor: c.accent, borderRadius: isLandscape ? 8 : 14, paddingVertical: isLandscape ? 7 : 14,
              }}
            >
              <Zap size={isLandscape ? 10 : 14} color={c.textInverse} />
              <Text style={{ color: c.textInverse, fontSize: isLandscape ? 10 : 13, fontWeight: '900' }}>Quick Pay</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onCheckout}
              style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3,
                borderWidth: 1, borderColor: c.border, borderRadius: isLandscape ? 8 : 14, paddingVertical: isLandscape ? 7 : 14,
              }}
            >
              <ReceiptText size={isLandscape ? 10 : 14} color={c.text} />
              <Text style={{ color: c.text, fontSize: isLandscape ? 10 : 13, fontWeight: '900' }}>Checkout</Text>
              <ChevronRight size={isLandscape ? 8 : 12} color={c.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
