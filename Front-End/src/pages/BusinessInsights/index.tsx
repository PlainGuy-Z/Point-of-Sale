import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, AlertCircle, BarChart3, LayoutDashboard, Bot, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
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
        style={{
          display: 'flex',
          gap: GAP,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          paddingBottom: 2,
          paddingRight: 16,
        }}
      >
        {panels.map((panel) => (
          <div
            key={panel.key}
            style={{
              scrollSnapAlign: 'start',
              flexShrink: 0,
              width: 'calc(85vw)',
            }}
          >
            {panel.content}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 10, marginTop: 12,
      }}>
        <button
          onClick={() => scrollTo(0)}
          disabled={activeIndex === 0}
          style={{
            width: 28, height: 28, borderRadius: 999, border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: activeIndex === 0 ? 'default' : 'pointer',
            background: isDark ? '#292524' : '#e7e5e4',
            color: isDark ? '#d6d3d1' : '#44403c',
            opacity: activeIndex === 0 ? 0.35 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          <ChevronLeft size={14} />
        </button>

        {panels.map((panel, i) => (
          <button
            key={panel.key}
            onClick={() => scrollTo(i)}
            style={{
              padding: '4px 12px', borderRadius: 999, border: 'none',
              cursor: 'pointer', fontSize: 11, fontWeight: 600,
              transition: 'all 0.2s',
              background: i === activeIndex ? '#f59e0b' : (isDark ? '#292524' : '#e7e5e4'),
              color: i === activeIndex ? '#fff' : (isDark ? '#78716c' : '#78716c'),
            }}
          >
            {panel.label}
          </button>
        ))}

        <button
          onClick={() => scrollTo(1)}
          disabled={activeIndex === 1}
          style={{
            width: 28, height: 28, borderRadius: 999, border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: activeIndex === 1 ? 'default' : 'pointer',
            background: isDark ? '#292524' : '#e7e5e4',
            color: isDark ? '#d6d3d1' : '#44403c',
            opacity: activeIndex === 1 ? 0.35 : 1,
            transition: 'opacity 0.2s',
          }}
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

  const bg = isDark ? '#0a0908' : '#f0f4f8';

  // ─── Header ──────────────────────────────────────────────────────────────
  const renderHeader = () => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: isMobile ? 16 : 24,
      padding: isMobile ? '12px 16px' : '16px 20px',
      borderRadius: 16,
      border: `1px solid ${isDark ? '#292524' : '#e2e8f0'}`,
      background: isDark ? '#1c1917' : '#fff',
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BarChart3 size={isMobile ? 18 : 22} color="#0d9488" />
          <h1 style={{
            fontSize: isMobile ? 18 : 22, fontWeight: 800,
            color: isDark ? '#fafaf9' : '#1c1917',
            margin: 0, letterSpacing: '-0.02em',
          }}>
            Business <span style={{ color: '#f59e0b' }}>Intelligence</span>
          </h1>
        </div>
        <p style={{
          fontSize: 11, color: isDark ? '#78716c' : '#94a3b8',
          marginTop: 3, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          Command center AI
          <span style={{ width: 3, height: 3, borderRadius: 2, background: isDark ? '#44403c' : '#cbd5e1' }} />
          {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      <button
        onClick={() => fetchAll()}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: isMobile ? '6px 12px' : '8px 16px',
          borderRadius: 10, fontSize: isMobile ? 12 : 13, fontWeight: 600,
          border: `1px solid ${isDark ? '#292524' : '#e2e8f0'}`, cursor: 'pointer',
          background: isDark ? '#292524' : '#fff', color: isDark ? '#d6d3d1' : '#475569',
          transition: 'background 0.15s', whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? '#44403c' : '#f1f5f9'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? '#292524' : '#fff'; }}
      >
        <RefreshCw size={13} />
        {!isMobile && 'Refresh'}
      </button>
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
      <div style={{
        background: bg, minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        <style>{`div::-webkit-scrollbar{display:none}`}</style>

        {/* Header */}
        <div style={{ padding: '16px 16px 0' }}>
          {renderHeader()}
        </div>

        {/* Tab bar */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          padding: '0 16px 12px', background: bg,
        }}>
          <div style={{
            display: 'flex', gap: 6, padding: 4, borderRadius: 14,
            background: isDark ? '#1c1917' : '#e2e8f0',
            border: `1px solid ${isDark ? '#292524' : '#cbd5e1'}`,
          }}>
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 6,
                    padding: '8px 4px', borderRadius: 10, border: 'none',
                    cursor: 'pointer', fontSize: 12,
                    fontWeight: isActive ? 700 : 500, transition: 'all 0.2s',
                    background: isActive ? (isDark ? '#292524' : '#ffffff') : 'transparent',
                    color: isActive ? (isDark ? '#f59e0b' : '#d97706') : (isDark ? '#78716c' : '#64748b'),
                    boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, padding: '0 16px 32px', overflowY: 'auto' }}>

          {/* ── METRICS TAB ── */}
          {activeTab === 'metrics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* StatCards — snap carousel handled inside the component */}
              {summary.error
                ? <ErrorBlock onRetry={fetchAll} isDark={isDark} />
                : <StatCards summary={summary.data} isLoading={summary.loading} />
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
            <div style={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
              <AIChatPanel />
            </div>
          )}

          {/* ── CHARTS TAB ── */}
          {activeTab === 'charts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <MenuMatrix />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── DESKTOP LAYOUT (unchanged) ──────────────────────────────────────────
  return (
    <div style={{ background: bg, minHeight: '100vh', padding: 24, fontFamily: 'Inter, system-ui, sans-serif' }}>
      {renderHeader()}

      <div style={{ display: 'flex', gap: 24, height: 'calc(100vh - 160px)' }}>
        {/* LEFT — scrollable */}
        <div className="horizontal-scrollbar-thin" style={{ flex: '0 0 65%', overflowY: 'auto', paddingRight: 4 }}>
          {summary.error
            ? <ErrorBlock onRetry={fetchAll} isDark={isDark} />
            : <StatCards summary={summary.data} isLoading={summary.loading} />
          }
          {forecast.error
            ? <ErrorBlock onRetry={fetchAll} isDark={isDark} />
            : <RevenueChart forecast={forecast.data} summary={summary.data} isLoading={forecast.loading} />
          }
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {waste.error
              ? <ErrorBlock onRetry={fetchAll} isDark={isDark} />
              : <WastePanel waste={waste.data} isLoading={waste.loading} />
            }
            <ShiftPanel summary={summary.data} isLoading={summary.loading} />
          </div>
          <MenuMatrix />
        </div>

        {/* RIGHT — fixed chat */}
        <div style={{ flex: '0 0 35%', position: 'sticky', top: 0, height: '100%', minWidth: 0 }}>
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
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: compact ? 16 : 24, borderRadius: 16,
      border: `2px dashed ${isDark ? '#292524' : '#e2e8f0'}`,
      marginBottom: compact ? 0 : 20, textAlign: 'center',
    }}>
      <AlertCircle size={compact ? 20 : 28} color={isDark ? '#f87171' : '#ef4444'} style={{ marginBottom: 8 }} />
      <p style={{ fontWeight: 700, color: isDark ? '#d6d3d1' : '#475569', marginBottom: 4, fontSize: compact ? 13 : 14 }}>
        Gagal Memuat Data
      </p>
      {!compact && (
        <p style={{ fontSize: 12, color: isDark ? '#78716c' : '#94a3b8', marginBottom: 12 }}>
          Terjadi kesalahan saat mengambil data.
        </p>
      )}
      <button onClick={onRetry} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: compact ? '4px 12px' : '6px 16px',
        borderRadius: 999, fontSize: 12, fontWeight: 600,
        border: 'none', cursor: 'pointer',
        background: isDark ? '#292524' : '#f1f5f9',
        color: isDark ? '#d6d3d1' : '#475569',
        marginTop: compact ? 4 : 0,
      }}>
        <RefreshCw size={13} /> Coba Lagi
      </button>
    </div>
  );
}