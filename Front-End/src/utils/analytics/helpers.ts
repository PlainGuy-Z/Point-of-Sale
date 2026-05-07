//src/utils/analytics/helpers.ts

import type { Transaction } from '../../types';

/**
 * Safe date parser untuk menghindari "Invalid Date" errors
 */
export function safeParseDate(date: Date | string): Date {
  try {
    if (!date) return new Date();
    
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      console.warn('Invalid date detected:', date);
      return new Date();
    }
    return parsed;
  } catch (error) {
    console.error('Date parsing error:', error);
    return new Date();
  }
}

/**
 * Validasi transaction untuk analytics
 */
export function isValidTransaction(t: any): t is Transaction {
  try {
    return (
      t &&
      typeof t.id === 'string' &&
      (t.date instanceof Date || typeof t.date === 'string') &&
      Array.isArray(t.items) &&
      typeof t.total === 'number'
    );
  } catch {
    return false;
  }
}

/**
 * Filter dan normalisasi transactions
 */
export function filterValidTransactions(transactions: any[]): Transaction[] {
  return transactions
    .map(t => ({
      ...t,
      date: safeParseDate(t.date)
    }))
    .filter(isValidTransaction);
}

/**
 * Helper untuk membuat product map
 */
export function createProductMap(products: any[]): Map<string, any> {
  return new Map(products.map(p => [p.id, p]));
}

/**
 * Format currency untuk recommendations
 */
export function formatCurrency(value: number): string {
  return `Rp ${value.toLocaleString('id-ID')}`;
}