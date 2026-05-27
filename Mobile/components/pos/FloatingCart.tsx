import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ShoppingCart } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { usePOSCart } from '../../contexts/POSCartContext';
import { formatRupiahShort } from '../../utils/currency';

interface FloatingCartProps {
  onPress: () => void;
}

export default function FloatingCart({ onPress }: FloatingCartProps) {
  const insets = useSafeAreaInsets();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);
  const { cart, totalQuantity, subtotal, cartIsEmpty } = usePOSCart();

  if (cartIsEmpty) return null;

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: insets.bottom + 12,
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={{
          backgroundColor: c.accent,
          borderRadius: 20,
          paddingHorizontal: 20,
          paddingVertical: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          elevation: 8,
          shadowColor: c.accent,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ position: 'relative' }}>
            <ShoppingCart size={20} color={c.textInverse} strokeWidth={2} />
            <View
              style={{
                position: 'absolute', top: -6, right: -8,
                backgroundColor: isDark ? '#000' : '#fff',
                width: 18, height: 18, borderRadius: 9,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Text style={{ color: c.accent, fontSize: 10, fontWeight: '900' }}>
                {totalQuantity}
              </Text>
            </View>
          </View>
          <Text style={{ color: c.textInverse, fontSize: 14, fontWeight: '700' }}>
            {cart.length} item · {formatRupiahShort(subtotal)}
          </Text>
        </View>
        <Text style={{ color: c.textInverse, fontSize: 14, fontWeight: '900' }}>
          Buka →
        </Text>
      </TouchableOpacity>
    </View>
  );
}
