/**
 * Printer Module
 * Unified entrypoint for printing configurations, storage, and service logic.
 */

export * from './types'
export { printerService } from './printerService'
export { buildReceiptText } from './systemPrinter'

import * as printerStorage from './printerStorage'
export { printerStorage }
export { bluetoothPrinterBackend } from './bluetoothPrinter'
export { networkPrinterBackend } from './networkPrinter'
export { rawbtPrinterBackend } from './rawbtPrinter'
export { systemPrinterBackend } from './systemPrinter'
