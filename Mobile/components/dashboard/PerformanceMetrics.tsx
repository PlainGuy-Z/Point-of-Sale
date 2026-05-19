import React from 'react';
import { View, Text } from 'react-native';
import { TrendingUp } from 'lucide-react-native';
import { getColors } from '../../utils/theme';

interface PerformanceMetricCardProps {
  label: string;
  value: string;
  isDark: boolean;
}

export function PerformanceMetricCard({
  label,
  value,
  isDark,
}: PerformanceMetricCardProps) {
  const c = getColors(isDark);

  return (
    <View
      style={{
        backgroundColor: c.bgCard,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 14,
        padding: 12,
      }}
    >
      <Text
        style={{
          color: c.textSecondary,
          fontSize: 10,
          fontWeight: '600',
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: c.text,
          fontSize: 20,
          fontWeight: '900',
        }}
      >
        {value}
      </Text>
    </View>
  );
}

interface PerformanceMetricsProps {
  metrics: Array<{ label: string; value: string }>;
  isDark: boolean;
}

export default function PerformanceMetrics({
  metrics,
  isDark,
}: PerformanceMetricsProps) {
  const c = getColors(isDark);

  return (
    <View
      style={{
        backgroundColor: isDark
          ? 'rgba(13, 148, 136, 0.05)'
          : 'rgba(13, 148, 136, 0.05)',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(13, 148, 136, 0.2)',
        borderRadius: 16,
        padding: 16,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <Text
          style={{
            color: c.text,
            fontSize: 14,
            fontWeight: '900',
          }}
        >
          Wawasan Kinerja
        </Text>
        <TrendingUp size={18} color={isDark ? '#22c55e' : '#16a34a'} strokeWidth={2} />
      </View>

      {/* Metrics Grid */}
      <View style={{ gap: 10 }}>
        {metrics.map((metric, index) => (
          <View key={index}>
            <Text
              style={{
                color: c.textMuted,
                fontSize: 10,
                fontWeight: '600',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              {metric.label}
            </Text>
            <Text
              style={{
                color: c.accent,
                fontSize: 18,
                fontWeight: '800',
              }}
            >
              {metric.value}
            </Text>
            {index < metrics.length - 1 && (
              <View
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: c.border,
                  marginTop: 10,
                }}
              />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}
