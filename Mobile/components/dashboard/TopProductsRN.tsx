import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { TrendingUp, Package, Trophy } from 'lucide-react-native';
import { formatRupiah } from '../../utils/currency';
import type { Product } from '../../types';

interface TopProductsRNProps {
  products: (Product & { quantity?: number; revenue?: number })[];
  title?: string;
  limit?: number;
  isDark: boolean;
}

export default function TopProductsRN({
  products,
  title = 'Produk Terlaris Hari Ini',
  limit = 5,
  isDark,
}: TopProductsRNProps) {
  const topProducts = products.slice(0, limit);
  const maxRevenue = topProducts.length > 0 ? topProducts[0].revenue || 1 : 1;

  if (topProducts.length === 0) {
    return (
      <View style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
        backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
      }}>
        <View style={{ padding: 12, borderRadius: 16, backgroundColor: isDark ? '#252525' : '#f1f5f9', marginBottom: 12 }}>
          <Package size={24} color={isDark ? '#a8a29e' : '#94a3b8'} />
        </View>
        <Text style={{ color: isDark ? '#78716c' : '#64748b', fontSize: 13, fontWeight: '600' }}>
          Tidak ada data penjualan hari ini
        </Text>
      </View>
    );
  }

  return (
    <View style={{
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      padding: 20,
      shadowColor: '#f59e0b',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.3 : 0.08,
      shadowRadius: 10,
      elevation: 4,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <View style={{ padding: 8, borderRadius: 12, backgroundColor: isDark ? '#252525' : '#f0fdf4' }}>
          <TrendingUp size={20} color="#0d9488" />
        </View>
        <Text style={{ color: isDark ? '#ffffff' : '#0f172a', fontSize: 16, fontWeight: '900' }}>
          {title}
        </Text>
      </View>

      <View style={{ gap: 16 }}>
        {topProducts.map((product, index) => {
          const rank = index + 1;
          const quantity = product.quantity || 0;
          const revenue = product.revenue || 0;
          const progress = (revenue / maxRevenue) * 100;

          return (
            <View key={product.id}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
                
                <View style={{
                  width: 28, height: 28, borderRadius: 8,
                  backgroundColor: rank === 1 
                    ? (isDark ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7')
                    : (isDark ? '#252525' : '#f1f5f9'),
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {rank === 1 
                    ? <Trophy size={14} color={isDark ? '#f59e0b' : '#d97706'} />
                    : <Text style={{ fontWeight: '900', fontSize: 12, color: isDark ? '#a8a29e' : '#64748b' }}>{rank}</Text>
                  }
                </View>
                
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontWeight: '600', fontSize: 14, color: isDark ? '#ffffff' : '#0f172a', marginBottom: 2 }} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text style={{ fontSize: 10, textTransform: 'uppercase', color: isDark ? '#78716c' : '#64748b', fontWeight: '700' }}>
                    {product.category} • <Text style={{ color: isDark ? '#d6d3d1' : '#334155' }}>{quantity} TERJUAL</Text>
                  </Text>
                </View>
                
                <Text style={{ fontWeight: '700', fontSize: 14, color: '#0d9488' }}>
                  {formatRupiah(revenue)}
                </Text>
              </View>
              
              <View style={{ height: 6, borderRadius: 999, backgroundColor: isDark ? '#2a2a2a' : '#f1f5f9', overflow: 'hidden' }}>
                <View style={{ width: `${progress}%`, height: '100%', backgroundColor: '#0d9488', borderRadius: 999 }} />
              </View>
            </View>
          );
        })}
      </View>

      <View style={{ marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: isDark ? '#2a2a2a' : '#e2e8f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: isDark ? '#78716c' : '#64748b', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
          TOTAL REVENUE TOP {topProducts.length}
        </Text>
        <Text style={{ color: '#0d9488', fontSize: 18, fontWeight: '900' }}>
          {formatRupiah(topProducts.reduce((sum, p) => sum + (p.revenue || 0), 0))}
        </Text>
      </View>
    </View>
  );
}
