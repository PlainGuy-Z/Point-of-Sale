import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trash2, AlertCircle, Plus } from 'lucide-react-native';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { formatRupiah, formatRupiahShort } from '../../utils/currency';
import AddWasteLogModal from './AddWasteLogModal';

export default function WasteLogScreen() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscape = windowWidth > windowHeight;
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);
  const { wasteLogs } = useApp();
  
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  const sorted = useMemo(() =>
    [...wasteLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [wasteLogs]
  );

  const totalLoss = useMemo(() => wasteLogs.reduce((s, w) => s + w.costLoss, 0), [wasteLogs]);

  const reasonLabel: Record<string, string> = {
    expired: 'Kadaluarsa', damaged: 'Rusak', spilled: 'Tumpah', other: 'Lainnya',
  };

  const reasonColor: Record<string, string> = {
    expired: c.error, damaged: c.warning, spilled: '#3b82f6', other: c.textMuted,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingLeft: isLandscape ? 16 : 60, paddingRight: 16, paddingVertical: 12 }}>
        <Text style={{ color: c.text, fontSize: 22, fontWeight: '900' }}>
          Waste <Text style={{ color: c.accent }}>Log</Text>
        </Text>
        <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 4 }}>
          Catatan produk yang terbuang
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}>
        {/* Summary Card */}
        <View style={{
          backgroundColor: c.errorBg, borderWidth: 1,
          borderColor: isDark ? 'rgba(239,68,68,0.2)' : '#fecaca',
          borderRadius: 16, padding: 16,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <View>
            <Text style={{ color: c.textSecondary, fontSize: 11, fontWeight: '600' }}>TOTAL KERUGIAN</Text>
            <Text style={{ color: c.error, fontSize: 24, fontWeight: '900', marginTop: 4 }}>
              {formatRupiah(totalLoss)}
            </Text>
          </View>
          <View style={{
            width: 48, height: 48, borderRadius: 14, backgroundColor: c.errorBg,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Trash2 size={24} color={c.error} strokeWidth={2} />
          </View>
        </View>

        {/* Stats row */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{
            flex: 1, backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
            borderRadius: 14, padding: 14, alignItems: 'center',
          }}>
            <Text style={{ color: c.text, fontSize: 20, fontWeight: '900' }}>{wasteLogs.length}</Text>
            <Text style={{ color: c.textMuted, fontSize: 10, fontWeight: '700', marginTop: 2 }}>Total Entri</Text>
          </View>
          <View style={{
            flex: 1, backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
            borderRadius: 14, padding: 14, alignItems: 'center',
          }}>
            <Text style={{ color: c.text, fontSize: 20, fontWeight: '900' }}>
              {wasteLogs.reduce((s, w) => s + w.quantity, 0)}
            </Text>
            <Text style={{ color: c.textMuted, fontSize: 10, fontWeight: '700', marginTop: 2 }}>Total Item</Text>
          </View>
        </View>

        {/* Waste entries */}
        {sorted.length > 0 ? sorted.map(w => (
          <View key={w.id} style={{
            backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
            borderRadius: 14, padding: 14,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>{w.productName}</Text>
                <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 2 }}>
                  {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(w.date))}
                </Text>
              </View>
              <Text style={{ color: c.error, fontSize: 14, fontWeight: '800' }}>-{formatRupiahShort(w.costLoss)}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <View style={{
                backgroundColor: isDark ? '#222' : '#f1f5f9', borderRadius: 8,
                paddingHorizontal: 8, paddingVertical: 3,
              }}>
                <Text style={{ color: reasonColor[w.reason] || c.textMuted, fontSize: 10, fontWeight: '700' }}>
                  {reasonLabel[w.reason] || w.reason}
                </Text>
              </View>
              <Text style={{ color: c.textSecondary, fontSize: 11 }}>×{w.quantity}</Text>
              {w.notes && <Text style={{ color: c.textMuted, fontSize: 11, flex: 1 }} numberOfLines={1}>{w.notes}</Text>}
            </View>
          </View>
        )) : (
          <View style={{
            backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
            borderRadius: 20, padding: 40, alignItems: 'center',
          }}>
            <Trash2 size={48} color={c.textMuted} strokeWidth={1.5} />
            <Text style={{ color: c.textSecondary, fontSize: 14, marginTop: 12 }}>Belum ada catatan waste</Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => setIsAddModalVisible(true)}
        style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: c.accent,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 10,
          elevation: 6,
          zIndex: 9999,
        }}
      >
        <Plus size={24} color={c.textInverse} strokeWidth={2.5} />
      </TouchableOpacity>

      <AddWasteLogModal 
        visible={isAddModalVisible} 
        onClose={() => setIsAddModalVisible(false)} 
      />
    </SafeAreaView>
  );
}
