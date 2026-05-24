import { useState, useCallback } from 'react'
import { useSettings } from '../contexts/SettingsContext'
import { printerService } from '../services/printer'
import { buildReceipt, type ReceiptData, receiptToIntentUrl } from '../utils/escpos'

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
      console.log('[usePrinter] print method:', method)
      
      if (method === 'rawbt' && settings?.rawbt_ip) {
        const content = buildReceipt({ ...data, paperSize })
        console.log('[usePrinter] forwarding to RawBT IP:', settings.rawbt_ip)
        await printerService.printRawBT(settings.rawbt_ip, content)
      } else if (method === 'rawbt_intent') {
        const content = buildReceipt({ ...data, paperSize })
        const url = receiptToIntentUrl(content)
        console.log('[usePrinter] intent URL generated:', url.slice(0, 120) + (url.length>120? '...':''))
        try {
          const opened = window.open(url)
          if (!opened) {
            console.error('[usePrinter] failed to open intent (popup blocked)')
            throw new Error('INTENT_OPEN_FAILED')
          }
          console.log('[usePrinter] intent opened successfully')
        } catch (err) {
          console.error('[usePrinter] error opening intent:', err)
          // Rethrow so callers can handle fallback UI
          throw err
        }
      } else {
        console.log('[usePrinter] using browser print')
        window.print()
      }
    } finally {
      setIsPrinting(false)
    }
  }, [settings])

  return { testConnection, print, isConnecting, isPrinting, connectionStatus }
}
