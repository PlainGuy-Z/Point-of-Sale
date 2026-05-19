import type { Product } from '../types';

export function isStockTracked(product: Product): boolean {
  return product.stock !== -1;
}

export function isLowStock(product: Product): boolean {
  if (product.isAvailable === false) return false;
  if (!isStockTracked(product)) return false;
  return product.stock > 0 && product.stock <= (product.minStock || 10);
}

export function isOutOfStock(product: Product): boolean {
  if (product.isAvailable === false) return false;
  if (!isStockTracked(product)) return false;
  return product.stock <= 0;
}

export function getStockDisplay(product: Product): string {
  if (!isStockTracked(product)) return '∞';
  return product.stock.toString();
}

export type StockStatus = 'unavailable' | 'out_of_stock' | 'low_stock' | 'in_stock' | 'unlimited';

export function getStockStatus(product: Product): StockStatus {
  if (product.isAvailable === false) return 'unavailable';
  if (!isStockTracked(product)) return 'unlimited';
  if (isOutOfStock(product)) return 'out_of_stock';
  if (isLowStock(product)) return 'low_stock';
  return 'in_stock';
}
