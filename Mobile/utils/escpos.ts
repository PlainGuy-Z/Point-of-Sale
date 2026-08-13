const ESC = '\x1B'
const GS = '\x1D'
const INIT = ESC + '@'
const CUT = GS + 'V' + '\x42' + '\x00'
const BOLD_ON = ESC + 'E' + '\x01'
const BOLD_OFF = ESC + 'E' + '\x00'
const ALIGN_CENTER = ESC + 'a' + '\x01'
const ALIGN_LEFT = ESC + 'a' + '\x00'
const ALIGN_RIGHT = ESC + 'a' + '\x02'
const DOUBLE_HEIGHT = ESC + '!' + '\x10'
const NORMAL_SIZE = ESC + '!' + '\x00'
const FEED_LINE = '\n'
const OPEN_DRAWER = ESC + 'p' + '\x00' + '\x19' + '\xFA'

// For 80mm: 48 chars per line
// For 58mm: 32 chars per line
type PaperSize = '58mm' | '80mm'

function getLineWidth(size: PaperSize): number {
  return size === '80mm' ? 48 : 32
}

function padRight(text: string, width: number): string {
  return text.substring(0, width).padEnd(width)
}

function formatTwoColumns(
  left: string, right: string, width: number
): string {
  const rightLen = right.length
  const leftLen = width - rightLen - 1
  return left.substring(0, leftLen).padEnd(leftLen) + ' ' + right
}

function separator(width: number, char = '='): string {
  return char.repeat(width)
}

export interface ReceiptData {
  shopName: string
  shopAddress?: string
  shopPhone?: string
  cashierName: string
  transactionId: string
  createdAt: Date
  orderType: string
  tableNumber?: string
  customerName?: string
  notes?: string
  items: Array<{
    name: string
    quantity: number
    price: number
    subtotal: number
    variantName?: string
    variantPrice?: number
    notes?: string
  }>
  subtotal: number
  tax: number
  taxRate: number
  serviceCharge?: number
  grandTotal: number
  paymentMethod: string
  amountPaid?: number
  change?: number
  receiptFooter?: string
  paperSize: PaperSize
  openCashDrawer?: boolean
  cutPaper?: boolean
}

export function buildReceipt(data: ReceiptData): string {
  const W = getLineWidth(data.paperSize)
  let doc = INIT

  // Open Cash Drawer if configured
  if (data.openCashDrawer) {
    doc += OPEN_DRAWER
  }

  // Header
  doc += ALIGN_CENTER
  doc += BOLD_ON + DOUBLE_HEIGHT
  doc += (data.shopName || 'STORE').toUpperCase() + FEED_LINE
  doc += NORMAL_SIZE + BOLD_OFF
  if (data.shopAddress) doc += data.shopAddress + FEED_LINE
  if (data.shopPhone) doc += data.shopPhone + FEED_LINE
  doc += separator(W) + FEED_LINE

  // Transaction info
  doc += ALIGN_LEFT
  doc += formatTwoColumns('Tanggal', 
    new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'short', timeStyle: 'short',
      timeZone: 'Asia/Jakarta'
    }).format(data.createdAt), W) + FEED_LINE
  doc += formatTwoColumns('Kasir', data.cashierName, W) + FEED_LINE
  doc += formatTwoColumns('No. Trx', 
    (data.transactionId || '').slice(-8).toUpperCase(), W) + FEED_LINE
  if (data.orderType) {
    const isDineIn = data.orderType === 'dine_in' || data.orderType === 'dine-in';
    doc += formatTwoColumns('Tipe Pesanan', isDineIn ? 'Dine In' : 'Take Away', W) + FEED_LINE
  }
  if (data.tableNumber) {
    doc += formatTwoColumns('Meja', data.tableNumber, W) + FEED_LINE
  }
  if (data.customerName) {
    doc += formatTwoColumns('Pelanggan', data.customerName, W) + FEED_LINE
  }
  if (data.notes) {
    doc += 'Catatan: ' + data.notes + FEED_LINE
  }
  doc += separator(W, '-') + FEED_LINE

  for (const item of data.items) {
    // Main item row: base price × quantity
    const mainLeft = `${item.quantity}x ${item.name}`
    const mainSubtotal = item.price * item.quantity
    const mainRight = 'Rp ' + new Intl.NumberFormat('id-ID').format(mainSubtotal)
    doc += formatTwoColumns(mainLeft, mainRight, W) + FEED_LINE

    // Show base unit price only when qty >= 2
    if (item.quantity >= 2) {
      const base = new Intl.NumberFormat('id-ID').format(item.price)
      doc += `   Harga Satuan: Rp ${base}` + FEED_LINE
    }

    // Variant row: variant price × quantity on its own line
    if (item.variantName) {
      const varLeft = `  + ${item.variantName}`
      const varSubtotal = (item.variantPrice || 0) * item.quantity
      const varRight = 'Rp ' + new Intl.NumberFormat('id-ID').format(varSubtotal)
      doc += formatTwoColumns(varLeft, varRight, W) + FEED_LINE

      // Show variant unit price only when qty >= 2
      if (item.quantity >= 2) {
        const extra = new Intl.NumberFormat('id-ID').format(item.variantPrice || 0)
        doc += `   Harga Variant Satuan: Rp ${extra}` + FEED_LINE
      }

      // Per-item combined total (base + variant)
      const itemCombined = mainSubtotal + varSubtotal
      const combinedRight = 'Rp ' + new Intl.NumberFormat('id-ID').format(itemCombined)
      doc += formatTwoColumns('  Total Item', combinedRight, W) + FEED_LINE
    }

    if (item.notes) {
      doc += `   Catatan: ${item.notes}`.substring(0, W) + FEED_LINE
    }
  }
  doc += separator(W, '-') + FEED_LINE

  // Totals
  const fmt = (n: number) => 
    'Rp ' + new Intl.NumberFormat('id-ID').format(n)
  
  doc += formatTwoColumns('Subtotal', fmt(data.subtotal), W) + FEED_LINE
  if (data.tax > 0) {
    doc += formatTwoColumns(
      `PPN ${data.taxRate}%`, fmt(data.tax), W
    ) + FEED_LINE
  }
  if (data.serviceCharge && data.serviceCharge > 0) {
    doc += formatTwoColumns('Service', fmt(data.serviceCharge), W) + FEED_LINE
  }
  doc += BOLD_ON
  doc += formatTwoColumns('TOTAL', fmt(data.grandTotal), W) + FEED_LINE
  doc += BOLD_OFF
  doc += separator(W, '-') + FEED_LINE

  // Payment
  const methodLabel: Record<string, string> = {
    cash: 'Tunai', card: 'Kartu', qris: 'QRIS', transfer: 'Transfer'
  }
  doc += formatTwoColumns('Bayar', 
    methodLabel[data.paymentMethod || 'cash'] || data.paymentMethod || 'CASH', W) + FEED_LINE
  if (data.amountPaid) {
    doc += formatTwoColumns('Diterima', fmt(data.amountPaid), W) + FEED_LINE
  }
  if (data.change !== undefined && data.change >= 0) {
    doc += formatTwoColumns('Kembalian', fmt(data.change), W) + FEED_LINE
  }
  doc += separator(W) + FEED_LINE

  // Footer
  doc += ALIGN_CENTER
  doc += (data.receiptFooter || 'Terima kasih telah berkunjung!') + FEED_LINE

  // Cut Paper if configured (default is true)
  if (data.cutPaper !== false) {
    doc += FEED_LINE + FEED_LINE + FEED_LINE // feed past cutter
    doc += CUT
  }

  return doc
}

export function receiptToIntentUrl(escposText: string): string {
  let base64 = '';
  if (typeof btoa !== 'undefined') {
    base64 = btoa(unescape(encodeURIComponent(escposText)));
  } else {
    // Minimal btoa polyfill for React Native
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    const str = unescape(encodeURIComponent(escposText));
    let output = '';
    for (let block = 0, charCode = 0, idx = 0, map = chars;
         str.charAt(idx | 0) || (map = '=', idx % 1);
         output += map.charAt(63 & block >> 8 - idx % 1 * 8)) {
      charCode = str.charCodeAt(idx += 3/4);
      block = block << 8 | (Number.isNaN(charCode) ? 0 : charCode);
    }
    base64 = output;
  }
  return `intent://rawbt:base64,${base64}#Intent;scheme=rawbt;package=ru.a40213.rawbtprinter;end`;
}
