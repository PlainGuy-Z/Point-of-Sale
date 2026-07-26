import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  UserPlus,
  Shield,
  Users,
  UserCheck,
  UserX,
  Lock,
  Pencil,
  KeyRound,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { appApi } from '../../services/appApi';
import AddCashierModal from './AddCashierModal';
import EditCashierModal from './EditCashierModal';
import ResetPasswordModal from './ResetPasswordModal';

export interface CashierUserRow {
  id: string;
  name: string;
  email: string;
  role: 'cashier';
  pin: boolean;
  is_active: boolean;
  created_at: string;
}

type StatusFilter = 'all' | 'active' | 'inactive';

function formatCreatedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export default function UsersManagementScreen() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscape = windowWidth > windowHeight;
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  const [users, setUsers] = useState<CashierUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [toggleLoadingId, setToggleLoadingId] = useState<string | null>(null);

  // Modal states
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CashierUserRow | null>(null);
  const [resetTarget, setResetTarget] = useState<CashierUserRow | null>(null);

  const loadUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const rows = await appApi.get<CashierUserRow[]>('/users');
      setUsers(rows);
    } catch (err: any) {
      const msg = err?.message || 'Gagal memuat daftar kasir.';
      setError(msg);
      setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (statusFilter === 'active' && !u.is_active) return false;
      if (statusFilter === 'inactive' && u.is_active) return false;
      if (!q) return true;
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });
  }, [users, search, statusFilter]);

  const totals = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.is_active).length;
    return { total, active, inactive: total - active };
  }, [users]);

  const toggleActive = async (row: CashierUserRow) => {
    const action = row.is_active ? 'Nonaktifkan' : 'Aktifkan';
    Alert.alert(
      `${action} Kasir`,
      `Apakah Anda yakin ingin ${action.toLowerCase()} kasir "${row.name}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: action,
          style: row.is_active ? 'destructive' : 'default',
          onPress: async () => {
            setToggleLoadingId(row.id);
            try {
              const updated = await appApi.put<CashierUserRow>(
                `/users/${encodeURIComponent(row.id)}`,
                { is_active: !row.is_active }
              );
              setUsers((prev) => prev.map((u) => (u.id === row.id ? updated : u)));
              Alert.alert('Berhasil', row.is_active ? 'Kasir telah dinonaktifkan.' : 'Kasir telah diaktifkan kembali.');
            } catch (err: any) {
              Alert.alert('Gagal', err?.message || 'Gagal mengubah status kasir.');
            } finally {
              setToggleLoadingId(null);
            }
          },
        },
      ]
    );
  };

  const avatarColors = ['#f59e0b', '#0d9488', '#6366f1', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#3b82f6'];
  const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return avatarColors[Math.abs(hash) % avatarColors.length];
  };

  const FILTERS: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'Semua' },
    { key: 'active', label: 'Aktif' },
    { key: 'inactive', label: 'Nonaktif' },
  ];

  const statCards = [
    { label: 'Total Kasir', value: totals.total, icon: Users, accent: c.accent },
    { label: 'Aktif', value: totals.active, accent: '#10b981', icon: UserCheck },
    { label: 'Nonaktif', value: totals.inactive, accent: '#ef4444', icon: UserX },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      {/* HEADER */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingLeft: 16,
        paddingRight: 16,
        paddingVertical: 12,
      }}>
        <View>
          <Text style={{ color: c.text, fontSize: 22, fontWeight: '900' }}>
            Manajemen <Text style={{ color: c.accent }}>Kasir</Text>
          </Text>
          <Text style={{ color: c.textSecondary, fontSize: 11, marginTop: 3 }}>
            Kelola akun kasir toko Anda
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setAddOpen(true)}
          activeOpacity={0.7}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: c.accent,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 12,
            shadowColor: c.accent,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <UserPlus size={15} color="#fff" strokeWidth={2.5} />
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>Tambah</Text>
        </TouchableOpacity>
      </View>

      {/* BODY */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={c.accent} />
          <Text style={{ color: c.textSecondary, fontSize: 13, marginTop: 12 }}>Memuat daftar kasir...</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Shield size={40} color={c.textMuted} strokeWidth={1.5} />
          <Text style={{ color: c.error, fontSize: 14, textAlign: 'center', marginTop: 12, fontWeight: '600' }}>{error}</Text>
          <TouchableOpacity
            onPress={() => loadUsers()}
            style={{ marginTop: 16, backgroundColor: c.accent, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadUsers(true)} tintColor={c.accent} />
          }
        >
          {/* STAT CARDS */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 10, marginBottom: 16 }}
          >
            {statCards.map((card) => {
              const IconComp = card.icon;
              return (
                <View key={card.label} style={{
                  backgroundColor: c.bgCard,
                  borderWidth: 1,
                  borderColor: c.border,
                  borderRadius: 16,
                  padding: 14,
                  minWidth: 120,
                  gap: 8,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{
                      width: 28, height: 28, borderRadius: 8,
                      backgroundColor: card.accent + '18',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <IconComp size={14} color={card.accent} strokeWidth={2.5} />
                    </View>
                    <Text style={{ color: c.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 }}>
                      {card.label}
                    </Text>
                  </View>
                  <Text style={{ color: card.accent, fontSize: 22, fontWeight: '900' }}>{card.value}</Text>
                </View>
              );
            })}
          </ScrollView>

          {/* SEARCH + FILTER */}
          <View style={{
            marginHorizontal: 16,
            backgroundColor: c.bgCard,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 16,
            padding: 12,
            marginBottom: 16,
            gap: 10,
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: c.bgInput,
              borderWidth: 1,
              borderColor: c.borderLight,
              borderRadius: 12,
              paddingHorizontal: 12,
              gap: 8,
            }}>
              <Search size={16} color={c.textMuted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Cari nama atau email..."
                placeholderTextColor={c.textMuted}
                style={{
                  flex: 1,
                  color: c.text,
                  fontSize: 13,
                  paddingVertical: 10,
                }}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {FILTERS.map((f) => (
                <TouchableOpacity
                  key={f.key}
                  onPress={() => setStatusFilter(f.key)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 20,
                    backgroundColor: statusFilter === f.key ? c.accent : 'transparent',
                    borderWidth: statusFilter === f.key ? 0 : 1,
                    borderColor: c.borderLight,
                  }}
                >
                  <Text style={{
                    color: statusFilter === f.key ? '#fff' : c.textSecondary,
                    fontSize: 12,
                    fontWeight: '700',
                  }}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* CASHIER LIST */}
          {users.length === 0 ? (
            <View style={{
              marginHorizontal: 16,
              backgroundColor: c.bgCard,
              borderWidth: 1,
              borderColor: c.border,
              borderRadius: 16,
              paddingVertical: 40,
              alignItems: 'center',
            }}>
              <Users size={40} color={c.textMuted} strokeWidth={1.5} />
              <Text style={{ color: c.textSecondary, fontSize: 14, fontWeight: '600', marginTop: 12, textAlign: 'center' }}>
                Belum ada kasir.{'\n'}Klik "+ Tambah" untuk memulai.
              </Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={{
              marginHorizontal: 16,
              backgroundColor: c.bgCard,
              borderWidth: 1,
              borderColor: c.border,
              borderRadius: 16,
              paddingVertical: 30,
              alignItems: 'center',
            }}>
              <Search size={32} color={c.textMuted} strokeWidth={1.5} />
              <Text style={{ color: c.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 10, textAlign: 'center' }}>
                Tidak ada kasir yang cocok{'\n'}dengan pencarian atau filter Anda.
              </Text>
            </View>
          ) : (
            <View style={{ paddingHorizontal: 16, gap: 10 }}>
              {filtered.map((row) => {
                const avatarBg = getAvatarColor(row.name);
                const isToggling = toggleLoadingId === row.id;

                return (
                  <View key={row.id} style={{
                    backgroundColor: c.bgCard,
                    borderWidth: 1,
                    borderColor: c.border,
                    borderRadius: 16,
                    padding: 14,
                    overflow: 'hidden',
                  }}>
                    {/* Top accent line */}
                    <View style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                      backgroundColor: row.is_active ? '#10b981' : '#ef4444',
                      opacity: 0.6,
                    }} />

                    {/* User Info Row */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      <View style={{
                        width: 42, height: 42, borderRadius: 14,
                        backgroundColor: avatarBg,
                        alignItems: 'center', justifyContent: 'center',
                        shadowColor: avatarBg,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4,
                        elevation: 3,
                      }}>
                        <Text style={{ color: '#fff', fontSize: 17, fontWeight: '900', textTransform: 'uppercase' }}>
                          {row.name.charAt(0)}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }} numberOfLines={1}>{row.name}</Text>
                        <Text style={{ color: c.textSecondary, fontSize: 11, marginTop: 2 }} numberOfLines={1}>{row.email}</Text>
                      </View>
                    </View>

                    {/* Badges Row */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                      <View style={{
                        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
                        backgroundColor: row.is_active ? (isDark ? 'rgba(16,185,129,0.12)' : '#d1fae5') : (isDark ? 'rgba(239,68,68,0.12)' : '#fee2e2'),
                        borderWidth: 1,
                        borderColor: row.is_active ? (isDark ? 'rgba(16,185,129,0.3)' : '#a7f3d0') : (isDark ? 'rgba(239,68,68,0.3)' : '#fecaca'),
                      }}>
                        <Text style={{
                          color: row.is_active ? (isDark ? '#34d399' : '#065f46') : (isDark ? '#f87171' : '#b91c1c'),
                          fontSize: 10, fontWeight: '800',
                        }}>
                          {row.is_active ? 'Aktif' : 'Nonaktif'}
                        </Text>
                      </View>

                      <View style={{
                        flexDirection: 'row', alignItems: 'center', gap: 4,
                        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
                        backgroundColor: row.pin ? (isDark ? 'rgba(245,158,11,0.1)' : '#fef3c7') : (isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'),
                        borderWidth: 1,
                        borderColor: row.pin ? (isDark ? 'rgba(245,158,11,0.2)' : '#fde68a') : 'transparent',
                      }}>
                        <Lock size={10} color={row.pin ? c.accent : c.textMuted} strokeWidth={2.5} />
                        <Text style={{
                          color: row.pin ? c.accent : c.textMuted,
                          fontSize: 10, fontWeight: '700',
                        }}>
                          {row.pin ? 'PIN Aktif' : 'Belum ada PIN'}
                        </Text>
                      </View>

                      <Text style={{ color: c.textMuted, fontSize: 10, alignSelf: 'center', marginLeft: 'auto' }}>
                        {formatCreatedAt(row.created_at)}
                      </Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={{
                      flexDirection: 'row',
                      gap: 8,
                      borderTopWidth: 1,
                      borderTopColor: c.borderLight,
                      paddingTop: 10,
                    }}>
                      <TouchableOpacity
                        onPress={() => setEditTarget(row)}
                        activeOpacity={0.7}
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          paddingVertical: 9,
                          borderRadius: 10,
                          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                          borderWidth: 1,
                          borderColor: c.borderLight,
                        }}
                      >
                        <Pencil size={13} color={c.accent} strokeWidth={2.5} />
                        <Text style={{ color: c.text, fontSize: 11, fontWeight: '700' }}>Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setResetTarget(row)}
                        activeOpacity={0.7}
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          paddingVertical: 9,
                          borderRadius: 10,
                          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                          borderWidth: 1,
                          borderColor: c.borderLight,
                        }}
                      >
                        <KeyRound size={13} color="#f59e0b" strokeWidth={2.5} />
                        <Text style={{ color: c.text, fontSize: 11, fontWeight: '700' }}>Reset</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => toggleActive(row)}
                        activeOpacity={0.7}
                        disabled={isToggling}
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          paddingVertical: 9,
                          borderRadius: 10,
                          backgroundColor: row.is_active
                            ? (isDark ? 'rgba(239,68,68,0.08)' : '#fef2f2')
                            : (isDark ? 'rgba(16,185,129,0.08)' : '#ecfdf5'),
                          borderWidth: 1,
                          borderColor: row.is_active
                            ? (isDark ? 'rgba(239,68,68,0.2)' : '#fecaca')
                            : (isDark ? 'rgba(16,185,129,0.2)' : '#a7f3d0'),
                          opacity: isToggling ? 0.5 : 1,
                        }}
                      >
                        {isToggling ? (
                          <ActivityIndicator size="small" color={c.accent} />
                        ) : row.is_active ? (
                          <ToggleRight size={13} color="#ef4444" strokeWidth={2.5} />
                        ) : (
                          <ToggleLeft size={13} color="#10b981" strokeWidth={2.5} />
                        )}
                        <Text style={{
                          color: row.is_active ? '#ef4444' : '#10b981',
                          fontSize: 11, fontWeight: '700',
                        }}>
                          {isToggling ? '...' : row.is_active ? 'Nonaktif' : 'Aktifkan'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* MODALS */}
      {addOpen && (
        <AddCashierModal
          onClose={() => setAddOpen(false)}
          onCreated={(u) => {
            setUsers((prev) => [u, ...prev]);
            Alert.alert('Berhasil', `Akun kasir "${u.name}" berhasil dibuat.`);
          }}
        />
      )}

      {editTarget && (
        <EditCashierModal
          cashier={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={(u) => {
            setUsers((prev) => prev.map((x) => (x.id === u.id ? u : x)));
            Alert.alert('Berhasil', 'Perubahan berhasil disimpan.');
          }}
        />
      )}

      {resetTarget && (
        <ResetPasswordModal
          cashier={resetTarget}
          onClose={() => setResetTarget(null)}
        />
      )}
    </SafeAreaView>
  );
}
