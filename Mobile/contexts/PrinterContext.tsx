/**
 * Printer Context
 * Provides global state management for POS printing across the app.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { Alert, PermissionsAndroid, Platform } from 'react-native'
import { 
  printerService, 
  printerStorage, 
  DEFAULT_PRINTER_CONFIG 
} from '../services/printer'
import type { 
  PrinterConfig, 
  PrinterDevice, 
  PrintReceiptData, 
  PrintResult, 
  ConnectionStatus 
} from '../services/printer/types'

async function checkAndRequestBluetoothPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true

  try {
    if (Platform.Version >= 31) {
      const permissionsToRequest = [
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, // tetap dibutuhkan untuk classic BT discovery
      ]

      const granted = await PermissionsAndroid.requestMultiple(permissionsToRequest)

      return (
        granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
      )
    } else {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      )
      return granted === PermissionsAndroid.RESULTS.GRANTED
    }
  } catch (err) {
    console.warn('[PrinterContext] Permission request failed:', err)
    return false
  }
}

interface PrinterContextType {
  config: PrinterConfig
  selectedDevice: PrinterDevice | null
  devices: PrinterDevice[]
  isScanning: boolean
  isPrinting: boolean
  connectionStatus: ConnectionStatus
  scan: () => Promise<void>
  selectDevice: (device: PrinterDevice) => Promise<boolean>
  forgetPrinter: () => Promise<void>
  changePaperSize: (size: '58mm' | '80mm') => Promise<boolean>
  updateConfig: (partial: Partial<PrinterConfig>) => Promise<boolean>
  testPrint: () => Promise<PrintResult>
  printReceipt: (data: PrintReceiptData) => Promise<PrintResult>
}

const PrinterContext = createContext<PrinterContextType | undefined>(undefined)

export const PrinterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<PrinterConfig>(DEFAULT_PRINTER_CONFIG)
  const [selectedDevice, setSelectedDevice] = useState<PrinterDevice | null>(null)
  const [devices, setDevices] = useState<PrinterDevice[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    method: 'system',
  })

  // Load configuration and saved device on mount
  const initPrinter = useCallback(async () => {
    try {
      // Migrate old settings if exist
      await printerStorage.migrateOldKeys()

      const savedConfig = await printerStorage.loadConfig()
      const savedDevice = await printerStorage.getSavedDevice()

      setConfig(savedConfig)
      setSelectedDevice(savedDevice)

      // If method is bluetooth and there is a saved device, auto connect
      if (savedConfig.method === 'bluetooth' && savedDevice) {
        const hasPermission = await checkAndRequestBluetoothPermissions()
        if (hasPermission) {
          const ok = await printerService.connectDevice(savedDevice)
          setConnectionStatus({
            connected: ok,
            deviceName: ok ? savedDevice.name : undefined,
            method: 'bluetooth',
          })
        } else {
          setConnectionStatus({
            connected: false,
            method: 'bluetooth',
          })
        }
      } else {
        setConnectionStatus({
          connected: true, // Non-bluetooth backends are treated as connected
          method: savedConfig.method,
        })
      }
    } catch (err) {
      console.warn('[PrinterContext] Initialization error:', err)
    }
  }, [])

  useEffect(() => {
    initPrinter()
  }, [initPrinter])

  // Update connection status periodically or when config/device changes
  const refreshStatus = useCallback(async () => {
    const status = await printerService.getConnectionStatus()
    setConnectionStatus(status)
  }, [])

  // Scan for bluetooth printers
  const scan = useCallback(async () => {
    setIsScanning(true)
    try {
      const hasPermission = await checkAndRequestBluetoothPermissions()
      if (!hasPermission) {
        Alert.alert(
          'Izin Diperlukan',
          'Aplikasi memerlukan izin Bluetooth untuk memindai printer. Silakan aktifkan izin di pengaturan HP Anda.'
        )
        return
      }
      const found = await printerService.scanDevices()
      setDevices(found)
    } catch (err) {
      console.error('[PrinterContext] Scan failed:', err)
    } finally {
      setIsScanning(false)
    }
  }, [])

  // Select a printer device
  const selectDevice = useCallback(async (device: PrinterDevice): Promise<boolean> => {
    const prev = selectedDevice
    setSelectedDevice(device)
    try {
      await printerStorage.saveDevice(device)
      
      // Attempt connection if method is bluetooth
      if (config.method === 'bluetooth') {
        const hasPermission = await checkAndRequestBluetoothPermissions()
        if (!hasPermission) {
          Alert.alert(
            'Izin Diperlukan',
            'Izin Bluetooth ditolak. Tidak dapat menyambungkan ke printer.'
          )
          setSelectedDevice(prev)
          return false
        }

        const ok = await printerService.connectDevice(device)
        if (!ok) {
          Alert.alert('Koneksi Gagal', `Tidak dapat terhubung ke ${device.name}.`)
        }
        await refreshStatus()
      }
      return true
    } catch (err) {
      console.error('[PrinterContext] Select device failed:', err)
      setSelectedDevice(prev)
      return false
    }
  }, [selectedDevice, config.method, refreshStatus])

  // Clear/Forget current device
  const forgetPrinter = useCallback(async () => {
    try {
      if (config.method === 'bluetooth') {
        await printerService.disconnectDevice()
      }
      await printerStorage.clearDevice()
      setSelectedDevice(null)
      await refreshStatus()
    } catch (err) {
      console.error('[PrinterContext] Forget printer failed:', err)
    }
  }, [config.method, refreshStatus])

  // Save specific configurations
  const updateConfig = useCallback(async (partial: Partial<PrinterConfig>): Promise<boolean> => {
    const prev = config
    const newConfig = { ...config, ...partial }
    setConfig(newConfig)
    try {
      await printerStorage.saveConfig(partial)

      // Handle method changes specifically
      if (partial.method) {
        if (partial.method === 'bluetooth' && selectedDevice) {
          const hasPermission = await checkAndRequestBluetoothPermissions()
          if (hasPermission) {
            const ok = await printerService.connectDevice(selectedDevice)
            setConnectionStatus({
              connected: ok,
              deviceName: ok ? selectedDevice.name : undefined,
              method: 'bluetooth',
            })
          } else {
            setConnectionStatus({
              connected: false,
              method: 'bluetooth',
            })
          }
        } else {
          // Disconnect bluetooth if switching to other methods
          if (prev.method === 'bluetooth') {
            await printerService.disconnectDevice()
          }
          setConnectionStatus({
            connected: true,
            method: partial.method,
          })
        }
      }
      return true
    } catch (err) {
      console.error('[PrinterContext] Save config failed:', err)
      setConfig(prev)
      return false
    }
  }, [config, selectedDevice])

  const changePaperSize = useCallback(async (size: '58mm' | '80mm'): Promise<boolean> => {
    return updateConfig({ paperSize: size })
  }, [updateConfig])

  // Print a test receipt
  const testPrint = useCallback(async (): Promise<PrintResult> => {
    setIsPrinting(true)
    try {
      const res = await printerService.testPrint()
      await refreshStatus()
      return res
    } finally {
      setIsPrinting(false)
    }
  }, [refreshStatus])

  // Print transaction receipt
  const printReceipt = useCallback(async (data: PrintReceiptData): Promise<PrintResult> => {
    setIsPrinting(true)
    try {
      const res = await printerService.printReceipt(data)
      await refreshStatus()
      return res
    } finally {
      setIsPrinting(false)
    }
  }, [refreshStatus])

  return (
    <PrinterContext.Provider
      value={{
        config,
        selectedDevice,
        devices,
        isScanning,
        isPrinting,
        connectionStatus,
        scan,
        selectDevice,
        forgetPrinter,
        changePaperSize,
        updateConfig,
        testPrint,
        printReceipt,
      }}
    >
      {children}
    </PrinterContext.Provider>
  )
}

export const usePrinter = () => {
  const context = useContext(PrinterContext)
  if (context === undefined) {
    throw new Error('usePrinter must be used within a PrinterProvider')
  }
  return context
}
