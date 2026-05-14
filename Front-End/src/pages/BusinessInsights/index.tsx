import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, AlertCircle, BarChart3, LayoutDashboard, Bot, TrendingUp, ChevronLeft, ChevronRight, Maximize, Minimize } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { aiApi } from '../../services/aiApi';
import type { ForecastResponse, WasteResponse, SummaryResponse } from '../../services/aiApi';

import StatCards from './components/StatCards';
import RevenueChart from './components/RevenueChart';
import WastePanel from './components/WastePanel';
import ShiftPanel from './components/ShiftPanel';
import AIChatPanel from './components/AIChatPanel';
import MenuMatrix from './components/MenuMatrix';

// ─── Hooks ────────────────────────────────────────────────────────────────────

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface DataSlice<T> {
  data: T | null;
  loading: boolean;
  error: boolean;
}

function initSlice<T>(): DataSlice<T> {
  return { data: null, loading: true, error: false };
}

type MobileTab = 'metrics' | 'ai' | 'charts';

// ─── Panel Carousel (WastePanel + ShiftPanel on mobile) ───────────────────────

interface PanelCarouselProps {
  waste: DataSlice<WasteResponse>;
  summary: DataSlice<SummaryResponse>;
  onRetry: () => void;
  isDark: boolean;
}

function PanelCarousel({ waste, summary, onRetry, isDark }: PanelCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const GAP = 12;

  const scrollTo = (index: number) => {
    if (!scrollRef.current) return;
    const cardPx = scrollRef.current.clientWidth * 0.85 + GAP;
    scrollRef.current.scrollTo({ left: index * cardPx, behavior: 'smooth' });
    setActiveIndex(index);
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const cardPx = scrollRef.current.clientWidth * 0.85 + GAP;
    const newIndex = Math.round(scrollRef.current.scrollLeft / cardPx);
    setActiveIndex(Math.min(newIndex, 1));
  };

  const panels = [
    {
      key: 'waste',
      label: 'Analisis Waste',
      content: waste.error
        ? <ErrorBlock onRetry={onRetry} isDark={isDark} compact />
        : <WastePanel waste={waste.data} isLoading={waste.loading} />,
    },
    {
      key: 'shift',
      label: 'Performa Shift',
      content: <ShiftPanel summary={summary.data} isLoading={summary.loading} />,
    },
  ];

  return (
    <div>
      {/* Scroll track */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1 pr-4 no-scrollbar"
      >
        {panels.map((panel) => (
          <div
            key={panel.key}
            className="snap-start shrink-0 w-[85vw] landscape:w-[45vw]"
          >
            {panel.content}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 mt-3">
        <button
          onClick={() => scrollTo(0)}
          disabled={activeIndex === 0}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
            isDark ? 'bg-stone-800 text-stone-300' : 'bg-stone-100 text-stone-700'
          } ${activeIndex === 0 ? 'opacity-30' : 'hover:bg-teal-600 hover:text-white'}`}
        >
          <ChevronLeft size={14} />
        </button>

        {panels.map((panel, i) => (
          <button
            key={panel.key}
            onClick={() => scrollTo(i)}
            className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
              i === activeIndex 
                ? (isDark ? 'bg-amber-500 text-white' : 'bg-teal-600 text-white shadow-md') 
                : (isDark ? 'bg-stone-800 text-stone-500' : 'bg-stone-200 text-stone-500')
            }`}
          >
            {panel.label}
          </button>
        ))}

        <button
          onClick={() => scrollTo(1)}
          disabled={activeIndex === 1}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
            isDark ? 'bg-stone-800 text-stone-300' : 'bg-stone-100 text-stone-700'
          } ${activeIndex === 1 ? 'opacity-30' : 'hover:bg-teal-600 hover:text-white'}`}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BusinessInsights() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isMobile = useIsMobile();

  const [forecast, setForecast] = useState<DataSlice<ForecastResponse>>(initSlice);
  const [waste, setWaste] = useState<DataSlice<WasteResponse>>(initSlice);
  const [summary, setSummary] = useState<DataSlice<SummaryResponse>>(initSlice);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [activeTab, setActiveTab] = useState<MobileTab>('metrics');

  const fetchAll = useCallback(async (bust = false) => {
    setForecast((p) => ({ ...p, loading: true, error: false }));
    setWaste((p) => ({ ...p, loading: true, error: false }));
    setSummary((p) => ({ ...p, loading: true, error: false }));

    const [fRes, wRes, sRes] = await Promise.allSettled([
      aiApi.fetchForecast(),
      aiApi.fetchWasteAnalysis(30),
      aiApi.fetchSummary({ bust }),
    ]);

    setForecast({ data: fRes.status === 'fulfilled' ? fRes.value : null, loading: false, error: fRes.status === 'rejected' });
    setWaste({ data: wRes.status === 'fulfilled' ? wRes.value : null, loading: false, error: wRes.status === 'rejected' });
    setSummary({ data: sRes.status === 'fulfilled' ? sRes.value : null, loading: false, error: sRes.status === 'rejected' });
    setLastUpdated(new Date());
  }, []);

  useEffect(() => { fetchAll(true); }, [fetchAll]);

  const bgClass = isDark ? 'bg-[#0a0908]' : 'bg-[#F8FAFC]';

  // ─── Header ──────────────────────────────────────────────────────────────
  const [isFullscreen, setIsFullscreen] = useState(false);
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const renderHeader = () => (
    <div className={`flex justify-between items-center mb-4 md:mb-6 px-4 py-3 md:px-5 md:py-4 rounded-2xl border ${
      isDark ? 'border-stone-800 bg-stone-900' : 'border-[#E2E8F0] bg-white shadow-sm'
    }`}>
      <div>
        <div className="flex items-center gap-2">
          <BarChart3 size={isMobile ? 18 : 22} className={isDark ? 'text-teal-400' : 'text-teal-600'} />
          <h1 className={`text-lg md:text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
            Business <span className="text-amber-500">Intelligence</span>
          </h1>
        </div>
        <p className={`text-[10px] md:text-xs font-medium mt-1 flex items-center gap-2 ${isDark ? 'text-stone-500' : 'text-[#64748B]'}`}>
          Command center AI
          <span className="w-1 h-1 rounded-full bg-stone-300 dark:bg-stone-600" />
          {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={toggleFullscreen}
          className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-xl border transition-all ${
            isDark ? 'border-stone-800 bg-stone-800 text-stone-300 hover:bg-stone-700' : 'border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC]'
          }`}
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize size={isMobile ? 14 : 18} /> : <Maximize size={isMobile ? 14 : 18} />}
        </button>
        <button
          onClick={() => fetchAll()}
          className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-bold border transition-all ${
            isDark ? 'border-stone-800 bg-stone-800 text-stone-300 hover:bg-stone-700' : 'border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC]'
          }`}
        >
          <RefreshCw size={13} className={summary.loading ? 'animate-spin' : ''} />
          {!isMobile && 'Refresh'}
        </button>
      </div>
    </div>
  );

  // ─── MOBILE LAYOUT ────────────────────────────────────────────────────────
  if (isMobile) {
    const tabs: { id: MobileTab; label: string; icon: React.ReactNode }[] = [
      { id: 'metrics', label: 'Metrik', icon: <LayoutDashboard size={16} /> },
      { id: 'ai', label: 'AI Chat', icon: <Bot size={16} /> },
      { id: 'charts', label: 'Charts', icon: <TrendingUp size={16} /> },
    ];

    return (
      <div className={`${bgClass} min-h-screen flex flex-col font-sans`}>
        <style>{`.no-scrollbar::-webkit-scrollbar{display:none}`}</style>

        {/* Header */}
        <div className="px-4 pt-4">
          {renderHeader()}
        </div>

        {/* Tab bar */}
        <div className={`sticky top-0 z-10 px-4 pb-3 ${bgClass}`}>
          <div className={`flex gap-1 p-1 rounded-2xl border ${
            isDark ? 'bg-stone-900 border-stone-800' : 'bg-[#E2E8F0] border-[#cbd5e1]'
          }`}>
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive 
                      ? (isDark ? 'bg-stone-800 text-amber-500 shadow-lg' : 'bg-white text-teal-700 shadow-sm') 
                      : (isDark ? 'text-stone-500 hover:text-stone-300' : 'text-[#64748B] hover:text-[#0F172A]')
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 px-4 pb-8 overflow-y-auto no-scrollbar">

          {/* ── METRICS TAB ── */}
          {activeTab === 'metrics' && (
            <div className="flex flex-col gap-4">
              {/* StatCards — snap carousel handled inside the component */}
              {summary.error
                ? <ErrorBlock onRetry={fetchAll} isDark={isDark} />
                : <StatCards summary={summary.data} isLoading={summary.loading} isMobile={isMobile} />
              }

              {/* Revenue chart — full width */}
              {forecast.error
                ? <ErrorBlock onRetry={fetchAll} isDark={isDark} />
                : <RevenueChart forecast={forecast.data} summary={summary.data} isLoading={forecast.loading} />
              }

              {/* WastePanel + ShiftPanel — snap carousel */}
              <PanelCarousel
                waste={waste}
                summary={summary}
                onRetry={fetchAll}
                isDark={isDark}
              />
            </div>
          )}

          {/* ── AI TAB ── */}
          {activeTab === 'ai' && (
            <div className="h-[calc(100vh-220px)] flex flex-col">
              <AIChatPanel />
            </div>
          )}

          {/* ── CHARTS TAB ── */}
          {activeTab === 'charts' && (
            <div className="flex flex-col gap-4">
              <MenuMatrix />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── DESKTOP LAYOUT ──────────────────────────────────────────────────────────
  return (
    <div className={`${bgClass} min-h-screen p-6 font-sans`}>
      {renderHeader()}

      <div className="flex gap-6 h-[calc(100vh-160px)]">
        {/* LEFT — scrollable */}
        <div className="flex-[0_0_65%] overflow-y-auto pr-1 no-scrollbar space-y-6">
          {summary.error
            ? <ErrorBlock onRetry={fetchAll} isDark={isDark} />
            : <StatCards summary={summary.data} isLoading={summary.loading} isMobile={isMobile} />
          }
          {forecast.error
            ? <ErrorBlock onRetry={fetchAll} isDark={isDark} />
            : <RevenueChart forecast={forecast.data} summary={summary.data} isLoading={forecast.loading} />
          }
          <div className="grid grid-cols-2 gap-4">
            {waste.error
              ? <ErrorBlock onRetry={fetchAll} isDark={isDark} />
              : <WastePanel waste={waste.data} isLoading={waste.loading} />
            }
            <ShiftPanel summary={summary.data} isLoading={summary.loading} />
          </div>
          <MenuMatrix />
        </div>

        {/* RIGHT — fixed chat */}
        <div className="flex-[0_0_35%] sticky top-0 h-full min-w-0">
          <AIChatPanel />
        </div>
      </div>
    </div>
  );
}

// ─── Error Block ─────────────────────────────────────────────────────────────

function ErrorBlock({
  onRetry,
  isDark,
  compact = false,
}: {
  onRetry: () => void;
  isDark: boolean;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center rounded-2xl border-2 border-dashed ${
      compact ? 'p-4 mb-0' : 'p-6 mb-5'
    } ${isDark ? 'border-stone-800' : 'border-[#E2E8F0]'}`}>
      <AlertCircle size={compact ? 20 : 28} className="text-red-500 mb-2" />
      <p className={`font-bold mb-1 ${compact ? 'text-sm' : 'text-base'} ${isDark ? 'text-stone-300' : 'text-[#475569]'}`}>
        Gagal Memuat Data
      </p>
      {!compact && (
        <p className={`text-xs mb-3 ${isDark ? 'text-stone-500' : 'text-[#94A3B8]'}`}>
          Terjadi kesalahan saat mengambil data.
        </p>
      )}
      <button onClick={onRetry} className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all border-none cursor-pointer ${
        isDark ? 'bg-stone-800 text-stone-300' : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
      }`}>
        <RefreshCw size={13} /> Coba Lagi
      </button>
    </div>
  );
}