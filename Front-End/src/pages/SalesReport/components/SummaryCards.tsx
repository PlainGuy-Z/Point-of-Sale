import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Receipt, Wallet } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import type { SummaryData } from '../useSalesData';

function fmt(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}jt`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}rb`;
  return String(Math.round(n));
}

function Change({ value }: { value: number }) {
  const pos = value >= 0;
  const isNeutral = value === 100;
  const Icon = pos ? TrendingUp : TrendingDown;

  if (isNeutral) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-400">
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

interface Props { summary: SummaryData }

const cardConfigs = [
  { label: 'Total Omzet', icon: DollarSign, iconBg: 'bg-amber-500/15', iconColor: 'text-amber-500' },
  { label: 'Jumlah Transaksi', icon: ShoppingCart, iconBg: 'bg-teal-500/15', iconColor: 'text-teal-400' },
  { label: 'Rata-rata Tiket', icon: Receipt, iconBg: 'bg-blue-500/15', iconColor: 'text-blue-400' },
  { label: 'Net Profit', icon: Wallet, iconBg: 'bg-green-500/15', iconColor: 'text-green-400' },
];

export default function SummaryCards({ summary }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const cards = [
    { value: `Rp ${fmt(summary.totalRevenue)}`, change: summary.revenueChange },
    { value: String(summary.totalTransactions), change: summary.transactionsChange },
    { value: `Rp ${fmt(summary.avgTicket)}`, change: summary.avgTicketChange },
    { value: `Rp ${fmt(summary.hasCostData ? summary.netProfit : summary.totalRevenue)}`, change: summary.hasCostData ? summary.profitChange : summary.revenueChange },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => {
        const cfg = cardConfigs[i];
        const IconComp = cfg.icon;
        return (
          <div
            key={cfg.label}
            className={`${isDark ? 'bg-[#1a1a1a] border-[#2e2e2e] hover:border-[#3e3e3e]' : 'bg-white border-stone-200 hover:border-stone-300'} rounded-2xl border p-5 transition-all duration-200 group`}
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div className={`w-10 h-10 rounded-xl ${cfg.iconBg} flex items-center justify-center`}>
                <IconComp size={18} className={cfg.iconColor} />
              </div>
              <span className={`text-[10px] uppercase tracking-widest ${isDark ? 'text-[#888]' : 'text-stone-500'} font-bold leading-tight`}>
                {i === 3 && !summary.hasCostData ? 'Gross Revenue' : cfg.label}
              </span>
            </div>
            <p className={`text-3xl font-black ${isDark ? 'text-white' : 'text-stone-900'} mb-2 font-mono`}>{c.value}</p>
            <Change value={c.change} />
          </div>
        );
      })}
    </div>
  );
}
