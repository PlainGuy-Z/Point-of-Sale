import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AlertCircle, Clock, ShoppingCart, DollarSign, PenTool } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useShift } from '../../contexts/ShiftContext';
import { useTheme } from '../../contexts/ThemeContext';
import { formatRupiah } from '../../utils/currency';
import { formatFullDate, formatClock } from '../../utils/dateFormatter';
import { api } from '../../services/api';

export default function CashierDashboard() {
  const { user } = useAuth();
  const { activeShift, isLoading: shiftLoading } = useShift();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const insets = useSafeAreaInsets();

  const [now, setNow] = useState(new Date());
  const [summary, setSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchSummary = async () => {
      if (!user?.id) return;
      try {
        setSummaryLoading(true);
        // Using same path as web: GET /transactions/summary?scope=today&cashier_id={user.id}
        const res = await api.get<{ data: any }>(`/transactions/summary?scope=today&cashier_id=${user.id}`);
        if (mounted) {
          setSummary(res.data);
          setSummaryError('');
        }
      } catch (err: any) {
        if (mounted) {
          setSummaryError(err.message || 'Gagal memuat ringkasan hari ini.');
        }
      } finally {
        if (mounted) setSummaryLoading(false);
      }
    };

    fetchSummary();
    return () => { mounted = false; };
  }, [user?.id, activeShift]);

  const skeletonAnim = React.useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    if (summaryLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(skeletonAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(skeletonAnim, { toValue: 0.3, duration: 800, useNativeDriver: true })
        ])
      ).start();
    }
  }, [summaryLoading]);

  // Derived values
  const todayTransactions = summary?.totalTransactions ?? 0;
  const todaySales = summary?.totalRevenue ?? 0;
  const shiftTransactions = activeShift?.current_total_transactions ?? activeShift?.total_transactions ?? 0;
  const shiftSales = activeShift?.current_total_sales ?? activeShift?.total_sales ?? 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#0f0f0f' : '#f8fafc' }} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: insets.bottom + 24, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Shift Warning Banner */}
        {!shiftLoading && !activeShift && (
          <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb',
            borderWidth: 1, borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : '#fde68a',
            borderRadius: 16, padding: 16,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <AlertCircle size={20} color={isDark ? '#f59e0b' : '#d97706'} />
              <View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#ffffff' : '#92400e' }}>
                  Shift belum dibuka
                </Text>
                <Text style={{ fontSize: 12, color: isDark ? '#d6d3d1' : '#b45309', marginTop: 2 }}>
                  Buka shift untuk mulai mencatat transaksi.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(cashier)/shift')}
              style={{ backgroundColor: isDark ? '#f59e0b' : '#d97706', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Halaman Shift</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 2. Welcome Header Card */}
        <View style={{
          borderRadius: 16, padding: 20,
          backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
          borderWidth: 1, borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Text style={{ fontSize: 24, fontWeight: '900', color: isDark ? '#ffffff' : '#0f172a' }}>
                Selamat datang, <Text style={{ color: isDark ? '#f59e0b' : '#0d9488' }}>{user?.name || 'Kasir'}</Text>
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <Clock size={14} color={isDark ? '#a8a29e' : '#64748b'} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#a8a29e' : '#64748b' }}>
                  {formatFullDate(now)} • {formatClock(now)}
                </Text>
              </View>
            </View>

            {activeShift ? (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                backgroundColor: isDark ? 'rgba(74, 222, 128, 0.15)' : '#dcfce7',
                paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
                borderWidth: 1, borderColor: isDark ? 'rgba(74, 222, 128, 0.3)' : '#bbf7d0',
              }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isDark ? '#4ade80' : '#16a34a' }} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#4ade80' : '#16a34a' }}>Shift Aktif</Text>
              </View>
            ) : (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7',
                paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
                borderWidth: 1, borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : '#fde68a',
              }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isDark ? '#f59e0b' : '#d97706' }} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#f59e0b' : '#d97706' }}>Shift Tutup</Text>
              </View>
            )}
          </View>
        </View>

        {/* 3. Error Banner */}
        {summaryError ? (
          <View style={{ padding: 12, borderRadius: 12, backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2', borderWidth: 1, borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#fecaca' }}>
            <Text style={{ color: isDark ? '#f87171' : '#dc2626', fontSize: 12 }}>{summaryError}</Text>
          </View>
        ) : null}

        {/* 4. Stat Cards Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {[
            { label: 'Transaksi Hari Ini', value: todayTransactions, icon: ShoppingCart, color: isDark ? '#3b82f6' : '#2563eb', bg: isDark ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff' },
            { label: 'Penjualan Hari Ini', value: formatRupiah(todaySales), icon: DollarSign, color: isDark ? '#10b981' : '#059669', bg: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ecfdf5' },
            { label: 'Transaksi Shift Ini', value: shiftTransactions, icon: ShoppingCart, color: isDark ? '#8b5cf6' : '#7c3aed', bg: isDark ? 'rgba(139, 92, 246, 0.1)' : '#faf5ff' },
            { label: 'Penjualan Shift Ini', value: formatRupiah(shiftSales), icon: DollarSign, color: isDark ? '#f59e0b' : '#d97706', bg: isDark ? 'rgba(245, 158, 11, 0.1)' : '#fffbeb' },
          ].map((stat, i) => (
            <View key={i} style={{
              width: '48%', padding: 16, borderRadius: 16,
              backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
              borderWidth: 1, borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
            }}>
              <View style={{ padding: 8, borderRadius: 12, backgroundColor: stat.bg, alignSelf: 'flex-start', marginBottom: 12 }}>
                <stat.icon size={20} color={stat.color} />
              </View>
              {summaryLoading ? (
                <Animated.View style={{ height: 28, width: '80%', backgroundColor: isDark ? '#2a2a2a' : '#e2e8f0', borderRadius: 4, opacity: skeletonAnim }} />
              ) : (
                <Text style={{ fontSize: i % 2 === 1 ? 20 : 24, fontWeight: '900', color: isDark ? '#ffffff' : '#0f172a' }} numberOfLines={1} adjustsFontSizeToFit>{stat.value}</Text>
              )}
              <Text style={{ fontSize: 10, fontWeight: '600', color: isDark ? '#78716c' : '#64748b', marginTop: 4, textTransform: 'uppercase' }}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* 5. Quick Actions */}
        <View style={{ gap: 12, marginTop: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', textTransform: 'uppercase', color: isDark ? '#78716c' : '#64748b' }}>Aksi Cepat</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={() => router.push('/(cashier)/pos' as any)}
              style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                backgroundColor: isDark ? '#0d9488' : '#0f766e', paddingVertical: 14, borderRadius: 12,
              }}
            >
              <ShoppingCart size={18} color="#ffffff" />
              <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '800' }}>Buka POS</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => router.push('/(cashier)/waste' as any)}
              style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                backgroundColor: isDark ? '#1a1a1a' : '#ffffff', paddingVertical: 14, borderRadius: 12,
                borderWidth: 1, borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
              }}
            >
              <PenTool size={18} color={isDark ? '#d6d3d1' : '#475569'} />
              <Text style={{ color: isDark ? '#ffffff' : '#0f172a', fontSize: 14, fontWeight: '700' }}>Catat Waste</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
