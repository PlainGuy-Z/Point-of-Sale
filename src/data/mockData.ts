// src/data/mockData.ts
import type { Product, Customer, DailySummary, Transaction } from '../types';

export const products: Product[] = [
  { 
    id: '1', 
    name: 'Cappuccino', 
    category: 'Coffee', 
    price: 35000, 
    cost: 12000, 
    stock: 50, 
    minStock: 10, 
    unit: 'cup',
    salesCount: 120,
    totalRevenue: 4200000,
    totalProfit: 2760000,
    lastSold: '2024-03-20T10:30:00.000Z'
  },
  { 
    id: '2', 
    name: 'Latte', 
    category: 'Coffee', 
    price: 32000, 
    cost: 11000, 
    stock: 45, 
    minStock: 10, 
    unit: 'cup',
    salesCount: 95,
    totalRevenue: 3040000,
    totalProfit: 1995000,
    lastSold: '2024-03-20T14:15:00.000Z'
  },
  { 
    id: '3', 
    name: 'Americano', 
    category: 'Coffee', 
    price: 25000, 
    cost: 8000, 
    stock: 60, 
    minStock: 10, 
    unit: 'cup',
    salesCount: 150,
    totalRevenue: 3750000,
    totalProfit: 2550000,
    lastSold: '2024-03-20T08:45:00.000Z'
  },
  { 
    id: '4', 
    name: 'Espresso', 
    category: 'Coffee', 
    price: 20000, 
    cost: 7000, 
    stock: 40, 
    minStock: 5, 
    unit: 'cup',
    salesCount: 80,
    totalRevenue: 1600000,
    totalProfit: 1040000,
    lastSold: '2024-03-19T16:20:00.000Z'
  },
  { 
    id: '5', 
    name: 'Croissant', 
    category: 'Pastry', 
    price: 25000, 
    cost: 8000, 
    stock: 30, 
    minStock: 5, 
    unit: 'pcs',
    salesCount: 65,
    totalRevenue: 1625000,
    totalProfit: 1105000,
    lastSold: '2024-03-20T09:30:00.000Z'
  },
  { 
    id: '6', 
    name: 'Sandwich', 
    category: 'Food', 
    price: 45000, 
    cost: 18000, 
    stock: 25, 
    minStock: 5, 
    unit: 'pcs',
    salesCount: 40,
    totalRevenue: 1800000,
    totalProfit: 1080000,
    lastSold: '2024-03-20T12:45:00.000Z'
  },
  { 
    id: '7', 
    name: 'Green Tea', 
    category: 'Tea', 
    price: 20000, 
    cost: 6000, 
    stock: 35, 
    minStock: 10, 
    unit: 'cup',
    salesCount: 55,
    totalRevenue: 1100000,
    totalProfit: 770000,
    lastSold: '2024-03-19T15:30:00.000Z'
  },
  { 
    id: '8', 
    name: 'T-Shirt', 
    category: 'Merchandise', 
    price: 150000, 
    cost: 60000, 
    stock: 15, 
    minStock: 3, 
    unit: 'pcs',
    salesCount: 8,
    totalRevenue: 1200000,
    totalProfit: 720000,
    lastSold: '2024-03-18T11:20:00.000Z'
  }
];

export const customers: Customer[] = [
  { 
    id: 'C001', 
    name: 'Budi Santoso', 
    phone: '081234567890', 
    totalVisits: 12, 
    totalSpent: 450000, 
    joinDate: new Date('2024-01-15'), 
    lastVisit: new Date('2024-03-20'),
    loyaltyPoints: 450
  },
  { 
    id: 'C002', 
    name: 'Sari Dewi', 
    phone: '081298765432', 
    totalVisits: 8, 
    totalSpent: 320000, 
    joinDate: new Date('2024-02-10'), 
    lastVisit: new Date('2024-03-18'),
    loyaltyPoints: 320
  },
  { 
    id: 'C003', 
    name: 'Ahmad Fauzi', 
    phone: '081355566677', 
    totalVisits: 5, 
    totalSpent: 180000, 
    joinDate: new Date('2024-03-01'), 
    lastVisit: new Date('2024-03-20'),
    loyaltyPoints: 180
  }
];

export const dailySummaries: DailySummary[] = [
  { date: '2024-03-18', revenue: 1250000, transactions: 42, profit: 650000, avgTicket: 29761 },
  { date: '2024-03-19', revenue: 1180000, transactions: 38, profit: 620000, avgTicket: 31052 },
  { date: '2024-03-20', revenue: 1420000, transactions: 48, profit: 750000, avgTicket: 29583 },
];

// DATA TRANSAKSI UNTUK GRAFIK
export const mockTransactions: Transaction[] = [
  {
    id: 'T001',
    date: new Date('2024-03-20T08:30:00'),
    items: [
      { productId: '3', quantity: 2, price: 25000, cost: 8000 }, // Americano
      { productId: '5', quantity: 1, price: 25000, cost: 8000 }, // Croissant
    ],
    total: 75000,
    cost: 24000,
    profit: 51000,
    paymentMethod: 'cash',
    customerId: 'C003'
  },
  {
    id: 'T002',
    date: new Date('2024-03-20T10:15:00'),
    items: [
      { productId: '1', quantity: 1, price: 35000, cost: 12000 }, // Cappuccino
      { productId: '5', quantity: 2, price: 25000, cost: 8000 }, // Croissant
    ],
    total: 85000,
    cost: 28000,
    profit: 57000,
    paymentMethod: 'qris'
  },
  {
    id: 'T003',
    date: new Date('2024-03-20T12:45:00'),
    items: [
      { productId: '6', quantity: 1, price: 45000, cost: 18000 }, // Sandwich
      { productId: '2', quantity: 1, price: 32000, cost: 11000 }, // Latte
    ],
    total: 77000,
    cost: 29000,
    profit: 48000,
    paymentMethod: 'card',
    customerId: 'C001'
  },
  {
    id: 'T004',
    date: new Date('2024-03-19T09:20:00'),
    items: [
      { productId: '2', quantity: 1, price: 32000, cost: 11000 }, // Latte
      { productId: '4', quantity: 1, price: 20000, cost: 7000 }, // Espresso
    ],
    total: 52000,
    cost: 18000,
    profit: 34000,
    paymentMethod: 'cash'
  },
  {
    id: 'T005',
    date: new Date('2024-03-19T14:30:00'),
    items: [
      { productId: '1', quantity: 2, price: 35000, cost: 12000 }, // Cappuccino
    ],
    total: 70000,
    cost: 24000,
    profit: 46000,
    paymentMethod: 'qris',
    customerId: 'C002'
  },
  {
    id: 'T006',
    date: new Date('2024-03-18T11:20:00'),
    items: [
      { productId: '8', quantity: 1, price: 150000, cost: 60000 }, // T-Shirt
      { productId: '1', quantity: 1, price: 35000, cost: 12000 }, // Cappuccino
    ],
    total: 185000,
    cost: 72000,
    profit: 113000,
    paymentMethod: 'card',
    customerId: 'C001'
  },
  {
    id: 'T007',
    date: new Date('2024-03-18T16:45:00'),
    items: [
      { productId: '3', quantity: 1, price: 25000, cost: 8000 }, // Americano
      { productId: '7', quantity: 1, price: 20000, cost: 6000 }, // Green Tea
    ],
    total: 45000,
    cost: 14000,
    profit: 31000,
    paymentMethod: 'cash'
  }
];