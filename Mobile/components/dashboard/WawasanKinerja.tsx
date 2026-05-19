import React from 'react';
import { View, Text } from 'react-native';

interface WawasanKinerjaProps {
  numColumns: number;
}

export default function WawasanKinerja({ numColumns }: WawasanKinerjaProps) {
  const metrics = [
    { label: 'Rata-rata Nilai Psnm', value: 'Rp 25.000' },
    { label: 'Tingkat Konversi', value: '33%' },
    { label: 'Retensi Pelanggan', value: '85%' },
    { label: 'Perputaran Inventaris', value: '0 hari' },
  ];

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
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', margin: -8 }}>
        {metrics.map((metric, index) => (
          <View
            key={index}
            style={{
              width: `${100 / numColumns}%`,
              padding: 8,
            }}
          >
            <Text style={{ color: '#888888', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 }} numberOfLines={2}>
              {metric.label}
            </Text>
            <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '900' }}>
              {metric.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
