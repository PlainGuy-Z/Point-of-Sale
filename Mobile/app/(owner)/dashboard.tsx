import React, { useState, useRef, useCallback, useContext } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent, Image, ActivityIndicator, Modal, Platform, StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Zap, DollarSign, ShoppingCart, Users, TrendingUp,
  ChevronLeft, ChevronRight, Menu, Coffee,
  Receipt, ClipboardList, UserCheck, BrainCircuit, Layers, Gift, Trash2, HelpCircle,
  MoreHorizontal, X, LayoutDashboard, BarChart2, Package, Settings, Trophy
} from 'lucide-react-native';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { formatRupiah } from '../../utils/currency';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics';
import type { PresetKey } from '../../hooks/useMobileSalesReport';
import { SidebarContext } from '../../contexts/SidebarContext';
import { useAuth } from '../../contexts/AuthContext';
import { appApi } from '../../services/appApi';
import StatCardRN from '../../components/dashboard/StatCardRN';
import ProfitChartRN from '../../components/dashboard/ProfitChartRN';
import TopProductsRN from '../../components/dashboard/TopProductsRN';
import LowStockAlertRN from '../../components/dashboard/LowStockAlertRN';
import InfoCard from '../../components/dashboard/InfoCard';
import BranchSelectorHeader from '../../components/navigation/BranchSelectorHeader';

/* ─── Section Label ───────────────────────────────────────────────────── */

function SectionLabel({ children, isDark }: { children: React.ReactNode; isDark: boolean }) {
  return (
    <Text style={{
      fontSize: 11, fontWeight: '700',
      textTransform: 'uppercase', letterSpacing: 1,
      color: isDark ? '#78716c' : '#475569',
      marginBottom: 8,
    }}>{children}</Text>
  );
}

/* ─── Dot Indicator ───────────────────────────────────────────────────── */

function DotIndicator({ count, activeIndex, accentColor, isDark }: {
  count: number; activeIndex: number; accentColor: string; isDark: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{
          width: i === activeIndex ? 20 : 6,
          height: 6, borderRadius: 999,
          backgroundColor: i === activeIndex ? accentColor : (isDark ? '#44403c' : '#cbd5e1'),
        }} />
      ))}
    </View>
  );
}

/* ─── Stat Carousel (2 cards per page) ────────────────────────────────── */

interface StatCarouselProps {
  cards: Array<{
    title: string;
    value: string;
    icon: any;
    trend: 'up' | 'down' | 'stable';
    trendValue?: string;
  }>;
  isDark: boolean;
  accentColor: string;
  pageWidth: number;
}

function StatCarousel({ cards, isDark, accentColor, pageWidth }: StatCarouselProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const GAP = 12;
  const totalPages = Math.ceil(cards.length / 2);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (pageWidth + GAP));
    setActiveIndex(Math.max(0, Math.min(index, totalPages - 1)));
  }, [pageWidth, totalPages]);

  // Group cards into pairs
  const pages: typeof cards[] = [];
  for (let i = 0; i < cards.length; i += 2) {
    pages.push(cards.slice(i, i + 2));
  }

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={pageWidth + GAP}
        snapToAlignment="start"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ gap: GAP }}
      >
        {pages.map((page, pageIndex) => (
          <View key={pageIndex} style={{ width: pageWidth, flexDirection: 'row', gap: 10 }}>
            {page.map((card, cardIndex) => (
              <View key={cardIndex} style={{ flex: 1 }}>
                <StatCardRN {...card} isDark={isDark} compact />
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
      <DotIndicator count={totalPages} activeIndex={activeIndex} accentColor={accentColor} isDark={isDark} />
    </View>
  );
}

/* ─── Product Carousel (portrait only) ────────────────────────────────── */

interface ProductCarouselProps {
  topProducts: any[];
  lowStockProducts: any[];
  isDark: boolean;
  accentColor: string;
  panelWidth: number;
}

function ProductCarousel({ topProducts, lowStockProducts, isDark, accentColor, panelWidth }: ProductCarouselProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const GAP = 12;

  const scrollToIndex = useCallback((index: number) => {
    scrollRef.current?.scrollTo({ x: index * (panelWidth + GAP), animated: true });
    setActiveIndex(index);
  }, [panelWidth]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (panelWidth + GAP));
    setActiveIndex(Math.max(0, Math.min(index, 1)));
  }, [panelWidth]);

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={panelWidth + GAP}
        snapToAlignment="start"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ gap: GAP }}
      >
        <View style={{ width: panelWidth }}>
          <TopProductsRN products={topProducts} title="Produk Terlaris Hari Ini" limit={5} isDark={isDark} />
        </View>
        <View style={{ width: panelWidth }}>
          <LowStockAlertRN products={lowStockProducts} isDark={isDark} onNavigate={() => router.push('/(owner)/products')} />
        </View>
      </ScrollView>

      {/* Controls — arrows + pill buttons */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 12 }}>
        <TouchableOpacity
          onPress={() => scrollToIndex(0)}
          disabled={activeIndex === 0}
          style={{
            width: 28, height: 28, borderRadius: 999,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: isDark ? '#292524' : '#e7e5e4',
            opacity: activeIndex === 0 ? 0.35 : 1,
          }}
        >
          <ChevronLeft size={14} color={isDark ? '#d6d3d1' : '#44403c'} />
        </TouchableOpacity>

        {['Produk Terlaris', 'Peringatan Stok'].map((label, i) => (
          <TouchableOpacity
            key={label}
            onPress={() => scrollToIndex(i)}
            style={{
              paddingHorizontal: 14, paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: i === activeIndex ? accentColor : (isDark ? '#292524' : '#e7e5e4'),
            }}
          >
            <Text style={{
              fontSize: 11, fontWeight: '700',
              color: i === activeIndex ? '#fff' : (isDark ? '#78716c' : '#475569'),
            }}>{label}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          onPress={() => scrollToIndex(1)}
          disabled={activeIndex === 1}
          style={{
            width: 28, height: 28, borderRadius: 999,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: isDark ? '#292524' : '#e7e5e4',
            opacity: activeIndex === 1 ? 0.35 : 1,
          }}
        >
          <ChevronRight size={14} color={isDark ? '#d6d3d1' : '#44403c'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ─── Quick Actions Grid (4x2 = 8 slots) ────────────────────────────────── */

interface QuickActionItem {
  id: string;
  label: string;
  route?: string;
  icon: any;
  color: string;
  isMore?: boolean;
}

function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function QuickActionsGrid({ isDark }: { isDark: boolean }) {
  const quickActions: QuickActionItem[] = [
    { id: 'transactions', label: 'Riwayat', route: '/(owner)/transactions', icon: Receipt, color: '#06b6d4' },
    { id: 'shifts', label: 'Shift', route: '/(owner)/shifts', icon: ClipboardList, color: '#6366f1' },
    { id: 'users', label: 'Kasir', route: '/(owner)/users', icon: UserCheck, color: '#ec4899' },
    { id: 'insights', label: 'Insights', route: '/(owner)/insights', icon: BrainCircuit, color: '#8b5cf6' },
    { id: 'inventory', label: 'Inventory', route: '/(owner)/inventory', icon: Layers, color: '#3b82f6' },
    { id: 'members', label: 'Members', route: '/(owner)/members', icon: Users, color: '#10b981' },
    { id: 'waste-log', label: 'Waste Log', route: '/(owner)/waste-log', icon: Trash2, color: '#ef4444' },
    { id: 'all-menu', label: 'Lihat Semua', route: '/(owner)/all-menu', icon: MoreHorizontal, color: isDark ? '#94a3b8' : '#64748b', isMore: true },
  ];

  return (
    <View style={{ gap: 8 }}>
      <SectionLabel isDark={isDark}>Quick Actions</SectionLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 6 }}>
        {quickActions.map((action) => {
          const IconComponent = action.icon;
          const badgeBg = action.isMore
            ? (isDark ? 'rgba(148, 163, 184, 0.18)' : 'rgba(100, 116, 139, 0.1)')
            : hexToRgba(action.color, isDark ? 0.18 : 0.08);

          return (
            <TouchableOpacity
              key={action.id}
              onPress={() => {
                if (action.route) {
                  router.push(action.route as any);
                }
              }}
              activeOpacity={0.7}
              style={{
                width: '23.5%',
                backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                borderWidth: 1,
                borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
                borderRadius: 16,
                paddingVertical: 10,
                paddingHorizontal: 4,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: action.color,
                shadowOpacity: isDark ? 0.35 : 0.12,
                shadowOffset: { width: 0, height: 4 },
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              {/* Squircle badge */}
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 15,
                  backgroundColor: badgeBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 6,
                }}
              >
                <IconComponent
                  size={18}
                  color={action.color}
                  strokeWidth={2}
                />
              </View>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 9.5,
                  fontWeight: '700',
                  color: isDark ? '#ffffff' : '#0f172a',
                  textAlign: 'center',
                  lineHeight: 12,
                }}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

/* ─── Dashboard ────────────────────────────────────────────────────────── */

export default function OwnerDashboard() {
  const { products, transactions, customers, wasteLogs, settings, transactionsCacheFrom, transactionsCacheTo } = useApp();
  const {
    metrics, topProductsToday, rawData, chartData,
    isLoading, error, isCovered,
    preset, setPreset, refetch
  } = useDashboardMetrics(products, transactions, customers, wasteLogs, transactionsCacheFrom, transactionsCacheTo);
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscape = windowWidth > windowHeight;
  const { user } = useAuth();

  const now = new Date();
  const [chartDate, setChartDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [remoteChartData, setRemoteChartData] = useState<any[] | null>(null);
  const [remoteTopProducts, setRemoteTopProducts] = useState<any[] | null>(null);

  React.useEffect(() => {
    const fetchChartData = async () => {
      try {
        const y = chartDate.getFullYear();
        const m = String(chartDate.getMonth() + 1).padStart(2, '0');
        const dim = new Date(y, chartDate.getMonth() + 1, 0).getDate();
        const startStr = `${y}-${m}-01`;
        const endStr = `${y}-${m}-${String(dim).padStart(2, '0')}`;
        
        const res = await appApi.get<any>(`/reports/dashboard?from=${startStr}&to=${endStr}&granularity=day`);
        setRemoteChartData(res.chartData);
        setRemoteTopProducts(res.topProducts);
      } catch (err) {
        console.error('Failed to fetch chart data:', err);
      }
    };
    fetchChartData();
  }, [chartDate]);

  const [showAllMenuModal, setShowAllMenuModal] = useState(false);

  // Sidebar context
  const { openSidebar, toggleSidebar, sidebarWidth, isSidebarOpen } = useContext(SidebarContext);

  // Device type: tablet if shortest side >= 600
  const shortSide = Math.min(windowWidth, windowHeight);
  const isTablet = shortSide >= 600;

  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Jakarta',
  }).format(new Date());

  const accentColor = isDark ? '#f59e0b' : '#0d9488';
  const contentPadding = 16;
  const availableWidth = windowWidth - contentPadding * 2 - sidebarWidth;

  const statCardsData = [
    {
      title: 'Pendapatan Hari Ini',
      value: formatRupiah(metrics?.todayRevenue || 0),
      icon: DollarSign,
      trend: ((metrics?.revenueChange || 0) >= 0 ? 'up' : 'down') as 'up' | 'down',
      trendValue: `${(metrics?.revenueChange || 0) >= 0 ? '+' : ''}${metrics?.revenueChange || 0}%`,
    },
    {
      title: 'Transaksi',
      value: String(metrics?.currentTransactionCount || 0),
      icon: ShoppingCart,
      trend: ((metrics?.transactionChange || 0) >= 0 ? 'up' : 'down') as 'up' | 'down',
      trendValue: `${(metrics?.transactionChange || 0) >= 0 ? '+' : ''}${metrics?.transactionChange || 0}%`,
    },
    {
      title: 'Pelanggan Baru',
      value: metrics?.newCustomersAvailable === false ? 'N/A' : String(metrics?.newCustomers || 0),
      icon: Users,
      trend: ((metrics?.newCustomers || 0) > 0 ? 'up' : 'stable') as 'up' | 'down' | 'stable',
      trendValue: (metrics?.newCustomers || 0) > 0 ? `+${metrics?.newCustomers}` : '0',
    },
    {
      title: 'Rata-rata Tiket',
      value: formatRupiah(metrics?.avgTicket || 0),
      icon: TrendingUp,
      trend: ((metrics?.avgTicket || 0) > 30000 ? 'up' : 'stable') as 'up' | 'down' | 'stable',
    },
  ];

  const perfMetrics = [
    { label: 'Rata-rata Pesanan', value: formatRupiah(Math.round(metrics?.avgTicket || 0)) },
    { label: 'Tingkat Konversi', value: `${Math.round(((metrics?.currentTransactionCount || 0) / Math.max((metrics?.currentTransactionCount || 0) * 3, 1)) * 100)}%` },
    { label: 'Retensi Pelanggan', value: `${Math.min(85 + (metrics?.newCustomers || 0), 99)}%` },
    { label: 'Perputaran Inventaris', value: `${Math.round(((metrics?.currentRevenue || 0) / Math.max(metrics?.stockValue || 1, 1)) * 30)} hari` },
  ];

  const lowStockAll = [...(metrics?.lowStockProducts || []), ...(metrics?.outOfStockProducts || [])];


  // ── Landscape layout dimensions ──
  const landscapeGap = 12;
  const topInset = isLandscape ? 4 : Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0, 10);

  return (
    <View
      style={{ flex: 1, backgroundColor: isDark ? '#0f0f0f' : '#f8fafc', paddingTop: topInset }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: contentPadding,
          paddingTop: 12,
          paddingBottom: !isLandscape ? 85 + insets.bottom : insets.bottom + 24,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={{
          borderRadius: 16, padding: 20,
          backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
          borderWidth: 1, borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
          shadowColor: accentColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.35 : 0.08,
          shadowRadius: 10,
          elevation: 4,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', flex: 1, gap: 12 }}>
              {/* Hamburger / Sidebar toggle button — only in landscape when sidebar closed */}
              {isLandscape && !isSidebarOpen && (
                <TouchableOpacity
                  onPress={toggleSidebar}
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    backgroundColor: isDark ? '#252525' : '#f1f5f9',
                    borderWidth: 1, borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
                    alignItems: 'center', justifyContent: 'center',
                    marginTop: 2,
                  }}
                >
                  <Menu size={18} color={isDark ? '#d6d3d1' : '#475569'} strokeWidth={2} />
                </TouchableOpacity>
              )}

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 24, fontWeight: '900' }}>
                  <Text style={{ color: accentColor }}>Dashboard </Text>
                  <Text style={{ color: isDark ? '#ffffff' : '#0f172a' }}>Bisnis</Text>
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#78716c' : '#475569', marginTop: 4 }}>
                  {formattedDate}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <BranchSelectorHeader />
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 4,
                paddingHorizontal: 12, paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: isCovered ? (isDark ? '#292524' : '#fef3c7') : (isDark ? '#1e3a8a' : '#dbeafe'),
              }}>
                <Zap size={12} color={isCovered ? "#f59e0b" : "#3b82f6"} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: isCovered ? "#f59e0b" : "#3b82f6" }}>
                  {isCovered ? 'Live Cache' : 'Data Server'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {isLoading ? (
          <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={accentColor} />
            <Text style={{ color: isDark ? '#a8a29e' : '#64748b', marginTop: 12 }}>Memuat data server...</Text>
          </View>
        ) : error ? (
          <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#ef4444', textAlign: 'center', marginBottom: 16 }}>{error}</Text>
            <TouchableOpacity
              onPress={refetch}
              style={{
                backgroundColor: accentColor, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Coba Lagi</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ── 1. Statistik Utama — Carousel (2 cards per page) ── */}
        <View>
          <SectionLabel isDark={isDark}>Statistik Utama</SectionLabel>
          <StatCarousel
            cards={statCardsData}
            isDark={isDark}
            accentColor={accentColor}
            pageWidth={availableWidth}
          />
        </View>

        {/* ── Quick Actions Grid (8 items: 4x2) ── */}
        {!isLandscape && <QuickActionsGrid isDark={isDark} />}

        {/* ── 2. Tren Pendapatan + Layout varies by device/orientation ── */}
        {isLandscape ? (
          isTablet ? (
            /* ═══ TABLET LANDSCAPE ═══
               Chart full-width, then 3 info cards, then Produk Terlaris & Peringatan Stok side-by-side */
            <>
              {/* Chart — full width */}
              <View>
                <SectionLabel isDark={isDark}>Tren Pendapatan</SectionLabel>
                <ProfitChartRN
                  transactions={rawData.transactions}
                  isDark={isDark}
                  containerWidth={availableWidth}
                  remoteChartData={remoteChartData}
                  selectedDate={chartDate}
                  onPrevMonth={() => setChartDate(new Date(chartDate.getFullYear(), chartDate.getMonth() - 1, 1))}
                  onNextMonth={() => setChartDate(new Date(chartDate.getFullYear(), chartDate.getMonth() + 1, 1))}
                />
              </View>

              {/* 3 Info Cards row */}
              <View>
                <SectionLabel isDark={isDark}>Ringkasan Stok & Margin</SectionLabel>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <InfoCard
                    variant="stock-warning"
                    value={metrics?.lowStockProducts?.length || 0}
                    isDark={isDark}
                  />
                  <InfoCard
                    variant="out-of-stock"
                    value={metrics?.outOfStockProducts?.length || 0}
                    isDark={isDark}
                  />
                  <InfoCard
                    variant="margin"
                    value={metrics?.profitMargin || 0}
                    isDark={isDark}
                  />
                </View>
              </View>

              {/* Produk Terlaris & Peringatan Stok side-by-side */}
              <View style={{ flexDirection: 'row', gap: landscapeGap }}>
                <View style={{ flex: 1 }}>
                  <SectionLabel isDark={isDark}>Produk Terlaris</SectionLabel>
                  <TopProductsRN
                    products={topProductsToday}
                    title="Produk Terlaris Hari Ini"
                    limit={5}
                    isDark={isDark}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <SectionLabel isDark={isDark}>Peringatan Stok</SectionLabel>
                  <LowStockAlertRN
                    products={lowStockAll}
                    isDark={isDark}
                    onNavigate={() => router.push('/(owner)/products')}
                  />
                </View>
              </View>
            </>
          ) : (
            /* ═══ HP LANDSCAPE ═══
               Chart full-width, then Produk Terlaris & Peringatan Stok 1:1 below */
            <>
              {/* Chart — full width */}
              <View>
                <SectionLabel isDark={isDark}>Tren Pendapatan</SectionLabel>
                <ProfitChartRN
                  transactions={rawData.transactions}
                  isDark={isDark}
                  containerWidth={availableWidth}
                  remoteChartData={remoteChartData}
                  selectedDate={chartDate}
                  onPrevMonth={() => setChartDate(new Date(chartDate.getFullYear(), chartDate.getMonth() - 1, 1))}
                  onNextMonth={() => setChartDate(new Date(chartDate.getFullYear(), chartDate.getMonth() + 1, 1))}
                />
              </View>

              {/* Produk Terlaris & Peringatan Stok 1:1 */}
              <View style={{ flexDirection: 'row', gap: landscapeGap }}>
                <View style={{ flex: 1 }}>
                  <SectionLabel isDark={isDark}>Produk Terlaris</SectionLabel>
                  <TopProductsRN
                    products={topProductsToday}
                    title="Produk Terlaris Hari Ini"
                    limit={5}
                    isDark={isDark}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <SectionLabel isDark={isDark}>Peringatan Stok</SectionLabel>
                  <LowStockAlertRN
                    products={lowStockAll}
                    isDark={isDark}
                    onNavigate={() => router.push('/(owner)/products')}
                  />
                </View>
              </View>
            </>
          )
        ) : (
          /* ═══ PORTRAIT ═══
             Chart full width, then carousel below */
          <>
            <View>
              <SectionLabel isDark={isDark}>Tren Pendapatan</SectionLabel>
              <ProfitChartRN
                transactions={transactions}
                isDark={isDark}
                containerWidth={availableWidth}
                remoteChartData={remoteChartData}
                selectedDate={chartDate}
                onPrevMonth={() => setChartDate(new Date(chartDate.getFullYear(), chartDate.getMonth() - 1, 1))}
                onNextMonth={() => setChartDate(new Date(chartDate.getFullYear(), chartDate.getMonth() + 1, 1))}
              />
            </View>

            {/* ── 3. Ringkasan Cepat ── */}
            <View>
              <SectionLabel isDark={isDark}>Ringkasan Cepat</SectionLabel>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[
                  { label: 'Produk', value: String(metrics?.totalProducts ?? 0) },
                  { label: 'Margin', value: `${metrics?.profitMargin ?? 0}%` },
                  { label: 'Sukses', value: `${metrics?.successRate ?? 0}%` },
                ].map(item => (
                  <View key={item.label} style={{
                    flex: 1, padding: 14, borderRadius: 16,
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

            {/* ── 4. Produk & Inventaris — Carousel ── */}
            <View>
              <SectionLabel isDark={isDark}>Produk & Inventaris</SectionLabel>
              <ProductCarousel
                topProducts={topProductsToday}
                lowStockProducts={lowStockAll}
                isDark={isDark}
                accentColor={accentColor}
                panelWidth={availableWidth}
              />
            </View>
          </>
        )}

        {/* ── Ringkasan Cepat (landscape only — after main layout) ── */}
        {isLandscape && (
          <View>
            <SectionLabel isDark={isDark}>Ringkasan Cepat</SectionLabel>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { label: 'Produk', value: String(metrics?.totalProducts ?? 0) },
                { label: 'Margin', value: `${metrics?.profitMargin ?? 0}%` },
                { label: 'Sukses', value: `${metrics?.successRate ?? 0}%` },
              ].map(item => (
                <View key={item.label} style={{
                  flex: 1, padding: 14, borderRadius: 16,
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
        )}

        {/* ── 5. Wawasan Kinerja — Grid 2×2 ── */}
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
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {perfMetrics.slice(0, 2).map(metric => (
                <View key={metric.label} style={{
                  flex: 1, padding: 14, borderRadius: 14,
                  backgroundColor: isDark ? '#252525' : '#ffffff',
                }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#a8a29e' : '#475569' }}>
                    {metric.label}
                  </Text>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: isDark ? '#fff' : '#0f172a', marginTop: 4 }}
                    numberOfLines={1} adjustsFontSizeToFit>
                    {metric.value}
                  </Text>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {perfMetrics.slice(2, 4).map(metric => (
                <View key={metric.label} style={{
                  flex: 1, padding: 14, borderRadius: 14,
                  backgroundColor: isDark ? '#252525' : '#ffffff',
                }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#a8a29e' : '#475569' }}>
                    {metric.label}
                  </Text>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: isDark ? '#fff' : '#0f172a', marginTop: 4 }}
                    numberOfLines={1} adjustsFontSizeToFit>
                    {metric.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
