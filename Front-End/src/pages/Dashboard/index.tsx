// src/pages/Dashboard/index.tsx
import React, { useRef, useState, useEffect } from 'react';
import {
  DollarSign, ShoppingCart, Users, TrendingUp,
  Package, AlertCircle, BarChart3, Zap, Shield,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics';
import StatCard from '../../components/dashboard/StatCard';
import TopProducts from '../../components/dashboard/TopProducts';
import LowStockAlert from '../../components/dashboard/LowStockAlert';
import StockAlertIndicator from '../../components/dashboard/StockAlertIndicator';
import ProfitChart from '../../components/dashboard/ProfitChart';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';
import { useApp } from '../../contexts/AppContext';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import { Skeleton, SkeletonCard } from '../../components/common/Skeleton';

// ─── Hook ─────────────────────────────────────────────────────────────────────

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false,
  );
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return isMobile;
};

// ─── Snap Carousel ────────────────────────────────────────────────────────────
// Generic horizontal snap carousel with dot indicators.

interface SnapCarouselProps {
  children: React.ReactNode[];
  cardWidthVw?: number; // e.g. 80 → "80vw"
  gap?: number;         // px
  isDark: boolean;
  /** accent color for active dot (defaults to amber) */
  accentColor?: string;
  /** show prev/next arrow buttons */
  showArrows?: boolean;
  /** compact dots (no label) */
  className?: string;
}

function SnapCarousel({
  children,
  cardWidthVw = 80,
  gap = 12,
  isDark,
  accentColor = isDark ? '#f59e0b' : '#0d9488',
  showArrows = false,
  className = '',
}: SnapCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const count = children.length;

  const scrollTo = (index: number) => {
    if (!trackRef.current) return;
    const vw = trackRef.current.clientWidth;
    const cardPx = (vw * cardWidthVw) / 100 + gap;
    trackRef.current.scrollTo({ left: index * cardPx, behavior: 'smooth' });
    setActiveIndex(index);
  };

  const handleScroll = () => {
    if (!trackRef.current) return;
    const vw = trackRef.current.clientWidth;
    const cardPx = (vw * cardWidthVw) / 100 + gap;
    const idx = Math.round(trackRef.current.scrollLeft / cardPx);
    setActiveIndex(Math.max(0, Math.min(idx, count - 1)));
  };

  return (
    <div className={className}>
      {/* Track */}
      <div
        ref={trackRef}
        onScroll={handleScroll}
        style={{
          display: 'flex',
          gap,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          paddingBottom: 4,
        }}
      >
        {children.map((child, i) => (
          <div
            key={i}
            style={{
              flexShrink: 0,
              width: `${cardWidthVw}vw`,
              scrollSnapAlign: 'start',
            }}
          >
            {child}
          </div>
        ))}
        {/* trailing spacer */}
        <div style={{ flexShrink: 0, width: gap }} />
      </div>

      {/* Controls */}
      {count > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 }}>
          {showArrows && (
            <button
              onClick={() => scrollTo(Math.max(0, activeIndex - 1))}
              disabled={activeIndex === 0}
              style={{
                width: 26, height: 26, borderRadius: 999, border: 'none', padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: activeIndex === 0 ? 'default' : 'pointer',
                background: isDark ? '#292524' : '#e7e5e4',
                color: isDark ? '#d6d3d1' : '#44403c',
                opacity: activeIndex === 0 ? 0.3 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              <ChevronLeft size={13} />
            </button>
          )}

          {children.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              style={{
                width: i === activeIndex ? 20 : 6,
                height: 6,
                borderRadius: 999,
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                transition: 'all 0.25s',
                background: i === activeIndex ? accentColor : (isDark ? '#44403c' : '#cbd5e1'),
              }}
            />
          ))}

          {showArrows && (
            <button
              onClick={() => scrollTo(Math.min(count - 1, activeIndex + 1))}
              disabled={activeIndex === count - 1}
              style={{
                width: 26, height: 26, borderRadius: 999, border: 'none', padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: activeIndex === count - 1 ? 'default' : 'pointer',
                background: isDark ? '#292524' : '#e7e5e4',
                color: isDark ? '#d6d3d1' : '#44403c',
                opacity: activeIndex === count - 1 ? 0.3 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              <ChevronRight size={13} />
            </button>
          )}
        </div>
      )}

      <style>{`div::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────

function SectionLabel({ children, isDark }: { children: React.ReactNode; isDark: boolean }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: isDark ? '#78716c' : '#475569',
      marginBottom: 8,
    }}>
      {children}
    </p>
  );
}

// ─── Header Badge ─────────────────────────────────────────────────────────────

const HeaderBadge = ({ children, isDark, type = 'info' }: {
  children: React.ReactNode; isDark: boolean; type?: 'info' | 'success' | 'warning';
}) => {
  const typeClasses = {
    info: isDark ? 'bg-stone-800 text-amber-400' : 'bg-teal-50 text-teal-700',
    success: isDark ? 'bg-stone-800 text-green-400' : 'bg-green-100 text-green-700',
    warning: isDark ? 'bg-stone-800 text-orange-400' : 'bg-orange-100 text-orange-700',
  };
  return (
    <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 ${typeClasses[type]}`}>
      {children}
    </div>
  );
};

// ─── Performance metric helper ────────────────────────────────────────────────

function PerfMetric({ label, value, isDark }: { label: string; value: string; isDark: boolean }) {
  return (
    <div className={`p-4 rounded-2xl ${isDark ? 'bg-stone-800/50' : 'bg-white shadow-sm'}`}>
      <p className={`text-sm ${isDark ? 'text-stone-300' : 'text-[#334155] font-semibold'}`}>{label}</p>
      <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}

// ─── Product Panel Carousel ──────────────────────────────────────────────────

interface ProductPanelCarouselProps {
  topProducts: any;
  lowStockProducts: any;
  isDark: boolean;
}

function ProductPanelCarousel({ topProducts, lowStockProducts, isDark }: ProductPanelCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const GAP = 12;

  const scrollTo = (index: number) => {
    if (!scrollRef.current) return;
    const cardPx = scrollRef.current.clientWidth * 0.85 + GAP;
    scrollRef.current.scrollTo({ left: index * cardPx, behavior: 'smooth' });
    setActiveIndex(index);
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const cardPx = scrollRef.current.clientWidth * 0.85 + GAP;
    const newIndex = Math.round(scrollRef.current.scrollLeft / cardPx);
    setActiveIndex(Math.max(0, Math.min(newIndex, 1)));
  };

  const panels = [
    {
      key: 'top',
      label: 'Produk Terlaris',
      content: <TopProducts products={topProducts} title="Produk Terlaris Hari Ini" limit={5} />,
    },
    {
      key: 'alert',
      label: 'Peringatan Stok',
      content: <LowStockAlert products={lowStockProducts} />,
    },
  ];

  return (
    <div>
      {/* Scroll track */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          display: 'flex',
          gap: GAP,
          alignItems: 'stretch',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          paddingBottom: 2,
          paddingRight: 16,
        }}
      >
        {panels.map((panel) => (
          <div
            key={panel.key}
            style={{
              scrollSnapAlign: 'start',
              flexShrink: 0,
              width: 'calc(85vw)',
            }}
            className="flex flex-col [&>div]:h-full [&>div]:flex-1"
          >
            {panel.content}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 10, marginTop: 12,
      }}>
        <button
          onClick={() => scrollTo(0)}
          disabled={activeIndex === 0}
          style={{
            width: 28, height: 28, borderRadius: 999, border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: activeIndex === 0 ? 'default' : 'pointer',
            background: isDark ? '#292524' : '#e7e5e4',
            color: isDark ? '#d6d3d1' : '#44403c',
            opacity: activeIndex === 0 ? 0.35 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          <ChevronLeft size={14} />
        </button>

        {panels.map((panel, i) => (
          <button
            key={panel.key}
            onClick={() => scrollTo(i)}
            style={{
              padding: '4px 12px', borderRadius: 999, border: 'none',
              cursor: 'pointer', fontSize: 11, fontWeight: 600,
              transition: 'all 0.2s',
              background: i === activeIndex ? (isDark ? '#f59e0b' : '#0d9488') : (isDark ? '#292524' : '#e7e5e4'),
              color: i === activeIndex ? '#fff' : (isDark ? '#78716c' : '#475569'),
            }}
          >
            {panel.label}
          </button>
        ))}

        <button
          onClick={() => scrollTo(1)}
          disabled={activeIndex === 1}
          style={{
            width: 28, height: 28, borderRadius: 999, border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: activeIndex === 1 ? 'default' : 'pointer',
            background: isDark ? '#292524' : '#e7e5e4',
            color: isDark ? '#d6d3d1' : '#44403c',
            opacity: activeIndex === 1 ? 0.35 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { theme } = useTheme();
  const { isServiceLoading, transactions } = useApp();
  const { metrics, topProductsToday, rawData } = useDashboardMetrics();
  const isDark = theme === 'dark';
  const isMobile = useIsMobile();
  const { format } = useCurrencyFormatter();
  const { formatDate } = useDateFormatter();

  const formattedDate = formatDate(new Date());

  // ── Full-page Skeleton ────────────────────────────────────────────────────
  if (isServiceLoading && transactions.length === 0) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <SkeletonCard>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <Skeleton className="h-8 w-56 mb-2" rounded="rounded-lg" />
              <Skeleton className="h-4 w-40" rounded="rounded-lg" />
            </div>
            <Skeleton className="h-8 w-24" rounded="rounded-full" />
          </div>
        </SkeletonCard>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i}>
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-4 w-24" rounded="rounded-lg" />
                <Skeleton className="h-10 w-10" rounded="rounded-full" />
              </div>
              <Skeleton className="h-8 w-32 mb-2" rounded="rounded-lg" />
              <Skeleton className="h-3 w-16" rounded="rounded-full" />
            </SkeletonCard>
          ))}
        </div>
      </div>
    );
  }

  // ── MOBILE LAYOUT ─────────────────────────────────────────────────────────
  if (isMobile) {
    const mainStatCards = [
      <StatCard title="Pendapatan Hari Ini" value={format(metrics.todayRevenue)} icon={DollarSign} trend={metrics.revenueChange >= 0 ? 'up' : 'down'} gradient="from-green-500 to-emerald-500" delay="0" />,
      <StatCard title="Transaksi" value={metrics.todayTransactionCount} icon={ShoppingCart} trend={metrics.transactionChange >= 0 ? 'up' : 'down'} gradient={isDark ? "from-amber-500 to-cyan-500" : "from-teal-500 to-cyan-500"} delay="0" />,
      <StatCard title="Pelanggan Baru" value={metrics.newCustomers} icon={Users} trend={metrics.newCustomers > 0 ? 'up' : 'stable'} gradient="from-purple-500 to-violet-500" delay="0" />,
      <StatCard title="Rata-rata Tiket" value={format(metrics.avgTicket)} icon={TrendingUp} trend={metrics.avgTicket > 30000 ? 'up' : 'stable'} gradient={isDark ? "from-amber-500 to-orange-500" : "from-teal-500 to-emerald-500"} delay="0" />,
    ];

    const perfMetrics = [
      <PerfMetric label="Rata-rata Nilai Pesanan" value={format(Math.round(metrics.avgTicket))} isDark={isDark} />,
      <PerfMetric label="Tingkat Konversi" value={`${Math.round((metrics.todayTransactionCount / Math.max(metrics.todayTransactionCount * 3, 1)) * 100)}%`} isDark={isDark} />,
      <PerfMetric label="Retensi Pelanggan" value={`${Math.min(85 + metrics.newCustomers, 99)}%`} isDark={isDark} />,
      <PerfMetric label="Perputaran Inventaris" value={`${Math.round((metrics.todayRevenue / Math.max(metrics.stockValue, 1)) * 30)} hari`} isDark={isDark} />,
    ];

    return (
      <div className="space-y-5 animate-in fade-in duration-500 pb-8">

        {/* ── Header ── */}
        <div className={`rounded-2xl p-5 ${isDark
          ? 'bg-gradient-to-r from-stone-900 to-stone-900 border border-stone-800'
          : 'bg-gradient-to-r from-white to-gray-50 border border-[#CBD5E1]'
        } shadow-sm`}>
          <div className="flex justify-between items-start">
            <div>
              <h1 className={`text-2xl font-black tracking-tight bg-gradient-to-r ${isDark ? 'from-amber-500 to-orange-500' : 'from-teal-600 to-emerald-600'} bg-clip-text text-transparent`}>
                Dashboard <span className={isDark ? 'text-white' : 'text-gray-900'}>Bisnis</span>
              </h1>
              <p className={`text-xs mt-1 ${isDark ? 'text-stone-400' : 'text-[#475569] font-semibold'}`}>
                {formattedDate}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <HeaderBadge isDark={isDark} type="warning">
                <Zap className="w-3 h-3" /> Live
              </HeaderBadge>
            </div>
          </div>
        </div>


        {/* ── 1. Stat Cards — carousel ── */}
        <div>
          <SectionLabel isDark={isDark}>Statistik Utama</SectionLabel>
          <SnapCarousel isDark={isDark} cardWidthVw={80} accentColor={isDark ? "#f59e0b" : "#0d9488"}>
            {mainStatCards}
          </SnapCarousel>
        </div>

        {/* ── 2. Grafik — full width ── */}
        <div>
          <SectionLabel isDark={isDark}>Tren Pendapatan</SectionLabel>
          <ProfitChart transactions={rawData.transactions} />
        </div>

        {/* ── 3. Quick Stats — compact inline row ── */}
        <div>
          <SectionLabel isDark={isDark}>Ringkasan Cepat</SectionLabel>
          <div className="grid grid-cols-3 gap-2">
            <div className={`p-3 rounded-2xl text-center ${isDark ? 'bg-stone-900 border border-stone-800' : 'bg-white border border-gray-100 shadow-sm'}`}>
              <p className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{metrics.totalProducts}</p>
              <p className={`text-[10px] font-bold mt-0.5 ${isDark ? 'text-stone-500' : 'text-[#475569]'}`}>Produk</p>
            </div>
            <div className={`p-3 rounded-2xl text-center ${isDark ? 'bg-stone-900 border border-stone-800' : 'bg-white border border-gray-100 shadow-sm'}`}>
              <p className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{metrics.profitMargin}%</p>
              <p className={`text-[10px] font-bold mt-0.5 ${isDark ? 'text-stone-500' : 'text-[#475569]'}`}>Margin</p>
            </div>
            <div className={`p-3 rounded-2xl text-center ${isDark ? 'bg-stone-900 border border-stone-800' : 'bg-white border border-gray-100 shadow-sm'}`}>
              <p className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{metrics.successRate}%</p>
              <p className={`text-[10px] font-bold mt-0.5 ${isDark ? 'text-stone-500' : 'text-[#475569]'}`}>Sukses</p>
            </div>
          </div>
        </div>

        {/* ── 4. Produk & Inventaris — carousel ── */}
        <div>
          <SectionLabel isDark={isDark}>Produk & Inventaris</SectionLabel>
          <ProductPanelCarousel
            topProducts={topProductsToday}
            lowStockProducts={[...metrics.lowStockProducts, ...metrics.outOfStockProducts]}
            isDark={isDark}
          />
        </div>

        {/* ── 5. Wawasan Kinerja — carousel ── */}
        <div className={`p-4 rounded-2xl ${isDark
          ? 'bg-gradient-to-r from-stone-900 to-stone-900 border border-stone-800'
          : `bg-gradient-to-r ${isDark ? 'from-stone-900 to-stone-900' : 'from-teal-50 to-indigo-50'} border ${isDark ? 'border-stone-800' : 'border-teal-100'}`
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Wawasan Kinerja
            </h3>
            <TrendingUp className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
          </div>
          <SnapCarousel isDark={isDark} cardWidthVw={60} accentColor="#7c3aed">
            {perfMetrics}
          </SnapCarousel>
        </div>

      </div>
    );
  }

  // ── DESKTOP LAYOUT (unchanged) ────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className={`rounded-2xl p-6 ${isDark
        ? 'bg-gradient-to-r from-stone-900 to-stone-900 border border-stone-800'
        : 'bg-gradient-to-r from-white to-gray-50 border border-gray-100'
      } shadow-sm`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className={`text-3xl font-black tracking-tight bg-gradient-to-r ${isDark ? 'from-amber-500 to-orange-500' : 'from-teal-600 to-emerald-600'} bg-clip-text text-transparent`}>
              Dashboard <span className={isDark ? 'text-white' : 'text-gray-900'}>Bisnis</span>
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-stone-400' : 'text-[#475569] font-semibold'}`}>
              {formattedDate}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <HeaderBadge isDark={isDark} type="warning">
              <Zap className="w-3 h-3" /> Real-time
            </HeaderBadge>
          </div>
        </div>
      </div>

      {/* Grid Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Pendapatan Hari Ini" value={format(metrics.todayRevenue)} icon={DollarSign} trend={metrics.revenueChange >= 0 ? 'up' : 'down'} gradient="from-green-500 to-emerald-500" delay="100" />
        <StatCard title="Transaksi" value={metrics.todayTransactionCount} icon={ShoppingCart} trend={metrics.transactionChange >= 0 ? 'up' : 'down'} gradient={isDark ? "from-amber-500 to-cyan-500" : "from-teal-500 to-cyan-500"} delay="200" />
        <StatCard title="Pelanggan Baru" value={metrics.newCustomers} icon={Users} trend={metrics.newCustomers > 0 ? 'up' : 'stable'} gradient="from-purple-500 to-violet-500" delay="300" />
        <StatCard title="Rata-rata Tiket" value={format(metrics.avgTicket)} icon={TrendingUp} trend={metrics.avgTicket > 30000 ? 'up' : 'stable'} gradient={isDark ? "from-amber-500 to-orange-500" : "from-teal-500 to-emerald-500"} delay="400" />
      </div>

      {/* Grid Konten Utama */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ProfitChart transactions={rawData.transactions} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="Peringatan Stok" value={metrics.lowStockProducts.length} icon={AlertCircle} subtitle="item perlu perhatian" gradient={isDark ? "from-orange-500 to-amber-500" : "from-orange-500 to-teal-500"} trend={metrics.lowStockProducts.length > 0 ? 'up' : 'stable'} trendValue={metrics.lowStockProducts.length > 0 ? 'Perhatian' : 'Aman'} />
            <StatCard title="Stok Habis" value={metrics.outOfStockProducts.length} icon={Package} subtitle="item tidak tersedia" gradient="from-red-500 to-pink-500" trend={metrics.outOfStockProducts.length > 0 ? 'up' : 'stable'} trendValue={metrics.outOfStockProducts.length > 0 ? 'Segera Restok' : 'Semua Tersedia'} />
            <StatCard title="Tingkat Margin" value={`${metrics.profitMargin}%`} icon={BarChart3} subtitle="margin keuntungan" gradient={isDark ? "from-amber-500 to-indigo-500" : "from-teal-500 to-indigo-500"} trend={metrics.profitMargin > 50 ? 'up' : metrics.profitMargin > 30 ? 'stable' : 'down'} trendValue={metrics.profitMargin > 50 ? 'Tinggi' : 'Normal'} />
          </div>
        </div>
        <div className="space-y-6">
          <LowStockAlert products={[...metrics.lowStockProducts, ...metrics.outOfStockProducts]} />
          <TopProducts products={topProductsToday} title="Produk Terlaris Hari Ini" limit={5} />
        </div>
      </div>

      {/* Inventaris */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Produk" value={metrics.totalProducts} icon={Package} subtitle={`Dari ${metrics.categoriesCount} kategori`} gradient="from-gray-500 to-gray-700" trend="stable" />
        <StatCard title="Nilai Stok" value={format(metrics.stockValue)} icon={DollarSign} subtitle="Total nilai inventaris" gradient="from-green-500 to-teal-500" trend="stable" />
        <StatCard title="Tingkat Keberhasilan" value={`${metrics.successRate}%`} icon={Shield} subtitle="Penyelesaian transaksi" gradient="from-purple-500 to-violet-500" trend={metrics.successRate > 95 ? 'up' : 'stable'} trendValue={metrics.successRate > 95 ? 'Excellent' : 'Good'} />
      </div>

      {/* Wawasan Kinerja */}
      <div className={`p-6 rounded-2xl ${isDark
        ? 'bg-gradient-to-r from-stone-900 to-stone-900 border border-stone-800'
        : 'bg-gradient-to-r from-teal-50 to-indigo-50 border border-teal-100'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Wawasan Kinerja</h3>
          <TrendingUp className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <PerfMetric label="Rata-rata Nilai Pesanan" value={format(Math.round(metrics.avgTicket))} isDark={isDark} />
          <PerfMetric label="Tingkat Konversi" value={`${Math.round((metrics.todayTransactionCount / Math.max(metrics.todayTransactionCount * 3, 1)) * 100)}%`} isDark={isDark} />
          <PerfMetric label="Retensi Pelanggan" value={`${Math.min(85 + metrics.newCustomers, 99)}%`} isDark={isDark} />
          <PerfMetric label="Perputaran Inventaris" value={`${Math.round((metrics.todayRevenue / Math.max(metrics.stockValue, 1)) * 30)} hari`} isDark={isDark} />
        </div>
      </div>
    </div>
  );
}