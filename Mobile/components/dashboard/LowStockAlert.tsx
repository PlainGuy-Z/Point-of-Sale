import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { AlertCircle, ChevronRight, Package } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { getColors } from '../../utils/theme';
import type { Product } from '../../types';

interface LowStockAlertProps {
  products: Product[];
  isDark: boolean;
  limit?: number;
}

export default function LowStockAlert({ products, isDark, limit = 3 }: LowStockAlertProps) {
  const c = getColors(isDark);
  const { height } = useWindowDimensions();

  // Exclude products that don't track stock (stock === -1 or missing)
  const lowStockProducts = (products || []).filter(
    (p) => typeof p.stock === 'number' && p.stock > 0 && p.stock <= (p.minStock || 10)
  );
  const outOfStockProducts = (products || []).filter(
    (p) => typeof p.stock === 'number' && p.stock === 0
  );

  // Combined visible alerts (low then out), exclude stock === -1 entirely
  const visibleAlerts = [...lowStockProducts, ...outOfStockProducts];
  const totalAlerts = visibleAlerts.length;
  const shown = visibleAlerts.slice(0, limit);
  const navigation: any = useNavigation();

  if (totalAlerts === 0) {
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
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: isDark ? '#10b98160' : '#d1fae560',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <AlertCircle
            size={24}
            color={isDark ? '#10b981' : '#059669'}
            strokeWidth={2}
          />
        </View>
        <Text
          style={{
            color: c.text,
            fontSize: 14,
            fontWeight: '700',
            marginBottom: 4,
            textAlign: 'center',
          }}
        >
          Semua Stok Aman
        </Text>
        <Text
          style={{
            color: c.textSecondary,
            fontSize: 11,
            textAlign: 'center',
          }}
        >
          Tidak ada produk dengan stok rendah atau habis
        </Text>
      </View>
    );
  }

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
      {/* Header with Alert Badge */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? '#ef444420' : '#fff1f2', justifyContent: 'center', alignItems: 'center' }}>
            <AlertCircle size={20} color="#ef4444" strokeWidth={2.5} />
            <View style={{ position: 'absolute', top: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444', borderWidth: 2, borderColor: isDark ? c.bgCard : '#fff' }} />
          </View>
          <View>
            <Text style={{ color: c.text, fontSize: 15, fontWeight: '900' }}>Peringatan Stok</Text>
            <Text style={{ color: c.textSecondary, fontSize: 13, marginTop: 2 }}>Perlu perhatian segera</Text>
          </View>
        </View>

        <View style={{ backgroundColor: isDark ? '#ef444420' : '#fff1f2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 24, borderWidth: 1, borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#fecaca' }}>
          <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: '800' }}>● {totalAlerts} ALERT</Text>
        </View>
      </View>
      {/* Visible alert items (combined low + out), limited to 3 */}
      {shown.length > 0 && (
        <ScrollView
          style={{ marginBottom: 6, flex: 1 }}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
        >
          <View>


            <View style={{ gap: 8 }}>
            {shown.map((product) => {
              const isOut = typeof product.stock === 'number' && product.stock === 0;
              const bg = isDark
                ? (isOut ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)')
                : (isOut ? '#fff1f2' : '#fffaf0');
              const border = isDark
                ? (isOut ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)')
                : (isOut ? '#fecaca' : '#fde68a');
              const pillBg = isDark
                ? (isOut ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)')
                : (isOut ? '#fee2e2' : '#fef3c7');
              const pillColor = isDark
                ? (isOut ? '#f87171' : '#fbbf24')
                : (isOut ? '#dc2626' : '#b45309');

              return (
                <TouchableOpacity
                  key={product.id}
                  style={{
                    backgroundColor: bg,
                    borderWidth: 1,
                    borderColor: border,
                    borderRadius: 12,
                    padding: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: isDark ? '#1a222d' : '#fff', borderWidth: 1, borderColor: border, justifyContent: 'center', alignItems: 'center' }}>
                    <Package size={18} color={pillColor} strokeWidth={2.5} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }} numberOfLines={1}>{product.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                      <View style={{ backgroundColor: pillBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 0.5, borderColor: border }}>
                        <Text style={{ color: pillColor, fontSize: 11, fontWeight: '800' }}>{isOut ? 'HABIS' : 'RENDAH'}</Text>
                      </View>
                      <Text style={{ color: pillColor, fontSize: 12, fontWeight: '700' }}>{isOut ? `0/${product.minStock || 10} pcs` : `${product.stock}/${product.minStock || 10} pcs`}</Text>
                    </View>
                  </View>

                  <ChevronRight size={18} color={c.textSecondary} strokeWidth={2} />
                </TouchableOpacity>
              );
            })}
          </View>
          </View>
        </ScrollView>
      )}

      {/* Out of Stock Products (rendered as part of combined shown list) */}
      {/* Note: full outOfStockProducts list still used for counts, but items are shown via `shown` */}

      {/* Action Button - show when there are more alerts than shown */}
      {totalAlerts > shown.length && (
        <TouchableOpacity
          onPress={() => {
            try {
              navigation.navigate('Products');
            } catch (e) {
              // swallow if route not present
            }
          }}
          style={{
            marginTop: 14,
            paddingTop: 14,
            borderTopWidth: 1,
            borderTopColor: c.border,
          }}
        >
          <View style={{ backgroundColor: c.border, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: c.textSecondary, fontSize: 13, fontWeight: '800', textTransform: 'uppercase' }}>LIHAT {totalAlerts} PERINGATAN →</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}
