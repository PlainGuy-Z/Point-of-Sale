/**
 * Bluetooth Printer Backend
 * 
 * Uses react-native-thermal-receipt-printer-image-qr when available.
 * Gracefully degrades if the native module is not linked (Expo Go).
 */
import type { PrinterBackend, PrinterConfig, PrinterDevice, PrintResult } from './types'
import type { PrintReceiptData } from '../../types/receipt'
import { buildReceipt } from '../../utils/escpos'

// ── Native module availability check ─────────────────────────────────────────
let ThermalPrinterModule: any = null
let nativeModuleChecked = false

async function getNativeModule(): Promise<any> {
  if (nativeModuleChecked) return ThermalPrinterModule
  nativeModuleChecked = true
  try {
    // Dynamic import to avoid crash if not installed
    const mod = require('react-native-thermal-receipt-printer-image-qr')
    ThermalPrinterModule = mod
    return mod
  } catch {
    console.warn('[BluetoothPrinter] Native module not available — using placeholder mode')
    return null
  }
}

// ── State ────────────────────────────────────────────────────────────────────
let _connected = false
let _connectedAddress = ''

// ── Bluetooth Printer Backend ────────────────────────────────────────────────
export const bluetoothPrinterBackend: PrinterBackend & {
  scanDevices(): Promise<PrinterDevice[]>
  connect(address: string): Promise<boolean>
  disconnect(): Promise<void>
  isConnected(): boolean
  getConnectedAddress(): string
  printRaw(escposData: string): Promise<void>
} = {
  async isAvailable(): Promise<boolean> {
    const mod = await getNativeModule()
    return mod !== null
  },

  async scanDevices(): Promise<PrinterDevice[]> {
    const mod = await getNativeModule()
    if (!mod) {
      // Placeholder mode: return empty list with console hint
      console.info(
        '[BluetoothPrinter] Native BT module not installed. ' +
        'Install react-native-thermal-receipt-printer-image-qr and use a dev build.'
      )
      return []
    }

    try {
      const { BLEPrinter, BluetoothManager } = mod

      // Enable Bluetooth adapter if available
      if (BluetoothManager?.enableBluetooth) {
        await BluetoothManager.enableBluetooth()
      }

      // Init & scan
      await BLEPrinter.init()
      const rawDevices: Array<{ device_name?: string; inner_mac_address?: string }> =
        await BLEPrinter.getDeviceList()

      return rawDevices
        .filter((d) => d.inner_mac_address)
        .map((d) => ({
          id: d.inner_mac_address!,
          name: d.device_name || `Printer ${d.inner_mac_address!.slice(-5)}`,
          address: d.inner_mac_address!,
          method: 'bluetooth' as const,
        }))
    } catch (err) {
      console.error('[BluetoothPrinter] Scan failed:', err)
      throw new Error(
        `Gagal scan Bluetooth: ${err instanceof Error ? err.message : 'Unknown error'}`
      )
    }
  },

  async connect(address: string): Promise<boolean> {
    const mod = await getNativeModule()
    if (!mod) {
      console.warn('[BluetoothPrinter] Cannot connect — native module not available')
      return false
    }

    try {
      const { BLEPrinter } = mod
      await BLEPrinter.init() // Ensure printer service is initialized
      await BLEPrinter.connectPrinter(address)
      _connected = true
      _connectedAddress = address
      return true
    } catch (err) {
      console.error('[BluetoothPrinter] Connect failed:', err)
      _connected = false
      _connectedAddress = ''
      return false
    }
  },

  async disconnect(): Promise<void> {
    const mod = await getNativeModule()
    if (!mod) return

    try {
      const { BLEPrinter } = mod
      await BLEPrinter.closeConn()
    } catch (err) {
      console.warn('[BluetoothPrinter] Disconnect error:', err)
    } finally {
      _connected = false
      _connectedAddress = ''
    }
  },

  isConnected(): boolean {
    return _connected
  },

  getConnectedAddress(): string {
    return _connectedAddress
  },

  async printRaw(escposData: string): Promise<void> {
    const mod = await getNativeModule()
    if (!mod) {
      throw new Error('Bluetooth module tidak tersedia. Gunakan development build.')
    }

    if (!_connected) {
      throw new Error('Printer belum terhubung.')
    }

    // Convert raw binary ESC/POS string to Base64 (native printRawData expects base64)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
    let base64Data = ''
    for (let block = 0, charCode = 0, idx = 0, map = chars;
         escposData.charAt(idx | 0) || (map = '=', idx % 1);
         base64Data += map.charAt(63 & block >> 8 - idx % 1 * 8)) {
      charCode = escposData.charCodeAt(idx += 3/4)
      block = block << 8 | (Number.isNaN(charCode) ? 0 : charCode)
    }

    const { BLEPrinter } = mod
    await BLEPrinter.printRaw(base64Data)
  },

  async printReceipt(
    data: PrintReceiptData,
    config: PrinterConfig
  ): Promise<PrintResult> {
    try {
      const available = await this.isAvailable()
      if (!available) {
        return {
          success: false,
          method: 'bluetooth',
          error: 'Bluetooth module tidak tersedia. Install react-native-thermal-receipt-printer-image-qr dan gunakan development build.',
        }
      }

      // Build ESC/POS data
      const escposData = buildReceipt({
        ...data,
        cashierName: data.cashierName || 'Kasir',
        createdAt: new Date(data.createdAt),
        orderType: data.orderType || '',
        paperSize: config.paperSize,
      })

      // Print copies
      for (let i = 0; i < config.copies; i++) {
        await this.printRaw(escposData)
      }

      return { success: true, method: 'bluetooth' }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Bluetooth print gagal'
      return { success: false, method: 'bluetooth', error: msg }
    }
  },
}
