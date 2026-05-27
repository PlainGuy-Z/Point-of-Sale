import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Trash2 } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { formatRupiah } from '../../utils/currency';
import type { CartItemWithInput } from '../../types';

interface CartItemProps {
  item: CartItemWithInput;
  index: number;
  onEdit: (index: number) => void;
  onUpdateQuantity: (index: number, delta: number) => void;
  onRemove: (index: number) => void;
}

export default function CartItem({
  item,
  index,
  onEdit,
  onUpdateQuantity,
  onRemove,
}: CartItemProps) {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  const isManual = item.productId.startsWith('manual-');
  const isPromoItem = item.isPromo && item.originalPrice;
  const basePrice = item.price + (item.variantPrice || 0);
  const lineTotal = basePrice * item.quantity;

  const cardBg = isPromoItem
    ? isDark ? 'rgba(239,68,68,0.08)' : '#fef2f2'
    : isManual
      ? isDark ? 'rgba(245,158,11,0.06)' : '#eff6ff'
      : isDark ? '#1a1a1a' : '#ffffff';

  const borderColor = isPromoItem
    ? isDark ? 'rgba(239,68,68,0.25)' : '#fecaca'
    : isManual
      ? isDark ? 'rgba(245,158,11,0.2)' : '#bfdbfe'
      : c.borderLight;

  const renderRightActions = (_progress: Animated.AnimatedInterpolation, _dragX: Animated.AnimatedInterpolation) => (
    <TouchableOpacity
      onPress={() => onRemove(index)}
      style={{
        backgroundColor: '#ff3b30', justifyContent: 'center', alignItems: 'center',
        width: 84, marginBottom: 8, borderRadius: 16, padding: 12,
      }}
    >
      <Trash2 size={18} color="#fff" />
    </TouchableOpacity>
  );

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <View
        style={{
          backgroundColor: cardBg,
          borderWidth: 1,
          borderColor,
          borderRadius: 16,
          padding: 14,
          marginBottom: 8,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        {/* Tappable info area */}
        <TouchableOpacity
          onPress={() => onEdit(index)}
          style={{ flex: 1, marginRight: 12 }}
          activeOpacity={0.7}
        >
          {/* Badges */}
          <View style={{ flexDirection: 'row', gap: 4, marginBottom: 2 }}>
            {isManual && (
              <View style={{
                backgroundColor: isDark ? 'rgba(245,158,11,0.2)' : '#dbeafe',
                paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4,
              }}>
                <Text style={{
                  color: isDark ? '#fbbf24' : '#2563eb',
                  fontSize: 8, fontWeight: '900', textTransform: 'uppercase',
                }}>Custom</Text>
              </View>
            )}
            {isPromoItem && (
              <View style={{
                backgroundColor: isDark ? 'rgba(239,68,68,0.2)' : '#fee2e2',
                paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4,
              }}>
                <Text style={{
                  color: isDark ? '#f87171' : '#dc2626',
                  fontSize: 8, fontWeight: '900', textTransform: 'uppercase',
                }}>{item.promoLabel || 'Promo'}</Text>
              </View>
            )}
          </View>

          {/* Name + instruction */}
          <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }} numberOfLines={2}>
            {item.name || item.note || 'Item'}
            {item.description ? (
              <Text style={{ fontWeight: '400', fontStyle: 'italic', color: c.textSecondary }}>
                {' — '}{item.description}
              </Text>
            ) : null}
          </Text>

          {/* Variant */}
          {item.variantName && (
            <Text style={{ color: c.accent, fontSize: 10, fontWeight: '600', marginTop: 2 }}>
              + {item.variantName} ({formatRupiah(item.variantPrice || 0)})
            </Text>
          )}

          {/* Price */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
            {isPromoItem && (
              <Text style={{ color: c.textMuted, fontSize: 10, textDecorationLine: 'line-through' }}>
                {formatRupiah(item.originalPrice!)}
              </Text>
            )}
            <Text style={{
              color: isPromoItem ? c.error : c.accent,
              fontSize: 12, fontWeight: '800',
            }}>
              {formatRupiah(basePrice)}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Right: quantity + total */}
        <View style={{ alignItems: 'flex-end' }}>
          {/* Quantity stepper */}
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: isDark ? '#222' : '#f1f5f9',
            borderWidth: 1, borderColor: c.accent,
            borderRadius: 10, overflow: 'hidden', marginBottom: 6,
          }}>
            <TouchableOpacity
              onPress={() => item.quantity <= 1 ? onRemove(index) : onUpdateQuantity(index, -1)}
              style={{ paddingHorizontal: 10, paddingVertical: 6 }}
            >
              <Text style={{ color: c.accent, fontSize: 14, fontWeight: '900' }}>−</Text>
            </TouchableOpacity>
            <Text style={{ color: c.text, fontWeight: '700', minWidth: 24, textAlign: 'center', fontSize: 13 }}>
              {item.quantity}
            </Text>
            <TouchableOpacity
              onPress={() => onUpdateQuantity(index, 1)}
              style={{ paddingHorizontal: 10, paddingVertical: 6 }}
            >
              <Text style={{ color: c.accent, fontSize: 14, fontWeight: '900' }}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Line total */}
          <Text style={{
            color: isPromoItem ? c.error : c.accent,
            fontWeight: '800', fontSize: 14,
          }}>
            {formatRupiah(lineTotal)}
          </Text>
        </View>
      </View>
    </View>
  );
}
