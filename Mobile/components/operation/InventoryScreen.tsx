import React, { useMemo } from 'react';
import { View, Text, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Layers, DollarSign, TrendingUp, Package } from 'lucide-react-native';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { formatRupiah, formatRupiahShort } from '../../utils/currency';

export default function InventoryScreen() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscape = windowWidth > windowHeight;
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);
  const { products, wasteLogs } = useApp();

  const totalCost = useMemo(() =>
    products.reduce((s, p) => s + ((p.cost || 0) * (p.stock === -1 ? 0 : p.stock)), 0),
    [products]
  );

  const totalWasteLoss = useMemo(() =>
    wasteLogs.reduce((s, w) => s + w.costLoss, 0),
    [wasteLogs]
  );

  const categoryStats = useMemo(() => {
    const map: Record<string, { count: number; value: number; cost: number }> = {};
    products.forEach(p => {
      const cat = p.category || 'Lainnya';
      if (!map[cat]) map[cat] = { count: 0, value: 0, cost: 0 };
      map[cat].count += 1;
      map[cat].value += p.price * (p.stock === -1 ? 0 : p.stock);
      map[cat].cost += (p.cost || 0) * (p.stock === -1 ? 0 : p.stock);
    });
    return Object.entries(map).sort((a, b) => b[1].value - a[1].value);
  }, [products]);

  const lowStockItems = useMemo(() =>
    products.filter(p => p.stock > 0 && p.stock <= p.minStock && p.stock !== -1),
    [products]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingLeft: 16, paddingRight: 16, paddingVertical: 12 }}>
        <Text style={{ color: c.text, fontSize: 22, fontWeight: '900' }}>
          Inventory & <Text style={{ color: c.accent }}>Biaya</Text>
        </Text>
        <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 4 }}>
          Pantau stok dan analisis biaya
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}>
        {/* Overview Cards */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {[
            { label: 'Nilai Inventaris', value: formatRupiah(totalCost), color: c.accent, Icon: DollarSign },
            { label: 'Total Produk', value: String(products.length), color: c.accent, Icon: Package },
            { label: 'Kerugian Waste', value: formatRupiah(totalWasteLoss), color: c.error, Icon: TrendingUp },
            { label: 'Stok Rendah', value: String(lowStockItems.length), color: c.warning, Icon: Layers },
          ].map(card => (
            <View key={card.label} style={{
              width: '47%', backgroundColor: c.bgCard, borderWidth: 1,
              borderColor: c.border, borderRadius: 16, padding: 16,
            }}>
              <card.Icon size={16} color={card.color} strokeWidth={2} />
              <Text style={{ color: c.textSecondary, fontSize: 11, marginTop: 8 }}>{card.label}</Text>
              <Text style={{ color: card.color, fontSize: 18, fontWeight: '800', marginTop: 2 }}>{card.value}</Text>
            </View>
          ))}
        </View>

        {/* Category Breakdown */}
        {categoryStats.length > 0 && (
          <View>
            <Text style={{ color: c.text, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
              Berdasarkan Kategori
            </Text>
            {categoryStats.map(([cat, stat]) => (
              <View key={cat} style={{
                backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
                borderRadius: 14, padding: 14, marginBottom: 8,
                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <View>
                  <Text style={{ color: c.text, fontSize: 13, fontWeight: '700' }}>{cat}</Text>
                  <Text style={{ color: c.textSecondary, fontSize: 11, marginTop: 2 }}>
                    {stat.count} produk
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: c.accent, fontSize: 14, fontWeight: '800' }}>
                    {formatRupiahShort(stat.value)}
                  </Text>
                  <Text style={{ color: c.textMuted, fontSize: 10, marginTop: 2 }}>
                    Cost: {formatRupiahShort(stat.cost)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <View>
            <Text style={{ color: c.text, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
              Peringatan Stok Rendah
            </Text>
            {lowStockItems.map(p => (
              <View key={p.id} style={{
                backgroundColor: c.warningBg, borderWidth: 1,
                borderColor: isDark ? 'rgba(245,158,11,0.2)' : '#fde68a',
                borderRadius: 14, padding: 14, marginBottom: 8,
                flexDirection: 'row', justifyContent: 'space-between',
              }}>
                <View>
                  <Text style={{ color: c.text, fontSize: 13, fontWeight: '700' }}>{p.name}</Text>
                  <Text style={{ color: c.textSecondary, fontSize: 11 }}>{p.category}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: c.warning, fontSize: 14, fontWeight: '800' }}>
                    {p.stock} {p.unit}
                  </Text>
                  <Text style={{ color: c.textMuted, fontSize: 10 }}>min: {p.minStock}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
