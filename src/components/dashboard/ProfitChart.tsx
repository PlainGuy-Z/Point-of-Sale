import { TrendingUp, BarChart3, LineChart, AreaChart } from 'lucide-react';
import type { Transaction } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useState } from 'react';

interface ChartData {
  date: string;
  fullDate: string;
  profit: number;
  revenue: number;
  dateObj: Date;
}

type ChartType = 'bar' | 'line' | 'area';
type TimeRange = '7d' | '30d' | '90d';

export default function ProfitChart({ transactions }: { transactions: Transaction[] }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [chartType, setChartType] = useState<ChartType>('bar');

  // Get appropriate chart type based on time range
  const getDefaultChartType = (range: TimeRange): ChartType => {
    if (range === '7d') return 'bar';
    if (range === '30d') return 'area';
    return 'line'; // 90d
  };

  // Update chart type when time range changes
  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
    setChartType(getDefaultChartType(range));
  };

  // Data untuk chart berdasarkan timeRange
  const getChartData = (): ChartData[] => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    
    // Buat array tanggal dari hari terakhir ke hari pertama
    const dates = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      return date;
    });

    const profitByDay: Record<string, number> = {};
    const revenueByDay: Record<string, number> = {};
    
    transactions.forEach(t => {
      const date = new Date(t.date);
      const dateString = date.toDateString();
      profitByDay[dateString] = (profitByDay[dateString] || 0) + t.profit;
      revenueByDay[dateString] = (revenueByDay[dateString] || 0) + t.total;
    });

    // Untuk 90 hari, group per minggu (7 hari)
    const groupSize = timeRange === '90d' ? 7 : 1;
    
    const result: ChartData[] = [];

    for (let i = 0; i < dates.length; i += groupSize) {
      const groupDates = dates.slice(i, Math.min(i + groupSize, dates.length));
      let totalProfit = 0;
      let totalRevenue = 0;
      
      groupDates.forEach(date => {
        const dateString = date.toDateString();
        totalProfit += profitByDay[dateString] || 0;
        totalRevenue += revenueByDay[dateString] || 0;
      });

      const startDate = groupDates[0];
      const endDate = groupDates[groupDates.length - 1];
      
      let label = '';
      let fullDateLabel = '';
      
      if (timeRange === '7d') {
        // 7 hari: tampilkan nama hari singkat
        label = startDate.toLocaleDateString('id-ID', { weekday: 'short' });
        fullDateLabel = startDate.toLocaleDateString('id-ID', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      } else if (timeRange === '30d') {
        // 30 hari: tampilkan tanggal (1-31) atau range jika grouping
        if (groupSize === 1) {
          label = startDate.getDate().toString();
          fullDateLabel = startDate.toLocaleDateString('id-ID', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
        } else {
          const weekNumber = Math.floor(i / groupSize) + 1;
          label = `M${weekNumber}`;
          fullDateLabel = `${startDate.getDate()} ${startDate.toLocaleDateString('id-ID', { month: 'short' })} - ${endDate.getDate()} ${endDate.toLocaleDateString('id-ID', { month: 'short' })}`;
        }
      } else {
        // 90 hari: tampilkan per minggu
        const weekNumber = Math.floor(i / groupSize) + 1;
        label = `M${weekNumber}`;
        fullDateLabel = `Minggu ${weekNumber}: ${startDate.getDate()} ${startDate.toLocaleDateString('id-ID', { month: 'short' })} - ${endDate.getDate()} ${endDate.toLocaleDateString('id-ID', { month: 'short' })}`;
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

  // Calculate summary
  const totalProfit = data.reduce((sum, day) => sum + day.profit, 0);
  const totalRevenue = data.reduce((sum, day) => sum + day.revenue, 0);
  const avgProfit = data.length > 0 ? totalProfit / data.length : 0;
  const prevPeriodProfit = totalProfit * 0.85;
  const profitChange = prevPeriodProfit > 0 ? ((totalProfit - prevPeriodProfit) / prevPeriodProfit) * 100 : 0;

  // Render bar chart
  const renderBarChart = () => (
    <div className="flex items-end h-48 gap-1 md:gap-2">
      {data.map((day, index) => (
        <div key={index} className="flex-1 flex flex-col items-center group">
          <div className="relative">
            {/* Profit Bar */}
            <div 
              className={`
                w-full rounded-t-lg transition-all duration-300 cursor-pointer
                group-hover:opacity-90
                ${isDark 
                  ? 'bg-gradient-to-t from-amber-500 to-orange-500' 
                  : 'bg-gradient-to-t from-amber-500 to-orange-500'
                }
              `}
              style={{ 
                height: `${(day.profit / maxProfit) * 80}%`,
                minHeight: '2px'
              }}
              title={`${day.fullDate}\nProfit: Rp ${day.profit.toLocaleString()}`}
            ></div>
            
            {/* Revenue Bar */}
            {day.revenue > 0 && (
              <div 
                className={`
                  w-full rounded-t-lg mt-1 transition-all duration-300 cursor-pointer
                  group-hover:opacity-90
                  ${isDark 
                    ? 'bg-gradient-to-t from-blue-500 to-cyan-500' 
                    : 'bg-gradient-to-t from-blue-500 to-cyan-500'
                  }
                `}
                style={{ 
                  height: `${(day.revenue / maxRevenue) * 40}%`,
                  minHeight: '1px'
                }}
                title={`Revenue: Rp ${day.revenue.toLocaleString()}`}
              ></div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  // Render line chart
  const renderLineChart = () => {
    const pointsProfit = data.map((day, index) => ({
      x: (index / (data.length - 1)) * 100,
      y: (day.profit / maxValue) * 100
    }));

    const pointsRevenue = data.map((day, index) => ({
      x: (index / (data.length - 1)) * 100,
      y: (day.revenue / maxValue) * 100
    }));

    const createPath = (points: Array<{x: number, y: number}>) => {
      if (points.length < 2) return '';
      
      let path = `M ${points[0].x}% ${100 - points[0].y}%`;
      
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const controlX = (prev.x + curr.x) / 2;
        path += ` C ${controlX}% ${100 - prev.y}%, ${controlX}% ${100 - curr.y}%, ${curr.x}% ${100 - curr.y}%`;
      }
      
      return path;
    };

    return (
      <div className="h-48 relative">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y, i) => (
            <line
              key={i}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke={isDark ? '#374151' : '#e5e7eb'}
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
          ))}
          
          {/* Profit line */}
          <path
            d={createPath(pointsProfit)}
            fill="none"
            stroke="url(#profitGradient)"
            strokeWidth="2"
            className="drop-shadow-sm"
          />
          
          {/* Revenue line */}
          <path
            d={createPath(pointsRevenue)}
            fill="none"
            stroke="url(#revenueGradient)"
            strokeWidth="2"
            className="drop-shadow-sm"
          />
          
          {/* Area under profit line */}
          <path
            d={`${createPath(pointsProfit)} L 100% 100% L 0% 100% Z`}
            fill="url(#profitArea)"
            fillOpacity="0.2"
          />
          
          {/* Area under revenue line */}
          <path
            d={`${createPath(pointsRevenue)} L 100% 100% L 0% 100% Z`}
            fill="url(#revenueArea)"
            fillOpacity="0.1"
          />
          
          {/* Data points */}
          {pointsProfit.map((point, index) => (
            <g key={index} className="group">
              <circle
                cx={`${point.x}%`}
                cy={`${100 - point.y}%`}
                r="2"
                fill={isDark ? '#fbbf24' : '#f59e0b'}
                className="cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
              />
              <circle
                cx={`${point.x}%`}
                cy={`${100 - point.y}%`}
                r="4"
                fill="transparent"
                className="cursor-pointer"
              />
            </g>
          ))}
          
          {/* Gradients */}
          <defs>
            <linearGradient id="profitGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={isDark ? '#fbbf24' : '#f59e0b'} />
              <stop offset="100%" stopColor={isDark ? '#fb923c' : '#ea580c'} />
            </linearGradient>
            <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={isDark ? '#60a5fa' : '#3b82f6'} />
              <stop offset="100%" stopColor={isDark ? '#22d3ee' : '#06b6d4'} />
            </linearGradient>
            <linearGradient id="profitArea" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={isDark ? '#fbbf24' : '#f59e0b'} stopOpacity="0.3" />
              <stop offset="100%" stopColor={isDark ? '#fbbf24' : '#f59e0b'} stopOpacity="0" />
            </linearGradient>
            <linearGradient id="revenueArea" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={isDark ? '#60a5fa' : '#3b82f6'} stopOpacity="0.2" />
              <stop offset="100%" stopColor={isDark ? '#60a5fa' : '#3b82f6'} stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  };

  // Render area chart (combination of bar and line)
  const renderAreaChart = () => (
    <div className="h-48 relative">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((y, i) => (
          <line
            key={i}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke={isDark ? '#374151' : '#e5e7eb'}
            strokeWidth="0.5"
            strokeDasharray="2,2"
          />
        ))}
        
        {/* Create area paths */}
        {data.map((day, index) => {
          const x = (index / (data.length - 1)) * 100;
          const profitHeight = (day.profit / maxValue) * 100;
          const revenueHeight = (day.revenue / maxValue) * 100;
          const barWidth = 100 / data.length;
          
          return (
            <g key={index}>
              {/* Profit area bar */}
              <rect
                x={`${x}%`}
                y={`${100 - profitHeight}%`}
                width={`${barWidth * 0.8}%`}
                height={`${profitHeight}%`}
                fill="url(#profitBarGradient)"
                rx="2"
                className="transition-all duration-300 hover:opacity-90"
              />
              
              {/* Revenue line point */}
              <circle
                cx={`${x + barWidth * 0.4}%`}
                cy={`${100 - revenueHeight}%`}
                r="3"
                fill={isDark ? '#3b82f6' : '#2563eb'}
                className="transition-all duration-300"
              />
              
              {/* Connect revenue points with line */}
              {index < data.length - 1 && (
                <line
                  x1={`${x + barWidth * 0.4}%`}
                  y1={`${100 - revenueHeight}%`}
                  x2={`${x + barWidth * 1.4}%`}
                  y2={`${100 - (data[index + 1].revenue / maxValue) * 100}%`}
                  stroke={isDark ? '#3b82f6' : '#2563eb'}
                  strokeWidth="1.5"
                  strokeDasharray="3,2"
                />
              )}
            </g>
          );
        })}
        
        {/* Gradients */}
        <defs>
          <linearGradient id="profitBarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isDark ? '#fbbf24' : '#f59e0b'} />
            <stop offset="100%" stopColor={isDark ? '#fb923c' : '#ea580c'} />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );

  return (
    <div className={`
      rounded-2xl border p-6 transition-all duration-300
      ${isDark 
        ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' 
        : 'bg-white border-gray-100 shadow-sm'
      }
    `}>
      {/* Header dengan controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Profit & Revenue Trend
          </h3>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Last {timeRange === '7d' ? '7 days' : timeRange === '30d' ? '30 days' : '90 days'}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Chart Type Selector */}
          <div className={`flex items-center gap-1 p-1 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <button
              onClick={() => setChartType('bar')}
              className={`p-1.5 rounded-lg transition-all ${
                chartType === 'bar'
                  ? isDark ? 'bg-amber-500 text-white' : 'bg-amber-500 text-white'
                  : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Bar Chart"
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
              title="Area Chart"
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
              title="Line Chart"
            >
              <LineChart className="w-4 h-4" />
            </button>
          </div>
          
          {/* Time Range Selector */}
          <div className={`flex items-center gap-1 p-1 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
            {(['7d', '30d', '90d'] as const).map(range => (
              <button
                key={range}
                onClick={() => handleTimeRangeChange(range)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  timeRange === range
                    ? isDark 
                      ? 'bg-amber-500 text-white shadow' 
                      : 'bg-amber-500 text-white shadow-sm'
                    : isDark 
                      ? 'text-gray-400 hover:text-white' 
                      : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards - VERSI DIPERBAIKI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className={`p-4 rounded-xl border ${isDark 
          ? 'bg-gray-800/50 border-gray-700' 
          : 'bg-amber-50 border-amber-100'
        }`}>
          <p className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-amber-700'}`}>
            Total Profit
          </p>
          <p className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Rp {totalProfit.toLocaleString()}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                profitChange >= 0
                  ? isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-700'
                  : isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-700'
              }`}>
                <TrendingUp className={`w-3 h-3 ${profitChange >= 0 ? '' : 'rotate-180'}`} />
                {Math.abs(profitChange).toFixed(1)}%
              </div>
            </div>
            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
              vs previous
            </span>
          </div>
        </div>
        
        <div className={`p-4 rounded-xl border ${isDark 
          ? 'bg-gray-800/50 border-gray-700' 
          : 'bg-blue-50 border-blue-100'
        }`}>
          <p className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-blue-700'}`}>
            Total Revenue
          </p>
          <p className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Rp {totalRevenue.toLocaleString()}
          </p>
          <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
            {data.length} {timeRange === '7d' ? 'days' : timeRange === '30d' ? 'days' : 'weeks'} average
          </div>
        </div>
        
        <div className={`p-4 rounded-xl border ${isDark 
          ? 'bg-gray-800/50 border-gray-700' 
          : 'bg-green-50 border-green-100'
        }`}>
          <p className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-green-700'}`}>
            Avg Daily Profit
          </p>
          <p className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Rp {avgProfit.toLocaleString()}
          </p>
          <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
            Per {timeRange === '7d' ? 'day' : timeRange === '30d' ? 'day' : 'week'} average
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="relative">
        {data.length === 0 ? (
          <div className="h-48 flex items-center justify-center">
            <p className={`text-gray-500 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              No data available for this period
            </p>
          </div>
        ) : (
          <>
            {/* Render selected chart type */}
            {chartType === 'bar' && renderBarChart()}
            {chartType === 'line' && renderLineChart()}
            {chartType === 'area' && renderAreaChart()}
            
            {/* X-axis labels */}
            <div className="flex justify-between mt-2">
              {data.map((day, index) => (
                <div key={index} className="flex-1 text-center">
                  <p className={`
                    text-[10px] truncate px-1
                    ${isDark ? 'text-gray-500' : 'text-gray-500'}
                  `}>
                    {day.date}
                  </p>
                </div>
              ))}
            </div>
            
            {/* Chart Legend */}
            <div className="flex items-center justify-center gap-6 mt-6">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${
                  chartType === 'line' || chartType === 'area' 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
                    : 'bg-gradient-to-r from-amber-500 to-orange-500'
                }`}></div>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Profit</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${
                  chartType === 'line' 
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                    : chartType === 'area'
                    ? 'bg-blue-500'
                    : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                }`}></div>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Revenue</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Chart Info */}
      <div className={`mt-4 text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
        {timeRange === '7d' && 'Daily data for the past 7 days'}
        {timeRange === '30d' && 'Daily data grouped by date'}
        {timeRange === '90d' && 'Weekly data for the past 90 days'}
      </div>
    </div>
  );
}