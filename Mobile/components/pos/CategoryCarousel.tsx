import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { ChevronRight, TrendingUp, X } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { usePOSCart } from '../../contexts/POSCartContext';
import ProductCard from './ProductCard';
import type { Product } from '../../types';
import type { CategoryCarousel as CategoryCarouselData } from '../../hooks/useCategoryCarousels';

interface CategoryCarouselProps {
  carousel: CategoryCarouselData;
  onViewAll?: (carousel: CategoryCarouselData) => void;
}

export default function CategoryCarousel({ carousel, onViewAll }: CategoryCarouselProps) {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);
  const { cart, addToCart, removeFromCart } = usePOSCart();

  const [showAll, setShowAll] = useState(false);

  const { categoryName, totalSales, products } = carousel;
  const isSemua = categoryName === 'Semua';

  if (products.length === 0) return null;

  const getCartQty = (productId: string) =>
    cart.find(i => i.productId === productId)?.quantity || 0;

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
                onAdd={addToCart}
                onRemove={(id) => removeFromCart(id)}
                cartQuantity={getCartQty(product.id)}
                variant="full"
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
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 6, gap: 10 }}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onAdd={addToCart}
            onRemove={(id) => removeFromCart(id)}
            cartQuantity={getCartQty(item.id)}
            variant="compact"
          />
        )}
      />
    </View>
  );
}
