import React, { useMemo } from 'react';
import { View, Text, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trophy, Star, TrendingUp, Users } from 'lucide-react-native';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { formatRupiahShort } from '../../utils/currency';

export default function LoyaltyScreen() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscape = windowWidth > windowHeight;
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);
  const { customers } = useApp();

  const loyaltyCustomers = useMemo(() =>
    customers.filter(c => (c.loyaltyPoints ?? 0) > 0)
      .sort((a, b) => (b.loyaltyPoints ?? 0) - (a.loyaltyPoints ?? 0)),
    [customers]
  );

  const topVisitors = useMemo(() =>
    [...customers].sort((a, b) => b.totalVisits - a.totalVisits).slice(0, 10),
    [customers]
  );

  const totalPoints = useMemo(() =>
    customers.reduce((s, c) => s + (c.loyaltyPoints ?? 0), 0),
    [customers]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingLeft: isLandscape ? 16 : 60, paddingRight: 16, paddingVertical: 12 }}>
        <Text style={{ color: c.text, fontSize: 22, fontWeight: '900' }}>
          Loyalty & <Text style={{ color: c.accent }}>Kunjungan</Text>
        </Text>
        <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 4 }}>
          Program loyalitas dan tracking kunjungan
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}>
        {/* Stats row */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{
            flex: 1, backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
            borderRadius: 14, padding: 14,
          }}>
            <Trophy size={16} color="#8b5cf6" strokeWidth={2} />
            <Text style={{ color: c.textSecondary, fontSize: 11, marginTop: 8 }}>Anggota Loyal</Text>
            <Text style={{ color: c.text, fontSize: 20, fontWeight: '800' }}>{loyaltyCustomers.length}</Text>
          </View>
          <View style={{
            flex: 1, backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
            borderRadius: 14, padding: 14,
          }}>
            <Star size={16} color={c.accent} strokeWidth={2} />
            <Text style={{ color: c.textSecondary, fontSize: 11, marginTop: 8 }}>Total Poin</Text>
            <Text style={{ color: c.accent, fontSize: 20, fontWeight: '800' }}>{totalPoints.toLocaleString('id-ID')}</Text>
          </View>
        </View>

        {/* Top Visitors */}
        {topVisitors.length > 0 && (
          <View>
            <Text style={{ color: c.text, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
              Top Pengunjung
            </Text>
            {topVisitors.map((cust, idx) => (
              <View key={cust.id} style={{
                backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
                borderRadius: 14, padding: 14, marginBottom: 8,
                flexDirection: 'row', alignItems: 'center', gap: 12,
              }}>
                <View style={{
                  width: 32, height: 32, borderRadius: 16,
                  backgroundColor: idx < 3 ? c.accentBg : (isDark ? '#222' : '#f1f5f9'),
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{
                    color: idx < 3 ? c.accent : c.textMuted,
                    fontSize: 12, fontWeight: '800',
                  }}>#{idx + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontSize: 13, fontWeight: '700' }}>{cust.name}</Text>
                  <Text style={{ color: c.textSecondary, fontSize: 11 }}>
                    {formatRupiahShort(cust.totalSpent)} total belanja
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: c.accent, fontSize: 14, fontWeight: '800' }}>{cust.totalVisits}</Text>
                  <Text style={{ color: c.textMuted, fontSize: 10 }}>kunjungan</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Loyalty Members */}
        {loyaltyCustomers.length > 0 && (
          <View>
            <Text style={{ color: c.text, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
              Anggota Dengan Poin
            </Text>
            {loyaltyCustomers.map(cust => (
              <View key={cust.id} style={{
                backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
                borderRadius: 14, padding: 14, marginBottom: 8,
                flexDirection: 'row', alignItems: 'center', gap: 12,
              }}>
                <View style={{
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: 'rgba(139,92,246,0.15)',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Trophy size={16} color="#8b5cf6" strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontSize: 13, fontWeight: '700' }}>{cust.name}</Text>
                </View>
                <Text style={{ color: '#8b5cf6', fontSize: 14, fontWeight: '800' }}>
                  {(cust.loyaltyPoints ?? 0).toLocaleString('id-ID')} pts
                </Text>
              </View>
            ))}
          </View>
        )}

        {customers.length === 0 && (
          <View style={{
            backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
            borderRadius: 20, padding: 40, alignItems: 'center',
          }}>
            <Users size={48} color={c.textMuted} strokeWidth={1.5} />
            <Text style={{ color: c.textSecondary, fontSize: 14, marginTop: 12 }}>Belum ada data</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
