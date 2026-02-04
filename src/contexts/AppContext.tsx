import React, { createContext, useContext, useState, useReducer, useEffect, useCallback, useRef } from 'react';
import type { Product, Transaction, WasteLog, Customer, BusinessSettings } from '../types';
import { products as initialProducts, customers as initialCustomers, mockTransactions } from '../data/mockData';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

// Define state interface
interface AppState {
  products: Product[];
  transactions: Transaction[];
  wasteLogs: WasteLog[];
  customers: Customer[];
  settings: BusinessSettings;
  categories: string[];
}

// Define action types - FIXED: CLEAR_OLD_DATA tidak punya payload
type AppAction =
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'ADD_WASTE_LOG'; payload: WasteLog }
  | { type: 'ADD_CUSTOMER'; payload: Customer }
  | { type: 'UPDATE_CUSTOMER'; payload: Customer }
  | { type: 'DELETE_CUSTOMER'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: BusinessSettings }
  | { type: 'ADD_CATEGORY'; payload: string }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'CLEAR_OLD_DATA' } // ⚠️ ACTION TANPA PAYLOAD - FIXED
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'SET_CUSTOMERS'; payload: Customer[] }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'SET_WASTE_LOGS'; payload: WasteLog[] }
  | { type: 'SET_CATEGORIES'; payload: string[] }
  | { type: 'RESET_ALL_DATA' }
  | { type: 'RESTORE_BACKUP'; payload: Partial<AppState> };
  

interface AppContextType extends AppState {
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  addTransaction: (transaction: Transaction) => void;
  addWasteLog: (waste: WasteLog) => void;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;
  updateSettings: (settings: BusinessSettings) => void;
  addCategory: (name: string) => void;
  deleteCategory: (name: string) => void;
  clearOldData: () => void;
  getStorageInfo: () => { used: number; total: number; percent: number };
  createBackup: () => boolean;
  restoreBackup: (file: File) => Promise<{ success: boolean; message: string; stats?: any }>;
  resetAllData: () => Promise<boolean>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEYS = {
  PRODUCTS: 'coffee_pos_products',
  CUSTOMERS: 'coffee_pos_customers',
  SETTINGS: 'coffee_pos_settings',
  CATEGORIES: 'coffee_pos_categories',
  TRANSACTIONS: 'coffee_pos_transactions',
  WASTE_LOGS: 'coffee_pos_waste_logs',
} as const;

const STORAGE_LIMITS = {
  MAX_IMAGE_SIZE_KB: 300,
  MAX_TRANSACTIONS: 1000,
  MAX_WASTE_LOGS: 300,
  DEBOUNCE_SAVE_MS: 500,
  HIGH_PRIORITY_DEBOUNCE_MS: 200,
  MAX_TRANSACTION_ITEMS: 50,
} as const;

const STORAGE_CACHE_TTL = 5000;

// ============================================================================
// REDUCER - FIXED: Logging hanya untuk actions dengan payload
// ============================================================================

function appReducer(state: AppState, action: AppAction): AppState {
  // Safe logging - hanya log payload jika ada
  if ('payload' in action) {
    console.log('Reducer:', action.type, action.payload);
  } else {
    console.log('Reducer:', action.type);
  }
  
  switch (action.type) {
    case 'ADD_PRODUCT': {
      const product = action.payload;
      // Check if product already exists
      if (state.products.some(p => p.id === product.id)) {
        throw new Error(`Produk dengan ID ${product.id} sudah ada`);
      }
      return {
        ...state,
        products: [...state.products, product]
      };
    }
    
    case 'UPDATE_PRODUCT': {
      const updatedProduct = action.payload;
      const productExists = state.products.some(p => p.id === updatedProduct.id);
      if (!productExists) {
        throw new Error(`Produk dengan ID ${updatedProduct.id} tidak ditemukan`);
      }
      return {
        ...state,
        products: state.products.map(p => 
          p.id === updatedProduct.id ? updatedProduct : p
        )
      };
    }
    
    case 'DELETE_PRODUCT': {
      const id = action.payload;
      // Check if product exists in transactions
      const hasTransactions = state.transactions.some(t => 
        t.items.some(item => item.productId === id)
      );
      if (hasTransactions) {
        throw new Error('Produk tidak dapat dihapus karena terdapat dalam transaksi');
      }
      return {
        ...state,
        products: state.products.filter(p => p.id !== id)
      };
    }
    
    case 'ADD_TRANSACTION': {
      const transaction = action.payload;
      
      // Validasi jumlah item
      if (transaction.items.length === 0) {
        throw new Error('Transaksi harus memiliki minimal 1 item');
      }
      
      if (transaction.items.length > STORAGE_LIMITS.MAX_TRANSACTION_ITEMS) {
        throw new Error(`Maksimal ${STORAGE_LIMITS.MAX_TRANSACTION_ITEMS} item per transaksi`);
      }
      
      const stockIssues: string[] = [];
      const productsToUpdate: Map<string, number> = new Map();
      
      // Validasi stock dengan state terkini
      transaction.items.forEach(item => {
        const product = state.products.find(p => p.id === item.productId);
        if (!product) {
          stockIssues.push(`Produk "${item.productId}" tidak ditemukan`);
        } else if (product.stock < item.quantity) {
          stockIssues.push(
            `Stock "${product.name}" tidak cukup (tersedia: ${product.stock}, dibutuhkan: ${item.quantity})`
          );
        } else {
          productsToUpdate.set(product.id, item.quantity);
        }
      });
      
      if (stockIssues.length > 0) {
        throw new Error(`Transaksi gagal:\n${stockIssues.join('\n')}`);
      }
      
      // Update products
      const updatedProducts = state.products.map(product => {
        const qtyToDeduct = productsToUpdate.get(product.id);
        if (qtyToDeduct !== undefined) {
          return {
            ...product,
            stock: product.stock - qtyToDeduct,
            lastSold: new Date().toISOString(),
            salesCount: (product.salesCount || 0) + qtyToDeduct,
            totalRevenue: (product.totalRevenue || 0) + (product.price * qtyToDeduct)
          };
        }
        return product;
      });
      
      // Update transactions dengan limit
      const newTransactions = [
        { ...transaction, date: new Date() },
        ...state.transactions.slice(0, STORAGE_LIMITS.MAX_TRANSACTIONS - 1)
      ];
      
      return {
        ...state,
        products: updatedProducts,
        transactions: newTransactions
      };
    }
    
    case 'ADD_WASTE_LOG': {
      const waste = action.payload;
      const product = state.products.find(p => p.id === waste.productId);
      
      if (!product) {
        throw new Error(`Produk "${waste.productId}" tidak ditemukan`);
      }
      
      if (product.stock < waste.quantity) {
        throw new Error(
          `Stock "${product.name}" tidak cukup untuk waste log (tersedia: ${product.stock}, dibutuhkan: ${waste.quantity})`
        );
      }
      
      // Update product - FIXED: wasteCount default 0 jika undefined
      const updatedProducts = state.products.map(p =>
        p.id === waste.productId
          ? { 
              ...p, 
              stock: p.stock - waste.quantity,
              wasteCount: (p.wasteCount || 0) + waste.quantity,
              wasteLoss: (p.wasteLoss || 0) + waste.costLoss
            }
          : p
      );
      
      // Update waste logs dengan limit
      const newWasteLogs = [
        { ...waste, date: new Date() },
        ...state.wasteLogs.slice(0, STORAGE_LIMITS.MAX_WASTE_LOGS - 1)
      ];
      
      return {
        ...state,
        products: updatedProducts,
        wasteLogs: newWasteLogs
      };
    }
    
    case 'ADD_CUSTOMER': {
      const customer = action.payload;
      if (state.customers.some(c => c.id === customer.id)) {
        throw new Error(`Pelanggan dengan ID ${customer.id} sudah ada`);
      }
      return {
        ...state,
        customers: [...state.customers, customer]
      };
    }
    
    case 'UPDATE_CUSTOMER': {
      const updatedCustomer = action.payload;
      return {
        ...state,
        customers: state.customers.map(c => 
          c.id === updatedCustomer.id ? updatedCustomer : c
        )
      };
    }
    
    case 'DELETE_CUSTOMER': {
      const id = action.payload;
      // Check if customer has transactions
      const hasTransactions = state.transactions.some(t => t.customerId === id);
      if (hasTransactions) {
        throw new Error('Pelanggan tidak dapat dihapus karena memiliki transaksi');
      }
      return {
        ...state,
        customers: state.customers.filter(c => c.id !== id)
      };
    }
    
    case 'UPDATE_SETTINGS': {
      return {
        ...state,
        settings: action.payload
      };
    }
    
    case 'ADD_CATEGORY': {
      const name = action.payload.trim();
      if (!name) {
        throw new Error('Nama kategori tidak boleh kosong');
      }
      if (state.categories.includes(name)) {
        throw new Error(`Kategori "${name}" sudah ada`);
      }
      return {
        ...state,
        categories: [...state.categories, name]
      };
    }
    
    case 'DELETE_CATEGORY': {
      const name = action.payload;
      // Check if category is in use
      const isInUse = state.products.some(p => p.category === name);
      if (isInUse) {
        throw new Error(`Kategori "${name}" masih digunakan oleh produk`);
      }
      return {
        ...state,
        categories: state.categories.filter(c => c !== name)
      };
    }
    
    case 'CLEAR_OLD_DATA': {
      // ⚠️ ACTION TANPA PAYLOAD - JANGAN akses action.payload
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Remove images from products
      const cleanedProducts = state.products.map(p => {
        const { image, ...rest } = p;
        return rest as Product;
      });
      
      // Filter old transactions
      const filteredTransactions = state.transactions.filter(
        t => new Date(t.date) > thirtyDaysAgo
      );
      
      // Filter old waste logs
      const filteredWasteLogs = state.wasteLogs.filter(
        w => new Date(w.date) > thirtyDaysAgo
      );
      
      return {
        ...state,
        products: cleanedProducts,
        transactions: filteredTransactions,
        wasteLogs: filteredWasteLogs
      };
    }

    case 'RESET_ALL_DATA': {
      // Reset ke data awal
      return {
        products: initialProducts,
        transactions: [],
        wasteLogs: [],
        customers: initialCustomers,
        settings: state.settings, // ✅ Settings tetap disimpan
        categories: ['Coffee', 'Tea', 'Pastry', 'Food', 'Merchandise']
      };
    }
        
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
      
    case 'SET_CUSTOMERS':
      return { ...state, customers: action.payload };
      
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };
      
    case 'SET_WASTE_LOGS':
      return { ...state, wasteLogs: action.payload };
      
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
      
    case 'RESTORE_BACKUP': {
      return {
        ...state,
        ...action.payload
      };
    }
    
    default:
      // Type safety check
      const _exhaustiveCheck: never = action;
      return state;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getCurrentLocalStorageSize = (): number => {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('coffee_pos_')) {
      total += (localStorage[key]?.length || 0) * 2;
    }
  }
  return total;
};

const cleanLargeImages = (data: Product[]): Product[] => {
  return data.map(item => {
    if (item.image && typeof item.image === 'string') {
      try {
        // More accurate Base64 size calculation
        const base64Length = item.image.length;
        const padding = item.image.endsWith('==') ? 2 : item.image.endsWith('=') ? 1 : 0;
        const imageSizeKB = Math.round((base64Length * 0.75 - padding) / 1024);
        
        if (imageSizeKB > STORAGE_LIMITS.MAX_IMAGE_SIZE_KB) {
          console.warn(`Removing large image: ${item.name || item.id} (${imageSizeKB}KB)`);
          const { image, ...rest } = item;
          return rest as Product;
        }
      } catch (e) {
        console.error('Error calculating image size:', e);
      }
    }
    return item;
  });
};

const parseTransactionDate = (data: any): Transaction => {
  if (!data.date) {
    throw new Error('Transaction missing date');
  }
  const date = new Date(data.date);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${data.date}`);
  }
  return {
    ...data,
    date
  };
};

const validateProductImage = (image?: string | null): boolean => {
  if (!image) return true;

  try {
    if (typeof image !== 'string') {
      return false;
    }

    // Validate Base64 format
    if (!image.startsWith('data:image/')) {
      return false;
    }

    // Calculate size more accurately
    const base64Length = image.length;
    const padding = image.endsWith('==') ? 2 : image.endsWith('=') ? 1 : 0;
    const imageSizeKB = Math.round((base64Length * 0.75 - padding) / 1024);
    
    if (imageSizeKB > STORAGE_LIMITS.MAX_IMAGE_SIZE_KB) {
      console.warn(`Image too large: ${imageSizeKB}KB (max: ${STORAGE_LIMITS.MAX_IMAGE_SIZE_KB}KB)`);
      return false;
    }
    
    return true;
  } catch (e) {
    console.error('Error validating image:', e);
    return false;
  }
};

// Enhanced schema validation with type guard
interface BackupData {
  version: string;
  products: any[];
  customers: any[];
  settings: any;
  categories: string[];
  transactions?: any[];
  wasteLogs?: any[];
  timestamp: string;
  totalRecords?: {
    products: number;
    customers: number;
    transactions: number;
    wasteLogs: number;
  };
}

const isValidBackupSchema = (data: any): data is BackupData => {
  try {
    return (
      data &&
      typeof data === 'object' &&
      data.version === '1.0' &&
      Array.isArray(data.products) &&
      Array.isArray(data.customers) &&
      typeof data.settings === 'object' &&
      Array.isArray(data.categories) &&
      typeof data.timestamp === 'string'
    );
  } catch {
    return false;
  }
};

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const AppContext = createContext<AppContextType | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ==========================================================================
  // INITIAL STATE
  // ==========================================================================
  const initialState: AppState = {
    products: (() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
        return saved ? cleanLargeImages(JSON.parse(saved)) : initialProducts;
      } catch (e) {
        console.error('Error loading products:', e);
        return initialProducts;
      }
    })(),
    
    customers: (() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
        return saved ? JSON.parse(saved) : initialCustomers;
      } catch (e) {
        console.error('Error loading customers:', e);
        return initialCustomers;
      }
    })(),
    
    categories: (() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
        return saved ? JSON.parse(saved) : ['Coffee', 'Tea', 'Pastry', 'Food', 'Merchandise'];
      } catch (e) {
        console.error('Error loading categories:', e);
        return ['Coffee', 'Tea', 'Pastry', 'Food', 'Merchandise'];
      }
    })(),
    
    settings: (() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        return saved ? JSON.parse(saved) : {
          storeName: 'Coffee Shop',
          address: 'Jl. Utama No. 123',
          taxRate: 11,
          currency: 'IDR',
          receiptFooter: 'Terima kasih telah berbelanja!'
        };
      } catch (e) {
        console.error('Error loading settings:', e);
        return {
          storeName: 'Coffee Shop',
          address: 'Jl. Utama No. 123',
          taxRate: 11,
          currency: 'IDR',
          receiptFooter: 'Terima kasih telah berbelanja!'
        };
      }
    })(),
    
    transactions: (() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        if (saved) {
          const parsed = JSON.parse(saved);
          return parsed.map(parseTransactionDate);
        }
        return mockTransactions.map(t => ({
          ...t,
          date: new Date(t.date)
        }));
      } catch (e) {
        console.error('Error loading transactions:', e);
        return mockTransactions.map(t => ({
          ...t,
          date: new Date(t.date)
        }));
      }
    })(),
    
    wasteLogs: (() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.WASTE_LOGS);
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        console.error('Error loading waste logs:', e);
        return [];
      }
    })()
  };

  // ==========================================================================
  // REDUCER & STATE MANAGEMENT
  // ==========================================================================
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  const {
    products,
    transactions,
    wasteLogs,
    customers,
    settings,
    categories
  } = state;

  // ==========================================================================
  // REFS & CACHE
  // ==========================================================================
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highPriorityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  let cachedStorageSize = 0;
  let lastStorageUpdate = 0;

  // ==========================================================================
  // STORAGE HELPERS
  // ==========================================================================
  const getCachedStorageSize = (): number => {
    const now = Date.now();
    if (now - lastStorageUpdate > STORAGE_CACHE_TTL) {
      cachedStorageSize = getCurrentLocalStorageSize();
      lastStorageUpdate = now;
    }
    return cachedStorageSize;
  };

  const handleStorageFull = (): void => {
    console.warn('Storage full - cleaning data...');
    
    try {
      // Clean product images first
      dispatch({ type: 'CLEAR_OLD_DATA' });
      
      alert('Penyimpanan penuh! Gambar produk dan data lama telah dihapus otomatis.');
    } catch (e) {
      console.error('Error handling storage full:', e);
      alert('Penyimpanan penuh. Silakan backup data dan restart aplikasi.');
    }
  };

  // ==========================================================================
  // SAVE FUNCTIONS
  // ==========================================================================
  const saveToStorage = useCallback((key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        handleStorageFull();
        // Retry once
        setTimeout(() => {
          try {
            localStorage.setItem(key, JSON.stringify(data));
          } catch (retryError) {
            console.error('Failed to save after cleanup:', retryError);
          }
        }, 100);
      } else {
        console.error(`Error saving to ${key}:`, e);
      }
    }
  }, []);

  const saveProducts = useCallback((productsToSave: Product[]) => {
    saveToStorage(STORAGE_KEYS.PRODUCTS, productsToSave);
  }, [saveToStorage]);

  const saveTransactions = useCallback((transactionsToSave: Transaction[]) => {
    const serializable = transactionsToSave.map(t => ({
      ...t,
      date: t.date.toISOString()
    }));
    saveToStorage(STORAGE_KEYS.TRANSACTIONS, serializable);
  }, [saveToStorage]);

  const saveWasteLogs = useCallback((wasteLogsToSave: WasteLog[]) => {
    saveToStorage(STORAGE_KEYS.WASTE_LOGS, wasteLogsToSave);
  }, [saveToStorage]);

  const saveCustomers = useCallback((customersToSave: Customer[]) => {
    saveToStorage(STORAGE_KEYS.CUSTOMERS, customersToSave);
  }, [saveToStorage]);

  const saveSettings = useCallback((settingsToSave: BusinessSettings) => {
    saveToStorage(STORAGE_KEYS.SETTINGS, settingsToSave);
  }, [saveToStorage]);

  const saveCategories = useCallback((categoriesToSave: string[]) => {
    saveToStorage(STORAGE_KEYS.CATEGORIES, categoriesToSave);
  }, [saveToStorage]);

  // ==========================================================================
  // DEBOUNCING FUNCTIONS
  // ==========================================================================
  const scheduleHighPrioritySave = useCallback((saveFn: () => void) => {
    if (highPriorityTimeoutRef.current) {
      clearTimeout(highPriorityTimeoutRef.current);
    }
    highPriorityTimeoutRef.current = setTimeout(() => {
      saveFn();
      highPriorityTimeoutRef.current = null;
    }, STORAGE_LIMITS.HIGH_PRIORITY_DEBOUNCE_MS);
  }, []);

  const scheduleSave = useCallback((saveFn: () => void) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveFn();
      saveTimeoutRef.current = null;
    }, STORAGE_LIMITS.DEBOUNCE_SAVE_MS);
  }, []);

  // ==========================================================================
  // AUTO-SAVE EFFECTS
  // ==========================================================================
  useEffect(() => {
    scheduleSave(() => saveProducts(products));
  }, [products, saveProducts, scheduleSave]);

  useEffect(() => {
    scheduleHighPrioritySave(() => saveTransactions(transactions));
  }, [transactions, saveTransactions, scheduleHighPrioritySave]);

  useEffect(() => {
    scheduleSave(() => saveWasteLogs(wasteLogs));
  }, [wasteLogs, saveWasteLogs, scheduleSave]);

  useEffect(() => {
    scheduleSave(() => saveCustomers(customers));
  }, [customers, saveCustomers, scheduleSave]);

  useEffect(() => {
    scheduleSave(() => saveSettings(settings));
  }, [settings, saveSettings, scheduleSave]);

  useEffect(() => {
    scheduleSave(() => saveCategories(categories));
  }, [categories, saveCategories, scheduleSave]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (highPriorityTimeoutRef.current) clearTimeout(highPriorityTimeoutRef.current);
    };
  }, []);

  // ==========================================================================
  // CONTEXT OPERATIONS
  // ==========================================================================
  const addProduct = useCallback((product: Product) => {
    if (!validateProductImage(product.image)) {
      throw new Error('Gambar tidak valid. Ukuran maksimal 300KB dan harus format Base64.');
    }
    dispatch({ type: 'ADD_PRODUCT', payload: product });
  }, []);

  const updateProduct = useCallback((product: Product) => {
    if (!validateProductImage(product.image)) {
      throw new Error('Gambar tidak valid. Ukuran maksimal 300KB dan harus format Base64.');
    }
    dispatch({ type: 'UPDATE_PRODUCT', payload: product });
  }, []);

  const deleteProduct = useCallback((id: string) => {
    dispatch({ type: 'DELETE_PRODUCT', payload: id });
  }, []);

  const addTransaction = useCallback((transaction: Transaction) => {
    dispatch({ type: 'ADD_TRANSACTION', payload: transaction });
  }, []);

  const addWasteLog = useCallback((waste: WasteLog) => {
    dispatch({ type: 'ADD_WASTE_LOG', payload: waste });
  }, []);

  const addCustomer = useCallback((customer: Customer) => {
    dispatch({ type: 'ADD_CUSTOMER', payload: customer });
  }, []);

  const updateCustomer = useCallback((customer: Customer) => {
    dispatch({ type: 'UPDATE_CUSTOMER', payload: customer });
  }, []);

  const deleteCustomer = useCallback((id: string) => {
    dispatch({ type: 'DELETE_CUSTOMER', payload: id });
  }, []);

  const updateSettings = useCallback((newSettings: BusinessSettings) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: newSettings });
  }, []);

  const addCategory = useCallback((name: string) => {
    dispatch({ type: 'ADD_CATEGORY', payload: name });
  }, []);

  const deleteCategory = useCallback((name: string) => {
    dispatch({ type: 'DELETE_CATEGORY', payload: name });
  }, []);

  const clearOldData = useCallback(() => {
    if (confirm('Apakah Anda yakin ingin membersihkan data lama? Gambar produk akan dihapus dan transaksi/waste logs lebih dari 30 hari akan dihapus.')) {
      dispatch({ type: 'CLEAR_OLD_DATA' }); // ✅ Tidak ada payload
      alert('Data lama telah dibersihkan.');
    }
  }, []);

  // ==========================================================================
  // STORAGE INFO
  // ==========================================================================
 // Tambahkan getStorageInfo untuk dashboard
const getStorageInfo = useCallback((): { used: number; total: number; percent: number } => {
  const total = 10 * 1024 * 1024; // 10MB limit
  let used = 0;
  
  try {
    // Hitung ukuran localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) || '';
        used += key.length + value.length;
      }
    }
  } catch (error) {
    console.error('Error calculating storage:', error);
  }
  
  return {
    used: Math.round(used / 1024), // Convert to KB
    total: Math.round(total / 1024),
    percent: Math.min(100, Math.round((used / total) * 1000) / 10)
  };
}, []);
  // ==========================================================================
  // BACKUP & RESTORE OPERATIONS
  // ==========================================================================
// Tambahkan function untuk export backup
const createBackup = useCallback((): boolean => {
  try {
    const backupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: {
        products,
        customers,
        transactions,
        wasteLogs,
        categories,
        settings
      },
      stats: {
        products: products.length,
        customers: customers.length,
        transactions: transactions.length,
        wasteLogs: wasteLogs.length
      }
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coffee-pos-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    return true;
  } catch (error) {
    console.error('Backup error:', error);
    return false;
  }
}, [products, customers, transactions, wasteLogs, categories, settings]);




  const restoreBackup = useCallback(async (file: File): Promise<{
    success: boolean;
    message: string;
    stats?: any;
  }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onloadstart = () => {
        console.log('Starting backup restore...');
      };
      
      reader.onload = (e) => {
        try {
          const result = e.target?.result;
          if (!result || typeof result !== 'string') {
            reject({ 
              success: false, 
              message: 'File tidak valid atau kosong' 
            });
            return;
          }
          
          const backupData = JSON.parse(result);
          
          // Validasi schema
          if (!isValidBackupSchema(backupData)) {
            reject({ 
              success: false, 
              message: 'Format backup tidak valid. Pastikan file dari aplikasi yang sama.' 
            });
            return;
          }
          
          // Deep validation
          const validationErrors: string[] = [];
          
          // Validasi produk
          backupData.products.forEach((p: any, i: number) => {
            if (!p.id || typeof p.id !== 'string') {
              validationErrors.push(`Produk #${i}: ID tidak valid`);
            }
            if (!p.name || typeof p.name !== 'string') {
              validationErrors.push(`Produk #${i}: Nama tidak valid`);
            }
            if (typeof p.price !== 'number' || p.price < 0) {
              validationErrors.push(`Produk #${i}: Harga tidak valid`);
            }
            if (typeof p.stock !== 'number' || p.stock < 0) {
              validationErrors.push(`Produk #${i}: Stock tidak valid`);
            }
          });
          
          // Validasi customers
          backupData.customers.forEach((c: any, i: number) => {
            if (!c.id || typeof c.id !== 'string') {
              validationErrors.push(`Pelanggan #${i}: ID tidak valid`);
            }
            if (!c.name || typeof c.name !== 'string') {
              validationErrors.push(`Pelanggan #${i}: Nama tidak valid`);
            }
          });
          
          if (validationErrors.length > 0) {
            reject({ 
              success: false, 
              message: `Data backup mengandung error:\n${validationErrors.slice(0, 5).join('\n')}${validationErrors.length > 5 ? `\n...dan ${validationErrors.length - 5} error lainnya` : ''}` 
            });
            return;
          }
          
          // Konfirmasi user
          if (!window.confirm(`Restore akan mengganti SEMUA data saat ini dengan data backup.

            Summary backup:
            • Produk: ${backupData.products.length}
            • Pelanggan: ${backupData.customers.length}
            • Transaksi: ${backupData.transactions?.length || 0}
            • Kategori: ${backupData.categories.length}
            • Dibuat: ${new Date(backupData.timestamp).toLocaleString()}

            Data saat ini akan hilang. Lanjutkan?`)) {
            reject({ 
              success: false, 
              message: 'Restore dibatalkan oleh pengguna' 
            });
            return;
          }
          
          // Process data
          const processedProducts = cleanLargeImages(backupData.products).map((p: any) => ({
            ...p,
            image: validateProductImage(p.image) ? p.image : undefined,
            isPromo: p.isPromo || false,
            isBestSeller: p.isBestSeller || false,
            salesCount: p.salesCount || 0,
            totalRevenue: p.totalRevenue || 0,
            totalProfit: p.totalProfit || 0,
            lastSold: p.lastSold || new Date().toISOString()
          }));
          
          const processedTransactions = (backupData.transactions || []).map((t: any) => 
            parseTransactionDate(t)
          );
          
          const processedWasteLogs = (backupData.wasteLogs || []).map((w: any) => ({
            ...w,
            date: new Date(w.date)
          }));
          
          // Dispatch restore action
          dispatch({
            type: 'RESTORE_BACKUP',
            payload: {
              products: processedProducts,
              customers: backupData.customers,
              settings: backupData.settings,
              categories: backupData.categories,
              transactions: processedTransactions,
              wasteLogs: processedWasteLogs
            }
          });
          
          resolve({
            success: true,
            message: 'Backup berhasil di-restore!',
            stats: {
              products: processedProducts.length,
              customers: backupData.customers.length,
              transactions: processedTransactions.length,
              wasteLogs: processedWasteLogs.length
            }
          });
          
        } catch (error) {
          console.error('Restore error:', error);
          reject({ 
            success: false, 
            message: `Error membaca backup: ${error instanceof Error ? error.message : 'Unknown error'}` 
          });
        }
      };
      
      reader.onerror = () => {
        reject({ 
          success: false, 
          message: 'Gagal membaca file. Pastikan file tidak corrupt.' 
        });
      };
      
      reader.readAsText(file);
    });
  }, []);

  // ==========================================================================
  // RESET ALL DATA FUNCTION
  // ==========================================================================
// MASALAH: Fungsi ini tidak meng-handle reset dengan baik
// MASALAH: Fungsi ini tidak meng-handle reset dengan baik
const resetAllData = useCallback(async (): Promise<boolean> => {
  // ... kode konfirmasi
  
  try {
    dispatch({ type: 'RESET_ALL_DATA' });
    
    // Simpan ke localStorage
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(initialProducts));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(initialCustomers));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.WASTE_LOGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(['Coffee', 'Tea', 'Pastry', 'Food', 'Merchandise']));
    
    console.log('Data reset completed');
    return true;
  } catch (error) {
    console.error('Reset error:', error);
    return false;
  }
}, []);



  // ==========================================================================
  // CONTEXT VALUE
  // ==========================================================================
  const value: AppContextType = {
    // State
    products,
    transactions,
    wasteLogs,
    customers,
    settings,
    categories,
    
    // Operations
    addProduct,
    updateProduct,
    deleteProduct,
    addTransaction,
    addWasteLog,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    updateSettings,
    addCategory,
    deleteCategory,
    clearOldData,
    getStorageInfo,
    createBackup,
    restoreBackup,
    resetAllData
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// ============================================================================
// CUSTOM HOOK
// ============================================================================

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};