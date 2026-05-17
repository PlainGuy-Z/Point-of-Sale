import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { getColors } from '../../../utils/theme';
import { useBluetooth } from '../../../hooks/useBluetooth';

export default function CashierSettings() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { effectiveTheme, toggleTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);
  const { selectedDevice, paperSize, isScanning, isPrinting, devices, scan, selectDevice, changePaperSize, testPrint } = useBluetooth();
  const [showDevices, setShowDevices] = useState(false);

  const initials = user?.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

  const handleLogout = () => {
    Alert.alert('Logout', 'Yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
    ]);
  };

  const handleScan = async () => {
    setShowDevices(true);
    await scan();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <Text style={{ color: c.text, fontSize: 20, fontWeight: '900', paddingHorizontal: 16, paddingVertical: 12 }}>Pengaturan</Text>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
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

        {/* Printer */}
        <View style={{ backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border, borderRadius: 16, padding: 16 }}>
          <Text style={{ color: c.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 }}>PRINTER BLUETOOTH</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: selectedDevice ? c.success : c.textMuted }} />
            <Text style={{ color: selectedDevice ? c.text : c.textSecondary, fontSize: 13 }}>
              {selectedDevice ? selectedDevice.name : 'Belum ada printer dipilih'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            <TouchableOpacity onPress={handleScan} disabled={isScanning} style={{
              flex: 1, backgroundColor: c.bgInput, borderRadius: 10, paddingVertical: 10,
              alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6,
            }}>
              {isScanning ? <ActivityIndicator size="small" color={c.accent} /> : <Feather name="bluetooth" size={14} color={c.accent} />}
              <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>Cari Printer</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={testPrint} disabled={!selectedDevice || isPrinting} style={{
              flex: 1, backgroundColor: selectedDevice ? c.bgInput : c.bgCard,
              borderRadius: 10, paddingVertical: 10, alignItems: 'center',
              flexDirection: 'row', justifyContent: 'center', gap: 6,
            }}>
              {isPrinting ? <ActivityIndicator size="small" color={c.text} /> : <Feather name="printer" size={14} color={selectedDevice ? c.text : c.textMuted} />}
              <Text style={{ color: selectedDevice ? c.text : c.textMuted, fontSize: 12, fontWeight: '600' }}>Test Print</Text>
            </TouchableOpacity>
          </View>

          {showDevices && devices.length > 0 && (
            <View style={{ gap: 6, marginBottom: 12 }}>
              {devices.map(d => (
                <TouchableOpacity key={d.address} onPress={() => { selectDevice(d); setShowDevices(false); }}
                  style={{
                    backgroundColor: c.bgInput, borderRadius: 10, padding: 10,
                    flexDirection: 'row', alignItems: 'center', gap: 8,
                  }}>
                  <Feather name="bluetooth" size={14} color={c.textSecondary} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontSize: 13 }}>{d.name}</Text>
                    <Text style={{ color: c.textMuted, fontSize: 10 }}>{d.address}</Text>
                  </View>
                  {selectedDevice?.address === d.address && <Feather name="check" size={14} color={c.success} />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={{ color: c.textSecondary, fontSize: 11, fontWeight: '600', marginBottom: 6 }}>Ukuran Kertas</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['58mm', '80mm'] as const).map(size => (
              <TouchableOpacity key={size} onPress={() => changePaperSize(size)} style={{
                flex: 1, backgroundColor: paperSize === size ? c.accent : c.bgInput,
                borderRadius: 10, paddingVertical: 10, alignItems: 'center',
              }}>
                <Text style={{
                  color: paperSize === size ? c.textInverse : c.textSecondary,
                  fontWeight: '700', fontSize: 13,
                }}>{size}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Other */}
        <View style={{ backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border, borderRadius: 16, padding: 16 }}>
          <Text style={{ color: c.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 }}>LAINNYA</Text>
          <Text style={{ color: c.textSecondary, fontSize: 12, marginBottom: 12 }}>SmartPOS v1.0.0</Text>
          <TouchableOpacity onPress={handleLogout} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}>
            <Feather name="log-out" size={16} color={c.error} />
            <Text style={{ color: c.error, fontSize: 14, fontWeight: '600' }}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
