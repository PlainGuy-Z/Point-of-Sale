import type { Product, Transaction, Customer, WasteLog } from '../types';

// Comprehensive validation functions
export function validateProduct(product: any): product is Product {
  return (
    product &&
    typeof product.id === 'string' &&
    typeof product.name === 'string' &&
    typeof product.price === 'number' &&
    product.price >= 0 &&
    typeof product.cost === 'number' &&
    product.cost >= 0 &&
    typeof product.stock === 'number' &&
    product.stock >= 0 &&
    typeof product.minStock === 'number' &&
    product.minStock >= 0 &&
    typeof product.category === 'string' &&
    typeof product.unit === 'string'
  );
}

export function validateTransaction(transaction: any): transaction is Transaction {
  try {
    return (
      transaction &&
      typeof transaction.id === 'string' &&
      (transaction.date instanceof Date || typeof transaction.date === 'string') &&
      Array.isArray(transaction.items) &&
      transaction.items.length > 0 &&
      typeof transaction.total === 'number' &&
      transaction.total >= 0 &&
      typeof transaction.cost === 'number' &&
      transaction.cost >= 0 &&
      typeof transaction.profit === 'number' &&
      ['cash', 'card', 'qris'].includes(transaction.paymentMethod)
    );
  } catch {
    return false;
  }
}

export function validateCustomer(customer: any): customer is Customer {
  return (
    customer &&
    typeof customer.id === 'string' &&
    typeof customer.name === 'string' &&
    (customer.joinDate instanceof Date || typeof customer.joinDate === 'string') &&
    typeof customer.totalVisits === 'number' &&
    customer.totalVisits >= 0 &&
    typeof customer.totalSpent === 'number' &&
    customer.totalSpent >= 0
  );
}

// Schema migration helper
export function migrateSchema(data: any, fromVersion: string, toVersion: string): any {
  if (fromVersion === '0.9' && toVersion === '1.0') {
    // Contoh migrasi dari v0.9 ke v1.0
    return {
      ...data,
      version: '1.0',
      products: (data.products || []).map((p: any) => ({
        ...p,
        // Add new fields dengan default values
        isPromo: p.isPromo || false,
        isBestSeller: p.isBestSeller || false,
        recentSalesCount: p.recentSalesCount || 0,
        bestSellerRank: p.bestSellerRank || undefined
      }))
    };
  }
  
  return data;
}

// Storage quota checker
export async function checkStorageQuota(): Promise<{
  canSave: boolean;
  used: number;
  quota: number;
  percentage: number;
}> {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || 10 * 1024 * 1024; // 10MB default
      const percentage = (used / quota) * 100;
      
      return {
        canSave: percentage < 90, // Warning di 90%
        used,
        quota,
        percentage
      };
    }
    
    // Fallback
    return {
      canSave: true,
      used: 0,
      quota: 10 * 1024 * 1024,
      percentage: 0
    };
  } catch {
    return {
      canSave: true,
      used: 0,
      quota: 10 * 1024 * 1024,
      percentage: 0
    };
  }
}