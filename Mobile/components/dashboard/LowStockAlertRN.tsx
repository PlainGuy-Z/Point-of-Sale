import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { AlertCircle, Package, ChevronRight } from 'lucide-react-native';
import type { Product } from '../../types';

interface LowStockAlertRNProps {
  products: Product[];
  isDark: boolean;
  onNavigate?: () => void;
}

export default function LowStockAlertRN({ products, isDark, onNavigate }: LowStockAlertRNProps) {
  const lowStockProducts = products.filter(
    p => typeof p.stock === 'number' && p.stock > 0 && p.stock <= (p.minStock || 10)
  );
  const outOfStockProducts = products.filter(
    p => typeof p.stock === 'number' && p.stock === 0
  );

  const visibleAlerts = [...lowStockProducts, ...outOfStockProducts];
  const totalAlerts = visibleAlerts.length;
  const shown = visibleAlerts.slice(0, 3);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (totalAlerts > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.6, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [totalAlerts]);

  if (totalAlerts === 0) {
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
        <View style={{ padding: 12, borderRadius: 16, backgroundColor: isDark ? '#064e3b' : '#dcfce7', marginBottom: 12 }}>
          <Package size={24} color={isDark ? '#34d399' : '#059669'} />
        </View>
        <Text style={{ color: isDark ? '#a8a29e' : '#475569', fontSize: 13, fontWeight: '600' }}>
          Semua stok mencukupi
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
      shadowColor: '#ef4444',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.35 : 0.12,
      shadowRadius: 10,
      elevation: 4,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ padding: 8, borderRadius: 12, backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2' }}>
            <AlertCircle size={20} color={isDark ? '#ef4444' : '#dc2626'} />
          </View>
          <View>
            <Text style={{ color: isDark ? '#ffffff' : '#0f172a', fontSize: 16, fontWeight: '900' }}>Peringatan Stok</Text>
            <Text style={{ color: isDark ? '#78716c' : '#64748b', fontSize: 11, marginTop: 2 }}>Perlu perhatian segera</Text>
          </View>
        </View>

        <View style={{ backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#fecaca', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444', opacity: pulseAnim }} />
          <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: '800' }}>{totalAlerts} ALERT</Text>
        </View>
      </View>

      <View style={{ gap: 12 }}>
        {shown.map((product) => {
          const isOut = typeof product.stock === 'number' && product.stock === 0;
          const bg = isDark
            ? (isOut ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)')
            : (isOut ? '#fff1f2' : '#fffbeb');
          const border = isDark
            ? (isOut ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)')
            : (isOut ? '#ffe4e6' : '#fef3c7');
          const badgeBg = isDark
            ? (isOut ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)')
            : (isOut ? '#fee2e2' : '#fde68a');
          const badgeColor = isOut ? (isDark ? '#f87171' : '#dc2626') : (isDark ? '#fbbf24' : '#d97706');

          return (
            <TouchableOpacity
              key={product.id}
              onPress={onNavigate}
              style={{
                backgroundColor: bg,
                borderWidth: 1,
                borderColor: border,
                borderRadius: 12,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <View style={{ padding: 8, borderRadius: 8, backgroundColor: isDark ? '#111' : '#fff', borderWidth: 1, borderColor: border }}>
                <Package size={16} color={badgeColor} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ color: isDark ? '#ffffff' : '#0f172a', fontSize: 14, fontWeight: '700' }} numberOfLines={1}>{product.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <View style={{ backgroundColor: badgeBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ color: badgeColor, fontSize: 10, fontWeight: '800' }}>{isOut ? 'HABIS' : 'RENDAH'}</Text>
                  </View>
                  <Text style={{ color: badgeColor, fontSize: 12, fontWeight: '700' }}>{isOut ? `0/${product.minStock || 10} pcs` : `${product.stock}/${product.minStock || 10} pcs`}</Text>
                </View>
              </View>

              <ChevronRight size={16} color={isDark ? '#78716c' : '#94a3b8'} />
            </TouchableOpacity>
          );
        })}
      </View>

      {totalAlerts > shown.length && (
        <TouchableOpacity
          onPress={onNavigate}
          style={{ marginTop: 16, backgroundColor: isDark ? '#252525' : '#f1f5f9', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}
        >
          <Text style={{ color: isDark ? '#d6d3d1' : '#475569', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' }}>
            Lihat Semua {totalAlerts} Peringatan →
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
