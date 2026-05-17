import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart2, TrendingUp, DollarSign } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { formatRupiah, formatRupiahShort } from '../../utils/currency';
import { useApp } from '../../contexts/AppContext';

export default function SalesReportScreen() {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);
  const { transactions } = useApp();
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week');

  const filtered = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      const d = new Date(t.date);
      if (period === 'today') return d.toDateString() === now.toDateString();
      if (period === 'week') {
        const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 7);
        return d >= cutoff;
      }
      const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 30);
      return d >= cutoff;
    });
  }, [transactions, period]);

  const totalSales = filtered.reduce((s, t) => s + t.total, 0);
  const totalProfit = filtered.reduce((s, t) => s + t.profit, 0);
  const avgTicket = filtered.length > 0 ? totalSales / filtered.length : 0;

  // Group by date
  const dailyMap = useMemo(() => {
    const map: Record<string, { sales: number; profit: number; count: number }> = {};
    filtered.forEach(t => {
      const key = new Date(t.date).toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
      if (!map[key]) map[key] = { sales: 0, profit: 0, count: 0 };
      map[key].sales += t.total;
      map[key].profit += t.profit;
      map[key].count += 1;
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const periods = [
    { key: 'today' as const, label: 'Hari Ini' },
    { key: 'week' as const, label: '7 Hari' },
    { key: 'month' as const, label: '30 Hari' },
  ];

  const cards = [
    { label: 'Total Penjualan', value: formatRupiah(totalSales), color: c.accent, Icon: DollarSign },
    { label: 'Total Transaksi', value: String(filtered.length), color: c.accent, Icon: BarChart2 },
    { label: 'Total Profit', value: formatRupiah(totalProfit), color: c.success, Icon: TrendingUp },
    { label: 'Rata-rata Tiket', value: formatRupiah(Math.round(avgTicket)), color: c.accent, Icon: DollarSign },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <Text style={{ color: c.text, fontSize: 22, fontWeight: '900' }}>
          Laporan <Text style={{ color: c.accent }}>Penjualan</Text>
        </Text>
        <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 4 }}>
          Analisis performa penjualan toko Anda
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginBottom: 12 }}>
        {periods.map(opt => (
          <TouchableOpacity key={opt.key} onPress={() => setPeriod(opt.key)}
            style={{
              backgroundColor: period === opt.key ? c.accent : c.bgCard,
              borderWidth: period === opt.key ? 0 : 1, borderColor: c.border,
              borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
            }}>
            <Text style={{
              color: period === opt.key ? c.textInverse : c.textSecondary,
              fontSize: 13, fontWeight: '600',
            }}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {cards.map(card => (
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

        {dailyMap.length > 0 && (
          <View>
            <Text style={{ color: c.text, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>Penjualan Harian</Text>
            {dailyMap.map(([date, d]) => (
              <View key={date} style={{
                backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
                borderRadius: 14, padding: 14, marginBottom: 8,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <View>
                  <Text style={{ color: c.text, fontSize: 13, fontWeight: '600' }}>{date}</Text>
                  <Text style={{ color: c.textSecondary, fontSize: 11, marginTop: 2 }}>{d.count} transaksi</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: c.accent, fontSize: 14, fontWeight: '800' }}>{formatRupiahShort(d.sales)}</Text>
                  <Text style={{ color: c.success, fontSize: 11 }}>+{formatRupiahShort(d.profit)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {dailyMap.length === 0 && (
          <View style={{
            backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
            borderRadius: 20, padding: 40, alignItems: 'center',
          }}>
            <BarChart2 size={48} color={c.textMuted} strokeWidth={1.5} />
            <Text style={{ color: c.textSecondary, fontSize: 14, marginTop: 12 }}>Belum ada data penjualan</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
