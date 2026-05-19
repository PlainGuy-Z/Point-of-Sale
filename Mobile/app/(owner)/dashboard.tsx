import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Zap, DollarSign, ShoppingCart, Users, TrendingUp } from 'lucide-react-native';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { formatRupiah } from '../../utils/currency';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics';

import StatCardRN from '../../components/dashboard/StatCardRN';
import ProfitChartRN from '../../components/dashboard/ProfitChartRN';
import TopProductsRN from '../../components/dashboard/TopProductsRN';
import LowStockAlertRN from '../../components/dashboard/LowStockAlertRN';

function DotIndicator({ count, activeIndex, isDark, accentColor }: any) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{
          width: i === activeIndex ? 20 : 6,
          height: 6, borderRadius: 999,
          backgroundColor: i === activeIndex
            ? (accentColor || '#0d9488')
            : (isDark ? '#44403c' : '#cbd5e1'),
        }} />
      ))}
    </View>
  );
}

function PanelSelector({ labels, activeIndex, onSelect, isDark }: any) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 12 }}>
      {labels.map((label: string, i: number) => (
        <TouchableOpacity key={label} onPress={() => onSelect(i)}
          style={{
            paddingHorizontal: 16, paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: i === activeIndex
              ? '#0d9488' : (isDark ? '#292524' : '#e7e5e4'),
          }}>
          <Text style={{
            fontSize: 11, fontWeight: '600',
            color: i === activeIndex ? '#fff'
              : (isDark ? '#78716c' : '#475569'),
          }}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function SectionLabel({ children, isDark }: any) {
  return (
    <Text style={{
      fontSize: 11, fontWeight: '700',
      textTransform: 'uppercase', letterSpacing: 1,
      color: isDark ? '#78716c' : '#475569',
      marginBottom: 8,
    }}>{children}</Text>
  );
}

export default function OwnerDashboard() {
  const { products, transactions, customers, wasteLogs } = useApp();
  const { metrics, topProductsToday, rawData } = useDashboardMetrics(products, transactions, customers, wasteLogs);
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const insets = useSafeAreaInsets();

  const [isLandscape, setIsLandscape] = useState(
    Dimensions.get('window').width > Dimensions.get('window').height
  );

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setIsLandscape(window.width > window.height);
    });
    return () => sub?.remove();
  }, []);

  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Jakarta',
  }).format(new Date());

  const screenWidth = Dimensions.get('window').width;
  const cardWidth = isLandscape ? (screenWidth - 32 - 16) / 4 : screenWidth - 48; // Portrait carousel
  const panelWidth = isLandscape ? (screenWidth - 32 - 280 - 12) : screenWidth - 32;

  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [activePanelIndex, setActivePanelIndex] = useState(0);

  const handleCardScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setActiveCardIndex(Math.round(index));
  };

  const handlePanelScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setActivePanelIndex(Math.round(index));
  };

  const statCardsData = [
    { title: "Pendapatan Hari Ini", value: formatRupiah(metrics.todayRevenue), icon: DollarSign, trend: metrics.revenueChange >= 0 ? 'up' : 'down' as any },
    { title: "Transaksi", value: String(metrics.todayTransactionCount), icon: ShoppingCart, trend: metrics.transactionChange >= 0 ? 'up' : 'down' as any },
    { title: "Pelanggan Baru", value: String(metrics.newCustomers), icon: Users, trend: metrics.newCustomers > 0 ? 'up' : 'stable' as any },
    { title: "Rata-rata Tiket", value: formatRupiah(metrics.avgTicket), icon: TrendingUp, trend: metrics.avgTicket > 30000 ? 'up' : 'stable' as any },
  ];

  if (isLandscape) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#0f0f0f' : '#f8fafc' }} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: insets.bottom + 24, gap: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flexDirection: 'row', gap: 16 }}>
            {/* Left column */}
            <View style={{ flex: 1, gap: 16 }}>
              {/* Header */}
              <View style={{
                borderRadius: 16, padding: 20,
                backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                borderWidth: 1, borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <View>
                  <Text style={{ fontSize: 24, fontWeight: '900' }}>
                    <Text style={{ color: isDark ? '#f59e0b' : '#0d9488' }}>Dashboard </Text>
                    <Text style={{ color: isDark ? '#ffffff' : '#0f172a' }}>Bisnis</Text>
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#78716c' : '#475569', marginTop: 4 }}>
                    {formattedDate}
                  </Text>
                </View>
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 4,
                  paddingHorizontal: 12, paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: isDark ? '#292524' : '#fef3c7',
                }}>
                  <Zap size={12} color="#f59e0b" />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#f59e0b' }}>Live</Text>
                </View>
              </View>

              {/* Stat Cards Grid */}
              <View>
                <SectionLabel isDark={isDark}>Statistik Utama</SectionLabel>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  {statCardsData.map((card, i) => (
                    <View key={i} style={{ width: '48.5%' }}>
                      <StatCardRN {...card} isDark={isDark} />
                    </View>
                  ))}
                </View>
              </View>

              {/* Profit Chart */}
              <View>
                <SectionLabel isDark={isDark}>Tren Pendapatan</SectionLabel>
                <ProfitChartRN transactions={rawData.transactions} isDark={isDark} />
              </View>
            </View>

            {/* Right column */}
            <View style={{ width: 320, gap: 16 }}>
              {/* Quick Stats */}
              <View>
                <SectionLabel isDark={isDark}>Ringkasan Cepat</SectionLabel>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {[
                    { label: 'Produk', value: String(metrics.totalProducts) },
                    { label: 'Margin', value: `${metrics.profitMargin}%` },
                    { label: 'Sukses', value: `${metrics.successRate}%` },
                  ].map((item, i) => (
                    <View key={item.label} style={{
                      width: i === 0 ? '100%' : '48%',
                      padding: 12, borderRadius: 16,
                      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                      borderWidth: 1, borderColor: isDark ? '#2a2a2a' : '#f1f5f9',
                      alignItems: 'center',
                    }}>
                      <Text style={{ fontSize: 20, fontWeight: '900', color: isDark ? '#ffffff' : '#0f172a' }}>{item.value}</Text>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#57534e' : '#94a3b8', textTransform: 'uppercase', marginTop: 2 }}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View>
                <SectionLabel isDark={isDark}>Produk & Inventaris</SectionLabel>
                <View style={{ gap: 16 }}>
                  <TopProductsRN products={topProductsToday} title="Produk Terlaris Hari Ini" limit={5} isDark={isDark} />
                  <LowStockAlertRN products={[...metrics.lowStockProducts, ...metrics.outOfStockProducts]} isDark={isDark} onNavigate={() => router.push('/(owner)/products')} />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Portrait layout
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#0f0f0f' : '#f8fafc' }} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: insets.bottom + 24, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{
          borderRadius: 16, padding: 20,
          backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
          borderWidth: 1, borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Text style={{ fontSize: 24, fontWeight: '900' }}>
                <Text style={{ color: isDark ? '#f59e0b' : '#0d9488' }}>Dashboard </Text>
                <Text style={{ color: isDark ? '#ffffff' : '#0f172a' }}>Bisnis</Text>
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#78716c' : '#475569', marginTop: 4 }}>
                {formattedDate}
              </Text>
            </View>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 4,
              paddingHorizontal: 12, paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: isDark ? '#292524' : '#fef3c7',
            }}>
              <Zap size={12} color="#f59e0b" />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#f59e0b' }}>Live</Text>
            </View>
          </View>
        </View>

        <View>
          <SectionLabel isDark={isDark}>Statistik Utama</SectionLabel>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={cardWidth + 12}
            snapToAlignment="start"
            onScroll={handleCardScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{ gap: 12, paddingRight: 16 }}
          >
            {statCardsData.map((card, i) => (
              <StatCardRN key={i} {...card} isDark={isDark} style={{ width: cardWidth }} />
            ))}
          </ScrollView>
          <DotIndicator count={4} activeIndex={activeCardIndex} isDark={isDark} />
        </View>

        <View>
          <SectionLabel isDark={isDark}>Tren Pendapatan</SectionLabel>
          <ProfitChartRN transactions={rawData.transactions} isDark={isDark} />
        </View>

        <View>
          <SectionLabel isDark={isDark}>Ringkasan Cepat</SectionLabel>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { label: 'Produk', value: String(metrics.totalProducts) },
              { label: 'Margin', value: `${metrics.profitMargin}%` },
              { label: 'Sukses', value: `${metrics.successRate}%` },
            ].map(item => (
              <View key={item.label} style={{
                flex: 1, padding: 12, borderRadius: 16,
                backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                borderWidth: 1, borderColor: isDark ? '#2a2a2a' : '#f1f5f9',
                alignItems: 'center',
              }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: isDark ? '#ffffff' : '#0f172a' }}>{item.value}</Text>
                <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#57534e' : '#94a3b8', textTransform: 'uppercase', marginTop: 2 }}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View>
          <SectionLabel isDark={isDark}>Produk & Inventaris</SectionLabel>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={panelWidth + 12}
            snapToAlignment="start"
            onScroll={handlePanelScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{ gap: 12, paddingRight: 16 }}
          >
            <View style={{ width: panelWidth }}>
              <TopProductsRN products={topProductsToday} title="Produk Terlaris Hari Ini" limit={5} isDark={isDark} />
            </View>
            <View style={{ width: panelWidth }}>
              <LowStockAlertRN products={[...metrics.lowStockProducts, ...metrics.outOfStockProducts]} isDark={isDark} onNavigate={() => router.push('/(owner)/products')} />
            </View>
          </ScrollView>
          <PanelSelector
            labels={['Produk Terlaris', 'Peringatan Stok']}
            activeIndex={activePanelIndex}
            onSelect={() => {}}
            isDark={isDark}
          />
        </View>

        <View style={{
          borderRadius: 16, padding: 16,
          backgroundColor: isDark ? '#1a1a1a' : '#f0fdf9',
          borderWidth: 1, borderColor: isDark ? '#2a2a2a' : '#99f6e4',
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: isDark ? '#fff' : '#0f172a' }}>
              Wawasan Kinerja
            </Text>
            <TrendingUp size={18} color="#4ade80" />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {[
              { label: 'Rata-rata Pesanan', value: formatRupiah(Math.round(metrics.avgTicket)) },
              { label: 'Tingkat Konversi', value: '33%' },
              { label: 'Retensi Pelanggan', value: `${Math.min(85 + metrics.newCustomers, 99)}%` },
              { label: 'Perputaran Inventaris', value: `${Math.round((metrics.todayRevenue / Math.max(metrics.stockValue, 1)) * 30)} hr` },
            ].map(metric => (
              <View key={metric.label} style={{
                width: 140, padding: 12, borderRadius: 12,
                backgroundColor: isDark ? '#252525' : '#ffffff',
              }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#a8a29e' : '#475569' }}>
                  {metric.label}
                </Text>
                <Text style={{ fontSize: 18, fontWeight: '900', color: isDark ? '#fff' : '#0f172a', marginTop: 4 }}>
                  {metric.value}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
