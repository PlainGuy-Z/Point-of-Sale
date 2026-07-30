import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useShift } from '../../contexts/ShiftContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { formatRupiah, formatRupiahShort } from '../../utils/currency';
import Numpad from '../common/Numpad';
import {
  Clock, ShoppingBag, DollarSign, TrendingUp, ArrowDownCircle,
} from 'lucide-react-native';
import { SkeletonCard, SkeletonText } from '../common/Skeleton';

export default function ShiftScreen() {
  const { user } = useAuth();
  const { activeShift, isLoading, openShift, closeShift } = useShift();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  const [kasAwalStr, setKasAwalStr] = useState('');
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closingCashStr, setClosingCashStr] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duration, setDuration] = useState('');

  useEffect(() => {
    if (!activeShift) return;
    const update = () => {
      const opened = new Date(activeShift.opened_at);
      const diff = Math.floor((Date.now() - opened.getTime()) / 60000);
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      setDuration(`${h} jam ${m} menit`);
    };
    update();
    const iv = setInterval(update, 60000);
    return () => clearInterval(iv);
  }, [activeShift]);

  const handleOpen = async () => {
    const amount = parseInt(kasAwalStr || '0', 10);
    if (amount <= 0) return;
    setIsSubmitting(true);
    try { await openShift(amount); setKasAwalStr(''); } finally { setIsSubmitting(false); }
  };

  const handleClose = async () => {
    const amount = parseInt(closingCashStr || '0', 10);
    setIsSubmitting(true);
    try {
      await closeShift(amount, closeNotes || undefined);
      setShowCloseModal(false); setClosingCashStr(''); setCloseNotes('');
    } finally { setIsSubmitting(false); }
  };

  const stats = useMemo(() => {
    if (!activeShift) return null;
    const txCount = activeShift.current_total_transactions ?? activeShift.total_transactions;
    const totalSales = activeShift.current_total_sales ?? activeShift.total_sales;
    const avg = txCount > 0 ? totalSales / txCount : 0;
    return { txCount, totalSales, avg };
  }, [activeShift]);

  const expectedCash = useMemo(() => {
    if (!activeShift) return 0;
    return activeShift.current_expected_cash ?? (activeShift.opening_cash + (activeShift.current_total_sales ?? activeShift.total_sales));
  }, [activeShift]);

  const closingCash = parseInt(closingCashStr || '0', 10);
  const difference = closingCash - expectedCash;

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg, padding: 16 }}>
        <View style={{ gap: 20 }}>
          <View style={{ alignItems: 'center', marginVertical: 20 }}>
            <SkeletonCard width={100} height={100} borderRadius={50} style={{ marginBottom: 16 }} />
            <SkeletonText width={150} height={20} />
          </View>
          <SkeletonCard width="100%" height={240} borderRadius={16} />
        </View>
      </SafeAreaView>
    );
  }

  // No active shift — open shift UI
  if (!activeShift) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg, padding: 16 }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Clock size={64} color={c.accent} strokeWidth={1.5} />
          <Text style={{ color: c.text, fontSize: 20, fontWeight: '900', marginTop: 16 }}>
            Belum Ada Shift Aktif
          </Text>
          <Text style={{ color: c.textSecondary, fontSize: 14, marginTop: 8 }}>
            {new Intl.DateTimeFormat('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date())}
          </Text>
          <Text style={{ color: c.textSecondary, fontSize: 13, marginTop: 4 }}>{user?.name}</Text>
        </View>
        <View style={{
          backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
          borderRadius: 16, padding: 20, marginBottom: 16,
        }}>
          <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>MODAL AWAL (Rp)</Text>
          <View style={{
            backgroundColor: c.bgInput, borderRadius: 12, padding: 16,
            alignItems: 'center', marginBottom: 12,
          }}>
            <Text style={{ color: c.text, fontSize: 28, fontWeight: '900' }}>
              {formatRupiah(parseInt(kasAwalStr || '0', 10))}
            </Text>
          </View>
          <Numpad value={kasAwalStr} onChange={setKasAwalStr} />
        </View>
        <TouchableOpacity onPress={handleOpen}
          disabled={isSubmitting || parseInt(kasAwalStr || '0', 10) <= 0}
          style={{
            backgroundColor: isSubmitting ? (isDark ? '#b47708' : '#0d7377') : c.accent,
            borderRadius: 16, paddingVertical: 18, alignItems: 'center',
          }}>
          {isSubmitting
            ? <ActivityIndicator color={c.textInverse} />
            : <Text style={{ color: c.textInverse, fontWeight: '900', fontSize: 16 }}>MULAI SHIFT</Text>
          }
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Active shift UI
  const statItems = [
    { label: 'Transaksi', value: String(stats?.txCount ?? 0), Icon: ShoppingBag },
    { label: 'Total', value: formatRupiahShort(stats?.totalSales ?? 0), Icon: DollarSign },
    { label: 'Rata-rata', value: formatRupiahShort(stats?.avg ?? 0), Icon: TrendingUp },
    { label: 'Kas Masuk', value: formatRupiahShort(stats?.totalSales ?? 0), Icon: ArrowDownCircle },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {/* Active Badge */}
        <View style={{
          alignSelf: 'center', backgroundColor: c.successBg,
          borderWidth: 1, borderColor: isDark ? 'rgba(16,185,129,0.3)' : '#a7f3d0',
          borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
          flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20,
        }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.success }} />
          <Text style={{ color: c.success, fontWeight: '700', fontSize: 13 }}>Shift Aktif</Text>
        </View>

        {/* Time Info */}
        <View style={{
          backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
          borderRadius: 16, padding: 20, marginBottom: 16,
        }}>
          <Text style={{ color: c.textSecondary, fontSize: 12 }}>
            Dibuka: {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(activeShift.opened_at))}
          </Text>
          <Text style={{ color: c.text, fontSize: 16, fontWeight: '700', marginTop: 4 }}>Durasi: {duration}</Text>
          <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 4 }}>
            Kas Awal: {formatRupiah(activeShift.opening_cash)}
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          {statItems.map(s => (
            <View key={s.label} style={{
              width: '47%', backgroundColor: c.bgCard, borderWidth: 1,
              borderColor: c.border, borderRadius: 14, padding: 14,
            }}>
              <s.Icon size={16} color={c.textSecondary} strokeWidth={2} />
              <Text style={{ color: c.textSecondary, fontSize: 11, marginTop: 8 }}>{s.label}</Text>
              <Text style={{ color: c.text, fontSize: 18, fontWeight: '800', marginTop: 2 }}>{s.value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Close Shift Button */}
      <View style={{ padding: 16 }}>
        <TouchableOpacity onPress={() => setShowCloseModal(true)} style={{
          backgroundColor: c.errorBg, borderWidth: 1,
          borderColor: isDark ? 'rgba(239,68,68,0.3)' : '#fecaca',
          borderRadius: 14, paddingVertical: 16, alignItems: 'center',
        }}>
          <Text style={{ color: c.error, fontWeight: '800', fontSize: 15 }}>Tutup Shift</Text>
        </TouchableOpacity>
      </View>

      {/* Close Shift Modal */}
      <Modal visible={showCloseModal} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{
            backgroundColor: c.bgCard,
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            padding: 24, maxHeight: '85%',
          }}>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: '800', marginBottom: 20 }}>Tutup Shift</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>UANG DI LACI (Rp)</Text>
              <View style={{
                backgroundColor: c.bgInput, borderRadius: 12, padding: 12,
                alignItems: 'center', marginBottom: 12,
              }}>
                <Text style={{ color: c.text, fontSize: 24, fontWeight: '900' }}>{formatRupiah(closingCash)}</Text>
              </View>
              <Numpad value={closingCashStr} onChange={setClosingCashStr} />

              <View style={{
                backgroundColor: c.bgInput, borderRadius: 12, padding: 12, marginTop: 16, gap: 6,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: c.textSecondary, fontSize: 13 }}>Kas Seharusnya</Text>
                  <Text style={{ color: c.text, fontSize: 13, fontWeight: '600' }}>{formatRupiah(expectedCash)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: c.textSecondary, fontSize: 13 }}>Selisih</Text>
                  <Text style={{
                    color: difference >= 0 ? c.success : c.error,
                    fontSize: 13, fontWeight: '800',
                  }}>{formatRupiah(difference)}</Text>
                </View>
              </View>

              <TextInput value={closeNotes} onChangeText={setCloseNotes}
                placeholder="Catatan (opsional)" placeholderTextColor={c.textMuted}
                multiline style={{
                  backgroundColor: c.bgInput, borderRadius: 12,
                  color: c.text, padding: 12, marginTop: 12,
                  minHeight: 60, textAlignVertical: 'top',
                }}
              />
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
              <TouchableOpacity onPress={() => setShowCloseModal(false)} style={{
                flex: 1, backgroundColor: c.bgInput, borderRadius: 12,
                paddingVertical: 14, alignItems: 'center',
              }}>
                <Text style={{ color: c.text, fontWeight: '600' }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClose} disabled={isSubmitting} style={{
                flex: 1, backgroundColor: c.error, borderRadius: 12,
                paddingVertical: 14, alignItems: 'center',
              }}>
                {isSubmitting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={{ color: '#fff', fontWeight: '800' }}>Tutup Shift</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
