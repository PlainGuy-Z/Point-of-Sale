import { useState, useMemo } from 'react';
import { Download, ChevronDown, ChevronUp, Clock, PieChart } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import { Skeleton } from '../../components/common/Skeleton';
import { useSalesData, exportCsv } from './useSalesData';
import type { PresetKey } from './useSalesData';
import SummaryCards from './components/SummaryCards';
import SalesChart from './components/SalesChart';
import DetailTabs from './components/DetailTabs';
import type { Transaction } from '../../types';

function fmt(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}jt`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}rb`;
  return String(Math.round(n));
}

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: 'today', label: 'Hari Ini' },
  { key: 'yesterday', label: 'Kemarin' },
  { key: '7days', label: '7 Hari' },
  { key: '30days', label: '30 Hari' },
  { key: 'month', label: 'Bulan Ini' },
  { key: 'custom', label: 'Custom' },
];

export default function SalesReport() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { transactions, products, isServiceLoading } = useApp();

  const [preset, setPreset] = useState<PresetKey>('today');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [showTxList, setShowTxList] = useState(false);
  const [txPage, setTxPage] = useState(1);
  const [expandedTx, setExpandedTx] = useState<string | null>(null);

  const cStart = useMemo(() => customStart ? new Date(customStart) : undefined, [customStart]);
  const cEnd = useMemo(() => customEnd ? new Date(customEnd) : undefined, [customEnd]);

  const {
    filtered, summary, isSingleDay, hourlyData, dailyData, peakHour,
    topProducts, paymentBreakdown, cashierPerformance, costBreakdown,
  } = useSalesData(transactions, products, preset, cStart, cEnd);

  // Pagination for transaction list
  const txPerPage = 20;
  const totalPages = Math.ceil(filtered.length / txPerPage);
  const pagedTx = filtered
    .sort((a, b) => {
      const da = a.date instanceof Date ? a.date : new Date(a.date);
      const db = b.date instanceof Date ? b.date : new Date(b.date);
      return db.getTime() - da.getTime();
    })
    .slice((txPage - 1) * txPerPage, txPage * txPerPage);

  if (isServiceLoading && transactions.length === 0) {
    return (
      <div className="space-y-4 px-6 py-6">
        <Skeleton className="h-10 w-48" rounded="rounded-xl" />
        <Skeleton className="h-14 w-full" rounded="rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" rounded="rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-72 w-full" rounded="rounded-2xl" />
        <Skeleton className="h-64 w-full" rounded="rounded-2xl" />
      </div>
    );
  }

  const payMethodBadge = (method: string) => {
    const m = method?.toLowerCase();
    if (m === 'cash') return 'bg-green-500/15 text-green-400';
    if (m === 'qris') return 'bg-blue-500/15 text-blue-400';
    if (m === 'card') return 'bg-purple-500/15 text-purple-400';
    return isDark ? 'bg-[#222] text-[#888]' : 'bg-stone-100 text-stone-500';
  };

  return (
    <div className="space-y-4 px-2 py-2">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>
            Laporan <span className="text-amber-500">Penjualan</span>
          </h1>
          <p className={`text-xs ${isDark ? 'text-[#888]' : 'text-stone-500'} flex items-center gap-1 mt-1`}>
            <Clock size={12} /> Terakhir diperbarui: {new Date().toLocaleString('id-ID')}
          </p>
        </div>
        <button
          onClick={() => exportCsv(filtered, preset)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border ${isDark ? 'border-[#2e2e2e] bg-transparent text-white hover:bg-[#222]' : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'} transition-all`}
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* ═══ DATE FILTER ═══ */}
      <div className={`${isDark ? 'bg-[#1a1a1a] border-[#2e2e2e]' : 'bg-white border-stone-200'} border rounded-2xl p-1.5`}>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => { setPreset(p.key); setTxPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm transition-all ${
                preset === p.key
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-lg shadow-amber-500/20'
                  : `bg-transparent ${isDark ? 'text-[#888] hover:text-white hover:bg-[#222]' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'} font-medium`
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 mt-3 px-2 pb-2">
            <label className={`text-sm ${isDark ? 'text-[#888]' : 'text-stone-500'}`}>Dari</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className={`${isDark ? 'bg-[#222] border-[#2e2e2e] text-white' : 'bg-stone-50 border-stone-200 text-stone-900'} border rounded-xl text-sm px-3 py-2 outline-none focus:border-amber-500/50`}
            />
            <label className={`text-sm ${isDark ? 'text-[#888]' : 'text-stone-500'}`}>Sampai</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className={`${isDark ? 'bg-[#222] border-[#2e2e2e] text-white' : 'bg-stone-50 border-stone-200 text-stone-900'} border rounded-xl text-sm px-3 py-2 outline-none focus:border-amber-500/50`}
            />
          </div>
        )}
      </div>

      {/* ═══ SUMMARY CARDS ═══ */}
      <SummaryCards summary={summary} />

      {/* ═══ CHART ═══ */}
      <SalesChart isSingleDay={isSingleDay} hourlyData={hourlyData} dailyData={dailyData} peakHour={peakHour} />

      {/* ═══ DETAIL TABS ═══ */}
      <DetailTabs topProducts={topProducts} paymentBreakdown={paymentBreakdown} cashierPerformance={cashierPerformance} />

      {/* ═══ COST BREAKDOWN ═══ */}
      {costBreakdown && (
        <div className={`${isDark ? 'bg-[#1a1a1a] border-[#2e2e2e]' : 'bg-white border-stone-200'} border rounded-2xl p-6`}>
          <div className="flex items-center gap-2 mb-5">
            <PieChart size={16} className="text-amber-400" />
            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>Breakdown Biaya</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            {[
              { label: 'Gross Revenue', value: costBreakdown.grossRevenue, color: 'text-amber-400' },
              { label: 'COGS (est.)', value: costBreakdown.cogs, color: 'text-red-400' },
              { label: 'Net Profit', value: costBreakdown.netProfit, color: 'text-green-400' },
              { label: 'Margin', value: null, color: 'text-teal-400' },
            ].map((item) => (
              <div key={item.label} className={`${isDark ? 'bg-[#222]' : 'bg-stone-50'} rounded-xl p-3`}>
                <p className={`text-[10px] uppercase tracking-widest ${isDark ? 'text-[#888]' : 'text-stone-500'} font-bold mb-1`}>{item.label}</p>
                <p className={`text-lg font-black font-mono ${item.color}`}>
                  {item.value != null ? `Rp ${fmt(item.value)}` : `${costBreakdown.marginPct.toFixed(1)}%`}
                </p>
              </div>
            ))}
          </div>
          {/* Visual bar */}
          <div className={`${isDark ? 'bg-[#2e2e2e]' : 'bg-stone-100'} h-3 rounded-full overflow-hidden flex`}>
            <div
              className="h-full bg-gradient-to-r from-red-500 to-red-600"
              style={{ width: `${costBreakdown.grossRevenue > 0 ? (costBreakdown.cogs / costBreakdown.grossRevenue) * 100 : 0}%`, transition: 'width 0.8s ease' }}
              title="COGS"
            />
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-green-500"
              style={{ width: `${costBreakdown.marginPct}%`, transition: 'width 0.8s ease' }}
              title="Profit"
            />
          </div>
          <div className={`flex gap-4 mt-3 text-xs ${isDark ? 'text-[#888]' : 'text-stone-500'}`}>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-red-500 to-red-600" /> COGS</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-teal-500 to-green-500" /> Profit</span>
          </div>
        </div>
      )}

      {/* ═══ TRANSACTION LIST ═══ */}
      <div className={`${isDark ? 'bg-[#1a1a1a] border-[#2e2e2e]' : 'bg-white border-stone-200'} border rounded-2xl`}>
        <button
          onClick={() => setShowTxList(!showTxList)}
          className={`w-full flex items-center justify-between px-6 py-4 ${isDark ? 'hover:bg-[#222]/50' : 'hover:bg-stone-50'} transition-colors rounded-2xl`}
        >
          <div className="flex items-center gap-2">
            <span className={`${isDark ? 'text-white' : 'text-stone-900'} font-semibold text-sm`}>Lihat Detail Transaksi</span>
            <span className="bg-amber-500/15 text-amber-400 rounded-lg px-2 py-0.5 text-xs font-bold">{filtered.length}</span>
          </div>
          <ChevronDown
            size={18}
            className={`${isDark ? 'text-[#888]' : 'text-stone-400'} transition-transform duration-200 ${showTxList ? 'rotate-180' : ''}`}
          />
        </button>

        {showTxList && (
          <div className={`border-t ${isDark ? 'border-[#2e2e2e]' : 'border-stone-200'}`}>
            {filtered.length === 0 ? (
              <p className={`p-6 text-center text-sm ${isDark ? 'text-[#888]' : 'text-stone-500'}`}>Tidak ada transaksi dalam periode ini</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`${isDark ? 'bg-[#222]/50' : 'bg-stone-50'}`}>
                        <th className={`text-left py-3 px-4 text-[10px] uppercase tracking-widest ${isDark ? 'text-[#888]' : 'text-stone-500'} font-bold`}>Waktu</th>
                        <th className={`text-left py-3 px-4 text-[10px] uppercase tracking-widest ${isDark ? 'text-[#888]' : 'text-stone-500'} font-bold`}>Items</th>
                        <th className={`text-right py-3 px-4 text-[10px] uppercase tracking-widest ${isDark ? 'text-[#888]' : 'text-stone-500'} font-bold`}>Total</th>
                        <th className={`text-right py-3 px-4 text-[10px] uppercase tracking-widest ${isDark ? 'text-[#888]' : 'text-stone-500'} font-bold`}>Bayar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedTx.map((t: Transaction) => {
                        const d = t.date instanceof Date ? t.date : new Date(t.date);
                        const isOpen = expandedTx === t.id;
                        return (
                          <tr
                            key={t.id}
                            className={`group cursor-pointer border-b ${isDark ? 'border-[#2e2e2e]/50 hover:bg-[#222]/30' : 'border-stone-100 hover:bg-stone-50/50'} transition-all`}
                            onClick={() => setExpandedTx(isOpen ? null : t.id)}
                          >
                            <td className={`py-3 px-4 ${isDark ? 'text-[#888]' : 'text-stone-500'} text-sm whitespace-nowrap`}>{d.toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</td>
                            <td className={`py-3 px-4 ${isDark ? 'text-white' : 'text-stone-900'} text-sm`}>
                              <span className="line-clamp-1">{t.items.map(i => i.name || i.productId).join(', ')}</span>
                              {isOpen && (
                                <div className={`mt-2 space-y-1 text-xs ${isDark ? 'text-[#888]' : 'text-stone-500'}`}>
                                  {t.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between">
                                      <span>{item.name || item.productId} x{item.quantity}</span>
                                      <span className="font-mono">Rp {fmt(item.price * item.quantity)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-amber-400 whitespace-nowrap">Rp {fmt(t.total)}</td>
                            <td className="py-3 px-4 text-right">
                              <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${payMethodBadge(t.paymentMethod)}`}>
                                {t.paymentMethod?.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className={`flex items-center justify-between p-4 border-t ${isDark ? 'border-[#2e2e2e]' : 'border-stone-200'}`}>
                    <button
                      disabled={txPage <= 1}
                      onClick={() => setTxPage(p => p - 1)}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium ${isDark ? 'bg-[#222] text-[#888] hover:text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'} disabled:opacity-30 transition-colors`}
                    >
                      ← Prev
                    </button>
                    <span className={`text-xs ${isDark ? 'text-[#888]' : 'text-stone-500'}`}>
                      <span className="text-amber-400 font-bold">{txPage}</span> / {totalPages}
                    </span>
                    <button
                      disabled={txPage >= totalPages}
                      onClick={() => setTxPage(p => p + 1)}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium ${isDark ? 'bg-[#222] text-[#888] hover:text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'} disabled:opacity-30 transition-colors`}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
