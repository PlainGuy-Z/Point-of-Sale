import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Inbox } from 'lucide-react-native';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { formatRupiah, formatRupiahShort } from '../../utils/currency';
import type { Transaction } from '../../types';

const filters = [
  { label: 'Hari Ini', days: 0 },
  { label: 'Kemarin', days: 1 },
  { label: '7 Hari', days: 7 },
  { label: '30 Hari', days: 30 },
];

export default function HistoryScreen() {
  const { transactions } = useApp();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);
  const [filterIdx, setFilterIdx] = useState(0);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const filtered = useMemo(() => {
    const now = new Date();
    const f = filters[filterIdx];
    if (f.days === 0) {
      const todayStr = now.toDateString();
      return transactions.filter(t => new Date(t.date).toDateString() === todayStr);
    }
    if (f.days === 1) {
      const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
      return transactions.filter(t => new Date(t.date).toDateString() === yesterday.toDateString());
    }
    const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - f.days);
    return transactions.filter(t => new Date(t.date) >= cutoff);
  }, [transactions, filterIdx]);

  const totalAmount = useMemo(() => filtered.reduce((s, t) => s + t.total, 0), [filtered]);

  const methodLabel: Record<string, string> = { cash: 'Tunai', card: 'Kartu', qris: 'QRIS' };

  const renderItem = ({ item }: { item: Transaction }) => (
    <TouchableOpacity onPress={() => setSelectedTx(item)} style={{
      backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
      borderRadius: 16, padding: 14, marginBottom: 12, marginHorizontal: 16,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ color: c.textSecondary, fontSize: 12 }}>
          {new Intl.DateTimeFormat('id-ID', { timeStyle: 'short' }).format(new Date(item.date))}
        </Text>
        <Text style={{ color: c.accent, fontWeight: '800', fontSize: 14 }}>{formatRupiah(item.total)}</Text>
      </View>
      <Text style={{ color: c.text, fontSize: 13, marginBottom: 4 }} numberOfLines={1}>
        {item.items.slice(0, 3).map(i => `${i.name} x${i.quantity}`).join(', ')}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ backgroundColor: c.bgInput, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
          <Text style={{ color: c.textSecondary, fontSize: 10, fontWeight: '600' }}>
            {methodLabel[item.paymentMethod] || item.paymentMethod}
          </Text>
        </View>
        {item.cashierName && <Text style={{ color: c.textMuted, fontSize: 11 }}>{item.cashierName}</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <Text style={{ color: c.text, fontSize: 20, fontWeight: '900', paddingHorizontal: 16, paddingVertical: 12 }}>
        Riwayat Transaksi
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginBottom: 8 }}>
        {filters.map((f, i) => (
          <TouchableOpacity key={f.label} onPress={() => setFilterIdx(i)} style={{
            backgroundColor: filterIdx === i ? c.accent : c.bgCard,
            borderWidth: filterIdx === i ? 0 : 1, borderColor: c.border,
            borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8,
          }}>
            <Text style={{
              color: filterIdx === i ? c.textInverse : c.textSecondary,
              fontSize: 13, fontWeight: '600',
            }}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={{ color: c.textSecondary, fontSize: 12, paddingHorizontal: 16, paddingVertical: 8 }}>
        {filtered.length} transaksi • {formatRupiahShort(totalAmount)}
      </Text>

      <FlatList data={filtered} renderItem={renderItem} keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Inbox size={48} color={c.textMuted} strokeWidth={1.5} />
            <Text style={{ color: c.textSecondary, fontSize: 14, marginTop: 12 }}>Belum ada transaksi</Text>
          </View>
        }
      />

      {/* Detail Modal */}
      <Modal visible={!!selectedTx} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{
            backgroundColor: c.bgCard,
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            padding: 24, maxHeight: '80%',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ color: c.text, fontSize: 18, fontWeight: '800' }}>Detail Transaksi</Text>
              <TouchableOpacity onPress={() => setSelectedTx(null)}>
                <Text style={{ color: c.textMuted, fontSize: 22 }}>✕</Text>
              </TouchableOpacity>
            </View>
            {selectedTx && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={{ color: c.textSecondary, fontSize: 12, marginBottom: 12 }}>
                  #{selectedTx.id.slice(-8).toUpperCase()} • {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(selectedTx.date))}
                </Text>
                {selectedTx.items.map((item, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                    <Text style={{ color: c.text, fontSize: 13, flex: 1 }}>{item.name} x{item.quantity}</Text>
                    <Text style={{ color: c.text, fontSize: 13, fontWeight: '600' }}>{formatRupiah(item.price * item.quantity)}</Text>
                  </View>
                ))}
                <View style={{ height: 1, backgroundColor: c.border, marginVertical: 12 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: c.text, fontSize: 16, fontWeight: '900' }}>Total</Text>
                  <Text style={{ color: c.accent, fontSize: 16, fontWeight: '900' }}>{formatRupiah(selectedTx.total)}</Text>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
