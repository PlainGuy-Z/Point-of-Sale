import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AlertCircle, Trash2, TrendingUp, TrendingDown } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { formatRupiahShort } from '../../utils/currency';
import { WasteResponse } from '../../services/aiApi';

export default function WastePanel({ wasteInsights }: { wasteInsights: WasteResponse }) {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  const [activeTab, setActiveTab] = useState<'7H' | '14H' | '30H'>('30H');

  if (!wasteInsights) return null;

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
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Trash2 size={18} color={c.error} />
          <Text style={{ color: c.text, fontSize: 16, fontWeight: '800' }}>
            Analisis Waste
          </Text>
        </View>
        <View style={{ flexDirection: 'row', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9', borderRadius: 16, padding: 2 }}>
          {['7H', '14H', '30H'].map(t => (
            <TouchableOpacity 
              key={t}
              onPress={() => setActiveTab(t as any)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 14,
                backgroundColor: activeTab === t ? c.accent : 'transparent'
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '700', color: activeTab === t ? '#fff' : c.textSecondary }}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <View style={{ backgroundColor: c.error + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16 }}>
          <Text style={{ color: c.error, fontSize: 14, fontWeight: '800' }}>
            {formatRupiahShort(wasteInsights.total_waste_cost)}
          </Text>
        </View>
        
        {wasteInsights.trend_percentage !== 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {wasteInsights.trend_percentage > 0 ? <TrendingUp size={12} color={c.error} /> : <TrendingDown size={12} color={c.success} />}
            <Text style={{ color: wasteInsights.trend_percentage > 0 ? c.error : c.success, fontSize: 11, fontWeight: '700' }}>
              {Math.abs(wasteInsights.trend_percentage).toFixed(1)}%
            </Text>
          </View>
        )}
      </View>

      {wasteInsights.top_waste_products && wasteInsights.top_waste_products.length > 0 ? (
        wasteInsights.top_waste_products.map((item, idx) => {
          // calculate a simple relative width for the bar
          const maxWaste = wasteInsights.top_waste_products[0]?.waste_cost || 1;
          const pct = Math.max((item.waste_cost / maxWaste) * 100, 5);
          
          let barColor = c.accent;
          if (idx === 0) barColor = c.error;
          else if (idx === 1) barColor = '#f59e0b';
          
          return (
            <View key={idx} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>{item.name}</Text>
                <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600' }}>{formatRupiahShort(item.waste_cost)}</Text>
              </View>
              <View style={{ height: 6, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                <View style={{ width: `${pct}%`, height: '100%', backgroundColor: barColor, borderRadius: 3 }} />
              </View>
            </View>
          );
        })
      ) : (
        <Text style={{ color: c.textMuted, fontSize: 13, fontStyle: 'italic' }}>Tidak ada data waste signifikan</Text>
      )}
    </View>
  );
}
