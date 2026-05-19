import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: any;
  trend: 'up' | 'down' | 'stable';
  trendValue?: string;
  subtitle?: string;
  gradient?: [string, string];
  isDark: boolean;
  style?: any;
}

export default function StatCardRN({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  subtitle,
  gradient,
  isDark,
  style,
}: StatCardProps) {
  const getLightIconBg = (t: string) => {
    const tl = t.toLowerCase();
    if (tl.includes('pendapatan') || tl.includes('revenue')) return '#f0fdf4'; // teal-50 approx
    if (tl.includes('transaksi')) return '#eff6ff'; // blue-50
    if (tl.includes('pelanggan')) return '#faf5ff'; // purple-50
    if (tl.includes('tiket') || tl.includes('rata-rata')) return '#ecfdf5'; // emerald-50
    return '#f8fafc'; // slate-50
  };

  const getLightIconColor = (t: string) => {
    const tl = t.toLowerCase();
    if (tl.includes('pendapatan') || tl.includes('revenue')) return '#0d9488'; // teal-600
    if (tl.includes('transaksi')) return '#2563eb'; // blue-600
    if (tl.includes('pelanggan')) return '#9333ea'; // purple-600
    if (tl.includes('tiket') || tl.includes('rata-rata')) return '#059669'; // emerald-600
    return '#475569'; // slate-600
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  
  const trendBg = isDark 
    ? (trend === 'up' ? 'rgba(74, 222, 128, 0.15)' : trend === 'down' ? 'rgba(248, 113, 113, 0.15)' : 'rgba(120, 113, 108, 0.15)')
    : (trend === 'up' ? '#dcfce7' : trend === 'down' ? '#fee2e2' : '#f1f5f9');
    
  const trendBorder = isDark
    ? (trend === 'up' ? 'rgba(74, 222, 128, 0.3)' : trend === 'down' ? 'rgba(248, 113, 113, 0.3)' : 'rgba(120, 113, 108, 0.3)')
    : (trend === 'up' ? '#bbf7d0' : trend === 'down' ? '#fecaca' : '#e2e8f0');

  const trendColor = isDark
    ? (trend === 'up' ? '#4ade80' : trend === 'down' ? '#f87171' : '#78716c')
    : (trend === 'up' ? '#059669' : trend === 'down' ? '#dc2626' : '#94a3b8');

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      className="rounded-3xl border p-5 overflow-hidden"
      style={[{
        backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
        borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
      }, style]}
    >
      <View className="flex-row items-center justify-between mb-4">
        <View style={{
          padding: 8,
          borderRadius: 16,
          backgroundColor: isDark ? '#252525' : getLightIconBg(title),
        }}>
          <View style={{
            padding: 8,
            borderRadius: 12,
            backgroundColor: isDark ? '#111' : '#fff',
          }}>
            <Icon size={24} color={isDark ? '#d6d3d1' : getLightIconColor(title)} />
          </View>
        </View>
      </View>

      <Text style={{
        fontSize: 28,
        fontWeight: '900',
        color: isDark ? '#ffffff' : '#0f172a',
        letterSpacing: -0.5,
        marginBottom: 8,
      }}>
        {value}
      </Text>

      <View className="flex-row items-center justify-between gap-2">
        <Text style={{
          fontSize: 11,
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          color: isDark ? '#78716c' : '#94a3b8',
          flex: 1,
        }} numberOfLines={1}>
          {title}
        </Text>
        {trendValue && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 999,
            backgroundColor: trendBg,
            borderWidth: 1,
            borderColor: trendBorder,
          }}>
            <TrendIcon size={12} color={trendColor} />
            <Text style={{ fontSize: 10, fontWeight: '900', color: trendColor }}>
              {trendValue}
            </Text>
          </View>
        )}
      </View>

      {subtitle && (
        <Text style={{ fontSize: 11, color: isDark ? '#57534e' : '#94a3b8', marginTop: 2 }}>
          {subtitle}
        </Text>
      )}

      <View style={{
        marginTop: 16,
        height: 4,
        borderRadius: 999,
        backgroundColor: isDark ? '#2a2a2a' : '#f1f5f9',
        overflow: 'hidden',
      }}>
        <View style={{
          width: trend === 'up' ? '85%' : trend === 'down' ? '40%' : '65%',
          height: '100%',
          borderRadius: 999,
          backgroundColor: gradient?.[0] || '#0d9488',
        }} />
      </View>
    </TouchableOpacity>
  );
}
