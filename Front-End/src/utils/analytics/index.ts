//src/utils/analytics/index.ts

// Product Analytics
export { 
  getTopProducts,
  getBestSellersByPeriod,
  updateProductsWithBestSellerStatus,
  getTopBestSellersForBanner,
  updateProductSalesFromTransactions,
  RollingBestSellerCalculator,
  rollingCalculator,
  initializeRollingCalculator
} from './productAnalytics';

// Inventory Analytics
export {
  analyzeWasteTrends,
  getBusinessHealth
} from './inventoryAnalytics';

// Customer Analytics
export {
  analyzeCustomerBehavior,
  getHourlySalesPattern
} from './customerAnalytics';

// Sales Analytics
export {
  exportAnalyticsMetrics
} from './salesAnalytics';

// Helpers
export {
  safeParseDate,
  isValidTransaction,
  filterValidTransactions,
  createProductMap
} from './helpers';