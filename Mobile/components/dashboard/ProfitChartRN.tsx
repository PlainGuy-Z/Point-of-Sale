import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react-native';
import { formatRupiah, formatRupiahShort } from '../../utils/currency';
import { transactionLocalDateKey } from '../../utils/analytics/helpers';
import type { Transaction } from '../../types';

interface ProfitChartRNProps {
  transactions: Transaction[];
  isDark: boolean;
  /** Outer width of this component's container (excluding its own padding/border) */
  containerWidth?: number;
}

export default function ProfitChartRN({ transactions, isDark, containerWidth }: ProfitChartRNProps) {
  const { width: windowWidth } = useWindowDimensions();
  // If no containerWidth given, assume full screen minus parent horizontal padding (16*2)
  const outerWidth = containerWidth ?? (windowWidth - 32);
  const isCompact = outerWidth < 380;

  const now = new Date();
  const [selectedDate, setSelectedDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));

  const prevMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
  };

  const monthLabel = selectedDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const selectedYear = selectedDate.getFullYear();
  const selectedMonthNum = selectedDate.getMonth() + 1;
  const monthPrefix = `${selectedYear}-${String(selectedMonthNum).padStart(2, '0')}`;

  const { chartData, totalRevenue, maxRevenue, activeDays, daysInMonth } = useMemo(() => {
    const dim = new Date(selectedYear, selectedMonthNum, 0).getDate();

    const dailyData = new Map<string, number>();
    for (let i = 1; i <= dim; i++) {
      dailyData.set(`${monthPrefix}-${String(i).padStart(2, '0')}`, 0);
    }

    transactions.forEach(t => {
      const tDate = transactionLocalDateKey(t.date);
      if (tDate && tDate.startsWith(monthPrefix)) {
        dailyData.set(tDate, (dailyData.get(tDate) || 0) + Math.trunc(t.total));
      }
    });

    let tRev = 0;
    let mRev = 0;
    let aDays = 0;

    // Quarter labels: divide month into 4 equal parts
    const q = Math.ceil(dim / 4);
    const quarterDays = new Set([1, q + 1, 2 * q + 1, 3 * q + 1]);

    const data = Array.from(dailyData.entries()).map(([dateStr, rev]) => {
      tRev += rev;
      if (rev > mRev) mRev = rev;
      if (rev > 0) aDays++;

      const day = parseInt(dateStr.split('-')[2], 10);
      return {
        value: rev,
        label: quarterDays.has(day) ? String(day) : '',
        date: dateStr,
      };
    });

    return { chartData: data, totalRevenue: tRev, maxRevenue: mRev, activeDays: aDays, daysInMonth: dim };
  }, [transactions, selectedYear, selectedMonthNum, monthPrefix]);

  const textColor = isDark ? '#ffffff' : '#0f172a';
  const tealColor = '#0d9488';

  // Chart dimensions: card has padding, we offset marginLeft by -6 for alignment
  const cardPad = isCompact ? 12 : 16;
  const yAxisW = isCompact ? 38 : 45;
  const chartAreaWidth = Math.max(outerWidth - cardPad * 2 - yAxisW - 6, 120);
  // Spacing so all days fit horizontally without scrolling
  const spacing = Math.max(Math.floor(chartAreaWidth / Math.max(daysInMonth - 1, 1)), 3);

  return (
    <View style={{
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      padding: cardPad,
      overflow: 'hidden',
    }}>
      {/* Header row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: isCompact ? 12 : 20 }}>
        <View style={{ padding: isCompact ? 6 : 8, borderRadius: 12, backgroundColor: isDark ? '#252525' : '#f0fdf4' }}>
          <Info size={isCompact ? 14 : 16} color={tealColor} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: isCompact ? 6 : 16 }}>
          <TouchableOpacity onPress={prevMonth} style={{ padding: 4 }}>
            <ChevronLeft size={isCompact ? 16 : 20} color={tealColor} />
          </TouchableOpacity>
          <Text style={{ fontWeight: '700', color: textColor, minWidth: isCompact ? 70 : 100, textAlign: 'center', fontSize: isCompact ? 11 : 14 }}>
            {monthLabel}
          </Text>
          <TouchableOpacity onPress={nextMonth} style={{ padding: 4 }}>
            <ChevronRight size={isCompact ? 16 : 20} color={tealColor} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary stats */}
      <View style={{ flexDirection: 'row', gap: isCompact ? 6 : 8, marginBottom: isCompact ? 14 : 24 }}>
        <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(13, 148, 136, 0.1)' : '#f0fdfa', borderRadius: 12, padding: isCompact ? 8 : 12, borderWidth: 1, borderColor: isDark ? 'rgba(13, 148, 136, 0.2)' : '#ccfbf1' }}>
          <Text style={{ color: tealColor, fontSize: isCompact ? 7 : 10, fontWeight: '800', marginBottom: 2 }}>TOTAL BULAN INI</Text>
          <Text style={{ color: textColor, fontSize: isCompact ? 13 : 18, fontWeight: '900' }} numberOfLines={1} adjustsFontSizeToFit>{formatRupiahShort(totalRevenue)}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: isDark ? '#252525' : '#f8fafc', borderRadius: 12, padding: isCompact ? 8 : 12 }}>
          <Text style={{ color: isDark ? '#a8a29e' : '#64748b', fontSize: isCompact ? 7 : 10, fontWeight: '800', marginBottom: 2, textTransform: 'uppercase' }}>Hari Tertinggi</Text>
          <Text style={{ color: textColor, fontSize: isCompact ? 13 : 18, fontWeight: '900' }} numberOfLines={1} adjustsFontSizeToFit>{formatRupiahShort(maxRevenue)}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: isDark ? '#252525' : '#f8fafc', borderRadius: 12, padding: isCompact ? 8 : 12 }}>
          <Text style={{ color: isDark ? '#a8a29e' : '#64748b', fontSize: isCompact ? 7 : 10, fontWeight: '800', marginBottom: 2, textTransform: 'uppercase' }}>Hari Aktif</Text>
          <Text style={{ color: textColor, fontSize: isCompact ? 13 : 18, fontWeight: '900' }}>{activeDays}</Text>
        </View>
      </View>

      {/* Chart */}
      <View style={{ marginLeft: -6 }}>
        <LineChart
          data={chartData}
          width={chartAreaWidth}
          height={isCompact ? 130 : 180}
          spacing={spacing}
          initialSpacing={4}
          endSpacing={4}
          color="#0d9488"
          thickness={2}
          dataPointsColor="#0d9488"
          dataPointsRadius={isCompact ? 2 : 3}
          backgroundColor="transparent"
          xAxisColor={isDark ? '#2a2a2a' : '#e2e8f0'}
          yAxisColor={isDark ? '#2a2a2a' : '#e2e8f0'}
          yAxisTextStyle={{ color: isDark ? '#78716c' : '#94a3b8', fontSize: isCompact ? 7 : 9 }}
          xAxisLabelTextStyle={{ color: isDark ? '#78716c' : '#94a3b8', fontSize: isCompact ? 7 : 9 }}
          yAxisLabelWidth={yAxisW}
          noOfSections={4}
          formatYLabel={(val: string) => formatRupiahShort(Number(val))}
          hideRules={false}
          rulesColor={isDark ? '#1a1a1a' : '#f1f5f9'}
          rulesType="solid"
          curved
          areaChart
          startFillColor="#0d9488"
          startOpacity={0.15}
          endFillColor="#0d9488"
          endOpacity={0.02}
          focusEnabled
          showStripOnFocus
          stripColor="#0d9488"
          stripOpacity={0.1}
          stripWidth={2}
          pointerConfig={{
            pointerStripHeight: isCompact ? 110 : 160,
            pointerStripColor: '#0d9488',
            pointerStripWidth: 2,
            pointerColor: '#0d9488',
            radius: 5,
            pointerLabelWidth: 120,
            pointerLabelHeight: 60,
            activatePointersOnLongPress: false,
            autoAdjustPointerLabelPosition: true,
            pointerLabelComponent: (items: any) => (
              <View style={{
                backgroundColor: isDark ? '#1a1a1a' : '#fff',
                borderRadius: 12,
                padding: 8,
                borderWidth: 1,
                borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
                alignItems: 'center',
              }}>
                <Text style={{ color: '#0d9488', fontWeight: '900', fontSize: isCompact ? 11 : 14 }}>
                  {formatRupiah(items[0].value)}
                </Text>
              </View>
            ),
          }}
        />
      </View>
    </View>
  );
}
