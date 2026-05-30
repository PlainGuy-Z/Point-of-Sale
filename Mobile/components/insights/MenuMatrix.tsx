import React, { useMemo } from 'react';
import { View, Text, ScrollView, useWindowDimensions } from 'react-native';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { formatRupiahShort } from '../../utils/currency';
import { LayoutGrid, Star, AlertCircle, Coins, HelpCircle } from 'lucide-react-native';

export default function MenuMatrix() {
  const { width } = useWindowDimensions();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);
  const { products, transactions } = useApp();

  const matrixData = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTx = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);

    const productStats = new Map<string, { qty: number; rev: number }>();
    recentTx.forEach(t => {
      t.items.forEach(item => {
        const stats = productStats.get(item.productId) || { qty: 0, rev: 0 };
        stats.qty += item.quantity;
        stats.rev += (item.price * item.quantity);
        productStats.set(item.productId, stats);
      });
    });

    let totalQty = 0;
    let totalMargin = 0;
    let validProductsCount = 0;

    const analyzed = products.map(p => {
      const stats = productStats.get(p.id) || { qty: 0, rev: 0 };
      const hasCost = p.cost !== undefined && p.cost !== null && p.cost > 0;
      const margin = hasCost ? ((p.price - p.cost!) / p.price) * 100 : null;

      if (margin !== null) {
        totalQty += stats.qty;
        totalMargin += margin;
        validProductsCount++;
      }

      return {
        id: p.id,
        name: p.name,
        qty: stats.qty,
        rev: stats.rev,
        margin: margin
      };
    });

    const avgQty = validProductsCount > 0 ? totalQty / validProductsCount : 0;
    const avgMargin = validProductsCount > 0 ? totalMargin / validProductsCount : 0;

    const stars: typeof analyzed = [];
    const cashCows: typeof analyzed = [];
    const problems: typeof analyzed = [];
    const dogs: typeof analyzed = [];

    analyzed.forEach(p => {
      if (p.margin === null || p.qty === 0) return;
      if (p.margin >= avgMargin && p.qty >= avgQty) stars.push(p);
      else if (p.margin < avgMargin && p.qty >= avgQty) cashCows.push(p);
      else if (p.margin >= avgMargin && p.qty < avgQty) problems.push(p);
      else dogs.push(p);
    });

    const sortFn = (a: any, b: any) => b.rev - a.rev;
    stars.sort(sortFn);
    cashCows.sort(sortFn);
    problems.sort(sortFn);
    dogs.sort(sortFn);

    return { stars, cashCows, problems, dogs };
  }, [products, transactions]);

  const renderQuadrant = (title: string, desc: string, icon: any, color: string, items: any[], bg: string) => (
    <View style={{
      width: '48%',
      backgroundColor: bg,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      padding: 12,
      marginBottom: 12,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        {React.createElement(icon, { size: 16, color: color, strokeWidth: 2.5 })}
        <Text style={{ color: c.text, fontSize: 14, fontWeight: '800' }}>{title}</Text>
      </View>
      <Text style={{ color: c.textSecondary, fontSize: 10, marginBottom: 12 }}>{desc}</Text>

      {items.length > 0 ? (
        <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled>
          {items.slice(0, 5).map(item => (
            <View key={item.id} style={{
              backgroundColor: c.bgCard,
              padding: 8,
              borderRadius: 8,
              marginBottom: 6,
              borderWidth: 1,
              borderColor: c.borderLight,
            }}>
              <Text style={{ color: c.text, fontSize: 12, fontWeight: '700' }} numberOfLines={1}>{item.name}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                <Text style={{ color: c.textSecondary, fontSize: 10 }}>{item.qty} trjl</Text>
                <Text style={{ color: color, fontSize: 10, fontWeight: '700' }}>{item.margin.toFixed(0)}% mgr</Text>
              </View>
            </View>
          ))}
          {items.length > 5 && (
            <Text style={{ color: c.textMuted, fontSize: 10, textAlign: 'center', marginTop: 4 }}>+{items.length - 5} lainnya</Text>
          )}
        </ScrollView>
      ) : (
        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
          <Text style={{ color: c.textMuted, fontSize: 11 }}>Tidak ada produk</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={{
      backgroundColor: c.bgCard,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <View style={{
          width: 32, height: 32, borderRadius: 10,
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
          alignItems: 'center', justifyContent: 'center'
        }}>
          <LayoutGrid size={16} color={c.accent} />
        </View>
        <View>
          <Text style={{ color: c.text, fontSize: 16, fontWeight: '800' }}>BCG Menu Matrix (30 Hari)</Text>
          <Text style={{ color: c.textSecondary, fontSize: 11 }}>Margin vs Popularitas</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        {renderQuadrant('Stars', 'Laris & Untung Besar', Star, c.success, matrixData.stars, isDark ? '#112211' : '#f0fdf4')}
        {renderQuadrant('Problems', 'Untung tapi Kurang Laris', HelpCircle, c.warning, matrixData.problems, isDark ? '#221a00' : '#fffbeb')}
        {renderQuadrant('Cash Cows', 'Laris tapi Tipis Untung', Coins, c.accent, matrixData.cashCows, isDark ? '#111a2a' : '#eff6ff')}
        {renderQuadrant('Dogs', 'Sepi & Kurang Untung', AlertCircle, c.error, matrixData.dogs, isDark ? '#2a1111' : '#fef2f2')}
      </View>
    </View>
  );
}
