import { BarChart3, TrendingUp, DollarSign, Package, Users } from 'lucide-react';
import type { Transaction } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';

interface WeeklySummaryProps {
  transactions: Transaction[];
}

export default function WeeklySummary({ transactions }: WeeklySummaryProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { format } = useCurrencyFormatter();

  // 1. Hitung data mingguan
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date;
  }).reverse();

  const weeklyData = last7Days.map(date => {
    const dayTransactions = transactions.filter(t => 
      new Date(t.date).toDateString() === date.toDateString()
    );
    
    return {
      date: date.toLocaleDateString('id-ID', { weekday: 'short' }),
      revenue: dayTransactions.reduce((sum, t) => sum + t.total, 0),
      transactions: dayTransactions.length,
      profit: dayTransactions.reduce((sum, t) => sum + t.profit, 0),
    };
  });

  // 2. Variabel Statistik Utama
  const totalRevenue = weeklyData.reduce((sum, d) => sum + d.revenue, 0);
  const totalTransactions = weeklyData.reduce((sum, d) => sum + d.transactions, 0);
  const avgTicket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
  const avgProfit = weeklyData.reduce((sum, d) => sum + d.profit, 0) / 7;

  // 3. Konfigurasi Statistik untuk Mapping
  const statsConfig = [
    { label: 'Weekly Revenue', value: format(totalRevenue), icon: DollarSign, color: 'amber' },
    { label: 'Total Transactions', value: totalTransactions.toString(), icon: Package, color: 'green' },
    { label: 'Avg Ticket', value: format(Math.round(avgTicket)), icon: TrendingUp, color: 'amber' },
    { label: 'Daily Profit Avg', value: format(Math.round(avgProfit)), icon: Users, color: 'purple' },
  ];

  // Map warna manual untuk menghindari dynamic class error di Tailwind
  const getColorClasses = (color: string) => {
    const mapping: Record<string, string> = {
      amber: isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-600',
      green: isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-600',
      blue: isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-600',
      purple: isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-50 text-purple-600',
    };
    return mapping[color];
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsConfig.map((stat, idx) => (
          <div key={idx} className={`p-4 rounded-2xl border transition-all duration-200 ${
            isDark ? 'bg-stone-950/50 border-stone-800 hover:bg-stone-950' : 'bg-gray-50 border-gray-100 hover:shadow-sm'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-2xl ${getColorClasses(stat.color)}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className={`text-xs font-medium ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>{stat.label}</p>
                <p className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Daily Breakdown */}
      <div className={`rounded-3xl border p-6 transition-colors ${
        isDark ? 'bg-stone-900/50 border-stone-800' : 'bg-white border-gray-100 shadow-sm'
      }`}>
        <h3 className={`font-black mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <BarChart3 className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
          Daily Performance
        </h3>
        
        <div className="space-y-4">
          {weeklyData.map((day, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="w-16">
                <p className={`font-bold text-sm ${isDark ? 'text-stone-300' : 'text-gray-700'}`}>{day.date}</p>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${isDark ? 'text-stone-300' : 'text-gray-700'}`}>
                    {format(day.revenue)}
                  </span>
                  <span className={`text-xs font-medium ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                    {day.transactions} trans
                  </span>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-stone-800' : 'bg-gray-100'}`}>
                  <div 
                    className={`h-full transition-all duration-500 rounded-full ${
                      isDark ? 'bg-amber-500/80' : 'bg-gradient-to-r from-amber-500 to-orange-500'
                    }`}
                    style={{ width: `${(day.revenue / Math.max(...weeklyData.map(d => d.revenue), 1)) * 100}%` }}
                    title={format(day.revenue)}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Health Indicator */}
        <div className={`mt-8 p-4 rounded-2xl border ${
          isDark ? 'bg-stone-950/50 border-stone-800' : 'bg-gray-50 border-gray-100'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`font-bold text-sm lg:text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>Weekly Health</p>
              <p className={`text-xs lg:text-sm ${isDark ? 'text-stone-400' : 'text-gray-600'}`}>
                {totalRevenue > 5000000 ? 'Excellent' : totalRevenue > 3000000 ? 'Good' : 'Needs Improvement'}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              totalRevenue > 5000000 
                ? (isDark ? 'bg-green-900/40 text-green-400' : 'bg-green-100 text-green-800')
                : totalRevenue > 3000000 
                  ? (isDark ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-100 text-amber-800')
                  : (isDark ? 'bg-red-900/40 text-red-400' : 'bg-red-100 text-red-800')
            }`}>
              {totalRevenue > 5000000 ? '✓ Healthy' : totalRevenue > 3000000 ? '⚠ Moderate' : '✗ Needs Attention'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}