// src/data/mockData.ts
export const products: Product[] = [
  { id: '1', name: 'Cappuccino', category: 'Coffee', price: 35000, cost: 12000, stock: 50, minStock: 10, unit: 'cup' },
  { id: '2', name: 'Latte', category: 'Coffee', price: 32000, cost: 11000, stock: 45, minStock: 10, unit: 'cup' },
  { id: '3', name: 'Americano', category: 'Coffee', price: 25000, cost: 8000, stock: 60, minStock: 10, unit: 'cup' },
  { id: '4', name: 'Espresso', category: 'Coffee', price: 20000, cost: 7000, stock: 40, minStock: 5, unit: 'cup' },
  { id: '5', name: 'Croissant', category: 'Pastry', price: 25000, cost: 8000, stock: 30, minStock: 5, unit: 'pcs' },
  { id: '6', name: 'Sandwich', category: 'Food', price: 45000, cost: 18000, stock: 25, minStock: 5, unit: 'pcs' },
  { id: '6', name: 'Sandwich', category: 'Food', price: 45000, cost: 18000, stock: 25, minStock: 5, unit: 'pcs' },
  { id: '6', name: 'Sandwich', category: 'Food', price: 45000, cost: 18000, stock: 25, minStock: 5, unit: 'pcs' },
];

export const customers: Customer[] = [
  { id: 'C001', name: 'Budi Santoso', phone: '081234567890', totalVisits: 12, totalSpent: 450000, joinDate: new Date('2024-01-15'), lastVisit: new Date('2024-03-20') },
  { id: 'C002', name: 'Sari Dewi', phone: '081298765432', totalVisits: 8, totalSpent: 320000, joinDate: new Date('2024-02-10'), lastVisit: new Date('2024-03-18') },
];

export const dailySummaries: DailySummary[] = [
  { date: '2024-03-18', revenue: 1250000, transactions: 42, profit: 650000, avgTicket: 29761 },
  { date: '2024-03-19', revenue: 1180000, transactions: 38, profit: 620000, avgTicket: 31052 },
  { date: '2024-03-20', revenue: 1420000, transactions: 48, profit: 750000, avgTicket: 29583 },
];