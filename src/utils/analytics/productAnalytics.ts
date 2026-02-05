//src/utils/analytics/productAnalytics.ts
import type { Transaction, Product } from '../../types';
import { safeParseDate, createProductMap, filterValidTransactions } from './helpers';

// ==================== TOP PRODUCTS (ALL TIME) ====================
export function getTopProducts(
  transactions: Transaction[], 
  products: Product[], 
  limit: number = 5
) {
  const productMap = createProductMap(products);
  const productSales = new Map<string, { 
    quantity: number; 
    revenue: number; 
    profit: number;
    product?: Product;
  }>();
  
  filterValidTransactions(transactions).forEach(transaction => {
    transaction.items.forEach(item => {
      const existing = productSales.get(item.productId);
      const quantity = item.quantity;
      const revenue = item.price * quantity;
      const profit = (item.price - item.cost) * quantity;
      
      if (existing) {
        existing.quantity += quantity;
        existing.revenue += revenue;
        existing.profit += profit;
      } else {
        productSales.set(item.productId, {
          quantity,
          revenue,
          profit,
          product: productMap.get(item.productId)
        });
      }
    });
  });
  
  return Array.from(productSales.values())
    .filter(item => item.product !== undefined)
    .map(item => ({
      product: item.product!,
      quantity: item.quantity,
      revenue: item.revenue,
      profit: item.profit
    }))
    .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
    .slice(0, limit);
}

// ==================== BEST SELLER BY PERIOD ====================
export function getBestSellersByPeriod(
  transactions: Transaction[], 
  products: Product[], 
  periodDays: number = 3,
  topN: number = 5,
  minSales: number = 1
): Array<{
  product: Product;
  quantity: number;
  revenue: number;
  periodDays: number;
  rank: number;
}> {
  const validTransactions = filterValidTransactions(transactions);
  
  if (validTransactions.length === 0 || products.length === 0) {
    return [];
  }
  
      const now = new Date();
        // Set ke 00:00:00 hari ini
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Jika period 1 = mulai hari ini jam 00:00
        // Jika period 3 = mulai 2 hari lalu jam 00:00 sampai sekarang
        const cutoffDate = new Date(startOfToday);
        cutoffDate.setDate(startOfToday.getDate() - (periodDays - 1));

        console.log(`Filtering from: ${cutoffDate.toLocaleString('id-ID')}`); // Pastikan muncul jam 00:00

        const recentTransactions = validTransactions.filter(t => {
          const transactionDate = safeParseDate(t.date);
          return transactionDate >= cutoffDate;
        });
        

  
  const productSales = new Map<string, {
    quantity: number;
    revenue: number;
    transactionCount: number;
    lastSold: Date;
  }>();
  
  recentTransactions.forEach(transaction => {
    transaction.items.forEach(item => {
      const existing = productSales.get(item.productId);
      const quantity = item.quantity;
      const revenue = item.price * quantity;
      const transactionDate = safeParseDate(transaction.date);
      
      if (existing) {
        existing.quantity += quantity;
        existing.revenue += revenue;
        existing.transactionCount += 1;
        if (transactionDate > existing.lastSold) {
          existing.lastSold = transactionDate;
        }
      } else {
        productSales.set(item.productId, {
          quantity,
          revenue,
          transactionCount: 1,
          lastSold: transactionDate
        });
      }
    });
  });
  
  const productMap = createProductMap(products);
  
  const bestSellers = Array.from(productSales.entries())
    .map(([productId, stats]) => {
      const product = productMap.get(productId);
      if (!product) {
        console.warn(`Product ${productId} not found in database`);
        return null;
      }
      
      return {
        productId,
        product,
        quantity: stats.quantity,
        revenue: stats.revenue,
        transactionCount: stats.transactionCount,
        lastSold: stats.lastSold
      };
    })
    .filter((item): item is NonNullable<typeof item> => 
      item !== null && item.quantity >= minSales
    )
    .sort((a, b) => {
      if (b.quantity !== a.quantity) return b.quantity - a.quantity;
      if (b.revenue !== a.revenue) return b.revenue - a.revenue;
      return b.lastSold.getTime() - a.lastSold.getTime();
    })
    .slice(0, topN)
    .map((item, index) => ({
      product: item.product,
      quantity: item.quantity,
      revenue: item.quantity,
      periodDays: periodDays,
      rank: index + 1
    }));
  
  return bestSellers;
}

// ==================== UPDATE PRODUCTS WITH BEST SELLER STATUS ====================
export function updateProductsWithBestSellerStatus(
  products: Product[],
  transactions: Transaction[],
  periodDays: number = 3,
  topN: number = 5,
  minSales: number = 1
): Product[] {
  const validTransactions = filterValidTransactions(transactions);
  
  if (validTransactions.length === 0 || products.length === 0) {
    return products.map(product => ({
      ...product,
      isBestSeller: false,
      recentSalesCount: 0,
      bestSellerRank: undefined,
      bestSellerPeriod: periodDays,
      bestSellerUpdatedAt: new Date().toISOString()
    }));
  }
  
  const bestSellers = getBestSellersByPeriod(validTransactions, products, periodDays, topN, minSales);
  const bestSellerIds = new Set(bestSellers.map(bs => bs.product.id));
  const bestSellerDataMap = new Map(bestSellers.map(bs => [bs.product.id, bs]));
  
  return products.map(product => {
    const shouldBeBestSeller = bestSellerIds.has(product.id);
    
    if (shouldBeBestSeller) {
      const data = bestSellerDataMap.get(product.id);
      if (!data) {
        return {
          ...product,
          isBestSeller: false,
          recentSalesCount: 0,
          bestSellerRank: undefined,
          bestSellerPeriod: periodDays,
          bestSellerUpdatedAt: new Date().toISOString()
        };
      }
      
      return {
        ...product,
        isBestSeller: true,
        recentSalesCount: data.quantity,
        bestSellerPeriod: periodDays,
        bestSellerRank: data.rank,
        bestSellerUpdatedAt: new Date().toISOString()
      };
    } else {
      return {
        ...product,
        isBestSeller: false,
        recentSalesCount: 0,
        bestSellerRank: undefined,
        bestSellerPeriod: periodDays,
        bestSellerUpdatedAt: new Date().toISOString()
      };
    }
  });
}

// ==================== TOP BEST SELLERS FOR BANNER ====================
export function getTopBestSellersForBanner(
  transactions: Transaction[],
  products: Product[],
  periodDays: number = 3
) {
  const bestSellers = getBestSellersByPeriod(transactions, products, periodDays, 3, 1);
  return bestSellers.map(bs => bs.product);

  
}

// ==================== UPDATE PRODUCT SALES FROM TRANSACTIONS ====================
export function updateProductSalesFromTransactions(
  products: Product[],
  transactions: Transaction[]
): Product[] {
  const validTransactions = filterValidTransactions(transactions);
  const productSales = new Map<string, {
    quantity: number;
    revenue: number;
    profit: number;
    lastSold: Date;
  }>();

  validTransactions.forEach(transaction => {
    transaction.items.forEach(item => {
      const existing = productSales.get(item.productId);
      const quantity = item.quantity;
      const revenue = item.price * quantity;
      const profit = (item.price - item.cost) * quantity;
      const transactionDate = safeParseDate(transaction.date);
      
      if (existing) {
        existing.quantity += quantity;
        existing.revenue += revenue;
        existing.profit += profit;
        if (transactionDate > existing.lastSold) {
          existing.lastSold = transactionDate;
        }
      } else {
        productSales.set(item.productId, {
          quantity,
          revenue,
          profit,
          lastSold: transactionDate
        });
      }
    });
  });

  return products.map(product => {
    const salesData = productSales.get(product.id);
    
    if (salesData) {
      return {
        ...product,
        salesCount: (product.salesCount || 0) + salesData.quantity,
        totalRevenue: (product.totalRevenue || 0) + salesData.revenue,
        totalProfit: (product.totalProfit || 0) + salesData.profit,
        lastSold: salesData.lastSold.toISOString(),
        recentSalesCount: calculateRecentSales(product.id, validTransactions, 3)
      };
    }
    
    return product;
  });
}

// Helper: Hitung penjualan recent
function calculateRecentSales(
  productId: string,
  transactions: Transaction[],
  days: number
): number {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return transactions
    .filter(t => safeParseDate(t.date) >= cutoffDate)
    .reduce((total, transaction) => {
      const item = transaction.items.find(i => i.productId === productId);
      return total + (item?.quantity || 0);
    }, 0);
}

// ==================== ROLLING WINDOW CALCULATOR ====================
interface DailySalesRecord {
  date: string;
  productSales: Map<string, number>;
  revenue: Map<string, number>;
}

export class RollingBestSellerCalculator {
  private dailyRecords: DailySalesRecord[] = [];
  private maxHistoryDays: number = 90;
  
  addDailySales(date: Date | string, transactions: Transaction[]): void {
    const dateStr = typeof date === 'string' ? date : safeParseDate(date).toISOString().split('T')[0];
    const validTransactions = filterValidTransactions(transactions);
    
    const existingIndex = this.dailyRecords.findIndex(record => record.date === dateStr);
    if (existingIndex >= 0) {
      this.updateDailyRecord(this.dailyRecords[existingIndex], validTransactions);
    } else {
      this.dailyRecords.push(this.createDailyRecord(dateStr, validTransactions));
    }
    
    this.dailyRecords.sort((a, b) => a.date.localeCompare(b.date));
    
    if (this.dailyRecords.length > this.maxHistoryDays) {
      this.dailyRecords = this.dailyRecords.slice(-this.maxHistoryDays);
    }
  }
  
  calculateRollingBestSellers(
    products: Product[],
    windowDays: number = 3,
    topN: number = 5
  ): Array<{
    product: Product;
    quantity: number;
    revenue: number;
    rank: number;
    windowDays: number;
  }> {
    if (this.dailyRecords.length < windowDays) {
      console.warn(`Not enough data. Need ${windowDays} days, have ${this.dailyRecords.length}`);
      return [];
    }
    
    const windowRecords = this.dailyRecords.slice(-windowDays);
    const windowSales = new Map<string, { quantity: number; revenue: number }>();
    
    windowRecords.forEach(record => {
      record.productSales.forEach((quantity, productId) => {
        const current = windowSales.get(productId) || { quantity: 0, revenue: 0 };
        const revenue = record.revenue.get(productId) || 0;
        
        windowSales.set(productId, {
          quantity: current.quantity + quantity,
          revenue: current.revenue + revenue
        });
      });
    });
    
    const sortedSales = Array.from(windowSales.entries())
      .sort((a, b) => b[1].quantity - a[1].quantity)
      .slice(0, topN);
    
    const productMap = createProductMap(products);
    
    const results = sortedSales
      .map(([productId, sales], index) => {
        const product = productMap.get(productId);
        
        if (!product) {
          console.warn(`Product ${productId} not found in rolling calculator`);
          return null;
        }
        
        const productWithBestSeller: Product = {
          ...product,
          isBestSeller: true,
          recentSalesCount: sales.quantity,
          bestSellerPeriod: windowDays,
          bestSellerRank: index + 1,
          bestSellerUpdatedAt: new Date().toISOString()
        };
        
        return {
          product: productWithBestSeller,
          quantity: sales.quantity,
          revenue: sales.revenue,
          rank: index + 1,
          windowDays
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
    
    return results;
  }
  
  getWindowInfo(windowDays: number = 3) {
    if (this.dailyRecords.length === 0) {
      return { startDate: null, endDate: null, daysInWindow: 0 };
    }
    
    const windowRecords = this.dailyRecords.slice(-windowDays);
    return {
      startDate: windowRecords[0]?.date || null,
      endDate: windowRecords[windowRecords.length - 1]?.date || null,
      daysInWindow: windowRecords.length,
      totalDaysStored: this.dailyRecords.length
    };
  }
  
  private createDailyRecord(dateStr: string, transactions: Transaction[]): DailySalesRecord {
    const productSales = new Map<string, number>();
    const revenue = new Map<string, number>();
    
    transactions.forEach(transaction => {
      transaction.items.forEach(item => {
        const currentQty = productSales.get(item.productId) || 0;
        productSales.set(item.productId, currentQty + item.quantity);
        
        const currentRev = revenue.get(item.productId) || 0;
        revenue.set(item.productId, currentRev + (item.price * item.quantity));
      });
    });
    
    return {
      date: dateStr,
      productSales,
      revenue
    };
  }
  
  private updateDailyRecord(record: DailySalesRecord, transactions: Transaction[]): void {
    transactions.forEach(transaction => {
      transaction.items.forEach(item => {
        const currentQty = record.productSales.get(item.productId) || 0;
        record.productSales.set(item.productId, currentQty + item.quantity);
        
        const currentRev = record.revenue.get(item.productId) || 0;
        record.revenue.set(item.productId, currentRev + (item.price * item.quantity));
      });
    });
  }
}

export const rollingCalculator = new RollingBestSellerCalculator();

export function initializeRollingCalculator(transactions: Transaction[]) {
  const validTransactions = filterValidTransactions(transactions);
  const transactionsByDay = new Map<string, Transaction[]>();
  
  validTransactions.forEach(transaction => {
    const date = safeParseDate(transaction.date);
    const dateStr = date.toISOString().split('T')[0];
    
    if (!transactionsByDay.has(dateStr)) {
      transactionsByDay.set(dateStr, []);
    }
    transactionsByDay.get(dateStr)!.push(transaction);
  });
  
  transactionsByDay.forEach((dayTransactions, date) => {
    rollingCalculator.addDailySales(date, dayTransactions);
  });
  
  return rollingCalculator;
}