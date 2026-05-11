import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';
import type { ForecastResponse } from '../../services/aiApi';
import { TrendingUp, Clock } from 'lucide-react';

interface WeeklySummaryProps {
  data: ForecastResponse | null;
  isLoading: boolean;
}

const CONFIDENCE_COLORS = {
  high: '#22c55e', // text-green-500
  medium: '#f59e0b', // text-amber-500
  low: '#9ca3af', // text-gray-400
};

export default function WeeklySummary({ data, isLoading }: WeeklySummaryProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { format } = useCurrencyFormatter();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className={`p-4 rounded-xl shadow-xl border ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-gray-100'}`}>
          <p className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{point.day_name}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className={isDark ? 'text-stone-400' : 'text-gray-500'}>Revenue:</span>
              <span className={`font-medium ${isDark ? 'text-stone-200' : 'text-gray-700'}`}>{format(point.predicted_revenue)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className={isDark ? 'text-stone-400' : 'text-gray-500'}>Transactions:</span>
              <span className={`font-medium ${isDark ? 'text-stone-200' : 'text-gray-700'}`}>{point.predicted_transactions}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className={isDark ? 'text-stone-400' : 'text-gray-500'}>Confidence:</span>
              <span className="font-medium capitalize" style={{ color: CONFIDENCE_COLORS[point.confidence as keyof typeof CONFIDENCE_COLORS] }}>
                {point.confidence}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`rounded-3xl border p-6 flex flex-col h-full ${isDark ? 'bg-stone-900/50 border-stone-800' : 'bg-white border-gray-100 shadow-sm'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <TrendingUp className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
            Prediksi 7 Hari
          </h2>
          <p className={`text-sm mt-1 flex items-center gap-1.5 ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>
            <Clock className="w-3.5 h-3.5" />
            Terakhir diupdate: {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        
        {/* Legend */}
        <div className="flex gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className={isDark ? 'text-stone-300' : 'text-gray-600'}>Tinggi</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className={isDark ? 'text-stone-300' : 'text-gray-600'}>Sedang</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <span className={isDark ? 'text-stone-300' : 'text-gray-600'}>Rendah</span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[300px]">
        {isLoading || !data ? (
          <div className="w-full h-full flex items-end justify-between gap-2 px-4 pb-8">
            {[...Array(7)].map((_, i) => (
              <div 
                key={i} 
                className={`w-full rounded-t-sm animate-pulse ${isDark ? 'bg-stone-800' : 'bg-gray-100'}`}
                style={{ height: `${Math.max(20, Math.random() * 100)}%`, animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center">
            <p className={isDark ? 'text-stone-500' : 'text-gray-400'}>Data prediksi tidak tersedia.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis 
                dataKey="day_name" 
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => val.substring(0, 3)}
                stroke={isDark ? '#78716c' : '#9ca3af'}
                fontSize={12}
                dy={10}
              />
              <YAxis 
                hide 
                domain={[0, 'dataMax']}
              />
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ fill: isDark ? '#292524' : '#f3f4f6', radius: 4 }}
              />
              <Bar 
                dataKey="predicted_revenue" 
                radius={[4, 4, 0, 0]}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={CONFIDENCE_COLORS[entry.confidence as keyof typeof CONFIDENCE_COLORS]} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}