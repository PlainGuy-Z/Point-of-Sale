// ==================== PRODUCT TYPES ====================

export interface Product {
  id: string;
  name: string;
  description?: string;
  category: 'Coffee' | 'Tea' | 'Pastry' | 'Food' | 'Merchandise' | string;
  price: number;
  cost?: number;
  stock: number;
  minStock: number;
  unit: string;
  image?: string | null;
  categoryId?: string;
  discount: number;

  // PROMO PROPERTIES
  isPromo?: boolean;
  promoPrice?: number;
  promoStart?: string;
  promoEnd?: string;
  promoLabel?: string;

  // AVAILABILITY
  isAvailable?: boolean;

  // BEST SELLER PROPERTIES
  isBestSeller?: boolean;
  salesCount?: number;
  recentSalesCount?: number;
  bestSellerPeriod?: number;
  bestSellerRank?: number;
  bestSellerUpdatedAt?: string;

  // ANALYTICS FIELDS
  totalRevenue?: number;
  totalProfit?: number;
  lastSold?: string;

  // WASTE TRACKING
  wasteCount?: number;
  wasteLoss?: number;
  profitMargin?: number;
}

// ==================== TRANSACTION TYPES ====================
export interface TransactionItem {
  name: string;
  productId: string;
  quantity: number;
  price: number;
  cost?: number;
  note?: string;
  modifiers?: string[];
  description?: string;
  image?: string;

  // CUSTOM VARIANTS
  variantName?: string;
  variantPrice?: number;

  // PROMO INFO
  isPromo?: boolean;
  originalPrice?: number;
  promoPrice?: number;
  promoLabel?: string;

  // BEST SELLER TRACKING
  fromBestSellerProduct?: boolean;
}

export interface Transaction {
  id: string;
  date: Date;
  items: TransactionItem[];
  total: number;
  cost: number;
  profit: number;
  paymentMethod: 'cash' | 'card' | 'qris';
  customerId?: string;

  // TRANSACTION META DATA
  customerName?: string;
  cashierName?: string;
  tableNumber?: string;
  notes?: string;
  cashReceived?: number;
  change?: number;
  taxRate?: number;
  subtotal?: number;
  tax?: number;
  service_charge?: number;
  orderType?: 'dine-in' | 'take-away';
  orderNote?: string;
}

// ==================== WASTE LOG TYPES ====================
export interface WasteLog {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  reason: 'expired' | 'damaged' | 'spilled' | 'other';
  date: Date;
  costLoss: number;
  notes?: string;
}

// ==================== INVENTORY TYPES ====================
export interface InventoryUsage {
  id: string;
  productId: string;
  date: Date;
  used: number;
  wasted: number;
  remaining: number;
  unitCost: number;
  totalCost: number;
}

// ==================== CUSTOMER TYPES ====================
export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  joinDate: Date;
  totalVisits: number;
  totalSpent: number;
  lastVisit?: Date;
  notes?: string;
  loyaltyPoints?: number;
}

// ==================== ANALYTICS TYPES ====================
export interface DailySummary {
  date: string;
  revenue: number;
  transactions: number;
  profit: number;
  avgTicket: number;
}

export interface CategorySales {
  category: string;
  revenue: number;
  transactions: number;
  profit: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
  profit: number;
}

// ==================== UTILITY TYPES ====================
export interface BusinessSettings {
  storeName: string;
  address: string;
  currency: string;
  timezone?: string;
  receiptFooter: string;
  currencyPosition: 'before' | 'after' | 'before-space' | 'after-space';
  decimalPlaces: 0 | 2;
  thousandsSeparator: 'comma' | 'dot' | 'space' | 'none';
  tax_enabled?: boolean;
  taxEnabled?: boolean;
  tax_rate?: number;
  taxRate?: number;
  tax_label?: string;
  taxLabel?: string;
  logo_url?: string;
  phone?: string;
  open_time?: string;
  close_time?: string;
}

// ==================== SERVICE TYPES ====================
export interface AppDataState {
  products: Product[];
  transactions: Transaction[];
  wasteLogs: WasteLog[];
  customers: Customer[];
  settings: BusinessSettings;
  categories: string[];
  categoriesWithId: { id: string; name: string }[];
}

export interface CheckoutParams {
  cart: CartItemWithInput[];
  paymentMethod: Transaction['paymentMethod'];
  selectedCustomer?: string;
  customCustomerName?: string;
  orderType: 'dine-in' | 'take-away';
  tableNumber?: string;
  cashReceived?: number;
  change?: number;
  orderNote?: string;
  notes?: string;
  applyTax?: boolean;
}

// ==================== CART ITEM EXTENSION ====================
export interface CartItemWithInput extends TransactionItem {
  tempInput?: string;
}

// ==================== AUTH TYPES ====================
export interface Shop {
  id: string;
  name: string;
  slug: string;
  address?: string;
  phone?: string;
  logo_url?: string;
  plan?: 'free' | 'pro';
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'cashier';
  shop_id: string;
  pin?: boolean;
  shop: Shop;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

// ==================== SHIFT TYPES ====================
export interface Shift {
  id: string;
  cashier_id: string;
  cashier_name: string;
  opened_at: string;
  closed_at: string | null;
  opening_cash: number;
  closing_cash: number | null;
  expected_cash: number | null;
  cash_difference: number | null;
  total_sales: number;
  total_transactions: number;
  notes: string | null;
  status: 'open' | 'closed';
  current_total_sales?: number;
  current_total_transactions?: number;
  current_expected_cash?: number;
}

// ==================== SETTINGS TYPES ====================
export interface ShopSettings {
  shop_name: string;
  shop_slug: string;
  phone: string;
  address: string;
  logo_url: string;
  open_time: string;
  close_time: string;

  tax_enabled: boolean;
  tax_rate: number;
  tax_label: string;
  tax_inclusive: boolean;

  service_charge_enabled: boolean;
  service_charge_rate: number;
  service_charge_label: string;

  receipt_footer: string;
  receipt_show_logo: boolean;
  receipt_paper_size: '58mm' | '80mm';
  receipt_auto_print: boolean;
  receipt_show_tax: boolean;

  print_method: 'browser' | 'rawbt' | 'network' | 'rawbt_intent';
  rawbt_ip: string;

  default_order_type: 'dine_in' | 'takeaway';
  require_customer_name: boolean;
  require_table_number: boolean;

  payment_cash: boolean;
  payment_qris: boolean;
  payment_transfer: boolean;

  low_stock_threshold: number;
  auto_disable_zero_stock: boolean;

  currency_format: 'Rp' | 'IDR';
  date_format: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  language: 'id' | 'en';
}
