/**
 * Printer Service — Central Orchestrator
 * Routing printing requests to the configured backend (Bluetooth, Network, RawBT, or System).
 * Includes graceful fallbacks when the preferred method fails.
 */
import type { 
  PrinterConfig, 
  PrinterDevice, 
  PrintReceiptData, 
  PrintResult, 
  ConnectionStatus 
} from './types'
import { loadConfig } from './printerStorage'
import { bluetoothPrinterBackend } from './bluetoothPrinter'
import { networkPrinterBackend } from './networkPrinter'
import { rawbtPrinterBackend } from './rawbtPrinter'
import { systemPrinterBackend } from './systemPrinter'

export const printerService = {
  /**
   * Scan for Bluetooth printers (delegates to bluetooth backend)
   */
  async scanDevices(): Promise<PrinterDevice[]> {
    return bluetoothPrinterBackend.scanDevices()
  },

  /**
   * Connect to a Bluetooth device
   */
  async connectDevice(device: PrinterDevice): Promise<boolean> {
    if (device.method === 'bluetooth') {
      return bluetoothPrinterBackend.connect(device.address)
    }
    return false
  },

  /**
   * Disconnect the active Bluetooth printer
   */
  async disconnectDevice(): Promise<void> {
    await bluetoothPrinterBackend.disconnect()
  },

  /**
   * Get active connection status (currently only applicable for Bluetooth classic/BLE)
   */
  async getConnectionStatus(): Promise<ConnectionStatus> {
    const config = await loadConfig()
    const connected = bluetoothPrinterBackend.isConnected()
    const address = bluetoothPrinterBackend.getConnectedAddress()

    return {
      connected: config.method === 'bluetooth' ? connected : true,
      deviceName: config.method === 'bluetooth' && connected ? `Bluetooth Printer (${address.slice(-5)})` : undefined,
      method: config.method,
    }
  },

  /**
   * Print receipt with configured settings and automatic fallbacks if preferred prints fail
   */
  async printReceipt(data: PrintReceiptData): Promise<PrintResult> {
    const config = await loadConfig()
    
    // Inject printer options to data if applicable
    const receiptDataWithDrawer = {
      ...data,
      openCashDrawer: config.openCashDrawer,
      cutPaper: config.cutPaper,
    }

    try {
      switch (config.method) {
        case 'bluetooth': {
          // If bluetooth is configured, ensure connected first
          const isConnected = bluetoothPrinterBackend.isConnected()
          if (!isConnected) {
            const savedDevice = await import('./printerStorage').then(m => m.getSavedDevice())
            if (savedDevice) {
              const connected = await bluetoothPrinterBackend.connect(savedDevice.address)
              if (!connected) {
                console.warn('[PrinterService] BT reconnect failed. Falling back.')
                return this.fallbackPrint(receiptDataWithDrawer, config, 'Koneksi bluetooth gagal')
              }
            } else {
              return this.fallbackPrint(receiptDataWithDrawer, config, 'Printer Bluetooth belum dipilih')
            }
          }

          const result = await bluetoothPrinterBackend.printReceipt(receiptDataWithDrawer, config)
          if (!result.success) {
            return this.fallbackPrint(receiptDataWithDrawer, config, result.error)
          }
          return result
        }

        case 'network': {
          const result = await networkPrinterBackend.printReceipt(receiptDataWithDrawer, config)
          if (!result.success) {
            return this.fallbackPrint(receiptDataWithDrawer, config, result.error)
          }
          return result
        }

        case 'rawbt': {
          const result = await rawbtPrinterBackend.printReceipt(receiptDataWithDrawer, config)
          if (!result.success) {
            return this.fallbackPrint(receiptDataWithDrawer, config, result.error)
          }
          return result
        }

        case 'system':
        default:
          return systemPrinterBackend.printReceipt(receiptDataWithDrawer, config)
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown print error'
      return this.fallbackPrint(receiptDataWithDrawer, config, errMsg)
    }
  },

  /**
   * Graceful fallback pipeline:
   * Bluetooth/Network -> RawBT (if available) -> System Print (universal fallback)
   */
  async fallbackPrint(
    data: PrintReceiptData, 
    config: PrinterConfig, 
    originalError?: string
  ): Promise<PrintResult> {
    console.warn(`[PrinterService] Primary method (${config.method}) failed: ${originalError}. Trying RawBT...`)

    // Check if RawBT is available
    const rawbtAvailable = await rawbtPrinterBackend.isAvailable()
    if (rawbtAvailable) {
      const rawbtResult = await rawbtPrinterBackend.printReceipt(data, config)
      if (rawbtResult.success) {
        return {
          success: true,
          method: 'rawbt',
          error: `Metode utama gagal (${originalError}). Berhasil mencetak melalui RawBT.`,
        }
      }
    }

    // Ultimate fallback: System Print dialog
    console.warn('[PrinterService] RawBT unavailable or failed. Falling back to OS print dialog.')
    const systemResult = await systemPrinterBackend.printReceipt(data, config)
    if (systemResult.success) {
      return {
        success: true,
        method: 'system',
        error: `Metode utama gagal (${originalError}). Berhasil mencetak melalui System Print.`,
      }
    }

    return {
      success: false,
      method: 'none',
      error: `Semua metode pencetakan gagal. Error utama: ${originalError || 'Unknown'}`,
    }
  },

  /**
   * Run a test print on the currently selected printer configuration
   */
  async testPrint(): Promise<PrintResult> {
    const testData: PrintReceiptData = {
      shopName: 'SmartPOS Test Print',
      transactionId: 'TEST-123456789',
      createdAt: new Date().toISOString(),
      cashierName: 'System Test',
      orderType: 'dine_in',
      tableNumber: '99',
      customerName: 'Pelanggan Tes',
      notes: 'Pencetakan uji coba printer baru.',
      items: [
        {
          name: 'Produk Tes A',
          quantity: 1,
          price: 15000,
          subtotal: 15000,
        },
        {
          name: 'Produk Tes B',
          quantity: 2,
          price: 5000,
          subtotal: 16000,
          variantName: 'Telur',
          variantPrice: 3000,
        }
      ],
      subtotal: 31000,
      tax: 3410,
      taxRate: 11,
      grandTotal: 34410,
      paymentMethod: 'cash',
      amountPaid: 40000,
      change: 5590,
      paperSize: '58mm',
      receiptFooter: 'Printer berfungsi dengan baik!',
    }

    return this.printReceipt(testData)
  }
}
