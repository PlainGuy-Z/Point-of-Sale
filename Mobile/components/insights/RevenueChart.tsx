import React, { useMemo } from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { ForecastResponse } from '../../services/aiApi';
import { formatRupiahShort } from '../../utils/currency';
import { CalendarClock, ShieldCheck } from 'lucide-react-native';

interface RevenueChartProps {
  forecast: ForecastResponse | null;
}

export default function RevenueChart({ forecast }: RevenueChartProps) {
  const { width } = useWindowDimensions();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  const chartData = useMemo(() => {
    if (!forecast || forecast.length === 0) return [];
    return forecast.map(item => ({
      value: item.predicted_revenue,
      label: item.day_name.substring(0, 3), // e.g., 'Sen', 'Sel'
      labelTextStyle: { color: c.textSecondary, fontSize: 10 },
      dataPointText: formatRupiahShort(item.predicted_revenue),
      customDataPoint: () => (
        <View style={{
          width: 8, height: 8, borderRadius: 4,
          backgroundColor: c.accent,
          borderWidth: 2, borderColor: c.bgCard
        }} />
      )
    }));
  }, [forecast, c]);

  if (!forecast || forecast.length === 0) return null;

  // Average confidence
  const confidences = forecast.map(f => f.confidence);
  const avgConfidence = confidences.includes('low') ? 'low' : (confidences.includes('medium') ? 'medium' : 'high');
  const confColor = avgConfidence === 'high' ? c.success : (avgConfidence === 'medium' ? c.warning : c.error);
  const confText = avgConfidence === 'high' ? 'Tinggi' : (avgConfidence === 'medium' ? 'Sedang' : 'Rendah');

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
          <Text style={{ color: c.text, fontSize: 16, fontWeight: '800' }}>Prediksi Revenue 7 Hari</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: isDark ? '#222' : '#f0fdf4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
          <ShieldCheck size={12} color={confColor} />
          <Text style={{ color: confColor, fontSize: 10, fontWeight: '700' }}>Akurasi {confText}</Text>
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
