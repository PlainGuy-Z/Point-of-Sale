import React, { useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../contexts/AppContext';
import { useLayout } from '../../hooks/useLayout';
import { formatRupiah, formatRupiahShort } from '../../utils/currency';

// Components
import DashboardHeader from './DashboardHeader';
import StatCard from './StatCard';
import RevenueChart from './RevenueChart';
import StockAlertPanel from './StockAlertPanel';
import TopProductsPanel from './TopProductsPanel';
import WawasanKinerja from './WawasanKinerja';

interface DashboardScreenProps {
  onOpenSidebar?: () => void;
}

export default function DashboardScreen({ onOpenSidebar }: DashboardScreenProps) {
  const { products, transactions } = useApp();
  const layout = useLayout();

  // Data calculations (preserved from original)
  const todayTransactions = useMemo(() =>
    transactions.filter(t => new Date(t.date).toDateString() === new Date().toDateString()),
    [transactions]
  );
  const todayRevenue = useMemo(() => todayTransactions.reduce((s, t) => s + t.total, 0), [todayTransactions]);
  const todayProfit = useMemo(() => todayTransactions.reduce((s, t) => s + t.profit, 0), [todayTransactions]);
  
  const avgTicket = todayTransactions.length > 0 ? todayRevenue / todayTransactions.length : 0;
  const profitMargin = todayRevenue > 0 ? Math.round((todayProfit / todayRevenue) * 100) : 0;

  // Stat Cards Data
  const statsRow1 = [
    { title: 'Pendapatan', value: formatRupiah(todayRevenue), icon: 'dollar-sign', iconColor: '#10b981', barColor: '#10b981' },
    { title: 'Transaksi', value: String(todayTransactions.length), icon: 'shopping-cart', iconColor: '#f59e0b', barColor: '#f59e0b' },
    { title: 'Pelanggan', value: '0', icon: 'users', iconColor: '#8b5cf6', barColor: '#8b5cf6' },
    { title: 'Rata Tiket', value: formatRupiahShort(avgTicket), icon: 'trending-up', iconColor: '#f59e0b', barColor: '#f59e0b' },
  ] as const;

  const statsRow3 = [
    { title: 'Peringatan', value: '1', icon: 'alert-triangle', iconColor: '#f97316', barColor: '#f97316' },
    { title: 'Stok Habis', value: '5', icon: 'package', iconColor: '#ef4444', barColor: '#ef4444' },
    { title: 'Tk.Margin', value: `${profitMargin}%`, icon: 'percent', iconColor: '#0d9488', barColor: '#0d9488' },
  ] as const;

  const statsRow4 = [
    { title: 'Total Prod', value: String(products.length), icon: 'box', iconColor: '#8b5cf6', barColor: '#8b5cf6' },
    { title: 'Nilai Stok', value: 'Rp 3.86jt', icon: 'database', iconColor: '#10b981', barColor: '#10b981' },
    { title: 'Tk.Berhasil', value: '96%', icon: 'check-circle', iconColor: '#0d9488', barColor: '#0d9488' },
  ] as const;

  // Top products calculation
  const topProductsData = useMemo(() => {
    const productSales = new Map<string, any>();
    todayTransactions.forEach(transaction => {
      transaction.items?.forEach(item => {
        const productId = item.productId;
        const existing = productSales.get(productId);
        if (existing) {
          existing.quantity += item.quantity || 1;
          existing.revenue += item.price * (item.quantity || 1);
        } else {
          const product = products.find(p => p.id === productId);
          if (product) {
            productSales.set(productId, {
              product,
              quantity: item.quantity || 1,
              revenue: item.price * (item.quantity || 1),
            });
          }
        }
      });
    });
    return Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .map(sale => ({ ...sale.product, quantity: sale.quantity, revenue: sale.revenue }));
  }, [todayTransactions, products]);

  // Split layout (Tablet/Landscape)
  if (layout.showSplitLayout) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#111111' }}>
        <View style={{ paddingHorizontal: 24 }}>
          <DashboardHeader />
        </View>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          
          {/* LEFT PANEL */}
          <ScrollView 
            style={{ flex: 0.65, paddingHorizontal: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Row 1 */}
            <View style={{ flexDirection: 'row', gap: layout.spacing, marginBottom: layout.spacing }}>
              {statsRow1.map((s, i) => (
                <View key={i} style={{ flex: 1 }}>
                  <StatCard {...s} width="100%" height={130} />
                </View>
              ))}
            </View>

            {/* Row 2: Chart */}
            <RevenueChart transactions={transactions} width={(layout.width * 0.65) - 48} />

            {/* Row 3 */}
            <View style={{ flexDirection: 'row', gap: layout.spacing, marginBottom: layout.spacing }}>
              {statsRow3.map((s, i) => (
                <View key={i} style={{ flex: 1 }}>
                  <StatCard {...s} width="100%" height={120} />
                </View>
              ))}
            </View>

            {/* Row 4 */}
            <View style={{ flexDirection: 'row', gap: layout.spacing, marginBottom: layout.spacing }}>
              {statsRow4.map((s, i) => (
                <View key={i} style={{ flex: 1 }}>
                  <StatCard {...s} width="100%" height={120} />
                </View>
              ))}
            </View>

            {/* Row 5: Wawasan Kinerja */}
            <WawasanKinerja numColumns={4} />
          </ScrollView>

          {/* DIVIDER */}
          <View style={{ width: 1, backgroundColor: '#2a2a2a' }} />

          {/* RIGHT PANEL */}
          <ScrollView 
            style={{ flex: 0.35, paddingHorizontal: 16 }}
            showsVerticalScrollIndicator={false}
          >
            <StockAlertPanel products={products} />
            <TopProductsPanel products={topProductsData} />
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // Stack layout (Phone Portrait)
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#111111' }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
        <DashboardHeader />
        
        {/* 2x2 Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          {statsRow1.map((s, i) => (
            <StatCard key={i} {...s} width={(layout.width - 32 - 12) / 2} height={120} />
          ))}
        </View>

        <RevenueChart transactions={transactions} width={layout.width - 32} />

        <StockAlertPanel products={products} />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          {statsRow3.map((s, i) => (
            <StatCard key={i} {...s} width={(layout.width - 32 - 12) / 2} height={120} />
          ))}
        </View>

        <WawasanKinerja numColumns={2} />

        <TopProductsPanel products={topProductsData} />
      </ScrollView>
    </SafeAreaView>
  );
}
