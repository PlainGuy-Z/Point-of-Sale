import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Clock,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  ArrowRight,
  AlertCircle,
} from 'lucide-react-native';
import { useShift } from '../../contexts/ShiftContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { formatRupiah, formatRupiahShort } from '../../utils/currency';
import ShiftOpenModal from './ShiftOpenModal';
import ShiftCloseModal from './ShiftCloseModal';

export default function CashierShiftHub() {
  const router = useRouter();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscape = windowWidth > windowHeight;
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  const { activeShift, isLoading, error } = useShift();

  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  // Calculate duration
  const duration = useMemo(() => {
    if (!activeShift) return '';
    const opened = new Date(activeShift.opened_at);
    const diff = Math.floor((Date.now() - opened.getTime()) / 60000);
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h}j ${m}m`;
  }, [activeShift]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!activeShift) return null;
    const txCount = activeShift.current_total_transactions ?? activeShift.total_transactions ?? 0;
    const totalSales = activeShift.current_total_sales ?? activeShift.total_sales ?? 0;
    const avg = txCount > 0 ? totalSales / txCount : 0;
    return { txCount, totalSales, avg };
  }, [activeShift]);

  const expectedCash = useMemo(() => {
    if (!activeShift) return 0;
    return activeShift.current_expected_cash ?? (activeShift.opening_cash + (activeShift.current_total_sales ?? activeShift.total_sales ?? 0));
  }, [activeShift]);

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={c.accent} />
          <Text style={{
            color: c.textSecondary,
            marginTop: 12,
            fontSize: 14,
          }}>
            Memuat status shift...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: isLandscape ? 100 : 160,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{
            color: c.text,
            fontSize: 24,
            fontWeight: '900',
            marginBottom: 4,
          }}>
            Manajemen Shift
          </Text>
          <Text style={{
            color: c.textSecondary,
            fontSize: 13,
          }}>
            Buka shift, kelola penjualan, dan tutup dengan rekonsiliasi kas
          </Text>
        </View>

        {/* Error Alert */}
        {error && (
          <View style={{
            backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.05)',
            borderWidth: 1,
            borderColor: isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.2)',
            borderRadius: 12,
            padding: 12,
            flexDirection: 'row',
            gap: 10,
            marginBottom: 16,
          }}>
            <AlertCircle size={18} color="#ef4444" strokeWidth={2} />
            <Text style={{
              color: '#ef4444',
              fontSize: 12,
              flex: 1,
              fontWeight: '500',
            }}>
              {error}
            </Text>
          </View>
        )}

        {!activeShift ? (
          // No Active Shift - Open Shift Prompt
          <View style={{
            backgroundColor: c.bgCard,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
          }}>
            <View style={{ alignItems: 'center', gap: 16 }}>
              <View style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                backgroundColor: isDark ? 'rgba(217,119,6,0.1)' : 'rgba(217,119,6,0.1)',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Clock size={32} color={c.accent} strokeWidth={1.5} />
              </View>

              <View style={{ alignItems: 'center', gap: 8 }}>
                <Text style={{
                  color: c.text,
                  fontSize: 18,
                  fontWeight: '800',
                  textAlign: 'center',
                }}>
                  Belum Ada Shift Aktif
                </Text>
                <Text style={{
                  color: c.textSecondary,
                  fontSize: 13,
                  textAlign: 'center',
                  lineHeight: 20,
                }}>
                  Buka shift untuk memulai transaksi hari ini. Catat uang di laci saat buka.
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setShowOpenModal(true)}
                style={{
                  backgroundColor: c.accent,
                  borderRadius: 12,
                  paddingVertical: 14,
                  paddingHorizontal: 24,
                  width: '100%',
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  color: c.textInverse,
                  fontWeight: '800',
                  fontSize: 15,
                }}>
                  Mulai Shift Sekarang
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Active Shift Display
          <>
            {/* Status Badge */}
            <View style={{
              alignSelf: 'center',
              backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.1)',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.2)',
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 6,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              marginBottom: 16,
            }}>
              <View style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: c.success,
              }} />
              <Text style={{
                color: c.success,
                fontWeight: '700',
                fontSize: 12,
              }}>
                Shift Aktif
              </Text>
            </View>

            {/* Shift Info Card */}
            <View style={{
              backgroundColor: c.bgCard,
              borderWidth: 1,
              borderColor: c.border,
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
            }}>
              <Text style={{
                color: c.textSecondary,
                fontSize: 12,
                fontWeight: '600',
                marginBottom: 4,
              }}>
                WAKTU BUKA
              </Text>
              <Text style={{
                color: c.text,
                fontSize: 14,
                fontWeight: '700',
                marginBottom: 12,
              }}>
                {new Intl.DateTimeFormat('id-ID', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(activeShift.opened_at))}
              </Text>

              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingBottom: 12,
                borderBottomWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              }}>
                <Text style={{ color: c.textSecondary, fontSize: 12 }}>
                  Durasi
                </Text>
                <Text style={{
                  color: c.text,
                  fontSize: 13,
                  fontWeight: '700',
                }}>
                  {duration}
                </Text>
              </View>

              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: 12,
              }}>
                <Text style={{ color: c.textSecondary, fontSize: 12 }}>
                  Modal Awal
                </Text>
                <Text style={{
                  color: c.text,
                  fontSize: 13,
                  fontWeight: '700',
                }}>
                  {formatRupiah(activeShift.opening_cash)}
                </Text>
              </View>
            </View>

            {/* Stats Grid */}
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 20,
            }}>
              {/* Transactions */}
              <View style={{
                flex: 1,
                minWidth: '45%',
                backgroundColor: c.bgCard,
                borderWidth: 1,
                borderColor: c.border,
                borderRadius: 12,
                padding: 12,
              }}>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}>
                  <View>
                    <Text style={{
                      color: c.textSecondary,
                      fontSize: 11,
                      fontWeight: '600',
                      marginBottom: 4,
                    }}>
                      Transaksi
                    </Text>
                    <Text style={{
                      color: c.text,
                      fontSize: 18,
                      fontWeight: '800',
                    }}>
                      {stats?.txCount ?? 0}
                    </Text>
                  </View>
                  <ShoppingBag size={18} color={c.accentLight} strokeWidth={1.5} />
                </View>
              </View>

              {/* Total Sales */}
              <View style={{
                flex: 1,
                minWidth: '45%',
                backgroundColor: c.bgCard,
                borderWidth: 1,
                borderColor: c.border,
                borderRadius: 12,
                padding: 12,
              }}>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}>
                  <View>
                    <Text style={{
                      color: c.textSecondary,
                      fontSize: 11,
                      fontWeight: '600',
                      marginBottom: 4,
                    }}>
                      Total Penjualan
                    </Text>
                    <Text style={{
                      color: c.success,
                      fontSize: 18,
                      fontWeight: '800',
                    }}>
                      {formatRupiahShort(stats?.totalSales ?? 0)}
                    </Text>
                  </View>
                  <DollarSign size={18} color={c.success} strokeWidth={1.5} />
                </View>
              </View>

              {/* Average Transaction */}
              <View style={{
                flex: 1,
                minWidth: '45%',
                backgroundColor: c.bgCard,
                borderWidth: 1,
                borderColor: c.border,
                borderRadius: 12,
                padding: 12,
              }}>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}>
                  <View>
                    <Text style={{
                      color: c.textSecondary,
                      fontSize: 11,
                      fontWeight: '600',
                      marginBottom: 4,
                    }}>
                      Rata-rata
                    </Text>
                    <Text style={{
                      color: c.accentLight,
                      fontSize: 18,
                      fontWeight: '800',
                    }}>
                      {formatRupiahShort(stats?.avg ?? 0)}
                    </Text>
                  </View>
                  <TrendingUp size={18} color={c.accentLight} strokeWidth={1.5} />
                </View>
              </View>

              {/* Expected Cash */}
              <View style={{
                flex: 1,
                minWidth: '45%',
                backgroundColor: c.bgCard,
                borderWidth: 1,
                borderColor: c.border,
                borderRadius: 12,
                padding: 12,
              }}>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}>
                  <View>
                    <Text style={{
                      color: c.textSecondary,
                      fontSize: 11,
                      fontWeight: '600',
                      marginBottom: 4,
                    }}>
                      Kas Seharus
                    </Text>
                    <Text style={{
                      color: c.accent,
                      fontSize: 18,
                      fontWeight: '800',
                    }}>
                      {formatRupiahShort(expectedCash)}
                    </Text>
                  </View>
                  <Clock size={18} color={c.accent} strokeWidth={1.5} />
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={{ gap: 12 }}>
              <TouchableOpacity
                onPress={() => router.push('/pos')}
                style={{
                  backgroundColor: c.accent,
                  borderRadius: 12,
                  paddingVertical: 14,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Text style={{
                  color: c.textInverse,
                  fontWeight: '800',
                  fontSize: 15,
                }}>
                  Ke POS
                </Text>
                <ArrowRight size={18} color={c.textInverse} strokeWidth={2} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowCloseModal(true)}
                style={{
                  backgroundColor: c.error,
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  color: '#fff',
                  fontWeight: '800',
                  fontSize: 15,
                }}>
                  Tutup Shift & Rekonsiliasi
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* Modals */}
      <ShiftOpenModal
        visible={showOpenModal}
        onClose={() => setShowOpenModal(false)}
        onSuccess={() => setShowOpenModal(false)}
      />
      <ShiftCloseModal
        visible={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onSuccess={() => setShowCloseModal(false)}
      />
    </SafeAreaView>
  );
}
