/**
 * Printer Module — Type Definitions
 * Central types for the unified printer system.
 */

// Re-export receipt types so consumers only need to import from printer/
export type { PrintReceiptData, PrintReceiptItem } from '../../types/receipt'

// ── Printer Method ───────────────────────────────────────────────────────────
export type PrinterMethod = 'bluetooth' | 'network' | 'rawbt' | 'system'

// ── Printer Device ───────────────────────────────────────────────────────────
export interface PrinterDevice {
  /** Unique ID — BT address, or IP:port for network */
  id: string
  /** Human-readable name */
  name: string
  /** BT MAC address or IP address */
  address: string
  /** How this device was discovered */
  method: PrinterMethod
  /** Whether this is the default/saved device */
  isDefault?: boolean
}

// ── Printer Config (persisted) ───────────────────────────────────────────────
export interface PrinterConfig {
  /** Active print method */
  method: PrinterMethod
  /** Paper width */
  paperSize: '58mm' | '80mm'
  /** Auto-print after successful payment */
  autoPrint: boolean
  /** Number of copies per print */
  copies: number
  /** Send cut command after printing */
  cutPaper: boolean
  /** Send cash drawer open command */
  openCashDrawer: boolean
  /** Network printer host (IP) */
  networkHost: string
  /** Network printer port */
  networkPort: number
}

// ── Default Config ───────────────────────────────────────────────────────────
export const DEFAULT_PRINTER_CONFIG: PrinterConfig = {
  method: 'system',
  paperSize: '58mm',
  autoPrint: false,
  copies: 1,
  cutPaper: true,
  openCashDrawer: false,
  networkHost: '',
  networkPort: 9100,
}

// ── Print Result ─────────────────────────────────────────────────────────────
export interface PrintResult {
  success: boolean
  method: PrinterMethod | 'none'
  error?: string
  deviceName?: string
}

// ── Connection Status ────────────────────────────────────────────────────────
export interface ConnectionStatus {
  connected: boolean
  deviceName?: string
  method?: PrinterMethod
}

// ── Printer Backend Interface ────────────────────────────────────────────────
export interface PrinterBackend {
  /** Check if this backend is available on the current device */
  isAvailable(): Promise<boolean>
  /** Print receipt data using this backend */
  printReceipt(
    data: import('../../types/receipt').PrintReceiptData,
    config: PrinterConfig
  ): Promise<PrintResult>
}
