/**
 * Printer Settings Screen
 * Full-featured screen for cashier and owner to scan, configure, test, and save receipt printer settings.
 */
import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useTheme } from '../contexts/ThemeContext'
import { usePrinter } from '../contexts/PrinterContext'
import { getColors } from '../utils/theme'
import type { PrinterMethod, PrinterDevice } from '../services/printer/types'

export default function PrinterSettingsScreen() {
  const router = useRouter()
  const { effectiveTheme } = useTheme()
  const isDark = effectiveTheme === 'dark'
  const c = getColors(isDark)

  const {
    config,
    selectedDevice,
    devices,
    isScanning,
    isPrinting,
    connectionStatus,
    scan,
    selectDevice,
    forgetPrinter,
    updateConfig,
    testPrint,
  } = usePrinter()

  // State for network IP and Port editing
  const [networkHost, setNetworkHost] = useState(config.networkHost)
  const [networkPort, setNetworkPort] = useState(String(config.networkPort))
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [showDevices, setShowDevices] = useState(false)

  // Sync local inputs when global config finishes loading or changes
  useEffect(() => {
    setNetworkHost(config.networkHost)
    setNetworkPort(String(config.networkPort))
  }, [config.networkHost, config.networkPort])

  // Methods select handler
  const handleMethodChange = async (method: PrinterMethod) => {
    const ok = await updateConfig({ method })
    if (!ok) {
      Alert.alert('Gagal', 'Gagal memperbarui metode printer.')
    }
  }

  // Scan bluetooth printers
  const handleScan = async () => {
    setShowDevices(true)
    try {
      await scan()
    } catch (err) {
      Alert.alert('Scan Gagal', 'Terjadi kesalahan saat memindai printer.')
    }
  }

  // Save network printer configurations
  const handleSaveNetworkSettings = async () => {
    const portNum = parseInt(networkPort, 10)
    if (!networkHost.trim()) {
      Alert.alert('Validasi', 'IP Address printer tidak boleh kosong.')
      return
    }
    if (isNaN(portNum) || portNum <= 0 || portNum > 65535) {
      Alert.alert('Validasi', 'Port tidak valid. Masukkan angka antara 1 - 65535.')
      return
    }

    const ok = await updateConfig({
      networkHost: networkHost.trim(),
      networkPort: portNum,
    })

    if (ok) {
      Alert.alert('Berhasil', 'Pengaturan printer network berhasil disimpan.')
    } else {
      Alert.alert('Gagal', 'Gagal menyimpan pengaturan network.')
    }
  }

  // Test network printer connection
  const handleTestNetworkConnection = async () => {
    const portNum = parseInt(networkPort, 10)
    if (!networkHost.trim() || isNaN(portNum)) {
      Alert.alert('Validasi', 'Mohon isi IP Address dan Port terlebih dahulu.')
      return
    }

    setIsTestingConnection(true)
    try {
      const { networkPrinterBackend } = await import('../services/printer/networkPrinter')
      const connected = await networkPrinterBackend.testConnection(networkHost.trim(), portNum)
      if (connected) {
        Alert.alert('Sukses Koneksi', 'Berhasil terhubung ke printer network!')
      } else {
        Alert.alert('Gagal Koneksi', 'Tidak dapat terhubung ke printer network. Cek kabel, IP, atau jaringan Wi-Fi Anda.')
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Koneksi gagal.')
    } finally {
      setIsTestingConnection(false)
    }
  }

  // Run test print on currently selected printer settings
  const handleTestPrint = async () => {
    try {
      const res = await testPrint()
      if (res.success) {
        Alert.alert('Test Print Berhasil', 'Perintah test print telah dikirim ke printer.')
      } else {
        Alert.alert('Test Print Gagal', res.error || 'Terjadi kesalahan saat mencetak.')
      }
    } catch (err) {
      Alert.alert('Error', 'Kesalahan internal saat memicu test print.')
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: c.bgInput }]}
        >
          <Feather name="arrow-left" size={20} color={c.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.text }]}>Struk & Printer</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* SECTION 1: METODE PRINTER */}
        <View style={[styles.card, { backgroundColor: c.bgCard, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.textMuted }]}>METODE KONEKSI PRINTER</Text>
          <View style={styles.methodGrid}>
            {(['bluetooth', 'network', 'rawbt', 'system'] as const).map((method) => {
              const isActive = config.method === method
              const icons: Record<PrinterMethod, keyof typeof Feather.glyphMap> = {
                bluetooth: 'bluetooth',
                network: 'wifi',
                rawbt: 'external-link',
                system: 'cpu',
              }
              const labels: Record<PrinterMethod, string> = {
                bluetooth: 'Bluetooth',
                network: 'Network/IP',
                rawbt: 'RawBT App',
                system: 'System PDF',
              }

              return (
                <TouchableOpacity
                  key={method}
                  onPress={() => handleMethodChange(method)}
                  style={[
                    styles.methodButton,
                    {
                      backgroundColor: isActive ? c.accent : c.bgInput,
                      borderColor: isActive ? c.accent : 'transparent',
                    },
                  ]}
                >
                  <Feather
                    name={icons[method]}
                    size={20}
                    color={isActive ? c.textInverse : c.textSecondary}
                  />
                  <Text
                    style={[
                      styles.methodLabel,
                      { color: isActive ? c.textInverse : c.text, fontWeight: isActive ? '700' : '500' },
                    ]}
                  >
                    {labels[method]}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* SECTION 2: BLUETOOTH CONFIGURATION */}
        {config.method === 'bluetooth' && (
          <View style={[styles.card, { backgroundColor: c.bgCard, borderColor: c.border }]}>
            <Text style={[styles.sectionTitle, { color: c.textMuted }]}>PRINTER BLUETOOTH</Text>
            
            {/* Connection Status indicator */}
            <View style={[styles.statusRow, { backgroundColor: c.bgInput }]}>
              <View
                style={[
                  styles.statusIndicator,
                  { backgroundColor: connectionStatus.connected ? c.success : c.textMuted },
                ]}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.statusLabel, { color: c.text }]}>
                  {selectedDevice ? selectedDevice.name : 'Belum ada printer dipilih'}
                </Text>
                <Text style={[styles.statusSub, { color: c.textSecondary }]}>
                  {selectedDevice
                    ? `${selectedDevice.address} • ${connectionStatus.connected ? 'Terhubung' : 'Terputus'}`
                    : 'Pilih printer dari daftar di bawah'}
                </Text>
              </View>
              {selectedDevice && (
                <TouchableOpacity
                  onPress={forgetPrinter}
                  style={[styles.forgetButton, { borderColor: c.border }]}
                >
                  <Text style={{ color: c.error, fontSize: 11, fontWeight: '700' }}>Putuskan</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Scan and Test buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={handleScan}
                disabled={isScanning}
                style={[styles.actionBtn, { backgroundColor: c.bgInput }]}
              >
                {isScanning ? (
                  <ActivityIndicator size="small" color={c.accent} />
                ) : (
                  <Feather name="search" size={14} color={c.accent} />
                )}
                <Text style={[styles.actionBtnText, { color: c.text }]}>Cari Printer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleTestPrint}
                disabled={!selectedDevice || isPrinting}
                style={[
                  styles.actionBtn,
                  { backgroundColor: selectedDevice ? c.bgInput : c.bgCard, opacity: selectedDevice ? 1 : 0.5 },
                ]}
              >
                {isPrinting ? (
                  <ActivityIndicator size="small" color={c.text} />
                ) : (
                  <Feather name="printer" size={14} color={c.text} />
                )}
                <Text style={[styles.actionBtnText, { color: c.text }]}>Test Print</Text>
              </TouchableOpacity>
            </View>

            {/* List of found devices */}
            {showDevices && (
              <View style={[styles.devicesSection, { borderTopColor: c.border }]}>
                <Text style={[styles.devicesTitle, { color: c.textMuted }]}>PRINTER DITEMUKAN ({devices.length})</Text>
                {isScanning && devices.length === 0 ? (
                  <ActivityIndicator style={{ marginVertical: 16 }} size="small" color={c.accent} />
                ) : devices.length === 0 ? (
                  <Text style={[styles.emptyText, { color: c.textSecondary }]}>Tidak ada printer bluetooth terdeteksi.</Text>
                ) : (
                  <View style={{ gap: 8 }}>
                    {devices.map((device) => {
                      const isSelected = selectedDevice?.address === device.address
                      return (
                        <TouchableOpacity
                          key={device.address}
                          onPress={() => selectDevice(device)}
                          style={[styles.deviceItem, { backgroundColor: c.bgInput }]}
                        >
                          <Feather name="printer" size={16} color={c.textSecondary} />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.deviceName, { color: c.text }]}>{device.name}</Text>
                            <Text style={[styles.deviceMac, { color: c.textMuted }]}>{device.address}</Text>
                          </View>
                          {isSelected && <Feather name="check" size={18} color={c.success} />}
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* SECTION 3: NETWORK / IP CONFIGURATION */}
        {config.method === 'network' && (
          <View style={[styles.card, { backgroundColor: c.bgCard, borderColor: c.border }]}>
            <Text style={[styles.sectionTitle, { color: c.textMuted }]}>PRINTER NETWORK / IP ADDRESS</Text>
            <View style={{ gap: 12 }}>
              <View>
                <Text style={[styles.inputLabel, { color: c.textSecondary }]}>IP Address Printer</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: c.bgInput, color: c.text, borderColor: c.border }]}
                  value={networkHost}
                  onChangeText={setNetworkHost}
                  placeholder="Contoh: 192.168.1.100"
                  placeholderTextColor={c.textMuted}
                  keyboardType="numeric"
                />
              </View>

              <View>
                <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Port (Default: 9100)</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: c.bgInput, color: c.text, borderColor: c.border }]}
                  value={networkPort}
                  onChangeText={setNetworkPort}
                  placeholder="9100"
                  placeholderTextColor={c.textMuted}
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  onPress={handleTestNetworkConnection}
                  disabled={isTestingConnection}
                  style={[styles.actionBtn, { backgroundColor: c.bgInput }]}
                >
                  {isTestingConnection ? (
                    <ActivityIndicator size="small" color={c.accent} />
                  ) : (
                    <Feather name="activity" size={14} color={c.accent} />
                  )}
                  <Text style={[styles.actionBtnText, { color: c.text }]}>Tes Koneksi</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleTestPrint}
                  disabled={isPrinting}
                  style={[styles.actionBtn, { backgroundColor: c.bgInput }]}
                >
                  {isPrinting ? (
                    <ActivityIndicator size="small" color={c.text} />
                  ) : (
                    <Feather name="printer" size={14} color={c.text} />
                  )}
                  <Text style={[styles.actionBtnText, { color: c.text }]}>Test Print</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleSaveNetworkSettings}
                style={[styles.saveBtn, { backgroundColor: c.accent }]}
              >
                <Text style={[styles.saveBtnText, { color: c.textInverse }]}>Simpan Pengaturan IP</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* SECTION 4: RAWBT CONFIGURATION */}
        {config.method === 'rawbt' && (
          <View style={[styles.card, { backgroundColor: c.bgCard, borderColor: c.border }]}>
            <Text style={[styles.sectionTitle, { color: c.textMuted }]}>APLIKASI RAWBT (ANDROID ONLY)</Text>
            <Text style={[styles.infoText, { color: c.textSecondary }]}>
              Metode ini mengirimkan struk ke aplikasi RawBT Service yang terinstal di HP Anda. Sangat cocok jika driver Bluetooth thermal internal tidak kompatibel.
            </Text>
            <View style={{ gap: 12, marginTop: 12 }}>
              <TouchableOpacity
                onPress={handleTestPrint}
                disabled={isPrinting}
                style={[styles.saveBtn, { backgroundColor: c.accent }]}
              >
                {isPrinting ? (
                  <ActivityIndicator size="small" color={c.textInverse} />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Feather name="printer" size={16} color={c.textInverse} />
                    <Text style={[styles.saveBtnText, { color: c.textInverse }]}>Coba Print via RawBT</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* SECTION 5: SYSTEM PRINT CONFIGURATION */}
        {config.method === 'system' && (
          <View style={[styles.card, { backgroundColor: c.bgCard, borderColor: c.border }]}>
            <Text style={[styles.sectionTitle, { color: c.textMuted }]}>SYSTEM PRINT DIALOG / PDF</Text>
            <Text style={[styles.infoText, { color: c.textSecondary }]}>
              Metode ini membuka dialog cetak sistem bawaan Android/iOS. Anda bisa mencetak ke printer system, share dokumen PDF, atau menyimpannya.
            </Text>
            <View style={{ gap: 12, marginTop: 12 }}>
              <TouchableOpacity
                onPress={handleTestPrint}
                disabled={isPrinting}
                style={[styles.saveBtn, { backgroundColor: c.accent }]}
              >
                {isPrinting ? (
                  <ActivityIndicator size="small" color={c.textInverse} />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Feather name="printer" size={16} color={c.textInverse} />
                    <Text style={[styles.saveBtnText, { color: c.textInverse }]}>Coba Buka Print Dialog</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* SECTION 6: FORMAT & SETTING STRUK */}
        <View style={[styles.card, { backgroundColor: c.bgCard, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.textMuted }]}>PENGATURAN STRUK & HARDWARE</Text>
          <View style={{ gap: 16 }}>
            {/* Auto Print Toggle */}
            <View style={styles.settingItem}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingLabel, { color: c.text }]}>Auto Print Struk</Text>
                <Text style={[styles.settingSub, { color: c.textSecondary }]}>Mencetak struk otomatis setelah payment sukses</Text>
              </View>
              <TouchableOpacity
                onPress={() => updateConfig({ autoPrint: !config.autoPrint })}
                style={[
                  styles.toggleBg,
                  { backgroundColor: config.autoPrint ? c.accent : c.bgInput },
                ]}
              >
                <View
                  style={[
                    styles.toggleDot,
                    { alignSelf: config.autoPrint ? 'flex-end' : 'flex-start' },
                  ]}
                />
              </TouchableOpacity>
            </View>

            {/* Paper Size toggle */}
            <View style={styles.settingItem}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingLabel, { color: c.text }]}>Ukuran Kertas Struk</Text>
                <Text style={[styles.settingSub, { color: c.textSecondary }]}>Pilih lebar kertas thermal printer Anda</Text>
              </View>
              <View style={[styles.segmentedControl, { backgroundColor: c.bgInput }]}>
                {(['58mm', '80mm'] as const).map((size) => {
                  const isActive = config.paperSize === size
                  return (
                    <TouchableOpacity
                      key={size}
                      onPress={() => updateConfig({ paperSize: size })}
                      style={[
                        styles.segmentBtn,
                        { backgroundColor: isActive ? c.accent : 'transparent' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentBtnText,
                          { color: isActive ? c.textInverse : c.textSecondary, fontWeight: isActive ? '700' : '500' },
                        ]}
                      >
                        {size}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>

            {/* Print Copies Stepper */}
            <View style={styles.settingItem}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingLabel, { color: c.text }]}>Jumlah Salinan Struk</Text>
                <Text style={[styles.settingSub, { color: c.textSecondary }]}>Berapa kali struk dicetak untuk satu transaksi</Text>
              </View>
              <View style={[styles.stepperContainer, { backgroundColor: c.bgInput }]}>
                <TouchableOpacity
                  onPress={() => updateConfig({ copies: Math.max(1, config.copies - 1) })}
                  style={styles.stepperBtn}
                >
                  <Feather name="minus" size={14} color={c.text} />
                </TouchableOpacity>
                <Text style={[styles.stepperValue, { color: c.text }]}>{config.copies}</Text>
                <TouchableOpacity
                  onPress={() => updateConfig({ copies: Math.min(5, config.copies + 1) })}
                  style={styles.stepperBtn}
                >
                  <Feather name="plus" size={14} color={c.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Cut Paper toggle */}
            <View style={styles.settingItem}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingLabel, { color: c.text }]}>Potong Kertas Otomatis</Text>
                <Text style={[styles.settingSub, { color: c.textSecondary }]}>Mengirimkan perintah potong kertas (ESC/POS)</Text>
              </View>
              <TouchableOpacity
                onPress={() => updateConfig({ cutPaper: !config.cutPaper })}
                style={[
                  styles.toggleBg,
                  { backgroundColor: config.cutPaper ? c.accent : c.bgInput },
                ]}
              >
                <View
                  style={[
                    styles.toggleDot,
                    { alignSelf: config.cutPaper ? 'flex-end' : 'flex-start' },
                  ]}
                />
              </TouchableOpacity>
            </View>

            {/* Open Cash Drawer toggle */}
            <View style={styles.settingItem}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingLabel, { color: c.text }]}>Buka Laci Kasir (Cash Drawer)</Text>
                <Text style={[styles.settingSub, { color: c.textSecondary }]}>Kirim sinyal kick-out ke laci kasir saat print</Text>
              </View>
              <TouchableOpacity
                onPress={() => updateConfig({ openCashDrawer: !config.openCashDrawer })}
                style={[
                  styles.toggleBg,
                  { backgroundColor: config.openCashDrawer ? c.accent : c.bgInput },
                ]}
              >
                <View
                  style={[
                    styles.toggleDot,
                    { alignSelf: config.openCashDrawer ? 'flex-end' : 'flex-start' },
                  ]}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  methodButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  methodLabel: {
    fontSize: 13,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusSub: {
    fontSize: 11,
    marginTop: 2,
  },
  forgetButton: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  devicesSection: {
    borderTopWidth: 1,
    marginTop: 16,
    paddingTop: 16,
  },
  devicesTitle: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 10,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 12,
    marginVertical: 12,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
  },
  deviceName: {
    fontSize: 13,
    fontWeight: '600',
  },
  deviceMac: {
    fontSize: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  saveBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  infoText: {
    fontSize: 12,
    lineHeight: 18,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  settingSub: {
    fontSize: 11,
    marginTop: 2,
  },
  toggleBg: {
    width: 48,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    minWidth: 120,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentBtnText: {
    fontSize: 12,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 3,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 12,
    textAlign: 'center',
    minWidth: 24,
  },
})
