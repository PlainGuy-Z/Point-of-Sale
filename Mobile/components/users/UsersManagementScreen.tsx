import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserCheck, Shield } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';

export default function UsersManagementScreen() {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  // Note: Full user management (add/edit/delete cashiers) requires API calls
  // that are only available via the web dashboard. This screen shows info.

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <Text style={{ color: c.text, fontSize: 22, fontWeight: '900' }}>
          Manajemen <Text style={{ color: c.accent }}>Kasir</Text>
        </Text>
        <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 4 }}>
          Kelola akun kasir dan hak akses
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}>
        {/* Info Card */}
        <View style={{
          backgroundColor: c.accentBg, borderWidth: 1,
          borderColor: isDark ? 'rgba(245,158,11,0.2)' : 'rgba(13,148,136,0.2)',
          borderRadius: 16, padding: 16,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Shield size={18} color={c.accent} strokeWidth={2} />
            <Text style={{ color: c.text, fontWeight: '700', fontSize: 14 }}>
              Manajemen Kasir
            </Text>
          </View>
          <Text style={{ color: c.textSecondary, fontSize: 13, lineHeight: 20 }}>
            Untuk menambah, mengedit, atau menghapus akun kasir, gunakan dashboard web SmartPOS.
            Fitur ini tersedia di web untuk keamanan yang lebih baik.
          </Text>
        </View>

        {/* Features list */}
        <Text style={{ color: c.text, fontSize: 16, fontWeight: '700', marginTop: 4 }}>
          Fitur Tersedia di Web
        </Text>
        {[
          { label: 'Tambah Kasir Baru', desc: 'Buat akun kasir dengan email dan password' },
          { label: 'Reset Password', desc: 'Reset password kasir yang lupa' },
          { label: 'Nonaktifkan Akun', desc: 'Nonaktifkan akun kasir tanpa menghapus data' },
          { label: 'Riwayat Aktivitas', desc: 'Lihat log aktivitas setiap kasir' },
          { label: 'Hak Akses', desc: 'Atur fitur yang bisa diakses kasir' },
        ].map((item, i) => (
          <View key={i} style={{
            backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
            borderRadius: 14, padding: 14,
            flexDirection: 'row', alignItems: 'center', gap: 12,
          }}>
            <View style={{
              width: 36, height: 36, borderRadius: 10,
              backgroundColor: c.accentBg,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <UserCheck size={16} color={c.accent} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: 13, fontWeight: '700' }}>{item.label}</Text>
              <Text style={{ color: c.textSecondary, fontSize: 11, marginTop: 2 }}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
