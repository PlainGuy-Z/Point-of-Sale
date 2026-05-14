import { useState, useRef, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Receipt, Wallet } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import type { SummaryData } from '../useSalesData';

function fmt(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}jt`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}rb`;
  return String(Math.round(n));
}

function Change({ value }: { value: number }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const pos = value >= 0;
  const isNeutral = value === 100;
  const Icon = pos ? TrendingUp : TrendingDown;

  if (isNeutral) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg ${isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-teal-500/15 text-teal-600'}`}>
        <Icon size={10} />
        {Math.abs(value).toFixed(1)}%
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg ${
      pos ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
    }`}>
      <Icon size={10} />
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

const useIsMobile = () => {
  const [m, setM] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  useEffect(() => {
    const h = () => setM(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return m;
};

interface Props { summary: SummaryData }

export default function SummaryCards({ summary }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const cardConfigs = [
    { label: 'Total Omzet', icon: DollarSign, iconBg: isDark ? 'bg-amber-500/15' : 'bg-teal-500/15', iconColor: isDark ? 'text-amber-500' : 'text-teal-600' },
    { label: 'Jumlah Transaksi', icon: ShoppingCart, iconBg: 'bg-teal-500/15', iconColor: 'text-teal-400' },
    { label: 'Rata-rata Tiket', icon: Receipt, iconBg: 'bg-blue-500/15', iconColor: 'text-blue-400' },
    { label: 'Net Profit', icon: Wallet, iconBg: 'bg-green-500/15', iconColor: 'text-green-400' },
  ];
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const cards = [
    { value: `Rp ${fmt(summary.totalRevenue)}`, change: summary.revenueChange },
    { value: String(summary.totalTransactions), change: summary.transactionsChange },
    { value: `Rp ${fmt(summary.avgTicket)}`, change: summary.avgTicketChange },
    { value: `Rp ${fmt(summary.hasCostData ? summary.netProfit : summary.totalRevenue)}`, change: summary.hasCostData ? summary.profitChange : summary.revenueChange },
  ];

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const cardW = 270 + 12; // min-w + gap
    const idx = Math.round(scrollRef.current.scrollLeft / cardW);
    setActiveIdx(Math.max(0, Math.min(idx, cards.length - 1)));
  };

  const renderCard = (c: typeof cards[0], i: number) => {
    const cfg = cardConfigs[i];
    const IconComp = cfg.icon;
    return (
      <div
        key={cfg.label}
        className={`${isDark ? 'bg-[#1a1a1a] border-[#2e2e2e] hover:border-[#3e3e3e]' : 'bg-white border-stone-200 hover:border-stone-300'} rounded-2xl border p-5 transition-all duration-200 group ${isMobile ? 'min-w-[260px] snap-start' : ''}`}
      >
        <div className="flex items-center gap-2.5 mb-3">
          <div className={`w-10 h-10 rounded-xl ${cfg.iconBg} flex items-center justify-center`}>
            <IconComp size={18} className={cfg.iconColor} />
          </div>
          <span className={`text-[10px] uppercase tracking-widest ${isDark ? 'text-[#888]' : 'text-stone-500'} font-bold leading-tight`}>
            {i === 3 && !summary.hasCostData ? 'Gross Revenue' : cfg.label}
          </span>
        </div>
        <p className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-black ${isDark ? 'text-white' : 'text-stone-900'} mb-2 font-mono`}>{c.value}</p>
        <Change value={c.change} />
      </div>
    );
  };

  // Mobile: horizontal snap carousel
  if (isMobile) {
    return (
      <div>
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {cards.map((c, i) => renderCard(c, i))}
          <div className="flex-shrink-0 w-3" />
        </div>
        {/* Dot indicators */}
        <div className="flex justify-center gap-1.5 mt-2">
          {cards.map((_, i) => (
            <span
              key={i}
              className="rounded-full transition-all duration-200"
              style={{
                width: i === activeIdx ? 18 : 6,
                height: 6,
                background: i === activeIdx ? (isDark ? '#f59e0b' : '#0d9488') : (isDark ? '#44403c' : '#cbd5e1'),
              }}
            />
          ))}
        </div>
        <style>{`.flex::-webkit-scrollbar{display:none}`}</style>
      </div>
    );
  }

  // Desktop: grid
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => renderCard(c, i))}
    </div>
  );
}
