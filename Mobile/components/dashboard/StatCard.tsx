import React from 'react';
import { View, Text, DimensionValue } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getColors } from '../../utils/theme';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: keyof typeof Feather.glyphMap;
  iconColor: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  trendColor?: string;
  barColor: string;
  width?: DimensionValue;
  height?: number;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconColor,
  trend,
  trendLabel,
  trendColor,
  barColor,
  width,
  height = 120,
}: StatCardProps) {
  const c = getColors(true); // Always dark theme

  return (
    <View
      style={{
        width,
        height,
        backgroundColor: '#1a1a1a',
        borderWidth: 1,
        borderColor: '#2a2a2a',
        borderRadius: 16,
        padding: 14,
        justifyContent: 'space-between',
      }}
    >
      {/* Icon top-left */}
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: `${iconColor}15`,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Feather name={icon} size={18} color={iconColor} />
      </View>

      {/* Value + Label at bottom */}
      <View>
        <Text
          style={{
            color: '#ffffff',
            fontSize: height > 120 ? 26 : 22,
            fontWeight: '900',
            marginBottom: 2,
          }}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {value}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text
            style={{
              color: '#888888',
              fontSize: height > 120 ? 11 : 10,
              fontWeight: '700',
              textTransform: 'uppercase',
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
          {trend && trendLabel && trendColor && (
            <Text style={{ color: trendColor, fontSize: 10, fontWeight: '700' }}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : ''} {trendLabel}
            </Text>
          )}
        </View>

        {/* Accent bar */}
        <View style={{ height: 3, backgroundColor: '#2a2a2a', borderRadius: 2, overflow: 'hidden' }}>
          <View style={{ height: '100%', width: '40%', backgroundColor: barColor, borderRadius: 2 }} />
        </View>
      </View>
    </View>
  );
}
