import React from 'react';
import { View, Text, ScrollView, useWindowDimensions } from 'react-native';
import { TrendingUp, Package } from 'lucide-react-native';
import { getColors } from '../../utils/theme';
import { formatRupiah } from '../../utils/currency';
import type { Product } from '../../types';

interface TopProductsProps {
  products: (Product & { quantity?: number; revenue?: number })[];
  isDark: boolean;
  title?: string;
  limit?: number;
}

export default function TopProducts({
  products,
  isDark,
  title = 'Produk Terlaris Hari Ini',
  limit = 5,
}: TopProductsProps) {
  const c = getColors(isDark);
  const { height } = useWindowDimensions();
  const topProducts = products.slice(0, limit).filter((p) => p !== null);

  if (topProducts.length === 0) {
    return (
      <View
        style={{
          height: 380,
          backgroundColor: c.bgCard,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: 16,
          padding: 16,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Package size={32} color={c.textMuted} strokeWidth={1.5} />
        <Text
          style={{
            color: c.textSecondary,
            fontSize: 13,
            fontWeight: '600',
            marginTop: 8,
            textAlign: 'center',
          }}
        >
          Tidak ada data penjualan hari ini
        </Text>
      </View>
    );
  }

  const maxRevenue = topProducts.length > 0 ? topProducts[0].revenue || 1 : 1;

  return (
    <View
      style={{
        height: 380,
        backgroundColor: c.bgCard,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 16,
        padding: 14,
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 6 },
        elevation: 2,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? '#22c55e20' : '#dcfce7', justifyContent: 'center', alignItems: 'center' }}>
            <TrendingUp size={20} color={isDark ? '#22c55e' : '#16a34a'} strokeWidth={2.5} />
          </View>
          <View>
            <Text style={{ color: c.text, fontSize: 15, fontWeight: '900' }}>{title}</Text>
            <Text style={{ color: c.textSecondary, fontSize: 13, marginTop: 2 }}>Berdasarkan revenue</Text>
          </View>
        </View>
      </View>

      {/* Product List */}
      <ScrollView
        style={{ flex: 1, marginTop: 4 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        <View style={{ gap: 10 }}>
        {topProducts.map((product, index) => {
          const rank = index + 1;
          const quantity = product.quantity || 0;
          const revenue = product.revenue || 0;
          const progress = (revenue / maxRevenue) * 100;

          return (
            <View key={product.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: isDark ? '#0f1720' : '#fff', borderWidth: 1, borderColor: c.border, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                  <Package size={18} color={isDark ? '#f59e0b' : '#d97706'} strokeWidth={2} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }} numberOfLines={1}>{product.name}</Text>
                  <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 4 }}>{product.category} • {quantity} terjual</Text>
                </View>

                <Text style={{ color: isDark ? '#f59e0b' : '#0d9488', fontSize: 13, fontWeight: '800' }}>{formatRupiah(revenue)}</Text>
              </View>

              <View style={{ height: 6, backgroundColor: c.border, borderRadius: 6, overflow: 'hidden', marginBottom: index < topProducts.length - 1 ? 8 : 0 }}>
                <View style={{ height: '100%', width: `${progress}%`, backgroundColor: isDark ? '#f59e0b' : '#0d9488' }} />
              </View>
            </View>
          );
        })}
        </View>
      </ScrollView>

      {/* Footer - Total Revenue Top Products */}
      {topProducts.length > 0 && (
        <View
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: c.border,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: c.textMuted,
              fontSize: 11,
              fontWeight: '600',
              textTransform: 'uppercase',
            }}
          >
            Total Revenue Top {topProducts.length}
          </Text>
          <Text
            style={{
              color: isDark ? '#f59e0b' : '#0d9488',
              fontSize: 14,
              fontWeight: '800',
            }}
          >
            {formatRupiah(topProducts.reduce((sum, p) => sum + (p.revenue || 0), 0))}
          </Text>
        </View>
      )}
    </View>
  );
}
