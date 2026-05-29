/**
 * Printer Storage — AsyncStorage wrapper for printer configuration.
 * All printer settings are persisted here with typed access.
 */
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { PrinterConfig, PrinterDevice, PrinterMethod } from './types'
import { DEFAULT_PRINTER_CONFIG } from './types'

// ── Storage Keys ─────────────────────────────────────────────────────────────
const KEYS = {
  METHOD: 'printer_method',
  DEVICE: 'printer_device',
  PAPER_SIZE: 'printer_paper_size',
  AUTO_PRINT: 'printer_auto_print',
  COPIES: 'printer_copies',
  CUT_PAPER: 'printer_cut_paper',
  CASH_DRAWER: 'printer_cash_drawer',
  NETWORK_HOST: 'printer_network_host',
  NETWORK_PORT: 'printer_network_port',
} as const

// ── Load Full Config ─────────────────────────────────────────────────────────
export async function loadConfig(): Promise<PrinterConfig> {
  try {
    const keys = Object.values(KEYS)
    const pairs = await AsyncStorage.multiGet(keys)
    const map = new Map(pairs)

    const method = map.get(KEYS.METHOD) as PrinterMethod | null
    const paperSize = map.get(KEYS.PAPER_SIZE)
    const autoPrint = map.get(KEYS.AUTO_PRINT)
    const copies = map.get(KEYS.COPIES)
    const cutPaper = map.get(KEYS.CUT_PAPER)
    const cashDrawer = map.get(KEYS.CASH_DRAWER)
    const networkHost = map.get(KEYS.NETWORK_HOST)
    const networkPort = map.get(KEYS.NETWORK_PORT)

    return {
      method: method && ['bluetooth', 'network', 'rawbt', 'system'].includes(method)
        ? method
        : DEFAULT_PRINTER_CONFIG.method,
      paperSize: paperSize === '80mm' ? '80mm' : DEFAULT_PRINTER_CONFIG.paperSize,
      autoPrint: autoPrint === 'true',
      copies: copies ? Math.max(1, Math.min(5, parseInt(copies, 10) || 1)) : DEFAULT_PRINTER_CONFIG.copies,
      cutPaper: cutPaper !== null ? cutPaper !== 'false' : DEFAULT_PRINTER_CONFIG.cutPaper,
      openCashDrawer: cashDrawer === 'true',
      networkHost: networkHost || DEFAULT_PRINTER_CONFIG.networkHost,
      networkPort: networkPort ? parseInt(networkPort, 10) || 9100 : DEFAULT_PRINTER_CONFIG.networkPort,
    }
  } catch (err) {
    console.warn('[PrinterStorage] Failed to load config:', err)
    return { ...DEFAULT_PRINTER_CONFIG }
  }
}

// ── Save Partial Config ──────────────────────────────────────────────────────
export async function saveConfig(partial: Partial<PrinterConfig>): Promise<void> {
  try {
    const pairs: [string, string][] = []

    if (partial.method !== undefined) pairs.push([KEYS.METHOD, partial.method])
    if (partial.paperSize !== undefined) pairs.push([KEYS.PAPER_SIZE, partial.paperSize])
    if (partial.autoPrint !== undefined) pairs.push([KEYS.AUTO_PRINT, String(partial.autoPrint)])
    if (partial.copies !== undefined) pairs.push([KEYS.COPIES, String(partial.copies)])
    if (partial.cutPaper !== undefined) pairs.push([KEYS.CUT_PAPER, String(partial.cutPaper)])
    if (partial.openCashDrawer !== undefined) pairs.push([KEYS.CASH_DRAWER, String(partial.openCashDrawer)])
    if (partial.networkHost !== undefined) pairs.push([KEYS.NETWORK_HOST, partial.networkHost])
    if (partial.networkPort !== undefined) pairs.push([KEYS.NETWORK_PORT, String(partial.networkPort)])

    if (pairs.length > 0) {
      await AsyncStorage.multiSet(pairs)
    }
  } catch (err) {
    console.error('[PrinterStorage] Failed to save config:', err)
    throw err
  }
}

// ── Device ───────────────────────────────────────────────────────────────────
export async function getSavedDevice(): Promise<PrinterDevice | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.DEVICE)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export async function saveDevice(device: PrinterDevice): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.DEVICE, JSON.stringify(device))
  } catch (err) {
    console.error('[PrinterStorage] Failed to save device:', err)
    throw err
  }
}

export async function clearDevice(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEYS.DEVICE)
  } catch (err) {
    console.error('[PrinterStorage] Failed to clear device:', err)
  }
}

// ── Migration: import old keys from previous system ──────────────────────────
export async function migrateOldKeys(): Promise<void> {
  try {
    // Old keys from the previous system
    const oldDevice = await AsyncStorage.getItem('selected_printer')
    const oldPrinterDevice = await AsyncStorage.getItem('printer_device')
    const oldPaperSize = await AsyncStorage.getItem('paper_size')

    if (oldDevice && !(await getSavedDevice())) {
      const parsed = JSON.parse(oldDevice)
      await saveDevice({
        id: parsed.address,
        name: parsed.name,
        address: parsed.address,
        method: 'bluetooth',
        isDefault: true,
      })
    } else if (oldPrinterDevice && !(await getSavedDevice())) {
      const parsed = JSON.parse(oldPrinterDevice)
      await saveDevice({
        id: parsed.address,
        name: parsed.name,
        address: parsed.address,
        method: 'bluetooth',
        isDefault: true,
      })
    }

    if (oldPaperSize && (oldPaperSize === '58mm' || oldPaperSize === '80mm')) {
      const current = await AsyncStorage.getItem(KEYS.PAPER_SIZE)
      if (!current) {
        await AsyncStorage.setItem(KEYS.PAPER_SIZE, oldPaperSize)
      }
    }

    // Clean up old keys (do not remove printer_device as it is our active key)
    await AsyncStorage.multiRemove(['selected_printer', 'paper_size'].filter(Boolean))
  } catch (err) {
    console.warn('[PrinterStorage] Migration warning:', err)
  }
}
