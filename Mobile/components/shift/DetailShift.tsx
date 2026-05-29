import React, { useState, useEffect, useMemo } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Clock,
  DollarSign,
  AlertCircle,
  AlertTriangle,
  User,
  ShoppingBag,
} from 'lucide-react-native';
import { api } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { formatRupiah, formatRupiahShort } from '../../utils/currency';
import type { Shift } from '../../types';

export default function DetailShift() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscape = windowWidth > windowHeight;
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  const [shift, setShift] = useState<Shift | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchShift = async () => {
      if (!id) {
        setError('ID shift tidak ditemukan');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');
      try {
        const response = await api.get<Shift>(`/shifts/${id}`);
        setShift(response);
      } catch (err: any) {
        const msg = err?.message || 'Gagal memuat detail shift';
        setError(msg);
        console.error('Failed to fetch shift detail:', err);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchShift();
  }, [id]);

  const isClosed = useMemo(() => shift?.status === 'closed', [shift]);
  const openedAt = useMemo(() => shift ? new Date(shift.opened_at) : null, [shift]);
  const closedAt = useMemo(() => shift?.closed_at ? new Date(shift.closed_at) : null, [shift]);
  const duration = useMemo(() => {
    if (!openedAt) return '';
    const end = closedAt || new Date();
    const diff = Math.floor((end.getTime() - openedAt.getTime()) / 60000);
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h} jam ${m} menit`;
  }, [openedAt, closedAt]);

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
            Memuat detail shift...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !shift) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <AlertTriangle size={48} color={c.error} strokeWidth={1.5} />
          <Text style={{
            color: c.text,
            fontSize: 18,
            fontWeight: '800',
            marginTop: 16,
            textAlign: 'center',
          }}>
            Gagal Memuat Data
          </Text>
          <Text style={{
            color: c.textSecondary,
            fontSize: 13,
            marginTop: 8,
            textAlign: 'center',
          }}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              marginTop: 20,
              backgroundColor: c.accent,
              borderRadius: 8,
              paddingVertical: 12,
              paddingHorizontal: 20,
            }}
          >
            <Text style={{
              color: c.textInverse,
              fontWeight: '700',
              fontSize: 14,
            }}>
              Kembali
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const expectedCash = shift.current_expected_cash ?? (shift.opening_cash + (shift.current_total_sales ?? shift.total_sales ?? 0));
  const difference = (shift.closing_cash ?? 0) - expectedCash;

  const getDifferenceColor = () => {
    if (difference === 0) return c.accent;
    if (difference > 0) return c.success;
    return c.error;
  };

  const getDifferenceLabel = () => {
    if (difference === 0) return 'Pas';
    if (difference > 0) return 'Lebih';
    return 'Kurang';
  };

  const transactions = shift.transactions || [];

  const renderTransactionItem = ({ item, index }: { item: any; index: number }) => {
    const createdAt = item.created_at ? new Date(item.created_at) : null;
    const createdAtLabel = createdAt && !isNaN(createdAt.getTime())
      ? new Intl.DateTimeFormat('id-ID', { timeStyle: 'short' }).format(createdAt)
      : '-';

    return (
      <View
        key={index}
        style={{
          backgroundColor: c.bgInput,
          borderRadius: 8,
          padding: 10,
          marginBottom: 8,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{
            color: c.text,
            fontSize: 12,
            fontWeight: '600',
            marginBottom: 2,
          }}>
            {item.customer_name || 'No Customer'}
          </Text>
          <Text style={{
            color: c.textSecondary,
            fontSize: 11,
          }}>
            {createdAtLabel}
          </Text>
        </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{
          color: c.success,
          fontSize: 12,
          fontWeight: '700',
        }}>
          {formatRupiah(item.total_amount || 0)}
        </Text>
        <Text style={{
          color: c.textSecondary,
          fontSize: 10,
          marginTop: 2,
        }}>
          {item.payment_method || 'Cash'}
        </Text>
      </View>
    </View>
  );
  };

  const gridColWidth = isLandscape && windowWidth > 800 ? '23%' : '48%';

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
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          marginBottom: 24,
        }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              backgroundColor: c.bgCard,
              borderWidth: 1,
              borderColor: c.border,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <ArrowLeft size={20} color={c.text} strokeWidth={2} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{
              color: c.text,
              fontSize: 20,
              fontWeight: '900',
              marginBottom: 2,
            }}>
              Detail Shift
            </Text>
            <Text style={{
              color: c.textSecondary,
              fontSize: 12,
            }}>
              {openedAt && new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(openedAt)}
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

        {/* Cashier Info */}
        <View style={{
          backgroundColor: c.bgCard,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: 12,
          padding: 14,
          marginBottom: 16,
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
          }}>
            <User size={16} color={c.accent} strokeWidth={2} />
            <Text style={{
              color: c.text,
              fontSize: 14,
              fontWeight: '700',
            }}>
              Informasi Kasir
            </Text>
          </View>

          <View style={{ gap: 10 }}>
            <View>
              <Text style={{
                color: c.textSecondary,
                fontSize: 11,
                fontWeight: '600',
                marginBottom: 2,
              }}>
                Nama Kasir
              </Text>
              <Text style={{
                color: c.text,
                fontSize: 14,
                fontWeight: '700',
              }}>
                {shift.cashier_name}
              </Text>
            </View>

            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              gap: 8,
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{
                  color: c.textSecondary,
                  fontSize: 11,
                  fontWeight: '600',
                  marginBottom: 2,
                }}>
                  Waktu Buka
                </Text>
                <Text style={{
                  color: c.text,
                  fontSize: 13,
                  fontWeight: '600',
                }}>
                  {openedAt && new Intl.DateTimeFormat('id-ID', {
                    timeStyle: 'short',
                  }).format(openedAt)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  color: c.textSecondary,
                  fontSize: 11,
                  fontWeight: '600',
                  marginBottom: 2,
                }}>
                  Waktu Tutup
                </Text>
                <Text style={{
                  color: c.text,
                  fontSize: 13,
                  fontWeight: '600',
                }}>
                  {closedAt
                    ? new Intl.DateTimeFormat('id-ID', { timeStyle: 'short' }).format(closedAt)
                    : '-'
                  }
                </Text>
              </View>
            </View>

            <View>
              <Text style={{
                color: c.textSecondary,
                fontSize: 11,
                fontWeight: '600',
                marginBottom: 2,
              }}>
                Durasi
              </Text>
              <Text style={{
                color: c.text,
                fontSize: 13,
                fontWeight: '600',
              }}>
                {duration}
              </Text>
            </View>
          </View>
        </View>

        {/* Reconciliation Section */}
        <View style={{
          backgroundColor: c.bgCard,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: 12,
          padding: 14,
          marginBottom: 16,
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
          }}>
            <DollarSign size={16} color={c.accent} strokeWidth={2} />
            <Text style={{
              color: c.text,
              fontSize: 14,
              fontWeight: '700',
            }}>
              Rekonsiliasi Kas
            </Text>
          </View>

          <View style={{ gap: 10 }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingBottom: 10,
              borderBottomWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            }}>
              <Text style={{ color: c.textSecondary, fontSize: 12 }}>Modal Awal</Text>
              <Text style={{ color: c.text, fontSize: 12, fontWeight: '700' }}>
                {formatRupiah(shift.opening_cash)}
              </Text>
            </View>

            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingBottom: 10,
              borderBottomWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            }}>
              <Text style={{ color: c.textSecondary, fontSize: 12 }}>Penjualan Cash</Text>
              <Text style={{ color: c.success, fontSize: 12, fontWeight: '700' }}>
                {formatRupiah(shift.total_sales || 0)}
              </Text>
            </View>

            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingBottom: 10,
              borderBottomWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            }}>
              <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600' }}>
                Kas Seharusnya
              </Text>
              <Text style={{ color: c.accent, fontSize: 12, fontWeight: '700' }}>
                {formatRupiah(expectedCash)}
              </Text>
            </View>

            {isClosed && (
              <>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingBottom: 10,
                  borderBottomWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                }}>
                  <Text style={{ color: c.textSecondary, fontSize: 12 }}>Kas Aktual</Text>
                  <Text style={{ color: c.text, fontSize: 12, fontWeight: '700' }}>
                    {formatRupiah(shift.closing_cash || 0)}
                  </Text>
                </View>

                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}>
                  <View>
                    <Text style={{ color: c.textSecondary, fontSize: 12 }}>Selisih</Text>
                    <Text style={{
                      color: getDifferenceColor(),
                      fontSize: 11,
                      fontWeight: '600',
                      marginTop: 2,
                    }}>
                      {getDifferenceLabel()}
                    </Text>
                  </View>
                  <Text style={{
                    color: getDifferenceColor(),
                    fontSize: 13,
                    fontWeight: '800',
                  }}>
                    {formatRupiah(difference)}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Notes */}
          {shift.notes && (
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
              <Text style={{
                color: c.textSecondary,
                fontSize: 11,
                fontWeight: '600',
                marginBottom: 4,
              }}>
                CATATAN
              </Text>
              <Text style={{
                color: c.text,
                fontSize: 12,
                lineHeight: 18,
              }}>
                {shift.notes}
              </Text>
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
        }}>
          <View style={{
            width: gridColWidth === '23%' ? '23%' : '48%',
            backgroundColor: c.bgCard,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 8,
            padding: 10,
          }}>
            <Text style={{
              color: c.textSecondary,
              fontSize: 10,
              fontWeight: '600',
              marginBottom: 4,
            }}>
              Transaksi
            </Text>
            <Text style={{
              color: c.text,
              fontSize: 16,
              fontWeight: '800',
            }}>
              {shift.total_transactions || 0}
            </Text>
          </View>

          <View style={{
            width: gridColWidth === '23%' ? '23%' : '48%',
            backgroundColor: c.bgCard,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 8,
            padding: 10,
          }}>
            <Text style={{
              color: c.textSecondary,
              fontSize: 10,
              fontWeight: '600',
              marginBottom: 4,
            }}>
              Total Penjualan
            </Text>
            <Text style={{
              color: c.success,
              fontSize: 16,
              fontWeight: '800',
            }}>
              {formatRupiahShort(shift.total_sales || 0)}
            </Text>
          </View>

          {gridColWidth === '23%' && (
            <>
              <View style={{
                width: '23%',
                backgroundColor: c.bgCard,
                borderWidth: 1,
                borderColor: c.border,
                borderRadius: 8,
                padding: 10,
              }}>
                <Text style={{
                  color: c.textSecondary,
                  fontSize: 10,
                  fontWeight: '600',
                  marginBottom: 4,
                }}>
                  Kas Seharusnya
                </Text>
                <Text style={{
                  color: c.accent,
                  fontSize: 16,
                  fontWeight: '800',
                }}>
                  {formatRupiahShort(expectedCash)}
                </Text>
              </View>

              {isClosed && (
                <View style={{
                  width: '23%',
                  backgroundColor: c.bgCard,
                  borderWidth: 1,
                  borderColor: c.border,
                  borderRadius: 8,
                  padding: 10,
                }}>
                  <Text style={{
                    color: c.textSecondary,
                    fontSize: 10,
                    fontWeight: '600',
                    marginBottom: 4,
                  }}>
                    Selisih
                  </Text>
                  <Text style={{
                    color: getDifferenceColor(),
                    fontSize: 16,
                    fontWeight: '800',
                  }}>
                    {formatRupiahShort(difference)}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Transactions Section */}
        {transactions && transactions.length > 0 && (
          <View>
            <Text style={{
              color: c.text,
              fontSize: 14,
              fontWeight: '800',
              marginBottom: 12,
            }}>
              Daftar Transaksi ({transactions.length})
            </Text>
            <FlatList
              data={transactions}
              renderItem={renderTransactionItem}
              keyExtractor={(_, idx) => idx.toString()}
              scrollEnabled={false}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
