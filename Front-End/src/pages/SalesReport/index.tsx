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
    if (m === 'cash') return isDark ? 'bg-green-500/15 text-green-400' : 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    if (m === 'qris') return isDark ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-700 border border-blue-200';
    if (m === 'card') return isDark ? 'bg-purple-500/15 text-purple-400' : 'bg-purple-50 text-purple-700 border border-purple-200';
    return isDark ? 'bg-[#222] text-[#888]' : 'bg-[#F1F5F9] text-[#94A3B8] border border-[#E2E8F0]';
  };

  return (
    <div className="space-y-4 px-2 py-2">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
            Laporan <span className="text-amber-500">Penjualan</span>
          </h1>
          <p className={`text-xs ${isDark ? 'text-[#888]' : 'text-[#94A3B8]'} flex items-center gap-1 mt-1`}>
            <Clock size={12} /> Terakhir diperbarui: {new Date().toLocaleString('id-ID')}
          </p>
        </div>
        <button
          onClick={() => exportCsv(filtered, preset)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${isDark ? 'border-[#2e2e2e] bg-transparent text-white hover:bg-[#222]' : 'border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC]'}`}
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* ═══ DATE FILTER ═══ */}
      <div className={`${isDark ? 'bg-[#1a1a1a] border-[#2e2e2e]' : 'bg-white border-[#E2E8F0] shadow-sm'} border rounded-2xl p-1.5`}>
        <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => { setPreset(p.key); setTxPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm transition-all whitespace-nowrap flex-shrink-0 ${
                preset === p.key
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-lg shadow-amber-500/20'
                  : `bg-transparent ${isDark ? 'text-[#888] hover:text-white hover:bg-[#222]' : 'text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9]'} font-medium`
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 mt-3 px-2 pb-2">
            <label className={`text-sm font-bold ${isDark ? 'text-[#888]' : 'text-[#475569]'}`}>Dari</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className={`${isDark ? 'bg-[#222] border-[#2e2e2e] text-white' : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A]'} border rounded-xl text-sm px-3 py-2 outline-none focus:border-teal-400 focus:bg-white transition-all`}
            />
            <label className={`text-sm font-bold ${isDark ? 'text-[#888]' : 'text-[#475569]'}`}>Sampai</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className={`${isDark ? 'bg-[#222] border-[#2e2e2e] text-white' : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A]'} border rounded-xl text-sm px-3 py-2 outline-none focus:border-teal-400 focus:bg-white transition-all`}
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
        <div className={`${isDark ? 'bg-[#1a1a1a] border-[#2e2e2e]' : 'bg-white border-[#E2E8F0] shadow-sm'} border rounded-2xl p-6`}>
          <div className="flex items-center gap-2 mb-5">
            <PieChart size={16} className="text-amber-400" />
            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>Breakdown Biaya</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto md:grid md:grid-cols-4 md:overflow-visible mb-5" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
            {[
              { label: 'Gross Revenue', value: costBreakdown.grossRevenue, color: isDark ? 'text-amber-400' : 'text-teal-700' },
              { label: 'COGS (est.)', value: costBreakdown.cogs, color: 'text-red-400' },
              { label: 'Net Profit', value: costBreakdown.netProfit, color: isDark ? 'text-green-400' : 'text-emerald-600' },
              { label: 'Margin', value: null, color: isDark ? 'text-teal-400' : 'text-teal-600' },
            ].map((item) => (
              <div key={item.label} className={`${isDark ? 'bg-[#222]' : 'bg-[#F8FAFC]'} rounded-xl p-4 min-w-[140px] flex-shrink-0 md:min-w-0 border border-transparent hover:border-[#E2E8F0] transition-all`}>
                <p className={`text-[10px] uppercase tracking-widest ${isDark ? 'text-[#888]' : 'text-[#94A3B8]'} font-bold mb-1`}>{item.label}</p>
                <p className={`text-lg font-black font-mono ${item.color}`}>
                  {item.value != null ? `Rp ${fmt(item.value)}` : `${costBreakdown.marginPct.toFixed(1)}%`}
                </p>
              </div>
            ))}
          </div>
          {/* Visual bar */}
          <div className={`${isDark ? 'bg-[#2e2e2e]' : 'bg-[#F1F5F9]'} h-3 rounded-full overflow-hidden flex shadow-inner`}>
            <div
              className="h-full bg-gradient-to-r from-red-500 to-red-600"
              style={{ width: `${costBreakdown.grossRevenue > 0 ? (costBreakdown.cogs / costBreakdown.grossRevenue) * 100 : 0}%`, transition: 'width 0.8s ease' }}
              title="COGS"
            />
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-green-500 shadow-[0_0_10px_rgba(20,184,166,0.3)]"
              style={{ width: `${costBreakdown.marginPct}%`, transition: 'width 0.8s ease' }}
              title="Profit"
            />
          </div>
          <div className={`flex gap-4 mt-3 text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-[#888]' : 'text-[#94A3B8]'}`}>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> COGS</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal-500" /> Profit</span>
          </div>
        </div>
      )}

      {/* ═══ TRANSACTION LIST ═══ */}
      <div className={`${isDark ? 'bg-[#1a1a1a] border-[#2e2e2e]' : 'bg-white border-[#E2E8F0] shadow-sm'} border rounded-2xl overflow-hidden`}>
        <button
          onClick={() => setShowTxList(!showTxList)}
          className={`w-full flex items-center justify-between px-6 py-5 ${isDark ? 'hover:bg-[#222]/50' : 'hover:bg-[#F8FAFC]'} transition-colors`}
        >
          <div className="flex items-center gap-2">
            <span className={`${isDark ? 'text-white' : 'text-[#0F172A]'} font-bold text-sm`}>Detail Transaksi</span>
            <span className="bg-teal-50 text-teal-700 border border-teal-200 rounded-lg px-2 py-0.5 text-xs font-black">{filtered.length}</span>
          </div>
          <ChevronDown
            size={18}
            className={`${isDark ? 'text-[#888]' : 'text-[#94A3B8]'} transition-transform duration-300 ${showTxList ? 'rotate-180' : ''}`}
          />
        </button>

        {showTxList && (
          <div className={`border-t ${isDark ? 'border-[#2e2e2e]' : 'border-[#F1F5F9]'}`}>
            {filtered.length === 0 ? (
              <p className={`p-6 text-center text-sm ${isDark ? 'text-[#888]' : 'text-[#94A3B8]'}`}>Tidak ada transaksi dalam periode ini</p>
            ) : (
              <>
                {/* Desktop table — hidden on mobile */}
                <div className="overflow-x-auto hidden md:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`${isDark ? 'bg-[#222]/50' : 'bg-[#F8FAFC]'}`}>
                        <th className={`text-left py-4 px-6 text-[10px] uppercase tracking-widest ${isDark ? 'text-[#888]' : 'text-[#94A3B8]'} font-black`}>Waktu</th>
                        <th className={`text-left py-4 px-6 text-[10px] uppercase tracking-widest ${isDark ? 'text-[#888]' : 'text-[#94A3B8]'} font-black`}>Items</th>
                        <th className={`text-right py-4 px-6 text-[10px] uppercase tracking-widest ${isDark ? 'text-[#888]' : 'text-[#94A3B8]'} font-black`}>Total</th>
                        <th className={`text-right py-4 px-6 text-[10px] uppercase tracking-widest ${isDark ? 'text-[#888]' : 'text-[#94A3B8]'} font-black`}>Bayar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedTx.map((t: Transaction) => {
                        const d = t.date instanceof Date ? t.date : new Date(t.date);
                        const isOpen = expandedTx === t.id;
                        return (
                          <tr
                            key={t.id}
                            className={`group cursor-pointer border-b ${isDark ? 'border-[#2e2e2e]/50 hover:bg-[#222]/30' : 'border-[#F1F5F9] hover:bg-[#F8FAFC]/50'} transition-all`}
                            onClick={() => setExpandedTx(isOpen ? null : t.id)}
                          >
                            <td className={`py-4 px-6 ${isDark ? 'text-[#888]' : 'text-[#475569]'} text-sm font-medium whitespace-nowrap`}>{d.toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</td>
                            <td className={`py-4 px-6 ${isDark ? 'text-white' : 'text-[#0F172A]'} text-sm`}>
                              <span className="line-clamp-1 font-medium">{t.items.map(i => i.name || i.productId).join(', ')}</span>
                              {isOpen && (
                                <div className={`mt-3 space-y-2 text-xs ${isDark ? 'text-[#888]' : 'text-[#475569]'} bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]`}>
                                  {t.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between">
                                      <span>{item.name || item.productId} x{item.quantity}</span>
                                      <span className="font-bold font-mono">Rp {fmt(item.price * item.quantity)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className={`py-4 px-6 text-right font-mono font-black ${isDark ? 'text-amber-400' : 'text-teal-700'} whitespace-nowrap`}>Rp {fmt(t.total)}</td>
                            <td className="py-4 px-6 text-right">
                              <span className={`text-[10px] px-2.5 py-1 rounded-lg font-black uppercase tracking-wider ${payMethodBadge(t.paymentMethod)}`}>
                                {t.paymentMethod?.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile card list */}
                <div className="space-y-3 p-4 md:hidden">
                  {pagedTx.map((t: Transaction) => {
                    const d = t.date instanceof Date ? t.date : new Date(t.date);
                    const isOpen = expandedTx === t.id;
                    return (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => setExpandedTx(isOpen ? null : t.id)}
                        className={`w-full text-left rounded-2xl border p-4 transition-all active:scale-[0.98] ${isDark ? 'border-[#2e2e2e] bg-[#222]/50 hover:bg-[#222]' : 'border-[#E2E8F0] bg-white hover:shadow-md'}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-[#888]' : 'text-[#94A3B8]'}`}>
                              {d.toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                            </p>
                            <p className={`text-sm font-bold mt-1 line-clamp-1 ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
                              {t.items.map(i => i.name || i.productId).join(', ')}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className={`text-sm font-black font-mono ${isDark ? 'text-amber-400' : 'text-teal-700'}`}>Rp {fmt(t.total)}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-lg font-black uppercase tracking-wider inline-block mt-1 ${payMethodBadge(t.paymentMethod)}`}>
                              {t.paymentMethod?.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        {isOpen && (
                          <div className={`mt-3 pt-3 border-t border-dashed space-y-2 text-xs ${isDark ? 'border-[#2e2e2e] text-[#888]' : 'border-[#E2E8F0] text-[#475569]'}`}>
                            {t.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>{item.name || item.productId} x{item.quantity}</span>
                                <span className="font-bold font-mono">Rp {fmt(item.price * item.quantity)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className={`flex items-center justify-between p-6 border-t ${isDark ? 'border-[#2e2e2e]' : 'border-[#F1F5F9]'}`}>
                    <button
                      disabled={txPage <= 1}
                      onClick={() => setTxPage(p => p - 1)}
                      className={`px-5 py-2.5 min-h-[44px] rounded-xl text-sm font-bold border transition-all ${isDark ? 'bg-[#222] border-[#2e2e2e] text-[#888] hover:text-white' : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'}`}
                    >
                      ← Prev
                    </button>
                    <span className={`text-xs font-bold ${isDark ? 'text-[#888]' : 'text-[#475569]'}`}>
                      Halaman <span className="text-teal-600 font-black text-sm">{txPage}</span> dari {totalPages}
                    </span>
                    <button
                      disabled={txPage >= totalPages}
                      onClick={() => setTxPage(p => p + 1)}
                      className={`px-5 py-2.5 min-h-[44px] rounded-xl text-sm font-bold border transition-all ${isDark ? 'bg-[#222] border-[#2e2e2e] text-[#888] hover:text-white' : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'}`}
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
