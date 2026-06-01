import React from 'react';
import { View, Text } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { formatRupiahShort } from '../../utils/currency';

export default function WastePanel({ wasteInsights }: { wasteInsights: any }) {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  if (!wasteInsights) return null;

  return (
    <View style={{
      backgroundColor: c.bgCard,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ color: c.text, fontSize: 16, fontWeight: '800' }}>
          Analisis Waste (Kerugian)
        </Text>
      </View>
      
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.error + '20', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <AlertCircle size={20} color={c.error} />
        </View>
        <View>
          <Text style={{ color: c.textSecondary, fontSize: 12 }}>Total Kerugian (HPP)</Text>
          <Text style={{ color: c.error, fontSize: 18, fontWeight: '800' }}>
            {formatRupiahShort(wasteInsights.totalLoss)}
          </Text>
        </View>
      </View>

      <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>Top Item Terbuang</Text>
      {wasteInsights.topWaste && wasteInsights.topWaste.length > 0 ? (
        wasteInsights.topWaste.map((item: any, idx: number) => (
          <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: idx < wasteInsights.topWaste.length - 1 ? 1 : 0, borderBottomColor: c.borderLight }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>{item.name}</Text>
              <Text style={{ color: c.textMuted, fontSize: 12, marginLeft: 8 }}>({item.wasteQty}x)</Text>
            </View>
            <Text style={{ color: c.error, fontSize: 14, fontWeight: '700' }}>{formatRupiahShort(item.wasteCost)}</Text>
          </View>
        ))
      ) : (
        <Text style={{ color: c.textMuted, fontSize: 13, fontStyle: 'italic' }}>Tidak ada data waste signifikan</Text>
      )}
    </View>
  );
}
