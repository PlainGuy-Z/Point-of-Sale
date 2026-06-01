import React, { useMemo } from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { formatRupiahShort } from '../../utils/currency';
import { CalendarClock, ShieldCheck } from 'lucide-react-native';

export default function RevenueChart({ trendData }: { trendData: any[] }) {
  const { width } = useWindowDimensions();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);
  const isTablet = width > 768;

  const chartData = useMemo(() => {
    if (!trendData || trendData.length === 0) return [];
    
    // Take up to 7 items
    const displayData = trendData.slice(-7);
    
    return displayData.map(item => {
      const parts = item.date.split('-');
      const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : item.date;
      return {
        value: item.revenue,
        label: label,
        labelTextStyle: { color: c.textSecondary, fontSize: 10 },
        dataPointText: formatRupiahShort(item.revenue),
        customDataPoint: () => (
          <View style={{
            width: 8, height: 8, borderRadius: 4,
            backgroundColor: c.accent,
            borderWidth: 2, borderColor: c.bgCard
          }} />
        )
      };
    });
  }, [trendData, c]);

  if (!trendData || trendData.length === 0) return null;

  return (
    <View style={{
      backgroundColor: c.bgCard,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{
            width: 32, height: 32, borderRadius: 10,
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            alignItems: 'center', justifyContent: 'center'
          }}>
            <CalendarClock size={16} color={c.accent} />
          </View>
          <Text style={{ color: c.text, fontSize: 16, fontWeight: '800' }}>Tren Pendapatan</Text>
        </View>
      </View>

      <View style={{ alignItems: 'center', marginLeft: -20 }}>
        <LineChart
          data={chartData}
          width={width - 80}
          height={160}
          thickness={3}
          color={c.accent}
          hideRules
          hideYAxisText
          yAxisColor={c.borderLight}
          xAxisColor={c.borderLight}
          dataPointsColor={c.accent}
          textFontSize={10}
          textColor={c.textMuted}
          isAnimated
          animationDuration={1000}
          curved
          initialSpacing={20}
          endSpacing={20}
        />
      </View>
    </View>
  );
}
