import React, { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BrainCircuit, TrendingUp, BarChart2, DollarSign, Package,
  ShoppingCart, Users, AlertTriangle,
} from 'lucide-react-native';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { formatRupiah, formatRupiahShort } from '../../utils/currency';

export default function BusinessInsightsScreen() {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);
  const { products, transactions, customers, wasteLogs } = useApp();

  const now = new Date();
  const todayTx = useMemo(() =>
    transactions.filter(t => new Date(t.date).toDateString() === now.toDateString()),
    [transactions]
  );
  const weekTx = useMemo(() => {
    const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 7);
    return transactions.filter(t => new Date(t.date) >= cutoff);
  }, [transactions]);

  const todayRevenue = todayTx.reduce((s, t) => s + t.total, 0);
  const weekRevenue = weekTx.reduce((s, t) => s + t.total, 0);
  const todayProfit = todayTx.reduce((s, t) => s + t.profit, 0);
  const weekProfit = weekTx.reduce((s, t) => s + t.profit, 0);
  const avgDailyRev = weekTx.length > 0 ? weekRevenue / 7 : 0;
  const profitMargin = weekRevenue > 0 ? Math.round((weekProfit / weekRevenue) * 100) : 0;

  // Top products
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; qty: number; rev: number }> = {};
    weekTx.forEach(t => t.items.forEach(i => {
      if (!map[i.productId]) map[i.productId] = { name: i.name, qty: 0, rev: 0 };
      map[i.productId].qty += i.quantity;
      map[i.productId].rev += i.price * i.quantity;
    }));
    return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [weekTx]);

  const wasteLoss = wasteLogs.reduce((s, w) => s + w.costLoss, 0);
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.minStock && p.stock !== -1);

  const insights = [
    {
      title: 'Performa Penjualan',
      desc: todayRevenue > avgDailyRev
        ? 'Penjualan hari ini di atas rata-rata! Pertahankan.'
        : 'Penjualan hari ini di bawah rata-rata. Coba promosi.',
      icon: TrendingUp,
      color: todayRevenue > avgDailyRev ? c.success : c.warning,
    },
    {
      title: 'Margin Keuntungan',
      desc: profitMargin > 40
        ? `Margin ${profitMargin}% sangat sehat.`
        : `Margin ${profitMargin}% bisa ditingkatkan.`,
      icon: DollarSign,
      color: profitMargin > 40 ? c.success : c.warning,
    },
    ...(lowStock.length > 0 ? [{
      title: 'Peringatan Stok',
      desc: `${lowStock.length} produk stoknya rendah. Segera restok.`,
      icon: AlertTriangle,
      color: c.error,
    }] : []),
    ...(wasteLoss > 0 ? [{
      title: 'Kerugian Waste',
      desc: `Total waste ${formatRupiahShort(wasteLoss)}. Review SOP penyimpanan.`,
      icon: Package,
      color: c.warning,
    }] : []),
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <BrainCircuit size={22} color={c.accent} strokeWidth={2} />
          <Text style={{ color: c.text, fontSize: 22, fontWeight: '900' }}>
            Business <Text style={{ color: c.accent }}>Intelligence</Text>
          </Text>
        </View>
        <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 4 }}>
          Analisis bisnis dan rekomendasi cerdas
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}>
        {/* KPI Cards */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {[
            { label: 'Revenue Hari Ini', value: formatRupiahShort(todayRevenue), color: c.accent },
            { label: 'Revenue Minggu', value: formatRupiahShort(weekRevenue), color: c.accent },
            { label: 'Profit Margin', value: `${profitMargin}%`, color: c.success },
            { label: 'Avg Daily', value: formatRupiahShort(avgDailyRev), color: c.accent },
          ].map(kpi => (
            <View key={kpi.label} style={{
              width: '47%', backgroundColor: c.bgCard, borderWidth: 1,
              borderColor: c.border, borderRadius: 16, padding: 16,
            }}>
              <Text style={{ color: c.textSecondary, fontSize: 11 }}>{kpi.label}</Text>
              <Text style={{ color: kpi.color, fontSize: 20, fontWeight: '900', marginTop: 4 }}>{kpi.value}</Text>
            </View>
          ))}
        </View>

        {/* AI Insights */}
        <Text style={{ color: c.text, fontSize: 16, fontWeight: '700' }}>Insight & Rekomendasi</Text>
        {insights.map((ins, i) => (
          <View key={i} style={{
            backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
            borderRadius: 14, padding: 14, flexDirection: 'row', gap: 12,
          }}>
            <View style={{
              width: 36, height: 36, borderRadius: 10,
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <ins.icon size={18} color={ins.color} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: 13, fontWeight: '700' }}>{ins.title}</Text>
              <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 2, lineHeight: 18 }}>{ins.desc}</Text>
            </View>
          </View>
        ))}

        {/* Top Products */}
        {topProducts.length > 0 && (
          <View>
            <Text style={{ color: c.text, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
              Produk Terlaris (7 Hari)
            </Text>
            {topProducts.map((p, i) => (
              <View key={i} style={{
                backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
                borderRadius: 14, padding: 14, marginBottom: 8,
                flexDirection: 'row', alignItems: 'center', gap: 12,
              }}>
                <View style={{
                  width: 28, height: 28, borderRadius: 14,
                  backgroundColor: i < 3 ? c.accentBg : (isDark ? '#222' : '#f1f5f9'),
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{
                    color: i < 3 ? c.accent : c.textMuted,
                    fontSize: 11, fontWeight: '800',
                  }}>#{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontSize: 13, fontWeight: '700' }}>{p.name}</Text>
                  <Text style={{ color: c.textSecondary, fontSize: 11 }}>{p.qty} terjual</Text>
                </View>
                <Text style={{ color: c.accent, fontSize: 13, fontWeight: '800' }}>
                  {formatRupiahShort(p.rev)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
