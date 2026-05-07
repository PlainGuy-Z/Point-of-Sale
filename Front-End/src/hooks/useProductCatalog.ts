import { useMemo } from 'react';
import type { Product, Transaction } from '../types';
import { 
  updateProductsWithBestSellerStatus, 
  getTopBestSellersForBanner 
} from '../utils/analytics';

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
      5,
      1
    );
    
    // 2. Filter products by search & category
    const filteredProducts = productsWithBestSeller.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    
    // 3. Sort products with priorities
    const sortedProducts = sortProductsByPriority(filteredProducts);
    
    // 4. Get top best sellers for banner
    const topBestSellers = getTopBestSellersForBanner(transactions, products, bestSellerPeriod);
    
    // 5. Count promo and best seller products
    const promoProductsCount = sortedProducts.filter(p => 
      p.isPromo && p.promoPrice && p.promoPrice > 0
    ).length;
    
    const bestSellerCount = sortedProducts.filter(p => p.isBestSeller).length;
    
    return {
      sortedProducts,
      topBestSellers,
      promoProductsCount,
      bestSellerCount,
      filteredProducts
    };
  }, [products, transactions, search, selectedCategory, bestSellerPeriod]);
}

// Helper function untuk sorting products
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
    
    // Priority 3: Low stock warning
    const aLowStock = a.stock <= a.minStock;
    const bLowStock = b.stock <= b.minStock;
    
    if (aLowStock && !bLowStock) return -1;
    if (!aLowStock && bLowStock) return 1;
    
    // Priority 4: Out of stock (hide at bottom)
    const aOutOfStock = a.stock === 0;
    const bOutOfStock = b.stock === 0;
    
    if (aOutOfStock && !bOutOfStock) return 1;
    if (!aOutOfStock && bOutOfStock) return -1;
    
    // Priority 5: Alphabetical
    return a.name.localeCompare(b.name);
  });
}