// src/types/index.ts
export interface Product {
  image: any;
  id: string;
  name: string;
  category: 'Coffee' | 'Tea' | 'Pastry' | 'Food' | 'Merchandise';
  price: number;
  cost: number; // Harga modal
  stock: number;
  minStock: number;
  unit: string;
}

export interface Transaction {
  id: string;
  date: Date;
  items: TransactionItem[];
  total: number;
  cost: number; // Total modal
  profit: number; // Profit = total - cost
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
