// src/types/index.ts
export interface Product {
  image: any;
  id: string;
  name: string;
  category: 'Coffee' | 'Tea' | 'Pastry' | 'Food' | 'Merchandise' | string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  unit: string;
  
  // PROPERTI PROMO
  isPromo?: boolean;
  promoPrice?: number;
  promoStart?: string; // TETAP sebagai string
  promoEnd?: string;   // TETAP sebagai string
  promoLabel?: string;

  // PROPERTI BEST SELLER
  isBestSeller?: boolean;
  salesCount?: number; // Jumlah penjualan
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
}

export interface TransactionItem {
  productId: string;
  quantity: number;
  price: number;
  cost: number;
  note?: string;
  modifiers?: string[];
  
  // TAMBAHKAN UNTUK MENYIMPAN INFO PROMO
  isPromo?: boolean;
  originalPrice?: number;
  promoPrice?: number;
  promoLabel?: string;

  fromBestSellerProduct?: boolean; // Jika perlu tracking di laporan
  // **HAPUS properti best seller dari sini**
  // Best seller info sudah ada di Product, tidak perlu duplicate
  // Hanya menyimpan apakah item ini dari produk best seller atau tidak
  // Tapi tidak perlu salesCount karena itu adalah properti produk, bukan transaksi individual
}

export interface WasteLog {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  reason: 'expired' | 'damaged' | 'spilled' | 'other';
  date: Date;
  costLoss: number;
}

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

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  joinDate: Date;
  totalVisits: number;
  totalSpent: number;
  lastVisit?: Date;
}

export interface DailySummary {
  date: string;
  revenue: number;
  transactions: number;
  profit: number;
  avgTicket: number;
}