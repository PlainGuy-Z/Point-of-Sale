import React, { useRef, useState } from 'react';
import { TrendingUp, TrendingDown, Package, Star, DollarSign, Calendar, BarChart3 } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import type { SummaryResponse } from '../../../services/aiApi';

interface StatCardsProps {
  summary: SummaryResponse | null;
  isLoading: boolean;
  isMobile?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRupiah(value: number): string {
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}jt`;
  if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}rb`;
  return `Rp ${value}`;
}

function TrendBadge({ value, isDark }: { value: number; isDark: boolean }) {
  const isPositive = value >= 0;
  const isNeutral = value === 0;
  
  if (isNeutral) return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
      isDark ? 'bg-stone-800 border-stone-700 text-stone-500' : 'bg-stone-100 border-stone-300 text-stone-700'
    }`}>
      0.0%
    </span>
  );

  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm ${
      isPositive
        ? (isDark ? 'bg-green-500/15 border-green-500/20 text-green-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700')
        : (isDark ? 'bg-red-500/15 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600')
    }`}>
      {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonCard({ isDark, isMobile }: { isDark: boolean; isMobile: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-5 min-h-[140px] animate-pulse transition-all ${
        isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-[#E2E8F0]'
      } ${isMobile ? 'w-[75vw] landscape:w-[40vw] lg:w-auto shrink-0 snap-start' : ''}`}
    >
      <div className={`h-3 w-24 rounded-full mb-3 ${isDark ? 'bg-stone-800' : 'bg-stone-100'}`} />
      <div className={`h-8 w-40 rounded-xl mb-4 ${isDark ? 'bg-stone-800' : 'bg-stone-100'}`} />
      <div className={`h-3 w-28 rounded-full ${isDark ? 'bg-stone-800' : 'bg-stone-100'}`} />
    </div>
  );
}

// ─── Single Card ─────────────────────────────────────────────────────────────

interface CardDef {
  label: string;
  value: string;
  sub: string;
  trend: number | null;
  accent: string;
  icon: React.ElementType;
  highlight?: boolean;
}

function StatCard({
  card,
  isDark,
  isMobile,
}: {
  card: CardDef;
  isDark: boolean;
  isMobile: boolean;
}) {
  const IconComp = card.icon;
  return (
    <div
      className={`
        relative rounded-2xl border p-5 transition-all duration-300 overflow-hidden group
        ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-[#CBD5E1] shadow-sm hover:shadow-md hover:border-teal-500'}
        ${card.highlight && !isDark ? 'border-t-2 border-t-teal-600' : ''}
        ${isMobile ? 'w-[75vw] landscape:w-[40vw] lg:w-auto shrink-0 snap-start' : ''}
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-stone-500' : 'text-[#334155]'}`}>
          {card.label}
        </span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${
          isDark ? 'bg-stone-800 border border-stone-700' : 'bg-teal-50 border border-teal-100'
        }`}>
          <IconComp size={16} className={isDark ? '' : 'text-teal-600'} style={{ color: isDark ? card.accent : undefined }} />
        </div>
      </div>

      <div className={`
        text-2xl font-bold mb-2 leading-tight
        ${card.label === 'Produk Terlaris' ? 'text-sm font-bold truncate' : 'font-mono'}
        ${isDark ? 'text-white' : 'text-[#0F172A]'}
      `}>
        {card.value}
      </div>

      <div className="flex items-center gap-2">
        {card.trend !== null ? (
          <TrendBadge value={card.trend} isDark={isDark} />
        ) : (
          <span className={`text-[10px] font-bold uppercase ${
            isDark ? 'text-stone-600' : 'text-[#475569]'
          }`}>{card.sub}</span>
        )}
      </div>
      
      {card.highlight && isDark && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-teal-500/40" />
      )}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function StatCards({ summary, isLoading, isMobile: isMobileProp }: StatCardsProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Use prop if provided, otherwise detect and listen for changes
  const [isMobileState, setIsMobileState] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );

  React.useEffect(() => {
    if (isMobileProp !== undefined) return;
    const handler = () => setIsMobileState(window.innerWidth < 1024);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [isMobileProp]);

  const isMobile = isMobileProp !== undefined ? isMobileProp : isMobileState;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const CARD_COUNT = 5;

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const cardWidth = scrollRef.current.scrollWidth / CARD_COUNT;
    setActiveIndex(Math.round(scrollLeft / cardWidth));
  };

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className={`${isMobile ? 'mb-4' : 'grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6'}`}>
        {isMobile ? (
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 no-scrollbar">
            {[1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} isDark={isDark} isMobile />)}
          </div>
        ) : (
          [1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} isDark={isDark} isMobile={false} />)
        )}
      </div>
    );
  }

  if (!summary) return null;

  const lowStockColor = summary.low_stock_count > 0 ? '#ef4444' : '#10b981';

  const cards: CardDef[] = [
    {
      label: 'Omzet Hari Ini',
      value: formatRupiah(summary.today_revenue),
      sub: `vs kemarin: ${summary.day_over_day_change_percent >= 0 ? '+' : ''}${summary.day_over_day_change_percent.toFixed(1)}%`,
      trend: summary.day_over_day_change_percent,
      accent: '#f59e0b',
      icon: DollarSign,
      highlight: true,
    },
    {
      label: 'Omzet Minggu Ini',
      value: formatRupiah(summary.this_week_revenue),
      sub: `rata-rata harian: ${formatRupiah(Math.round(summary.this_week_revenue / 7))}`,
      trend: summary.week_over_week_change_percent,
      accent: '#0d9488',
      icon: Calendar,
      highlight: true,
    },
    {
      label: 'Omzet Minggu Lalu',
      value: formatRupiah(summary.last_week_revenue),
      sub: 'TOTAL MINGGU LALU',
      trend: null,
      accent: '#6b7280',
      icon: BarChart3,
    },
    {
      label: 'Stok Rendah',
      value: String(summary.low_stock_count),
      sub: 'PERLU RESTOK SEGERA',
      trend: null,
      accent: lowStockColor,
      icon: Package,
    },
    {
      label: 'Produk Terlaris',
      value:
        summary.top_products_today.length > 20
          ? summary.top_products_today.slice(0, 20) + '…'
          : summary.top_products_today,
      sub: 'DATA HARI INI',
      trend: null,
      accent: '#7c3aed',
      icon: Star,
    },
  ];

  // ── MOBILE: snap carousel ──
  if (isMobile) {
    return (
      <div className="mb-4">
        {/* Track */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 no-scrollbar"
        >
          {cards.map((card) => (
            <StatCard key={card.label} card={card} isDark={isDark} isMobile />
          ))}
          <div className="shrink-0 w-4" />
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-1.5 mt-2">
          {cards.map((card, i) => (
            <button
              key={card.label}
              onClick={() => {
                if (!scrollRef.current) return;
                const cardWidth = scrollRef.current.scrollWidth / CARD_COUNT;
                scrollRef.current.scrollTo({ left: i * cardWidth, behavior: 'smooth' });
                setActiveIndex(i);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex 
                  ? (isDark ? 'w-5 bg-amber-500' : 'w-5 bg-teal-600') 
                  : (isDark ? 'w-1.5 bg-stone-700' : 'w-1.5 bg-stone-200')
              }`}
            />
          ))}
        </div>
        <style>{`.no-scrollbar::-webkit-scrollbar{display:none}`}</style>
      </div>
    );
  }

  // ── DESKTOP: grid ──
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {cards.map((card) => (
        <StatCard key={card.label} card={card} isDark={isDark} isMobile={false} />
      ))}
    </div>
  );
}