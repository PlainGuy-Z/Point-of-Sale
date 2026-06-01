import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';

export default function MenuMatrix({ categoryPerformance }: { categoryPerformance: any[] }) {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  if (!categoryPerformance || categoryPerformance.length === 0) return null;

  return (
    <View style={{
      backgroundColor: c.bgCard,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    }}>
      <Text style={{ color: c.text, fontSize: 16, fontWeight: '800', marginBottom: 16 }}>
        Performa Kategori
      </Text>
      
      {categoryPerformance.map((item: any, idx: number) => (
        <View key={idx} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>{item.category}</Text>
            <Text style={{ color: c.textSecondary, fontSize: 14, fontWeight: '700' }}>{item.percentage}%</Text>
          </View>
          <View style={{ height: 8, backgroundColor: c.borderLight, borderRadius: 4, overflow: 'hidden' }}>
            <View style={{ width: `${item.percentage}%`, height: '100%', backgroundColor: c.accent, borderRadius: 4 }} />
          </View>
        </View>
      ))}
    </View>
  );
}
