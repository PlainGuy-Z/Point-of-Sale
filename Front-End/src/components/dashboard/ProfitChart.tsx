import type { Transaction } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useMemo, useState } from 'react';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';
import {
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart as RechartsLineChart,
} from 'recharts';

interface ChartData {
  day: number; // 1..N (calendar day)
  dayLabel: string; // "1", "2", ...
  revenue: number;
}

export default function ProfitChart({ transactions }: { transactions: Transaction[] }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { format } = useCurrencyFormatter();

  // Default: current month (calendar)
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
  );

  const data = useMemo<ChartData[]>(() => {
    const [yStr, mStr] = selectedMonth.split('-');
    const year = Number(yStr);
    const monthIndex = Number(mStr) - 1; // 0-11

    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const revenueByDay = new Map<number, number>();

    transactions.forEach((t) => {
      const dt = new Date(t.date);
      if (Number.isNaN(dt.getTime())) return;
      if (dt.getFullYear() !== year || dt.getMonth() !== monthIndex) return;

      const day = dt.getDate(); // 1..N
      revenueByDay.set(day, (revenueByDay.get(day) || 0) + (t.total || 0));
    });

    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      return {
        day,
        dayLabel: String(day),
        revenue: revenueByDay.get(day) || 0,
      };
    });
  }, [transactions, selectedMonth]);

  const monthLabel = useMemo(() => {
    const [yStr, mStr] = selectedMonth.split('-');
    const year = Number(yStr);
    const monthIndex = Number(mStr) - 1;
    const d = new Date(year, monthIndex, 1);
    return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const avgRevenue = data.length ? totalRevenue / data.length : 0;

  return (
    <div
      className={`
        rounded-2xl border p-6 transition-all duration-300
        ${isDark
          ? 'bg-gradient-to-br from-stone-900 to-stone-900 border-stone-800'
          : 'bg-white border-gray-100 shadow-sm'}
      `}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Tren Pendapatan Harian
          </h3>
          <p className={`text-sm mt-1 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            {monthLabel} (format kalender)
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 p-2 rounded-2xl ${isDark ? 'bg-stone-900 border border-stone-800' : 'bg-gray-50 border border-gray-200'}`}>
            <label className={`text-xs font-bold ${isDark ? 'text-stone-300' : 'text-gray-700'}`}>
              Bulan
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className={`text-xs font-bold rounded-xl px-2 py-1 outline-none ${
                isDark ? 'bg-stone-950 text-stone-200 border border-stone-800' : 'bg-white text-gray-800 border border-gray-200'
              }`}
              aria-label="Pilih bulan"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-stone-900/50 border-stone-800' : 'bg-amber-50 border-amber-100'}`}>
          <p className={`text-xs font-medium mb-1 ${isDark ? 'text-stone-400' : 'text-amber-700'}`}>
            Total Pendapatan (bulan ini)
          </p>
          <p className={`text-xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {format(totalRevenue)}
          </p>
          <p className={`text-xs ${isDark ? 'text-stone-500' : 'text-gray-600'}`}>
            Rata-rata per hari: {format(avgRevenue)}
          </p>
        </div>

        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-stone-900/50 border-stone-800' : 'bg-amber-50 border-amber-100'}`}>
          <p className={`text-xs font-medium mb-1 ${isDark ? 'text-stone-400' : 'text-amber-700'}`}>
            Hari tertinggi (bulan ini)
          </p>
          <p className={`text-xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {format(Math.max(...data.map((d) => d.revenue), 0))}
          </p>
          <p className={`text-xs ${isDark ? 'text-stone-500' : 'text-gray-600'}`}>
            Puncak pendapatan harian
          </p>
        </div>

        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-stone-900/50 border-stone-800' : 'bg-green-50 border-green-100'}`}>
          <p className={`text-xs font-medium mb-1 ${isDark ? 'text-stone-400' : 'text-green-700'}`}>
            Hari transaksi (bulan ini)
          </p>
          <p className={`text-xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {data.filter((d) => d.revenue > 0).length}
          </p>
          <p className={`text-xs ${isDark ? 'text-stone-500' : 'text-gray-600'}`}>
            Hari yang ada penjualan
          </p>
        </div>
      </div>

      <div className="relative">
        {data.length === 0 ? (
          <div className="h-48 flex items-center justify-center">
            <p className={`text-stone-500 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              Tidak ada data untuk periode ini
            </p>
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid stroke={isDark ? '#374151' : '#e5e7eb'} strokeDasharray="3 3" />
                <XAxis
                  dataKey="dayLabel"
                  tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: isDark ? '#4b5563' : '#e5e7eb' }}
                  tickLine={{ stroke: isDark ? '#4b5563' : '#e5e7eb' }}
                  interval="preserveStartEnd"
                  minTickGap={8}
                  height={30}
                />
                <YAxis
                  tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: isDark ? '#4b5563' : '#e5e7eb' }}
                  tickLine={{ stroke: isDark ? '#4b5563' : '#e5e7eb' }}
                  tickFormatter={(v) => format(Number(v))}
                  width={88}
                />
                <Tooltip
                  formatter={(value: any) => format(Number(value))}
                  labelFormatter={(label) => `Tanggal: ${label} ${monthLabel}`}
                  contentStyle={{
                    background: isDark ? '#111827' : '#ffffff',
                    border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                    borderRadius: 12,
                    color: isDark ? '#e5e7eb' : '#111827',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Pendapatan"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: isDark ? '#111827' : '#ffffff' }}
                  activeDot={{ r: 6 }}
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className={`mt-4 text-xs text-center ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
        Tips: hover titik untuk melihat pendapatan per tanggal.
      </div>
    </div>
  );
}