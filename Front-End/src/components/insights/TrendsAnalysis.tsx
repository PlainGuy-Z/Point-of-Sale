import React from 'react';
import { Trash2, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';
import type { WasteResponse } from '../../services/aiApi';

interface TrendsAnalysisProps {
  data: WasteResponse | null;
  isLoading: boolean;
  period: 7 | 14 | 30;
  onPeriodChange: (days: 7 | 14 | 30) => void;
}

export default function TrendsAnalysis({ data, isLoading, period, onPeriodChange }: TrendsAnalysisProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { format } = useCurrencyFormatter();

  const periods: (7 | 14 | 30)[] = [7, 14, 30];

  const renderTrendIcon = (trendPercent: number) => {
    if (trendPercent > 5) return <TrendingUp className="w-4 h-4 text-red-500" />; // Worse
    if (trendPercent < -5) return <TrendingDown className="w-4 h-4 text-green-500" />; // Better
    return <Minus className="w-4 h-4 text-gray-400" />; // Stable
  };

  return (
    <div className={`rounded-3xl border flex flex-col h-full ${isDark ? 'bg-stone-900/50 border-stone-800' : 'bg-white border-gray-100 shadow-sm'}`}>
      <div className={`px-6 py-5 border-b ${isDark ? 'border-stone-800' : 'border-gray-100'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Trash2 className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
            <h2 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Analisis Limbah</h2>
          </div>
          
          <div className={`flex p-1 rounded-xl ${isDark ? 'bg-stone-800' : 'bg-gray-100'}`}>
            {periods.map((p) => (
              <button
                key={p}
                onClick={() => onPeriodChange(p)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  period === p
                    ? isDark ? 'bg-stone-700 text-white shadow-sm' : 'bg-white text-gray-900 shadow-sm'
                    : isDark ? 'text-stone-400 hover:text-stone-200' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {p} Hari
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className={`text-xs uppercase ${isDark ? 'bg-stone-800/50 text-stone-400' : 'bg-gray-50 text-gray-500'}`}>
            <tr>
              <th className="px-6 py-4 font-semibold">Produk</th>
              <th className="px-6 py-4 font-semibold text-right">Terbuang</th>
              <th className="px-6 py-4 font-semibold text-right">Terjual</th>
              <th className="px-6 py-4 font-semibold text-right">Rasio</th>
              <th className="px-6 py-4 font-semibold text-right">Kerugian</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-stone-800' : 'divide-gray-100'}`}>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={5} className="px-6 py-4">
                    <div className={`h-6 rounded animate-pulse ${isDark ? 'bg-stone-800' : 'bg-gray-100'}`} />
                  </td>
                </tr>
              ))
            ) : !data || data.top_waste_products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <p className={isDark ? 'text-stone-500' : 'text-gray-400'}>Tidak ada data limbah untuk periode ini.</p>
                </td>
              </tr>
            ) : (
              data.top_waste_products.map((item, idx) => {
                const isHighWaste = item.waste_ratio > 0.2;
                return (
                  <tr 
                    key={idx}
                    className={`transition-colors hover:bg-black/5 ${
                      isHighWaste 
                        ? isDark ? 'bg-red-500/10' : 'bg-red-50' 
                        : ''
                    }`}
                  >
                    <td className={`px-6 py-4 font-medium ${isDark ? 'text-stone-200' : 'text-gray-900'}`}>
                      {item.name}
                    </td>
                    <td className={`px-6 py-4 text-right ${isDark ? 'text-stone-300' : 'text-gray-600'}`}>
                      {item.waste_qty}
                    </td>
                    <td className={`px-6 py-4 text-right ${isDark ? 'text-stone-300' : 'text-gray-600'}`}>
                      {item.sold_qty}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        isHighWaste 
                          ? isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
                          : isDark ? 'bg-stone-800 text-stone-400' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {(item.waste_ratio * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-right font-medium ${isHighWaste ? 'text-red-500' : isDark ? 'text-stone-300' : 'text-gray-700'}`}>
                      {format(item.waste_cost)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Summary */}
      {!isLoading && data && (
        <div className={`px-6 py-4 border-t flex items-center justify-between ${isDark ? 'border-stone-800 bg-stone-900' : 'border-gray-100 bg-gray-50'}`}>
          <div className="flex flex-col">
            <span className={`text-xs ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>Total Kerugian</span>
            <span className={`text-lg font-black ${isDark ? 'text-red-400' : 'text-red-600'}`}>
              {format(data.total_waste_cost)}
            </span>
          </div>
          
          <div className={`flex items-center gap-2 text-sm font-bold ${
            data.trend_percentage > 5 ? 'text-red-500' : data.trend_percentage < -5 ? 'text-green-500' : isDark ? 'text-stone-400' : 'text-gray-500'
          }`}>
            {renderTrendIcon(data.trend_percentage)}
            <span>
              {data.trend_percentage > 0 ? '+' : ''}{data.trend_percentage}%
            </span>
            <span className={`text-xs font-normal ml-1 ${isDark ? 'text-stone-500' : 'text-gray-400'}`}>vs sblm</span>
          </div>
        </div>
      )}
    </div>
  );
}