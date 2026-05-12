import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { useTheme } from '../../../contexts/ThemeContext';
import { Flame } from 'lucide-react';
import type { HourlyData, DailyData } from '../useSalesData';

function fmt(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}jt`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}rb`;
  return String(Math.round(n));
}

function CustomTooltip({ active, payload }: any) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div
      style={{
        backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
        border: `1px solid ${isDark ? '#2e2e2e' : '#e5e7eb'}`,
        borderRadius: '12px',
        padding: '10px 14px',
        fontSize: '12px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      }}
    >
      <p style={{ color: isDark ? '#ffffff' : '#111827', fontWeight: 'bold', marginBottom: 4 }}>{d.label}</p>
      <p style={{ color: '#f59e0b' }}>Revenue: Rp {fmt(d.revenue)}</p>
      <p style={{ color: isDark ? '#888888' : '#6b7280' }}>Transaksi: {d.count}</p>
    </div>
  );
}

interface Props {
  isSingleDay: boolean;
  hourlyData: HourlyData[];
  dailyData: DailyData[];
  peakHour: HourlyData | null;
}

export default function SalesChart({ isSingleDay, hourlyData, dailyData, peakHour }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const data = isSingleDay ? hourlyData : dailyData;

  if (data.length === 0) {
    return (
      <div className={`rounded-2xl border ${isDark ? 'border-[#2e2e2e] bg-[#1a1a1a] text-[#888]' : 'border-stone-200 bg-white text-stone-400'} p-6 text-center text-sm`}>
        Belum ada data untuk ditampilkan
      </div>
    );
  }

  return (
    <div className={`${isDark ? 'bg-[#1a1a1a] border-[#2e2e2e]' : 'bg-white border-stone-200'} rounded-2xl border p-6`}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className={`font-bold ${isDark ? 'text-white' : 'text-stone-900'} text-base`}>
            {isSingleDay ? 'Distribusi Penjualan per Jam' : 'Penjualan Harian'}
          </h3>
          <p className={`${isDark ? 'text-[#888]' : 'text-stone-500'} text-sm mt-0.5`}>
            {isSingleDay ? 'Revenue berdasarkan jam operasional' : 'Revenue berdasarkan hari'}
          </p>
        </div>
        {isSingleDay && peakHour && (
          <div className={`${isDark ? 'bg-amber-500/15 border-amber-500/20' : 'bg-amber-50 border-amber-100'} border rounded-xl px-3 py-1.5 flex items-center gap-2`}>
            <Flame size={14} className="text-amber-400" />
            <span className="text-amber-400 text-xs font-bold">
              Jam tersibuk: {peakHour.label} — Rp {fmt(peakHour.revenue)}
            </span>
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#2e2e2e' : '#f1f5f9'} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: isDark ? '#888888' : '#64748b' }}
            axisLine={{ stroke: isDark ? '#2e2e2e' : '#e2e8f0' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={fmt}
            tick={{ fontSize: 11, fill: isDark ? '#888888' : '#64748b' }}
            axisLine={{ stroke: isDark ? '#2e2e2e' : '#e2e8f0' }}
            tickLine={false}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }} />
          <Bar dataKey="revenue" fill="url(#barGradient)" radius={[6, 6, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
