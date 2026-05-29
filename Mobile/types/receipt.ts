export interface PrintReceiptItem {
  name: string
  quantity: number
  price: number
  subtotal: number
  description?: string
  variantName?: string
  variantPrice?: number
  notes?: string
}

export interface PrintReceiptData {
  // Store info
  shopName: string
  shopAddress?: string
  shopPhone?: string
  
  // Transaction info
  transactionId: string
  createdAt: Date | string
  cashierName?: string
  orderType?: 'dine_in' | 'takeaway'
  tableNumber?: string
  customerName?: string
  notes?: string
  
  // Items
  items: PrintReceiptItem[]
  
  // Totals
  subtotal: number
  tax: number
  taxRate: number
  serviceCharge?: number
  grandTotal: number
  
  // Payment
  paymentMethod: string
  amountPaid?: number
  change?: number
  
  // Config
  receiptFooter?: string
  paperSize: '58mm' | '80mm'
}
