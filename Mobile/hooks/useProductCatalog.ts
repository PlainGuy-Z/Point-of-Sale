/**
 * useProductCatalog — product filtering, sorting, and analytics for POS.
 * Ported from Front-End/src/hooks/useProductCatalog.ts
 */
import { useMemo } from 'react';
import type { Product, Transaction } from '../types';
import {
  updateProductsWithBestSellerStatus,
  getTopBestSellersForBanner,
} from '../utils/analytics/productAnalytics';
import { getEffectivePrice } from '../utils/priceUtils';
import { isLowStock, isOutOfStock } from '../utils/stockUtils';

export interface UseProductCatalogResult {
  sortedProducts: Product[];
  topBestSellers: Product[];
  promoProductsCount: number;
  bestSellerCount: number;
  filteredProducts: Product[];
}

export function useProductCatalog(
  products: Product[],
  transactions: Transaction[],
  search: string,
  selectedCategory: string,
  bestSellerPeriod: number = 3
): UseProductCatalogResult {
  return useMemo(() => {
    // 1. Update products with best seller status
    const productsWithBestSeller = updateProductsWithBestSellerStatus(
      products,
      transactions,
      bestSellerPeriod,
      3,
      1
    );

    // 2. Filter products by search & category
    const filteredProducts = productsWithBestSeller.filter(product => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesCategory =
        selectedCategory === 'All' ||
        selectedCategory === 'Semua' ||
        product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // 3. Sort products with priorities
    const sortedProducts = sortProductsByPriority(filteredProducts);

    // 4. Get top best sellers for banner
    const topBestSellers = getTopBestSellersForBanner(
      transactions,
      products,
      bestSellerPeriod
    );

    // 5. Count promo and best seller products
    const promoProductsCount = sortedProducts.filter(
      p => getEffectivePrice(p).isPromoActive
    ).length;

    const bestSellerCount = sortedProducts.filter(p => p.isBestSeller).length;

    return {
      sortedProducts,
      topBestSellers,
      promoProductsCount,
      bestSellerCount,
      filteredProducts,
    };
  }, [products, transactions, search, selectedCategory, bestSellerPeriod]);
}

// ─── Sort helper ────────────────────────────────────────────────────────────────

function sortProductsByPriority(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    // Priority 1: Promo products (higher discount first)
    const aIsPromo = a.isPromo && a.promoPrice && a.promoPrice > 0;
    const bIsPromo = b.isPromo && b.promoPrice && b.promoPrice > 0;

    if (aIsPromo && !bIsPromo) return -1;
    if (!aIsPromo && bIsPromo) return 1;

    if (aIsPromo && bIsPromo) {
      const aDiscount = ((a.price - a.promoPrice!) / a.price) * 100;
      const bDiscount = ((b.price - b.promoPrice!) / b.price) * 100;
      if (bDiscount !== aDiscount) return bDiscount - aDiscount;
    }

    // Priority 2: Best seller products (lower rank = higher priority)
    const aIsBestSeller = a.isBestSeller;
    const bIsBestSeller = b.isBestSeller;

    if (aIsBestSeller && !bIsBestSeller) return -1;
    if (!aIsBestSeller && bIsBestSeller) return 1;

    if (aIsBestSeller && bIsBestSeller) {
      const aRank = a.bestSellerRank || 999;
      const bRank = b.bestSellerRank || 999;
      return aRank - bRank;
    }

    // Priority 3: By recent sales count (higher first)
    const aSales = a.recentSalesCount || 0;
    const bSales = b.recentSalesCount || 0;
    if (bSales !== aSales) return bSales - aSales;

    // Priority 4: Low stock warning
    const aLow = isLowStock(a);
    const bLow = isLowStock(b);
    if (aLow && !bLow) return -1;
    if (!aLow && bLow) return 1;

    // Priority 5: Out of stock at bottom
    const aOut = isOutOfStock(a);
    const bOut = isOutOfStock(b);
    if (aOut && !bOut) return 1;
    if (!aOut && bOut) return -1;

    // Priority 6: Alphabetical
    return a.name.localeCompare(b.name);
  });
}
