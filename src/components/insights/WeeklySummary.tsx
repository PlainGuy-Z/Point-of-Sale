import { BarChart3, TrendingUp, DollarSign, Package, Users } from 'lucide-react';
import type { Transaction } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface WeeklySummaryProps {
  transactions: Transaction[];
}

export default function WeeklySummary({ transactions }: WeeklySummaryProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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
    { label: 'Weekly Revenue', value: `Rp ${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'blue' },
    { label: 'Total Transactions', value: totalTransactions.toString(), icon: Package, color: 'green' },
    { label: 'Avg Ticket', value: `Rp ${avgTicket.toLocaleString()}`, icon: TrendingUp, color: 'amber' },
    { label: 'Daily Profit Avg', value: `Rp ${avgProfit.toLocaleString()}`, icon: Users, color: 'purple' },
  ];

  // Map warna manual untuk menghindari dynamic class error di Tailwind
  const getColorClasses = (color: string) => {
    const mapping: Record<string, string> = {
      blue: isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600',
      green: isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-600',
      amber: isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-600',
      purple: isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-50 text-purple-600',
    };
    return mapping[color];
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statsConfig.map((stat, idx) => (
          <div key={idx} className={`p-4 rounded-lg border transition-colors ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${getColorClasses(stat.color)}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{stat.label}</p>
                <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Daily Breakdown */}
      <div className={`rounded-xl border p-6 transition-colors ${
        isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
      }`}>
        <h3 className="font-semibold mb-6 flex items-center gap-2">
          <BarChart3 className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
          Daily Performance
        </h3>
        
        <div className="space-y-4">
          {weeklyData.map((day, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="w-16">
                <p className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{day.date}</p>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Rp {day.revenue.toLocaleString()}
                  </span>
                  <span className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {day.transactions} trans
                  </span>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div 
                    className={`h-full transition-all duration-500 ${
                      isDark ? 'bg-amber-500/80' : 'bg-gradient-to-r from-amber-500 to-orange-500'
                    }`}
                    style={{ width: `${(day.revenue / Math.max(...weeklyData.map(d => d.revenue), 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Health Indicator */}
        <div className={`mt-8 p-4 rounded-lg border ${
          isDark ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-100'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm lg:text-base">Weekly Health</p>
              <p className={`text-xs lg:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
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