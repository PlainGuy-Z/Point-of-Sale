import type { Transaction } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useMemo, useState, useEffect } from 'react';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';
import {
  Area,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart as RechartsLineChart,
} from 'recharts';

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

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChartData {
  day: number;
  dayLabel: string;
  shortLabel: string;
  revenue: number;
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
  monthLabel,
  format,
  isDark,
}: any) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value ?? 0;

  return (
    <div
      style={{
        background: isDark ? 'rgba(12,10,9,0.97)' : '#ffffff',
        border: `1px solid ${isDark ? '#44403c' : '#E2E8F0'}`,
        borderRadius: 14,
        padding: '10px 14px',
        boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.1)',
        minWidth: 140,
      }}
    >
      <p style={{ fontSize: 11, color: isDark ? '#78716c' : '#94A3B8', marginBottom: 4, fontWeight: 600 }}>
        {label} {monthLabel}
      </p>
      <p style={{ fontSize: 16, fontWeight: 800, color: '#0D9488', margin: 0 }}>
        {format(value)}
      </p>
    </div>
  );
}

// ─── Summary mini-card ────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  sub,
  isDark,
  accent = false,
}: {
  label: string;
  value: string;
  sub: string;
  isDark: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={`p-3 rounded-2xl border flex-1 min-w-0 ${
        accent
          ? isDark
            ? 'bg-amber-900/20 border-amber-800/40'
            : 'bg-teal-50 border-teal-100'
          : isDark
          ? 'bg-stone-900/50 border-stone-800'
          : 'bg-[#F8FAFC] border-[#E2E8F0]'
      }`}
    >
      <p
        className={`text-[10px] font-bold uppercase tracking-wider mb-1 leading-tight ${
          accent
            ? isDark
              ? 'text-amber-400'
              : 'text-teal-700'
            : isDark
            ? 'text-stone-400'
            : 'text-[#94A3B8]'
        }`}
      >
        {label}
      </p>
      <p
        className={`font-black leading-tight truncate ${isDark ? 'text-white' : 'text-[#0F172A]'}`}
        style={{ fontSize: 'clamp(13px, 3.5vw, 18px)' }}
        title={value}
      >
        {value}
      </p>
      <p className={`text-[10px] mt-0.5 truncate ${isDark ? 'text-stone-500' : 'text-[#94A3B8]'}`}>
        {sub}
      </p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ProfitChart({ transactions }: { transactions: Transaction[] }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { format } = useCurrencyFormatter();
  const isMobile = useIsMobile();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
  );

  const data = useMemo<ChartData[]>(() => {
    const [yStr, mStr] = selectedMonth.split('-');
    const year = Number(yStr);
    const monthIndex = Number(mStr) - 1;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const revenueByDay = new Map<number, number>();

    transactions.forEach((t) => {
      const dt = new Date(t.date);
      if (Number.isNaN(dt.getTime())) return;
      if (dt.getFullYear() !== year || dt.getMonth() !== monthIndex) return;
      const day = dt.getDate();
      revenueByDay.set(day, (revenueByDay.get(day) || 0) + (t.total || 0));
    });

    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const showTick = day === 1 || day % 7 === 0 || day === daysInMonth;
      return {
        day,
        dayLabel: String(day),
        shortLabel: showTick ? String(day) : '',
        revenue: revenueByDay.get(day) || 0,
      };
    });
  }, [transactions, selectedMonth]);

  const monthLabel = useMemo(() => {
    const [yStr, mStr] = selectedMonth.split('-');
    const d = new Date(Number(yStr), Number(mStr) - 1, 1);
    return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const avgRevenue = data.length ? totalRevenue / data.length : 0;
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 0);
  const activeDays = data.filter((d) => d.revenue > 0).length;

  const yAxisWidth = isMobile ? 0 : 88;
  const chartHeight = isMobile ? 200 : 288;
  const chartMargin = isMobile
    ? { top: 8, right: 8, left: 0, bottom: 4 }
    : { top: 8, right: 16, left: 8, bottom: 8 };

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 ${
        isDark
          ? 'bg-gradient-to-br from-stone-900 to-stone-900 border-stone-800'
          : 'bg-white border-[#E2E8F0] shadow-sm hover:shadow-md'
      }`}
      style={{ padding: isMobile ? '16px 16px 12px' : '24px' }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: isMobile ? 12 : 20,
          gap: 8,
        }}
      >
        <div>
          <h3
            className={`font-black tracking-tight ${isDark ? 'text-white' : 'text-[#0F172A]'}`}
            style={{ fontSize: isMobile ? 14 : 18 }}
          >
            Tren Pendapatan Harian
          </h3>
          <p
            className={`mt-0.5 font-medium ${isDark ? 'text-stone-400' : 'text-[#94A3B8]'}`}
            style={{ fontSize: isMobile ? 11 : 13 }}
          >
            {monthLabel}
          </p>
        </div>

        {/* Month picker */}
        <div
          className={`flex items-center gap-1.5 rounded-xl px-2 py-1.5 ${
            isDark ? 'bg-stone-800 border border-stone-700' : 'bg-[#F1F5F9] border border-[#E2E8F0]'
          }`}
        >
          <label
            className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-stone-400' : 'text-[#475569]'}`}
          >
            Bulan
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className={`text-[10px] font-bold rounded-lg px-1.5 py-0.5 outline-none ${
              isDark
                ? 'bg-stone-950 text-stone-200 border border-stone-800'
                : 'bg-white text-[#0F172A] border border-[#E2E8F0]'
            }`}
            aria-label="Pilih bulan"
          />
        </div>
      </div>

      {/* ── Summary row ── */}
      <div
        style={{
          display: 'flex',
          gap: isMobile ? 8 : 12,
          marginBottom: isMobile ? 14 : 24,
          flexWrap: 'nowrap',
        }}
      >
        <SummaryCard
          label="Total Bulan Ini"
          value={format(totalRevenue)}
          sub={`rata-rata ${format(Math.round(avgRevenue))}/hari`}
          isDark={isDark}
          accent
        />
        <SummaryCard
          label="Hari Tertinggi"
          value={format(maxRevenue)}
          sub="puncak harian"
          isDark={isDark}
        />
        <SummaryCard
          label="Hari Aktif"
          value={String(activeDays)}
          sub="ada penjualan"
          isDark={isDark}
        />
      </div>

      {/* ── Chart ── */}
      {data.length === 0 ? (
        <div
          style={{ height: chartHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <p className={isDark ? 'text-stone-400' : 'text-[#94A3B8]'} style={{ fontSize: 13 }}>
            Tidak ada data untuk periode ini
          </p>
        </div>
      ) : (
        <div style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart data={data} margin={chartMargin}>
              <defs>
                <linearGradient id="profit-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0D9488" stopOpacity={0.15} />
                  <stop offset="80%" stopColor="#0D9488" stopOpacity={0.02} />
                  <stop offset="100%" stopColor="#0D9488" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke={isDark ? '#292524' : '#E2E8F0'}
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="dayLabel"
                tick={{
                  fill: isDark ? '#78716c' : '#94A3B8',
                  fontSize: isMobile ? 10 : 12,
                  fontWeight: 600
                }}
                axisLine={{ stroke: isDark ? '#44403c' : '#E2E8F0' }}
                tickLine={false}
                interval={isMobile ? 6 : 'preserveStartEnd'}
                minTickGap={isMobile ? 0 : 8}
                height={isMobile ? 20 : 28}
              />

              {!isMobile && (
                <YAxis
                  tick={{ fill: isDark ? '#9ca3af' : '#94A3B8', fontSize: 11, fontWeight: 600 }}
                  axisLine={{ stroke: isDark ? '#4b5563' : '#E2E8F0' }}
                  tickLine={{ stroke: isDark ? '#4b5563' : '#E2E8F0' }}
                  tickFormatter={(v) => format(Number(v))}
                  width={yAxisWidth}
                />
              )}

              <Tooltip
                content={
                  <CustomTooltip
                    monthLabel={monthLabel}
                    format={format}
                    isDark={isDark}
                  />
                }
                cursor={{
                  stroke: '#0D9488',
                  strokeWidth: 2,
                  strokeDasharray: '4 3',
                  opacity: 0.5,
                }}
              />

              <Area
                type="monotone"
                dataKey="revenue"
                name="Pendapatan"
                stroke="transparent"
                fill="url(#profit-gradient)"
                isAnimationActive={false}
              />

              <Line
                type="monotone"
                dataKey="revenue"
                name="Pendapatan"
                stroke="#0D9488"
                strokeWidth={isMobile ? 2.5 : 3}
                dot={
                  isMobile
                    ? { r: 3, strokeWidth: 1.5, fill: isDark ? '#111827' : '#ffffff', stroke: '#0D9488' }
                    : { r: 4, strokeWidth: 2, fill: isDark ? '#111827' : '#ffffff', stroke: '#0D9488' }
                }
                activeDot={{
                  r: isMobile ? 5 : 6,
                  fill: '#0D9488',
                  stroke: isDark ? '#1c1917' : '#fff',
                  strokeWidth: 2,
                }}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tip */}
      <p
        className={`mt-3 text-center ${isDark ? 'text-stone-600' : 'text-[#94A3B8] font-medium'}`}
        style={{ fontSize: 10 }}
      >
        {isMobile ? 'Tap titik untuk melihat detail pendapatan' : 'Hover titik untuk melihat pendapatan per tanggal'}
      </p>
    </div>
  );
}