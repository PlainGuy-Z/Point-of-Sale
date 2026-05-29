import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ClipboardList,
  DollarSign,
  AlertCircle,
  ChevronRight,
  Clock,
  ShoppingBag,
} from 'lucide-react-native';
import { api } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { formatRupiah, formatRupiahShort } from '../../utils/currency';
import type { Shift } from '../../types';

export default function LaporanShift() {
  const router = useRouter();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscape = windowWidth > windowHeight;
  const isTablet = Math.min(windowWidth, windowHeight) > 600;
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const fetchShifts = useCallback(async (pageNum: number) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get<{
        data: Shift[];
        pagination: any;
      }>(`/shifts?page=${pageNum}&limit=${limit}`);
      setShifts(response.data || []);
      setPagination(response.pagination || {});
    } catch (err: any) {
      const msg = err?.message || 'Gagal memuat laporan shift';
      setError(msg);
      console.error('Failed to fetch shifts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void fetchShifts(1);
  }, [fetchShifts]);

  // Calculate stats
  const stats = useMemo(() => {
    if (shifts.length === 0) {
      return { totalCount: 0, avgSales: 0, totalDiff: 0 };
    }
    const totalCount = pagination.total || shifts.length;
    const sumSales = shifts.reduce((acc, s) => acc + (s.total_sales || 0), 0);
    const avgSales = shifts.length > 0 ? sumSales / shifts.length : 0;
    const sumDiff = shifts.reduce((acc, s) => acc + (s.cash_difference || 0), 0);
    return { totalCount, avgSales, totalDiff: sumDiff };
  }, [shifts, pagination.total]);

  const handlePrevPage = () => {
    if (pagination.hasPrevPage) {
      setPage(p => p - 1);
      void fetchShifts(page - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination.hasNextPage) {
      setPage(p => p + 1);
      void fetchShifts(page + 1);
    }
  };

  const renderShiftCard = ({ item: shift }: { item: Shift }) => {
    const openedAt = new Date(shift.opened_at);
    const closedAt = shift.closed_at ? new Date(shift.closed_at) : null;
    const isClosed = shift.status === 'closed';

    return (
      <TouchableOpacity
        onPress={() => router.push({ pathname: '/shifts/[id]', params: { id: shift.id } })}
        activeOpacity={0.7}
        style={{
          backgroundColor: c.bgCard,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: 12,
          padding: 14,
          marginBottom: 12,
        }}
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              color: c.text,
              fontSize: 13,
              fontWeight: '700',
            }}>
              {shift.cashier_name || 'Kasir Tidak Diketahui'}
            </Text>
            <Text style={{
              color: c.textSecondary,
              fontSize: 11,
              marginTop: 2,
            }}>
              {new Intl.DateTimeFormat('id-ID', {
                dateStyle: 'medium',
                timeStyle: 'short',
              }).format(openedAt)}
            </Text>
          </View>
          <View style={{
            backgroundColor: isClosed
              ? (isDark ? 'rgba(107,114,128,0.2)' : 'rgba(209,213,219,0.5)')
              : (isDark ? 'rgba(34,197,94,0.2)' : 'rgba(134,239,172,0.5)'),
            borderRadius: 6,
            paddingHorizontal: 8,
            paddingVertical: 4,
          }}>
            <Text style={{
              color: isClosed ? c.textSecondary : c.success,
              fontSize: 10,
              fontWeight: '700',
              textTransform: 'uppercase',
            }}>
              {isClosed ? 'Selesai' : 'Aktif'}
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: 12,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              color: c.textSecondary,
              fontSize: 10,
              fontWeight: '600',
            }}>
              Transaksi
            </Text>
            <Text style={{
              color: c.text,
              fontSize: 14,
              fontWeight: '700',
              marginTop: 2,
            }}>
              {shift.total_transactions || 0}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{
              color: c.textSecondary,
              fontSize: 10,
              fontWeight: '600',
            }}>
              Penjualan
            </Text>
            <Text style={{
              color: c.success,
              fontSize: 14,
              fontWeight: '700',
              marginTop: 2,
            }}>
              {formatRupiahShort(shift.total_sales || 0)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{
              color: c.textSecondary,
              fontSize: 10,
              fontWeight: '600',
            }}>
              Kas Aktual
            </Text>
            <Text style={{
              color: c.accent,
              fontSize: 14,
              fontWeight: '700',
              marginTop: 2,
            }}>
              {formatRupiahShort(shift.closing_cash || 0)}
            </Text>
          </View>
        </View>

        {/* Difference */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <View>
            <Text style={{
              color: c.textSecondary,
              fontSize: 10,
              fontWeight: '600',
            }}>
              Selisih Kas
            </Text>
            <Text style={{
              color:
                (shift.cash_difference ?? 0) === 0
                  ? c.accent
                  : (shift.cash_difference ?? 0) > 0
                    ? c.success
                    : c.error,
              fontSize: 14,
              fontWeight: '700',
              marginTop: 2,
            }}>
              {formatRupiah(shift.cash_difference || 0)}
            </Text>
          </View>
          <ChevronRight size={16} color={c.textSecondary} strokeWidth={2} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 32,
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
            Laporan Shift
          </Text>
          <Text style={{
            color: c.textSecondary,
            fontSize: 13,
          }}>
            Pantau aktivitas shift kasir dan rekonsiliasi kas
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

        {/* Stats Cards */}
        <View style={{
          flexDirection: 'row',
          gap: 12,
          marginBottom: 24,
          flexWrap: 'wrap',
        }}>
          {/* Total Shifts */}
          <View style={{
            flex: isTablet ? 1 : undefined,
            minWidth: isTablet ? '30%' : '47%',
            backgroundColor: c.bgCard,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 12,
            padding: 14,
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
                  marginBottom: 6,
                }}>
                  Total Shift
                </Text>
                <Text style={{
                  color: c.text,
                  fontSize: 20,
                  fontWeight: '800',
                }}>
                  {stats.totalCount}
                </Text>
              </View>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                backgroundColor: isDark ? 'rgba(217,119,6,0.1)' : 'rgba(217,119,6,0.1)',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <ClipboardList size={20} color={c.accent} strokeWidth={1.5} />
              </View>
            </View>
          </View>

          {/* Avg Sales */}
          <View style={{
            flex: isTablet ? 1 : undefined,
            minWidth: isTablet ? '30%' : '47%',
            backgroundColor: c.bgCard,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 12,
            padding: 14,
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
                  marginBottom: 6,
                }}>
                  Rata-rata Penjualan
                </Text>
                <Text style={{
                  color: c.success,
                  fontSize: 20,
                  fontWeight: '800',
                }}>
                  {formatRupiahShort(stats.avgSales)}
                </Text>
              </View>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                backgroundColor: isDark ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.1)',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <DollarSign size={20} color={c.success} strokeWidth={1.5} />
              </View>
            </View>
          </View>

          {/* Total Difference */}
          <View style={{
            flex: isTablet ? 1 : undefined,
            minWidth: isTablet ? '30%' : '100%',
            backgroundColor: c.bgCard,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 12,
            padding: 14,
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
                  marginBottom: 6,
                }}>
                  Total Selisih
                </Text>
                <Text style={{
                  color:
                    stats.totalDiff === 0 ? c.text : stats.totalDiff > 0 ? c.success : c.error,
                  fontSize: 20,
                  fontWeight: '800',
                }}>
                  {formatRupiah(stats.totalDiff)}
                </Text>
              </View>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                backgroundColor:
                  stats.totalDiff === 0
                    ? (isDark ? 'rgba(107,114,128,0.1)' : 'rgba(107,114,128,0.1)')
                    : stats.totalDiff > 0
                      ? (isDark ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.1)')
                      : (isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.1)'),
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <DollarSign
                  size={20}
                  color={
                    stats.totalDiff === 0 ? c.text : stats.totalDiff > 0 ? c.success : c.error
                  }
                  strokeWidth={1.5}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Title */}
        <Text style={{
          color: c.text,
          fontSize: 16,
          fontWeight: '800',
          marginBottom: 12,
        }}>
          Riwayat Shift
        </Text>

        {/* Loading */}
        {isLoading && shifts.length === 0 ? (
          <View style={{
            backgroundColor: c.bgCard,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 12,
            padding: 40,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <ActivityIndicator size="large" color={c.accent} />
            <Text style={{
              color: c.textSecondary,
              marginTop: 12,
              fontSize: 13,
            }}>
              Memuat laporan shift...
            </Text>
          </View>
        ) : shifts.length === 0 ? (
          <View style={{
            backgroundColor: c.bgCard,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 12,
            padding: 32,
            alignItems: 'center',
          }}>
            <Clock size={40} color={c.textSecondary} strokeWidth={1.5} />
            <Text style={{
              color: c.text,
              fontSize: 15,
              fontWeight: '700',
              marginTop: 12,
            }}>
              Tidak Ada Shift
            </Text>
            <Text style={{
              color: c.textSecondary,
              fontSize: 12,
              marginTop: 6,
              textAlign: 'center',
            }}>
              Belum ada data shift. Kasir dapat mulai membuka shift.
            </Text>
          </View>
        ) : (
          <FlatList
            data={shifts}
            renderItem={renderShiftCard}
            keyExtractor={s => s.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
          />
        )}

        {/* Pagination */}
        {shifts.length > 0 && (
          <View style={{
            flexDirection: 'row',
            gap: 12,
            marginTop: 20,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <TouchableOpacity
              onPress={handlePrevPage}
              disabled={!pagination.hasPrevPage || isLoading}
              style={{
                flex: 1,
                backgroundColor: pagination.hasPrevPage ? c.bgCard : c.bgInput,
                borderWidth: 1,
                borderColor: c.border,
                borderRadius: 8,
                paddingVertical: 10,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: pagination.hasPrevPage ? c.text : c.textMuted,
                  fontWeight: '600',
                  fontSize: 13,
                }}
              >
                Sebelumnya
              </Text>
            </TouchableOpacity>

            <View style={{
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}>
              <Text style={{
                color: c.textSecondary,
                fontWeight: '600',
                fontSize: 12,
              }}>
                {page} / {pagination.totalPages || 1}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleNextPage}
              disabled={!pagination.hasNextPage || isLoading}
              style={{
                flex: 1,
                backgroundColor: pagination.hasNextPage ? c.bgCard : c.bgInput,
                borderWidth: 1,
                borderColor: c.border,
                borderRadius: 8,
                paddingVertical: 10,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: pagination.hasNextPage ? c.text : c.textMuted,
                  fontWeight: '600',
                  fontSize: 13,
                }}
              >
                Berikutnya
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
