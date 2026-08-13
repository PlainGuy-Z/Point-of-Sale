import React from 'react';
import { View, Text, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { Coffee, Award, Plus, TrendingUp } from 'lucide-react-native';
import { formatRupiahShort } from '../../utils/currency';
import { getEffectivePrice } from '../../utils/priceUtils';
import type { ThemeColors } from '../../utils/theme';
import type { Product } from '../../types';
import { resolveImageUrl } from '../../utils/image';

interface ProductCardProps {
  product: Product;
  onAdd: (p: Product) => void;
  onRemove: (id: string) => void;
  cartQuantity: number;
  /** 'compact' for portrait carousel, 'full' for landscape grid */
  variant?: 'compact' | 'full';
  isLandscape?: boolean;
  /** Theme colors passed from parent to avoid direct context consumption */
  colors: ThemeColors;
  isDark: boolean;
}

const ProductCardInner = React.memo(function ProductCardInner({
  product,
  onAdd,
  onRemove,
  cartQuantity,
  variant = 'full',
  isLandscape,
  colors: c,
  isDark,
}: ProductCardProps & { isLandscape: boolean }) {

  const isSoldOut = product.stock === 0;
  const priceInfo = getEffectivePrice(product);
  const displayPrice = priceInfo.price;
  const isPromo = priceInfo.isPromoActive;
  const recentSales = product.recentSalesCount || 0;

  const isCompact = variant === 'compact';
  const cardWidth = isCompact ? 150 : undefined;
  const imageHeight = isCompact ? 100 : (isLandscape ? 90 : 120);

  return (
    <TouchableOpacity
      onPress={() => !isSoldOut && onAdd(product)}
      activeOpacity={0.85}
      style={{
        width: isCompact ? cardWidth : undefined,
        flex: isCompact ? undefined : 1,
        backgroundColor: c.bgCard,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: c.borderLight,
        overflow: 'hidden',
        marginBottom: isCompact ? 0 : 12,
        marginHorizontal: isCompact ? 0 : 4,
      }}
    >
      {/* IMAGE */}
      <View style={{ height: imageHeight, position: 'relative', backgroundColor: c.bgInput }}>
        {product.image ? (
          <Image
            source={{ uri: resolveImageUrl(product.image) }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Coffee size={isCompact ? 24 : 32} color={c.textMuted} strokeWidth={1.5} />
          </View>
        )}

        {/* SOLD OUT OVERLAY */}
        {isSoldOut && (
          <View
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.65)',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <View style={{ backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 }}>SOLD OUT</Text>
            </View>
          </View>
        )}

        {/* PROMO BADGE */}
        {isPromo && !isSoldOut && (
          <View
            style={{
              position: 'absolute', top: 6, left: 6,
              backgroundColor: c.error, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
              zIndex: 8,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>
              {product.promoLabel || (priceInfo.discountPercent > 0 ? `-${priceInfo.discountPercent}%` : 'PROMO')}
            </Text>
          </View>
        )}

        {/* BEST SELLER RANK */}
        {product.bestSellerRank && product.bestSellerRank <= 3 && !isSoldOut && (
          <View
            style={{
              position: 'absolute', top: 6, right: cartQuantity > 0 ? 28 : 6,
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 5, paddingVertical: 2,
              borderRadius: 6, gap: 2,
              zIndex: 9,
            }}
          >
            <Award size={9} color={c.accent} strokeWidth={2} />
            <Text style={{ color: c.accent, fontSize: 9, fontWeight: '900' }}>#{product.bestSellerRank}</Text>
          </View>
        )}

        {/* QUANTITY BADGE */}
        {cartQuantity > 0 && (
          <View
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              backgroundColor: c.accent,
              width: 18,
              height: 18,
              borderRadius: 9,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOpacity: 0.2,
              shadowRadius: 3,
              shadowOffset: { width: 0, height: 1 },
              elevation: 3,
              zIndex: 10,
            }}
          >
            <Text style={{ color: c.textInverse, fontSize: 9, fontWeight: '900' }}>{cartQuantity}</Text>
          </View>
        )}
      </View>

      {/* INFO AREA */}
      <View style={{ padding: isCompact ? 8 : (isLandscape ? 6 : 10) }}>
        <Text numberOfLines={1} style={{ color: c.text, fontSize: isCompact || isLandscape ? 11 : 13, fontWeight: '700', marginBottom: 2 }}>
          {product.name}
        </Text>
        <Text style={{ color: c.textSecondary, fontSize: isCompact || isLandscape ? 8 : 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
          {product.category || 'Uncategorized'}
        </Text>

        {/* SALES COUNT */}
        {recentSales > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 4 }}>
            <TrendingUp size={9} color={c.accent} strokeWidth={2} />
            <Text style={{ color: c.accent, fontSize: isCompact || isLandscape ? 8 : 9, fontWeight: '700' }}>
              {recentSales} terjual (estimasi lokal)
            </Text>
          </View>
        )}

        {/* PRICE ROW */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, marginRight: 4 }}>
            {isPromo && (
              <Text style={{ color: c.textMuted, fontSize: isCompact || isLandscape ? 9 : 10, textDecorationLine: 'line-through', marginBottom: 1 }}>
                {formatRupiahShort(product.price)}
              </Text>
            )}
            <Text numberOfLines={1} style={{ color: isPromo ? c.error : c.accent, fontSize: isCompact || isLandscape ? 11 : 14, fontWeight: '900' }}>
              {formatRupiahShort(displayPrice)}
            </Text>
          </View>

          {/* QUANTITY CONTROLS */}
          {isLandscape ? (
            cartQuantity > 0 ? (
              null
            ) : (
              <TouchableOpacity
                onPress={(e) => { e.stopPropagation?.(); !isSoldOut && onAdd(product); }}
                disabled={isSoldOut}
                style={{
                  width: 24, height: 24,
                  backgroundColor: isSoldOut ? (isDark ? '#333' : '#e2e8f0') : c.accent,
                  borderRadius: 6, alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Plus size={12} color={isSoldOut ? c.textMuted : c.textInverse} strokeWidth={2} />
              </TouchableOpacity>
            )
          ) : (
            cartQuantity > 0 ? (
              <View
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  backgroundColor: c.bgInput, borderWidth: 1, borderColor: c.accent,
                  borderRadius: 10, overflow: 'hidden',
                }}
              >
                <TouchableOpacity
                  onPress={(e) => { e.stopPropagation?.(); onRemove(product.id); }}
                  style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: c.accent, fontSize: 16, fontWeight: '900' }}>−</Text>
                </TouchableOpacity>
                <Text style={{ color: c.text, fontSize: 12, fontWeight: '800', paddingHorizontal: 6 }}>
                  {cartQuantity}
                </Text>
                <TouchableOpacity
                  onPress={(e) => { e.stopPropagation?.(); !isSoldOut && onAdd(product); }}
                  style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: c.accent, fontSize: 16, fontWeight: '900' }}>+</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => !isSoldOut && onAdd(product)}
                disabled={isSoldOut}
                style={{
                  width: 32, height: 32,
                  backgroundColor: isSoldOut ? (isDark ? '#333' : '#e2e8f0') : c.accent,
                  borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Plus size={16} color={isSoldOut ? c.textMuted : c.textInverse} strokeWidth={2} />
              </TouchableOpacity>
            )
          )}
        </View>

        {/* STOCK INFO */}
        {!isCompact && (
          <Text
            style={{
              color:
                product.stock <= 5 && product.stock > 0
                  ? c.warning
                  : product.stock === 0
                    ? c.error
                    : c.textSecondary,
              fontSize: isLandscape ? 8 : 9,
              marginTop: 4,
            }}
          >
            Stok: {product.stock === -1 ? '∞' : product.stock}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
});

function ProductCard(props: ProductCardProps) {
  if (props.isLandscape !== undefined) {
    return <ProductCardInner {...props} isLandscape={props.isLandscape} />;
  }
  return <ProductCardWithDimensions {...props} />;
}

function ProductCardWithDimensions(props: ProductCardProps) {
  const { width: ww, height: wh } = useWindowDimensions();
  const landscape = ww > wh;
  return <ProductCardInner {...props} isLandscape={landscape} />;
}

export default React.memo(ProductCard);
