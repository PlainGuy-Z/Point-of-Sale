/**
 * RawBT Printer Backend
 * 
 * Android-only: sends ESC/POS data via RawBT app intent.
 * No native module required — uses expo-linking.
 */
import * as Linking from 'expo-linking'
import type { PrinterBackend, PrinterConfig, PrintResult } from './types'
import type { PrintReceiptData } from '../../types/receipt'
import { buildReceipt, receiptToIntentUrl } from '../../utils/escpos'

export const rawbtPrinterBackend: PrinterBackend = {
  async isAvailable(): Promise<boolean> {
    try {
      return await Linking.canOpenURL(
        'intent://rawbt?#Intent;scheme=rawbt;package=ru.a40213.rawbtprinter;end'
      )
    } catch {
      return false
    }
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
          method: 'rawbt',
          error: 'RawBT tidak terinstall. Install dari Play Store: "RawBT print service".',
        }
      }

      const escposData = buildReceipt({
        ...data,
        cashierName: data.cashierName || 'Kasir',
        createdAt: new Date(data.createdAt),
        orderType: data.orderType || '',
        paperSize: config.paperSize,
      })

      const intentUrl = receiptToIntentUrl(escposData)

      // RawBT doesn't support multiple copies natively,
      // so we send the intent once (user can configure copies in RawBT)
      await Linking.openURL(intentUrl)

      return { success: true, method: 'rawbt' }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'RawBT print gagal'
      return { success: false, method: 'rawbt', error: msg }
    }
  },
}
