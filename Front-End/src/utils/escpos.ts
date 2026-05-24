const ESC = '\x1B'
const GS = '\x1D'
const INIT = ESC + '@'
const CUT = GS + 'V' + 'A'
const BOLD_ON = ESC + 'E' + '\x01'
const BOLD_OFF = ESC + 'E' + '\x00'
const ALIGN_CENTER = ESC + 'a' + '\x01'
const ALIGN_LEFT = ESC + 'a' + '\x00'
const ALIGN_RIGHT = ESC + 'a' + '\x02'
const DOUBLE_HEIGHT = ESC + '!' + '\x10'
const NORMAL_SIZE = ESC + '!' + '\x00'
const FEED_LINE = '\n'

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
  items: Array<{
    name: string
    quantity: number
    price: number
    subtotal: number
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
}

export function buildReceipt(data: ReceiptData): string {
  const W = getLineWidth(data.paperSize)
  let doc = INIT

  // Header
  doc += ALIGN_CENTER
  doc += BOLD_ON + DOUBLE_HEIGHT
  doc += data.shopName.toUpperCase() + FEED_LINE
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
    data.transactionId.slice(-8).toUpperCase(), W) + FEED_LINE
  if (data.tableNumber) {
    doc += formatTwoColumns('Meja', data.tableNumber, W) + FEED_LINE
  }
  if (data.customerName) {
    doc += formatTwoColumns('Pelanggan', data.customerName, W) + FEED_LINE
  }
  doc += separator(W, '-') + FEED_LINE

  // Items
  for (const item of data.items) {
    doc += item.name.substring(0, W) + FEED_LINE
    const qtyPrice = `${item.quantity} x ${
      new Intl.NumberFormat('id-ID').format(item.price)
    }`
    const subTotal = new Intl.NumberFormat('id-ID').format(item.subtotal)
    doc += formatTwoColumns('  ' + qtyPrice, subTotal, W) + FEED_LINE
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
    methodLabel[data.paymentMethod] || data.paymentMethod, W) + FEED_LINE
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
  doc += FEED_LINE + FEED_LINE + FEED_LINE
  doc += CUT

  return doc
}

export function receiptToIntentUrl(content: string): string {
  // Convert string to base64, then URI-encode it to ensure the custom scheme works in browsers.
  const base64 = btoa(unescape(encodeURIComponent(content)))
  return `rawbt:base64,${encodeURIComponent(base64)}`
}
