/**
 * Network Printer Backend
 * 
 * Sends ESC/POS data to thermal printers over TCP/IP (port 9100).
 * Uses react-native-tcp-socket when available.
 * Gracefully degrades if the native module is not linked.
 */
import type { PrinterBackend, PrinterConfig, PrintResult } from './types'
import type { PrintReceiptData } from '../../types/receipt'
import { buildReceipt } from '../../utils/escpos'

// ── Native module availability check ─────────────────────────────────────────
let TcpSocket: any = null
let nativeModuleChecked = false

function getTcpModule(): any {
  if (nativeModuleChecked) return TcpSocket
  nativeModuleChecked = true
  try {
    TcpSocket = require('react-native-tcp-socket')
    return TcpSocket
  } catch {
    console.warn('[NetworkPrinter] TCP socket module not available')
    return null
  }
}

// ── Network Printer Backend ──────────────────────────────────────────────────
export const networkPrinterBackend: PrinterBackend & {
  testConnection(host: string, port: number): Promise<boolean>
  printRaw(escposData: string, host: string, port: number): Promise<void>
} = {
  async isAvailable(): Promise<boolean> {
    return getTcpModule() !== null
  },

  async testConnection(host: string, port: number): Promise<boolean> {
    const tcp = getTcpModule()
    if (!tcp) {
      throw new Error('TCP socket module tidak tersedia. Install react-native-tcp-socket dan gunakan development build.')
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        try { client.destroy() } catch {}
        resolve(false)
      }, 5000)

      const client = tcp.createConnection(
        { host, port, timeout: 5000 },
        () => {
          clearTimeout(timeout)
          client.destroy()
          resolve(true)
        }
      )

      client.on('error', () => {
        clearTimeout(timeout)
        try { client.destroy() } catch {}
        resolve(false)
      })
    })
  },

  async printRaw(escposData: string, host: string, port: number): Promise<void> {
    const tcp = getTcpModule()
    if (!tcp) {
      throw new Error('TCP socket module tidak tersedia.')
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        try { client.destroy() } catch {}
        reject(new Error('Timeout: printer tidak merespons dalam 10 detik.'))
      }, 10000)

      const client = tcp.createConnection(
        { host, port, timeout: 10000 },
        () => {
          client.write(escposData, 'binary', (err: any) => {
            clearTimeout(timeout)
            client.destroy()
            if (err) {
              reject(new Error(`Gagal mengirim data: ${err.message}`))
            } else {
              resolve()
            }
          })
        }
      )

      client.on('error', (err: any) => {
        clearTimeout(timeout)
        try { client.destroy() } catch {}
        reject(new Error(`Network error: ${err.message}`))
      })
    })
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
          method: 'network',
          error: 'TCP socket module tidak tersedia. Install react-native-tcp-socket dan gunakan development build.',
        }
      }

      if (!config.networkHost) {
        return {
          success: false,
          method: 'network',
          error: 'IP Address printer belum dikonfigurasi.',
        }
      }

      const escposData = buildReceipt({
        ...data,
        cashierName: data.cashierName || 'Kasir',
        createdAt: new Date(data.createdAt),
        orderType: data.orderType || '',
        paperSize: config.paperSize,
      })

      for (let i = 0; i < config.copies; i++) {
        await this.printRaw(escposData, config.networkHost, config.networkPort)
      }

      return { success: true, method: 'network' }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network print gagal'
      return { success: false, method: 'network', error: msg }
    }
  },
}
