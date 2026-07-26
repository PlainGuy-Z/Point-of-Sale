import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { ChevronRight, TrendingUp, X } from 'lucide-react-native';
import type { ThemeColors } from '../../utils/theme';
import ProductCard from './ProductCard';
import type { Product } from '../../types';
import type { CategoryCarousel as CategoryCarouselData } from '../../hooks/useCategoryCarousels';

interface CategoryCarouselProps {
  carousel: CategoryCarouselData;
  onViewAll?: (carousel: CategoryCarouselData) => void;
  cartQuantities: Record<string, number>;
  onAddToCart: (p: Product) => void;
  onRemoveFromCart: (id: string) => void;
  /** Theme colors passed from parent to avoid direct context consumption */
  colors: ThemeColors;
  isDark: boolean;
}

function CategoryCarousel({ carousel, onViewAll, cartQuantities, onAddToCart, onRemoveFromCart, colors: c, isDark }: CategoryCarouselProps) {

  const [showAll, setShowAll] = useState(false);

  const { categoryName, totalSales, products } = carousel;
  const isSemua = categoryName === 'Semua';

  if (products.length === 0) return null;

  const getCartQty = (productId: string) => cartQuantities[productId] || 0;

  // ── "Lihat Semua" grid mode ───────────────────────────────────────────────
  if (showAll) {
    return (
      <View style={{ marginBottom: 20, paddingTop: 6 }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 16, marginBottom: 12,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ color: c.text, fontSize: 16, fontWeight: '800' }}>
              {categoryName}
            </Text>
            {totalSales > 0 && totalSales !== Number.POSITIVE_INFINITY && (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 3,
                backgroundColor: c.accentBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
              }}>
                <TrendingUp size={9} color={c.accent} strokeWidth={2} />
                <Text style={{ color: c.accent, fontSize: 9, fontWeight: '700' }}>
                  {totalSales} terjual
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={() => setShowAll(false)}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 4,
              backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.borderLight,
              paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
            }}
          >
            <X size={12} color={c.textSecondary} strokeWidth={2} />
            <Text style={{ color: c.textSecondary, fontSize: 11, fontWeight: '600' }}>Tutup</Text>
          </TouchableOpacity>
        </View>

        {/* Grid (2 columns) */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 }}>
          {products.slice(0, 10).map(product => (
            <View key={product.id} style={{ width: '50%' }}>
              <ProductCard
                product={product}
                onAdd={onAddToCart}
                onRemove={onRemoveFromCart}
                cartQuantity={getCartQty(product.id)}
                variant="full"
                isLandscape={false}
                colors={c}
                isDark={isDark}
              />
            </View>
          ))}
        </View>
      </View>
    );
  }

  // ── Carousel mode ─────────────────────────────────────────────────────────
  return (
    <View style={{ marginBottom: 20, paddingTop: 6 }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, marginBottom: 10,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <Text style={{ color: c.text, fontSize: 15, fontWeight: '800' }}>
            {isSemua ? '🔥 Trending' : categoryName}
          </Text>
          {totalSales > 0 && totalSales !== Number.POSITIVE_INFINITY && (
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 3,
              backgroundColor: c.accentBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
            }}>
              <TrendingUp size={9} color={c.accent} strokeWidth={2} />
              <Text style={{ color: c.accent, fontSize: 9, fontWeight: '700' }}>
                {totalSales} terjual
              </Text>
            </View>
          )}
        </View>

        {products.length > 3 && (
          <TouchableOpacity
            onPress={() => {
              if (typeof onViewAll === 'function') {
                onViewAll(carousel);
              } else {
                setShowAll(true);
              }
            }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
          >
            <Text style={{ color: c.accent, fontSize: 12, fontWeight: '700' }}>Lihat Semua</Text>
            <ChevronRight size={14} color={c.accent} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      {/* Horizontal scroll */}
      <FlashList
        data={products}
        keyExtractor={(item) => item.id}
        // @ts-ignore
        estimatedItemSize={150}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 6 }}
        ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onAdd={onAddToCart}
            onRemove={onRemoveFromCart}
            cartQuantity={getCartQty(item.id)}
            variant="compact"
            isLandscape={false}
            colors={c}
            isDark={isDark}
          />
        )}
      />
    </View>
  );
}

export default React.memo(
  CategoryCarousel,
  (prev, next) => {
    return (
      prev.carousel.categoryName === next.carousel.categoryName &&
      prev.carousel.products.length === next.carousel.products.length &&
      prev.cartQuantities === next.cartQuantities &&
      prev.onViewAll === next.onViewAll &&
      prev.isDark === next.isDark
    );
  }
);
