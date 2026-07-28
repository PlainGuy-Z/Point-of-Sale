import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { getColors } from '../../../utils/theme';
import { usePrinter } from '../../../contexts/PrinterContext';
import LogoutModal from '../../../components/common/LogoutModal';

export default function CashierSettings() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { effectiveTheme, toggleTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);
  const { selectedDevice, config } = usePrinter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const initials = user?.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

  const handleConfirmLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <Text style={{ color: c.text, fontSize: 20, fontWeight: '900', paddingHorizontal: 16, paddingVertical: 12 }}>Pengaturan</Text>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 100 }}>
        {/* Profile */}
        <View style={{ backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border, borderRadius: 16, padding: 16 }}>
          <Text style={{ color: c.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 }}>PROFIL</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: c.textInverse, fontWeight: '800', fontSize: 16 }}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontWeight: '700', fontSize: 15 }}>{user?.name}</Text>
              <Text style={{ color: c.textSecondary, fontSize: 12 }}>{user?.email}</Text>
            </View>
            <View style={{ backgroundColor: c.accent, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ color: c.textInverse, fontSize: 10, fontWeight: '800' }}>KASIR</Text>
            </View>
          </View>
        </View>

        {/* Theme Toggle */}
        <View style={{ backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border, borderRadius: 16, padding: 16 }}>
          <Text style={{ color: c.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 }}>TAMPILAN</Text>
          <TouchableOpacity onPress={toggleTheme} style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            backgroundColor: c.bgInput, borderRadius: 12, padding: 12,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Feather name={isDark ? 'moon' : 'sun'} size={18} color={c.accent} />
              <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>
                {isDark ? 'Mode Gelap' : 'Mode Terang'}
              </Text>
            </View>
            <View style={{
              width: 44, height: 24, borderRadius: 12,
              backgroundColor: c.accent, justifyContent: 'center',
              paddingHorizontal: 2,
            }}>
              <View style={{
                width: 20, height: 20, borderRadius: 10,
                backgroundColor: '#fff',
                alignSelf: isDark ? 'flex-end' : 'flex-start',
              }} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Printer Settings */}
        <View style={{ backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border, borderRadius: 16, padding: 16 }}>
          <Text style={{ color: c.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 }}>PRINTER & STRUK</Text>
          <TouchableOpacity 
            onPress={() => router.push('/printer-settings' as any)}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: c.bgInput, borderRadius: 12, padding: 12,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <Feather name="printer" size={18} color={c.accent} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>
                  Pengaturan Printer
                </Text>
                <Text style={{ color: c.textSecondary, fontSize: 11, marginTop: 2 }}>
                  {config.method === 'bluetooth' && selectedDevice
                    ? `Bluetooth: ${selectedDevice.name}`
                    : config.method === 'network' && config.networkHost
                    ? `IP: ${config.networkHost}`
                    : config.method === 'rawbt'
                    ? 'Aplikasi RawBT'
                    : 'System Print (PDF)'}
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={c.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Other */}
        <View style={{ backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border, borderRadius: 16, padding: 16 }}>
          <Text style={{ color: c.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 }}>LAINNYA</Text>
          <Text style={{ color: c.textSecondary, fontSize: 12, marginBottom: 12 }}>SmartPOS v1.0.0</Text>
          <TouchableOpacity onPress={() => setShowLogoutModal(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}>
            <Feather name="log-out" size={16} color={c.error} />
            <Text style={{ color: c.error, fontSize: 14, fontWeight: '600' }}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <LogoutModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />
    </SafeAreaView>
  );
}
