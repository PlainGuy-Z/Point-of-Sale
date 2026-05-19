import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { Product } from '../../types';

interface StockAlertPanelProps {
  products: Product[];
}

export default function StockAlertPanel({ products }: StockAlertPanelProps) {
  const navigation: any = useNavigation();

  const lowStockProducts = products.filter(
    (p) => typeof p.stock === 'number' && p.stock > 0 && p.stock <= (p.minStock || 10)
  );
  const outOfStockProducts = products.filter(
    (p) => typeof p.stock === 'number' && p.stock === 0
  );

  const visibleAlerts = [...lowStockProducts, ...outOfStockProducts];
  const totalAlerts = visibleAlerts.length;
  const shown = visibleAlerts.slice(0, 3);

  if (totalAlerts === 0) {
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
        <Feather name="check-circle" size={32} color="#10b981" />
        <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '700', marginTop: 12 }}>Semua Stok Aman</Text>
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
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(239, 68, 68, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 18 }}>🔴</Text>
          </View>
          <View>
            <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '900' }}>Peringatan Stok</Text>
            <Text style={{ color: '#888888', fontSize: 13, marginTop: 2 }}>Perlu perhatian segera</Text>
          </View>
        </View>

        <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: '800' }}>● {totalAlerts} ALERT</Text>
        </View>
      </View>

      {/* List */}
      <View style={{ gap: 12 }}>
        {shown.map((product) => {
          const isOut = typeof product.stock === 'number' && product.stock === 0;
          const bg = isOut ? 'rgba(239, 68, 68, 0.05)' : 'rgba(245, 158, 11, 0.05)';
          const border = isOut ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)';
          const badgeBg = isOut ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)';
          const badgeColor = isOut ? '#f87171' : '#fbbf24';

          return (
            <TouchableOpacity
              key={product.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingBottom: 12,
                borderBottomWidth: 1,
                borderBottomColor: '#2a2a2a',
              }}
            >
              <Text style={{ fontSize: 20, marginRight: 12 }}>📦</Text>
              
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '700', marginBottom: 6 }}>{product.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ backgroundColor: badgeBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                    <Text style={{ color: badgeColor, fontSize: 10, fontWeight: '800' }}>{isOut ? 'HABIS' : 'RENDAH'}</Text>
                  </View>
                  <Text style={{ color: badgeColor, fontSize: 12, fontWeight: '700' }}>
                    {isOut ? `0/${product.minStock || 10} pcs` : `${product.stock}/${product.minStock || 10} pcs`}
                  </Text>
                </View>
              </View>

              <Feather name="arrow-right" size={16} color="#888888" />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Button */}
      {totalAlerts > shown.length && (
        <TouchableOpacity
          onPress={() => {
            try {
              navigation.navigate('Products');
            } catch (e) {}
          }}
          style={{ marginTop: 16, backgroundColor: '#2a2a2a', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}
        >
          <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' }}>
            LIHAT {totalAlerts} PERINGATAN →
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
