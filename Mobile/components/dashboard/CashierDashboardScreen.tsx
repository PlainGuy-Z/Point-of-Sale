import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ShoppingCart, DollarSign, Clock, Zap, ArrowRight, Trash2,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useShift } from '../../contexts/ShiftContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { formatRupiah } from '../../utils/currency';
import { appApi } from '../../services/appApi';

interface TxSummaryToday {
  today_count: number;
  today_sales: number;
}

export default function CashierDashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { activeShift, isLoading: shiftLoading } = useShift();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  const [todaySummary, setTodaySummary] = useState<TxSummaryToday | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const loadTodaySummary = useCallback(async () => {
    if (!user?.id || user.role !== 'cashier') return;
    setSummaryLoading(true);
    try {
      const q = `/transactions/summary?scope=today&cashier_id=${encodeURIComponent(user.id)}`;
      const res = await appApi.get<TxSummaryToday>(q);
      setTodaySummary(res);
    } catch {
      setTodaySummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, [user?.id, user?.role]);

  useEffect(() => { void loadTodaySummary(); }, [loadTodaySummary]);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = useMemo(() =>
    new Intl.DateTimeFormat('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Jakarta',
    }).format(now), [now]);

  const formattedTime = useMemo(() =>
    now.toLocaleTimeString('id-ID', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Jakarta',
    }), [now]);

  const hasOpenShift = Boolean(activeShift);
  const shiftTx = activeShift?.current_total_transactions ?? activeShift?.total_transactions ?? 0;
  const shiftSales = activeShift?.current_total_sales ?? activeShift?.total_sales ?? 0;

  const statCards = [
    { title: 'Transaksi Hari Ini', value: (todaySummary?.today_count ?? 0).toLocaleString('id-ID'), Icon: ShoppingCart },
    { title: 'Penjualan Hari Ini', value: formatRupiah(todaySummary?.today_sales ?? 0), Icon: DollarSign },
    { title: 'Transaksi Shift Ini', value: shiftTx.toLocaleString('id-ID'), Icon: Clock },
    { title: 'Penjualan Shift Ini', value: formatRupiah(shiftSales), Icon: Zap },
  ];

  const showSkeleton = shiftLoading || summaryLoading;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}>
        {/* Shift Banner */}
        {!shiftLoading && !activeShift && (
          <View style={{
            backgroundColor: c.warningBg, borderWidth: 1, borderColor: isDark ? 'rgba(245,158,11,0.25)' : '#fcd34d',
            borderRadius: 20, padding: 16,
          }}>
            <Text style={{ color: isDark ? '#fde68a' : '#92400e', fontWeight: '700', fontSize: 14 }}>
              Shift belum dibuka
            </Text>
            <Text style={{ color: c.textSecondary, fontSize: 13, marginTop: 4 }}>
              Buka shift untuk mencatat kas dan menggunakan POS.
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <TouchableOpacity
                onPress={() => router.push('/(cashier)/shift' as any)}
                style={{
                  backgroundColor: c.accent, borderRadius: 20,
                  paddingHorizontal: 16, paddingVertical: 10,
                }}>
                <Text style={{ color: c.textInverse, fontWeight: '700', fontSize: 13 }}>Mulai shift</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Welcome Header */}
        <View style={{
          backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
          borderRadius: 20, padding: 20,
        }}>
          <Text style={{ color: c.text, fontSize: 22, fontWeight: '900' }}>
            Selamat datang, <Text style={{ color: c.accent }}>{user?.name || 'Kasir'}</Text>
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
            <Text style={{ color: c.textSecondary, fontSize: 13 }}>{formattedDate}</Text>
            <View style={{
              backgroundColor: isDark ? '#292524' : '#f0fdfa',
              borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
            }}>
              <Text style={{ color: c.accent, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
                {formattedTime} WIB
              </Text>
            </View>
          </View>
          {/* Shift badge */}
          {!shiftLoading && (
            <View style={{
              alignSelf: 'flex-start', marginTop: 12,
              backgroundColor: hasOpenShift ? c.successBg : c.warningBg,
              borderWidth: 1,
              borderColor: hasOpenShift
                ? (isDark ? 'rgba(16,185,129,0.2)' : '#a7f3d0')
                : (isDark ? 'rgba(245,158,11,0.2)' : '#fde68a'),
              borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
              flexDirection: 'row', alignItems: 'center', gap: 6,
            }}>
              <View style={{
                width: 8, height: 8, borderRadius: 4,
                backgroundColor: hasOpenShift ? c.success : c.warning,
              }} />
              <Text style={{
                color: hasOpenShift ? c.success : c.warning,
                fontSize: 11, fontWeight: '700',
              }}>
                {hasOpenShift ? 'Shift Aktif' : 'Belum Buka Shift'}
              </Text>
            </View>
          )}
        </View>

        {/* Stat Cards */}
        {showSkeleton ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {[0, 1, 2, 3].map(i => (
              <View key={i} style={{
                width: '47%', height: 100,
                backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
                borderRadius: 20, padding: 16,
              }}>
                <View style={{ width: 100, height: 14, backgroundColor: c.bgInput, borderRadius: 6 }} />
                <View style={{ width: 80, height: 24, backgroundColor: c.bgInput, borderRadius: 6, marginTop: 12 }} />
              </View>
            ))}
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {statCards.map(card => (
              <View key={card.title} style={{
                width: '47%',
                backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
                borderRadius: 20, padding: 16,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600', flex: 1 }}>{card.title}</Text>
                  <View style={{
                    padding: 6, borderRadius: 20, borderWidth: 1,
                    borderColor: isDark ? 'rgba(245,158,11,0.3)' : 'rgba(13,148,136,0.3)',
                    backgroundColor: c.accentBg,
                  }}>
                    <card.Icon size={14} color={c.accent} strokeWidth={2} />
                  </View>
                </View>
                <Text style={{ color: c.text, fontSize: 20, fontWeight: '900' }}>{card.value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <Text style={{ color: c.text, fontSize: 16, fontWeight: '700', marginTop: 4 }}>Aksi Cepat</Text>
        <View style={{ gap: 10 }}>
          <TouchableOpacity
            onPress={() => router.push('/(cashier)/pos' as any)}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 14,
              padding: 16, borderRadius: 20, borderWidth: 1,
              backgroundColor: c.accentBg, borderColor: isDark ? 'rgba(245,158,11,0.2)' : 'rgba(13,148,136,0.2)',
            }}>
            <View style={{
              padding: 10, borderRadius: 20,
              backgroundColor: c.accent,
            }}>
              <ShoppingCart size={20} color={c.textInverse} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontWeight: '700', fontSize: 14 }}>Buka POS</Text>
              <Text style={{ color: c.textSecondary, fontSize: 12 }}>Mulai transaksi baru</Text>
            </View>
            <ArrowRight size={18} color={c.textMuted} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
