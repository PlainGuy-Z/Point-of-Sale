import React from 'react';
import { View, Text } from 'react-native';
import { Clock, Users } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { formatRupiahShort } from '../../utils/currency';

interface ShiftItem {
  id: string;
  cashierName: string;
  openedAt: string;
  closedAt: string | null;
  status: 'active' | 'closed';
  totalSales: number;
  transactionCount: number;
}

interface ShiftPanelProps {
  shifts: ShiftItem[];
  activeCount: number;
}

export default function ShiftPanel({ shifts, activeCount }: ShiftPanelProps) {
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
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{
            width: 32, height: 32, borderRadius: 10,
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            alignItems: 'center', justifyContent: 'center'
          }}>
            <Users size={16} color={c.accent} />
          </View>
          <Text style={{ color: c.text, fontSize: 16, fontWeight: '800' }}>Pemantauan Shift</Text>
        </View>
        <View style={{ backgroundColor: activeCount > 0 ? c.successBg : c.borderLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
          <Text style={{ color: activeCount > 0 ? c.success : c.textMuted, fontSize: 10, fontWeight: '700' }}>
            {activeCount} Aktif
          </Text>
        </View>
      </View>

      {shifts.length > 0 ? (
        <View style={{ gap: 10 }}>
          {shifts.map((shift) => (
            <View key={shift.id} style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: isDark ? '#1a1a1a' : '#f8fafc',
              padding: 12,
              borderRadius: 12,
            }}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>{shift.cashierName}</Text>
                  <View style={{
                    width: 6, height: 6, borderRadius: 3,
                    backgroundColor: shift.status === 'active' ? c.success : c.textMuted
                  }} />
                  <Text style={{ color: shift.status === 'active' ? c.success : c.textSecondary, fontSize: 11, fontWeight: '600' }}>
                    {shift.status === 'active' ? 'Buka' : 'Selesai'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Clock size={12} color={c.textMuted} />
                  <Text style={{ color: c.textSecondary, fontSize: 11 }}>
                    {new Date(shift.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {shift.closedAt ? ` - ${new Date(shift.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: c.accent, fontSize: 13, fontWeight: '800' }}>
                  {formatRupiahShort(shift.totalSales)}
                </Text>
                <Text style={{ color: c.textSecondary, fontSize: 11 }}>
                  {shift.transactionCount} Transaksi
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={{ paddingVertical: 10, alignItems: 'center' }}>
          <Text style={{ color: c.textSecondary, fontSize: 13 }}>Belum ada data shift terbaru.</Text>
        </View>
      )}
    </View>
  );
}
