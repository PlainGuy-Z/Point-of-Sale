import React from 'react';
import { View, Text } from 'react-native';
import { formatRupiah } from '../../utils/currency';
import type { Product } from '../../types';

interface TopProductsPanelProps {
  products: (Product & { quantity?: number; revenue?: number })[];
}

export default function TopProductsPanel({ products }: TopProductsPanelProps) {
  const topProducts = products.slice(0, 5).filter((p) => p !== null);
  const maxRevenue = topProducts.length > 0 ? topProducts[0].revenue || 1 : 1;

  if (topProducts.length === 0) {
    return (
      <View
        style={{
          backgroundColor: '#1a1a1a',
          borderWidth: 1,
          borderColor: '#2a2a2a',
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 200,
        }}
      >
        <Text style={{ fontSize: 32, marginBottom: 12 }}>📦</Text>
        <Text style={{ color: '#888888', fontSize: 13, fontWeight: '600' }}>Tidak ada data penjualan hari ini</Text>
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: '#1a1a1a',
        borderWidth: 1,
        borderColor: '#2a2a2a',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Text style={{ fontSize: 20 }}>📈</Text>
        <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '900' }}>Produk Terlaris Hari Ini</Text>
      </View>

      {/* List */}
      <View style={{ gap: 16 }}>
        {topProducts.map((product, index) => {
          const quantity = product.quantity || 0;
          const revenue = product.revenue || 0;
          const progress = (revenue / maxRevenue) * 100;

          return (
            <View key={product.id}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
                <Text style={{ fontSize: 20, marginRight: 12 }}>{index === 0 ? '🏆' : '📦'}</Text>
                
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '700', marginBottom: 4 }} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text style={{ color: '#888888', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 }}>
                    {product.category} • {quantity} TERJUAL
                  </Text>
                  <Text style={{ color: '#0d9488', fontSize: 13, fontWeight: '800' }}>{formatRupiah(revenue)}</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={{ height: 4, backgroundColor: '#2a2a2a', borderRadius: 2, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${progress}%`, backgroundColor: '#0d9488', borderRadius: 2 }} />
              </View>
            </View>
          );
        })}
      </View>

      {/* Footer */}
      {topProducts.length > 0 && (
        <View style={{ marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#2a2a2a' }}>
          <Text style={{ color: '#888888', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 }}>
            TOTAL REVENUE TOP {topProducts.length}
          </Text>
          <Text style={{ color: '#0d9488', fontSize: 16, fontWeight: '900' }}>
            {formatRupiah(topProducts.reduce((sum, p) => sum + (p.revenue || 0), 0))}
          </Text>
        </View>
      )}
    </View>
  );
}
