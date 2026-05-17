import { useState, useEffect } from 'react';
import { CreditCard, Banknote, Smartphone } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import type { ProductRank, PaymentBreakdown, CashierPerformance } from '../useSalesData';

function fmt(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}jt`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}rb`;
  return String(Math.round(n));
}

const medals = ['🥇', '🥈', '🥉'];
const payIcons: Record<string, any> = { cash: Banknote, card: CreditCard, qris: Smartphone };
const payLabels: Record<string, string> = { cash: 'Cash', card: 'Kartu', qris: 'QRIS' };

const useIsMobile = () => {
  const [m, setM] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  useEffect(() => {
    const h = () => setM(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return m;
};

interface Props {
  topProducts: ProductRank[];
  paymentBreakdown: PaymentBreakdown[];
  cashierPerformance: CashierPerformance[];
}

export default function DetailTabs({ topProducts, paymentBreakdown, cashierPerformance }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<'products' | 'payment' | 'cashier'>('products');

  const tabs = [
    { key: 'products' as const, label: 'Produk Terlaris' },
    { key: 'payment' as const, label: 'Metode Bayar' },
    { key: 'cashier' as const, label: 'Per Kasir' },
  ];

  const marginColor = (pct: number | null) => {
    if (pct == null) return isDark ? 'text-[#888]' : 'text-[#94A3B8]';
    if (pct > 70) return isDark ? 'text-green-400' : 'text-emerald-600';
    if (pct >= 40) return isDark ? 'text-teal-400' : 'text-teal-600';
    return isDark ? 'text-red-400' : 'text-red-500';
  };

  return (
    <div className={`${isDark ? 'bg-[#1a1a1a] border-[#2e2e2e]' : 'bg-white border-[#E2E8F0] shadow-sm'} rounded-2xl border overflow-hidden`}>
      {/* Tab bar — scrollable on mobile */}
      <div className={`border-b ${isDark ? 'border-[#2e2e2e]' : 'border-[#F1F5F9]'} px-4 md:px-6 pt-4 flex gap-0 overflow-x-auto`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 md:px-5 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              tab === t.key
                ? (isDark ? 'text-amber-400 border-amber-500' : 'text-teal-700 border-teal-600')
                : (isDark ? 'text-[#888] hover:text-white' : 'text-[#94A3B8] hover:text-[#475569]') + ' border-transparent'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <style>{`div::-webkit-scrollbar{display:none}`}</style>

      <div className={`${isMobile ? 'p-3' : 'p-6'}`}>
        {/* Products Tab */}
        {tab === 'products' && (
          topProducts.length === 0
            ? <p className={`text-center py-8 text-sm ${isDark ? 'text-[#888]' : 'text-[#94A3B8]'}`}>Belum ada data produk</p>
            : isMobile ? (
              /* Mobile: card list */
              <div className="space-y-2">
                {topProducts.map((p, i) => (
                  <div
                    key={p.name}
                    className={`rounded-2xl border p-3.5 ${i === 0 ? (isDark ? 'bg-amber-500/5 border-amber-500/20' : 'bg-teal-50 border-teal-200 shadow-sm') : isDark ? 'bg-[#222]/50 border-[#2e2e2e]' : 'bg-[#F8FAFC] border-[#E2E8F0]'} transition-all`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`text-lg ${i < 3 ? '' : 'text-xs font-black ' + (isDark ? 'text-[#888]' : 'text-[#94A3B8]')}`}>
                          {i < 3 ? medals[i] : `#${i + 1}`}
                        </span>
                        <div className="min-w-0">
                          <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>{p.name}</p>
                          <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-[#888]' : 'text-[#94A3B8]'}`}>{p.qty} terjual</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-black font-mono ${isDark ? 'text-amber-400' : 'text-teal-700'}`}>Rp {fmt(p.revenue)}</p>
                        <p className={`text-[10px] font-black font-mono ${marginColor(p.marginPct)}`}>
                          {p.marginPct != null ? `Margin ${p.marginPct.toFixed(0)}%` : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Desktop: table */
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className={`text-left pb-4 px-2 text-[10px] uppercase tracking-widest ${isDark ? 'text-[#888]' : 'text-[#94A3B8]'} font-black border-b ${isDark ? 'border-[#2e2e2e]' : 'border-[#F1F5F9]'}`}>#</th>
                      <th className={`text-left pb-4 px-2 text-[10px] uppercase tracking-widest ${isDark ? 'text-[#888]' : 'text-[#94A3B8]'} font-black border-b ${isDark ? 'border-[#2e2e2e]' : 'border-[#F1F5F9]'}`}>Produk</th>
                      <th className={`text-right pb-4 px-2 text-[10px] uppercase tracking-widest ${isDark ? 'text-[#888]' : 'text-[#94A3B8]'} font-black border-b ${isDark ? 'border-[#2e2e2e]' : 'border-[#F1F5F9]'}`}>Qty</th>
                      <th className={`text-right pb-4 px-2 text-[10px] uppercase tracking-widest ${isDark ? 'text-[#888]' : 'text-[#94A3B8]'} font-black border-b ${isDark ? 'border-[#2e2e2e]' : 'border-[#F1F5F9]'}`}>Revenue</th>
                      <th className={`text-right pb-4 px-2 text-[10px] uppercase tracking-widest ${isDark ? 'text-[#888]' : 'text-[#94A3B8]'} font-black border-b ${isDark ? 'border-[#2e2e2e]' : 'border-[#F1F5F9]'}`}>Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((p, i) => (
                      <tr
                        key={p.name}
                        className={`border-b transition-all ${isDark ? 'border-[#2e2e2e]/50 hover:bg-[#222]/50' : 'border-[#F1F5F9] hover:bg-[#F8FAFC]/50'} ${i === 0 && !isDark ? 'bg-teal-50/30' : i === 0 ? 'bg-amber-500/5' : ''}`}
                      >
                        <td className={`py-4 px-2 ${isDark ? 'text-white' : 'text-[#0F172A]'} font-bold`}>{i < 3 ? medals[i] : i + 1}</td>
                        <td className={`py-4 px-2 ${isDark ? 'text-white' : 'text-[#0F172A]'} font-bold`}>{p.name}</td>
                        <td className={`py-4 px-2 text-right font-mono font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>{p.qty}</td>
                        <td className={`py-4 px-2 text-right font-mono font-black ${isDark ? 'text-amber-400' : 'text-teal-700'}`}>Rp {fmt(p.revenue)}</td>
                        <td className={`py-4 px-2 text-right font-mono font-black ${marginColor(p.marginPct)}`}>
                          {p.marginPct != null ? `${p.marginPct.toFixed(0)}%` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
        )}

        {/* Payment Tab */}
        {tab === 'payment' && (
          paymentBreakdown.length === 0
            ? <p className={`text-center py-8 text-sm ${isDark ? 'text-[#888]' : 'text-[#94A3B8]'}`}>Belum ada transaksi</p>
            : (
              <div className="space-y-3">
                {paymentBreakdown.map((p) => {
                  const Icon = payIcons[p.method] || CreditCard;
                  return (
                    <div key={p.method} className={`${isDark ? 'bg-[#222]' : 'bg-[#F8FAFC] border border-[#E2E8F0]'} rounded-xl p-5 shadow-sm`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-amber-500/15' : 'bg-teal-50'} flex items-center justify-center`}>
                            <Icon size={18} className={isDark ? 'text-amber-400' : 'text-teal-600'} />
                          </div>
                          <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>{payLabels[p.method] || p.method}</span>
                        </div>
                        <div className="text-right">
                          <span className={`text-sm font-black font-mono ${isDark ? 'text-white' : 'text-teal-700'}`}>Rp {fmt(p.revenue)}</span>
                          <span className={`${isDark ? 'text-[#888]' : 'text-[#94A3B8]'} text-[10px] font-bold uppercase tracking-wider ml-2`}>· {p.count} trx</span>
                        </div>
                      </div>
                      <div className={`${isDark ? 'bg-[#333]' : 'bg-[#E2E8F0]'} rounded-full h-2.5 mt-4 overflow-hidden shadow-inner`}>
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${isDark ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-teal-500 to-teal-600'}`}
                          style={{ width: `${p.pct}%` }}
                        />
                      </div>
                      <p className={`${isDark ? 'text-[#888]' : 'text-teal-600'} text-[10px] font-black mt-2 text-right tracking-widest`}>{p.pct.toFixed(1)}%</p>
                    </div>
                  );
                })}
              </div>
            )
        )}

        {/* Cashier Tab */}
        {tab === 'cashier' && (
          cashierPerformance.length === 0
            ? <p className={`text-center py-8 text-sm ${isDark ? 'text-[#888]' : 'text-[#94A3B8]'}`}>Belum ada data kasir</p>
            : isMobile ? (
              /* Mobile: card list */
              <div className="space-y-2">
                {cashierPerformance.map((c, i) => (
                  <div
                    key={c.name}
                    className={`rounded-2xl border p-4 ${i === 0 ? (isDark ? 'bg-teal-500/5 border-teal-500/20' : 'bg-teal-50 border-teal-200 shadow-sm') : isDark ? 'bg-[#222]/50 border-[#2e2e2e]' : 'bg-[#F8FAFC] border-[#E2E8F0]'} transition-all`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
                          {i === 0 ? '⭐ ' : ''}{c.name}
                        </p>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-[#888]' : 'text-[#94A3B8]'}`}>{c.transactions} transaksi</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-black font-mono ${isDark ? 'text-amber-400' : 'text-teal-700'}`}>Rp {fmt(c.revenue)}</p>
                        <p className={`text-[10px] font-bold font-mono ${isDark ? 'text-[#ccc]' : 'text-[#475569]'}`}>Avg Rp {fmt(c.avgTicket)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Desktop: table */
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className={`text-left pb-4 px-2 text-[10px] uppercase tracking-widest ${isDark ? 'text-[#888]' : 'text-[#94A3B8]'} font-black border-b ${isDark ? 'border-[#2e2e2e]' : 'border-[#F1F5F9]'}`}>Kasir</th>
                      <th className={`text-right pb-4 px-2 text-[10px] uppercase tracking-widest ${isDark ? 'text-[#888]' : 'text-[#94A3B8]'} font-black border-b ${isDark ? 'border-[#2e2e2e]' : 'border-[#F1F5F9]'}`}>Trx</th>
                      <th className={`text-right pb-4 px-2 text-[10px] uppercase tracking-widest ${isDark ? 'text-[#888]' : 'text-[#94A3B8]'} font-black border-b ${isDark ? 'border-[#2e2e2e]' : 'border-[#F1F5F9]'}`}>Revenue</th>
                      <th className={`text-right pb-4 px-2 text-[10px] uppercase tracking-widest ${isDark ? 'text-[#888]' : 'text-[#94A3B8]'} font-black border-b ${isDark ? 'border-[#2e2e2e]' : 'border-[#F1F5F9]'}`}>Avg Tiket</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashierPerformance.map((c, i) => (
                      <tr
                        key={c.name}
                        className={`border-b transition-all ${isDark ? 'border-[#2e2e2e]/50 hover:bg-[#222]/50' : 'border-[#F1F5F9] hover:bg-[#F8FAFC]/50'} ${i === 0 && !isDark ? 'bg-teal-50/30' : i === 0 ? 'bg-teal-500/5' : ''}`}
                      >
                        <td className={`py-4 px-2 ${isDark ? 'text-white' : 'text-[#0F172A]'} font-bold`}>{i === 0 ? '⭐ ' : ''}{c.name}</td>
                        <td className={`py-4 px-2 text-right font-mono font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>{c.transactions}</td>
                        <td className={`py-4 px-2 text-right font-mono font-black ${isDark ? 'text-amber-400' : 'text-teal-700'}`}>Rp {fmt(c.revenue)}</td>
                        <td className={`py-4 px-2 text-right font-mono font-bold ${isDark ? 'text-[#ccc]' : 'text-[#475569]'}`}>Rp {fmt(c.avgTicket)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
        )}
      </div>
    </div>
  );
}
