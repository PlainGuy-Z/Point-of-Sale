/**
 * useCategoryCarousels — groups products by category for portrait carousel display.
 * Ported from the inline useCategoryCarousels in Front-End POS.
 */
import { useMemo } from 'react';
import type { Product, Transaction } from '../types';
import { getRecentSalesMapByPeriod } from '../utils/analytics/productAnalytics';

export interface CategoryCarousel {
  categoryName: string;
  totalSales: number;
  products: Product[];
}

export function useCategoryCarousels(
  products: Product[],
  transactions: Transaction[],
  periodDays: number,
  searchTerm: string = ''
): CategoryCarousel[] {
  // 1. Heavy computation: Analytics (Only recalculate if transactions change)
  const salesMap = useMemo(() => {
    return getRecentSalesMapByPeriod(transactions, periodDays);
  }, [transactions, periodDays]);

  // 2. Fast computation: UI Filtering & Grouping
  return useMemo(() => {
    const searchLower = searchTerm.toLowerCase().trim();

    const availableProducts = products
      .filter(product => {
        const isAvailable = product.isAvailable !== false && product.stock !== 0;
        if (!isAvailable) return false;
        if (!searchLower) return true;
        return (
          product.name.toLowerCase().includes(searchLower) ||
          product.category?.toLowerCase().includes(searchLower)
        );
      })
      .map(product => ({
        ...product,
        recentSalesCount: salesMap.get(product.id) || 0,
      }));

    // Group by category
    const grouped = new Map<string, { products: Product[]; totalSales: number }>();

    for (const product of availableProducts) {
      const categoryName = product.category || 'Lainnya';
      const productSales = product.recentSalesCount || 0;
      const entry = grouped.get(categoryName) || { products: [], totalSales: 0 };
      entry.products.push(product);
      entry.totalSales += productSales;
      grouped.set(categoryName, entry);
    }

    // Build category list with sorted products
    const categories = Array.from(grouped.entries()).map(
      ([categoryName, bucket]) => ({
        categoryName,
        totalSales: bucket.totalSales,
        products: bucket.products
          .slice()
          .sort((a, b) => {
            // Promo first
            const aPromo = a.isPromo && a.promoPrice ? 1 : 0;
            const bPromo = b.isPromo && b.promoPrice ? 1 : 0;
            if (bPromo !== aPromo) return bPromo - aPromo;
            // Then by sales
            const delta =
              (b.recentSalesCount || 0) - (a.recentSalesCount || 0);
            return delta !== 0 ? delta : a.name.localeCompare(b.name);
          })
          .slice(0, 10),
      })
    );

    // Top 10 overall (for "Semua" category)
    const top10Overall = [...availableProducts]
      .sort((a, b) => {
        const aPromo = a.isPromo && a.promoPrice ? 1 : 0;
        const bPromo = b.isPromo && b.promoPrice ? 1 : 0;
        if (bPromo !== aPromo) return bPromo - aPromo;
        const delta = (b.recentSalesCount || 0) - (a.recentSalesCount || 0);
        return delta !== 0 ? delta : a.name.localeCompare(b.name);
      })
      .slice(0, 10);

    // Sort categories by total sales (descending)
    const sortedCategories = categories.sort(
      (a, b) => b.totalSales - a.totalSales
    );

    return [
      {
        categoryName: 'Semua',
        totalSales: Number.POSITIVE_INFINITY,
        products: top10Overall,
      },
      ...sortedCategories,
    ];
  }, [products, salesMap, searchTerm]);
}
