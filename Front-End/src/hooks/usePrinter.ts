import { useState, useCallback } from 'react'
import { useSettings } from '../contexts/SettingsContext'
import { printerService } from '../services/printer'
import { buildReceipt, type ReceiptData, receiptToIntentUrl } from '../utils/escpos'

/**
 * Open a custom-scheme intent URL (e.g. rawbt:base64,...) on Android.
 * Exported so PrinterSection and other callers can reuse the same logic.
 */
export function openIntentUrl(url: string): boolean {
  // Strategy 1: window.location.assign — most reliable for custom schemes on Android
  try {
    console.log('[openIntentUrl] trying window.location.assign')
    window.location.assign(url)
    console.log('[openIntentUrl] rawbt intent opened via location.assign')
    return true
  } catch (err) {
    console.warn('[openIntentUrl] location.assign failed, trying anchor click', err)
  }

  // Strategy 2: invisible anchor click
  try {
    console.log('[openIntentUrl] trying anchor click')
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.style.display = 'none'
    anchor.target = '_self'
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    console.log('[openIntentUrl] rawbt intent opened via anchor click')
    return true
  } catch (err) {
    console.warn('[openIntentUrl] anchor click failed, trying window.open', err)
  }

  // Strategy 3: window.open (last resort)
  try {
    console.log('[openIntentUrl] trying window.open')
    const opened = window.open(url, '_self')
    if (opened) {
      console.log('[openIntentUrl] rawbt intent opened via window.open')
    }
    return Boolean(opened)
  } catch (err) {
    console.error('[openIntentUrl] window.open failed for intent URL', err)
  }

  return false
}

export function usePrinter() {
  const { settings } = useSettings()
  const [isConnecting, setIsConnecting] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [connectionStatus, setConnectionStatus] = 
    useState<'unknown' | 'connected' | 'error'>('unknown')

  const testConnection = useCallback(async () => {
    if (!settings?.rawbt_ip) return false
    setIsConnecting(true)
    try {
      const ok = await printerService.testRawBT(settings.rawbt_ip)
      setConnectionStatus(ok ? 'connected' : 'error')
      return ok
    } finally {
      setIsConnecting(false)
    }
  }, [settings?.rawbt_ip])

  const print = useCallback(async (data: ReceiptData) => {
    setIsPrinting(true)
    try {
      const method = settings?.print_method || 'browser'
      const paperSize = (settings?.receipt_paper_size || '80mm') as '58mm'|'80mm'
      console.log('[usePrinter] selected print method:', method)
      
      if (method === 'rawbt' && settings?.rawbt_ip) {
        // Network proxy — send ESC/POS via HTTP POST to RawBT IP
        const content = buildReceipt({ ...data, paperSize })
        console.log('[usePrinter] forwarding to RawBT IP:', settings.rawbt_ip)
        await printerService.printRawBT(settings.rawbt_ip, content)
      } else if (method === 'rawbt_intent') {
        // Direct Print (Android) — generate rawbt:base64,... URL
        const content = buildReceipt({ ...data, paperSize })
        const url = receiptToIntentUrl(content)
        console.log('[usePrinter] rawbt intent generated, url length:', url.length)
        const opened = openIntentUrl(url)
        if (!opened) {
          console.error('[usePrinter] failed to open RawBT intent URL — all strategies exhausted')
          throw new Error('INTENT_OPEN_FAILED')
        }
        console.log('[usePrinter] rawbt intent opened successfully')
      } else if (method === 'browser') {
        // Browser Print — standard window.print()
        console.log('[usePrinter] using browser print (window.print)')
        window.print()
      } else {
        // Unknown method — log warning, do NOT call window.print
        console.warn('[usePrinter] unknown print method, skipping print:', method)
      }
    } finally {
      setIsPrinting(false)
    }
  }, [settings])

  return { testConnection, print, isConnecting, isPrinting, connectionStatus }
}
