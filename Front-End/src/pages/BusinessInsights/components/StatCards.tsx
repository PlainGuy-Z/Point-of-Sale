import React from 'react';
import { TrendingUp, TrendingDown, Package, Star, DollarSign, Calendar, BarChart3 } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import type { SummaryResponse } from '../../../services/aiApi';

interface StatCardsProps {
  summary: SummaryResponse | null;
  isLoading: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRupiah(value: number): string {
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}jt`;
  if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}rb`;
  return `Rp ${value}`;
}

function TrendBadge({ value, isDark }: { value: number; isDark: boolean }) {
  const isPositive = value >= 0;
  const color = isPositive ? '#22c55e' : '#ef4444';
  const Icon = isPositive ? TrendingUp : TrendingDown;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 12,
        fontWeight: 600,
        color,
        background: isPositive
          ? (isDark ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.1)')
          : (isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.1)'),
        padding: '2px 8px',
        borderRadius: 999,
      }}
    >
      <Icon size={12} />
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonCard({ isDark }: { isDark: boolean }) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: `1px solid ${isDark ? '#292524' : '#e7e5e4'}`,
        background: isDark ? '#1c1917' : '#fff',
        padding: 20,
        minHeight: 120,
      }}
    >
      <div
        style={{
          width: 80,
          height: 12,
          borderRadius: 6,
          background: isDark ? '#292524' : '#e7e5e4',
          marginBottom: 12,
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />
      <div
        style={{
          width: 120,
          height: 28,
          borderRadius: 8,
          background: isDark ? '#292524' : '#e7e5e4',
          marginBottom: 8,
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />
      <div
        style={{
          width: 100,
          height: 12,
          borderRadius: 6,
          background: isDark ? '#292524' : '#e7e5e4',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function StatCards({ summary, isLoading }: StatCardsProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (isLoading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 20 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonCard key={i} isDark={isDark} />
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const lowStockColor = summary.low_stock_count > 0 ? '#ef4444' : '#22c55e';

  const cards = [
    {
      label: 'Omzet Hari Ini',
      value: formatRupiah(summary.today_revenue),
      sub: `vs kemarin: ${summary.day_over_day_change_percent >= 0 ? '+' : ''}${summary.day_over_day_change_percent.toFixed(1)}%`,
      trend: summary.day_over_day_change_percent,
      accent: '#f59e0b',
      icon: DollarSign,
    },
    {
      label: 'Omzet Minggu Ini',
      value: formatRupiah(summary.this_week_revenue),
      sub: `rata-rata harian: ${formatRupiah(Math.round(summary.this_week_revenue / 7))}`,
      trend: summary.week_over_week_change_percent,
      accent: '#0d9488',
      icon: Calendar,
    },
    {
      label: 'Omzet Minggu Lalu',
      value: formatRupiah(summary.last_week_revenue),
      sub: `total minggu lalu`,
      trend: null,
      accent: '#6b7280',
      icon: BarChart3,
    },
    {
      label: 'Stok Rendah',
      value: String(summary.low_stock_count),
      sub: 'produk perlu restok',
      trend: null,
      accent: lowStockColor,
      icon: Package,
    },
    {
      label: 'Produk Terlaris',
      value: summary.top_products_today.length > 20
        ? summary.top_products_today.slice(0, 20) + '…'
        : summary.top_products_today,
      sub: 'Hari ini',
      trend: null,
      accent: '#7c3aed',
      icon: Star,
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 20 }}>
      {cards.map((card) => {
        const IconComp = card.icon;
        return (
          <div
            key={card.label}
            style={{
              borderRadius: 16,
              border: `1px solid ${isDark ? '#292524' : '#e7e5e4'}`,
              background: isDark ? '#1c1917' : '#fff',
              padding: 20,
              transition: 'box-shadow 0.2s, border-color 0.2s',
              cursor: 'default',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = `0 0 0 1px ${card.accent}40, 0 4px 12px ${card.accent}15`;
              e.currentTarget.style.borderColor = `${card.accent}60`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = isDark ? '#292524' : '#e7e5e4';
            }}
          >
            {/* Accent top line */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: card.accent,
                borderRadius: '16px 16px 0 0',
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: isDark ? '#a8a29e' : '#78716c' }}>
                {card.label}
              </span>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `${card.accent}15`,
                }}
              >
                <IconComp size={16} color={card.accent} />
              </div>
            </div>

            <div
              style={{
                fontSize: card.label === 'Produk Terlaris' ? 16 : 24,
                fontWeight: 700,
                fontFamily: card.label === 'Produk Terlaris' ? 'inherit' : 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
                color: isDark ? '#fafaf9' : '#1c1917',
                marginBottom: 6,
                lineHeight: 1.2,
              }}
            >
              {card.value}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {card.trend !== null && <TrendBadge value={card.trend} isDark={isDark} />}
              {card.trend === null && (
                <span style={{ fontSize: 12, color: isDark ? '#78716c' : '#a8a29e' }}>{card.sub}</span>
              )}
            </div>
          </div>
        );
      })}

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
