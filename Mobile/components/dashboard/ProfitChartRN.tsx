import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react-native';
import { formatRupiah, formatRupiahShort } from '../../utils/currency';
import { transactionLocalDateKey } from '../../utils/analytics/helpers';
import type { Transaction } from '../../types';

interface ProfitChartRNProps {
  transactions: Transaction[];
  isDark: boolean;
}

export default function ProfitChartRN({ transactions, isDark }: ProfitChartRNProps) {
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

  const { chartData, totalRevenue, maxRevenue, activeDays } = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonthNum, 0).getDate();
    
    const dailyData = new Map<string, number>();
    for (let i = 1; i <= daysInMonth; i++) {
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

    const data = Array.from(dailyData.entries()).map(([dateStr, rev]) => {
      tRev += rev;
      if (rev > mRev) mRev = rev;
      if (rev > 0) aDays++;
      
      const day = parseInt(dateStr.split('-')[2], 10);
      return {
        value: rev,
        label: day % 5 === 0 || day === 1 ? String(day) : '',
        date: dateStr,
      };
    });

    return { chartData: data, totalRevenue: tRev, maxRevenue: mRev, activeDays: aDays };
  }, [transactions, selectedYear, selectedMonthNum, monthPrefix]);

  const textColor = isDark ? '#ffffff' : '#0f172a';
  const tealColor = '#0d9488';
  
  return (
    <View style={{
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      padding: 16,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ padding: 8, borderRadius: 12, backgroundColor: isDark ? '#252525' : '#f0fdf4' }}>
            <Info size={16} color={tealColor} />
          </View>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <TouchableOpacity onPress={prevMonth} style={{ padding: 4 }}>
            <ChevronLeft size={20} color={tealColor} />
          </TouchableOpacity>
          <Text style={{ fontWeight: '700', color: textColor, minWidth: 100, textAlign: 'center' }}>
            {monthLabel}
          </Text>
          <TouchableOpacity onPress={nextMonth} style={{ padding: 4 }}>
            <ChevronRight size={20} color={tealColor} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
        <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(13, 148, 136, 0.1)' : '#f0fdfa', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: isDark ? 'rgba(13, 148, 136, 0.2)' : '#ccfbf1' }}>
          <Text style={{ color: tealColor, fontSize: 10, fontWeight: '800', marginBottom: 4 }}>TOTAL BULAN INI</Text>
          <Text style={{ color: textColor, fontSize: 18, fontWeight: '900' }} numberOfLines={1} adjustsFontSizeToFit>{formatRupiahShort(totalRevenue)}</Text>
        </View>
        
        <View style={{ flex: 1, backgroundColor: isDark ? '#252525' : '#f8fafc', borderRadius: 12, padding: 12 }}>
          <Text style={{ color: isDark ? '#a8a29e' : '#64748b', fontSize: 10, fontWeight: '800', marginBottom: 4, textTransform: 'uppercase' }}>Hari Tertinggi</Text>
          <Text style={{ color: textColor, fontSize: 18, fontWeight: '900' }} numberOfLines={1} adjustsFontSizeToFit>{formatRupiahShort(maxRevenue)}</Text>
        </View>

        <View style={{ flex: 1, backgroundColor: isDark ? '#252525' : '#f8fafc', borderRadius: 12, padding: 12 }}>
          <Text style={{ color: isDark ? '#a8a29e' : '#64748b', fontSize: 10, fontWeight: '800', marginBottom: 4, textTransform: 'uppercase' }}>Hari Aktif</Text>
          <Text style={{ color: textColor, fontSize: 18, fontWeight: '900' }}>{activeDays}</Text>
        </View>
      </View>

      <View style={{ marginLeft: -10 }}>
        <LineChart
          data={chartData}
          width={Dimensions.get('window').width - 80}
          height={180}
          color="#0d9488"
          thickness={2.5}
          dataPointsColor="#0d9488"
          dataPointsRadius={4}
          backgroundColor="transparent"
          xAxisColor={isDark ? '#2a2a2a' : '#e2e8f0'}
          yAxisColor={isDark ? '#2a2a2a' : '#e2e8f0'}
          yAxisTextStyle={{ color: isDark ? '#78716c' : '#94a3b8', fontSize: 10 }}
          xAxisLabelTextStyle={{ color: isDark ? '#78716c' : '#94a3b8', fontSize: 9 }}
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
            pointerStripHeight: 160,
            pointerStripColor: '#0d9488',
            pointerStripWidth: 2,
            pointerColor: '#0d9488',
            radius: 6,
            pointerLabelWidth: 120,
            pointerLabelHeight: 60,
            activatePointersOnLongPress: false,
            autoAdjustPointerLabelPosition: true,
            pointerLabelComponent: (items: any) => (
              <View style={{
                backgroundColor: isDark ? '#1a1a1a' : '#fff',
                borderRadius: 12,
                padding: 10,
                borderWidth: 1,
                borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
                alignItems: 'center',
              }}>
                <Text style={{ color: '#0d9488', fontWeight: '900', fontSize: 14 }}>
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
