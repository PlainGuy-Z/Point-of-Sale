import { TrendingUp, TrendingDown, Coffee, Calendar } from 'lucide-react';
import type { Transaction, Product } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';

interface TrendsAnalysisProps {
  transactions: Transaction[];
  products: Product[];
}

export default function TrendsAnalysis({ transactions, products }: TrendsAnalysisProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { format } = useCurrencyFormatter();

  // 1. Hitung Rentang Waktu
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date;
  }).reverse();

  // 2. Kalkulasi Pendapatan Harian
  const dailyRevenue = last14Days.map(date => {
    const dayTransactions = transactions.filter(t => 
      new Date(t.date).toDateString() === date.toDateString()
    );
    return dayTransactions.reduce((sum, t) => sum + t.total, 0);
  });

  // 3. Kalkulasi Tren (Cegah NaN dengan default value)
  const firstHalfAvg = dailyRevenue.slice(0, 7).reduce((a, b) => a + b, 0) / 7;
  const secondHalfAvg = dailyRevenue.slice(7).reduce((a, b) => a + b, 0) / 7;
  
  const revenueTrend = secondHalfAvg > firstHalfAvg ? 'up' : 'down';
  const percentageChange = firstHalfAvg > 0 
    ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 
    : 0;

  // 4. Analisis Kategori
  const categorySales: Record<string, number> = {};
  transactions.forEach(t => {
    t.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        categorySales[product.category] = (categorySales[product.category] || 0) + item.quantity;
      }
    });
  });

  const sortedCategories = Object.entries(categorySales).sort((a, b) => b[1] - a[1]);
  const topCategory = sortedCategories[0];
  const maxRevenue = Math.max(...dailyRevenue, 1);

  return (
    <div className="space-y-6">
      {/* Revenue Trend Card */}
      <div className={`rounded-3xl border p-6 transition-colors ${
        isDark ? 'bg-stone-900/50 border-stone-800' : 'bg-white border-gray-100 shadow-sm'
      }`}>
        <h3 className={`font-black mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Revenue Trend (14 Days)</h3>
        
        {/* Chart with Y-axis */}
        <div className="flex gap-2 mb-6">
          {/* Y-axis labels */}
          <div className="flex flex-col justify-between text-right pr-1 w-16 shrink-0">
            <span className={`text-[10px] font-bold ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
              {format(maxRevenue)}
            </span>
            <span className={`text-[10px] font-bold ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
              {format(Math.round(maxRevenue * 0.5))}
            </span>
            <span className={`text-[10px] font-bold ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
              0
            </span>
          </div>

          {/* Bars with gridlines */}
          <div className="flex-1 relative">
            {/* Gridlines */}
            {[0.25, 0.5, 0.75].map(pct => (
              <div
                key={pct}
                className={`absolute w-full border-t border-dashed ${isDark ? 'border-stone-800/60' : 'border-gray-200/80'}`}
                style={{ bottom: `${pct * 100}%` }}
              />
            ))}
            
            <div className="flex items-end justify-center h-40 gap-1 relative z-10">
              {dailyRevenue.map((revenue, index) => (
                <div
                  key={index}
                  className={`w-full max-w-[12px] rounded-t transition-all duration-300 cursor-pointer hover:opacity-80 ${
                    isDark ? 'bg-amber-500/60 hover:bg-amber-400' : 'bg-gradient-to-t from-amber-500 to-orange-500'
                  }`}
                  style={{ height: `${(revenue / maxRevenue) * 100}%`, minHeight: revenue > 0 ? '2px' : '0' }}
                  title={`Day ${index + 1}: ${format(revenue)}`}
                ></div>
              ))}
            </div>
          </div>
        </div>

        <div className={`flex items-center justify-between pt-4 border-t ${isDark ? 'border-stone-800' : 'border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-2xl ${
              revenueTrend === 'up' 
                ? (isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-600')
                : (isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600')
            }`}>
              {revenueTrend === 'up' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
            <div>
              <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {revenueTrend === 'up' ? 'Revenue Increasing' : 'Revenue Decreasing'}
              </p>
              <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                {revenueTrend === 'up' ? 'Last week better than previous' : 'Performance needs attention'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-black ${revenueTrend === 'up' ? (isDark ? 'text-green-400' : 'text-green-500') : (isDark ? 'text-red-400' : 'text-red-500')}`}>
              {revenueTrend === 'up' ? '+' : ''}{percentageChange.toFixed(1)}%
            </p>
            <p className={`text-sm ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>Week over week</p>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Card */}
        <div className={`rounded-3xl border p-6 ${
          isDark ? 'bg-stone-900/50 border-stone-800' : 'bg-white border-gray-100 shadow-sm'
        }`}>
          <h3 className={`font-black mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Coffee className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
            Top Category
          </h3>
          
          {topCategory ? (
            <div className="space-y-6">
              <div className="text-center">
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-white text-2xl font-black ${
                  isDark ? 'bg-amber-600 shadow-lg shadow-amber-900/20' : 'bg-gradient-to-br from-amber-500 to-orange-500'
                }`}>
                  {topCategory[0].charAt(0)}
                </div>
                <p className={`text-xl font-black mt-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>{topCategory[0]}</p>
                <p className={`${isDark ? 'text-stone-400' : 'text-stone-500'}`}>{topCategory[1]} units sold</p>
              </div>
              
              <div className="space-y-3">
                {sortedCategories.slice(0, 3).map(([category, sales]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className={`text-sm ${isDark ? 'text-stone-300' : 'text-gray-600'}`}>{category}</span>
                    <div className="flex items-center gap-2">
                      <div className={`h-1.5 w-24 rounded-full ${isDark ? 'bg-stone-800' : 'bg-gray-100'}`}>
                        <div 
                          className="h-full bg-amber-500 rounded-full" 
                          style={{ width: `${(sales / topCategory[1]) * 100}%` }}
                        />
                      </div>
                      <span className={`text-sm font-bold min-w-[70px] text-right ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {sales} ({Math.round((sales / topCategory[1]) * 100)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className={`text-center py-10 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>No category data available</p>
          )}
        </div>

        {/* Performance Card */}
        <div className={`rounded-3xl border p-6 ${
          isDark ? 'bg-stone-900/50 border-stone-800' : 'bg-white border-gray-100 shadow-sm'
        }`}>
          <h3 className={`font-black mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Calendar className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
            Day Performance
          </h3>
          <div className="space-y-4">
            {[
              { type: 'Weekday', status: 'Standard', desc: 'More consistent volume', color: 'amber' },
              { type: 'Weekend', status: 'Better', desc: 'Higher average ticket size', color: 'amber' }
            ].map((day) => (
              <div key={day.type} className={`p-4 rounded-2xl border ${
                isDark ? 'bg-stone-950/50 border-stone-800' : 'bg-gray-50 border-gray-100'
              }`}>
                <div className="flex justify-between items-center mb-1">
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{day.type}</span>
                  <span className={`text-sm font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                    {day.status}
                  </span>
                </div>
                <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-gray-600'}`}>{day.desc}</p>
              </div>
            ))}
          </div>
          
          <div className={`mt-6 p-4 rounded-2xl border ${
            isDark ? 'bg-amber-900/20 border-amber-900/40 text-amber-300' : 'bg-amber-50 border-amber-100 text-amber-800'
          }`}>
            <p className="text-sm flex gap-2">
              <span>💡</span>
              <span><strong>Insight:</strong> Consider weekend promotions to boost weekday sales</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}