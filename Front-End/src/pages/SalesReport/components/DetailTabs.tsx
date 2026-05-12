import { useState } from 'react';
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

interface Props {
  topProducts: ProductRank[];
  paymentBreakdown: PaymentBreakdown[];
  cashierPerformance: CashierPerformance[];
}

export default function DetailTabs({ topProducts, paymentBreakdown, cashierPerformance }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [tab, setTab] = useState<'products' | 'payment' | 'cashier'>('products');

  const tabs = [
    { key: 'products' as const, label: 'Produk Terlaris' },
    { key: 'payment' as const, label: 'Metode Pembayaran' },
    { key: 'cashier' as const, label: 'Per Kasir' },
  ];

  const marginColor = (pct: number | null) => {
    if (pct == null) return 'text-[#888]';
    if (pct > 70) return 'text-green-400';
    if (pct >= 40) return 'text-teal-400';
    return 'text-red-400';
  };

  return (
    <div className={`${isDark ? 'bg-[#1a1a1a] border-[#2e2e2e]' : 'bg-white border-stone-200'} rounded-2xl border overflow-hidden`}>
      {/* Tab bar */}
      <div className={`border-b ${isDark ? 'border-[#2e2e2e]' : 'border-stone-100'} px-6 pt-4 flex gap-0`}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-all ${
              tab === t.key
                ? 'text-amber-400 border-amber-500 font-bold'
                : `${isDark ? 'text-[#888] hover:text-white' : 'text-stone-500 hover:text-stone-900'} border-transparent`
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {/* Products Tab */}
        {tab === 'products' && (
          topProducts.length === 0
            ? <p className={`text-center py-8 text-sm ${isDark ? 'text-[#888]' : 'text-stone-500'}`}>Belum ada data produk</p>
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className={`text-left pb-3 text-[10px] uppercase tracking-widest ${isDark ? 'text-[#888]' : 'text-stone-500'} font-bold border-b ${isDark ? 'border-[#2e2e2e]' : 'border-stone-100'}`}>#</th>
                      <th className={`text-left pb-3 text-[10px] uppercase tracking-widest ${isDark ? 'text-[#888]' : 'text-stone-500'} font-bold border-b ${isDark ? 'border-[#2e2e2e]' : 'border-stone-100'}`}>Produk</th>
                      <th className={`text-right pb-3 text-[10px] uppercase tracking-widest ${isDark ? 'text-[#888]' : 'text-stone-500'} font-bold border-b ${isDark ? 'border-[#2e2e2e]' : 'border-stone-100'}`}>Qty</th>
                      <th className={`text-right pb-3 text-[10px] uppercase tracking-widest ${isDark ? 'text-[#888]' : 'text-stone-500'} font-bold border-b ${isDark ? 'border-[#2e2e2e]' : 'border-stone-100'}`}>Revenue</th>
                      <th className={`text-right pb-3 text-[10px] uppercase tracking-widest ${isDark ? 'text-[#888]' : 'text-stone-500'} font-bold border-b ${isDark ? 'border-[#2e2e2e]' : 'border-stone-100'}`}>Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((p, i) => (
                      <tr
                        key={p.name}
                        className={`border-b ${isDark ? 'border-[#2e2e2e]/50 hover:bg-[#222]/50' : 'border-stone-50 hover:bg-stone-50/50'} transition-all ${i === 0 ? 'bg-amber-500/5' : ''}`}
                      >
                        <td className={`py-4 px-1 ${isDark ? 'text-white' : 'text-stone-900'} font-bold`}>{i < 3 ? medals[i] : i + 1}</td>
                        <td className={`py-4 ${isDark ? 'text-white' : 'text-stone-900'} font-semibold`}>{p.name}</td>
                        <td className={`py-4 text-right font-mono ${isDark ? 'text-white' : 'text-stone-900'} font-bold`}>{p.qty}</td>
                        <td className="py-4 text-right font-mono text-amber-400 font-bold">Rp {fmt(p.revenue)}</td>
                        <td className={`py-4 text-right font-mono font-bold ${marginColor(p.marginPct)}`}>
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
            ? <p className={`text-center py-8 text-sm ${isDark ? 'text-[#888]' : 'text-stone-500'}`}>Belum ada transaksi</p>
            : (
              <div className="space-y-3">
                {paymentBreakdown.map((p) => {
                  const Icon = payIcons[p.method] || CreditCard;
                  return (
                    <div key={p.method} className={`${isDark ? 'bg-[#222]' : 'bg-stone-50'} rounded-xl p-4`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center">
                            <Icon size={16} className="text-amber-400" />
                          </div>
                          <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-stone-900'}`}>{payLabels[p.method] || p.method}</span>
                        </div>
                        <div className="text-right">
                          <span className={`text-sm font-mono font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>Rp {fmt(p.revenue)}</span>
                          <span className={`${isDark ? 'text-[#888]' : 'text-stone-500'} text-xs ml-2`}>· {p.count} trx</span>
                        </div>
                      </div>
                      <div className={`${isDark ? 'bg-[#333]' : 'bg-stone-200'} rounded-full h-2 mt-3 overflow-hidden`}>
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                          style={{ width: `${p.pct}%` }}
                        />
                      </div>
                      <p className={`${isDark ? 'text-[#888]' : 'text-stone-500'} text-xs mt-1.5 text-right`}>{p.pct.toFixed(1)}%</p>
                    </div>
                  );
                })}
              </div>
            )
        )}

        {/* Cashier Tab */}
        {tab === 'cashier' && (
          cashierPerformance.length === 0
            ? <p className={`text-center py-8 text-sm ${isDark ? 'text-[#888]' : 'text-stone-500'}`}>Belum ada data kasir</p>
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className={`text-left pb-3 text-[10px] uppercase tracking-widest ${isDark ? 'text-[#888]' : 'text-stone-500'} font-bold border-b ${isDark ? 'border-[#2e2e2e]' : 'border-stone-100'}`}>Kasir</th>
                      <th className={`text-right pb-3 text-[10px] uppercase tracking-widest ${isDark ? 'text-[#888]' : 'text-stone-500'} font-bold border-b ${isDark ? 'border-[#2e2e2e]' : 'border-stone-100'}`}>Trx</th>
                      <th className={`text-right pb-3 text-[10px] uppercase tracking-widest ${isDark ? 'text-[#888]' : 'text-stone-500'} font-bold border-b ${isDark ? 'border-[#2e2e2e]' : 'border-stone-100'}`}>Revenue</th>
                      <th className={`text-right pb-3 text-[10px] uppercase tracking-widest ${isDark ? 'text-[#888]' : 'text-stone-500'} font-bold border-b ${isDark ? 'border-[#2e2e2e]' : 'border-stone-100'}`}>Avg Tiket</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashierPerformance.map((c, i) => (
                      <tr
                        key={c.name}
                        className={`border-b ${isDark ? 'border-[#2e2e2e]/50 hover:bg-[#222]/50' : 'border-stone-50 hover:bg-stone-50/50'} transition-all ${i === 0 ? 'bg-teal-500/5' : ''}`}
                      >
                        <td className={`py-4 ${isDark ? 'text-white' : 'text-stone-900'} font-semibold`}>{i === 0 ? '⭐ ' : ''}{c.name}</td>
                        <td className={`py-4 text-right font-mono ${isDark ? 'text-white' : 'text-stone-900'}`}>{c.transactions}</td>
                        <td className="py-4 text-right font-mono text-amber-400 font-bold">Rp {fmt(c.revenue)}</td>
                        <td className={`py-4 text-right font-mono ${isDark ? 'text-[#ccc]' : 'text-stone-600'}`}>Rp {fmt(c.avgTicket)}</td>
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
