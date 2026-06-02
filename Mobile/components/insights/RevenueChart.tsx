import React, { useMemo, useState } from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { formatRupiahShort } from '../../utils/currency';
import { TrendingUp } from 'lucide-react-native';
import { ForecastResponse } from '../../services/aiApi';

export default function RevenueChart({ forecast }: { forecast: ForecastResponse }) {
  const { width } = useWindowDimensions();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  const [activePoint, setActivePoint] = useState<any>(null);

  const { revData, txnData, maxValue } = useMemo(() => {
    if (!forecast || forecast.length === 0) return { revData: [], txnData: [], maxValue: 100 };
    
    let maxR = 0;
    
    const rev = forecast.map((f, i) => {
      if (f.predicted_revenue > maxR) maxR = f.predicted_revenue;
      
      const parts = f.date.split('-');
      const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : f.date;
      
      const confColor = f.confidence === 'low' ? '#ef4444' : f.confidence === 'medium' ? '#f59e0b' : '#22c55e';
      
      return {
        value: f.predicted_revenue,
        label: i % 2 === 0 ? label : '', // show every other label
        labelTextStyle: { color: c.textSecondary, fontSize: 10 },
        customDataPoint: () => (
          <View style={{
            width: 8, height: 8, borderRadius: 4,
            backgroundColor: '#f59e0b',
            borderWidth: 1.5, borderColor: isDark ? '#1c1917' : '#fff'
          }} />
        ),
        // store full item for pointer
        rawItem: f
      };
    });

    const txn = forecast.map((f) => {
      // To show transactions on the same chart visually we might need a secondary y-axis
      // gifted-charts supports secondary y-axis using secondaryData in newer versions or mapping
      // Here we map transactions to the revenue scale for visual overlay, or just rely on GIFTED-CHARTS data2 scaling.
      // Wait, gifted-charts doesn't auto-scale data2 to data1 perfectly if axes are different without secondaryYAxis.
      // Let's just scale it manually so the max transaction is around 80% of max revenue.
      return {
        value: f.predicted_transactions,
        // we'll compute a visual value
        rawValue: f.predicted_transactions,
        rawItem: f,
        customDataPoint: () => (
          <View style={{
            width: 8, height: 8, borderRadius: 4,
            backgroundColor: '#0d9488',
            borderWidth: 1.5, borderColor: isDark ? '#1c1917' : '#fff'
          }} />
        )
      };
    });

    // Manual scaling for transaction line
    const maxT = Math.max(...txn.map(t => t.rawValue), 1);
    const targetMaxR = Math.max(maxR, 1000);
    const scaleFactor = (targetMaxR * 0.7) / maxT;

    const scaledTxn = txn.map(t => ({
      ...t,
      value: t.rawValue * scaleFactor
    }));

    return { revData: rev, txnData: scaledTxn, maxValue: targetMaxR * 1.2 };
  }, [forecast, c, isDark]);

  if (!forecast || forecast.length === 0) return null;

  return (
    <View style={{
      backgroundColor: c.bgCard,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 16,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <TrendingUp size={18} color={isDark ? '#f59e0b' : '#0d9488'} />
            <Text style={{ color: c.text, fontSize: 16, fontWeight: '800' }}>Prediksi 7 Hari ke Depan</Text>
          </View>
          <Text style={{ color: c.textSecondary, fontSize: 12 }}>Berdasarkan pola historis toko</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 10, height: 3, backgroundColor: '#f59e0b', borderRadius: 2 }} />
            <Text style={{ color: c.textSecondary, fontSize: 10, fontWeight: '600' }}>Revenue</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 10, height: 3, backgroundColor: '#0d9488', borderRadius: 2 }} />
            <Text style={{ color: c.textSecondary, fontSize: 10, fontWeight: '600' }}>Transaksi</Text>
          </View>
        </View>
      </View>

      <View style={{ alignItems: 'center', marginLeft: -10 }}>
        <LineChart
          data={revData}
          data2={txnData}
          width={width - 80}
          height={180}
          thickness={3}
          thickness2={2}
          color="#f59e0b"
          color2="#0d9488"
          strokeDashArray2={[4, 4]} // dashed line for transactions
          maxValue={maxValue}
          noOfSections={4}
          hideRules
          yAxisColor={c.borderLight}
          xAxisColor={c.borderLight}
          yAxisTextStyle={{ color: c.textSecondary, fontSize: 10 }}
          formatYLabel={(label) => formatRupiahShort(Number(label))}
          isAnimated
          animationDuration={1000}
          curved
          initialSpacing={20}
          endSpacing={20}
          pointerConfig={{
            pointerStripHeight: 160,
            pointerStripColor: isDark ? '#3f3f46' : '#e4e4e7',
            pointerStripWidth: 2,
            pointerColor: 'transparent',
            radius: 6,
            pointerLabelWidth: 160,
            pointerLabelHeight: 90,
            activatePointersOnLongPress: false,
            autoAdjustPointerLabelPosition: true,
            pointerLabelComponent: (items: any) => {
              if (!items || !items[0]) return null;
              const f = items[0].rawItem as ForecastResponse[0];
              const confLabel = f.confidence === 'high' ? 'Tinggi' : f.confidence === 'medium' ? 'Sedang' : 'Rendah';
              const confColor = f.confidence === 'high' ? '#22c55e' : f.confidence === 'medium' ? '#f59e0b' : '#ef4444';
              
              return (
                <View style={{
                  backgroundColor: c.bgCard,
                  borderWidth: 1,
                  borderColor: c.border,
                  borderRadius: 8,
                  padding: 10,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 4,
                  elevation: 4,
                }}>
                  <Text style={{ color: c.text, fontSize: 11, fontWeight: '700', marginBottom: 8 }}>
                    {f.day_name} — {f.date}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#f59e0b' }} />
                    <Text style={{ color: c.textSecondary, fontSize: 10, flex: 1 }}>Revenue:</Text>
                    <Text style={{ color: c.text, fontSize: 10, fontWeight: '700' }}>{formatRupiahShort(f.predicted_revenue)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#0d9488' }} />
                    <Text style={{ color: c.textSecondary, fontSize: 10, flex: 1 }}>Transaksi:</Text>
                    <Text style={{ color: c.text, fontSize: 10, fontWeight: '700' }}>{f.predicted_transactions}</Text>
                  </View>
                  <View style={{ alignSelf: 'flex-start', backgroundColor: confColor + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ color: confColor, fontSize: 9, fontWeight: '800' }}>{confLabel}</Text>
                  </View>
                </View>
              );
            },
          }}
        />
      </View>
    </View>
  );
}
