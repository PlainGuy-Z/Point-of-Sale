import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { SidebarContext } from '../../contexts/SidebarContext';
import {
  Settings, Home, Percent, Printer, Clipboard, CreditCard, Box,
  ChevronRight, LogOut, Menu, UserCheck, Building2
} from 'lucide-react-native';

const settingsItems = [
  { label: 'Toko & Bisnis', Icon: Home, desc: 'Nama toko, alamat, jam operasional' },
  { label: 'Kelola Cabang', Icon: Building2, desc: 'Tambah/edit cabang & lokasi toko' },
  { label: 'Manajemen Kasir', Icon: UserCheck, desc: 'Kelola kasir, hak akses, & pin' },
  { label: 'Pajak & Biaya', Icon: Percent, desc: 'PPN, service charge' },
  { label: 'Struk & Printer', Icon: Printer, desc: 'Format struk, printer bluetooth' },
  { label: 'Pesanan', Icon: Clipboard, desc: 'Tipe pesanan default, validasi' },
  { label: 'Pembayaran', Icon: CreditCard, desc: 'Metode pembayaran aktif' },
  { label: 'Stok & Inventory', Icon: Box, desc: 'Threshold, auto-disable' },
];

export default function OwnerSettings() {
  const router = useRouter();
  const { logout } = useAuth();
  const { openSidebar, toggleSidebar, isLandscape, isSidebarOpen } = useContext(SidebarContext);
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  const handleLogout = () => {
    Alert.alert('Logout', 'Yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
    ]);
  };

  const handlePress = (label: string) => {
    if (label === 'Toko & Bisnis') {
      router.push('/(owner)/shop-settings' as any);
    } else if (label === 'Kelola Cabang') {
      router.push('/(owner)/branches' as any);
    } else if (label === 'Struk & Printer') {
      router.push('/printer-settings' as any);
    } else if (label === 'Manajemen Kasir') {
      router.push('/(owner)/users' as any);
    } else {
      Alert.alert(label, 'Fitur ini belum dikonfigurasi di mobile.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Settings size={22} color={c.accent} strokeWidth={2} />
          <Text style={{ color: c.text, fontSize: 20, fontWeight: '900' }}>Settings</Text>
        </View>
        {isLandscape && !isSidebarOpen && (
          <TouchableOpacity onPress={toggleSidebar} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Menu size={24} color={c.accent} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>
 
      <ScrollView contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 40 }}>
        {settingsItems.map((item) => (
          <TouchableOpacity 
            key={item.label} 
            onPress={() => handlePress(item.label)}
            style={{
              backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border,
              borderRadius: 14, padding: 16,
              flexDirection: 'row', alignItems: 'center', gap: 12,
            }}
          >
            <View style={{
              width: 36, height: 36, borderRadius: 10,
              backgroundColor: c.accentBg,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <item.Icon size={16} color={c.accent} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontWeight: '600', fontSize: 14 }}>{item.label}</Text>
              <Text style={{ color: c.textSecondary, fontSize: 11 }}>{item.desc}</Text>
            </View>
            <ChevronRight size={16} color={c.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
        ))}

        <View style={{ height: 16 }} />
        <TouchableOpacity onPress={handleLogout} style={{
          backgroundColor: c.errorBg, borderWidth: 1,
          borderColor: isDark ? 'rgba(239,68,68,0.3)' : 'rgba(220,38,38,0.2)',
          borderRadius: 14, padding: 16,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <LogOut size={16} color={c.error} strokeWidth={2} />
          <Text style={{ color: c.error, fontWeight: '700', fontSize: 14 }}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
