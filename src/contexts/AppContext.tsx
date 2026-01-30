import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Product, Transaction, WasteLog, Customer } from '../types';
import { products as initialProducts, customers as initialCustomers } from '../data/mockData';

export interface BusinessSettings {
  storeName: string;
  address: string;
  taxRate: number;
}

interface AppContextType {
  products: Product[];
  transactions: Transaction[];
  wasteLogs: WasteLog[];
  customers: Customer[];
  settings: BusinessSettings;
  categories: string[];
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
  createBackup: () => void;
  restoreBackup: (file: File) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper function untuk menghitung ukuran localStorage
const getCurrentLocalStorageSize = (): number => {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      total += localStorage[key].length * 2; // UTF-16 encoding
    }
  }
  return total;
};

// Helper function untuk membersihkan gambar besar
const cleanLargeImages = (data: any[]): any[] => {
  return data.map(item => {
    if (item.image) {
      const imageSize = Math.round((item.image.length * 3) / 4 / 1024); // Approx KB
      
      // Jika gambar > 100KB, kompres lebih lanjut atau hapus
      if (imageSize > 100) {
        console.log(`Cleaning large image: ${imageSize}KB from ${item.name || item.id}`);
        
        // Gambar terlalu besar, hapus untuk hemat storage
        if (imageSize > 300) {
          const { image, ...rest } = item;
          return { ...rest, hasLargeImage: true };
        }
      }
    }
    return item;
  });
};

// Estimasi quota storage dengan promise
const getStorageEstimate = async () => {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage ?? 0;
      const quota = estimate.quota ?? 10 * 1024 * 1024;
      return {
        used: usage,
        quota,
        percent: quota ? (usage / quota) * 100 : 0
      };
    }
  } catch (e) {
    console.error('Error getting storage estimate:', e);
  }
  
  // Fallback untuk localStorage
  return {
    used: 0,
    quota: 10 * 1024 * 1024, // 10MB
    percent: 0
  };
};

// Helper function untuk memantau penggunaan storage
const getStorageInfo = (): { used: number; total: number; percent: number } => {
  let used = 0;
  let total = 10 * 1024 * 1024; // 10MB default
  
  try {
    // Hitung penggunaan saat ini
    used = getCurrentLocalStorageSize();
    
    // Coba dapatkan quota storage
    getStorageEstimate().then(estimate => {
      total = estimate.quota;
    }).catch(() => {
      // Tetap gunakan default
    });
  } catch (e) {
    console.error('Error getting storage info:', e);
  }
  
  const percent = total > 0 ? (used / total) * 100 : 0;
  
  return {
    used: Math.round(used / 1024), // dalam KB
    total: Math.round(total / 1024), // dalam KB
    percent: Math.round(percent * 10) / 10
  };
};

// Helper untuk menangani storage penuh
const handleStorageFull = () => {
  console.error('Storage penuh! Membersihkan data...');
  
  // Hapus semua gambar dari produk
  const products = JSON.parse(localStorage.getItem('coffee_pos_products') || '[]');
  const cleanedProducts = products.map((p: any) => {
    const { image, ...rest } = p;
    return rest;
  });
  
  try {
    localStorage.setItem('coffee_pos_products', JSON.stringify(cleanedProducts));
  } catch (e) {
    // Jika masih penuh, hapus transaksi lama
    localStorage.removeItem('coffee_pos_transactions');
    localStorage.removeItem('coffee_pos_waste_logs');
  }
  
  alert('Penyimpanan penuh! Beberapa gambar dan data lama telah dihapus otomatis.');
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('coffee_pos_products');
      return saved ? JSON.parse(saved) : initialProducts;
    } catch (e) {
      console.error('Error loading products:', e);
      return initialProducts;
    }
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem('coffee_pos_customers');
      return saved ? JSON.parse(saved) : initialCustomers;
    } catch (e) {
      console.error('Error loading customers:', e);
      return initialCustomers;
    }
  });

  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('coffee_pos_categories');
      return saved ? JSON.parse(saved) : ['Coffee', 'Tea', 'Pastry', 'Food', 'Merchandise'];
    } catch (e) {
      console.error('Error loading categories:', e);
      return ['Coffee', 'Tea', 'Pastry', 'Food', 'Merchandise'];
    }
  });

  const [settings, setSettings] = useState<BusinessSettings>(() => {
    try {
      const saved = localStorage.getItem('coffee_pos_settings');
      return saved ? JSON.parse(saved) : { storeName: 'Coffee Shop', address: 'Jl. Utama No. 123', taxRate: 11 };
    } catch (e) {
      console.error('Error loading settings:', e);
      return { storeName: 'Coffee Shop', address: 'Jl. Utama No. 123', taxRate: 11 };
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('coffee_pos_transactions');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error loading transactions:', e);
      return [];
    }
  });

  const [wasteLogs, setWasteLogs] = useState<WasteLog[]>(() => {
    try {
      const saved = localStorage.getItem('coffee_pos_waste_logs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error loading waste logs:', e);
      return [];
    }
  });

  // Fungsi untuk membersihkan gambar besar secara otomatis
  const cleanLargeImagesAutomatically = useCallback((productsList: Product[]): Product[] => {
    const cleanedProducts = cleanLargeImages(productsList);
    const removedCount = productsList.length - cleanedProducts.filter(p => !('hasLargeImage' in p)).length;
    
    if (removedCount > 0) {
      console.log(`Removed ${removedCount} large images automatically`);
    }
    
    return cleanedProducts;
  }, []);

  // Fungsi untuk membersihkan data lama
  const clearOldData = useCallback(() => {
    try {
      // Hapus semua gambar dari produk untuk menghemat space
      setProducts(prev => {
        const cleaned = prev.map(p => ({
          ...p,
          image: undefined
        })) as Product[];
        localStorage.setItem('coffee_pos_products', JSON.stringify(cleaned));
        return cleaned;
      });
      
      // Hapus transaksi > 30 hari
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      setTransactions(prev => {
        const filtered = prev.filter(t => new Date(t.date) > thirtyDaysAgo);
        localStorage.setItem('coffee_pos_transactions', JSON.stringify(filtered));
        return filtered;
      });
      
      // Hapus waste logs > 30 hari
      setWasteLogs(prev => {
        const filtered = prev.filter(w => new Date(w.date) > thirtyDaysAgo);
        localStorage.setItem('coffee_pos_waste_logs', JSON.stringify(filtered));
        return filtered;
      });
      
      alert('Data lama dan gambar telah dibersihkan untuk menghemat penyimpanan.');
    } catch (e) {
      console.error('Error clearing data:', e);
      alert('Gagal membersihkan data lama.');
    }
  }, []);

  // Optimasi penyimpanan untuk 10MB
  useEffect(() => {
    const optimizeStorage = async () => {
      try {
        // Cek storage quota
        const estimate = await getStorageEstimate();
        const localStorageUsed = getCurrentLocalStorageSize();
        
        console.log(`Storage: ${Math.round(localStorageUsed / 1024)}KB used, Quota: ${Math.round(estimate.quota / 1024)}KB`);
        
        // Jika penggunaan > 70% dari quota
        if (localStorageUsed > estimate.quota * 0.7) {
          console.warn('Storage >70% full, optimizing...');
          
          // 1. Bersihkan gambar besar
          setProducts(prev => {
            const cleaned = cleanLargeImagesAutomatically(prev);
            localStorage.setItem('coffee_pos_products', JSON.stringify(cleaned));
            return cleaned;
          });
          
          // 2. Hapus transaksi lama (simpan hanya 500 terbaru)
          setTransactions(prev => {
            const limited = prev.slice(0, 500);
            localStorage.setItem('coffee_pos_transactions', JSON.stringify(limited));
            return limited;
          });
          
          // 3. Hapus waste logs lama (simpan hanya 300 terbaru)
          setWasteLogs(prev => {
            const limited = prev.slice(0, 300);
            localStorage.setItem('coffee_pos_waste_logs', JSON.stringify(limited));
            return limited;
          });
        }
        
        // Simpan data dengan batch processing untuk menghindari blocking
        const saveBatch = () => {
          try {
            localStorage.setItem('coffee_pos_products', JSON.stringify(products));
            localStorage.setItem('coffee_pos_customers', JSON.stringify(customers));
            localStorage.setItem('coffee_pos_settings', JSON.stringify(settings));
            localStorage.setItem('coffee_pos_categories', JSON.stringify(categories));
            localStorage.setItem('coffee_pos_transactions', JSON.stringify(transactions));
            localStorage.setItem('coffee_pos_waste_logs', JSON.stringify(wasteLogs));
          } catch (e) {
            if (e instanceof DOMException && e.name === 'QuotaExceededError') {
              handleStorageFull();
            }
          }
        };
        
        // Gunakan requestIdleCallback jika tersedia untuk non-blocking save
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(() => saveBatch(), { timeout: 1000 });
        } else {
          setTimeout(saveBatch, 0);
        }
        
      } catch (e) {
        console.error('Storage optimization error:', e);
      }
    };
    
    // Debounce optimization untuk menghindari terlalu sering save
    const timeoutId = setTimeout(optimizeStorage, 1000);
    return () => clearTimeout(timeoutId);
  }, [products, customers, settings, categories, transactions, wasteLogs, cleanLargeImagesAutomatically]);

  const addProduct = (product: Product) => {
    // Validasi ukuran gambar (max 300KB setelah kompresi)
    if (product.image) {
      const imageSizeKB = Math.round((product.image.length * 3) / 4 / 1024);
      if (imageSizeKB > 300) {
        alert(`Gambar masih terlalu besar (${imageSizeKB}KB) setelah kompresi. Maksimal 300KB.`);
        return;
      }
    }
    
    setProducts(prev => {
      const newProducts = [...prev, product];
      // Auto-clean jika ada gambar besar
      return cleanLargeImagesAutomatically(newProducts);
    });
  };
  
  const updateProduct = (updated: Product) => {
    // Validasi ukuran gambar
    if (updated.image) {
      const imageSizeKB = Math.round((updated.image.length * 3) / 4 / 1024);
      if (imageSizeKB > 300) {
        alert(`Gambar masih terlalu besar (${imageSizeKB}KB) setelah kompresi. Maksimal 300KB.`);
        return;
      }
    }
    
    setProducts(prev => {
      const updatedProducts = prev.map(p => p.id === updated.id ? updated : p);
      return cleanLargeImagesAutomatically(updatedProducts);
    });
  };
  
  const deleteProduct = (id: string) => setProducts(prev => prev.filter(p => p.id !== id));
  
  const addCustomer = (customer: Customer) => setCustomers(prev => [...prev, customer]);
  const updateCustomer = (updated: Customer) => setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
  const deleteCustomer = (id: string) => setCustomers(prev => prev.filter(c => c.id !== id));

  const addCategory = (name: string) => {
    if (!categories.includes(name)) setCategories(prev => [...prev, name]);
  };
  
  const deleteCategory = (name: string) => setCategories(prev => prev.filter(c => c !== name));

  const updateSettings = (newSettings: BusinessSettings) => setSettings(newSettings);

  const addTransaction = (transaction: Transaction) => {
    setTransactions(prev => {
      const newTransactions = [transaction, ...prev.slice(0, 999)]; // Batasi 1000 transaksi
      localStorage.setItem('coffee_pos_transactions', JSON.stringify(newTransactions));
      return newTransactions;
    });
    
    // Update stock produk
    transaction.items.forEach(item => {
      setProducts(prev => prev.map(p => p.id === item.productId ? { ...p, stock: p.stock - item.quantity } : p));
    });
  };

  const addWasteLog = (waste: WasteLog) => {
    setWasteLogs(prev => {
      const newWasteLogs = [waste, ...prev.slice(0, 299)]; // Batasi 300 waste logs
      localStorage.setItem('coffee_pos_waste_logs', JSON.stringify(newWasteLogs));
      return newWasteLogs;
    });
    
    // Update stock produk
    setProducts(prev => prev.map(p => p.id === waste.productId ? { ...p, stock: p.stock - waste.quantity } : p));
  };

  // Fungsi untuk membuat backup
  const createBackup = () => {
    try {
      const backupData = {
        products,
        customers,
        settings,
        categories,
        transactions,
        wasteLogs,
        timestamp: new Date().toISOString(),
        version: '1.0',
        totalSize: getCurrentLocalStorageSize()
      };
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `coffee-pos-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Backup error:', error);
      alert('Error membuat backup');
      return false;
    }
  };

  // Fungsi untuk restore backup
  const restoreBackup = async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const backupData = JSON.parse(e.target?.result as string);
          
          // Validasi struktur backup
          if (!backupData.products || !backupData.customers) {
            reject(new Error('Format backup tidak valid'));
            return;
          }
          
          if (confirm('Restore akan mengganti semua data saat ini. Lanjutkan?')) {
            // Simpan data ke localStorage
            localStorage.setItem('coffee_pos_products', JSON.stringify(backupData.products));
            localStorage.setItem('coffee_pos_customers', JSON.stringify(backupData.customers));
            localStorage.setItem('coffee_pos_settings', JSON.stringify(backupData.settings || {}));
            localStorage.setItem('coffee_pos_categories', JSON.stringify(backupData.categories || []));
            localStorage.setItem('coffee_pos_transactions', JSON.stringify(backupData.transactions || []));
            localStorage.setItem('coffee_pos_waste_logs', JSON.stringify(backupData.wasteLogs || []));
            
            // Update state
            setProducts(backupData.products);
            setCustomers(backupData.customers);
            setSettings(backupData.settings || { storeName: 'Coffee Shop', address: 'Jl. Utama No. 123', taxRate: 11 });
            setCategories(backupData.categories || ['Coffee', 'Tea', 'Pastry', 'Food', 'Merchandise']);
            setTransactions(backupData.transactions || []);
            setWasteLogs(backupData.wasteLogs || []);
            
            alert('Backup berhasil di-restore!');
            resolve();
          } else {
            reject(new Error('Restore dibatalkan'));
          }
        } catch (error) {
          reject(new Error('Error membaca file backup'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error membaca file'));
      };
      
      reader.readAsText(file);
    });
  };

  const value: AppContextType = {
    products,
    transactions,
    wasteLogs,
    customers,
    settings,
    categories,
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
    restoreBackup
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};