/**
 * System Printer Backend
 * 
 * Universal fallback using expo-print (OS print dialog).
 * Works on all platforms, no native module required.
 */
import * as Print from 'expo-print'
import type { PrinterBackend, PrinterConfig, PrintResult } from './types'
import type { PrintReceiptData } from '../../types/receipt'

// ── HTML Receipt Builder ─────────────────────────────────────────────────────
function buildHTMLReceipt(data: PrintReceiptData): string {
  const paperWidth = data.paperSize === '80mm' ? '80mm' : '58mm'

  const itemsHTML = data.items
    .map(
      (item) => {
        const mainSubtotal = item.price * item.quantity
        const varSubtotal = (item.variantPrice || 0) * item.quantity
        const base = item.price.toLocaleString('id-ID')
        const extra = (item.variantPrice || 0).toLocaleString('id-ID')
        
        return `
    <div class="item">
      <div class="item-row">
        <span>${item.quantity}x ${item.name}</span>
        <span>Rp ${mainSubtotal.toLocaleString('id-ID')}</span>
      </div>
      ${
        item.quantity >= 2
          ? `
      <div class="item-detail">
        Harga Satuan: Rp ${base}
      </div>
      `
          : ''
      }
      ${
        item.variantName
          ? `
      <div class="item-row" style="font-weight: normal; font-size: 11px; padding-left: 12px; color: #333; margin-top: 1px;">
        <span>+ ${item.variantName}</span>
        <span>Rp ${varSubtotal.toLocaleString('id-ID')}</span>
      </div>
      ${
        item.quantity >= 2
          ? `
      <div class="item-detail">
        Harga Variant Satuan: Rp ${extra}
      </div>
      `
          : ''
      }
      <div class="item-row" style="font-weight: bold; font-size: 11px; padding-left: 12px; margin-top: 2px; padding-top: 2px; border-top: 1px dotted #ccc;">
        <span>Total Item</span>
        <span>Rp ${(mainSubtotal + varSubtotal).toLocaleString('id-ID')}</span>
      </div>
      `
          : ''
      }
      ${
        item.description
          ? `<div class="note">Catatan: ${item.description}</div>`
          : ''
      }
    </div>
  `
      }
    )
    .join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          width: 100%;
          padding: 4mm 4mm;
          color: #000;
        }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .large { font-size: 14px; }
        .separator { 
          border-top: 1px dashed #000; 
          margin: 6px 0; 
        }
        .row { 
          display: flex; 
          justify-content: space-between; 
          margin: 2px 0; 
        }
        .item { margin-bottom: 6px; }
        .item-row { 
          display: flex; 
          justify-content: space-between; 
          font-weight: bold; 
        }
        .item-detail { 
          color: #555; 
          padding-left: 12px; 
          font-size: 10px; 
        }
        .variant { 
          color: #333; 
          padding-left: 12px; 
          font-style: italic; 
        }
        .note { 
          color: #555; 
          padding-left: 12px; 
          font-style: italic; 
          font-size: 10px; 
        }
        .total-row { 
          display: flex; 
          justify-content: space-between; 
          font-weight: 900; 
          font-size: 14px; 
          margin-top: 4px; 
          padding-top: 4px; 
          border-top: 1px dashed #000; 
        }
        .badge { 
          display: inline-block; 
          border: 1px solid #000; 
          padding: 1px 6px; 
          font-size: 10px; 
          border-radius: 3px; 
        }
        .footer { 
          text-align: center; 
          margin-top: 12px; 
          font-style: italic; 
          font-size: 10px; 
          color: #333; 
        }
        @page { 
          size: auto; 
          margin: 0; 
        }
      </style>
    </head>
    <body>
      <!-- Store header -->
      <div class="center">
        <div class="bold large">${(data.shopName || 'STORE').toUpperCase()}</div>
        ${data.shopAddress ? `<div>${data.shopAddress}</div>` : ''}
        ${data.shopPhone ? `<div>${data.shopPhone}</div>` : ''}
      </div>
      
      <div class="separator"></div>
      
      <!-- Transaction info -->
      <div class="row">
        <span>Receipt ID</span>
        <span>#${(data.transactionId || '').slice(0, 8).toUpperCase()}</span>
      </div>
      <div class="row">
        <span>Tanggal</span>
        <span>${new Date(data.createdAt || Date.now()).toLocaleString('id-ID')}</span>
      </div>
      ${
        data.orderType
          ? `
        <div class="row">
          <span>Tipe</span>
          <span class="badge">${data.orderType === 'dine_in' ? 'Dine In' : 'Take Away'}</span>
        </div>`
          : ''
      }
      ${
        data.tableNumber
          ? `
        <div class="row">
          <span>Meja</span>
          <span><strong>${data.tableNumber}</strong></span>
        </div>`
          : ''
      }
      ${
        data.customerName
          ? `
        <div class="row">
          <span>Pelanggan</span>
          <span>${data.customerName}</span>
        </div>`
          : ''
      }
      ${
        data.notes
          ? `
        <div style="margin-top:4px">
          <div>Catatan: <em>"${data.notes}"</em></div>
        </div>`
          : ''
      }
      
      <div class="separator"></div>
      
      <!-- Items -->
      ${itemsHTML}
      
      <div class="separator"></div>
      
      <!-- Totals -->
      <div class="row">
        <span>Subtotal</span>
        <span>Rp ${data.subtotal.toLocaleString('id-ID')}</span>
      </div>
      ${
        data.tax > 0
          ? `
        <div class="row">
          <span>Pajak (${data.taxRate}%)</span>
          <span>Rp ${data.tax.toLocaleString('id-ID')}</span>
        </div>`
          : ''
      }
      ${
        data.serviceCharge
          ? `
        <div class="row">
          <span>Service</span>
          <span>Rp ${data.serviceCharge.toLocaleString('id-ID')}</span>
        </div>`
          : ''
      }
      
      <div class="total-row">
        <span>TOTAL</span>
        <span>Rp ${data.grandTotal.toLocaleString('id-ID')}</span>
      </div>
      
      <!-- Payment info -->
      <div style="margin-top:6px">
        <div class="row">
          <span>Pembayaran</span>
          <span class="bold">${(data.paymentMethod || 'CASH').toUpperCase()}</span>
        </div>
        ${
          data.amountPaid
            ? `
          <div class="row">
            <span>Tunai</span>
            <span>Rp ${data.amountPaid.toLocaleString('id-ID')}</span>
          </div>`
            : ''
        }
        ${
          data.change
            ? `
          <div class="row">
            <span>Kembali</span>
            <span>Rp ${data.change.toLocaleString('id-ID')}</span>
          </div>`
            : ''
        }
      </div>
      
      <!-- Footer -->
      ${
        data.receiptFooter
          ? `
        <div class="footer">
          ${data.receiptFooter}
        </div>`
          : ''
      }
      
      <!-- Dots -->
      <div style="text-align:center; margin-top:12px; 
                  color:#ccc; letter-spacing:4px">
        • • •
      </div>
    </body>
    </html>
  `
}

// ── System Printer Backend ───────────────────────────────────────────────────
export const systemPrinterBackend: PrinterBackend = {
  async isAvailable(): Promise<boolean> {
    // System print is always available via expo-print
    return true
  },

  async printReceipt(
    data: PrintReceiptData,
    _config: PrinterConfig
  ): Promise<PrintResult> {
    try {
      const html = buildHTMLReceipt(data)
      await Print.printAsync({ html })
      return { success: true, method: 'system' }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'System print gagal'
      return { success: false, method: 'system', error: msg }
    }
  },
}

// ── Receipt Text Builder (for clipboard copy) ───────────────────────────────
export function buildReceiptText(data: PrintReceiptData): string {
  const lines: string[] = []

  lines.push(`=== ${(data.shopName || 'STORE').toUpperCase()} ===`)
  if (data.isOffline) {
    lines.push('*** STRUK OFFLINE — BELUM SYNC ***')
  }
  if (data.shopAddress) lines.push(data.shopAddress)
  lines.push('--------------------------------')
  lines.push(`ID: #${(data.transactionId || '').slice(0, 8).toUpperCase()}`)
  lines.push(`Tanggal: ${new Date(data.createdAt || Date.now()).toLocaleString('id-ID')}`)
  if (data.orderType) {
    lines.push(
      `Tipe: ${data.orderType === 'dine_in' ? 'Dine In' : 'Take Away'}`
    )
  }
  if (data.tableNumber) lines.push(`Meja: ${data.tableNumber}`)
  if (data.customerName) lines.push(`Pelanggan: ${data.customerName}`)
  if (data.notes) lines.push(`Catatan: "${data.notes}"`)
  lines.push('--------------------------------')

  data.items.forEach((item) => {
    const mainLeft = `${item.quantity}x ${item.name}`
    const mainSubtotal = item.price * item.quantity
    const rightStr = `Rp ${mainSubtotal.toLocaleString('id-ID')}`
    const leftLen = 32 - rightStr.length - 1
    const line = mainLeft.substring(0, Math.max(10, leftLen)).padEnd(leftLen) + ' ' + rightStr
    lines.push(line)

    if (item.quantity >= 2) {
      const base = item.price.toLocaleString('id-ID')
      lines.push(`  Harga Satuan: Rp ${base}`)
    }

    if (item.variantName) {
      const varLeft = `  + ${item.variantName}`
      const varSubtotal = (item.variantPrice || 0) * item.quantity
      const varRightStr = `Rp ${varSubtotal.toLocaleString('id-ID')}`
      const varLeftLen = 32 - varRightStr.length - 1
      const varLine = varLeft.substring(0, Math.max(10, varLeftLen)).padEnd(varLeftLen) + ' ' + varRightStr
      lines.push(varLine)

      if (item.quantity >= 2) {
        const extra = (item.variantPrice || 0).toLocaleString('id-ID')
        lines.push(`  Harga Variant Satuan: Rp ${extra}`)
      }

      // Per-item combined total (base + variant)
      const itemCombined = mainSubtotal + varSubtotal
      const combinedRightStr = `Rp ${itemCombined.toLocaleString('id-ID')}`
      const combinedLeft = '  Total Item'
      const combinedLeftLen = 32 - combinedRightStr.length - 1
      const combinedLine = combinedLeft.substring(0, Math.max(10, combinedLeftLen)).padEnd(combinedLeftLen) + ' ' + combinedRightStr
      lines.push(combinedLine)
    }

    if (item.description) {
      lines.push(`  Catatan: ${item.description}`)
    }
  })

  lines.push('--------------------------------')
  lines.push(`Subtotal: Rp ${data.subtotal.toLocaleString('id-ID')}`)
  if (data.tax > 0) {
    lines.push(
      `Pajak (${data.taxRate}%): Rp ${data.tax.toLocaleString('id-ID')}`
    )
  }
  lines.push(`TOTAL: Rp ${data.grandTotal.toLocaleString('id-ID')}`)
  lines.push(`Bayar: ${(data.paymentMethod || 'CASH').toUpperCase()}`)
  if (data.amountPaid) {
    lines.push(`Tunai: Rp ${data.amountPaid.toLocaleString('id-ID')}`)
    lines.push(
      `Kembali: Rp ${(data.change || 0).toLocaleString('id-ID')}`
    )
  }
  if (data.receiptFooter) {
    lines.push('')
    lines.push(data.receiptFooter)
  }

  return lines.join('\n')
}
