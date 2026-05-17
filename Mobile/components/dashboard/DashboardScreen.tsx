import React, { useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Home, TrendingUp, Package, AlertTriangle, Clock, ShoppingCart,
  DollarSign, BarChart2, Users, Zap, Menu,
} from 'lucide-react-native';
import { useApp } from '../../contexts/AppContext';
import { useShift } from '../../contexts/ShiftContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { formatRupiah, formatRupiahShort } from '../../utils/currency';

interface DashboardScreenProps {
  onOpenSidebar?: () => void;
}

export default function DashboardScreen({ onOpenSidebar }: DashboardScreenProps) {
  const { products, transactions } = useApp();
  const { activeShift } = useShift();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);
  const { width } = useWindowDimensions();
  const isLandscape = width > 600;

  const todayTransactions = useMemo(() =>
    transactions.filter(t => new Date(t.date).toDateString() === new Date().toDateString()),
    [transactions]
  );
  const todayRevenue = useMemo(() => todayTransactions.reduce((s, t) => s + t.total, 0), [todayTransactions]);
  const todayProfit = useMemo(() => todayTransactions.reduce((s, t) => s + t.profit, 0), [todayTransactions]);
  const activeProducts = useMemo(() => products.filter(p => p.isAvailable !== false).length, [products]);
  const lowStock = useMemo(() => products.filter(p => p.stock > 0 && p.stock <= p.minStock && p.stock !== -1).length, [products]);
  const avgTicket = todayTransactions.length > 0 ? todayRevenue / todayTransactions.length : 0;

  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Jakarta',
  }).format(new Date());

  const statCards = [
    { label: 'PENDAPATAN HARI INI', value: formatRupiah(todayRevenue), color: c.accent, icon: DollarSign, large: true },
    { label: 'Profit', value: formatRupiahShort(todayProfit), color: c.success, icon: TrendingUp },
    { label: 'Produk Aktif', value: String(activeProducts), color: c.accent, icon: Package },
    { label: 'Shift Aktif', value: activeShift ? 'Ya' : 'Tidak', color: activeShift ? c.success : c.textMuted, icon: Clock },
    { label: 'Stok Rendah', value: String(lowStock), color: c.error, icon: AlertTriangle },
    { label: 'Transaksi', value: String(todayTransactions.length), color: c.accent, icon: ShoppingCart },
    { label: 'Rata-rata Tiket', value: formatRupiahShort(avgTicket), color: c.accent, icon: BarChart2 },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Home size={22} color={c.accent} strokeWidth={2} />
          <Text style={{ color: c.text, fontSize: 20, fontWeight: '900' }}>Dashboard</Text>
        </View>
        {onOpenSidebar && (
          <TouchableOpacity onPress={onOpenSidebar} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Menu size={24} color={c.accent} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}>
        {/* Date Header */}
        <View style={{
          backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
          borderRadius: 16, padding: 16,
        }}>
          <Text style={{ color: c.accent, fontSize: 18, fontWeight: '900' }}>Dashboard Bisnis</Text>
          <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 4 }}>{formattedDate}</Text>
          <View style={{
            alignSelf: 'flex-start', marginTop: 8,
            backgroundColor: c.warningBg, borderRadius: 12,
            paddingHorizontal: 10, paddingVertical: 4,
            flexDirection: 'row', alignItems: 'center', gap: 4,
          }}>
            <Zap size={10} color={c.warning} strokeWidth={2} />
            <Text style={{ color: c.warning, fontSize: 10, fontWeight: '700' }}>Live</Text>
          </View>
        </View>

        {/* Revenue Card */}
        <View style={{
          backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
          borderRadius: 16, padding: 20,
        }}>
          <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: '600' }}>PENDAPATAN HARI INI</Text>
          <Text style={{ color: c.accent, fontSize: 32, fontWeight: '900', marginTop: 4 }}>
            {formatRupiah(todayRevenue)}
          </Text>
          <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 4 }}>
            {todayTransactions.length} transaksi
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {statCards.slice(1).map(card => (
            <View key={card.label} style={{
              width: isLandscape ? '31%' : '47%',
              backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
              borderRadius: 14, padding: 14,
            }}>
              <card.icon size={16} color={card.color} strokeWidth={2} />
              <Text style={{ color: c.textSecondary, fontSize: 11, marginTop: 8 }}>{card.label}</Text>
              <Text style={{ color: card.color, fontSize: 18, fontWeight: '800' }}>{card.value}</Text>
            </View>
          ))}
        </View>

        {/* Quick Stats Bar */}
        <View style={{
          flexDirection: 'row', gap: 8,
        }}>
          {[
            { label: 'Produk', val: String(products.length) },
            { label: 'Margin', val: todayRevenue > 0 ? `${Math.round((todayProfit / todayRevenue) * 100)}%` : '0%' },
            { label: 'Sukses', val: '100%' },
          ].map(q => (
            <View key={q.label} style={{
              flex: 1, backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
              borderRadius: 14, padding: 12, alignItems: 'center',
            }}>
              <Text style={{ color: c.text, fontSize: 18, fontWeight: '900' }}>{q.val}</Text>
              <Text style={{ color: c.textMuted, fontSize: 10, fontWeight: '700', marginTop: 2 }}>{q.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
