/* eslint-disable react-refresh/only-export-components -- Provider + hook in one module */
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import type { Product, Transaction, WasteLog, Customer, BusinessSettings, CheckoutParams, CartItemWithInput } from '../types';
import { ApiError, appApi, normalizeAppStateWire, type AppStateWire } from '../services/appApi';
import { posApi } from '../services/posApi';
import { useAuth } from './AuthContext';

interface AppState {
  products: Product[];
  transactions: Transaction[];
  wasteLogs: WasteLog[];
  customers: Customer[];
  settings: BusinessSettings;
  categories: string[];
  categoriesWithId: { id: string; name: string }[];
}

interface AppContextType extends AppState {
  isServiceLoading: boolean;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addTransaction: (transaction: Transaction) => Promise<void>;
  checkout: (params: CheckoutParams) => Promise<Transaction>;
  addWasteLog: (waste: WasteLog) => Promise<void>;
  addCustomer: (customer: Customer) => Promise<void>;
  updateCustomer: (customer: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  updateSettings: (settings: BusinessSettings) => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  deleteCategory: (name: string) => Promise<void>;
  clearOldData: () => Promise<void>;
  getStorageInfo: () => { used: number; total: number; percent: number };
  createBackup: () => boolean;
  restoreBackup: (file: File) => Promise<{ success: boolean; message: string; stats?: any }>;
  resetAllData: () => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultSettings: BusinessSettings = {
  storeName: 'Coffee Shop',
  address: 'Jl. Utama No. 123',
  currency: 'IDR',
  currencyPosition: 'before',
  decimalPlaces: 0,
  thousandsSeparator: 'comma',
  receiptFooter: 'Terima kasih telah berbelanja!',
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const [state, setState] = useState<AppState>({
    products: [],
    transactions: [],
    wasteLogs: [],
    customers: [],
    settings: defaultSettings,
    categories: [],
    categoriesWithId: [],
  });
  const [isServiceLoading, setIsServiceLoading] = useState(false);

  const refreshState = useCallback(async () => {
    const next = await appApi.getAppState();
    setState(next);
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') return;

    let mounted = true;
    (async () => {
      try {
        setIsServiceLoading(true);
        const next = await appApi.getAppState();
        if (mounted) setState(next);
      } catch (e) {
        console.error('Failed to load state from backend:', e);
        const err = e as unknown;
        if (err instanceof ApiError) {
          // If 401, the appApi helper already handles redirect to /login
          if (err.status !== 401) {
            alert(`Gagal terhubung ke server (${err.status}): ${err.message}`);
          }
        } else if (err instanceof Error) {
          alert(`Gagal terhubung ke server: ${err.message}`);
        } else {
          alert('Gagal terhubung ke server.');
        }
      } finally {
        if (mounted) setIsServiceLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [status]);

  const addProduct = useCallback(async (product: Product) => {
    setIsServiceLoading(true);
    try {
      setState(await appApi.addProduct(product));
    } finally {
      setIsServiceLoading(false);
    }
  }, []);

  const updateProduct = useCallback(async (product: Product) => {
    setIsServiceLoading(true);
    try {
      setState(await appApi.updateProduct(product));
    } finally {
      setIsServiceLoading(false);
    }
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    setIsServiceLoading(true);
    try {
      setState(await appApi.deleteProduct(id));
    } finally {
      setIsServiceLoading(false);
    }
  }, []);

  const addTransaction = useCallback(async (_transaction: Transaction) => {
    // Transactions should be created via backend checkout endpoint.
    await refreshState();
  }, [refreshState]);

  const checkout = useCallback(async (params: CheckoutParams) => {
    setIsServiceLoading(true);
    try {
      const { transaction, appState } = await posApi.createTransaction({
        cart: params.cart.map((i: CartItemWithInput) => ({
          productId: i.productId,
          quantity: i.quantity,
          note: i.note,
          modifiers: i.modifiers,
          description: i.description,
          variantName: i.variantName,
          variantPrice: i.variantPrice,
          ...(i.productId.startsWith('manual-') ? { price: i.price } : {}),
        })),
        paymentMethod: params.paymentMethod,
        customerId: params.selectedCustomer,
        customerName: params.customCustomerName,
        orderType: params.orderType,
        tableNumber: params.tableNumber,
        cashReceived: params.cashReceived,
        orderNote: params.orderNote,
        notes: params.notes, // ✅ Include notes (order_description)
        applyTax: params.applyTax,
      });

      // Same normalization as GET /app/state (JSON dates → Date) so dashboard metrics stay correct
      setState(normalizeAppStateWire(appState as AppStateWire));
      return transaction;
    } finally {
      setIsServiceLoading(false);
    }
  }, [refreshState]);

  const addWasteLog = useCallback(async (waste: WasteLog) => {
    setIsServiceLoading(true);
    try {
      setState(await appApi.addWasteLog(waste));
    } finally {
      setIsServiceLoading(false);
    }
  }, []);

  const addCustomer = useCallback(async (customer: Customer) => {
    setIsServiceLoading(true);
    try {
      setState(await appApi.addCustomer(customer));
    } finally {
      setIsServiceLoading(false);
    }
  }, []);

  const updateCustomer = useCallback(async (customer: Customer) => {
    setIsServiceLoading(true);
    try {
      setState(await appApi.updateCustomer(customer));
    } finally {
      setIsServiceLoading(false);
    }
  }, []);

  const deleteCustomer = useCallback(async (id: string) => {
    setIsServiceLoading(true);
    try {
      setState(await appApi.deleteCustomer(id));
    } finally {
      setIsServiceLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (newSettings: BusinessSettings) => {
    setIsServiceLoading(true);
    try {
      setState(await appApi.updateSettings(newSettings));
    } finally {
      setIsServiceLoading(false);
    }
  }, []);

  const addCategory = useCallback(async (name: string) => {
    setIsServiceLoading(true);
    try {
      setState(await appApi.addCategory(name));
    } finally {
      setIsServiceLoading(false);
    }
  }, []);

  const deleteCategory = useCallback(async (name: string) => {
    setIsServiceLoading(true);
    try {
      setState(await appApi.deleteCategory(name));
    } finally {
      setIsServiceLoading(false);
    }
  }, []);

  const clearOldData = useCallback(async () => {
    setIsServiceLoading(true);
    try {
      setState(await appApi.clearOldData());
    } finally {
      setIsServiceLoading(false);
    }
  }, []);

  const resetAllData = useCallback(async (): Promise<boolean> => {
    setIsServiceLoading(true);
    try {
      setState(await appApi.resetAllData());
      return true;
    } catch (e) {
      console.error('Reset error:', e);
      return false;
    } finally {
      setIsServiceLoading(false);
    }
  }, []);

  const getStorageInfo = useCallback(() => ({ used: 0, total: 0, percent: 0 }), []);

  const createBackup = useCallback((): boolean => {
    try {
      const blob = new Blob([JSON.stringify({ version: '2.0', timestamp: new Date().toISOString(), data: state }, null, 2)], {
        type: 'application/json',
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
    } catch (e) {
      console.error('Backup error:', e);
      return false;
    }
  }, [state]);

  const restoreBackup = useCallback(async (_file: File) => {
    return { success: false, message: 'Restore is not supported in backend mode. Implement a backend restore endpoint.' };
  }, []);

  const value = useMemo<AppContextType>(
    () => ({
      ...state,
      isServiceLoading,
      addProduct,
      updateProduct,
      deleteProduct,
      addTransaction,
      checkout,
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
      resetAllData,
    }),
    [
      state,
      isServiceLoading,
      addProduct,
      updateProduct,
      deleteProduct,
      addTransaction,
      checkout,
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
      resetAllData,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}