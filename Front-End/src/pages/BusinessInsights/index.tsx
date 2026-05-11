import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { aiApi } from '../../services/aiApi';
import type { ForecastResponse, AlertsResponse, WasteResponse, SummaryResponse } from '../../services/aiApi';

import WeeklySummary from '../../components/insights/WeeklySummary';
import TrendsAnalysis from '../../components/insights/TrendsAnalysis';
import AIAssistant from '../../components/insights/AIAssistant';
import InsightCard from '../../components/insights/InsightCard';

export default function BusinessInsights() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [forecast, setForecast] = useState<{ data: ForecastResponse | null; loading: boolean; error: boolean }>({ data: null, loading: true, error: false });
  const [alerts, setAlerts] = useState<{ data: AlertsResponse | null; loading: boolean; error: boolean }>({ data: null, loading: true, error: false });
  const [waste, setWaste] = useState<{ data: WasteResponse | null; loading: boolean; error: boolean }>({ data: null, loading: true, error: false });
  const [summary, setSummary] = useState<{ data: SummaryResponse | null; loading: boolean; error: boolean }>({ data: null, loading: true, error: false });

  const [wastePeriod, setWastePeriod] = useState<7 | 14 | 30>(30);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchInitialData = async () => {
    setForecast(prev => ({ ...prev, loading: true, error: false }));
    setAlerts(prev => ({ ...prev, loading: true, error: false }));
    setWaste(prev => ({ ...prev, loading: true, error: false }));
    setSummary(prev => ({ ...prev, loading: true, error: false }));

    const results = await Promise.allSettled([
      aiApi.fetchForecast(),
      aiApi.fetchInventoryAlerts(),
      aiApi.fetchWasteAnalysis(wastePeriod),
      aiApi.fetchSummary(),
    ]);

    setForecast({
      data: results[0].status === 'fulfilled' ? results[0].value : null,
      loading: false,
      error: results[0].status === 'rejected',
    });

    setAlerts({
      data: results[1].status === 'fulfilled' ? results[1].value : null,
      loading: false,
      error: results[1].status === 'rejected',
    });

    setWaste({
      data: results[2].status === 'fulfilled' ? results[2].value : null,
      loading: false,
      error: results[2].status === 'rejected',
    });

    setSummary({
      data: results[3].status === 'fulfilled' ? results[3].value : null,
      loading: false,
      error: results[3].status === 'rejected',
    });

    setLastUpdated(new Date());
  };

  useEffect(() => {
    fetchInitialData().catch((err) => {
      console.error('Failed to fetch initial data:', err);
    });
  }, []);

  const handleWastePeriodChange = async (newPeriod: 7 | 14 | 30) => {
    setWastePeriod(newPeriod);
    setWaste(prev => ({ ...prev, loading: true, error: false }));
    try {
      const res = await aiApi.fetchWasteAnalysis(newPeriod);
      setWaste({ data: res, loading: false, error: false });
    } catch {
      setWaste({ data: null, loading: false, error: true });
    }
  };

  const renderErrorBoundary = (onRetry: () => void) => (
    <div className={`h-full w-full flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-3xl ${isDark ? 'border-stone-800' : 'border-gray-200'}`}>
      <AlertCircle className={`w-10 h-10 mb-3 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
      <p className={`font-bold mb-1 ${isDark ? 'text-stone-300' : 'text-gray-700'}`}>Gagal Memuat Data</p>
      <p className={`text-sm mb-4 text-center ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>
        Terjadi kesalahan saat mengambil data dari server AI.
      </p>
      <button 
        onClick={onRetry}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-full ${
          isDark ? 'bg-stone-800 text-stone-200 hover:bg-stone-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <RefreshCw className="w-4 h-4" /> Coba Lagi
      </button>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-[1600px] mx-auto pb-10">
      {/* Header */}
      <div className={`rounded-3xl border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isDark ? 'bg-stone-900/50 border-stone-800' : 'bg-white border-gray-100 shadow-sm'}`}>
        <div>
          <h1 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Business <span className="text-amber-500">Insights</span>
          </h1>
          <p className={`text-sm mt-1 flex items-center gap-2 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            Data cerdas yang diolah oleh AI
            <span className="w-1 h-1 rounded-full bg-gray-300 block" />
            Diupdate {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <button 
          onClick={fetchInitialData}
          className={`px-4 py-2 text-sm font-bold rounded-xl border flex items-center gap-2 transition-colors ${
            isDark 
              ? 'bg-stone-800 border-stone-700 text-stone-200 hover:bg-stone-700' 
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 gap-6">
        {/* Top Row: Full Width Forecast */}
        <div className="w-full h-[400px]">
          {forecast.error ? (
            renderErrorBoundary(() => fetchInitialData())
          ) : (
            <WeeklySummary data={forecast.data} isLoading={forecast.loading} />
          )}
        </div>

        {/* Bottom Row: 60/40 Split */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column (60%): AI Assistant */}
          <div className="lg:col-span-3">
            <AIAssistant />
          </div>

          {/* Right Column (40%): Insight Card & Trends Analysis */}
          <div className="lg:col-span-2 space-y-6">
            <div className="h-[288px]">
              {alerts.error ? (
                renderErrorBoundary(() => fetchInitialData())
              ) : (
                <InsightCard data={alerts.data} isLoading={alerts.loading} />
              )}
            </div>
            
            <div className="h-[370px]">
              {waste.error ? (
                renderErrorBoundary(() => handleWastePeriodChange(wastePeriod))
              ) : (
                <TrendsAnalysis 
                  data={waste.data} 
                  isLoading={waste.loading} 
                  period={wastePeriod} 
                  onPeriodChange={handleWastePeriodChange} 
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}