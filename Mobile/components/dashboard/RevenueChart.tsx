import React, { useMemo } from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Feather } from '@expo/vector-icons';
import { formatRupiah, formatRupiahShort } from '../../utils/currency';
import type { Transaction } from '../../types';

interface RevenueChartProps {
  transactions: Transaction[];
  width: number;
}

export default function RevenueChart({ transactions, width }: RevenueChartProps) {
  // Mock data for display to match screenshot. 
  // In a real app, this would be computed from transactions.
  const chartData = [
    { value: 10, dataPointText: '10' },
    { value: 20 },
    { value: 18 },
    { value: 40 },
    { value: 36 },
    { value: 60 },
    { value: 54 },
    { value: 85 },
  ];

  // Compute stats
  const totalBulanIni = 11052240;
  const hariTertinggi = 2771300;
  const hariAktif = 9;

  return (
    <View
      style={{
        backgroundColor: '#1a1a1a',
        borderWidth: 1,
        borderColor: '#2a2a2a',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <View>
          <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '900' }}>Tren Pendapatan Harian</Text>
          <Text style={{ color: '#888888', fontSize: 12, marginTop: 2 }}>Mei 2026</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a2a2a', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
          <Text style={{ color: '#888888', fontSize: 10, fontWeight: '700', marginRight: 6 }}>BULAN</Text>
          <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '600', marginRight: 4 }}>May 2026</Text>
          <Feather name="chevron-down" size={14} color="#888888" />
        </View>
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
        <View style={{ flex: 1, backgroundColor: 'rgba(245, 158, 11, 0.1)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)', borderRadius: 12, padding: 12 }}>
          <Text style={{ color: '#f59e0b', fontSize: 10, fontWeight: '800', marginBottom: 4 }}>TOTAL BULAN INI</Text>
          <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '900' }} numberOfLines={1}>{formatRupiah(totalBulanIni)}</Text>
          <Text style={{ color: '#888888', fontSize: 10, marginTop: 2 }}>rata-rata Rp 1.2M</Text>
        </View>
        
        <View style={{ flex: 1, backgroundColor: '#111111', borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 12, padding: 12 }}>
          <Text style={{ color: '#888888', fontSize: 10, fontWeight: '800', marginBottom: 4, textTransform: 'uppercase' }}>Hari Tertinggi</Text>
          <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '900' }} numberOfLines={1}>{formatRupiah(hariTertinggi)}</Text>
          <Text style={{ color: '#888888', fontSize: 10, marginTop: 2 }}>puncak harian</Text>
        </View>

        <View style={{ flex: 1, backgroundColor: '#111111', borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 12, padding: 12 }}>
          <Text style={{ color: '#888888', fontSize: 10, fontWeight: '800', marginBottom: 4, textTransform: 'uppercase' }}>Hari Aktif</Text>
          <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '900' }}>{hariAktif}</Text>
          <Text style={{ color: '#888888', fontSize: 10, marginTop: 2 }}>ada penjualan</Text>
        </View>
      </View>

      {/* Chart */}
      <View style={{ marginLeft: -10 }}>
        <LineChart
          data={chartData}
          width={width - 80} // Adjusted for padding
          height={180}
          thickness={2}
          color="#0d9488"
          dataPointsColor="#0d9488"
          dataPointsRadius={4}
          hideRules
          yAxisTextStyle={{ color: '#888888', fontSize: 10 }}
          xAxisLabelTextStyle={{ color: '#888888', fontSize: 9 }}
          yAxisColor="#2a2a2a"
          xAxisColor="#2a2a2a"
          showReferenceLine1
          referenceLine1Config={{
            color: '#2a2a2a',
            dashWidth: 4,
            dashGap: 6,
          }}
        />
      </View>
    </View>
  );
}
