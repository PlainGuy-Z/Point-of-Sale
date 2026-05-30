import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AlertTriangle, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { WasteResponse } from '../../services/aiApi';
import { formatRupiahShort } from '../../utils/currency';

interface WastePanelProps {
  waste: WasteResponse | null;
  selectedDays: 7 | 14 | 30;
  onDaysChange: (days: 7 | 14 | 30) => void;
  isLoading: boolean;
}

export default function WastePanel({ waste, selectedDays, onDaysChange, isLoading }: WastePanelProps) {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  return (
    <View style={{
      backgroundColor: c.bgCard,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{
            width: 32, height: 32, borderRadius: 10,
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            alignItems: 'center', justifyContent: 'center'
          }}>
            <AlertTriangle size={16} color={c.warning} />
          </View>
          <Text style={{ color: c.text, fontSize: 16, fontWeight: '800' }}>Analisis Kerugian (Waste)</Text>
        </View>

        {/* Period Selector */}
        <View style={{ flexDirection: 'row', backgroundColor: c.bg, borderRadius: 10, padding: 2 }}>
          {([7, 14, 30] as const).map(days => (
            <TouchableOpacity
              key={days}
              onPress={() => onDaysChange(days)}
              disabled={isLoading}
              style={{
                paddingHorizontal: 12, paddingVertical: 6,
                backgroundColor: selectedDays === days ? c.bgCard : 'transparent',
                borderRadius: 8,
                shadowColor: selectedDays === days ? '#000' : 'transparent',
                shadowOpacity: 0.1, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }
              }}
            >
              <Text style={{
                color: selectedDays === days ? c.text : c.textMuted,
                fontSize: 11, fontWeight: '700'
              }}>{days}H</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading && !waste ? (
        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
          <RefreshCw size={24} color={c.textMuted} />
          <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 8 }}>Menganalisis...</Text>
        </View>
      ) : !waste ? (
        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
          <Text style={{ color: c.textMuted, fontSize: 13 }}>Gagal memuat data waste.</Text>
        </View>
      ) : (
        <>
          {/* Summary */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: c.borderLight }}>
            <View>
              <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 4 }}>Total Nilai Kerugian</Text>
              <Text style={{ color: c.text, fontSize: 24, fontWeight: '900' }}>
                {formatRupiahShort(waste.total_waste_cost)}
              </Text>
            </View>
            {waste.trend_percentage !== 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: waste.trend_percentage < 0 ? (isDark ? '#222' : '#f0fdf4') : (isDark ? '#331111' : '#fef2f2'), paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                {waste.trend_percentage < 0 ? (
                  <TrendingDown size={14} color={c.success} />
                ) : (
                  <TrendingUp size={14} color={c.error} />
                )}
                <Text style={{ color: waste.trend_percentage < 0 ? c.success : c.error, fontSize: 11, fontWeight: '700' }}>
                  {waste.trend_percentage > 0 ? '+' : ''}{waste.trend_percentage.toFixed(1)}% vs sebelumnya
                </Text>
              </View>
            )}
          </View>

          {/* Top Products */}
          {waste.top_waste_products.length > 0 ? (
            <View>
              <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 12 }}>Produk Paling Banyak Terbuang</Text>
              {waste.top_waste_products.map((item, i) => (
                <View key={item.product_id} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: c.text, fontSize: 13, fontWeight: '600' }}>
                      {i + 1}. {item.name}
                    </Text>
                    <Text style={{ color: c.warning, fontSize: 13, fontWeight: '700' }}>
                      {item.waste_qty} dibuang
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ flex: 1, height: 6, backgroundColor: c.borderLight, borderRadius: 3, overflow: 'hidden' }}>
                      <View style={{ width: `${Math.min(item.waste_ratio * 100, 100)}%`, height: '100%', backgroundColor: c.warning, borderRadius: 3 }} />
                    </View>
                    <Text style={{ color: c.textSecondary, fontSize: 11, width: 40, textAlign: 'right' }}>
                      {(item.waste_ratio * 100).toFixed(0)}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={{ paddingVertical: 10, alignItems: 'center' }}>
              <Text style={{ color: c.textSecondary, fontSize: 13 }}>Tidak ada data kerugian pada periode ini.</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}
