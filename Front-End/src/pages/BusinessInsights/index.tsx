import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertCircle, BarChart3 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { aiApi } from '../../services/aiApi';
import type { ForecastResponse, WasteResponse, SummaryResponse } from '../../services/aiApi';

import StatCards from './components/StatCards';
import RevenueChart from './components/RevenueChart';
import WastePanel from './components/WastePanel';
import ShiftPanel from './components/ShiftPanel';
import AIChatPanel from './components/AIChatPanel';
import MenuMatrix from './components/MenuMatrix';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DataSlice<T> {
  data: T | null;
  loading: boolean;
  error: boolean;
}

function initSlice<T>(): DataSlice<T> {
  return { data: null, loading: true, error: false };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BusinessInsights() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [forecast, setForecast] = useState<DataSlice<ForecastResponse>>(initSlice);
  const [waste, setWaste] = useState<DataSlice<WasteResponse>>(initSlice);
  const [summary, setSummary] = useState<DataSlice<SummaryResponse>>(initSlice);
  const [lastUpdated, setLastUpdated] = useState(new Date());

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

  return (
    <div style={{ background: bg, minHeight: '100vh', padding: 24, fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 24, padding: '16px 20px', borderRadius: 16,
        border: `1px solid ${isDark ? '#292524' : '#e2e8f0'}`,
        background: isDark ? '#1c1917' : '#fff',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BarChart3 size={22} color="#0d9488" />
            <h1 style={{ fontSize: 22, fontWeight: 800, color: isDark ? '#fafaf9' : '#1c1917', margin: 0, letterSpacing: '-0.02em' }}>
              Business <span style={{ color: '#f59e0b' }}>Intelligence</span>
            </h1>
          </div>
          <p style={{ fontSize: 12, color: isDark ? '#78716c' : '#94a3b8', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            Command center AI untuk bisnismu
            <span style={{ width: 4, height: 4, borderRadius: 2, background: isDark ? '#44403c' : '#cbd5e1' }} />
            {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <button onClick={() => fetchAll()} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          border: `1px solid ${isDark ? '#292524' : '#e2e8f0'}`, cursor: 'pointer',
          background: isDark ? '#292524' : '#fff', color: isDark ? '#d6d3d1' : '#475569',
          transition: 'background 0.15s',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? '#44403c' : '#f1f5f9'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? '#292524' : '#fff'; }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>



      {/* ── Split Panel ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 24, height: 'calc(100vh - 160px)' }}>
        {/* LEFT — scrollable */}
        <div className="horizontal-scrollbar-thin" style={{ flex: '0 0 65%', overflowY: 'auto', paddingRight: 4 }}>
          {summary.error ? (
            <ErrorBlock onRetry={fetchAll} isDark={isDark} />
          ) : (
            <StatCards summary={summary.data} isLoading={summary.loading} />
          )}

          {forecast.error ? (
            <ErrorBlock onRetry={fetchAll} isDark={isDark} />
          ) : (
            <RevenueChart forecast={forecast.data} summary={summary.data} isLoading={forecast.loading} />
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {waste.error ? (
              <ErrorBlock onRetry={fetchAll} isDark={isDark} />
            ) : (
              <WastePanel waste={waste.data} isLoading={waste.loading} />
            )}
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

// ─── Error block ─────────────────────────────────────────────────────────────

function ErrorBlock({ onRetry, isDark }: { onRetry: () => void; isDark: boolean }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24, borderRadius: 16, border: `2px dashed ${isDark ? '#292524' : '#e2e8f0'}`,
      marginBottom: 20, textAlign: 'center',
    }}>
      <AlertCircle size={28} color={isDark ? '#f87171' : '#ef4444'} style={{ marginBottom: 8 }} />
      <p style={{ fontWeight: 700, color: isDark ? '#d6d3d1' : '#475569', marginBottom: 4, fontSize: 14 }}>
        Gagal Memuat Data
      </p>
      <p style={{ fontSize: 12, color: isDark ? '#78716c' : '#94a3b8', marginBottom: 12 }}>
        Terjadi kesalahan saat mengambil data.
      </p>
      <button onClick={onRetry} style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 999,
        fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
        background: isDark ? '#292524' : '#f1f5f9', color: isDark ? '#d6d3d1' : '#475569',
      }}>
        <RefreshCw size={13} /> Coba Lagi
      </button>
    </div>
  );
}