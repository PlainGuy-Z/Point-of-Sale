import React from 'react';
import { AlertTriangle, PackageSearch } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import type { AlertsResponse } from '../../services/aiApi';

interface InsightCardProps {
  data: AlertsResponse | null;
  isLoading: boolean;
}

export default function InsightCard({ data, isLoading }: InsightCardProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const critical = data?.filter((a) => a.urgency === 'critical') || [];
  const warning = data?.filter((a) => a.urgency === 'warning') || [];
  const watch = data?.filter((a) => a.urgency === 'watch') || [];

  // Grouped by urgency in order
  const sortedAlerts = [...critical, ...warning, ...watch];

  const getUrgencyColors = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return isDark ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-red-50 text-red-600 border-red-100';
      case 'warning':
        return isDark ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-600 border-amber-100';
      case 'watch':
      default:
        return isDark ? 'bg-stone-800 text-stone-400 border-stone-700' : 'bg-gray-50 text-gray-500 border-gray-200';
    }
  };

  return (
    <div className={`rounded-3xl border flex flex-col h-full ${isDark ? 'bg-stone-900/50 border-stone-800' : 'bg-white border-gray-100 shadow-sm'}`}>
      <div className={`px-6 py-5 border-b ${isDark ? 'border-stone-800' : 'border-gray-100'} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <AlertTriangle className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
          <h2 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Peringatan Stok</h2>
        </div>
        {!isLoading && data && data.length > 0 && (
          <div className="flex gap-2">
            {critical.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white animate-pulse">
                {critical.length} Critical
              </span>
            )}
            {warning.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                {warning.length} Warning
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`h-16 rounded-xl animate-pulse ${isDark ? 'bg-stone-800' : 'bg-gray-100'}`} />
            ))}
          </div>
        ) : sortedAlerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-80 py-10">
            <PackageSearch className={`w-12 h-12 ${isDark ? 'text-stone-700' : 'text-gray-300'}`} />
            <div>
              <p className={`font-bold ${isDark ? 'text-stone-300' : 'text-gray-700'}`}>Semua stok aman 🎉</p>
              <p className={`text-sm mt-1 ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>Tidak ada produk yang akan segera habis.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedAlerts.map((alert, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${getUrgencyColors(alert.urgency)} ${alert.urgency === 'critical' ? 'animate-pulse' : ''}`}
              >
                <div>
                  <h3 className="font-bold text-sm">{alert.name}</h3>
                  <p className="text-xs opacity-80 mt-1">
                    Stok sisa: <span className="font-bold">{alert.current_stock}</span> • ADU: {alert.adu}/hari
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs opacity-80 mb-1">Habis dalam</p>
                  <p className="font-black text-lg">{alert.days_to_stockout} Hari</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}