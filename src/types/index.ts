// src/types/index.ts
// ==================== PRODUCT TYPES ====================

export interface Product {
  id: string;
  name: string;
  description?: string;
  category: 'Coffee' | 'Tea' | 'Pastry' | 'Food' | 'Merchandise' | string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  unit: string;
  image?: string | null;
  
  // PROMO PROPERTIES
  isPromo?: boolean;
  promoPrice?: number;
  promoStart?: string;
  promoEnd?: string;
  promoLabel?: string;

  // BEST SELLER PROPERTIES
  isBestSeller?: boolean;
  salesCount?: number;
  recentSalesCount?: number;
  bestSellerPeriod?: number;
  bestSellerRank?: number;
  bestSellerUpdatedAt?: string;


    // FIELDS BARU UNTUK ANALYTICS
  totalRevenue?: number; // Total revenue dari produk ini
  totalProfit?: number; // Total profit dari produk ini
  lastSold?: string; // Terakhir terjual kapan

    // ✅ TAMBAHKAN PROPERTI INI:
  wasteCount?: number; // Untuk tracking waste
  wasteLoss?: number;  // Total kerugian dari waste
  profitMargin?: number; // Margin keuntungan
}

// ==================== TRANSACTION TYPES ====================
export interface TransactionItem {
  productId: string;
  quantity: number;
  price: number;
  cost: number;
  note?: string;
  modifiers?: string[];
  
  // PROMO INFO (optional - untuk tracking di receipt)
  isPromo?: boolean;
  originalPrice?: number;
  promoPrice?: number;
  promoLabel?: string;

  // BEST SELLER TRACKING (optional)
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
  tableNumber?: string;
  cashReceived?: number;
  change?: number;
  taxRate?: number;
  orderType?: 'dine-in' | 'take-away';
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
  taxRate: number;
  currency: string;
  timezone?: string;
  receiptFooter: string;
  currencyPosition: 'before' | 'after' | 'before-space' | 'after-space';
  decimalPlaces: 0 | 2;
  thousandsSeparator: 'comma' | 'dot' | 'space' | 'none';
}

// ==================== CART ITEM EXTENSION ====================
export interface CartItemWithInput extends TransactionItem {
  tempInput?: string;
}


// ==================== COMPONENT TYPES ====================
import type { LucideIcon } from 'lucide-react';

export type TrendType = 'up' | 'down' | 'stable';

// Tambah tipe untuk Lucide Icon jika perlu
export type IconType = LucideIcon;