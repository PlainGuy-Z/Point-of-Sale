import React from 'react';
import { View, Text } from 'react-native';
import { AlertTriangle, Package, BarChart3, TrendingUp, Minus } from 'lucide-react-native';

export type InfoCardVariant = 'stock-warning' | 'out-of-stock' | 'margin';

interface InfoCardProps {
  variant: InfoCardVariant;
  value: number | string;
  isDark: boolean;
}

const CONFIG: Record<InfoCardVariant, {
  icon: any;
  label: string;
  subtitle: string;
  getBadge: (v: number | string) => { text: string; type: 'success' | 'warning' | 'info' };
  getBarColors: (isDark: boolean) => string[];
  iconBg: (isDark: boolean) => string;
  iconColor: (isDark: boolean) => string;
}> = {
  'stock-warning': {
    icon: AlertTriangle,
    label: 'PERINGATAN\nSTOK',
    subtitle: 'item perlu perhatian',
    getBadge: (v) => {
      const n = typeof v === 'number' ? v : parseInt(String(v), 10) || 0;
      return n === 0
        ? { text: 'Aman', type: 'success' }
        : { text: 'Waspada', type: 'warning' };
    },
    getBarColors: (isDark) => ['#f97316', '#eab308', '#22c55e', '#94a3b8'],
    iconBg: (isDark) => isDark ? '#252525' : '#f1f5f9',
    iconColor: (isDark) => isDark ? '#a8a29e' : '#64748b',
  },
  'out-of-stock': {
    icon: Package,
    label: 'STOK\nHABIS',
    subtitle: 'item tidak tersedia',
    getBadge: (v) => {
      const n = typeof v === 'number' ? v : parseInt(String(v), 10) || 0;
      return n > 0
        ? { text: 'Segera Restok', type: 'warning' }
        : { text: 'Aman', type: 'success' };
    },
    getBarColors: () => ['#ef4444', '#f87171'],
    iconBg: (isDark) => isDark ? '#252525' : '#f1f5f9',
    iconColor: (isDark) => isDark ? '#a8a29e' : '#64748b',
  },
  'margin': {
    icon: BarChart3,
    label: 'TINGKAT\nMARGIN',
    subtitle: 'margin keuntungan',
    getBadge: (v) => {
      const n = typeof v === 'number' ? v : parseFloat(String(v)) || 0;
      if (n >= 50) return { text: 'Tinggi', type: 'success' };
      if (n >= 25) return { text: 'Sedang', type: 'info' };
      return { text: 'Rendah', type: 'warning' };
    },
    getBarColors: () => ['#3b82f6', '#6366f1'],
    iconBg: (isDark) => isDark ? '#252525' : '#f1f5f9',
    iconColor: (isDark) => isDark ? '#a8a29e' : '#64748b',
  },
};

const BADGE_STYLES: Record<'success' | 'warning' | 'info', {
  bg: (isDark: boolean) => string;
  border: (isDark: boolean) => string;
  color: (isDark: boolean) => string;
  icon: any;
}> = {
  success: {
    bg: (isDark) => isDark ? 'rgba(16,185,129,0.12)' : '#ecfdf5',
    border: (isDark) => isDark ? 'rgba(16,185,129,0.25)' : '#a7f3d0',
    color: (isDark) => isDark ? '#34d399' : '#059669',
    icon: Minus,
  },
  warning: {
    bg: (isDark) => isDark ? 'rgba(245,158,11,0.12)' : '#fffbeb',
    border: (isDark) => isDark ? 'rgba(245,158,11,0.25)' : '#fde68a',
    color: (isDark) => isDark ? '#fbbf24' : '#d97706',
    icon: TrendingUp,
  },
  info: {
    bg: (isDark) => isDark ? 'rgba(59,130,246,0.12)' : '#eff6ff',
    border: (isDark) => isDark ? 'rgba(59,130,246,0.25)' : '#bfdbfe',
    color: (isDark) => isDark ? '#60a5fa' : '#2563eb',
    icon: TrendingUp,
  },
};

export default function InfoCard({ variant, value, isDark }: InfoCardProps) {
  const cfg = CONFIG[variant];
  const Icon = cfg.icon;
  const badge = cfg.getBadge(value);
  const badgeStyle = BADGE_STYLES[badge.type];
  const BadgeIcon = badgeStyle.icon;
  const barColors = cfg.getBarColors(isDark);

  const displayValue = variant === 'margin'
    ? `${typeof value === 'number' ? value.toFixed(1) : value}%`
    : String(value);

  // Progress bar width
  const numVal = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
  const progressWidth = variant === 'margin'
    ? `${Math.min(numVal, 100)}%`
    : numVal === 0 ? '100%' : `${Math.min(numVal * 15, 100)}%`;

  return (
    <View style={{
      flex: 1,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      padding: 16,
      minHeight: 170,
    }}>
      {/* Icon */}
      <View style={{
        width: 42, height: 42, borderRadius: 12,
        backgroundColor: cfg.iconBg(isDark),
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 14,
      }}>
        <View style={{
          width: 30, height: 30, borderRadius: 8,
          backgroundColor: isDark ? '#111' : '#fff',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16} color={cfg.iconColor(isDark)} />
        </View>
      </View>

      {/* Value */}
      <Text style={{
        fontSize: 28, fontWeight: '900',
        color: isDark ? '#ffffff' : '#0f172a',
        letterSpacing: -0.5,
        marginBottom: 6,
      }} numberOfLines={1} adjustsFontSizeToFit>
        {displayValue}
      </Text>

      {/* Label + Badge row */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 4,
      }}>
        <Text style={{
          fontSize: 10, fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          color: isDark ? '#0d9488' : '#0d9488',
          flex: 1,
          lineHeight: 14,
        }}>
          {cfg.label}
        </Text>

        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 4,
          paddingHorizontal: 8, paddingVertical: 4,
          borderRadius: 999,
          backgroundColor: badgeStyle.bg(isDark),
          borderWidth: 1,
          borderColor: badgeStyle.border(isDark),
        }}>
          <BadgeIcon size={10} color={badgeStyle.color(isDark)} />
          <Text style={{
            fontSize: 9, fontWeight: '800',
            color: badgeStyle.color(isDark),
          }}>
            {badge.text}
          </Text>
        </View>
      </View>

      {/* Subtitle */}
      <Text style={{
        fontSize: 11, fontWeight: '500',
        color: isDark ? '#57534e' : '#94a3b8',
        marginBottom: 12,
      }}>
        {cfg.subtitle}
      </Text>

      {/* Progress bar */}
      <View style={{
        height: 5, borderRadius: 999,
        backgroundColor: isDark ? '#2a2a2a' : '#f1f5f9',
        overflow: 'hidden',
        flexDirection: 'row',
      }}>
        {variant === 'stock-warning' ? (
          /* Multi-color bar for stock warnings */
          <>
            <View style={{ width: '25%', height: '100%', backgroundColor: barColors[0] }} />
            <View style={{ width: '20%', height: '100%', backgroundColor: barColors[1] }} />
            <View style={{ width: '30%', height: '100%', backgroundColor: barColors[2] }} />
            <View style={{ width: '25%', height: '100%', backgroundColor: barColors[3] || '#e2e8f0' }} />
          </>
        ) : (
          <View style={{
            width: progressWidth as any,
            height: '100%',
            borderRadius: 999,
            backgroundColor: barColors[0],
          }} />
        )}
      </View>
    </View>
  );
}
