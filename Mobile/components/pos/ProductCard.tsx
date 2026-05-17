import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Coffee, Award, Plus } from 'lucide-react-native';
import { formatRupiahShort } from '../../utils/currency';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import type { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  onAdd: (p: Product) => void;
  onRemove: (id: string) => void;
  cartQuantity: number;
}

export default function ProductCard({ product, onAdd, onRemove, cartQuantity }: ProductCardProps) {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  const isSoldOut = product.stock === 0;
  const isPromo = product.isPromo && product.promoPrice;
  const displayPrice = isPromo ? product.promoPrice! : product.price;

  return (
    <TouchableOpacity
      onPress={() => !isSoldOut && onAdd(product)}
      activeOpacity={0.85}
      style={{
        flex: 1, backgroundColor: c.bgCard, borderRadius: 16,
        borderWidth: 1, borderColor: c.borderLight,
        overflow: 'hidden', marginBottom: 12, marginHorizontal: 4,
      }}
    >
      {/* IMAGE AREA */}
      <View style={{ height: 120, position: 'relative', backgroundColor: c.bgInput }}>
        {product.image ? (
          <Image source={{ uri: product.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Coffee size={32} color={c.textMuted} strokeWidth={1.5} />
          </View>
        )}

        {/* SOLD OUT OVERLAY */}
        {isSoldOut && (
          <View style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <View style={{ backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 }}>SOLD OUT</Text>
            </View>
          </View>
        )}

        {/* PROMO BADGE */}
        {isPromo && !isSoldOut && (
          <View style={{
            position: 'absolute', top: 6, left: 6,
            backgroundColor: c.error, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
          }}>
            <Text style={{ color: '#fff', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>
              {product.promoLabel || 'PROMO'}
            </Text>
          </View>
        )}

        {/* BEST SELLER RANK */}
        {product.bestSellerRank && product.bestSellerRank <= 3 && (
          <View style={{
            position: 'absolute', top: 6, right: 6,
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 5, paddingVertical: 2,
            borderRadius: 6, gap: 2,
          }}>
            <Award size={9} color={c.accent} strokeWidth={2} />
            <Text style={{ color: c.accent, fontSize: 9, fontWeight: '900' }}>#{product.bestSellerRank}</Text>
          </View>
        )}
      </View>

      {/* INFO AREA */}
      <View style={{ padding: 10 }}>
        <Text numberOfLines={1} style={{ color: c.text, fontSize: 13, fontWeight: '700', marginBottom: 2 }}>
          {product.name}
        </Text>
        <Text style={{ color: c.textSecondary, fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
          {product.category || 'Uncategorized'}
        </Text>

        {/* PRICE ROW */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            {isPromo && (
              <Text style={{ color: c.textMuted, fontSize: 10, textDecorationLine: 'line-through', marginBottom: 1 }}>
                {formatRupiahShort(product.price)}
              </Text>
            )}
            <Text style={{ color: isPromo ? c.error : c.accent, fontSize: 14, fontWeight: '900' }}>
              {formatRupiahShort(displayPrice)}
            </Text>
          </View>

          {/* QUANTITY CONTROLS */}
          {cartQuantity > 0 ? (
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: c.bgInput, borderWidth: 1, borderColor: c.accent,
              borderRadius: 10, overflow: 'hidden',
            }}>
              <TouchableOpacity onPress={() => onRemove(product.id)} style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: c.accent, fontSize: 16, fontWeight: '900' }}>−</Text>
              </TouchableOpacity>
              <Text style={{ color: c.text, fontSize: 12, fontWeight: '800', paddingHorizontal: 6 }}>{cartQuantity}</Text>
              <TouchableOpacity onPress={() => onAdd(product)} style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: c.accent, fontSize: 16, fontWeight: '900' }}>+</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => !isSoldOut && onAdd(product)}
              disabled={isSoldOut}
              style={{
                width: 32, height: 32, backgroundColor: isSoldOut ? (isDark ? '#333' : '#e2e8f0') : c.accent,
                borderRadius: 10, alignItems: 'center', justifyContent: 'center',
              }}>
              <Plus size={16} color={isSoldOut ? c.textMuted : c.textInverse} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>

        {/* STOCK INFO */}
        <Text style={{
          color: product.stock <= 5 && product.stock > 0 ? c.warning
            : product.stock === 0 ? c.error : c.textSecondary,
          fontSize: 9, marginTop: 4,
        }}>
          Stok: {product.stock === -1 ? '∞' : product.stock}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
