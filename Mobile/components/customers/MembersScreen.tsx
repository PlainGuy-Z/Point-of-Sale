import React, { useMemo } from 'react';
import { View, Text, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, Phone, Mail, Award } from 'lucide-react-native';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { formatRupiah, formatRupiahShort } from '../../utils/currency';
import type { Customer } from '../../types';

export default function MembersScreen() {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);
  const { customers } = useApp();

  const sorted = useMemo(() =>
    [...customers].sort((a, b) => b.totalSpent - a.totalSpent),
    [customers]
  );

  const totalSpent = useMemo(() => customers.reduce((s, c) => s + c.totalSpent, 0), [customers]);
  const totalVisits = useMemo(() => customers.reduce((s, c) => s + c.totalVisits, 0), [customers]);

  const renderCustomer = ({ item, index }: { item: Customer; index: number }) => (
    <View style={{
      backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
      borderRadius: 14, padding: 14, marginBottom: 10,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{
          width: 40, height: 40, borderRadius: 20, backgroundColor: c.accentBg,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ color: c.accent, fontSize: 16, fontWeight: '800' }}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>{item.name}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
            {item.phone && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Phone size={10} color={c.textMuted} strokeWidth={2} />
                <Text style={{ color: c.textSecondary, fontSize: 11 }}>{item.phone}</Text>
              </View>
            )}
            {item.email && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Mail size={10} color={c.textMuted} strokeWidth={2} />
                <Text style={{ color: c.textSecondary, fontSize: 11 }} numberOfLines={1}>{item.email}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: c.accent, fontSize: 13, fontWeight: '800' }}>
            {formatRupiahShort(item.totalSpent)}
          </Text>
          <Text style={{ color: c.textSecondary, fontSize: 10, marginTop: 2 }}>
            {item.totalVisits} kunjungan
          </Text>
        </View>
      </View>
      {(item.loyaltyPoints ?? 0) > 0 && (
        <View style={{
          alignSelf: 'flex-start', marginTop: 8,
          backgroundColor: isDark ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.08)',
          borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
          flexDirection: 'row', alignItems: 'center', gap: 4,
        }}>
          <Award size={10} color="#8b5cf6" strokeWidth={2} />
          <Text style={{ color: '#8b5cf6', fontSize: 10, fontWeight: '700' }}>
            {item.loyaltyPoints} poin
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <Text style={{ color: c.text, fontSize: 22, fontWeight: '900' }}>
          <Text style={{ color: c.accent }}>Members</Text>
        </Text>
        <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 4 }}>
          {customers.length} pelanggan terdaftar
        </Text>
      </View>

      {/* Summary */}
      <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginBottom: 12 }}>
        <View style={{
          flex: 1, backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
          borderRadius: 14, padding: 14, alignItems: 'center',
        }}>
          <Text style={{ color: c.accent, fontSize: 18, fontWeight: '900' }}>{customers.length}</Text>
          <Text style={{ color: c.textMuted, fontSize: 10, fontWeight: '700' }}>Total</Text>
        </View>
        <View style={{
          flex: 1, backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
          borderRadius: 14, padding: 14, alignItems: 'center',
        }}>
          <Text style={{ color: c.accent, fontSize: 18, fontWeight: '900' }}>
            {formatRupiahShort(totalSpent)}
          </Text>
          <Text style={{ color: c.textMuted, fontSize: 10, fontWeight: '700' }}>Revenue</Text>
        </View>
        <View style={{
          flex: 1, backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
          borderRadius: 14, padding: 14, alignItems: 'center',
        }}>
          <Text style={{ color: c.accent, fontSize: 18, fontWeight: '900' }}>{totalVisits}</Text>
          <Text style={{ color: c.textMuted, fontSize: 10, fontWeight: '700' }}>Kunjungan</Text>
        </View>
      </View>

      <FlatList
        data={sorted}
        renderItem={renderCustomer}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Users size={48} color={c.textMuted} strokeWidth={1.5} />
            <Text style={{ color: c.textSecondary, fontSize: 14, marginTop: 12 }}>
              Belum ada pelanggan terdaftar
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
