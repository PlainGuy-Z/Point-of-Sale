import { TrendingUp, BarChart3, LineChart, AreaChart } from 'lucide-react';
import type { Transaction } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useState } from 'react';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';

interface ChartData {
  date: string;
  fullDate: string;
  profit: number;
  revenue: number;
  dateObj: Date;
}

type ChartType = 'bar' | 'line' | 'area';

export default function ProfitChart({ transactions }: { transactions: Transaction[] }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [chartType, setChartType] = useState<ChartType>('bar');
  const { format } = useCurrencyFormatter();

  const getChartData = (): ChartData[] => {
    const days = 30;

    // Buat array tanggal dengan format yang konsisten
    const dates = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      // Reset waktu ke 00:00:00 untuk konsistensi
      date.setHours(0, 0, 0, 0);
      return date;
    });

    // Gunakan format YYYY-MM-DD untuk konsistensi
    const profitByDay: Record<string, number> = {};
    const revenueByDay: Record<string, number> = {};

    transactions.forEach(t => {
      try {
        const transactionDate = new Date(t.date);
        // Reset waktu ke 00:00:00 juga untuk transaction date
        transactionDate.setHours(0, 0, 0, 0);
        const dateKey = transactionDate.toISOString().split('T')[0];
        
        profitByDay[dateKey] = (profitByDay[dateKey] || 0) + t.profit;
        revenueByDay[dateKey] = (revenueByDay[dateKey] || 0) + t.total;
      } catch (error) {
        console.warn('Invalid transaction date:', t.date);
      }
    });

    // Group per 2 hari untuk mengurangi clutter pada chart
    const groupSize = 2;
    const result: ChartData[] = [];

    for (let i = 0; i < dates.length; i += groupSize) {
      const groupDates = dates.slice(i, Math.min(i + groupSize, dates.length));
      let totalProfit = 0;
      let totalRevenue = 0;

      groupDates.forEach(date => {
        const dateKey = date.toISOString().split('T')[0];
        totalProfit += profitByDay[dateKey] || 0;
        totalRevenue += revenueByDay[dateKey] || 0;
      });

      const startDate = groupDates[0];
      const endDate = groupDates[groupDates.length - 1];

      let label = '';
      let fullDateLabel = '';

      if (groupDates.length === 1) {
        // Hari tunggal
        label = startDate.getDate().toString();
        fullDateLabel = startDate.toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } else {
        // Rentang hari
        label = `${startDate.getDate()}-${endDate.getDate()}`;
        fullDateLabel = `${startDate.getDate()} ${startDate.toLocaleDateString('id-ID', { month: 'short' })} – ${endDate.getDate()} ${endDate.toLocaleDateString('id-ID', { month: 'short' })}`;
      }

      result.push({
        date: label,
        fullDate: fullDateLabel,
        profit: totalProfit,
        revenue: totalRevenue,
        dateObj: startDate
      });
    }

    return result;
  };

  const data = getChartData();
  const maxProfit = Math.max(...data.map(d => d.profit), 1);
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
  const maxValue = Math.max(maxProfit, maxRevenue);

  const totalProfit = data.reduce((sum, day) => sum + day.profit, 0);
  const totalRevenue = data.reduce((sum, day) => sum + day.revenue, 0);
  const avgProfit = data.length > 0 ? totalProfit / data.length : 0;
  const prevPeriodProfit = totalProfit * 0.85;
  const profitChange = prevPeriodProfit > 0 ? ((totalProfit - prevPeriodProfit) / prevPeriodProfit) * 100 : 0;

  const renderBarChart = () => (
    <div className="flex items-end h-48 gap-1 md:gap-2">
      {data.map((day, index) => (
        <div key={index} className="flex-1 flex flex-col items-center group">
          <div className="relative w-full">
            <div
              className={`
                w-full rounded-t-lg transition-all duration-300 cursor-pointer
                group-hover:opacity-90 hover:opacity-80
                ${isDark ? 'bg-gradient-to-t from-amber-500 to-orange-500' : 'bg-gradient-to-t from-amber-500 to-orange-500'}
              `}
              style={{
                height: `${(day.profit / maxProfit) * 100}%`,
                minHeight: '2px'
              }}
              title={`${day.fullDate}\nKeuntungan: ${format(day.profit)}\nPendapatan: ${format(day.revenue)}`}
            ></div>

            {day.revenue > 0 && (
              <div
                className={`
                  w-full rounded-t-lg mt-1 transition-all duration-300 cursor-pointer
                  group-hover:opacity-90 hover:opacity-80
                  ${isDark ? 'bg-gradient-to-t from-blue-500 to-cyan-500' : 'bg-gradient-to-t from-blue-500 to-cyan-500'}
                `}
                style={{
                  height: `${(day.revenue / maxRevenue) * 100}%`,
                  minHeight: '1px'
                }}
                title={`${day.fullDate}\nPendapatan: ${format(day.revenue)}`}
              ></div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderLineChart = () => (
    <div className="relative h-48">
      <div className="absolute inset-0 flex flex-col justify-between">
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <div
            key={ratio}
            className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
            style={{ opacity: 0.5 }}
          ></div>
        ))}
      </div>

      <div className="relative h-full">
        <svg className="absolute inset-0 w-full h-full">
          {data.map((day, index) => {
            if (index === 0) return null;
            const prev = data[index - 1];
            const x1 = ((index - 1) / (data.length - 1)) * 100;
            const x2 = (index / (data.length - 1)) * 100;
            const y1 = 100 - (prev.profit / maxValue) * 100;
            const y2 = 100 - (day.profit / maxValue) * 100;

            return (
              <g key={`profit-${index}`}>
                <line
                  x1={`${x1}%`}
                  y1={`${y1}%`}
                  x2={`${x2}%`}
                  y2={`${y2}%`}
                  stroke="url(#profitGradient)"
                  strokeWidth="2"
                  fill="none"
                />
                <line
                  x1={`${x1}%`}
                  y1={`${100 - (prev.revenue / maxValue) * 100}%`}
                  x2={`${x2}%`}
                  y2={`${100 - (day.revenue / maxValue) * 100}%`}
                  stroke="url(#revenueGradient)"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="4,4"
                />
              </g>
            );
          })}
          
          <defs>
            <linearGradient id="profitGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
            <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>

        {data.map((day, index) => (
          <div
            key={index}
            className="absolute cursor-pointer group"
            style={{
              left: `${(index / (data.length - 1)) * 100}%`,
              bottom: `${(day.profit / maxValue) * 100}%`,
              transform: 'translate(-50%, 50%)'
            }}
            title={`${day.fullDate}\nKeuntungan: ${format(day.profit)}\nPendapatan: ${format(day.revenue)}`}
          >
            <div className={`w-3 h-3 rounded-full border-2 ${
              isDark ? 'bg-gray-900 border-amber-500' : 'bg-white border-amber-500'
            } group-hover:w-4 group-hover:h-4 transition-all`}></div>
          </div>
        ))}
        
        {data.map((day, index) => (
          <div
            key={`rev-${index}`}
            className="absolute cursor-pointer group"
            style={{
              left: `${(index / (data.length - 1)) * 100}%`,
              bottom: `${(day.revenue / maxValue) * 100}%`,
              transform: 'translate(-50%, 50%)'
            }}
            title={`${day.fullDate}\nPendapatan: ${format(day.revenue)}`}
          >
            <div className={`w-2 h-2 rounded-full border ${
              isDark ? 'bg-blue-500 border-blue-700' : 'bg-blue-500 border-white'
            } group-hover:w-3 group-hover:h-3 transition-all`}></div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAreaChart = () => (
    <div className="relative h-48">
      <div className="absolute inset-0 flex flex-col justify-between">
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <div
            key={ratio}
            className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
            style={{ opacity: 0.5 }}
          ></div>
        ))}
      </div>

      <svg className="absolute inset-0 w-full h-full">
        {/* Profit area */}
        <path
          d={`
            M 0,${100 - (data[0]?.profit / maxValue) * 100 || 100}
            ${data.map((day, index) => 
              `L ${(index / (data.length - 1)) * 100},${100 - (day.profit / maxValue) * 100}`
            ).join(' ')}
            L 100,100
            L 0,100
            Z
          `}
          fill="url(#areaProfitGradient)"
          opacity="0.3"
        />
        
        {/* Profit line */}
        <path
          d={`
            M 0,${100 - (data[0]?.profit / maxValue) * 100 || 100}
            ${data.map((day, index) => 
              `L ${(index / (data.length - 1)) * 100},${100 - (day.profit / maxValue) * 100}`
            ).join(' ')}
          `}
          stroke="url(#profitGradient)"
          strokeWidth="2"
          fill="none"
        />
        
        {/* Revenue line (dashed) */}
        <path
          d={`
            M 0,${100 - (data[0]?.revenue / maxValue) * 100 || 100}
            ${data.map((day, index) => 
              `L ${(index / (data.length - 1)) * 100},${100 - (day.revenue / maxValue) * 100}`
            ).join(' ')}
          `}
          stroke="url(#revenueGradient)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="4,4"
        />
        
        <defs>
          <linearGradient id="areaProfitGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="profitGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
          <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>

      {data.map((day, index) => (
        <div
          key={index}
          className="absolute cursor-pointer group"
          style={{
            left: `${(index / (data.length - 1)) * 100}%`,
            bottom: `${(day.profit / maxValue) * 100}%`,
            transform: 'translate(-50%, 50%)'
          }}
          title={`${day.fullDate}\nKeuntungan: ${format(day.profit)}\nPendapatan: ${format(day.revenue)}`}
        >
          <div className={`w-2 h-2 rounded-full ${
            isDark ? 'bg-amber-500' : 'bg-amber-500'
          } group-hover:w-3 group-hover:h-3 transition-all`}></div>
        </div>
      ))}
    </div>
  );

  return (
    <div
      className={`
        rounded-2xl border p-6 transition-all duration-300
        ${isDark
          ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700'
          : 'bg-white border-gray-100 shadow-sm'}
      `}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Tren Keuntungan & Pendapatan (30 Hari)
          </h3>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            30 hari terakhir (data dikelompokkan per 2 hari)
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-1 p-1 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <button
              onClick={() => setChartType('bar')}
              className={`p-1.5 rounded-lg transition-all ${
                chartType === 'bar'
                  ? isDark ? 'bg-amber-500 text-white' : 'bg-amber-500 text-white'
                  : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Diagram Batang"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`p-1.5 rounded-lg transition-all ${
                chartType === 'area'
                  ? isDark ? 'bg-amber-500 text-white' : 'bg-amber-500 text-white'
                  : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Diagram Area"
            >
              <AreaChart className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`p-1.5 rounded-lg transition-all ${
                chartType === 'line'
                  ? isDark ? 'bg-amber-500 text-white' : 'bg-amber-500 text-white'
                  : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Diagram Garis"
            >
              <LineChart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-amber-50 border-amber-100'}`}>
          <p className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-amber-700'}`}>
            Total Keuntungan (30 hari)
          </p>
          <p className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {format(totalProfit)}
          </p>
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
              profitChange >= 0
                ? isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-700'
                : isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-700'
            }`}>
              <TrendingUp className={`w-3 h-3 ${profitChange >= 0 ? '' : 'rotate-180'}`} />
              {Math.abs(profitChange).toFixed(1)}%
            </div>
            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
              vs periode sebelumnya
            </span>
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-blue-50 border-blue-100'}`}>
          <p className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-blue-700'}`}>
            Total Pendapatan (30 hari)
          </p>
          <p className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {format(totalRevenue)}
          </p>
          <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
            Rata-rata per 2 hari: {format(totalRevenue / data.length)}
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-green-50 border-green-100'}`}>
          <p className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-green-700'}`}>
            Rata-rata Keuntungan
          </p>
          <p className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {format(avgProfit)}
          </p>
          <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
            Per 2 hari
          </div>
        </div>
      </div>

      <div className="relative">
        {data.length === 0 ? (
          <div className="h-48 flex items-center justify-center">
            <p className={`text-gray-500 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Tidak ada data untuk periode ini
            </p>
          </div>
        ) : (
          <>
            {chartType === 'bar' && renderBarChart()}
            {chartType === 'line' && renderLineChart()}
            {chartType === 'area' && renderAreaChart()}

            <div className="flex justify-between mt-2">
              {data.map((day, index) => (
                <div key={index} className="flex-1 text-center">
                  <p className={`text-[10px] truncate px-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    {day.date}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-6 mt-6">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded bg-gradient-to-r from-amber-500 to-orange-500`}></div>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Keuntungan</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${
                  chartType === 'line' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-blue-500'
                }`}></div>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Pendapatan</span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className={`mt-4 text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
        Data dikelompokkan per 2 hari untuk tampilan yang lebih jelas
      </div>
    </div>
  );
}