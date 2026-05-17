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
      
      if (method === 'rawbt' && settings?.rawbt_ip) {
        const content = buildReceipt({ ...data, paperSize })
        await printerService.printRawBT(settings.rawbt_ip, content)
      } else if (method === 'rawbt_intent') {
        const content = buildReceipt({ ...data, paperSize })
        const url = receiptToIntentUrl(content)
        window.location.href = url
      } else {
        window.print()
      }
    } finally {
      setIsPrinting(false)
    }
  }, [settings])

  return { testConnection, print, isConnecting, isPrinting, connectionStatus }
}
